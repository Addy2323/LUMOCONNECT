import { INITIAL_OPPORTUNITIES } from './mock-data'
import type { OpportunityItem, DealCreateInput } from './types'
import { toMinorUnits } from '@/lib/money'
import { requireActiveDealSubscription } from '@/modules/subscriptions/authorization'
import type { DealAccessDecision } from '@/modules/subscriptions/types'

let inMemoryOpportunities: OpportunityItem[] = [...INITIAL_OPPORTUNITIES]

// Track enrolled users per deal to prevent duplicate participation
const inMemoryEnrollments: Map<string, Set<string>> = new Map() // dealId -> Set of userIds

export interface OpportunityFilterParams {
  query?: string
  category?: string
  type?: string
  region?: string
  minReward?: number
  sortBy?: 'recommended' | 'highest_reward' | 'newest' | 'ending_soon'
}

export interface PublicDealSummary {
  id: string
  slug: string
  title: string
  summary: string
  category: string
  countryCode: string
  region: string
  companyName: string
  companyLogo?: string
  isVerified: boolean
  indicativeRewardDisplay: string
  activePartnerCount: number
  isFeatured: boolean
  status: string
  createdAt: Date
}

export interface ProtectedDealDetails extends OpportunityItem {
  isSubscribed: boolean
  isOwner: boolean
  isAdmin: boolean
  isAlreadyJoined: boolean
  commissionFormula: string
  salesAssetsUrl?: string
  businessContactEmail?: string
  businessContactPhone?: string
  eligibilityRequirements: string[]
  deliverableChecklist: string[]
}

export function listOpportunities(filters?: OpportunityFilterParams): OpportunityItem[] {
  let items = [...inMemoryOpportunities]

  if (filters?.query && filters.query.trim()) {
    const q = filters.query.toLowerCase().trim()
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }

  if (filters?.category && filters.category !== 'ALL') {
    items = items.filter((item) => item.category.toLowerCase() === filters.category!.toLowerCase())
  }

  if (filters?.type && filters.type !== 'ALL') {
    items = items.filter((item) => item.type === filters.type)
  }

  if (filters?.region && filters.region !== 'ALL') {
    items = items.filter((item) => item.region.toLowerCase().includes(filters.region!.toLowerCase()))
  }

  if (filters?.sortBy === 'newest') {
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  return items
}

/**
 * Returns public-only summary. Redacts confidential terms, formulas, and contacts.
 */
export function getPublicDealSummary(slugOrId: string): PublicDealSummary | null {
  const item = inMemoryOpportunities.find((d) => d.slug === slugOrId || d.id === slugOrId)
  if (!item) return null

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    category: item.category,
    countryCode: item.countryCode,
    region: item.region,
    companyName: item.companyName,
    companyLogo: item.companyLogo,
    isVerified: item.isVerified,
    indicativeRewardDisplay: item.rewardDisplay,
    activePartnerCount: item.activePartnerCount,
    isFeatured: item.isFeatured,
    status: item.status,
    createdAt: item.createdAt,
  }
}

export function getOpportunityBySlug(slug: string): OpportunityItem | undefined {
  return inMemoryOpportunities.find((item) => item.slug === slug || item.id === slug)
}

export function getOpportunityById(id: string): OpportunityItem | undefined {
  return inMemoryOpportunities.find((item) => item.id === id)
}

/**
 * Retrieves full protected deal details with strict subscription/ownership authorization check.
 */
export function getProtectedOpportunityDetails(
  slugOrId: string,
  params: { userId?: string; userRole?: string; userOrgId?: string }
): { success: boolean; data?: ProtectedDealDetails; decision: DealAccessDecision; error?: string } {
  const deal = getOpportunityById(slugOrId) || getOpportunityBySlug(slugOrId)
  if (!deal) {
    return {
      success: false,
      decision: {
        isAuthorized: false,
        canViewFullDetails: false,
        canJoinDeal: false,
        isOwner: false,
        isAdmin: false,
        hasActiveSubscription: false,
        requiresSubscription: false,
        reason: 'Deal not found',
      },
      error: 'Deal not found',
    }
  }

  const decision = requireActiveDealSubscription({
    userId: params.userId,
    userRole: params.userRole,
    userOrgId: params.userOrgId,
    dealIdOrSlug: deal.id,
    intent: 'view',
  })

  if (!decision.isAuthorized) {
    return {
      success: false,
      decision,
      error: decision.reason,
    }
  }

  const enrolledUsers = inMemoryEnrollments.get(deal.id) || new Set()
  const isAlreadyJoined = params.userId ? enrolledUsers.has(params.userId) : false

  const protectedData: ProtectedDealDetails = {
    ...deal,
    isSubscribed: decision.hasActiveSubscription,
    isOwner: decision.isOwner,
    isAdmin: decision.isAdmin,
    isAlreadyJoined,
    commissionFormula:
      deal.rewardType === 'PERCENTAGE_COMMISSION'
        ? 'Base Gross Order × Tier % (TRA 5% statutory withholding automatically computed)'
        : 'Fixed verification fee per verified sales milestone deposited to M-Pesa',
    salesAssetsUrl: `https://assets.lumo.co.tz/deals/${deal.slug}/sales-kit.zip`,
    businessContactEmail: `partnerships@${deal.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.tz`,
    businessContactPhone: '+255 22 211 8900',
    eligibilityRequirements: [
      'Active verified LUMO partner membership',
      'Valid M-Pesa / Airtel Money payout account registered',
      'No self-referrals or unverified synthetic traffic',
    ],
    deliverableChecklist: [
      'Share tracking link or promotional QR code with prospective clients',
      'Ensure buyer completes purchase through official LUMO payment checkout',
      'Review real-time conversion status in Partner Earnings Portal',
    ],
  }

  return {
    success: true,
    data: protectedData,
    decision,
  }
}

/**
 * Joins a deal after enforcing active subscription and preventing duplicates.
 */
export function joinOpportunityDeal(
  slugOrId: string,
  params: { userId: string; userRole?: string; userOrgId?: string; proposalNotes?: string }
): { success: boolean; trackingCode?: string; message: string; isAlreadyEnrolled?: boolean; decision: DealAccessDecision } {
  const deal = getOpportunityById(slugOrId) || getOpportunityBySlug(slugOrId)
  if (!deal) {
    return {
      success: false,
      message: 'Deal not found.',
      decision: {
        isAuthorized: false,
        canViewFullDetails: false,
        canJoinDeal: false,
        isOwner: false,
        isAdmin: false,
        hasActiveSubscription: false,
        requiresSubscription: false,
      },
    }
  }

  const decision = requireActiveDealSubscription({
    userId: params.userId,
    userRole: params.userRole,
    userOrgId: params.userOrgId,
    dealIdOrSlug: deal.id,
    intent: 'join',
  })

  if (!decision.isAuthorized) {
    return {
      success: false,
      message: decision.reason || 'Active LUMO subscription required to join deals.',
      decision,
    }
  }

  if (!inMemoryEnrollments.has(deal.id)) {
    inMemoryEnrollments.set(deal.id, new Set())
  }
  const enrollments = inMemoryEnrollments.get(deal.id)!

  if (enrollments.has(params.userId)) {
    return {
      success: true,
      isAlreadyEnrolled: true,
      trackingCode: `LUMO-${deal.companyLogo || 'TZ'}-${params.userId.slice(-4).toUpperCase()}`,
      message: 'You are already an active participant in this deal.',
      decision,
    }
  }

  // Record participation and increment active partner count
  enrollments.add(params.userId)
  deal.activePartnerCount += 1

  const trackingCode = `LUMO-${deal.companyLogo || 'TZ'}-${params.userId.slice(-4).toUpperCase()}`

  return {
    success: true,
    isAlreadyEnrolled: false,
    trackingCode,
    message: 'Successfully enrolled into deal! Your unique tracking code is generated.',
    decision,
  }
}

export function createDealOpportunity(
  input: DealCreateInput,
  organizationId: string,
  companyName: string = 'My Business Ltd'
): OpportunityItem {
  const newSlug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

  const newOpp: OpportunityItem = {
    id: `opp_${Date.now()}`,
    organizationId,
    companyName,
    companyLogo: companyName.slice(0, 2).toUpperCase(),
    isVerified: true,
    type: input.opportunityType,
    title: input.title,
    slug: newSlug,
    summary: input.summary,
    description: input.description,
    category: input.category,
    countryCode: 'TZ',
    region: input.region,
    currency: input.currency,
    rewardType: input.rewardType,
    rewardDisplay:
      input.rewardType === 'PERCENTAGE_COMMISSION'
        ? `${((input.percentageBps ?? 1000) / 100).toFixed(0)}% Commission`
        : `TZS ${input.baseRewardValue.toLocaleString()}`,
    rewardDetail:
      input.rewardType === 'PERCENTAGE_COMMISSION' ? 'on completed order total' : 'per verified completion',
    totalBudgetTZS: input.totalBudgetTZS ? toMinorUnits(input.totalBudgetTZS) : undefined,
    spentBudgetTZS: BigInt(0),
    maxPartners: input.maxPartners,
    activePartnerCount: 0,
    isFeatured: false,
    status: 'PUBLISHED',
    createdAt: new Date(),
  }

  inMemoryOpportunities.unshift(newOpp)
  return newOpp
}

export const createOpportunity = createDealOpportunity

export function resetOpportunities(items: OpportunityItem[] = []): void {
  inMemoryOpportunities = [...items]
  inMemoryEnrollments.clear()
}

export function seedTestOpportunity(opp: OpportunityItem): void {
  const existingIdx = inMemoryOpportunities.findIndex((o) => o.id === opp.id)
  if (existingIdx >= 0) {
    inMemoryOpportunities[existingIdx] = opp
  } else {
    inMemoryOpportunities.push(opp)
  }
}


