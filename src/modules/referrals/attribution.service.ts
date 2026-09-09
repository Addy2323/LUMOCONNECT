import type { Prisma } from '@prisma/client'

export type Tx = Prisma.TransactionClient

export class AttributionError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message)
    this.name = 'AttributionError'
  }
}

export interface AttributionRecord {
  claimId: string
  leadId: string
  participationId: string
  partnerUserId: string
  customerHash: string
  conversionId: string | null
  disputed: boolean
  createdAt: Date
}

/**
 * Resolves the immutable attribution record for a customer referral on a deal.
 */
export async function getReferralAttribution(
  tx: Tx,
  claimId: string
): Promise<AttributionRecord> {
  const claim = await tx.hotDealClaim.findUniqueOrThrow({
    where: { id: claimId },
    include: {
      participation: true,
    },
  })

  return {
    claimId: claim.id,
    leadId: claim.leadId,
    participationId: claim.participationId,
    partnerUserId: claim.participation.partnerUserId,
    customerHash: claim.customerHash,
    conversionId: claim.conversionId,
    disputed: claim.disputed,
    createdAt: claim.createdAt,
  }
}

/**
 * Validates that attribution is intact and binds a completed conversion to the original claim.
 * Attribution is append-only and cannot be reassigned except through an audited dispute.
 */
export async function bindConversionAttribution(
  tx: Tx,
  claimId: string,
  conversionId: string,
  disputeUntilDate: Date
): Promise<void> {
  const claim = await tx.hotDealClaim.findUniqueOrThrow({
    where: { id: claimId },
  })

  if (claim.conversionId && claim.conversionId !== conversionId) {
    throw new AttributionError(
      'This referral claim is already bound to an existing conversion. Re-attribution is prohibited.',
      409
    )
  }

  if (claim.disputed) {
    throw new AttributionError(
      'Cannot bind conversion to a claim with an active dispute hold.',
      409
    )
  }

  await tx.hotDealClaim.update({
    where: { id: claimId },
    data: {
      conversionId,
      disputeUntil: disputeUntilDate,
    },
  })
}
