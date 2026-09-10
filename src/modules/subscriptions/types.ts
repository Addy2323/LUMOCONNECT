import { z } from 'zod'

export type SubscriptionPlanCode = 'MONTHLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'GOLDEN_VIP' | 'ENTERPRISE'

export type SubscriptionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FAILED'

export interface SubscriptionPlanItem {
  id: string
  code: SubscriptionPlanCode
  name: string
  billingPeriod: 'MONTHLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'
  priceTZS: number
  priceDisplay: string
  periodDisplay: string
  equivalentMonthlyDisplay?: string
  savingsDisplay?: string
  description: string
  isEnterprise: boolean
  isBestValue?: boolean
  isGoldenVip?: boolean
  freeVipMonthsBonus?: number
  features: string[]
  ctaLabel: string
}

export interface UserSubscriptionItem {
  id: string
  userId: string
  planCode: SubscriptionPlanCode
  planName: string
  status: SubscriptionStatus
  startsAt: Date
  expiresAt: Date
  daysRemaining: number
  isActive: boolean
  autoRenew: boolean
  cancelledAt?: Date
  paymentAttemptId?: string
  amountPaidTZS?: number
  isGoldenVip?: boolean
  hasGoldenVipAccess?: boolean
  freeVipMonthsBonus?: number
  vipAccessExpiresAt?: Date
}

export const EnterpriseInquirySchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  businessName: z.string().min(2, 'Business name is required'),
  workEmail: z.string().email('Valid work email is required'),
  phoneNumber: z.string().min(9, 'Phone number is required'),
  teamSize: z.string().min(1, 'Team size is required'),
  industry: z.string().min(2, 'Industry is required'),
  expectedDealVolume: z.string().min(1, 'Expected deal volume is required'),
  aiRequirements: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export type EnterpriseInquiryInput = z.infer<typeof EnterpriseInquirySchema>

export interface EnterpriseInquiryItem extends EnterpriseInquiryInput {
  id: string
  userId?: string
  status: 'PENDING' | 'CONTACTED' | 'AGREED' | 'DECLINED'
  createdAt: Date
}

export interface SubscriptionCheckoutRequest {
  userId: string
  userRole?: string
  planCode: 'MONTHLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'GOLDEN_VIP'
  paymentMethod: 'MPESA' | 'AIRTEL' | 'TIGO' | 'HALOPESA'
  phoneNumber: string
  amountTZS?: number
  returnTo?: string
  intent?: 'view' | 'join'
}

export interface SubscriptionCheckoutResult {
  success: boolean
  subscriptionId: string
  paymentAttemptId: string
  providerRef: string
  status: 'PENDING' | 'ACTIVE' | 'FAILED'
  instructions: string
  checkoutUrl?: string
  amountTZS: number
  planName: string
  startsAt?: Date
  expiresAt?: Date
  error?: string
}

export interface DealAccessDecision {
  isAuthorized: boolean
  canViewFullDetails: boolean
  canJoinDeal: boolean
  isOwner: boolean
  isAdmin: boolean
  hasActiveSubscription: boolean
  hasGoldenVipAccess?: boolean
  subscriptionStatus?: SubscriptionStatus
  reason?: string
  requiresSubscription: boolean
  redirectUrl?: string
}
