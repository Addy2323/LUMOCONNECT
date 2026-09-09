import type { Prisma } from '@prisma/client'

export type Tx = Prisma.TransactionClient

export class PayoutError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message)
    this.name = 'PayoutError'
  }
}

export interface CreatePayoutInstructionParams {
  dealId: string
  claimId: string
  financeAdminUserId: string
  payoutMethodId: string
}

/**
 * Creates an authorized payout instruction for a PAYABLE reward.
 * Strictly enforces 24-hour security hold on changed payout methods,
 * recipient account name matching, and finance admin segregation.
 */
export async function createPayoutInstruction(
  tx: Tx,
  params: CreatePayoutInstructionParams
): Promise<{ payoutId: string; status: string }> {
  const { dealId, claimId, financeAdminUserId, payoutMethodId } = params

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

  const reward = claim.conversion?.rewards[0]
  if (!reward || reward.status !== 'PAYABLE') {
    throw new PayoutError('An undisputed PAYABLE reward is required to instruct payout.', 409)
  }

  if (claim.disputed) {
    throw new PayoutError('Cannot instruct payout on a disputed claim.', 409)
  }

  // Idempotency: single payout instruction per reward
  const existingPayout = await tx.payout.findUnique({
    where: { idempotencyKey: `hot-deal-reward:${reward.id}` },
  })
  if (existingPayout) {
    return { payoutId: existingPayout.id, status: existingPayout.status }
  }

  // Segregation of duties: finance admin cannot be recipient or the approver
  if (financeAdminUserId === reward.partnerUserId) {
    throw new PayoutError('Partner cannot authorize their own payout instruction.', 403)
  }
  if (financeAdminUserId === reward.approvedBy) {
    throw new PayoutError('Maker-Checker violation: A separate finance administrator must authorize the payout instruction.', 403)
  }

  // Validate payout method
  const payoutMethod = await tx.payoutMethod.findUniqueOrThrow({
    where: { id: payoutMethodId },
    include: { user: true },
  })

  if (payoutMethod.userId !== reward.partnerUserId) {
    throw new PayoutError('Payout method does not belong to the recipient partner.', 403)
  }

  if (!payoutMethod.isVerified) {
    throw new PayoutError('Payout destination is not verified.', 400)
  }

  if (payoutMethod.currency !== 'TZS') {
    throw new PayoutError('Payout destination currency must be TZS.', 400)
  }

  // 24-hour security hold on newly added or modified payout methods
  const holdCutoff = new Date(Date.now() - 86400000)
  if (payoutMethod.createdAt > holdCutoff || payoutMethod.updatedAt > holdCutoff) {
    throw new PayoutError(
      'Security Hold: Payout methods recently created or modified within 24 hours cannot receive disbursements.',
      409
    )
  }

  // Account name verification
  const normalizedAccountName = payoutMethod.accountName.trim().toLowerCase()
  const normalizedUserName = payoutMethod.user.name.trim().toLowerCase()
  if (normalizedAccountName !== normalizedUserName) {
    throw new PayoutError('Payout account holder name does not match the verified partner account name.', 400)
  }

  // Create Payout record
  const payout = await tx.payout.create({
    data: {
      partnerUserId: reward.partnerUserId,
      payoutMethodId,
      grossAmountMinor: reward.grossAmountMinor,
      taxWithheldMinor: reward.taxWithheldMinor,
      platformFeeMinor: reward.platformFeeMinor,
      netAmountMinor: reward.netAmountMinor,
      status: 'AUTHORIZED',
      authorizedBy: financeAdminUserId,
      authorizedAt: new Date(),
      idempotencyKey: `hot-deal-reward:${reward.id}`,
      items: {
        create: {
          rewardId: reward.id,
          allocatedAmountMinor: reward.netAmountMinor,
        },
      },
    },
  })

  // Emit durable outbox event for payment rail dispatcher
  await tx.outboxEvent.create({
    data: {
      eventType: 'HOT_DEAL_PAYOUT_INSTRUCTION',
      aggregateType: 'Payout',
      aggregateId: payout.id,
      payload: {
        payoutId: payout.id,
        rewardId: reward.id,
        dealId,
        amountMinor: payout.netAmountMinor.toString(),
        currency: 'TZS',
        idempotencyKey: payout.idempotencyKey,
      },
    },
  })

  // Audit log
  await tx.auditLog.create({
    data: {
      actorUserId: financeAdminUserId,
      entityType: 'Payout',
      entityId: payout.id,
      action: 'payout.instruction_created',
      afterData: {
        rewardId: reward.id,
        amountMinor: payout.netAmountMinor.toString(),
        status: 'AUTHORIZED',
      },
    },
  })

  return { payoutId: payout.id, status: 'AUTHORIZED' }
}
