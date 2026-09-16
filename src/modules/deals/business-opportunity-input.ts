import { OpportunityType } from '@prisma/client'
import { z } from 'zod'

const wizardTypes: Record<string, OpportunityType> = {
  COMMERCIAL_DEAL: 'PRODUCT_SALES',
  PRODUCT_OPPORTUNITY: 'PRODUCT_SALES',
  AFFILIATE_PROGRAMME: 'PRODUCT_SALES',
  LEAD_GENERATION: 'QUALIFIED_LEADS',
  REVERSE_OPPORTUNITY: 'REVERSE_SOURCING',
}

const schema = z.object({
  title: z.string().trim().min(1, 'Opportunity title is required.').max(120),
  type: z.nativeEnum(OpportunityType),
  publicSummary: z.string().trim().min(1).max(2000),
  subscriberDescription: z.string().trim().min(1).max(50000),
  rewardValueTZS: z.number().finite().nonnegative().max(1000000000000),
  estimatedBudgetTZS: z.number().finite().nonnegative().max(1000000000000),
  attributionWindowDays: z.number().int().min(1).max(180).default(30),
  status: z.enum(['DRAFT', 'UNDER_REVIEW']),
}).passthrough()

/** Accept the deployed wizard's aliases while persisting real Prisma enum values. */
export function parseBusinessOpportunityInput(input: unknown) {
  const raw = z.record(z.unknown()).parse(input)
  const type = raw.type ?? raw.opportunityType
  const status = raw.status ?? 'UNDER_REVIEW'
  return schema.parse({
    ...raw,
    type: typeof type === 'string' ? wizardTypes[type] ?? type : type,
    publicSummary: raw.publicSummary ?? raw.summary ?? raw.title,
    subscriberDescription: raw.subscriberDescription ?? raw.description ?? raw.publicSummary ?? raw.summary ?? raw.title,
    estimatedBudgetTZS: raw.estimatedBudgetTZS ?? raw.budgetTZS,
    status: status === 'SUBMITTED' || status === 'PENDING_REVIEW' ? 'UNDER_REVIEW' : status,
  })
}
