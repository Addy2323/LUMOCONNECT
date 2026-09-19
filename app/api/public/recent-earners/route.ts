import { db } from '@/lib/db'
import { earningsConfigSchema, maskEarner } from '@/lib/public-earnings'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = earningsConfigSchema.parse(await db.publicEarningsConfig.findUnique({ where: { id: 'global' } }) ?? {})
    if (!config.enabled) return Response.json({ items: [], config }, { headers: { 'Cache-Control': 'no-store' } })
    const rewards = await db.reward.findMany({
      where: {
        status: { in: config.mode === 'PAID' ? ['PAID'] : ['APPROVED', 'PAYABLE', 'PAID'] },
        approvedAt: { not: null },
        netAmountMinor: { gt: 0n, gte: BigInt(config.minimumTZS) * 100n },
        currency: 'TZS',
        partnerUser: { deletedAt: null, accountStatus: 'ACTIVE', partnerProfile: { is: { publicEarningsOptOut: false } } },
        conversion: { status: { in: ['APPROVED', 'PAYABLE', 'PAID'] } },
      },
      orderBy: [{ approvedAt: 'desc' }, { id: 'desc' }],
      take: config.maximumCards,
      select: { id: true, netAmountMinor: true, currency: true, approvedAt: true, partnerUser: { select: { phone: true } } },
    })
    const items = rewards.map(reward => ({
      id: reward.id,
      maskedIdentity: maskEarner(reward.partnerUser.phone, config.maskDigits),
      amount: Number(reward.netAmountMinor) / 100,
      currency: reward.currency,
      category: 'Business Opportunity',
      earnedAt: reward.approvedAt!.toISOString(),
    }))
    return Response.json({ items, config }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ items: [], error: 'Recent earnings unavailable' }, { status: 503 })
  }
}
