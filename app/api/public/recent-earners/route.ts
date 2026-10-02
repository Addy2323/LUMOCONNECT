import { db } from '@/lib/db'
import { earningsConfigSchema, maskEarner, type PublicEarning } from '@/lib/public-earnings'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const configData = await db.publicEarningsConfig.findUnique({ where: { id: 'global' } })
    const config = earningsConfigSchema.parse(configData ?? {})

    if (!config.enabled) {
      return Response.json(
        { items: [], config },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
    }

    const modeStatuses = config.mode === 'PAID' ? ['PAID'] : ['APPROVED', 'PAYABLE', 'PAID']

    // Query authoritative paid/approved reward records
    const rewards = await db.reward.findMany({
      where: {
        status: { in: modeStatuses as any },
        showInPublicEarningsFeed: true,
        approvedAt: { not: null },
        netAmountMinor: { gt: 0n },
        partnerUser: {
          deletedAt: null,
          accountStatus: 'ACTIVE',
          partnerProfile: {
            is: {
              publicEarningsOptOut: false,
            },
          },
        },
        conversion: {
          status: { in: ['APPROVED', 'PAYABLE', 'PAID'] },
        },
      },
      orderBy: [{ approvedAt: 'desc' }, { id: 'desc' }],
      take: config.maximumCards,
      select: {
        id: true,
        netAmountMinor: true,
        currency: true,
        status: true,
        approvedAt: true,
        partnerUser: {
          select: {
            name: true,
            phone: true,
            partnerProfile: {
              select: {
                handle: true,
              },
            },
          },
        },
        conversion: {
          select: {
            opportunity: {
              select: {
                title: true,
                opportunityType: true,
                marketScope: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    const items: PublicEarning[] = rewards.map((reward) => {
      const opp = reward.conversion?.opportunity
      const categoryName = opp?.category?.name || opp?.opportunityType || 'Commercial Deal'
      const dealTitle = opp?.title || 'Verified Opportunity'
      const dealType: 'LOCAL' | 'INTERNATIONAL' =
        opp?.marketScope === 'INTERNATIONAL' ? 'INTERNATIONAL' : 'LOCAL'

      const identityInput =
        reward.partnerUser.partnerProfile?.handle ||
        reward.partnerUser.name ||
        reward.partnerUser.phone

      return {
        id: reward.id,
        maskedIdentity: maskEarner(identityInput, config.maskDigits),
        amount: Number(reward.netAmountMinor) / 100,
        currency: reward.currency || 'TZS',
        category: categoryName,
        dealTitle,
        dealType,
        status: reward.status,
        earnedAt: (reward.approvedAt || new Date()).toISOString(),
      }
    })

    return Response.json(
      { items, config },
      { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
    )
  } catch (error) {
    console.error('Failed to load recent earnings:', error)
    return Response.json(
      { items: [], error: 'Recent earnings feed temporarily unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
