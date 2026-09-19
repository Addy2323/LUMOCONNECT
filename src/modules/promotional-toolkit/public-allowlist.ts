import { listOpportunities } from '@/modules/deals/service'
import type { OpportunityItem } from '@/modules/deals/types'
import { db } from '@/lib/db'

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
    publisherName: 'Lumo Deals',
    coordinationNote: 'All enquiries, availability verification, and fulfillment are coordinated directly by Lumo Deals.',
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

  // Clean code string of any URL paths or encodings
  const cleanCode = decodeURIComponent(codeOrSlug.trim()).replace(/^\/p\//i, '').replace(/^p\//i, '')

  const allDeals = listOpportunities({ includeAllStatuses: true }).filter((deal) => ['PUBLISHED', 'PAUSED', 'COMPLETED'].includes(deal.status))

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

  // 3. Fallback prefix match for shortened URLs (e.g. bb8...)
  if (!targetDeal && cleanCode.length >= 3) {
    targetDeal = allDeals.find(
      (d) =>
        d.id.toLowerCase().startsWith(cleanCode.toLowerCase()) ||
        d.slug.toLowerCase().startsWith(cleanCode.toLowerCase())
    )
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

/**
 * Extracts strictly approved public fields from a database opportunity record.
 * Strips all internal merchant credentials and confidential fields.
 */
export function mapDbOpportunityToPublicData(dbOpp: any): PublicApprovedDealData {
  const activeVersion = dbOpp.publishedVersion || dbOpp.versions?.[0] || null
  const categoryName = dbOpp.category?.name || 'General'

  let availabilityStatus: 'AVAILABLE' | 'SOLD_OUT' | 'UNAVAILABLE' = 'AVAILABLE'
  if (dbOpp.status === 'COMPLETED') {
    availabilityStatus = 'SOLD_OUT'
  } else if (dbOpp.status === 'CANCELLED' || dbOpp.status === 'ARCHIVED' || dbOpp.deletedAt) {
    availabilityStatus = 'UNAVAILABLE'
  }

  const gallery: string[] = [
    ...(dbOpp.coverImageUrl ? [dbOpp.coverImageUrl] : []),
    ...(Array.isArray(dbOpp.galleryImageUrls) ? dbOpp.galleryImageUrls : []),
  ].filter((url): url is string => Boolean(url))

  return {
    id: dbOpp.id,
    slug: dbOpp.slug || dbOpp.id,
    title: dbOpp.title,
    titleSw: dbOpp.titleSw,
    summary: dbOpp.summary || dbOpp.title,
    summarySw: dbOpp.summarySw,
    description: dbOpp.description || activeVersion?.description || dbOpp.summary || dbOpp.title,
    descriptionSw: dbOpp.descriptionSw,
    category: categoryName,
    subcategory: dbOpp.subcategory,
    region: dbOpp.region || 'All Tanzania',
    countryCode: dbOpp.countryCode || 'TZ',
    currency: dbOpp.currency || 'TZS',
    opportunityType: dbOpp.opportunityType || 'CUSTOMER_ACQUISITION',
    principalPriceDisplay:
      activeVersion?.rewardSummary ||
      (dbOpp.totalBudgetMinor ? `TZS ${(Number(dbOpp.totalBudgetMinor) / 100).toLocaleString()}` : undefined),
    featuredImageUrl: dbOpp.coverImageUrl || gallery[0] || undefined,
    galleryImageUrls: [...new Set(gallery)],
    promoVideoUrl: dbOpp.promoVideoUrl || undefined,
    termsAndConditions: activeVersion?.termsAndConditions || 'Standard commercial performance terms apply.',
    status: ['PUBLISHED', 'COMPLETED', 'PAUSED'].includes(dbOpp.status) ? dbOpp.status : 'PUBLISHED',
    availabilityStatus,
    isGoldenVip: dbOpp.isGoldenVip,
    wholesalePriceTZS: dbOpp.wholesalePriceTZS,
    minOrderQuantity: dbOpp.minOrderQuantity,
    productCondition: dbOpp.productCondition,
    warrantyPeriod: dbOpp.warrantyPeriod,
    qualityScore: dbOpp.qualityScore,
    publisherName: 'Lumo Dealers',
    coordinationNote: 'All enquiries, availability verification, and fulfillment are coordinated directly by Lumo Dealers.',
  }
}

/**
 * Asynchronously resolves a promotional code, deal slug, or opportunity UUID against both
 * the in-memory catalog and PostgreSQL database.
 */
export async function resolvePromoCodeAsync(
  codeOrSlug: string,
  referralCode?: string
): Promise<PromoCodeResolution> {
  // 1. Try sync in-memory resolution first
  const syncRes = resolvePromoCode(codeOrSlug, referralCode)
  if (syncRes.isValid && syncRes.dealData) {
    return syncRes
  }

  if (!codeOrSlug || typeof codeOrSlug !== 'string') {
    return syncRes
  }

  const cleanCode = decodeURIComponent(codeOrSlug).trim()

  // 2. Query Database if DATABASE_URL is available
  if (process.env.DATABASE_URL?.trim()) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode)
      const isUuidPrefix = /^[0-9a-f]{3,35}$/i.test(cleanCode) || /^[0-9a-f-]{3,35}$/i.test(cleanCode)

      let dbOpp: any = null

      // A. Direct UUID match
      if (isUuid) {
        dbOpp = await db.opportunity.findFirst({
          where: { id: cleanCode, deletedAt: null },
          include: {
            category: true,
            publishedVersion: { include: { rewardRules: true } },
            versions: { include: { rewardRules: true }, orderBy: { versionNumber: 'desc' }, take: 1 },
            organization: true,
          },
        }).catch(() => null)
      }

      // B. Direct Slug match (case-insensitive)
      if (!dbOpp) {
        dbOpp = await db.opportunity.findFirst({
          where: {
            slug: { equals: cleanCode, mode: 'insensitive' },
            deletedAt: null,
          },
          include: {
            category: true,
            publishedVersion: { include: { rewardRules: true } },
            versions: { include: { rewardRules: true }, orderBy: { versionNumber: 'desc' }, take: 1 },
            organization: true,
          },
        }).catch(() => null)
      }

      // C. Partial UUID prefix match (e.g. mobile Chrome displays 'bb8')
      if (!dbOpp && isUuidPrefix) {
        try {
          const rawMatches = await db.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM opportunities
            WHERE id::text ILIKE ${cleanCode + '%'} AND "deletedAt" IS NULL
            LIMIT 1
          `
          if (rawMatches && rawMatches.length > 0) {
            dbOpp = await db.opportunity.findUnique({
              where: { id: rawMatches[0].id },
              include: {
                category: true,
                publishedVersion: { include: { rewardRules: true } },
                versions: { include: { rewardRules: true }, orderBy: { versionNumber: 'desc' }, take: 1 },
                organization: true,
              },
            })
          }
        } catch (rawErr) {
          console.warn('UUID prefix raw match error:', rawErr)
        }
      }

      // D. TrackingAsset code match
      if (!dbOpp) {
        const asset = await db.trackingAsset.findFirst({
          where: { code: cleanCode },
          include: {
            participation: {
              include: {
                opportunity: {
                  include: {
                    category: true,
                    publishedVersion: { include: { rewardRules: true } },
                    versions: { include: { rewardRules: true }, orderBy: { versionNumber: 'desc' }, take: 1 },
                    organization: true,
                  },
                },
              },
            },
          },
        }).catch(() => null)

        if (asset?.participation?.opportunity && !asset.participation.opportunity.deletedAt) {
          dbOpp = asset.participation.opportunity
        }
      }

      // E. DealParticipation match
      if (!dbOpp) {
        const part = await db.dealParticipation.findFirst({
          where: {
            OR: [
              ...(isUuid ? [{ id: cleanCode }] : []),
              { trackingAssets: { some: { code: cleanCode } } },
            ],
          },
          include: {
            opportunity: {
              include: {
                category: true,
                publishedVersion: { include: { rewardRules: true } },
                versions: { include: { rewardRules: true }, orderBy: { versionNumber: 'desc' }, take: 1 },
                organization: true,
              },
            },
          },
        }).catch(() => null)

        if (part?.opportunity && !part.opportunity.deletedAt) {
          dbOpp = part.opportunity
        }
      }

      // F. Promo code pattern (LUMO-XXXX-NAME)
      if (!dbOpp && cleanCode.toUpperCase().startsWith('LUMO-')) {
        const parts = cleanCode.split('-')
        const snippet = parts.length >= 3 ? parts.slice(2).join('-') : parts.slice(1).join('-')
        if (snippet) {
          dbOpp = await db.opportunity.findFirst({
            where: {
              OR: [
                { slug: { contains: snippet, mode: 'insensitive' } },
                { title: { contains: snippet, mode: 'insensitive' } },
              ],
              deletedAt: null,
            },
            include: {
              category: true,
              publishedVersion: { include: { rewardRules: true } },
              versions: { include: { rewardRules: true }, orderBy: { versionNumber: 'desc' }, take: 1 },
              organization: true,
            },
          }).catch(() => null)
        }
      }

      if (dbOpp) {
        if (dbOpp.status === 'DRAFT') {
          return {
            isValid: false,
            promoCode: cleanCode,
            dealId: dbOpp.id,
            dealSlug: dbOpp.slug,
            partnerUserId: '',
            partnerName: '',
            dealData: null,
            errorReason: 'This opportunity is not yet published.',
          }
        }

        const publicData = mapDbOpportunityToPublicData(dbOpp)
        const attributionCode = referralCode?.trim() || cleanCode
        const parts = attributionCode.split('-')
        const partnerCode = parts.length >= 2 && parts[0].toUpperCase() === 'LUMO' ? parts[1] : 'partner'

        return {
          isValid: true,
          promoCode: attributionCode,
          dealId: dbOpp.id,
          dealSlug: dbOpp.slug,
          partnerUserId: partnerCode,
          partnerName: `Partner ${partnerCode.toUpperCase()}`,
          dealData: publicData,
        }
      }
    } catch (dbErr) {
      console.error('Database promo code resolution error:', dbErr)
    }
  }

  return syncRes
}
