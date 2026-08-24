export type BusinessSidebarSection =
  // Workspace
  | 'overview'
  | 'create_opportunity'
  | 'my_opportunities'
  | 'partners_applications'
  | 'deal_rooms'
  // Performance
  | 'deal_performance'
  | 'conversions_results'
  | 'rewards_commissions'
  | 'payments_funding'
  // Growth
  | 'campaigns'
  | 'partner_discovery'
  | 'audience_insights'
  | 'reports_exports'
  // Account / System
  | 'tracking_integrations'
  | 'billing_subscription'
  | 'business_profile'
  | 'team_access'
  | 'settings_security'
  | 'help_support'

export type OpportunityType =
  | 'COMMERCIAL_DEAL'
  | 'ADVERTISING_CAMPAIGN'
  | 'AFFILIATE_PROGRAMME'
  | 'CUSTOMER_ACQUISITION'
  | 'LEAD_GENERATION'
  | 'B2B_INTRODUCTION'
  | 'PRODUCT_OPPORTUNITY'
  | 'REVERSE_OPPORTUNITY'

export type CommercialResultType =
  | 'COMPLETED_SALE'
  | 'QUALIFIED_LEAD'
  | 'NEW_CUSTOMER'
  | 'BOOKING'
  | 'SUBSCRIPTION'
  | 'APPROVED_CONTENT'
  | 'PRODUCT_DELIVERY'
  | 'COMMERCIAL_INTRODUCTION'
  | 'SIGNED_DISTRIBUTOR_CONTRACT'

export type RewardStructureType =
  | 'PERCENTAGE_COMMISSION'
  | 'FIXED_REWARD'
  | 'COST_PER_LEAD'
  | 'COST_PER_ACQUISITION'
  | 'RECURRING_COMMISSION'
  | 'MILESTONE_BONUS'
  | 'BOUNTY'
  | 'HYBRID_COMPENSATION'

export type TrackingMethod =
  | 'LUMO_TRACKING_LINK'
  | 'REFERRAL_ID'
  | 'PROMO_CODE'
  | 'QR_CODE'
  | 'API'
  | 'WEBHOOK'
  | 'CSV_UPLOAD'
  | 'MANUAL_EVIDENCE_APPROVAL'

export type OpportunityLifecycleStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'RETURNED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED'

export interface OpportunityVersionHistory {
  version: number
  amendedAt: string
  changesDescription: string
  approvedByLumo?: string
  partnerConsentRequired: boolean
}

export interface BusinessOpportunityItem {
  id: string
  slug: string
  title: string
  publicSummary: string
  subscriberDescription: string
  type: OpportunityType
  category: string
  region: string
  commercialResult: CommercialResultType
  rewardStructure: RewardStructureType
  rewardValueTZS: number
  rewardPercent?: number
  budgetTZS: number
  spentTZS: number
  status: OpportunityLifecycleStatus
  version: number
  activePartners: number
  totalConversions: number
  trackingMethod: TrackingMethod
  startDate: string
  endDate: string
  attributionWindowDays: number
  partnerDeliverables: string
  evidenceRequired: string
  cancellationTerms: string
  coverImageUrl?: string
  promoVideoUrl?: string
  galleryImageUrls?: string[]
  marketingAssets?: {
    id: string
    name: string
    url: string
    size: string
    type: 'IMAGE' | 'VIDEO' | 'PDF'
  }[]
  versionHistory?: OpportunityVersionHistory[]
  createdAt: string
  campaignId?: string
}

export type PartnerApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'REJECTED'
  | 'BLOCKED'
  | 'INVITED'

export interface BusinessPartnerItem {
  id: string
  partnerName: string
  partnerType: 'INFLUENCER' | 'AFFILIATE' | 'DISTRIBUTOR' | 'SALES_AGENT' | 'CONTENT_CREATOR' | 'COMMERCIAL_BROKER'
  avatar: string
  phoneMasked: string
  channels: string[]
  region: string
  performanceScore: number // e.g. 96/100
  completedDeals: number
  conversionQuality: string // e.g. 98.4%
  cancellationRate: string // e.g. 1.2%
  businessRating: number // e.g. 4.9/5
  appliedOpportunityId: string
  appliedOpportunityTitle: string
  applicationDate: string
  applicationPitch?: string
  status: PartnerApplicationStatus
  joinedProgramDate?: string
  totalEarnedTZS: number
  verifiedConversionsCount: number
}

export type ConversionLifecycleStatus =
  | 'REPORTED'
  | 'PENDING_VALIDATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'REVERSED'

export interface BusinessConversionRecord {
  id: string
  referenceId: string
  opportunityId: string
  opportunityTitle: string
  partnerId: string
  partnerName: string
  customerRef: string
  amountTZS: number
  rewardEarnedTZS: number
  trackingMethod: TrackingMethod
  status: ConversionLifecycleStatus
  reportedAt: string
  verifiedAt?: string
  evidenceUrl?: string
  challengeReason?: string
  adjustmentNote?: string
}

export type RewardLifecycleStatus =
  | 'TRACKED'
  | 'PENDING'
  | 'VALIDATING'
  | 'APPROVED'
  | 'PAYABLE'
  | 'PAID'
  | 'REJECTED'
  | 'REVERSED'

export interface BusinessRewardObligation {
  id: string
  conversionRef: string
  partnerName: string
  opportunityTitle: string
  grossRewardTZS: number
  status: RewardLifecycleStatus
  dueDate: string
  funded: boolean
  adjustmentHistory?: {
    date: string
    reason: string
    adjustedBy: string
    deltaTZS: number
  }[]
}

export interface RewardFundingBalance {
  availableBalanceTZS: number
  committedToActiveDealsTZS: number
  pendingConfirmationTZS: number
  rewardsPayableTZS: number
  rewardsPaidTZS: number
  refundableBalanceTZS: number
  safeguardingProvider: string // e.g. "CRDB Bank Escrow / Vodacom Trust Account"
  lastReconciliationDate: string
}

export interface BusinessCampaignGroup {
  id: string
  title: string
  objective: string
  totalBudgetTZS: number
  spentTZS: number
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'SCHEDULED' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'
  associatedOpportunityIds: string[]
  channels: string[]
  impressions: number
  conversions: number
}

export interface DealRoomSession {
  id: string
  opportunityTitle: string
  partnerName: string
  partnerType: string
  stage: 'OFFER_SUBMITTED' | 'COUNTER_OFFER' | 'TERMS_AGREED' | 'DIGITAL_SIGNATURE' | 'MILESTONE_PROGRESS' | 'COMPLETED' | 'DISPUTED'
  currentProposedRewardTZS: number
  deliverablesSummary: string
  contractSigned: boolean
  messagesCount: number
  lastUpdated: string
}

export interface BusinessTeamMember {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'CAMPAIGN_MANAGER' | 'FINANCE_OFFICER' | 'SUPPORT_AGENT'
  status: 'ACTIVE' | 'INVITED' | 'REVOKED'
  lastLogin: string
  joinedDate: string
}

export interface BusinessSaaSSubscription {
  planName: string // e.g. "Pro Commercial Enterprise"
  cycle: 'MONTHLY' | 'ANNUAL'
  priceTZS: number
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED'
  activeOpportunitiesUsed: number
  activeOpportunitiesLimit: number
  partnerSeatsUsed: number
  partnerSeatsLimit: number
  aiAttributionIncluded: boolean
  nextBillingDate: string
  invoices: {
    invoiceNumber: string
    date: string
    amountTZS: number
    status: 'PAID' | 'PENDING'
    pdfUrl: string
  }[]
}
