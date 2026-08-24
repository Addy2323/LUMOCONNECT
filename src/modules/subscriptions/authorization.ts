import type { DealAccessDecision, SubscriptionStatus } from './types'
import { getUserSubscription } from './service'
import { getOpportunityById, getOpportunityBySlug } from '@/modules/deals/service'

export interface DealSubscriptionAuthParams {
  userId?: string
  userRole?: string
  userOrgId?: string
  dealIdOrSlug: string
  intent?: 'view' | 'join'
}

/**
 * Reusable Server-Side Authorization Guard for LUMO Deals Marketplace
 *
 * Core Business Rules:
 * 1. Deals are created and published by verified Business users.
 * 2. Unauthenticated visitors are redirected to sign-in with returnTo & intent.
 * 3. Administrators and internal staff retain full authorized access.
 * 4. A Business user viewing/managing their OWN published deal has access without subscription.
 * 5. All other Partners, Customers, and other Business users MUST hold an active subscription.
 * 6. Expired/cancelled/past-due subscribers are redirected to /subscriptions with accurate status.
 */
export function requireActiveDealSubscription({
  userId,
  userRole,
  userOrgId,
  dealIdOrSlug,
  intent = 'view',
}: DealSubscriptionAuthParams): DealAccessDecision {
  const deal = getOpportunityById(dealIdOrSlug) || getOpportunityBySlug(dealIdOrSlug)
  const targetSlug = deal ? deal.slug : dealIdOrSlug

  // 1. Unauthenticated user
  if (!userId) {
    return {
      isAuthorized: false,
      canViewFullDetails: false,
      canJoinDeal: false,
      isOwner: false,
      isAdmin: false,
      hasActiveSubscription: false,
      requiresSubscription: true,
      reason: 'Authentication required. Please sign in to access verified LUMO opportunities.',
      redirectUrl: `/sign-in?returnTo=/deals/${targetSlug}&intent=${intent}`,
    }
  }

  // 2. Administrator or Internal Authorized Staff
  const normalizedRole = userRole?.toUpperCase()
  if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'INTERNAL_STAFF') {
    return {
      isAuthorized: true,
      canViewFullDetails: true,
      canJoinDeal: true,
      isOwner: false,
      isAdmin: true,
      hasActiveSubscription: true,
      requiresSubscription: false,
    }
  }

  // 3. Business user viewing their OWN published deal
  if (deal && userOrgId && deal.organizationId === userOrgId) {
    return {
      isAuthorized: true,
      canViewFullDetails: true,
      canJoinDeal: true,
      isOwner: true,
      isAdmin: false,
      hasActiveSubscription: true,
      requiresSubscription: false,
    }
  }

  // 4. Check active subscription
  const userSub = getUserSubscription(userId)
  const hasActiveSubscription = Boolean(userSub && userSub.isActive && userSub.status === 'ACTIVE')

  if (hasActiveSubscription) {
    return {
      isAuthorized: true,
      canViewFullDetails: true,
      canJoinDeal: true,
      isOwner: false,
      isAdmin: false,
      hasActiveSubscription: true,
      subscriptionStatus: userSub?.status,
      requiresSubscription: false,
    }
  }

  // 5. Non-subscriber or expired / cancelled / past_due subscriber
  const status: SubscriptionStatus = userSub?.status || 'EXPIRED'
  let reasonMessage = 'Subscribe to unlock full deal details and start earning with verified LUMO opportunities.'

  if (userSub?.status === 'EXPIRED') {
    reasonMessage = 'Your LUMO subscription has expired. Please renew to access deal details.'
  } else if (userSub?.status === 'CANCELLED') {
    reasonMessage = 'Your subscription was cancelled. Subscribe to unlock opportunities.'
  } else if (userSub?.status === 'PAST_DUE' || userSub?.status === 'FAILED') {
    reasonMessage = 'Subscription payment failed. Please update your payment method.'
  } else if (userSub?.status === 'PENDING') {
    reasonMessage = 'Your subscription payment is pending confirmation.'
  }

  return {
    isAuthorized: false,
    canViewFullDetails: false,
    canJoinDeal: false,
    isOwner: false,
    isAdmin: false,
    hasActiveSubscription: false,
    subscriptionStatus: status,
    requiresSubscription: true,
    reason: reasonMessage,
    redirectUrl: `/subscriptions?returnTo=/deals/${targetSlug}&intent=${intent}`,
  }
}
