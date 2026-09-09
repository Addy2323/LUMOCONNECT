import { DisputeStatus, DisputeType, type Prisma } from '@prisma/client'

export type Tx = Prisma.TransactionClient

export interface RaiseClaimDisputeParams {
  claimId: string
  raisedByUserId: string
  reason: string
  disputeType?: DisputeType
  evidenceFileIds?: string[]
}

export interface ResolveClaimDisputeParams {
  disputeId: string
  claimId: string
  resolverUserId: string
  decision: 'UPHELD' | 'DISMISSED'
  resolutionNotes: string
}

/**
 * Freezes a claim and its associated rewards during the dispute window.
 * The claim and reward reservations are NEVER deleted; they are marked as disputed
 * and held in place until an administrative resolution is reached.
 */
export async function raiseClaimDispute(client: Tx, params: RaiseClaimDisputeParams) {
  const { claimId, raisedByUserId, reason, disputeType = DisputeType.REWARD_DISPUTE, evidenceFileIds } = params

  const claim = await client.hotDealClaim.findUnique({
    where: { id: claimId },
    include: {
      participation: true,
      deal: true,
    },
  })

  if (!claim) {
    throw new Error('HOT_DEAL_CLAIM_NOT_FOUND')
  }

  if (claim.disputed) {
    throw new Error('CLAIM_ALREADY_DISPUTED')
  }

  // Verify dispute window is still open
  if (claim.disputeUntil && new Date() > claim.disputeUntil) {
    throw new Error('DISPUTE_WINDOW_EXPIRED')
  }

  // 1. Mark claim as disputed (freezing downstream payouts)
  const updatedClaim = await client.hotDealClaim.update({
    where: { id: claimId },
    data: {
      disputed: true,
    },
  })

  // 2. Open official dispute record
  const dispute = await client.dispute.create({
    data: {
      participationId: claim.participationId,
      openedById: raisedByUserId,
      disputeType,
      status: DisputeStatus.OPENED,
      title: `Dispute on Deal: ${claim.deal.teaserTitle || claim.deal.id}`,
      description: reason,
      dueAt: new Date(Date.now() + 72 * 3600 * 1000), // 72-hour review SLA
    },
  })

  // 3. Attach evidence if provided
  if (evidenceFileIds && evidenceFileIds.length > 0) {
    for (const fileId of evidenceFileIds) {
      await client.disputeEvidence.create({
        data: {
          disputeId: dispute.id,
          fileAssetId: fileId,
          label: 'Initial dispute evidence provided by claimant',
        },
      })
    }
  }

  // 4. Create initial system audit message
  await client.disputeMessage.create({
    data: {
      disputeId: dispute.id,
      senderId: raisedByUserId,
      content: `Dispute opened. Claim ID ${claimId} reward held pending resolution. Reason: ${reason}`,
    },
  })

  return {
    success: true,
    claim: updatedClaim,
    dispute,
  }
}

/**
 * Resolves a claim dispute via dual-control Maker-Checker arbitrator.
 * The arbitrator cannot be the user who opened the dispute.
 */
export async function resolveClaimDispute(client: Tx, params: ResolveClaimDisputeParams) {
  const { disputeId, claimId, resolverUserId, decision, resolutionNotes } = params

  const dispute = await client.dispute.findUnique({
    where: { id: disputeId },
  })

  if (!dispute) {
    throw new Error('DISPUTE_NOT_FOUND')
  }

  if (dispute.status === DisputeStatus.CLOSED || 
      dispute.status === DisputeStatus.RESOLVED_PARTNER_FAVOR || 
      dispute.status === DisputeStatus.RESOLVED_BUSINESS_FAVOR) {
    throw new Error('DISPUTE_ALREADY_RESOLVED')
  }

  // Dual-control check: Resolver must not be the one who opened it
  if (dispute.openedById === resolverUserId) {
    throw new Error('RESOLVER_CANNOT_BE_DISPUTE_OPENER')
  }

  const claim = await client.hotDealClaim.findUnique({
    where: { id: claimId },
  })

  if (!claim) {
    throw new Error('HOT_DEAL_CLAIM_NOT_FOUND')
  }

  const finalStatus = decision === 'UPHELD' 
    ? DisputeStatus.RESOLVED_BUSINESS_FAVOR 
    : DisputeStatus.RESOLVED_PARTNER_FAVOR

  // Update dispute
  const updatedDispute = await client.dispute.update({
    where: { id: disputeId },
    data: {
      status: finalStatus,
      resolutionNotes,
    },
  })

  // Log resolution message
  await client.disputeMessage.create({
    data: {
      disputeId,
      senderId: resolverUserId,
      content: `Dispute resolved [${decision}]. Notes: ${resolutionNotes}`,
    },
  })

  // If dismissed, unfreeze claim so payout processing can continue
  let updatedClaim = claim
  if (decision === 'DISMISSED') {
    updatedClaim = await client.hotDealClaim.update({
      where: { id: claimId },
      data: {
        disputed: false,
      },
    })
  }

  return {
    success: true,
    dispute: updatedDispute,
    claim: updatedClaim,
  }
}
