import { createHash, randomBytes } from 'crypto'
import { Prisma, type HotDeal, type HotDealStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { accessDecision, DealAccessError, hasCapacity, publicTeaser, releaseDates, subscriptionActive } from './policy'
import type { Actor } from './auth'

export type Tx = Prisma.TransactionClient
export async function transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await db.$transaction(fn, { isolationLevel: 'Serializable', timeout: 15000 }) }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && attempt < 3
        && (error.code === 'P2034' || error.code === 'P2010' && error.meta?.code === '40001')) continue
      throw error
    }
  }
}

export async function lockDeal(tx: Tx, id: string) {
  await tx.$queryRaw`SELECT id FROM hot_deals WHERE id = ${id}::uuid FOR UPDATE`
  const deal = await tx.hotDeal.findUnique({ where: { id }, include: {
    opportunity: { include: { publishedVersion: { include: { rewardRules: true } }, organization: true } }, funding: { include: { payment: true } },
  } })
  if (!deal || deal.opportunity.deletedAt) throw new DealAccessError('Deal not found.', 404)
  return deal
}

export async function entitlements(tx: Tx, userId: string, now = new Date()) {
  const user = await tx.user.findUnique({ where: { id: userId }, include: { subscriptions: { include: { plan: { include: { entitlements: true } } } } } })
  if (!user || user.accountStatus !== 'ACTIVE' || user.deletedAt) throw new DealAccessError('Your account is not active.')
  return user.subscriptions.filter(s => s.plan.isActive && subscriptionActive(s, now)).flatMap(s => s.plan.entitlements.map(e => e.code))
}

export async function audit(tx: Tx, dealId: string, actor: Actor | null, action: string, before: Prisma.InputJsonValue, after: Prisma.InputJsonValue) {
  await tx.auditLog.create({ data: {
    actorUserId: actor?.id, entityType: 'HotDeal', entityId: dealId, action,
    beforeData: before, afterData: { data: after, roles: actor?.roleAssignments.map(a => a.role.code) ?? ['SYSTEM'] },
  } })
}

export async function transition(tx: Tx, deal: HotDeal, status: HotDealStatus, actor: Actor | null, reason: string) {
  await tx.hotDeal.update({ where: { id: deal.id }, data: { status, version: { increment: 1 } } })
  await audit(tx, deal.id, actor, 'hot_deal.status', { status: deal.status }, { status, reason })
}

export async function enqueue(tx: Tx, deal: HotDeal, kind: string, audience: string) {
  await tx.hotDealEvent.upsert({ where: { key: `${deal.id}:${kind}:${deal.partnerReleaseAt?.toISOString() ?? 'none'}` }, update: {}, create: {
    dealId: deal.id, key: `${deal.id}:${kind}:${deal.partnerReleaseAt?.toISOString() ?? 'none'}`, audience,
    title: kind === 'PRIVATE' ? 'Private Hot Deal' : kind === 'RELEASE' ? 'Released to Partners' : kind === 'REMINDER' ? 'One hour remaining' : 'Deal is full',
    body: `${deal.teaserTitle}. Reward: TZS ${new Intl.NumberFormat('en-TZ').format(Number(deal.rewardPerVerifiedOutcome) / 100)} per verified outcome. ${kind === 'PRIVATE' ? `Exclusive access ends ${deal.partnerReleaseAt?.toISOString()}.` : 'Participation and validation terms apply.'}`,
  } })
}

export async function refreshRelease(tx: Tx, deal: Awaited<ReturnType<typeof lockDeal>>, now: Date) {
  if (['SCHEDULED_PRIVATE_RELEASE', 'PRIVATE_HOT_DEAL', 'PARTNER_RELEASE'].includes(deal.status)
      && (!deal.funding || deal.funding.payment.status !== 'SUCCESSFUL' || deal.funding.amountMinor < deal.rewardBudget)) {
    await transition(tx, deal, 'PAUSED', null, 'Funding confirmation is no longer valid')
    deal.status = 'PAUSED'
    return deal
  }
  if (deal.status === 'SCHEDULED_PRIVATE_RELEASE' && deal.privateAccessStartAt && deal.privateAccessStartAt <= now && hasCapacity(deal)) {
    const status = deal.privateAccessEnabled ? 'PRIVATE_HOT_DEAL' : 'PARTNER_RELEASE'
    await transition(tx, deal, status, null, 'Scheduled publication')
    deal.status = status
    await enqueue(tx, deal, status === 'PRIVATE_HOT_DEAL' ? 'PRIVATE' : 'RELEASE', status === 'PRIVATE_HOT_DEAL' ? 'PRIVATE_MEMBER' : 'PARTNER_SUBSCRIBER')
  }
  if (deal.status === 'PRIVATE_HOT_DEAL' && deal.partnerReleaseAt && now >= deal.partnerReleaseAt
      && deal.generalPartnerAccessEnabled && hasCapacity(deal) && deal.availablePartnerSlots > 0) {
    await transition(tx, deal, 'PARTNER_RELEASE', null, 'Exclusive access window ended')
    deal.status = 'PARTNER_RELEASE'
    await enqueue(tx, deal, 'RELEASE', 'PARTNER_SUBSCRIBER')
  }
  return deal
}

export async function eligible(tx: Tx, deal: HotDeal, userId: string, now: Date) {
  const participation = await tx.dealParticipation.findUnique({ where: { opportunityId_partnerUserId: { opportunityId: deal.opportunityId, partnerUserId: userId } } })
  const codes = await entitlements(tx, userId, now)
  const denied = accessDecision(deal, codes, now, !!participation)
  if (denied) throw new DealAccessError(denied)
  if (participation && participation.status !== 'ACTIVE') throw new DealAccessError('Your participation is not active.')
  return { participation, codes }
}

export async function dealDetails(id: string, userId: string, room = false) {
  return transaction(async tx => {
    const deal = await refreshRelease(tx, await lockDeal(tx, id), new Date())
    const { participation, codes } = await eligible(tx, deal, userId, new Date())
    const version = deal.opportunity.publishedVersion
    if (!version) throw new DealAccessError('Deal terms are unavailable.', 409)
    if (room && (!participation || !await tx.participationAgreementAcceptance.findUnique({ where: { participationId_versionId: { participationId: participation.id, versionId: version.id } } })))
      throw new DealAccessError('Accept the current participation agreement before entering this Deal Room.')
    const base = { ...publicTeaser(deal), title: deal.teaserTitle, description: 'Accept the current participation agreement to view the full commercial details and enter the Deal Room.', terms: version.termsAndConditions,
      versionId: version.id, termsHash: version.termsHash, rewardTrigger: version.rewardSummary, joined: !!participation }
    if (!room || !participation) return base
    return { ...base, title: version.title, description: version.description, merchant: deal.opportunity.organization.tradingName ?? deal.opportunity.organization.legalName,
      participationId: participation.id,
      referrals: await tx.trackingAsset.findMany({ where: { participationId: participation.id, status: 'ACTIVE' }, select: { code: true, destinationUrl: true } }),
      documents: await tx.hotDealMaterial.findMany({ where: { dealId: id, ...(codes.includes('PRIVATE_MEMBER') ? {} : { privateMembersOnly: false }) }, select: { id: true, label: true } }),
      leads: await tx.lead.findMany({ where: { participationId: participation.id }, select: { id: true, customerName: true, validationStatus: true, createdAt: true }, take: 100, orderBy: { createdAt: 'desc' } }),
      claims: await tx.hotDealClaim.findMany({ where: { participationId: participation.id }, select: { id: true, leadId: true, conversionId: true, disputed: true, disputeUntil: true }, take: 100 }),
      conversions: await tx.conversion.findMany({ where: { participationId: participation.id }, select: { id: true, status: true, rewards: { select: { id: true, status: true, grossAmountMinor: true, netAmountMinor: true } } }, take: 100 }),
      timeline: await tx.auditLog.findMany({ where: { entityType: 'HotDeal', entityId: id, action: 'hot_deal.status' }, select: { createdAt: true, beforeData: true, afterData: true }, orderBy: { createdAt: 'asc' }, take: 100 }),
    }
  })
}

export async function activate(id: string, user: Actor, versionId: string, termsHash: string) {
  return transaction(async tx => {
    const now = new Date()
    const deal = await refreshRelease(tx, await lockDeal(tx, id), now)
    const { participation } = await eligible(tx, deal, user.id, now)
    const version = deal.opportunity.publishedVersion
    if (!version || version.id !== versionId || version.termsHash !== termsHash) throw new DealAccessError('Terms have changed. Read and accept the current version.', 409)
    const joined = participation ?? await tx.dealParticipation.create({ data: {
      opportunityId: deal.opportunityId, partnerUserId: user.id, acceptedVersionId: version.id,
      dealRoom: { create: {} }, trackingAssets: { create: { code: randomBytes(24).toString('hex'), assetType: 'LINK' } },
    } })
    const accepted = await tx.participationAgreementAcceptance.findUnique({ where: { participationId_versionId: { participationId: joined.id, versionId } } })
    if (!accepted) {
      await tx.participationAgreementAcceptance.create({ data: { participationId: joined.id, versionId, termsHash } })
      await audit(tx, id, user, 'hot_deal.agreement_accepted', {}, { participationId: joined.id, versionId, termsHash })
    }
    if (!participation) {
      await tx.hotDeal.update({ where: { id }, data: { availablePartnerSlots: { decrement: 1 }, version: { increment: 1 } } })
      await audit(tx, id, user, 'hot_deal.activated', {}, { participationId: joined.id })
    }
    return { participationId: joined.id }
  })
}

export async function publish(id: string, user: Actor, input: { startAt: string; paymentAttemptId: string; reason: string }) {
  return transaction(async tx => {
    const deal = await lockDeal(tx, id)
    if (deal.status !== 'VERIFIED' || !deal.verifiedAt || !deal.opportunity.publishedVersion) throw new DealAccessError('Verify ownership and deal terms before publication.', 409)
    const payment = await tx.paymentAttempt.findUnique({ where: { id: input.paymentAttemptId } })
    const payerMember = payment && await tx.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: deal.opportunity.organizationId, userId: payment.userId } } })
    if (!payment || payment.status !== 'SUCCESSFUL' || payment.purpose !== 'REWARD_FUNDING' || payment.currency !== 'TZS'
      || !payment.providerReference || ['MOCK', 'MANUAL'].includes(payment.provider.toUpperCase()) || payment.amountMinor < deal.rewardBudget
      || payerMember?.status !== 'ACTIVE') throw new DealAccessError('A server-confirmed licensed payment partner funding record from this merchant is required.', 409)
    if (!hasCapacity(deal)) throw new DealAccessError('Deal capacity and reward funding must be available.', 409)
    await tx.hotDealFunding.create({ data: { dealId: id, paymentAttemptId: payment.id, amountMinor: deal.rewardBudget } })
    const dates = releaseDates(new Date(input.startAt), deal.privateAccessDurationHours)
    if (dates.privateAccessStartAt.getTime() < Date.now() - 60_000) throw new DealAccessError('Release must be scheduled now or in the future.', 400)
    await tx.hotDeal.update({ where: { id }, data: dates })
    await transition(tx, deal, 'SCHEDULED_PRIVATE_RELEASE', user, input.reason)
    await refreshRelease(tx, await lockDeal(tx, id), new Date())
    return { id, ...dates }
  })
}

export const customerHash = (phone: string) => {
  const secret = process.env.HOT_DEALS_IDENTITY_SECRET
  if (!secret || secret.length < 32) throw new DealAccessError('Customer identity protection is not configured.', 503)
  return createHash('sha256').update(`${secret}:${phone}`).digest('hex')
}
