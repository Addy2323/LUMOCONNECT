export type InternationalSubmitterType =
  | 'INDIVIDUAL'
  | 'BUSINESS'
  | 'ORGANIZATION'
  | 'INVESTOR'
  | 'BUYER'
  | 'SELLER'
  | 'PROPERTY_OWNER'
  | 'OTHER'

export type InternationalCategory =
  | 'BUSINESS_OPPORTUNITY'
  | 'PRODUCTS_SUPPLY'
  | 'PROPERTY'
  | 'VEHICLES'
  | 'INVESTMENT'
  | 'BUYER_REQUIREMENT'
  | 'SELLER_OFFER'
  | 'DISTRIBUTION'
  | 'IMPORT_EXPORT'
  | 'PARTNERSHIP'
  | 'CONTRACT_TENDER'
  | 'HOSPITALITY'
  | 'AGRICULTURE'
  | 'TECHNOLOGY'
  | 'PROFESSIONAL_SERVICES'
  | 'OTHER'

export type InternationalIntent = 'LOOKING_FOR' | 'OFFERING'

export type InternationalSubmissionStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CONTACTING_SUBMITTER'
  | 'INFORMATION_REQUIRED'
  | 'VERIFIED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'EXPIRED'
  | 'ARCHIVED'

export type PreferredContactMethod = 'WHATSAPP' | 'EMAIL' | 'BOTH'

export interface InternationalSubmission {
  id: string
  reference: string // e.g. LUMO-INT-2026-00421
  submittedByUserId?: string | null
  submitterType: InternationalSubmitterType
  fullName: string
  organization?: string
  countryCode: string // ISO 3166-1 alpha-2, e.g. 'AE'
  countryName: string
  city?: string
  category: InternationalCategory
  intent: InternationalIntent
  title: string
  description: string
  declaredValue: number
  currency: string // ISO 4217, e.g. 'USD', 'EUR', 'GBP', 'KES', 'AED', 'TZS'
  whatNeededFromLumo?: string
  whatsapp: string
  email: string
  preferredContact: PreferredContactMethod
  website?: string
  documents?: string[]
  status: InternationalSubmissionStatus
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

export type CommunicationChannel = 'WHATSAPP' | 'EMAIL' | 'PHONE' | 'INTERNAL_NOTE'
export type CommunicationDirection = 'OUTBOUND' | 'INBOUND' | 'SYSTEM'

export interface InternationalCommunication {
  id: string
  submissionId: string
  channel: CommunicationChannel
  direction: CommunicationDirection
  subject: string
  messageBody: string
  actorName: string
  createdAt: string
}

export type InternationalOpportunityStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED'

export interface InternationalOpportunity {
  id: string
  submissionId: string
  reference: string
  countryCode: string
  countryName: string
  countryFlag: string
  city?: string
  category: InternationalCategory
  intent: InternationalIntent
  title: string
  summary: string // Public teaser
  fullDescription: string // Private member unlocked
  commercialTerms?: string // Private member unlocked
  opportunityValue: number
  currency: string
  estimatedValueTZS: number
  rewardAmount?: number
  rewardCurrency?: string
  rewardType: 'PERCENTAGE' | 'FIXED'
  verificationStatus: 'VERIFIED' | 'UNDER_DILIGENCE'
  verificationBadges: string[]
  status: InternationalOpportunityStatus
  inquiryCount: number
  publishedAt: string
  expiresAt?: string
}

export type InternationalPlanCode = 'INT_MONTHLY' | 'INT_SEMI_ANNUAL' | 'INT_ANNUAL'

export interface InternationalSubscriptionPlan {
  code: InternationalPlanCode
  name: string
  billingPeriodMonths: number
  basePriceUSD: number
  prices: Record<string, number> // Currency code -> price
  savingsDisplay?: string
  features: string[]
}

export type InternationalMembershipStatus = 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED'

export interface InternationalMembership {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
  planCode: InternationalPlanCode
  planName: string
  currency: string
  amountPaid: number
  paymentMethod: string
  paymentReference: string
  startsAt: string
  expiresAt: string
  status: InternationalMembershipStatus
  autoRenew: boolean
  grantedByAdmin?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface InternationalInquiry {
  id: string
  opportunityId: string
  opportunityReference: string
  opportunityTitle: string
  memberId: string
  memberName: string
  memberEmail: string
  memberPhone?: string
  inquiryType: 'INTERESTED' | 'HAVE_CONNECTION'
  message: string
  status: 'NEW' | 'CONTACTED' | 'INTRODUCED' | 'CLOSED'
  createdAt: string
}
