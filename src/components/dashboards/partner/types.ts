export type PartnerSidebarSection =
  // Workspace
  | 'overview'
  | 'discover'
  | 'saved_opportunities'
  | 'my_deals'
  | 'leads_referrals'
  | 'deal_rooms'
  // Performance
  | 'performance'
  | 'tracking_links_codes'
  | 'earnings_payouts'
  | 'notifications'
  // Grow
  | 'sales_toolkit'
  | 'training_center'
  | 'partner_score'
  // Account
  | 'profile_verification'
  | 'subscription'
  | 'payout_methods_tax'
  | 'settings_security'
  | 'help_support'

export type PartnerOpportunityType =
  | 'COMMERCIAL_DEAL'
  | 'ADVERTISING_CAMPAIGN'
  | 'AFFILIATE_PROGRAMME'
  | 'CUSTOMER_ACQUISITION'
  | 'LEAD_GENERATION'
  | 'B2B_INTRODUCTION'
  | 'PRODUCT_OPPORTUNITY'
  | 'REVERSE_OPPORTUNITY'

export interface PartnerOpportunitySummary {
  id: string
  slug: string
  title: string
  businessName: string
  businessLogo?: string
  isBusinessVerified: boolean
  category: string
  region: string
  type: PartnerOpportunityType
  rewardDisplay: string
  rewardValueTZS: number
  activePartnersCount: number
  closingDate: string
  isSaved?: boolean
  coverImageUrl?: string
  promoVideoUrl?: string
  isConfidentialGated?: boolean // Needs subscription
  publicSummary: string
  confidentialTerms?: {
    subscriberDescription: string
    commissionRatePercent?: number
    milestoneBonuses?: string
    attributionWindowDays: number
    qualifyingDeliverables: string
    evidenceRequired: string
  }
}

export type JoinedDealStatus =
  | 'APPLIED'
  | 'AWAITING_APPROVAL'
  | 'ACTIVE'
  | 'MILESTONES'
  | 'COMPLETED'
  | 'REJECTED'
  | 'EXITED'
  | 'CANCELLED'

export interface JoinedDealItem {
  id: string
  opportunityId: string
  title: string
  businessName: string
  category: string
  status: JoinedDealStatus
  joinedDate: string
  rewardDisplay: string
  rewardValueTZS: number
  trackingLink: string
  referralId: string
  promoCode: string
  qrCodeUrl: string
  activeLeadsCount: number
  verifiedConversionsCount: number
  earningsEarnedTZS: number
  deliverablesSummary: string
  evidenceRequired: string
  milestoneProgressPercent: number
  canExit: boolean
  rejectionReason?: string
  coverImageUrl?: string
  promoVideoUrl?: string
}

export type LeadLifecycleStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VALIDATING'
  | 'QUALIFIED'
  | 'REJECTED'
  | 'CONVERTED'
  | 'EXPIRED'

export interface PartnerLeadItem {
  id: string
  dealId: string
  dealTitle: string
  businessName: string
  customerName: string
  customerPhoneMasked: string
  customerEmail?: string
  productInterested: string
  referralDate: string
  estimatedValueTZS: number
  status: LeadLifecycleStatus
  consentConfirmed: boolean
  notes?: string
  evidenceFileName?: string
  rejectionReason?: string
  appealStatus?: 'NONE' | 'APPEALED' | 'REVIEWING' | 'RESOLVED'
  earnedRewardTZS?: number
  updatedAt: string
}

export interface PartnerDealRoom {
  id: string
  dealTitle: string
  businessName: string
  stage: 'OFFER_SUBMITTED' | 'TERMS_AGREED' | 'DIGITAL_SIGNATURE' | 'MILESTONE_PROGRESS' | 'COMPLETED' | 'DISPUTED'
  agreedBountyTZS: number
  contractSigned: boolean
  deliverables: string
  lastMessage: string
  lastUpdated: string
}

export interface PartnerPerformanceMetrics {
  verifiedClicks: number
  qualifiedLeads: number
  verifiedConversions: number
  revenueGeneratedTZS: number
  conversionRatePercent: number
  averageDealValueTZS: number
  approvedRewardsTZS: number
  rejectedResultsCount: number
  reversalsCount: number
  milestoneProgressPercent: number
  partnerScore: number // e.g. 96/100
}

export interface PartnerTrackingLinkItem {
  id: string
  dealTitle: string
  url: string
  promoCode: string
  qrCodeUrl: string
  clicks: number
  conversions: number
  conversionRate: string
  attributionWindowDays: number
  isActive: boolean
  createdAt: string
}

export type RewardStatus =
  | 'TRACKED'
  | 'PENDING'
  | 'VALIDATING'
  | 'APPROVED'
  | 'PAYABLE'
  | 'PAID'
  | 'REJECTED'
  | 'REVERSED'

export interface PartnerEarningsRecord {
  id: string
  referenceId: string
  dealTitle: string
  businessName: string
  grossRewardTZS: number
  taxWithheldTZS: number // 5% TRA Withholding Tax
  platformFeeTZS: number // 0% for Partners
  netRewardTZS: number
  status: RewardStatus
  trackedDate: string
  payoutDate?: string
  payoutMethod?: string
}

export interface PartnerPayoutRequest {
  id: string
  requestedAt: string
  amountTZS: number
  taxWithheldTZS: number
  netAmountTZS: number
  payoutMethod: string
  accountNumberMasked: string
  status: 'REQUESTED' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED'
  referenceNumber: string
}

export interface PartnerScoreDetail {
  overallScore: number // e.g. 96
  tierName: string // e.g. "Diamond Elite Seller"
  conversionQualityPercent: number // 99.2%
  responsivenessScore: number // 98%
  complianceRating: number // 5.0
  completedDealsCount: number // 24
  tipsToLevelUp: string[]
}

export interface PartnerPayoutMethod {
  id: string
  type: 'VODACOM_MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'CRDB_BANK' | 'NMB_BANK'
  accountTitle: string
  accountNumberMasked: string
  isDefault: boolean
  isVerified: boolean
}

export interface PartnerSubscriptionPlan {
  planName: string // e.g. "Semi-Annual Access Pass"
  status: 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED'
  daysRemaining: number
  priceTZS: number
  cycle: 'MONTHLY' | 'SEMI_ANNUAL'
  expiryDate: string
  autoRenew: boolean
  expiresAtISO?: string
}

export interface PartnerKYCProfile {
  fullName: string
  phoneMasked: string
  email: string
  partnerType: 'INFLUENCER' | 'AFFILIATE' | 'DISTRIBUTOR' | 'SALES_AGENT' | 'CONTENT_CREATOR' | 'COMMERCIAL_BROKER'
  nidaNumberMasked: string
  tinNumberMasked: string
  isIdentityVerified: boolean
  region: string
  channels: string[]
  audienceSize: string
}
