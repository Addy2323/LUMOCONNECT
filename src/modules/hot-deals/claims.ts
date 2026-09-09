import { z } from 'zod'
import type { Actor } from './auth'
import { requireAdmin } from './auth'
import { audit, customerHash, eligible, enqueue, lockDeal, refreshRelease, transaction, transition } from './service'
import { DealAccessError, hasCapacity } from './policy'

export const leadSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().transform(v => v.replace(/[\s()-]/g, '').replace(/^0/, '+255')).pipe(z.string().regex(/^\+255[67]\d{8}$/)),
  consent: z.literal(true),
})
export async function registerLead(id: string, user: Actor, input: z.infer<typeof leadSchema>) {
  return transaction(async tx => {
    const deal = await refreshRelease(tx, await lockDeal(tx, id), new Date())
    const { participation } = await eligible(tx, deal, user.id, new Date())
    if (!participation || !deal.opportunity.publishedVersionId || !await tx.participationAgreementAcceptance.findUnique({ where: { participationId_versionId: { participationId: participation.id, versionId: deal.opportunity.publishedVersionId } } })) throw new DealAccessError('Accept current terms and activate this deal first.')
    if (user.phone?.replace(/^0/, '+255') === input.customerPhone) throw new DealAccessError('Self-referrals are not eligible.', 409)
    const hash = customerHash(input.customerPhone)
    const existing = await tx.hotDealClaim.findUnique({ where: { dealId_customerHash: { dealId: id, customerHash: hash } } })
    if (existing) {
      if (existing.participationId !== participation.id) throw new DealAccessError('This customer already has a registered referral.', 409)
      return { id: existing.id, leadId: existing.leadId }
    }
    const lead = await tx.lead.create({ data: { participationId: participation.id, customerName: input.customerName, customerPhone: input.customerPhone, metadata: { consentAt: new Date().toISOString() } } })
    const claim = await tx.hotDealClaim.create({ data: { dealId: id, participationId: participation.id, customerHash: hash, leadId: lead.id } })
    await audit(tx, id, user, 'hot_deal.lead_registered', {}, { leadId: lead.id, claimId: claim.id, participationId: participation.id })
    await tx.notification.create({ data: { userId: user.id, title: 'New lead received', body: 'Your referral has been registered for validation.', linkUrl: `/hot-deals/${id}` } })
    return { id: claim.id, leadId: lead.id }
  })
}

export const validationSchema = z.object({
  claimId: z.string().uuid(), paymentReference: z.string().trim().min(4).max(200),
  evidenceFileIds: z.array(z.string().uuid()).min(1).max(10),
  valueMinor: z.string().regex(/^[1-9]\d{0,14}$/).transform(BigInt),
  fraudChecks: z.object({ duplicateCustomer: z.literal(true), selfReferral: z.literal(true), devicesAndPatterns: z.literal(true), collusion: z.literal(true), documents: z.literal(true), merchantConfirmed: z.literal(true) }),
  signedAgreementConfirmed: z.boolean(), paymentConfirmed: z.literal(true), reason: z.string().min(10).max(1000),
})
// Admin validation records objective PSP/bank references, evidence and fraud checks. It never sends money.
export async function validateOutcome(id: string, user: Actor, input: z.infer<typeof validationSchema>) {
  requireAdmin(user)
  return transaction(async tx => {
    const deal = await refreshRelease(tx, await lockDeal(tx, id), new Date())
    const claim = await tx.hotDealClaim.findUnique({ where: { id: input.claimId }, include: { participation: { include: { acceptedVersion: { include: { rewardRules: true } } } } } })
    if (!claim || claim.dealId !== id) throw new DealAccessError('Referral not found.', 404)
    if (claim.conversionId) return { conversionId: claim.conversionId }
    if (claim.disputed || !['PRIVATE_HOT_DEAL', 'PARTNER_RELEASE'].includes(deal.status) || !hasCapacity(deal)) throw new DealAccessError('The deal cannot allocate this reward.', 409)
    if (claim.participation.partnerUserId === user.id) throw new DealAccessError('You cannot validate your own referral.')
    if (deal.category.toLowerCase().includes('rental') && !input.signedAgreementConfirmed) throw new DealAccessError('A signed tenancy agreement is required.', 400)
    const files = await tx.fileAsset.count({ where: { id: { in: input.evidenceFileIds }, isPublic: false, uploaderId: { in: [user.id, claim.participation.partnerUserId] } } })
    if (files !== new Set(input.evidenceFileIds).size) throw new DealAccessError('Private objective evidence is required.', 400)
    const rule = claim.participation.acceptedVersion.rewardRules.find(r => r.amountMinor === deal.rewardPerVerifiedOutcome && r.currency === 'TZS')
    if (!rule) throw new DealAccessError('Accepted reward rule does not match this deal.', 409)
    const conversion = await tx.conversion.create({ data: {
      participationId: claim.participationId, opportunityId: deal.opportunityId,
      idempotencyKey: `hot-deal:${id}:${input.paymentReference}`, externalReference: input.paymentReference,
      valueMinor: input.valueMinor, status: 'VALIDATING', evidence: { create: input.evidenceFileIds.map(fileAssetId => ({ fileAssetId, evidenceType: 'RECEIPT' as const, notes: input.reason })) },
      rewards: { create: { rewardRuleId: rule.id, partnerUserId: claim.participation.partnerUserId, grossAmountMinor: deal.rewardPerVerifiedOutcome, netAmountMinor: deal.rewardPerVerifiedOutcome, status: 'VALIDATING' } },
    } })
    await tx.lead.update({ where: { id: claim.leadId }, data: { convertedConversionId: conversion.id, validationStatus: 'CONVERTED' } })
    await tx.hotDealClaim.update({ where: { id: claim.id }, data: { conversionId: conversion.id, fraudReviewedBy: user.id, fraudReviewedAt: new Date(), evidenceFileIds: input.evidenceFileIds, disputeUntil: new Date(Date.now() + deal.disputeWindowHours * 3600000) } })
    const updated = await tx.hotDeal.update({ where: { id }, data: {
      inventoryAvailable: deal.dealCapacityType === 'UNLIMITED' ? undefined : { decrement: 1 },
      rewardRemaining: { decrement: deal.rewardPerVerifiedOutcome }, version: { increment: 1 },
    } })
    if (!hasCapacity(updated)) { await transition(tx, updated, 'FULL', user, 'Verified outcome exhausted inventory or reward capacity'); await enqueue(tx, updated, 'FULL', 'PARTICIPANTS') }
    await audit(tx, id, user, 'hot_deal.outcome_validated', {}, { claimId: claim.id, conversionId: conversion.id, evidenceFileIds: input.evidenceFileIds, paymentReference: input.paymentReference, fraudChecks: input.fraudChecks, reason: input.reason })
    await tx.notification.create({ data: { userId: claim.participation.partnerUserId, title: 'Conversion under validation', body: 'Evidence reviewed. Your reward is held through the dispute period.', linkUrl: '/hot-deals/account' } })
    return { conversionId: conversion.id }
  })
}

export async function disputeClaim(id: string, user: Actor, claimId: string, reason: string, resolve = false) {
  return transaction(async tx => {
    await lockDeal(tx, id)
    const claim = await tx.hotDealClaim.findUnique({ where: { id: claimId }, include: { participation: true } })
    if (!claim || claim.dealId !== id) throw new DealAccessError('Referral not found.', 404)
    if (resolve || claim.participation.partnerUserId !== user.id) requireAdmin(user)
    const openDispute = await tx.dispute.findFirst({ where: { participationId: claim.participationId, title: `Hot deal claim ${claim.id}`, status: { in: ['OPENED', 'UNDER_REVIEW', 'EVIDENCE_SUBMITTED'] } } })
    if (resolve && !claim.disputed) return { disputed: false }
    if (!resolve && !openDispute) await tx.dispute.create({ data: { participationId: claim.participationId, openedById: user.id, disputeType: 'REWARD_DISPUTE', title: `Hot deal claim ${claim.id}`, description: reason, dueAt: new Date(Date.now() + 72 * 3600000) } })
    if (openDispute) {
      await tx.disputeMessage.create({ data: { disputeId: openDispute.id, senderId: user.id, content: reason } })
      if (resolve) await tx.dispute.update({ where: { id: openDispute.id }, data: { status: 'RESOLVED_PARTNER_FAVOR', resolutionNotes: reason } })
    }
    await tx.hotDealClaim.update({ where: { id: claim.id }, data: { disputed: !resolve } })
    if (claim.conversionId) {
      const rewards = await tx.reward.findMany({ where: { conversionId: claim.conversionId } })
      const restored = rewards.some(r => r.status === 'PAID') ? 'PAID' : rewards.some(r => r.status === 'PAYABLE') ? 'PAYABLE' : 'VALIDATING'
      await tx.conversion.update({ where: { id: claim.conversionId }, data: { status: resolve ? restored : 'DISPUTED' } })
      // Freeze via the claim/dispute gate; never erase an existing payable ledger posting or paid reward.
    }
    await audit(tx, id, user, resolve ? 'hot_deal.dispute_resolved' : 'hot_deal.dispute_raised', { disputed: claim.disputed }, { claimId, disputed: !resolve, reason })
    await tx.notification.create({ data: { userId: claim.participation.partnerUserId, title: resolve ? 'Dispute resolved' : 'Dispute raised', body: reason, linkUrl: '/hot-deals/account' } })
    return { disputed: !resolve }
  })
}
