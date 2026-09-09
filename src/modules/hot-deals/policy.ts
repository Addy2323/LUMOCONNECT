import type { HotDeal, UserSubscription } from '@prisma/client'

export class DealAccessError extends Error {
  constructor(message: string, public status = 403) { super(message) }
}

export const LIVE_STATUSES = ['PRIVATE_HOT_DEAL', 'PARTNER_RELEASE'] as const
export function hasCapacity(deal: Pick<HotDeal, 'dealCapacityType' | 'inventoryAvailable' | 'rewardRemaining' | 'rewardPerVerifiedOutcome'>) {
  return (deal.dealCapacityType === 'UNLIMITED' || deal.inventoryAvailable > 0)
    && deal.rewardPerVerifiedOutcome > 0n && deal.rewardRemaining >= deal.rewardPerVerifiedOutcome
}

export function subscriptionActive(subscription: Pick<UserSubscription, 'status' | 'startsAt' | 'expiresAt' | 'cancelledAt'>, now: Date) {
  return subscription.status === 'ACTIVE' && !subscription.cancelledAt
    && !!subscription.startsAt && subscription.startsAt <= now
    && !!subscription.expiresAt && subscription.expiresAt > now
}

export function accessDecision(deal: HotDeal, entitlements: string[], now: Date, alreadyJoined = false) {
  if (deal.visibilityStatus === 'HIDDEN') return 'This deal is currently unavailable.'
  if (!LIVE_STATUSES.some(status => status === deal.status) || !hasCapacity(deal)) return 'This deal is not accepting participation.'
  if (!deal.privateAccessStartAt || deal.privateAccessStartAt > now) return 'This deal has not opened yet.'
  if (!alreadyJoined && deal.availablePartnerSlots <= 0) return 'All partner slots have been taken.'
  if (deal.privateAccessEnabled && deal.partnerReleaseAt && now < deal.partnerReleaseAt) {
    return entitlements.includes('PRIVATE_MEMBER') ? null : 'Private Member access is required until Partner Release.'
  }
  if (!deal.generalPartnerAccessEnabled && !entitlements.includes('PRIVATE_MEMBER')) return 'Partner access is currently disabled.'
  return entitlements.some(code => ['PRIVATE_MEMBER', 'PARTNER_SUBSCRIBER'].includes(code)) ? null : 'An active Partner subscription is required.'
}

// Explicit projection: never spread a database deal or Opportunity into a public response.
export function publicTeaser(deal: HotDeal, now = new Date()) {
  const released = deal.status === 'PARTNER_RELEASE' || (deal.status === 'PRIVATE_HOT_DEAL'
    && !!deal.partnerReleaseAt && deal.partnerReleaseAt <= now && deal.generalPartnerAccessEnabled && deal.availablePartnerSlots > 0 && hasCapacity(deal))
  return {
    id: deal.id, title: deal.teaserTitle, titleSw: deal.teaserTitleSw, category: deal.category,
    location: deal.location, rewardMinor: deal.rewardPerVerifiedOutcome.toString(),
    inventoryAvailable: deal.inventoryAvailable, inventoryTotal: deal.inventoryTotal,
    availablePartnerSlots: deal.availablePartnerSlots, capacityType: deal.dealCapacityType,
    releaseAt: deal.partnerReleaseAt?.toISOString() ?? null,
    startsAt: deal.privateAccessStartAt?.toISOString() ?? null,
    status: released ? 'PARTNER_RELEASE' : deal.status, verified: !!deal.verifiedAt,
  }
}

export function releaseDates(start: Date, durationHours = 24) {
  if (!Number.isInteger(durationHours) || durationHours < 1 || durationHours > 168) throw new DealAccessError('Access duration must be 1–168 hours.', 400)
  const end = new Date(start.getTime() + durationHours * 3_600_000)
  return { privateAccessStartAt: start, privateAccessEndsAt: end, partnerReleaseAt: end }
}
