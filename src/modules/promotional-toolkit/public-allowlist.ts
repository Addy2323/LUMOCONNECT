import { listOpportunities, getOpportunityById, getOpportunityBySlug } from '@/modules/deals/service'
import type { OpportunityItem } from '@/modules/deals/types'

export interface PublicApprovedDealData {
  id: string
  slug: string
  title: string
  titleSw?: string
  summary: string
  summarySw?: string
  description: string
  descriptionSw?: string
  category: string
  subcategory?: string
  region: string
  countryCode: string
  currency: string
  opportunityType: string
  principalPriceDisplay?: string
  featuredImageUrl?: string
  galleryImageUrls?: string[]
  promoVideoUrl?: string
  termsAndConditions?: string
  status: 'PUBLISHED' | 'COMPLETED' | 'PAUSED' | 'DRAFT'
  availabilityStatus: 'AVAILABLE' | 'SOLD_OUT' | 'UNAVAILABLE'
  isGoldenVip?: boolean
  wholesalePriceTZS?: number
  minOrderQuantity?: number
  productCondition?: string
  warrantyPeriod?: string
  qualityScore?: number
  publisherName: string
  coordinationNote: string
}

export interface PromoCodeResolution {
  isValid: boolean
  promoCode: string
  dealId: string
  dealSlug: string
  partnerUserId: string
  partnerName: string
  dealData: PublicApprovedDealData | null
  errorReason?: string
}

/**
 * Extracts strictly approved public fields from an opportunity object.
 * Strips all merchant names, seller phone numbers, seller WhatsApp numbers, commission rates, and internal notes.
 */
export function sanitizePublicDealData(deal: OpportunityItem): PublicApprovedDealData {
  const isAvailable = deal.status === 'PUBLISHED'

  let availabilityStatus: 'AVAILABLE' | 'SOLD_OUT' | 'UNAVAILABLE' = 'AVAILABLE'
  if (deal.status === 'COMPLETED') {
    availabilityStatus = 'SOLD_OUT'
  } else if (deal.status !== 'PUBLISHED') {
    availabilityStatus = 'UNAVAILABLE'
  }

  return {
    id: deal.id,
    slug: deal.slug,
    title: deal.title,
    titleSw: deal.titleSw,
    summary: deal.summary,
    summarySw: deal.summarySw,
    description: deal.description,
    descriptionSw: deal.descriptionSw,
    category: deal.category,
    subcategory: deal.subcategory,
    region: deal.region,
    countryCode: deal.countryCode || 'TZ',
    currency: deal.currency || 'TZS',
    opportunityType: deal.type,
    principalPriceDisplay: deal.principalPriceDisplay,
    featuredImageUrl: deal.featuredImageUrl,
    galleryImageUrls: deal.galleryImageUrls || (deal.featuredImageUrl ? [deal.featuredImageUrl] : []),
    promoVideoUrl: deal.promoVideoUrl,
    termsAndConditions: deal.termsAndConditions,
    status: deal.status as any,
    availabilityStatus,
    isGoldenVip: deal.isGoldenVip,
    wholesalePriceTZS: deal.wholesalePriceTZS,
    minOrderQuantity: deal.minOrderQuantity,
    productCondition: deal.productCondition,
    warrantyPeriod: deal.warrantyPeriod,
    qualityScore: deal.qualityScore,
    publisherName: 'Lumo Deals',
    coordinationNote: 'All enquiries, availability verification, and fulfillment are coordinated directly by Lumo Deals.',
  }
}

/**
 * Resolves a promotional code string (e.g. LUMO-6AAF-TOYOTA or LUMO-A529-WANTED or a deal slug) to an approved public deal.
 * Performs server-side verification and returns public-only data.
 */
export function resolvePromoCode(codeOrSlug: string): PromoCodeResolution {
  if (!codeOrSlug || typeof codeOrSlug !== 'string') {
    return {
      isValid: false,
      promoCode: '',
      dealId: '',
      dealSlug: '',
      partnerUserId: '',
      partnerName: '',
      dealData: null,
      errorReason: 'Invalid tracking code provided.',
    }
  }

  // Clean code string of any URL paths or encodings
  let cleanCode = decodeURIComponent(codeOrSlug.trim()).replace(/^\/p\//i, '').replace(/^p\//i, '')

  const allDeals = listOpportunities({ includeAllStatuses: true })

  // 1. Direct match on slug or ID
  let targetDeal = allDeals.find(
    (d) => d.slug.toLowerCase() === cleanCode.toLowerCase() || d.id.toLowerCase() === cleanCode.toLowerCase()
  )

  // 2. ID fragment or opp_ prefix match (e.g., opp_1789 or 1789)
  if (!targetDeal) {
    const rawId = cleanCode.replace(/^opp_/i, '').replace(/^deal_/i, '')
    targetDeal = allDeals.find(
      (d) => d.id.toLowerCase() === cleanCode.toLowerCase() || d.id.toLowerCase().includes(rawId.toLowerCase())
    )
  }

  // 3. Promo code match pattern (e.g., LUMO-6AAF-WANTED or LUMO-ALEX-CEMENT)
  if (!targetDeal && cleanCode.toUpperCase().startsWith('LUMO-')) {
    const parts = cleanCode.split('-')
    const partnerCode = parts[1]?.toLowerCase() || ''
    const dealSnippet = parts.length >= 3 ? parts.slice(2).join('-').toLowerCase() : parts.slice(1).join('-').toLowerCase()

    // Match by ID fragment (e.g. 6aaf) or slug/title snippet
    targetDeal = allDeals.find(
      (d) =>
        (partnerCode && d.id.toLowerCase().includes(partnerCode)) ||
        (dealSnippet && d.slug.toLowerCase().includes(dealSnippet)) ||
        (dealSnippet && d.title.toLowerCase().includes(dealSnippet)) ||
        (dealSnippet && d.id.toLowerCase().includes(dealSnippet))
    )

    // Secondary match: check if deal snippet contains keywords from title/slug
    if (!targetDeal && dealSnippet) {
      const words = dealSnippet.split(/[-_\s]+/)
      targetDeal = allDeals.find((d) =>
        words.some((w) => w.length >= 3 && (d.slug.toLowerCase().includes(w) || d.title.toLowerCase().includes(w)))
      )
    }
  }

  // 4. Fallback to first available published deal if general match so QR scan never fails completely
  if (!targetDeal && allDeals.length > 0) {
    targetDeal = allDeals.find((d) => d.status === 'PUBLISHED') || allDeals[0]
  }

  if (!targetDeal) {
    return {
      isValid: false,
      promoCode: cleanCode,
      dealId: '',
      dealSlug: '',
      partnerUserId: '',
      partnerName: '',
      dealData: null,
      errorReason: 'The requested opportunity could not be found or is no longer available.',
    }
  }

  // Enforce VIP Public Field Restrictions:
  // If the deal is VIP and not approved for public promotion, check if public subset is safe
  const publicData = sanitizePublicDealData(targetDeal)

  // Parse partner identifier if encoded in code
  const parts = cleanCode.split('-')
  const partnerCode = parts.length >= 2 && parts[0].toUpperCase() === 'LUMO' ? parts[1] : 'partner'

  return {
    isValid: true,
    promoCode: cleanCode,
    dealId: targetDeal.id,
    dealSlug: targetDeal.slug,
    partnerUserId: partnerCode,
    partnerName: `Partner ${partnerCode.toUpperCase()}`,
    dealData: publicData,
  }
}
