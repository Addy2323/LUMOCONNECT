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

// ============================================================================
// ADMIN INTERNATIONAL DEALS & OPPORTUNITIES SPECIFICATION TYPES
// ============================================================================

export type InternationalDealType =
  | 'Sales Deal'
  | 'Advertising Campaign'
  | 'Affiliate Program'
  | 'Customer Acquisition'
  | 'Lead Generation'
  | 'B2B Opportunity'
  | 'Distributor Opportunity'
  | 'Supplier Opportunity'
  | 'Sourcing Opportunity'
  | 'Product Opportunity'
  | 'Service Opportunity'
  | 'Travel Opportunity'
  | 'Property Opportunity'
  | 'SaaS Opportunity'
  | 'Event Promotion'
  | 'Business Introduction'
  | 'Franchise Opportunity'
  | 'Import Opportunity'
  | 'Export Opportunity'
  | 'Other'

export type InternationalDealStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'ENDED'
  | 'EXPIRED'
  | 'REJECTED'
  | 'ARCHIVED'

export type InternationalVerificationStatus =
  | 'UNVERIFIED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'EXPIRED'
  | 'REVOKED'

export type InternationalRewardType =
  | 'FIXED'
  | 'PERCENTAGE'
  | 'CPA'
  | 'CPL'
  | 'RECURRING'
  | 'BOUNTY'
  | 'MILESTONE'
  | 'HYBRID'

export type InternationalCurrency =
  | 'USD'
  | 'TZS'
  | 'EUR'
  | 'GBP'
  | 'KES'
  | 'UGX'
  | 'ZAR'
  | 'AED'
  | 'CNY'
  | 'INR'

export interface MilestoneBonusRule {
  targetCount: number
  bonusAmount: number
  currency: string
}

export interface InternationalRewardStructure {
  rewardType: InternationalRewardType
  currency: InternationalCurrency
  fixedReward?: number
  commissionRate?: number
  cpaAmount?: number
  cplAmount?: number
  recurringRate?: number
  recurringDurationMonths?: number
  milestoneBonusRules?: MilestoneBonusRule[]
  hybridSummary?: string
  displayLabel?: string
}

export interface InternationalPartnerRequirements {
  eligibilityMode: 'OPEN' | 'RESTRICTED' | 'INVITATION_ONLY' | 'REGION_RESTRICTED'
  partnerTypes: string[]
  minFollowers?: number
  minPartnerScore?: number
  requireKYC: boolean
  requireKYB: boolean
  allowedCountries?: string[]
  socialPlatforms?: string[]
}

export interface InternationalTrackingConfig {
  trackingMethod: 'LINK' | 'PROMO_CODE' | 'QR_CODE' | 'UTM' | 'API' | 'MANUAL'
  destinationUrl?: string
  campaignCode?: string
  promoCode?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

export interface InternationalVerificationDetails {
  sourceType:
    | 'Direct brand relationship'
    | 'Official company website'
    | 'Partner agency'
    | 'Authorized representative'
    | 'Verified business contact'
    | 'Public commercial source'
    | 'Internal LUMO sourcing'
  sourceUrl?: string
  contactPersonName?: string
  contactPersonEmail?: string
  contactPersonPhone?: string
  verificationStatus: InternationalVerificationStatus
  verifiedByAdminId?: string
  verifiedAt?: string
  lastCheckedAt?: string
}

export interface AdminInternationalDealItem {
  id: string
  reference: string // e.g. LUMO-INT-DEAL-00892
  title: string
  shortDescription: string
  fullDescription: string
  imageUrl?: string
  dealType: InternationalDealType
  originCountryCode: string // e.g. 'AE'
  originCountryName: string // e.g. 'United Arab Emirates'
  originCountryFlag: string // 🇦🇪
  targetCountryCode: string // e.g. 'TZ'
  targetCountryName: string // e.g. 'Tanzania'
  targetCountryFlag: string // 🇹🇿
  targetRegion: string // 'East Africa' | 'Africa' | 'Global'
  targetCities?: string[]
  remoteOnline: boolean
  crossBorder: boolean
  dealLanguage: string
  requiredOutcome: string
  successCondition: string
  rewardStructure: InternationalRewardStructure
  partnerRequirements: InternationalPartnerRequirements
  trackingConfig: InternationalTrackingConfig
  verificationDetails: InternationalVerificationDetails
  status: InternationalDealStatus
  isFeatured: boolean
  isTrending: boolean
  publishedAt?: string
  scheduledAt?: string
  expiresAt?: string
  maxPartnersAllowed?: number
  activePartnerCount: number
  totalApplicationsCount: number
  totalConversionsCount: number
  totalRevenueGeneratedUSD: number
  totalRewardsPaidUSD: number
  lumoFeesEarnedUSD: number
  createdAt: string
  updatedAt: string
}

export interface CreateInternationalDealWizardInput {
  title: string
  shortDescription: string
  fullDescription: string
  imageUrl?: string
  dealType: InternationalDealType
  originCountryCode: string
  originCountryName: string
  targetCountryCode: string
  targetCountryName: string
  targetRegion: string
  targetCities?: string[]
  remoteOnline: boolean
  crossBorder: boolean
  dealLanguage: string
  requiredOutcome: string
  successCondition: string
  rewardStructure: InternationalRewardStructure
  partnerRequirements: InternationalPartnerRequirements
  trackingConfig: InternationalTrackingConfig
  verificationDetails: InternationalVerificationDetails
  scheduledAt?: string
  expiresAt?: string
  maxPartnersAllowed?: number
  isFeatured?: boolean
  isTrending?: boolean
}

export type InternationalApplicationStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAITLISTED'
  | 'WITHDRAWN'
  | 'SUSPENDED'

export interface InternationalApplicationItem {
  id: string
  dealId: string
  dealReference: string
  dealTitle: string
  partnerUserId: string
  partnerName: string
  partnerEmail: string
  partnerPhone?: string
  partnerCountry: string
  partnerScore: number
  completedDealsCount: number
  socialFollowersCount?: number
  applicationNote?: string
  status: InternationalApplicationStatus
  reviewedByAdminId?: string
  reviewedAt?: string
  createdAt: string
}

