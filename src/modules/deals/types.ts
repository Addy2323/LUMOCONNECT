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
])

export const DealCreateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  opportunityType: OpportunityTypeSchema,
  category: z.string().min(2, 'Category is required'),
  summary: z.string().min(10, 'Summary must be at least 10 characters').max(300),
  description: z.string().min(30, 'Provide a detailed description of deliverables'),
  rewardType: RewardTypeSchema,
  baseRewardValue: z.number().positive('Reward value must be greater than 0'),
  currency: z.string().default('TZS'),
  percentageBps: z.number().min(10).max(10000).optional(), // 100 = 1%
  fixedRewardTZS: z.number().nonnegative().optional(),
  attributionWindowDays: z.number().int().min(1).max(180).default(30),
  maxPartners: z.number().int().positive().optional(),
  totalBudgetTZS: z.number().positive().optional(),
  region: z.string().default('All Tanzania'),
  termsAndConditions: z.string().min(20, 'Please specify verification terms and conditions'),
  requiresApproval: z.boolean().default(true),
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
  slug: string
  summary: string
  description: string
  category: string
  countryCode: string
  region: string
  currency: string
  rewardType: z.infer<typeof RewardTypeSchema>
  rewardDisplay: string
  rewardDetail: string
  potentialBonus?: string
  totalBudgetTZS?: bigint
  spentBudgetTZS: bigint
  maxPartners?: number
  activePartnerCount: number
  isFeatured: boolean
  featuredImageUrl?: string
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'PAUSED' | 'COMPLETED'
  createdAt: Date
  expiryDate?: Date
}
