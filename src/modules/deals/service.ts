import { INITIAL_OPPORTUNITIES } from './mock-data'
import type { OpportunityItem, DealCreateInput } from './types'
import { toMinorUnits } from '@/lib/money'
import { requireActiveDealSubscription } from '@/modules/subscriptions/authorization'
import type { DealAccessDecision } from '@/modules/subscriptions/types'
import { matchesOpportunityCategory } from './taxonomy'

let inMemoryOpportunities: OpportunityItem[] = [...INITIAL_OPPORTUNITIES]

const RETIRED_BUNDLED_OPPORTUNITY_IDS = new Set([
  'opp_solar_tz_01',
  'opp_agrotech_tz_02',
  'opp_fintech_pos_03',
  'opp_kazitech_hr_04',
  'opp_safari_tourism_05',
  'opp_afyabora_health_06',
  'opp_emobility_boda_07',
])

// Load from localStorage in browser environment
function loadFromStorage() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('lumo_deals')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const activeStored = parsed.filter(
            (item: OpportunityItem) => !RETIRED_BUNDLED_OPPORTUNITY_IDS.has(item.id)
          )
          const storedIds = new Set(activeStored.map((p: OpportunityItem) => p.id))
          const missingInitial = INITIAL_OPPORTUNITIES.filter((init) => !storedIds.has(init.id))
          // Refresh presentation content for bundled opportunities while preserving
          // user-created deals and live participation/budget state.
          const refreshedStored = activeStored.map((storedItem: OpportunityItem) => {
            const bundledItem = INITIAL_OPPORTUNITIES.find((item) => item.id === storedItem.id)
            if (!bundledItem) return storedItem

            return {
              ...storedItem,
              title: bundledItem.title,
              summary: bundledItem.summary,
              description: bundledItem.description,
              principalPriceDisplay: bundledItem.principalPriceDisplay,
              featuredImageUrl: bundledItem.featuredImageUrl,
              galleryImageUrls: bundledItem.galleryImageUrls,
              expiryDate: bundledItem.expiryDate,
            }
          })
          const combined = [...refreshedStored, ...missingInitial]
          inMemoryOpportunities = combined.map((item) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
            totalBudgetTZS: item.totalBudgetTZS ? BigInt(item.totalBudgetTZS) : undefined,
            spentBudgetTZS: item.spentBudgetTZS ? BigInt(item.spentBudgetTZS) : BigInt(0),
          }))
          return
        }
      }
    } catch (e) {
      console.warn('Could not load deals from localStorage', e)
    }
  }
}

function syncToStorage() {
  if (typeof window !== 'undefined') {
    try {
      const serialized = inMemoryOpportunities.map((item) => ({
        ...item,
        totalBudgetTZS: item.totalBudgetTZS ? item.totalBudgetTZS.toString() : undefined,
        spentBudgetTZS: item.spentBudgetTZS ? item.spentBudgetTZS.toString() : '0',
      }))
      localStorage.setItem('lumo_deals', JSON.stringify(serialized))
      window.dispatchEvent(new Event('lumo:deals-updated'))
    } catch (e) {
      console.warn('Could not sync deals to localStorage', e)
    }
  }
}

// Initial load
loadFromStorage()

// Track enrolled users per deal to prevent duplicate participation
const inMemoryEnrollments: Map<string, Set<string>> = new Map() // dealId -> Set of userIds

export interface OpportunityFilterParams {
  query?: string
  category?: string
  type?: string
  region?: string
  minReward?: number
  sortBy?: 'recommended' | 'highest_reward' | 'newest' | 'ending_soon'
  includeAllStatuses?: boolean
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
  loadFromStorage()
  let items = [...inMemoryOpportunities]

  // Strictly enforce Maker-Checker segregation: Only PUBLISHED deals appear on public marketplace
  if (!filters?.includeAllStatuses) {
    items = items.filter((item) => item.status === 'PUBLISHED')
  }

  if (filters?.query && filters.query.trim()) {
    const q = filters.query.toLowerCase().trim()
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.subcategory?.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q)
    )
  }

  if (filters?.category && filters.category !== 'ALL') {
    items = items.filter((item) => matchesOpportunityCategory(item.category, filters.category!, item.subcategory))
  }

  if (filters?.type && filters.type !== 'ALL') {
    items = items.filter((item) => item.type === filters.type)
  }

  if (filters?.region && filters.region !== 'ALL') {
    items = items.filter((item) => item.region.toLowerCase().includes(filters.region!.toLowerCase()))
  }

  const rewardAmount = (item: OpportunityItem) => {
    if (item.rewardType === 'PERCENTAGE_COMMISSION') return 0
    const numericReward = item.rewardDisplay.match(/[\d,]+/)
    return numericReward ? Number(numericReward[0].replace(/,/g, '')) : 0
  }

  if (filters?.minReward && filters.minReward > 0) {
    items = items.filter((item) => {
      return rewardAmount(item) >= filters.minReward!
    })
  }

  if (filters?.sortBy === 'newest') {
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } else if (filters?.sortBy === 'highest_reward') {
    items.sort((a, b) => rewardAmount(b) - rewardAmount(a))
  } else if (filters?.sortBy === 'ending_soon') {
    items.sort((a, b) => (a.expiryDate?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.expiryDate?.getTime() ?? Number.MAX_SAFE_INTEGER))
  }

  return items
}

export function getOpportunityById(id: string): OpportunityItem | null {
  loadFromStorage()
  return inMemoryOpportunities.find((d) => d.id === id) || null
}

export function getOpportunityBySlug(slug: string): OpportunityItem | null {
  loadFromStorage()
  return inMemoryOpportunities.find((d) => d.slug === slug) || null
}

/**
 * Returns public-only summary. Redacts confidential terms, formulas, and contacts.
 */
export function getPublicDealSummary(slugOrId: string): PublicDealSummary | null {
  loadFromStorage()
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

/**
 * Returns full protected deal details with subscription guard.
 */
export function getProtectedOpportunityDetails(
  slugOrId: string,
  authContext?: {
    userId?: string
    userRole?: string
    userOrgId?: string
  }
): {
  success: boolean
  decision: DealAccessDecision
  data: ProtectedDealDetails | null
} {
  loadFromStorage()
  const item = inMemoryOpportunities.find((d) => d.slug === slugOrId || d.id === slugOrId)

  if (!item) {
    const deniedDecision: DealAccessDecision = {
      isAuthorized: false,
      canViewFullDetails: false,
      canJoinDeal: false,
      requiresSubscription: false,
      hasActiveSubscription: false,
      isOwner: false,
      isAdmin: false,
      reason: 'Opportunity not found.',
    }
    return { success: false, decision: deniedDecision, data: null }
  }

  const decision = requireActiveDealSubscription({
    userId: authContext?.userId,
    userRole: authContext?.userRole,
    userOrgId: authContext?.userOrgId,
    dealIdOrSlug: item.id,
    intent: 'view',
  })

  if (!decision.isAuthorized) {
    return { success: false, decision, data: null }
  }

  const userEnrollments = inMemoryEnrollments.get(item.id)
  const isAlreadyJoined = authContext?.userId ? (userEnrollments?.has(authContext.userId) ?? false) : false

  const protectedDetails: ProtectedDealDetails = {
    ...item,
    isSubscribed: decision.hasActiveSubscription,
    isOwner: decision.isOwner,
    isAdmin: decision.isAdmin,
    isAlreadyJoined,
    commissionFormula:
      item.rewardType === 'PERCENTAGE_COMMISSION'
        ? `${((item as any).percentageBps ?? 1000) / 100}% on Net Invoice Value`
        : 'Fixed Tiered Milestone Bounty',
    salesAssetsUrl: `https://vault.lumo.co.tz/deals/${item.slug}/assets.zip`,
    businessContactEmail: `partner-desk@${item.slug.replace(/-/g, '')}.co.tz`,
    businessContactPhone: '+255 700 123 456',
    eligibilityRequirements: [
      'Active LUMO Commercial Pass',
      'Verified National Identity (NIDA) or Tax PIN',
      'Compliant Lead Tracking Link Attribution',
    ],
    deliverableChecklist: [
      'Customer KYC and contact authorization verification',
      'Signed Commercial Proposal or Proof of Purchase receipt',
      'Submission within standard 30-day attribution window',
    ],
  }

  return { success: true, decision, data: protectedDetails }
}

export const getDealDetailsForUser = getProtectedOpportunityDetails

/**
 * Joins a deal with subscription guard.
 */
export function joinOpportunityDeal(
  dealId: string,
  authContext?: {
    userId?: string
    userRole?: string
    userOrgId?: string
    proposalNotes?: string
  }
): {
  success: boolean
  message: string
  decision: DealAccessDecision
  trackingCode?: string
  isAlreadyEnrolled?: boolean
} {
  loadFromStorage()
  const item = inMemoryOpportunities.find((d) => d.id === dealId || d.slug === dealId)

  const defaultDeniedDecision: DealAccessDecision = {
    isAuthorized: false,
    canViewFullDetails: false,
    canJoinDeal: false,
    requiresSubscription: true,
    hasActiveSubscription: false,
    isOwner: false,
    isAdmin: false,
    reason: 'Deal not found.',
  }

  if (!item) {
    return { success: false, message: 'Deal not found.', decision: defaultDeniedDecision }
  }

  const decision = requireActiveDealSubscription({
    userId: authContext?.userId,
    userRole: authContext?.userRole,
    userOrgId: authContext?.userOrgId,
    dealIdOrSlug: item.id,
    intent: 'join',
  })

  if (!decision.isAuthorized) {
    return {
      success: false,
      message: decision.reason || 'Active membership plan required to enroll in this commercial deal.',
      decision,
    }
  }

  let enrolled = inMemoryEnrollments.get(item.id)
  if (!enrolled) {
    enrolled = new Set()
    inMemoryEnrollments.set(item.id, enrolled)
  }

  const userId = authContext?.userId || 'usr_anonymous'
  const trackingCode = `LUMO-${userId.slice(-4).toUpperCase()}-${item.slug.slice(0, 6).toUpperCase()}`

  if (enrolled.has(userId)) {
    return {
      success: true,
      message: 'You are already an active participant in this deal. View your links in the Deal Room.',
      decision,
      trackingCode,
      isAlreadyEnrolled: true,
    }
  }

  enrolled.add(userId)
  item.activePartnerCount += 1
  syncToStorage()

  if (typeof window !== 'undefined') {
    try {
      const existingJoined: any[] = JSON.parse(localStorage.getItem('lumo_partner_joined_deals') || '[]')
      const isAlready = existingJoined.some((d) => d.opportunityId === item.id || d.id === item.id)
      if (!isAlready) {
        const partnerCode = (authContext?.userId || 'alex').toLowerCase().replace(/[^a-z0-9]/g, '_')
        const newJoined = {
          id: `joined_${Date.now()}_${item.id.slice(-4)}`,
          opportunityId: item.id,
          title: item.title,
          businessName: item.companyName,
          category: item.category,
          status: 'ACTIVE',
          joinedDate: new Date().toLocaleDateString(),
          rewardDisplay: item.rewardDisplay,
          rewardValueTZS: Number((item as any).baseRewardValue || (item as any).rewardValue || 50000),
          trackingLink: `https://lumo.co.tz/d/${item.slug}?ref=${trackingCode}`,
          referralId: trackingCode,
          promoCode: `${partnerCode.slice(0, 4).toUpperCase()}${item.slug.slice(0, 4).toUpperCase()}`,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://lumo.co.tz/d/${item.slug}?ref=${trackingCode}`,
          activeLeadsCount: 0,
          verifiedConversionsCount: 0,
          earningsEarnedTZS: 0,
          deliverablesSummary: item.description,
          evidenceRequired: item.termsAndConditions || 'Verified transaction matching.',
          milestoneProgressPercent: 0,
          canExit: true,
          coverImageUrl: item.featuredImageUrl,
          promoVideoUrl: item.promoVideoUrl,
        }
        localStorage.setItem('lumo_partner_joined_deals', JSON.stringify([newJoined, ...existingJoined]))
        window.dispatchEvent(new Event('lumo:joined-deals-updated'))
      }
    } catch (e) {
      console.warn('Could not persist joined deal to storage', e)
    }
  }

  return {
    success: true,
    message: `Successfully enrolled in "${item.title}". Your commercial link is ready.`,
    decision,
    trackingCode,
    isAlreadyEnrolled: false,
  }
}

export const joinDeal = joinOpportunityDeal

/**
 * Creates a new Deal Opportunity in memory and persists to storage.
 */
export function createDealOpportunity(
  input: DealCreateInput,
  organizationId = 'org_kijani_solar',
  companyName = 'Verified Business Ltd',
  initialStatus: 'PENDING_REVIEW' | 'PUBLISHED' | 'DRAFT' = 'PUBLISHED'
): OpportunityItem {
  const newSlug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

  const computedStatus = (input as any).status || initialStatus

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
    subcategory: input.subcategory,
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
    principalPriceDisplay: input.principalPriceTZS
      ? `TZS ${input.principalPriceTZS.toLocaleString()}`
      : 'Price on request',
    totalBudgetTZS: input.totalBudgetTZS ? toMinorUnits(input.totalBudgetTZS) : undefined,
    spentBudgetTZS: BigInt(0),
    maxPartners: input.maxPartners,
    activePartnerCount: 0,
    isFeatured: false,
    featuredImageUrl: input.featuredImageUrl,
    promoVideoUrl: input.promoVideoUrl,
    galleryImageUrls: input.galleryImageUrls,
    termsAndConditions: input.termsAndConditions,
    status: computedStatus,
    createdAt: new Date(),
    expiryDate: new Date(Date.now() + (input.expiryDays ?? 30) * 24 * 60 * 60 * 1000),
  }

  inMemoryOpportunities.unshift(newOpp)
  syncToStorage()
  return newOpp
}

export function listAdminDeals(): Array<{
  id: string
  slug: string
  title: string
  businessName: string
  category: string
  type: string
  rewardValueTZS: number
  budgetTZS: number
  spentTZS: number
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'PAUSED' | 'CLOSED' | 'ARCHIVED'
  version: number
  activePartners: number
  createdAt: string
  publishedAt?: string
  checkerNotes?: string
  featuredImageUrl?: string
  promoVideoUrl?: string
  galleryImageUrls?: string[]
  summary?: string
  description?: string
  termsAndConditions?: string
}> {
  loadFromStorage()
  return inMemoryOpportunities.map((opp) => ({
    id: opp.id,
    slug: opp.slug,
    title: opp.title,
    businessName: opp.companyName,
    category: opp.category,
    type: opp.type,
    rewardValueTZS: 50000,
    budgetTZS: opp.totalBudgetTZS ? Number(opp.totalBudgetTZS) / 100 : 10000000,
    spentTZS: 0,
    status: (opp.status === 'PENDING_REVIEW' || opp.status === 'DRAFT'
      ? 'UNDER_REVIEW'
      : opp.status === 'PUBLISHED'
      ? 'PUBLISHED'
      : 'APPROVED') as any,
    version: 1,
    activePartners: opp.activePartnerCount,
    createdAt: opp.createdAt.toISOString().slice(0, 10),
    featuredImageUrl: opp.featuredImageUrl,
    promoVideoUrl: opp.promoVideoUrl,
    galleryImageUrls: opp.galleryImageUrls,
    summary: opp.summary,
    description: opp.description,
    termsAndConditions: opp.termsAndConditions,
  }))
}

export function updateDealStatus(
  dealId: string,
  status: 'PUBLISHED' | 'REJECTED' | 'PAUSED' | 'ARCHIVED' | 'APPROVED',
  notes?: string
) {
  loadFromStorage()
  const opp = inMemoryOpportunities.find((o) => o.id === dealId || o.slug === dealId)
  if (opp) {
    opp.status = (status === 'PUBLISHED' || status === 'APPROVED' ? 'PUBLISHED' : status) as any
    syncToStorage()
  }
}

export const createOpportunity = createDealOpportunity

export function resetOpportunities(items: OpportunityItem[] = []): void {
  inMemoryOpportunities = [...items]
  inMemoryEnrollments.clear()
  syncToStorage()
}

export function seedTestOpportunity(opp: OpportunityItem): void {
  const existingIdx = inMemoryOpportunities.findIndex((o) => o.id === opp.id)
  if (existingIdx >= 0) {
    inMemoryOpportunities[existingIdx] = opp
  } else {
    inMemoryOpportunities.push(opp)
  }
  syncToStorage()
}
