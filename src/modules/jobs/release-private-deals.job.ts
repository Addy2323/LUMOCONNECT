import { db } from '@/lib/db'
import { executePartnerRelease } from '../deals/deal-release.service'

export interface ReleaseJobResult {
  evaluated: number
  released: number
  scheduledActivated: number
  errors: string[]
}

/**
 * Scheduled job to transition private hot deals to partner release or activate scheduled private deals.
 * Deterministically driven by server-side timestamps.
 */
export async function runReleasePrivateDealsJob(now = new Date()): Promise<ReleaseJobResult> {
  const result: ReleaseJobResult = {
    evaluated: 0,
    released: 0,
    scheduledActivated: 0,
    errors: [],
  }

  // 1. Activate deals whose SCHEDULED_PRIVATE_RELEASE start time has arrived
  const scheduledDeals = await db.hotDeal.findMany({
    where: {
      status: 'SCHEDULED_PRIVATE_RELEASE',
      privateAccessStartAt: { lte: now },
    },
    take: 100,
  })

  for (const deal of scheduledDeals) {
    result.evaluated++
    try {
      await db.hotDeal.update({
        where: { id: deal.id },
        data: {
          status: 'PRIVATE_HOT_DEAL',
          version: { increment: 1 },
        },
      })
      result.scheduledActivated++
    } catch (err: any) {
      result.errors.push(`Failed to activate scheduled deal ${deal.id}: ${err.message}`)
    }
  }

  // 2. Transition PRIVATE_HOT_DEAL to PARTNER_RELEASE when partnerReleaseAt <= now
  const dueDeals = await db.hotDeal.findMany({
    where: {
      status: 'PRIVATE_HOT_DEAL',
      partnerReleaseAt: { lte: now },
    },
    take: 100,
  })

  for (const deal of dueDeals) {
    result.evaluated++
    try {
      const outcome = await db.$transaction(async (tx) => {
        return executePartnerRelease(tx, deal.id, now)
      })
      if (outcome.transitioned) {
        result.released++
      }
    } catch (err: any) {
      result.errors.push(`Failed to release deal ${deal.id}: ${err.message}`)
    }
  }

  return result
}
