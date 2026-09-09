import type { Prisma, HotDeal } from '@prisma/client'
import { getUserEntitlements } from '@/modules/subscriptions/entitlement.service'

export type Tx = Prisma.TransactionClient

export class DealAccessDeniedError extends Error {
  constructor(message: string, public statusCode = 403) {
    super(message)
    this.name = 'DealAccessDeniedError'
  }
}

export interface DealAccessEvaluation {
  canViewTeaser: boolean
  canViewFullDetails: boolean
  canActivate: boolean
  isPrivateMemberOnly: boolean
  isReleasedToPartners: boolean
  isFull: boolean
  denialReason?: string
  statusBadge: 'PRIVATE_HOT_DEAL' | 'PARTNER_RELEASE' | 'RESERVED' | 'FULL' | 'CLOSED'
}

/**
 * Checks if a deal currently has remaining capacity (inventory and reward budget).
 */
export function dealHasCapacity(deal: Pick<HotDeal, 'dealCapacityType' | 'inventoryAvailable' | 'rewardRemaining' | 'rewardPerVerifiedOutcome'>): boolean {
  const inventoryOk = deal.dealCapacityType === 'UNLIMITED' || deal.inventoryAvailable > 0
  const rewardOk = deal.rewardPerVerifiedOutcome > 0n && deal.rewardRemaining >= deal.rewardPerVerifiedOutcome
  return inventoryOk && rewardOk
}

/**
 * Server-side evaluation of deal accessibility for a specific user and timestamp.
 */
export async function evaluateDealAccess(
  client: Tx,
  deal: HotDeal,
  userId?: string,
  now = new Date(),
  alreadyParticipating = false
): Promise<DealAccessEvaluation> {
  const isReleased =
    deal.status === 'PARTNER_RELEASE' ||
    (deal.status === 'PRIVATE_HOT_DEAL' &&
      Boolean(deal.partnerReleaseAt && deal.partnerReleaseAt <= now) &&
      deal.generalPartnerAccessEnabled)

  const isFull = deal.inventoryAvailable <= 0 || deal.availablePartnerSlots <= 0 || !dealHasCapacity(deal)

  let statusBadge: DealAccessEvaluation['statusBadge'] = 'PRIVATE_HOT_DEAL'
  if (isFull) statusBadge = 'FULL'
  else if (deal.status === 'RESERVED') statusBadge = 'RESERVED'
  else if (isReleased) statusBadge = 'PARTNER_RELEASE'
  else if (['CLOSED', 'CANCELLED', 'PAUSED'].includes(deal.status)) statusBadge = 'CLOSED'

  // Teaser is public
  const canViewTeaser = deal.visibilityStatus !== 'HIDDEN'

  if (!userId) {
    return {
      canViewTeaser,
      canViewFullDetails: false,
      canActivate: false,
      isPrivateMemberOnly: !isReleased,
      isReleasedToPartners: isReleased,
      isFull,
      denialReason: 'Authentication required to view confidential commercial terms.',
      statusBadge,
    }
  }

  // Check user active status and subscription entitlements
  const entitlements = await getUserEntitlements(client, userId, now)
  const isPrivateMember = entitlements.includes('PRIVATE_MEMBER')
  const isPartner = entitlements.includes('PARTNER_SUBSCRIBER')

  if (!isPrivateMember && !isPartner) {
    return {
      canViewTeaser,
      canViewFullDetails: false,
      canActivate: false,
      isPrivateMemberOnly: !isReleased,
      isReleasedToPartners: isReleased,
      isFull,
      denialReason: 'An active subscription is required to unlock this opportunity.',
      statusBadge,
    }
  }

  // Pre-release 24-hour window
  if (!isReleased && !isPrivateMember) {
    return {
      canViewTeaser,
      canViewFullDetails: false,
      canActivate: false,
      isPrivateMemberOnly: true,
      isReleasedToPartners: false,
      isFull,
      denialReason: 'Private Member early access window is currently active. Opens to Partners in the countdown displayed.',
      statusBadge,
    }
  }

  if (isFull && !alreadyParticipating) {
    return {
      canViewTeaser,
      canViewFullDetails: true,
      canActivate: false,
      isPrivateMemberOnly: !isReleased,
      isReleasedToPartners: isReleased,
      isFull: true,
      denialReason: 'This opportunity has reached maximum capacity or all partner slots are allocated.',
      statusBadge: 'FULL',
    }
  }

  return {
    canViewTeaser,
    canViewFullDetails: true,
    canActivate: !alreadyParticipating,
    isPrivateMemberOnly: !isReleased,
    isReleasedToPartners: isReleased,
    isFull: false,
    statusBadge,
  }
}
