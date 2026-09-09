import { db } from '@/lib/db'

export interface RewardValidationJobResult {
  checked: number
  readyForApproval: number
  disputedSkipped: number
  errors: string[]
}

/**
 * Scheduled job to check hot deal claims after the 72-hour dispute window has elapsed.
 * Claims that pass the dispute window without contest are queued and alerted for
 * secondary Checker approval (Maker-Checker segregation).
 */
export async function runRewardValidationJob(now = new Date()): Promise<RewardValidationJobResult> {
  const result: RewardValidationJobResult = {
    checked: 0,
    readyForApproval: 0,
    disputedSkipped: 0,
    errors: [],
  }

  // Find claims where dispute window has passed and not disputed
  const eligibleClaims = await db.hotDealClaim.findMany({
    where: {
      disputeUntil: { lte: now },
      conversionId: { not: null },
    },
    include: {
      conversion: {
        include: {
          rewards: true,
        },
      },
      deal: true,
    },
    take: 100,
  })

  result.checked = eligibleClaims.length

  for (const claim of eligibleClaims) {
    if (claim.disputed) {
      result.disputedSkipped++
      continue
    }

    const reward = claim.conversion?.rewards[0]
    if (!reward || reward.status !== 'VALIDATING') {
      continue
    }

    try {
      // Check if event already emitted
      const eventKey = `REWARD_READY:${claim.id}:${reward.id}`
      const existing = await db.outboxEvent.findFirst({
        where: {
          aggregateType: 'HotDealClaim',
          aggregateId: claim.id,
          eventType: 'REWARD_READY_FOR_APPROVAL',
        },
      })

      if (!existing) {
        await db.outboxEvent.create({
          data: {
            eventType: 'REWARD_READY_FOR_APPROVAL',
            aggregateType: 'HotDealClaim',
            aggregateId: claim.id,
            payload: {
              idempotencyKey: eventKey,
              claimId: claim.id,
              rewardId: reward.id,
              dealId: claim.dealId,
              partnerUserId: reward.partnerUserId,
              grossAmountMinor: reward.grossAmountMinor.toString(),
              makerValidatorId: claim.fraudReviewedBy,
              disputeUntil: claim.disputeUntil?.toISOString(),
            },
          },
        })
      }

      result.readyForApproval++
    } catch (err: any) {
      result.errors.push(`Failed to queue claim ${claim.id}: ${err.message}`)
    }
  }

  return result
}
