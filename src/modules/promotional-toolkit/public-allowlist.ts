import { listOpportunities } from '@/modules/deals/service'
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
    galleryImageUrls: [...new Set([deal.featuredImageUrl, ...(deal.galleryImageUrls || [])].filter((url): url is string => Boolean(url)))],
    promoVideoUrl: deal.promoVideoUrl,
    termsAndConditions: deal.termsAndConditions,
    status: deal.status === 'PENDING_REVIEW' ? 'DRAFT' : deal.status,
    availabilityStatus,
    isGoldenVip: deal.isGoldenVip,
    wholesalePriceTZS: deal.wholesalePriceTZS,
    minOrderQuantity: deal.minOrderQuantity,
    productCondition: deal.productCondition,
    warrantyPeriod: deal.warrantyPeriod,
    qualityScore: deal.qualityScore,
    publisherName: 'Lumo Dealers',
    coordinationNote: 'All enquiries, availability verification, and fulfillment are coordinated directly by Lumo Dealers.',
  }
}

/**
 * Resolves a promotional code string (e.g. LUMO-6AAF-TOYOTA or LUMO-A529-WANTED or a deal slug) to an approved public deal.
 * Performs server-side verification and returns public-only data.
 */
export function resolvePromoCode(codeOrSlug: string, referralCode?: string): PromoCodeResolution {
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

  const cleanCode = codeOrSlug.trim()
  const allDeals = listOpportunities({ includeAllStatuses: true }).filter((deal) => ['PUBLISHED', 'PAUSED', 'COMPLETED'].includes(deal.status))

  // 1. Direct match on slug or ID
  let targetDeal = allDeals.find(
    (d) => d.slug.toLowerCase() === cleanCode.toLowerCase() || d.id.toLowerCase() === cleanCode.toLowerCase()
  )

  // 2. Promo code match pattern (e.g., LUMO-6AAF-WANTED or LUMO-ALEX-CEMENT)
  if (!targetDeal && cleanCode.toUpperCase().startsWith('LUMO-')) {
    const parts = cleanCode.split('-')
    const dealSnippet = parts.length >= 3 ? parts.slice(2).join('-').toLowerCase() : parts.slice(1).join('-').toLowerCase()

    // Match the product portion, never the partner identifier.
    const matches = allDeals.filter(
      (d) =>
        (dealSnippet && d.slug.toLowerCase().includes(dealSnippet)) ||
        (dealSnippet && d.title.toLowerCase().includes(dealSnippet)) ||
        (dealSnippet && d.id.toLowerCase().includes(dealSnippet))
    )
    // Legacy links are supported only when the product match is unambiguous.
    if (matches.length === 1) targetDeal = matches[0]
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
  const attributionCode = referralCode?.trim() || cleanCode
  const parts = attributionCode.split('-')
  const partnerCode = parts.length >= 2 && parts[0].toUpperCase() === 'LUMO' ? parts[1] : 'partner'

  return {
    isValid: true,
    promoCode: attributionCode,
    dealId: targetDeal.id,
    dealSlug: targetDeal.slug,
    partnerUserId: partnerCode,
    partnerName: `Partner ${partnerCode.toUpperCase()}`,
    dealData: publicData,
  }
}
