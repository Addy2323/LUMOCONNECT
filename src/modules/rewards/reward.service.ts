import type { Prisma, RewardStatus } from '@prisma/client'
import { postRewardJournalEntry } from './reward-ledger.service'
import { bindConversionAttribution } from '@/modules/referrals/attribution.service'
import { commitVerifiedCapacity } from '@/modules/deals/deal-capacity.service'

export type Tx = Prisma.TransactionClient

export class RewardLifecycleError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message)
    this.name = 'RewardLifecycleError'
  }
}

export interface ValidateOutcomeInput {
  dealId: string
  claimId: string
  validatorUserId: string
  paymentReference: string
  valueMinor: bigint
  evidenceFileIds: string[]
  signedAgreementConfirmed: boolean
  reason: string
  disputeWindowHours?: number
}

export interface ApproveRewardInput {
  dealId: string
  claimId: string
  approverUserId: string
  taxWithheldMinor: bigint
  platformFeeMinor: bigint
  reason: string
}

/**
 * Step 1: Validate Outcome (Maker)
 * Records objective PSP/bank references and evidence, creating a VALIDATING conversion & reward.
 */
export async function validateCommercialOutcome(
  tx: Tx,
  input: ValidateOutcomeInput
) {
  const {
    dealId,
    claimId,
    validatorUserId,
    paymentReference,
    valueMinor,
    evidenceFileIds,
    signedAgreementConfirmed,
    reason,
    disputeWindowHours = 72,
  } = input

  // Lock deal row
  await tx.$queryRaw`SELECT id FROM hot_deals WHERE id = ${dealId}::uuid FOR UPDATE`

  const deal = await tx.hotDeal.findUniqueOrThrow({
    where: { id: dealId },
  })

  const claim = await tx.hotDealClaim.findUniqueOrThrow({
    where: { id: claimId },
    include: {
      participation: {
        include: {
          acceptedVersion: {
            include: { rewardRules: true },
          },
        },
      },
    },
  })

  if (claim.dealId !== dealId) {
    throw new RewardLifecycleError('Referral claim does not belong to this deal.', 404)
  }

  // Idempotency: single conversion per claim
  if (claim.conversionId) {
    return { conversionId: claim.conversionId, alreadyValidated: true }
  }

  if (claim.disputed) {
    throw new RewardLifecycleError('Claim is currently frozen under active dispute.', 409)
  }

  // Self-validation prevention
  if (claim.participation.partnerUserId === validatorUserId) {
    throw new RewardLifecycleError('Partner cannot validate their own referral.', 403)
  }

  // Require signed agreement for real estate / rental categories
  if (deal.category.toLowerCase().includes('rental') && !signedAgreementConfirmed) {
    throw new RewardLifecycleError('A signed tenant agreement is mandatory for residential/rental rewards.', 400)
  }

  // Validate reward rule exists on accepted agreement version
  const rewardRule = claim.participation.acceptedVersion.rewardRules.find(
    (r) => r.amountMinor === deal.rewardPerVerifiedOutcome && r.currency === 'TZS'
  )
  if (!rewardRule) {
    throw new RewardLifecycleError('Accepted terms version does not contain a matching reward rule for this deal.', 409)
  }

  // Calculate dispute window
  const disputeUntil = new Date(Date.now() + disputeWindowHours * 3600000)

  // Create Conversion with status VALIDATING (idempotent externalReference)
  const conversion = await tx.conversion.create({
    data: {
      participationId: claim.participationId,
      opportunityId: deal.opportunityId,
      idempotencyKey: `hot-deal:${dealId}:${paymentReference}`,
      externalReference: paymentReference,
      valueMinor,
      status: 'VALIDATING',
      evidence: {
        create: evidenceFileIds.map((fileAssetId) => ({
          fileAssetId,
          evidenceType: 'RECEIPT',
          notes: reason,
        })),
      },
      rewards: {
        create: {
          rewardRuleId: rewardRule.id,
          partnerUserId: claim.participation.partnerUserId,
          grossAmountMinor: deal.rewardPerVerifiedOutcome,
          netAmountMinor: deal.rewardPerVerifiedOutcome,
          status: 'VALIDATING',
        },
      },
    },
  })

  // Bind conversion attribution
  await bindConversionAttribution(tx, claimId, conversion.id, disputeUntil)

  // Mark lead as CONVERTED
  await tx.lead.update({
    where: { id: claim.leadId },
    data: {
      convertedConversionId: conversion.id,
      validationStatus: 'CONVERTED',
    },
  })

  // Commit capacity
  await commitVerifiedCapacity(tx, dealId, 1)

  // Audit log
  await tx.auditLog.create({
    data: {
      actorUserId: validatorUserId,
      entityType: 'HotDealClaim',
      entityId: claimId,
      action: 'hot_deal.outcome_validated',
      afterData: {
        conversionId: conversion.id,
        paymentReference,
        disputeUntil: disputeUntil.toISOString(),
      },
    },
  })

  return { conversionId: conversion.id, alreadyValidated: false }
}

/**
 * Step 2: Approve Reward (Checker)
 * Secondary administrator approves the reward after dispute window passes.
 * Posts double-entry balanced ledger entry and transitions status to PAYABLE.
 */
export async function approveCommercialReward(
  tx: Tx,
  input: ApproveRewardInput
): Promise<{ rewardId: string; status: RewardStatus }> {
  const {
    dealId,
    claimId,
    approverUserId,
    taxWithheldMinor,
    platformFeeMinor,
    reason,
  } = input

  await tx.$queryRaw`SELECT id FROM hot_deals WHERE id = ${dealId}::uuid FOR UPDATE`

  const claim = await tx.hotDealClaim.findUniqueOrThrow({
    where: { id: claimId },
    include: {
      conversion: {
        include: {
          rewards: true,
        },
      },
    },
  })

  if (!claim.conversion) {
    throw new RewardLifecycleError('Validated conversion not found for this claim.', 404)
  }

  if (claim.disputed) {
    throw new RewardLifecycleError('Cannot approve reward with an active dispute.', 409)
  }

  if (!claim.disputeUntil || claim.disputeUntil > new Date()) {
    throw new RewardLifecycleError('The mandatory dispute window has not elapsed yet.', 409)
  }

  // Maker-Checker segregation: Maker who validated cannot be the Checker who approves
  if (claim.fraudReviewedBy === approverUserId) {
    throw new RewardLifecycleError('Maker-Checker violation: A second independent administrator must approve this reward.', 403)
  }

  const reward = claim.conversion.rewards[0]
  if (!reward) {
    throw new RewardLifecycleError('Reward record not found on conversion.', 404)
  }

  // Partner cannot approve own reward
  if (reward.partnerUserId === approverUserId) {
    throw new RewardLifecycleError('Partner cannot approve their own reward payout.', 403)
  }

  if (['PAYABLE', 'PAID'].includes(reward.status)) {
    return { rewardId: reward.id, status: reward.status }
  }

  if (reward.status !== 'VALIDATING') {
    throw new RewardLifecycleError(`Reward must be in VALIDATING status to be approved. Current: ${reward.status}`, 409)
  }

  const netAmountMinor = reward.grossAmountMinor - taxWithheldMinor - platformFeeMinor
  if (netAmountMinor <= 0n) {
    throw new RewardLifecycleError('Statutory tax and platform fee deductions exceed gross reward.', 400)
  }

  // Update reward to APPROVED
  await tx.reward.update({
    where: { id: reward.id },
    data: {
      status: 'APPROVED',
      approvedBy: approverUserId,
      approvedAt: new Date(),
      taxWithheldMinor,
      platformFeeMinor,
      netAmountMinor,
    },
  })

  // Post balanced accounting entry to double-entry ledger
  await postRewardJournalEntry(tx, {
    rewardId: reward.id,
    grossAmountMinor: reward.grossAmountMinor,
    netAmountMinor,
    taxWithheldMinor,
    platformFeeMinor,
    narration: `Commercial deal reward approval: ${reason}`,
  })

  // Transition to PAYABLE
  await tx.reward.update({
    where: { id: reward.id },
    data: { status: 'PAYABLE' },
  })

  await tx.conversion.update({
    where: { id: claim.conversion.id },
    data: { status: 'PAYABLE' },
  })

  // Audit log
  await tx.auditLog.create({
    data: {
      actorUserId: approverUserId,
      entityType: 'Reward',
      entityId: reward.id,
      action: 'reward.approved_and_payable',
      afterData: {
        grossAmountMinor: reward.grossAmountMinor.toString(),
        netAmountMinor: netAmountMinor.toString(),
        taxWithheldMinor: taxWithheldMinor.toString(),
        platformFeeMinor: platformFeeMinor.toString(),
        status: 'PAYABLE',
      },
    },
  })

  // Notify partner
  await tx.notification.create({
    data: {
      userId: reward.partnerUserId,
      title: 'Reward Payable',
      body: `Your reward of TZS ${new Intl.NumberFormat('en-TZ').format(Number(netAmountMinor) / 100)} is now approved and payable.`,
      linkUrl: '/hot-deals/history',
    },
  })

  return { rewardId: reward.id, status: 'PAYABLE' }
}
