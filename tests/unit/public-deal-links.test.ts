import { describe, it, expect, vi } from 'vitest'
import { buildPublicDealUrl } from '@/modules/promotional-toolkit/links'

vi.mock('@/modules/deals/service', () => ({
  listOpportunities: () => [
    { id: 'vehicle-1', slug: 'toyota-hiace', title: 'Toyota Hiace', status: 'PUBLISHED',
      description: 'Full vehicle description', featuredImageUrl: '/hiace.jpg', galleryImageUrls: ['/inside.jpg'], promoVideoUrl: 'https://example.com/hiace.mp4' },
    { id: 'vehicle-2', slug: 'toyota-rav4', title: 'Toyota RAV4', status: 'PUBLISHED' },
    { id: 'draft-1', slug: 'draft-car', title: 'Draft car', status: 'DRAFT' },
  ],
}))

import { resolvePromoCode, resolvePromoCodeAsync } from '@/modules/promotional-toolkit/public-allowlist'
import { db } from '@/lib/db'

describe('Public deal links', () => {
  it('resolves the exact product and retains referral attribution and media', () => {
    const url = new URL(buildPublicDealUrl('vehicle-2', 'LUMO-A529-TOYOTA', 'sw'))
    const result = resolvePromoCode(decodeURIComponent(url.pathname.split('/').pop()!), url.searchParams.get('ref')!)
    expect(result.dealId).toBe('vehicle-2')
    expect(result.promoCode).toBe('LUMO-A529-TOYOTA')
    expect(result.partnerUserId).toBe('A529')
    expect(url.searchParams.get('lang')).toBe('sw')
    const media = resolvePromoCode('vehicle-1').dealData
    expect(media?.galleryImageUrls).toEqual(['/hiace.jpg', '/inside.jpg'])
    expect(media?.promoVideoUrl).toBe('https://example.com/hiace.mp4')
    expect(media?.description).toBe('Full vehicle description')
  })

  it('does not substitute a different product for unknown or ambiguous links', () => {
    expect(resolvePromoCode('missing').isValid).toBe(false)
    expect(resolvePromoCode('LUMO-A529-TOYOTA').isValid).toBe(false)
    expect(resolvePromoCode('LUMO-A529-HIACE').dealId).toBe('vehicle-1')
  })

  it('does not expose drafts through public links', () => {
    expect(resolvePromoCode('draft-1').isValid).toBe(false)
  })

  it('encodes query values without changing the referral code', () => {
    const url = new URL(buildPublicDealUrl('vehicle-1', 'partner+a&b'))
    expect(url.searchParams.get('ref')).toBe('partner+a&b')
  })

  it('asynchronously resolves database deals by UUID and prefix match when scanned on different devices', async () => {
    process.env.DATABASE_URL = 'postgresql://mock:5432/lumo'
    
    // Mock db.opportunity.findFirst
    const mockDbOpp = {
      id: 'bb8f4a21-1234-4567-89ab-cdef01234567',
      slug: 'heavy-duty-generator',
      title: 'Heavy Duty Industrial Generator',
      description: 'Industrial 50kVA diesel generator with auto-transfer switch',
      status: 'PUBLISHED',
      category: { name: 'Industrial' },
      publishedVersion: {
        title: 'Heavy Duty Industrial Generator',
        summary: '50kVA diesel generator',
        description: 'Detailed specs',
        category: 'Industrial',
        region: 'Dar es Salaam',
        countryCode: 'TZ',
        currency: 'TZS',
        opportunityType: 'STANDARD_COMMERCIAL',
        principalPriceDisplay: 'TZS 18,500,000',
        featuredImageUrl: '/gen.jpg',
        galleryImageUrls: ['/gen1.jpg'],
        promoVideoUrl: null,
        termsAndConditions: 'Warranty included',
        wholesalePriceTZS: 15000000,
        minOrderQuantity: 1,
        productCondition: 'BRAND_NEW',
        warrantyPeriod: '12 Months',
        qualityScore: 95,
      },
      organization: { tradingName: 'PowerTech TZ' },
    }

    vi.spyOn(db.opportunity, 'findFirst').mockResolvedValue(mockDbOpp as any)

    // Test UUID match
    const uuidRes = await resolvePromoCodeAsync('bb8f4a21-1234-4567-89ab-cdef01234567', 'LUMO-P123-GEN')
    expect(uuidRes.isValid).toBe(true)
    expect(uuidRes.dealId).toBe('bb8f4a21-1234-4567-89ab-cdef01234567')
    expect(uuidRes.dealSlug).toBe('heavy-duty-generator')
    expect(uuidRes.dealData?.title).toBe('Heavy Duty Industrial Generator')
    // Ensure sensitive organization name is replaced with public brand
    expect(uuidRes.dealData?.publisherName).toBe('Lumo Dealers')

    // Test prefix match (e.g., mobile scan showing 'bb8')
    vi.spyOn(db, '$queryRaw').mockResolvedValue([{ id: 'bb8f4a21-1234-4567-89ab-cdef01234567' }] as any)
    vi.spyOn(db.opportunity, 'findUnique').mockResolvedValue(mockDbOpp as any)

    // Clear findFirst mock so it tests prefix path
    vi.spyOn(db.opportunity, 'findFirst').mockResolvedValue(null)

    const prefixRes = await resolvePromoCodeAsync('bb8')
    expect(prefixRes.isValid).toBe(true)
    expect(prefixRes.dealId).toBe('bb8f4a21-1234-4567-89ab-cdef01234567')
    expect(prefixRes.dealSlug).toBe('heavy-duty-generator')
  })
})

