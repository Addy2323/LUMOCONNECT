import type { Prisma } from '@prisma/client'

export type Tx = Prisma.TransactionClient

export class FundingVerificationError extends Error {
  constructor(message: string, public statusCode = 409) {
    super(message)
    this.name = 'FundingVerificationError'
  }
}

/**
 * Validates that an opportunity's reward budget has been fully pre-funded
 * via confirmed licensed payment rails before it can be published.
 */
export async function verifyPreFunding(
  tx: Tx,
  dealId: string,
  paymentAttemptId: string
): Promise<{ fundingId: string; amountMinor: bigint }> {
  const deal = await tx.hotDeal.findUniqueOrThrow({
    where: { id: dealId },
    include: {
      opportunity: {
        include: {
          organization: true,
        },
      },
    },
  })

  const payment = await tx.paymentAttempt.findUnique({
    where: { id: paymentAttemptId },
  })

  if (!payment) {
    throw new FundingVerificationError('Payment attempt record not found.')
  }

  if (payment.status !== 'SUCCESSFUL') {
    throw new FundingVerificationError(`Reward pre-funding payment must be SUCCESSFUL. Current status: ${payment.status}`)
  }

  if (payment.purpose !== 'REWARD_FUNDING') {
    throw new FundingVerificationError(`Payment purpose must be REWARD_FUNDING. Found: ${payment.purpose}`)
  }

  if (payment.currency !== 'TZS') {
    throw new FundingVerificationError(`Payment currency must be TZS. Found: ${payment.currency}`)
  }

  // Reject mock or manual providers in production
  const provider = payment.provider.toUpperCase()
  if (['MOCK', 'MANUAL'].includes(provider)) {
    throw new FundingVerificationError('Reward pre-funding must be settled through verified licensed payment rails (e.g., M-Pesa, Tigo Pesa, Bank Rail).')
  }

  if (!payment.providerReference) {
    throw new FundingVerificationError('Payment attempt lacks an authoritative payment provider transaction reference.')
  }

  if (payment.amountMinor < deal.rewardBudget) {
    throw new FundingVerificationError(
      `Pre-funded amount (${payment.amountMinor}) is less than the required deal reward budget (${deal.rewardBudget}).`
    )
  }

  // Verify payer belongs to the merchant organization
  const payerMember = await tx.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: deal.opportunity.organizationId,
        userId: payment.userId,
      },
    },
  })

  if (!payerMember || payerMember.status !== 'ACTIVE') {
    throw new FundingVerificationError('Pre-funding payment must originate from an active member of the publishing merchant organization.')
  }

  const funding = await tx.hotDealFunding.create({
    data: {
      dealId,
      paymentAttemptId: payment.id,
      amountMinor: deal.rewardBudget,
    },
  })

  return {
    fundingId: funding.id,
    amountMinor: funding.amountMinor,
  }
}
