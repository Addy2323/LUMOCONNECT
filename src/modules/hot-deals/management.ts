import { createHash } from 'crypto'
import { z } from 'zod'
import type { Actor } from './auth'
import { requireAdmin } from './auth'
import { audit, lockDeal, transaction, transition, type Tx } from './service'
import { DealAccessError, releaseDates } from './policy'
import { readPrivateFile } from './storage'

const money = z.string().regex(/^[1-9]\d{0,14}$/).transform(BigInt)
export const submissionSchema = z.object({
  opportunityId: z.string().uuid(), teaserTitle: z.string().trim().min(3).max(100),
  teaserTitleSw: z.string().trim().max(100).optional(), category: z.string().trim().min(2).max(60),
  location: z.string().trim().min(2).max(100), ownerEvidenceFileId: z.string().uuid(),
  maximumPartnerSlots: z.number().int().min(1).max(100000), inventoryTotal: z.number().int().min(1).max(1000000),
  rewardBudget: money, rewardPerVerifiedOutcome: money,
  dealCapacityType: z.enum(['ONE_UNIT', 'MULTI_UNIT', 'UNLIMITED', 'LEAD_LIMIT']),
  privateAccessEnabled: z.boolean().default(true), privateAccessDurationHours: z.number().int().min(1).max(168).default(24),
  generalPartnerAccessEnabled: z.boolean().default(true), disputeWindowHours: z.number().int().min(24).max(2160).default(72),
}).refine(v => v.rewardBudget >= v.rewardPerVerifiedOutcome && (v.dealCapacityType !== 'ONE_UNIT' || v.inventoryTotal === 1), 'Invalid capacity or reward budget')

export async function submit(user: Actor, input: z.infer<typeof submissionSchema>, existingTx?: Tx) {
  const run = async (tx: Tx) => {
    const opportunity = await tx.opportunity.findUnique({ where: { id: input.opportunityId } })
    if (!opportunity || opportunity.deletedAt) throw new DealAccessError('Opportunity not found.', 404)
    const member = await tx.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: opportunity.organizationId, userId: user.id } } })
    if (member?.status !== 'ACTIVE' || !['OWNER', 'ADMIN'].includes(member.businessRole)) requireAdmin(user)
    const evidence = await tx.fileAsset.findUnique({ where: { id: input.ownerEvidenceFileId } })
    if (!evidence || evidence.uploaderId !== user.id || evidence.isPublic) throw new DealAccessError('Upload private ownership or authority evidence first.', 400)
    const deal = await tx.hotDeal.create({ data: { ...input, availablePartnerSlots: input.maximumPartnerSlots, inventoryAvailable: input.inventoryTotal, rewardRemaining: input.rewardBudget } })
    await audit(tx, deal.id, user, 'hot_deal.created', {}, { status: 'DRAFT', ownerEvidenceFileId: input.ownerEvidenceFileId })
    await transition(tx, deal, 'UNDER_REVIEW', user, 'Merchant submitted authority evidence and commercial terms')
    return { id: deal.id, status: 'UNDER_REVIEW' }
  }
  return existingTx ? run(existingTx) : transaction(run)
}

export const stateSchema = z.object({
  status: z.enum(['VERIFIED', 'DRAFT', 'PAUSED', 'CANCELLED', 'CLOSED', 'PRIVATE_HOT_DEAL', 'PARTNER_RELEASE']),
  reason: z.string().trim().min(10).max(1000), documentIds: z.array(z.string().uuid()).max(20).default([]),
})
export async function changeState(id: string, user: Actor, input: z.infer<typeof stateSchema>) {
  requireAdmin(user)
  return transaction(async tx => {
    const deal = await lockDeal(tx, id)
    const allowed: Record<string, string[]> = {
      UNDER_REVIEW: ['VERIFIED', 'DRAFT', 'CANCELLED'], DRAFT: ['CANCELLED'], VERIFIED: ['CANCELLED'],
      SCHEDULED_PRIVATE_RELEASE: ['PAUSED', 'CANCELLED'], PRIVATE_HOT_DEAL: ['PAUSED', 'CANCELLED', 'CLOSED'],
      PARTNER_RELEASE: ['PAUSED', 'CANCELLED', 'CLOSED'], PAUSED: ['PRIVATE_HOT_DEAL', 'PARTNER_RELEASE', 'CANCELLED', 'CLOSED'],
      FULL: ['CLOSED'],
    }
    if (!allowed[deal.status]?.includes(input.status)) throw new DealAccessError('Invalid lifecycle transition.', 409)
    if (input.status === 'VERIFIED') {
      const files = await tx.fileAsset.count({ where: { id: { in: [deal.ownerEvidenceFileId, ...input.documentIds] }, isPublic: false } })
      if (files < new Set([deal.ownerEvidenceFileId, ...input.documentIds]).size || !deal.opportunity.publishedVersion)
        throw new DealAccessError('Private evidence and a published commercial version are required.', 409)
      const ownership = await tx.fileAsset.findUniqueOrThrow({ where: { id: deal.ownerEvidenceFileId } })
      if (ownership.fileSizeBytes < 1) throw new DealAccessError('Real ownership evidence must replace any development placeholder.', 409)
      await readPrivateFile(ownership.fileKey)
      const version = deal.opportunity.publishedVersion
      if (version.termsHash !== createHash('sha256').update(version.termsAndConditions).digest('hex'))
        throw new DealAccessError('The terms hash does not match the participation agreement.', 409)
      if (!version.rewardRules.some(r => r.amountMinor === deal.rewardPerVerifiedOutcome && r.currency === 'TZS'))
        throw new DealAccessError('The version must contain the matching fixed TZS reward rule.', 409)
      await tx.hotDeal.update({ where: { id }, data: { verifiedAt: new Date(), verifiedBy: user.id } })
    }
    if (['PRIVATE_HOT_DEAL', 'PARTNER_RELEASE'].includes(input.status)) {
      if (!deal.funding || deal.funding.payment.status !== 'SUCCESSFUL' || !deal.privateAccessStartAt || deal.privateAccessStartAt > new Date()) throw new DealAccessError('A funded, started deal is required.', 409)
      if (input.status === 'PARTNER_RELEASE' && (deal.privateAccessEnabled && (!deal.partnerReleaseAt || deal.partnerReleaseAt > new Date()) || !deal.generalPartnerAccessEnabled)) throw new DealAccessError('The private window has not ended or partner release is disabled.', 409)
      if (input.status === 'PRIVATE_HOT_DEAL' && (!deal.partnerReleaseAt || deal.partnerReleaseAt <= new Date())) throw new DealAccessError('The private window has ended.', 409)
    }
    await transition(tx, deal, input.status, user, input.reason)
    await audit(tx, id, user, 'hot_deal.review_evidence', {}, { documentIds: input.documentIds, reason: input.reason })
    return { id, status: input.status }
  })
}

export const configurationSchema = z.object({
  ownerEvidenceFileId: z.string().uuid().optional(),
  privateAccessDurationHours: z.number().int().min(1).max(168).optional(),
  visibilityStatus: z.enum(['PUBLIC_TEASER', 'MEMBERS_ONLY', 'HIDDEN']).optional(),
  generalPartnerAccessEnabled: z.boolean().optional(),
  reason: z.string().min(10).max(1000),
})
export async function configureDeal(id: string, user: Actor, input: z.infer<typeof configurationSchema>) {
  requireAdmin(user)
  return transaction(async tx => {
    const deal = await lockDeal(tx, id)
    if (input.ownerEvidenceFileId) {
      if (!['DRAFT', 'UNDER_REVIEW'].includes(deal.status)) throw new DealAccessError('Verified ownership evidence cannot be replaced.', 409)
      const file = await tx.fileAsset.findUnique({ where: { id: input.ownerEvidenceFileId } })
      if (!file || file.isPublic || file.fileSizeBytes < 1 || file.uploaderId !== user.id) throw new DealAccessError('Upload private ownership evidence first.')
    }
    if (input.privateAccessDurationHours !== undefined && (!['DRAFT', 'UNDER_REVIEW', 'VERIFIED', 'SCHEDULED_PRIVATE_RELEASE', 'PRIVATE_HOT_DEAL'].includes(deal.status)
      || deal.partnerReleaseAt && (deal.partnerReleaseAt <= new Date() || input.privateAccessDurationHours < deal.privateAccessDurationHours))) throw new DealAccessError('An active private window may only be extended before it ends.', 409)
    const { reason, ...config } = input
    const updated = await tx.hotDeal.update({ where: { id }, data: { ...config,
      ...(input.privateAccessDurationHours && deal.privateAccessStartAt ? releaseDates(deal.privateAccessStartAt, input.privateAccessDurationHours) : {}), version: { increment: 1 },
    } })
    await audit(tx, id, user, 'hot_deal.configuration', { durationHours: deal.privateAccessDurationHours, partnerReleaseAt: deal.partnerReleaseAt?.toISOString() ?? null, visibilityStatus: deal.visibilityStatus, generalPartnerAccessEnabled: deal.generalPartnerAccessEnabled, ownerEvidenceFileId: deal.ownerEvidenceFileId }, { ...config, reason })
    if (input.ownerEvidenceFileId && deal.status === 'DRAFT') await transition(tx, updated, 'UNDER_REVIEW', user, reason)
    return { id, partnerReleaseAt: updated.partnerReleaseAt, visibilityStatus: updated.visibilityStatus }
  })
}
