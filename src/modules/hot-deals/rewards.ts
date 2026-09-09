import { z } from 'zod'
import { db } from '@/lib/db'
import type { Actor } from './auth'
import { requireAdmin } from './auth'
import { audit, lockDeal, transaction } from './service'
import { DealAccessError } from './policy'

export const rewardApprovalSchema = z.object({ claimId: z.string().uuid(), taxWithheldMinor: z.string().regex(/^\d{1,15}$/).transform(BigInt), platformFeeMinor: z.string().regex(/^\d{1,15}$/).transform(BigInt), reason: z.string().min(10).max(1000) })
export async function approveReward(id: string, user: Actor, input: z.infer<typeof rewardApprovalSchema>) {
  requireAdmin(user)
  return transaction(async tx => {
    await lockDeal(tx, id)
    const claim = await tx.hotDealClaim.findUnique({ where: { id: input.claimId }, include: { conversion: { include: { rewards: true } } } })
    if (!claim || claim.dealId !== id || !claim.conversion) throw new DealAccessError('Validated reward not found.', 404)
    if (claim.disputed || !claim.disputeUntil || claim.disputeUntil > new Date()) throw new DealAccessError('The dispute period must finish with no open dispute.', 409)
    if (claim.fraudReviewedBy === user.id) throw new DealAccessError('A second administrator must approve this reward.')
    const reward = claim.conversion.rewards[0]
    if (!reward) throw new DealAccessError('Reward not found.', 404)
    if (reward.partnerUserId === user.id) throw new DealAccessError('You cannot approve your own reward.')
    if (['PAYABLE', 'PAID'].includes(reward.status)) return { rewardId: reward.id, status: reward.status }
    if (reward.status !== 'VALIDATING') throw new DealAccessError('Reward is not awaiting approval.', 409)
    const net = reward.grossAmountMinor - input.taxWithheldMinor - input.platformFeeMinor
    if (net <= 0n) throw new DealAccessError('Deductions must be below the gross reward.', 400)
    await tx.reward.update({ where: { id: reward.id }, data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), taxWithheldMinor: input.taxWithheldMinor, platformFeeMinor: input.platformFeeMinor, netAmountMinor: net } })
    await audit(tx, id, user, 'hot_deal.reward_approved', { status: reward.status }, { status: 'APPROVED', rewardId: reward.id, reason: input.reason, taxWithheldMinor: input.taxWithheldMinor.toString(), platformFeeMinor: input.platformFeeMinor.toString() })
    await tx.reward.update({ where: { id: reward.id }, data: { status: 'PAYABLE' } })
    await tx.conversion.update({ where: { id: claim.conversion.id }, data: { status: 'PAYABLE' } })
    // Balanced accounting in existing ledger tables. These record liabilities, not custody of money.
    const accounts = await Promise.all([
      ['HD_REWARD_EXPENSE', 'Verified commercial rewards'], ['HD_PARTNER_PAYABLE', 'Partner rewards payable'],
      ['HD_TAX_PAYABLE', 'Reward withholding payable'], ['HD_FEE_REVENUE', 'Reward service fees'],
    ].map(([accountCode, name]) => tx.ledgerAccount.upsert({ where: { accountCode }, update: {}, create: { accountCode, name, ownerType: 'PLATFORM' } })))
    await tx.journalEntry.create({ data: { sourceType: 'HOT_DEAL_REWARD', sourceId: reward.id, narration: input.reason, lines: { create: [
      { ledgerAccountId: accounts[0].id, debitMinor: reward.grossAmountMinor },
      { ledgerAccountId: accounts[1].id, creditMinor: net },
      { ledgerAccountId: accounts[2].id, creditMinor: input.taxWithheldMinor },
      { ledgerAccountId: accounts[3].id, creditMinor: input.platformFeeMinor },
    ] } } })
    await audit(tx, id, user, 'hot_deal.reward_payable', { status: 'APPROVED' }, { status: 'PAYABLE', rewardId: reward.id })
    await tx.notification.create({ data: { userId: reward.partnerUserId, title: 'Reward approved', body: 'Your verified reward is payable. See your statement for deductions.', linkUrl: '/hot-deals/history' } })
    return { rewardId: reward.id, status: 'PAYABLE' }
  })
}

export async function createPayoutInstruction(id: string, user: Actor, claimId: string, payoutMethodId: string) {
  requireAdmin(user)
  return transaction(async tx => {
    await lockDeal(tx, id)
    const claim = await tx.hotDealClaim.findUnique({ where: { id: claimId }, include: { conversion: { include: { rewards: true } } } })
    const reward = claim?.conversion?.rewards[0]
    if (!claim || claim.dealId !== id || !reward || reward.status !== 'PAYABLE' || claim.disputed) throw new DealAccessError('An undisputed payable reward is required.', 409)
    const existing = await tx.payout.findUnique({ where: { idempotencyKey: `hot-deal-reward:${reward.id}` } })
    if (existing) return { payoutId: existing.id, status: existing.status }
    const method = await tx.payoutMethod.findUnique({ where: { id: payoutMethodId }, include: { user: true } })
    if (!method || method.userId !== reward.partnerUserId || !method.isVerified || method.currency !== 'TZS'
      || method.createdAt > new Date(Date.now() - 86400000) || method.updatedAt > new Date(Date.now() - 86400000)
      || method.accountName.trim().toLowerCase() !== method.user.name.trim().toLowerCase()) throw new DealAccessError('A verified matching payout method outside the 24-hour change hold is required.', 409)
    if (user.id === reward.partnerUserId || user.id === reward.approvedBy) throw new DealAccessError('A separate finance administrator must instruct payout.')
    const payout = await tx.payout.create({ data: { partnerUserId: reward.partnerUserId, payoutMethodId, grossAmountMinor: reward.grossAmountMinor, taxWithheldMinor: reward.taxWithheldMinor, platformFeeMinor: reward.platformFeeMinor, netAmountMinor: reward.netAmountMinor, status: 'AUTHORIZED', authorizedBy: user.id, authorizedAt: new Date(), idempotencyKey: `hot-deal-reward:${reward.id}`, items: { create: { rewardId: reward.id, allocatedAmountMinor: reward.netAmountMinor } } } })
    await tx.outboxEvent.create({ data: { eventType: 'HOT_DEAL_PAYOUT_INSTRUCTION', aggregateType: 'Payout', aggregateId: payout.id, payload: { payoutId: payout.id, rewardId: reward.id, dealId: id, amountMinor: payout.netAmountMinor.toString(), currency: 'TZS', idempotencyKey: payout.idempotencyKey } } })
    await audit(tx, id, user, 'hot_deal.payout_instructed', {}, { payoutId: payout.id, rewardId: reward.id, amountMinor: payout.netAmountMinor.toString() })
    return { payoutId: payout.id, status: payout.status }
  })
}

// Called only by an authenticated payment-partner webhook; amount/reference mismatches fail closed.
export async function confirmPayout(input: { payoutId: string; providerReference: string; amountMinor: string; status: 'PAID' | 'FAILED' }) {
  const record = await db.outboxEvent.findFirst({ where: { aggregateId: input.payoutId, eventType: 'HOT_DEAL_PAYOUT_INSTRUCTION' } })
  const payload = record?.payload as { dealId?: string } | undefined
  if (!payload?.dealId) throw new DealAccessError('Payout instruction not found.', 404)
  return transaction(async tx => {
    await lockDeal(tx, payload.dealId!)
    const payout = await tx.payout.findUniqueOrThrow({ where: { id: input.payoutId }, include: { items: { include: { reward: { include: { conversion: { include: { hotDealClaim: true } } } } } } } })
    if (payout.netAmountMinor.toString() !== input.amountMinor) throw new DealAccessError('Payout amount mismatch.', 409)
    if (payout.status === 'PAID') {
      if (payout.providerReference !== input.providerReference) throw new DealAccessError('Payout reference mismatch.', 409)
      return { status: 'PAID' }
    }
    if (!['AUTHORIZED', 'PROCESSING'].includes(payout.status)) throw new DealAccessError('Payout is not awaiting confirmation.', 409)
    if (payout.items.some(i => i.reward.conversion.hotDealClaim?.disputed)) throw new DealAccessError('Payout is disputed; reconciliation is required.', 409)
    await tx.payout.update({ where: { id: payout.id }, data: { status: input.status, providerReference: input.providerReference } })
    if (input.status === 'PAID') {
      for (const item of payout.items) {
        await tx.reward.update({ where: { id: item.rewardId }, data: { status: 'PAID' } })
        await tx.conversion.update({ where: { id: item.reward.conversionId }, data: { status: 'PAID' } })
      }
      const payable = await tx.ledgerAccount.findUniqueOrThrow({ where: { accountCode: 'HD_PARTNER_PAYABLE' } })
      const settlement = await tx.ledgerAccount.upsert({ where: { accountCode: 'HD_PSP_SETTLEMENT' }, update: {}, create: { accountCode: 'HD_PSP_SETTLEMENT', name: 'Licensed payment partner settlement', ownerType: 'PLATFORM' } })
      await tx.journalEntry.create({ data: { sourceType: 'HOT_DEAL_PAYOUT', sourceId: payout.id, narration: input.providerReference, lines: { create: [{ ledgerAccountId: payable.id, debitMinor: payout.netAmountMinor }, { ledgerAccountId: settlement.id, creditMinor: payout.netAmountMinor }] } } })
      await tx.notification.create({ data: { userId: payout.partnerUserId, title: 'Reward paid', body: 'The payment partner confirmed your payout.', linkUrl: '/hot-deals/history' } })
    }
    await audit(tx, payload.dealId!, null, 'hot_deal.payout_outcome', { status: payout.status }, input)
    await tx.outboxEvent.update({ where: { id: record!.id }, data: { processedAt: new Date() } })
    return { status: input.status }
  })
}
