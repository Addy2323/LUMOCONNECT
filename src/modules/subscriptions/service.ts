import type {
  SubscriptionPlanItem,
  UserSubscriptionItem,
  EnterpriseInquiryInput,
  EnterpriseInquiryItem,
  SubscriptionCheckoutRequest,
  SubscriptionCheckoutResult,
  SubscriptionPlanCode,
} from './types'

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlanItem[] = [
  {
    id: 'plan_monthly',
    code: 'MONTHLY',
    name: 'Monthly',
    billingPeriod: 'MONTHLY',
    priceTZS: 25000,
    priceDisplay: 'TZS 25,000',
    periodDisplay: '/month',
    description: 'Flexible access for Partners who want to discover, unlock full details, and promote LUMO opportunities.',
    isEnterprise: false,
    isBestValue: false,
    features: [
      'Unlimited access to standard published deals',
      'Access to Hot Deals after 24h VIP window completes',
      'Join unlimited opportunities & campaigns',
      'Sales, creative, and promotional resources',
      'Performance and real-time referral tracking',
      'Automated M-Pesa & mobile money settlement',
      'Direct merchant settlement & reward coordination',
      'Cancel anytime before the next billing period',
    ],
    ctaLabel: 'Subscribe Monthly',
  },
  {
    id: 'plan_semiannual',
    code: 'SEMI_ANNUAL',
    name: 'Semi-Annual',
    billingPeriod: 'SEMI_ANNUALLY',
    priceTZS: 100000,
    priceDisplay: 'TZS 100,000',
    periodDisplay: '/6 months',
    equivalentMonthlyDisplay: 'Equivalent to approximately TZS 16,667 per month.',
    savingsDisplay: 'Save TZS 50,000 compared with monthly payments.',
    description: 'Six months of uninterrupted access for active partners and performance marketers.',
    isEnterprise: false,
    isBestValue: false,
    features: [
      'Everything in the Monthly Starter plan',
      'Unlimited deal enrollment for 6 months',
      'Advanced conversion attribution analytics',
      'Priority opportunity push notifications',
      'Priority compliance & fast-track payout support',
      'Access to Hot Deals once 24h VIP exclusivity expires',
      'Single discounted payment every six months',
    ],
    ctaLabel: 'Choose Semi-Annual Pro',
  },
  {
    id: 'plan_annual',
    code: 'ANNUAL',
    name: 'Annual Elite (1 Month VIP Free)',
    billingPeriod: 'ANNUALLY',
    priceTZS: 180000,
    priceDisplay: 'TZS 180,000',
    periodDisplay: '/year',
    equivalentMonthlyDisplay: 'Equivalent to only TZS 15,000 per month.',
    savingsDisplay: 'Save TZS 120,000 + Get 1 Month Golden VIP FREE!',
    description: 'Full year partner access with 1 month of Golden VIP early-access included completely free.',
    isEnterprise: false,
    isBestValue: true,
    isGoldenVip: true,
    freeVipMonthsBonus: 1,
    features: [
      '1 Month Golden VIP Private Membership FREE',
      'Instant 24-hour priority early access to latest Hot Deals',
      'Unlimited deal enrollment for a full 12 months',
      'Direct WhatsApp Referral Coordination concierge',
      'Priority compliance and fast-track payout authorization',
      'Maximum commission rates & bonus milestone unlocks',
      'Save TZS 120,000 annually compared to monthly billing',
    ],
    ctaLabel: 'Get Annual (1 Mo VIP Free)',
  },
  {
    id: 'plan_golden_vip',
    code: 'GOLDEN_VIP',
    name: 'Golden VIP Membership',
    billingPeriod: 'MONTHLY',
    priceTZS: 50000,
    priceDisplay: 'TZS 50,000',
    periodDisplay: '/month',
    description: 'Exclusive first-look membership for elite brokers, high-volume distributors and private partners.',
    isEnterprise: false,
    isBestValue: false,
    isGoldenVip: true,
    features: [
      '24-Hour exclusive early access to all new Hot Deals',
      'View & claim high-margin opportunities before regular partners',
      'Dedicated Lumo WhatsApp Middleman Protection priority',
      'Direct seller phone & WhatsApp contact transparency',
      'VIP badge and zero-queue compliance verification',
      'First claim privilege on limited-inventory deals',
    ],
    ctaLabel: 'Join Golden VIP',
  },
  {
    id: 'plan_enterprise',
    code: 'ENTERPRISE',
    name: 'Enterprise AI & Custom API',
    billingPeriod: 'ANNUALLY',
    priceTZS: 1500000,
    priceDisplay: 'TZS 1,500,000',
    periodDisplay: '/year',
    description: 'AI-powered opportunity intelligence and enterprise access for corporate teams and influencer agencies.',
    isEnterprise: true,
    isBestValue: false,
    features: [
      'Everything in Annual Elite & Golden VIP',
      'Unlimited corporate deal room access',
      'AI-powered opportunity & influencer matching',
      'AI-generated promotional copy and video scripts',
      'Multi-seat team member workspaces',
      'Dedicated compliance and settlement manager',
      'Custom ERP/CRM webhook integrations',
      '24/7 dedicated telephone and SLA support',
    ],
    ctaLabel: 'Talk to Sales',
  },
]

let runtimePlans: SubscriptionPlanItem[] = [...DEFAULT_SUBSCRIPTION_PLANS]

function loadPlansFromStorage() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('lumo_subscription_plans')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          runtimePlans = parsed
        }
      }
    } catch (e) {
      console.warn('Could not load subscription plans from localStorage', e)
    }
  }
}

function syncPlansToStorage() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('lumo_subscription_plans', JSON.stringify(runtimePlans))
      window.dispatchEvent(new Event('lumo:plans-updated'))
    } catch (e) {
      console.warn('Could not sync subscription plans to localStorage', e)
    }
  }
}

loadPlansFromStorage()

export function listSubscriptionPlans(): SubscriptionPlanItem[] {
  loadPlansFromStorage()
  return [...runtimePlans]
}

export function updateSubscriptionPlan(
  code: SubscriptionPlanCode,
  updates: Partial<SubscriptionPlanItem>
): SubscriptionPlanItem | null {
  loadPlansFromStorage()
  const idx = runtimePlans.findIndex((p) => p.code === code)
  if (idx >= 0) {
    const updated = {
      ...runtimePlans[idx],
      ...updates,
      priceDisplay: updates.priceTZS !== undefined ? `TZS ${updates.priceTZS.toLocaleString()}` : runtimePlans[idx].priceDisplay,
    }
    runtimePlans[idx] = updated
    syncPlansToStorage()
    return updated
  }
  return null
}

export function resetSubscriptionPlans(): void {
  runtimePlans = [...DEFAULT_SUBSCRIPTION_PLANS]
  syncPlansToStorage()
}

// In-memory persistent subscription store for demo & runtime consistency
const inMemorySubscriptions: Map<string, UserSubscriptionItem> = new Map()
const inMemoryEnterpriseInquiries: EnterpriseInquiryItem[] = []

function loadSubscriptionsFromStorage() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('lumo_user_subscriptions')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (typeof parsed === 'object' && parsed !== null) {
          Object.entries(parsed).forEach(([uid, sub]: [string, any]) => {
            inMemorySubscriptions.set(uid, {
              ...sub,
              startsAt: new Date(sub.startsAt),
              expiresAt: new Date(sub.expiresAt),
              cancelledAt: sub.cancelledAt ? new Date(sub.cancelledAt) : undefined,
            })
          })
        }
      }
    } catch (e) {
      console.warn('Could not load user subscriptions from localStorage', e)
    }
  }
}

function syncSubscriptionsToStorage() {
  if (typeof window !== 'undefined') {
    try {
      const obj: Record<string, any> = {}
      inMemorySubscriptions.forEach((sub, uid) => {
        obj[uid] = sub
      })
      localStorage.setItem('lumo_user_subscriptions', JSON.stringify(obj))
      window.dispatchEvent(new Event('lumo:subscription-updated'))
    } catch (e) {
      console.warn('Could not sync user subscriptions to localStorage', e)
    }
  }
}

loadSubscriptionsFromStorage()

export function getSubscriptionPlanByCode(code: SubscriptionPlanCode): SubscriptionPlanItem | undefined {
  loadPlansFromStorage()
  return runtimePlans.find((p) => p.code === code)
}

export function getUserSubscription(userId: string): UserSubscriptionItem | null {
  if (!userId) return null
  loadSubscriptionsFromStorage()
  const sub = inMemorySubscriptions.get(userId)

  if (!sub) return null

  const now = new Date()
  const isTimeValid = new Date(sub.startsAt) <= now && new Date(sub.expiresAt) > now
  const isActive = sub.status === 'ACTIVE' && isTimeValid
  const diffMs = new Date(sub.expiresAt).getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  const isGoldenVipPlan = sub.planCode === 'GOLDEN_VIP' || sub.planCode === 'ANNUAL' || sub.planCode === 'ENTERPRISE' || Boolean(sub.isGoldenVip)
  const hasGoldenVipAccess = Boolean(isGoldenVipPlan && isActive)

  const updatedSub: UserSubscriptionItem = {
    ...sub,
    daysRemaining,
    isActive,
    isGoldenVip: isGoldenVipPlan,
    hasGoldenVipAccess,
    status: isTimeValid ? sub.status : 'EXPIRED',
  }

  // Update in store if expired
  if (!isTimeValid && sub.status === 'ACTIVE') {
    inMemorySubscriptions.set(userId, { ...updatedSub, status: 'EXPIRED' })
    syncSubscriptionsToStorage()
  }

  return updatedSub
}

export function setUserSubscription(userId: string, subscription: UserSubscriptionItem): void {
  inMemorySubscriptions.set(userId, subscription)
  syncSubscriptionsToStorage()
}

export function cancelSubscriptionRenewal(userId: string): {
  success: boolean
  message: string
  data: UserSubscriptionItem | null
} {
  const sub = getUserSubscription(userId)
  if (!sub) {
    return {
      success: false,
      message: 'No active subscription found for user.',
      data: null,
    }
  }
  const updated: UserSubscriptionItem = {
    ...sub,
    autoRenew: false,
    cancelledAt: new Date(),
  }
  inMemorySubscriptions.set(userId, updated)
  syncSubscriptionsToStorage()
  return {
    success: true,
    message: 'Auto-renewal has been cancelled. Your benefits remain active until the end of the billing period.',
    data: updated,
  }
}

/**
 * Calculates accurate calendar-aware subscription expiry.
 * Handles month-end date overflows (e.g., Jan 31 + 1 month = Feb 28/29).
 */
export function calculateSubscriptionExpiry(
  startDate: Date,
  planCode: SubscriptionPlanCode
): Date {
  const result = new Date(startDate.getTime())

  if (planCode === 'MONTHLY' || planCode === 'GOLDEN_VIP') {
    const originalDay = result.getDate()
    result.setMonth(result.getMonth() + 1)
    // If date rolled over past the end of the month (e.g. 31 Jan -> March 2/3), cap to last day of target month
    if (result.getDate() < originalDay) {
      result.setDate(0)
    }
  } else if (planCode === 'SEMI_ANNUAL') {
    const originalDay = result.getDate()
    result.setMonth(result.getMonth() + 6)
    if (result.getDate() < originalDay) {
      result.setDate(0)
    }
  } else if (planCode === 'ANNUAL' || planCode === 'ENTERPRISE') {
    const originalDay = result.getDate()
    result.setFullYear(result.getFullYear() + 1)
    if (result.getDate() < originalDay) {
      result.setDate(0)
    }
  } else {
    // Default 30 days
    result.setDate(result.getDate() + 30)
  }

  return result
}

export function grantUserSubscription(
  userId: string,
  planCode: SubscriptionPlanCode,
  days?: number,
  amountPaidTZS = 0
): UserSubscriptionItem {
  const plan = getSubscriptionPlanByCode(planCode)
  const now = new Date()
  const existing = getUserSubscription(userId)

  // If user already has an active subscription, extend from existing expiry date
  let startsAt = now
  let expiresAt: Date

  if (days !== undefined) {
    if (existing && existing.isActive && new Date(existing.expiresAt) > now && days > 0) {
      expiresAt = new Date(new Date(existing.expiresAt).getTime() + days * 24 * 60 * 60 * 1000)
      startsAt = new Date(existing.startsAt)
    } else {
      expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    }
  } else {
    if (existing && existing.isActive && new Date(existing.expiresAt) > now) {
      expiresAt = calculateSubscriptionExpiry(new Date(existing.expiresAt), planCode)
      startsAt = new Date(existing.startsAt)
    } else {
      expiresAt = calculateSubscriptionExpiry(now, planCode)
    }
  }

  const isTimeValid = startsAt <= now && expiresAt > now
  const diffMs = Math.max(0, expiresAt.getTime() - now.getTime())
  const computedDaysRemaining = isTimeValid ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))) : 0
  const isVip = planCode === 'GOLDEN_VIP' || planCode === 'ANNUAL' || planCode === 'ENTERPRISE'

  const sub: UserSubscriptionItem = {
    id: `sub_admin_${Date.now()}_${userId}`,
    userId,
    planCode,
    planName: plan?.name || 'Standard Plan',
    status: isTimeValid ? 'ACTIVE' : 'EXPIRED',
    startsAt,
    expiresAt,
    daysRemaining: computedDaysRemaining,
    isActive: isTimeValid,
    autoRenew: true,
    amountPaidTZS: amountPaidTZS || plan?.priceTZS || 0,
    isGoldenVip: isVip,
    hasGoldenVipAccess: Boolean(isVip && isTimeValid),
  }

  inMemorySubscriptions.set(userId, sub)
  syncSubscriptionsToStorage()
  return sub
}

export async function createSubscriptionCheckout(
  req: SubscriptionCheckoutRequest
): Promise<SubscriptionCheckoutResult> {
  const plan = getSubscriptionPlanByCode(req.planCode)
  if (!plan) {
    return {
      success: false,
      subscriptionId: '',
      paymentAttemptId: '',
      providerRef: '',
      status: 'FAILED',
      instructions: '',
      amountTZS: 0,
      planName: '',
      error: 'Invalid subscription plan selected.',
    }
  }

  // Server-read price: Never trust client price
  const amountTZS = plan.priceTZS
  const paymentAttemptId = `pay_sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const subscriptionId = `sub_${Date.now()}_${req.userId}`

  const mappedPaymentMethod =
    req.paymentMethod === 'AIRTEL'
      ? 'AIRTEL_MONEY'
      : req.paymentMethod === 'TIGO'
      ? 'TIGO_PESA'
      : req.paymentMethod === 'HALOPESA'
      ? 'HALOPESA'
      : 'MPESA'

  // In-memory simulation / test checkout helper: Never calls external payment gateways or Snippe network
  const providerRef = `sub_mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  // Calculate durations on server
  const startsAt = new Date()
  const expiresAt = new Date(startsAt)
  if (req.planCode === 'MONTHLY' || req.planCode === 'GOLDEN_VIP') {
    expiresAt.setDate(expiresAt.getDate() + 30)
  } else if (req.planCode === 'SEMI_ANNUAL') {
    expiresAt.setDate(expiresAt.getDate() + 180)
  } else {
    expiresAt.setDate(expiresAt.getDate() + 365)
  }

  const daysRemaining = Math.ceil(
    (expiresAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  const isVip = req.planCode === 'GOLDEN_VIP' || req.planCode === 'ANNUAL'

  const newSub: UserSubscriptionItem = {
    id: subscriptionId,
    userId: req.userId,
    planCode: req.planCode,
    planName: plan.name,
    status: 'ACTIVE',
    startsAt,
    expiresAt,
    daysRemaining,
    isActive: true,
    autoRenew: true,
    paymentAttemptId,
    amountPaidTZS: amountTZS,
    isGoldenVip: isVip,
    hasGoldenVipAccess: isVip,
    freeVipMonthsBonus: req.planCode === 'ANNUAL' ? 1 : 0,
  }

  inMemorySubscriptions.set(req.userId, newSub)
  syncSubscriptionsToStorage()

  return {
    success: true,
    subscriptionId,
    paymentAttemptId,
    providerRef,
    status: 'ACTIVE',
    instructions: 'Subscription activated via local in-memory simulation.',
    amountTZS,
    planName: plan.name,
    expiresAt,
  }
}

export function submitEnterpriseInquiry(
  input: EnterpriseInquiryInput,
  userId?: string
): EnterpriseInquiryItem {
  const inquiryId = `inq_${Date.now()}`
  const inquiry: EnterpriseInquiryItem = {
    id: inquiryId,
    userId,
    ...input,
    status: 'PENDING',
    createdAt: new Date(),
  }
  inMemoryEnterpriseInquiries.push(inquiry)
  return inquiry
}

export function listEnterpriseInquiries(): EnterpriseInquiryItem[] {
  return [...inMemoryEnterpriseInquiries]
}
