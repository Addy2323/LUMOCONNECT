import { z } from 'zod'

export const OpportunityTypeSchema = z.enum([
  'PRODUCT_SALES',
  'QUALIFIED_LEADS',
  'CONTENT_CREATION',
  'CUSTOMER_ACQUISITION',
  'DISTRIBUTOR_SEARCH',
  'B2B_INTRODUCTION',
  'REVERSE_SOURCING',
  'SUBSCRIPTION_PROMOTION',
  'MILESTONE_BOUNTY',
])

export const RewardTypeSchema = z.enum([
  'PERCENTAGE_COMMISSION',
  'FIXED_COMMISSION',
  'COST_PER_LEAD',
  'COST_PER_ACQUISITION',
  'FIXED_CAMPAIGN_FEE',
  'TIERED_COMMISSION',
  'MILESTONE_BONUS',
  'HYBRID',
  'CUSTOM_DEAL_TERMS',
])

export const DealCreateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  opportunityType: OpportunityTypeSchema,
  category: z.string().min(2, 'Category is required'),
  subcategory: z.string().min(2).optional(),
  summary: z.string().min(10, 'Summary must be at least 10 characters').max(300),
  description: z.string().min(30, 'Provide a detailed description of deliverables'),
  rewardType: RewardTypeSchema,
  baseRewardValue: z.number().positive('Reward value must be greater than 0'),
  principalPriceTZS: z.number().positive('Principal price must be greater than 0').optional(),
  currency: z.string().default('TZS'),
  percentageBps: z.number().min(10).max(10000).optional(), // 100 = 1%
  fixedRewardTZS: z.number().nonnegative().optional(),
  customRewardDisplay: z.string().optional(),
  customRewardDetail: z.string().optional(),
  customFormulaDescription: z.string().optional(),
  attributionWindowDays: z.number().int().min(1).max(180).default(30),
  maxPartners: z.number().int().positive().optional(),
  totalBudgetTZS: z.number().positive().optional(),
  region: z.string().default('All Tanzania'),
  termsAndConditions: z.string().min(20, 'Please specify verification terms and conditions'),
  requiresApproval: z.boolean().default(true),
  featuredImageUrl: z.string().optional(),
  promoVideoUrl: z.string().optional(),
  galleryImageUrls: z.array(z.string()).optional(),
  expiryDays: z.number().int().min(1).max(365).optional(),
  isGoldenVip: z.boolean().optional(),
  wholesalePriceTZS: z.number().positive().optional(),
  minOrderQuantity: z.number().int().positive().optional(),
  productCondition: z.enum(['BRAND_NEW', 'FACTORY_SEALED', 'CERTIFIED_REFURBISHED', 'GRADE_A']).optional(),
  warrantyPeriod: z.string().optional(),
  inspectionWindowHours: z.number().int().min(24).max(168).optional(),
  sellerPhone: z.string().optional(),
  sellerWhatsApp: z.string().optional(),
})

export type DealCreateInput = z.infer<typeof DealCreateSchema>

export interface OpportunityItem {
  id: string
  organizationId: string
  companyName: string
  companyLogo?: string
  isVerified: boolean
  type: z.infer<typeof OpportunityTypeSchema>
  title: string
  titleSw?: string
  slug: string
  summary: string
  summarySw?: string
  description: string
  descriptionSw?: string
  category: string
  subcategory?: string
  countryCode: string
  region: string
  currency: string
  rewardType: z.infer<typeof RewardTypeSchema>
  rewardDisplay: string
  rewardDetail: string
  principalPriceDisplay?: string
  potentialBonus?: string
  totalBudgetTZS?: bigint
  spentBudgetTZS: bigint
  maxPartners?: number
  activePartnerCount: number
  isFeatured: boolean
  featuredImageUrl?: string
  promoVideoUrl?: string
  galleryImageUrls?: string[]
  termsAndConditions?: string
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'PAUSED' | 'COMPLETED'
  createdAt: Date
  completedAt?: Date
  expiryDate?: Date
  // Golden VIP & 24h Early Access
  isGoldenVip?: boolean
  vipAccessStartAt?: Date
  vipReleaseAt?: Date
  // Product Quality & Specifications
  wholesalePriceTZS?: number
  minOrderQuantity?: number
  productCondition?: 'BRAND_NEW' | 'FACTORY_SEALED' | 'CERTIFIED_REFURBISHED' | 'GRADE_A'
  warrantyPeriod?: string
  inspectionWindowHours?: number
  qualityScore?: number
  sellerPhone?: string
  sellerWhatsApp?: string
  sellerLocation?: string
  // Lumo Dealers Operating Model (Version 1.0)
  publisherName?: string
  coordinationNote?: string
  termsVersion?: number
}

export type ReferralSubmissionType = 'CUSTOMER_REFERRAL' | 'COORDINATION_ENQUIRY'

export type ReferralTicketStage =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'AVAILABILITY_CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CLOSED'
  | 'DRAFT'
  | 'QUALIFIED'
  | 'CONTACTED'
  | 'CUSTOMER_INTERESTED'
  | 'INTRODUCTION_SCHEDULED'
  | 'INTRODUCED'
  | 'NEGOTIATING'
  | 'SUCCESSFUL'
  | 'REWARD_PENDING'
  | 'REWARD_APPROVED'
  | 'REWARD_PAID'
  | 'DUPLICATE'
  | 'MORE_INFO_REQUIRED'
  | 'RESUBMITTED'
  | 'REJECTED'
  | 'CUSTOMER_NOT_INTERESTED'

export type ConnectionLifecycleStage = ReferralTicketStage

export type ReferralClosureReason =
  | 'UNAVAILABLE'
  | 'DUPLICATE'
  | 'CANCELLED'
  | 'UNSUCCESSFUL'
  | 'OTHER'

export type ReferralCaseStage = ReferralTicketStage

export type DirectRewardStatus =
  | 'NOT_YET_EARNED'
  | 'AWAITING_MERCHANT_PAYMENT'
  | 'MERCHANT_REPORTS_PAID'
  | 'PARTNER_CONFIRMS_RECEIPT'
  | 'DISPUTED'

export interface ReferralTicketDTO {
  id: string
  ticketReference: string // e.g. LUMO-CON-000728 or LUMO-REF-000123
  dealId: string
  opportunityId?: string | null
  dealTitle: string
  dealSlug: string
  submissionType: ReferralSubmissionType
  partnerUserId: string
  promotionalCode?: string | null
  partnerName: string
  partnerPhoneMasked: string
  partnerWhatsAppMasked?: string
  partnerPhone?: string
  partnerWhatsApp?: string
  // Customer Identity & Connection Details (LUMO 60-Step Process)
  entityType?: 'INDIVIDUAL' | 'BUSINESS' | 'INSTITUTION' | 'GOVERNMENT' | 'ASSOCIATION' | 'OTHER' | string | null
  customerRole?: string | null
  companyName?: string | null
  contactPerson?: string | null
  customerCountry?: string | null
  customerRegion?: string | null
  customerCity?: string | null
  customerEmail?: string | null
  customerWebsite?: string | null
  relationshipWithCustomer?: string | null
  spokenToCustomer?: string | null
  customerInterestLevel?: string | null
  lumoMayContact?: string | null
  customerSuitability?: string | null
  relevantCapabilities?: string[] | null
  supportingDocuments?: string[] | null
  isDuplicatePotential?: boolean
  declarationAccepted?: boolean

  customerFirstName?: string | null
  customerLastName?: string | null
  customerPhoneMasked?: string | null
  customerPhone?: string | null
  contactPermissionConfirmed: boolean
  quantity: number
  deliveryDestination?: string | null
  specifications?: string | null
  terminalOption?: string | null
  additionalNotes?: string | null
  acceptedTermsVersion: number
  stage: ReferralTicketStage | ConnectionLifecycleStage
  stageUpdatedAt: string
  assignedCoordinator?: string | null
  nextAction?: string | null
  nextActionDueDate?: string | null
  partnerVisibleUpdate?: string | null
  closureReason?: ReferralClosureReason | string | null
  requestedInfoNotes?: string | null
  rejectionReasonNotes?: string | null
  rewardAmountTZS?: number | null
  rewardDisplay?: string | null
  rewardStatus?: string | null
  merchantPaymentReportedAt?: string | null
  merchantPaymentReference?: string | null
  merchantPaymentNotes?: string | null
  partnerReceiptConfirmedAt?: string | null
  disputeReason?: string | null
  disputedAt?: string | null
  createdAt: string
  updatedAt: string

  // Admin-only fields (omitted in partner responses)
  merchantOrgId?: string | null
  merchantName?: string | null
  coordinatorNotes?: string | null
}

export interface ReferralCase {
  id: string
  reference: string // e.g. LUMO-CON-000728, LUMO-REF-000123
  dealId: string
  dealTitle: string
  dealSlug: string
  partnerUserId: string
  partnerName: string
  partnerPhone: string
  partnerPhoneMasked: string
  entityType?: string
  customerRole?: string
  companyName?: string
  contactPerson?: string
  customerEmail?: string
  customerCountry?: string
  customerRegion?: string
  customerCity?: string
  relationshipWithCustomer?: string
  spokenToCustomer?: string
  customerInterestLevel?: string
  lumoMayContact?: string
  customerSuitability?: string
  relevantCapabilities?: string[]
  isDuplicatePotential?: boolean
  customerFirstName: string
  customerLastName: string
  customerPhone: string // Normalized E.164 e.g. +255712345678
  customerPhoneMasked: string
  contactPermissionConfirmed: boolean
  additionalNotes?: string
  assignedCoordinator?: string
  stage: ReferralCaseStage
  stageUpdatedAt: string
  nextAction?: string
  nextActionDueDate?: string
  coordinatorNotes?: string
  partnerVisibleUpdate?: string
  closureReason?: ReferralClosureReason | string
  requestedInfoNotes?: string
  rejectionReasonNotes?: string
  rewardAmountTZS: number
  rewardDisplay: string
  rewardStatus: DirectRewardStatus
  merchantPaymentReportedAt?: string
  merchantPaymentReference?: string
  merchantPaymentNotes?: string
  partnerReceiptConfirmedAt?: string
  disputeReason?: string
  disputedAt?: string
  createdAt: string
  updatedAt: string
}

