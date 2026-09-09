import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { actor, failure, json } from '@/modules/hot-deals/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await actor(request)
    return json({ claims: await db.hotDealClaim.findMany({ where: { participation: { partnerUserId: user.id } }, select: {
      id: true, dealId: true, createdAt: true, disputed: true, disputeUntil: true,
      deal: { select: { teaserTitle: true, status: true } }, lead: { select: { validationStatus: true } },
      conversion: { select: { status: true, rewards: { select: { status: true, grossAmountMinor: true, taxWithheldMinor: true, platformFeeMinor: true, netAmountMinor: true } } } },
    }, orderBy: { createdAt: 'desc' }, take: 100 }) })
  } catch (error) { return failure(error) }
}
