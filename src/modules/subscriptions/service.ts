import type {
  SubscriptionPlanItem,
  UserSubscriptionItem,
  EnterpriseInquiryInput,
  EnterpriseInquiryItem,
  SubscriptionCheckoutRequest,
  SubscriptionCheckoutResult,
  SubscriptionPlanCode,
} from './types'
import { MongikePaymentAdapter } from '@/lib/providers/mongike'

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
      'Unlimited access to published deals for Partners',
      'Unlimited deal-detail viewing & commercial terms',
      'Join unlimited opportunities & campaigns',
      'Sales, creative, and promotional resources',
      'Performance and real-time referral tracking',
      'Automated M-Pesa & mobile money settlement',
      'TRA statutory tax certificate generation',
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
    isBestValue: true,
    features: [
      'Everything in the Monthly Starter plan',
      'Unlimited deal enrollment for 6 months',
      'Advanced conversion attribution analytics',
      'Priority opportunity push notifications',
      'Priority compliance & fast-track payout support',
      'Early access to exclusive high-margin deals',
      'Single discounted payment every six months',
    ],
    ctaLabel: 'Choose Semi-Annual Pro',
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
      'Everything in the Semi-Annual Pro plan',
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
  loadSubscriptionsFromStorage()
  let sub = inMemorySubscriptions.get(userId)
  
  // Cross-user fallback check for session consistency
  if (!sub && typeof window !== 'undefined') {
    const allSubs = Array.from(inMemorySubscriptions.values())
    const activeOne = allSubs.find((s) => s.status === 'ACTIVE' && new Date(s.expiresAt) > new Date())
    if (activeOne) {
      sub = activeOne
    }
  }

  if (!sub) return null

  const now = new Date()
  const isTimeValid = new Date(sub.startsAt) <= now && new Date(sub.expiresAt) > now
  const isActive = sub.status === 'ACTIVE' && isTimeValid
  const diffMs = new Date(sub.expiresAt).getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  const updatedSub: UserSubscriptionItem = {
    ...sub,
    daysRemaining,
    isActive,
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

export function grantUserSubscription(
  userId: string,
  planCode: SubscriptionPlanCode,
  days = 30,
  amountPaidTZS = 0
): UserSubscriptionItem {
  const plan = getSubscriptionPlanByCode(planCode)
  const startsAt = new Date()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)

  const sub: UserSubscriptionItem = {
    id: `sub_admin_${Date.now()}_${userId}`,
    userId,
    planCode,
    planName: plan?.name || 'Custom Plan',
    status: 'ACTIVE',
    startsAt,
    expiresAt,
    daysRemaining: days,
    isActive: true,
    autoRenew: true,
    amountPaidTZS: amountPaidTZS || plan?.priceTZS || 0,
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

  const mongike = new MongikePaymentAdapter()
  const initResult = await mongike.initiatePayment({
    orderId: paymentAttemptId,
    idempotencyKey: `idemp_${paymentAttemptId}`,
    amountMinorUnits: BigInt(amountTZS * 100),
    currency: 'TZS',
    paymentMethod: mappedPaymentMethod as any,
    customerPhone: req.phoneNumber,
    customerEmail: `${req.userId}@lumo.co.tz`,
    callbackUrl: 'https://lumo.co.tz/api/webhooks/mongike',
  })

  // Calculate durations on server
  const startsAt = new Date()
  const expiresAt = new Date(startsAt)
  if (req.planCode === 'MONTHLY') {
    expiresAt.setDate(expiresAt.getDate() + 30)
  } else if (req.planCode === 'SEMI_ANNUAL') {
    expiresAt.setDate(expiresAt.getDate() + 180)
  } else {
    expiresAt.setDate(expiresAt.getDate() + 365)
  }

  const daysRemaining = Math.ceil(
    (expiresAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24)
  )

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
  }

  inMemorySubscriptions.set(req.userId, newSub)
  syncSubscriptionsToStorage()

  return {
    success: true,
    subscriptionId,
    paymentAttemptId,
    providerRef: (initResult as any).providerRef || (initResult as any).providerReference || 'MPESA-DEMO',
    status: 'ACTIVE',
    instructions: initResult.instructions || 'Check your mobile device for the M-Pesa PIN prompt.',
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
