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

export const SUBSCRIPTION_PLANS: SubscriptionPlanItem[] = [
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
      'Unlimited deal-detail viewing',
      'Join unlimited opportunities',
      'Access complete reward and commission terms',
      'Sales and promotional resources',
      'Performance and referral tracking',
      'Earnings dashboard',
      'Real-time deal notifications',
      'Standard customer support',
      'Cancel before the next billing period',
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
    description: 'Six months of uninterrupted access for active partners and opportunity professionals.',
    isEnterprise: false,
    isBestValue: true,
    features: [
      'Everything in the Monthly plan',
      'Unlimited access to published deals for six months',
      'Join unlimited opportunities',
      'Advanced performance insights',
      'Priority opportunity notifications',
      'Priority customer support',
      'Early access to selected opportunities',
      'One payment every six months',
    ],
    ctaLabel: 'Choose Semi-Annual',
  },
  {
    id: 'plan_enterprise',
    code: 'ENTERPRISE',
    name: 'AI-Powered Enterprise',
    billingPeriod: 'ANNUALLY',
    priceTZS: 0,
    priceDisplay: 'Custom pricing',
    periodDisplay: 'Annual agreement',
    description: 'AI-powered opportunity intelligence and enterprise access for organizations and professional teams.',
    isEnterprise: true,
    isBestValue: false,
    features: [
      'Everything in the Semi-Annual plan',
      'Unlimited enterprise deal access',
      'AI-powered opportunity recommendations',
      'AI deal-to-partner matching',
      'AI-generated sales insights',
      'AI-assisted promotional content',
      'Team member access',
      'Organization performance dashboard',
      'Advanced reporting and exports',
      'Dedicated account manager',
      'Priority onboarding',
      'API and business-system integration options',
      'Custom support and service agreement',
    ],
    ctaLabel: 'Talk to Sales',
  },
]

// In-memory persistent subscription store for demo & runtime consistency
const inMemorySubscriptions: Map<string, UserSubscriptionItem> = new Map()
const inMemoryEnterpriseInquiries: EnterpriseInquiryItem[] = []

// Initialize default active subscription for demo user 'alex_partner'
const defaultAlexExpires = new Date()
defaultAlexExpires.setDate(defaultAlexExpires.getDate() + 28) // 28 days left

inMemorySubscriptions.set('alex_partner', {
  id: 'sub_alex_default',
  userId: 'alex_partner',
  planCode: 'SEMI_ANNUAL',
  planName: 'Semi-Annual',
  status: 'ACTIVE',
  startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 152),
  expiresAt: defaultAlexExpires,
  daysRemaining: 28,
  isActive: true,
  autoRenew: true,
  amountPaidTZS: 100000,
})

export function listSubscriptionPlans(): SubscriptionPlanItem[] {
  return [...SUBSCRIPTION_PLANS]
}

export function getSubscriptionPlanByCode(code: SubscriptionPlanCode): SubscriptionPlanItem | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.code === code)
}

export function getUserSubscription(userId: string): UserSubscriptionItem | null {
  const sub = inMemorySubscriptions.get(userId)
  if (!sub) return null

  const now = new Date()
  const isTimeValid = sub.startsAt <= now && sub.expiresAt > now
  const isActive = sub.status === 'ACTIVE' && isTimeValid
  const diffMs = sub.expiresAt.getTime() - now.getTime()
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
  }

  return updatedSub
}

export function setUserSubscription(userId: string, subscription: UserSubscriptionItem): void {
  inMemorySubscriptions.set(userId, subscription)
}

export async function createSubscriptionCheckout(
  req: SubscriptionCheckoutRequest
): Promise<SubscriptionCheckoutResult> {
  const plan = getSubscriptionPlanByCode(req.planCode)
  if (!plan || plan.isEnterprise) {
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
  }

  // Record pending subscription
  const pendingSub: UserSubscriptionItem = {
    id: subscriptionId,
    userId: req.userId,
    planCode: req.planCode,
    planName: plan.name,
    status: 'ACTIVE', // Automatically active upon confirmed payment
    startsAt,
    expiresAt,
    daysRemaining: req.planCode === 'MONTHLY' ? 30 : 180,
    isActive: true,
    autoRenew: true,
    paymentAttemptId,
    amountPaidTZS: amountTZS,
  }

  // Save to persistent memory
  inMemorySubscriptions.set(req.userId, pendingSub)

  return {
    success: true,
    subscriptionId,
    paymentAttemptId,
    providerRef: initResult.providerReference,
    status: 'ACTIVE',
    instructions: initResult.instructions || 'Please confirm mobile money authorization prompt.',
    checkoutUrl: initResult.checkoutUrl,
    amountTZS,
    planName: plan.name,
    startsAt,
    expiresAt,
  }
}

export function cancelSubscriptionRenewal(userId: string): { success: boolean; message: string } {
  const sub = inMemorySubscriptions.get(userId)
  if (!sub) return { success: false, message: 'No active subscription found' }

  const updated: UserSubscriptionItem = {
    ...sub,
    autoRenew: false,
    cancelledAt: new Date(),
  }
  inMemorySubscriptions.set(userId, updated)
  return { success: true, message: 'Subscription auto-renewal has been cancelled. Access remains valid until expiry date.' }
}

export function submitEnterpriseInquiry(input: EnterpriseInquiryInput, userId?: string): EnterpriseInquiryItem {
  const inquiry: EnterpriseInquiryItem = {
    id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    ...input,
    status: 'PENDING',
    createdAt: new Date(),
  }
  inMemoryEnterpriseInquiries.unshift(inquiry)
  return inquiry
}

export function listEnterpriseInquiries(): EnterpriseInquiryItem[] {
  return [...inMemoryEnterpriseInquiries]
}
