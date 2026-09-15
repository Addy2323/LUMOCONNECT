import { describe, it, expect, beforeEach } from 'vitest'
import {
  sanitizePublicDealData,
  resolvePromoCode,
} from '@/modules/promotional-toolkit/public-allowlist'
import {
  getActiveTemplate,
  getTemplateForCategory,
  listPromotionalTemplates,
  saveTemplateDraft,
  publishTemplateVersion,
  restorePreviousTemplateVersion,
  getTemplateAuditLogs,
} from '@/modules/promotional-toolkit/templates'
import {
  isCrawlerBot,
  recordPromoInteraction,
  getPromoAnalyticsSummary,
} from '@/modules/promotional-toolkit/analytics'
import { submitCustomerReferralEnquiry, getReferralCaseByTrackingNumber } from '@/modules/deals/referral-cases'
import type { OpportunityItem } from '@/modules/deals/types'

describe('Lumo Partner Promotional Toolkit', () => {
  const mockPrivateOpportunity: OpportunityItem = {
    id: 'opp_test_secret_01',
    organizationId: 'org_secret_merchant',
    companyName: 'Confidential Merchant Ltd',
    companyLogo: 'CM',
    isVerified: true,
    type: 'PRODUCT_SALES',
    title: 'Solar Inverter System 5kW',
    titleSw: 'Mfumo wa Solar 5kW',
    slug: 'solar-inverter-system-5kw',
    summary: 'High efficiency solar inverter for commercial installs.',
    summarySw: 'Inverter ya narai kwa matumizi ya biashara.',
    description: 'Full 5kW hybrid solar system with battery backup.',
    descriptionSw: 'Mfumo kamili wa umeme wa jua.',
    category: 'Solar & Clean Tech',
    countryCode: 'TZ',
    region: 'Dar es Salaam',
    currency: 'TZS',
    rewardType: 'PERCENTAGE_COMMISSION',
    rewardDisplay: '10% Commission',
    rewardDetail: 'Internal partner commission payout',
    principalPriceDisplay: 'TZS 4,500,000',
    spentBudgetTZS: BigInt(0),
    activePartnerCount: 12,
    isFeatured: true,
    featuredImageUrl: 'https://images.unsplash.com/solar-inverter.jpg',
    status: 'PUBLISHED',
    createdAt: new Date(),
    sellerPhone: '+255 754 999 888',
    sellerWhatsApp: '+255754999888',
    sellerLocation: 'Dar es Salaam Industrial Area',
  }

  describe('1. Server-Side Public Data Allowlisting', () => {
    it('strips all merchant contact info and private business names', () => {
      const sanitized = sanitizePublicDealData(mockPrivateOpportunity)

      expect(sanitized.publisherName).toBe('Lumo Dealers')
      expect(sanitized).not.toHaveProperty('companyName')
      expect(sanitized).not.toHaveProperty('sellerPhone')
      expect(sanitized).not.toHaveProperty('sellerWhatsApp')
      expect(sanitized).not.toHaveProperty('rewardDisplay')
      expect(sanitized).not.toHaveProperty('rewardDetail')

      expect(sanitized.title).toBe('Solar Inverter System 5kW')
      expect(sanitized.category).toBe('Solar & Clean Tech')
      expect(sanitized.region).toBe('Dar es Salaam')
      expect(sanitized.principalPriceDisplay).toBe('TZS 4,500,000')
      expect(sanitized.availabilityStatus).toBe('AVAILABLE')
    })
  })

  describe('2. Promo Code Resolution', () => {
    it('resolves valid promo tracking code to public deal data', () => {
      const res = resolvePromoCode('LUMO-6AAF-SOLAR')

      expect(res.isValid).toBe(true)
      expect(res.promoCode).toBe('LUMO-6AAF-SOLAR')
      expect(res.dealData).not.toBeNull()
      if (res.dealData) {
        expect(res.dealData.publisherName).toBe('Lumo Dealers')
      }
    })

    it('returns structured error for invalid tracking code', () => {
      const res = resolvePromoCode('INVALID-CODE-9999')
      expect(res.isValid).toBe(false)
      expect(res.dealData).toBeNull()
      expect(res.errorReason).toBeDefined()
    })
  })

  describe('3. Promotional Template Management & Audit Logging', () => {
    it('provides active default template', () => {
      const active = getActiveTemplate()
      expect(active).toBeDefined()
      expect(active.brandColors.primary).toBe('#FF6A00')
      expect(active.brandColors.darkNavy).toBe('#0B132B')
    })

    it('saves draft, publishes version, and records audit logs', () => {
      const active = getActiveTemplate()
      const draft = saveTemplateDraft({
        ...active,
        name: 'Custom Partner Template',
        ctaTextEn: 'Inquire Now via Lumo',
      }, 'Test Admin')

      expect(draft.status).toBe('DRAFT')
      expect(draft.ctaTextEn).toBe('Inquire Now via Lumo')

      const published = publishTemplateVersion(draft.id, 'Test Admin')
      expect(published).not.toBeNull()
      if (published) {
        expect(published.status).toBe('PUBLISHED')
        expect(published.version).toBeGreaterThan(1)
      }

      const logs = getTemplateAuditLogs()
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].actorAdmin).toBe('Test Admin')
    })
  })

  describe('4. Analytics & Crawler Bot Detection', () => {
    it('detects WhatsApp, Facebook, and search engine crawlers', () => {
      expect(isCrawlerBot('WhatsApp/2.21.12.21 A')).toBe(true)
      expect(isCrawlerBot('facebookexternalhit/1.1')).toBe(true)
      expect(isCrawlerBot('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true)
      expect(isCrawlerBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0')).toBe(false)
    })

    it('records promo interactions and separates bot previews from human visits', () => {
      const testCode = 'LUMO-TEST-ANALYTICS'

      recordPromoInteraction(testCode, 'PAGE_VISIT', 'WhatsApp/2.21.12.21 A')
      recordPromoInteraction(testCode, 'PAGE_VISIT', 'Mozilla/5.0 Chrome/120.0')
      recordPromoInteraction(testCode, 'CONTACT_CLICK', 'Mozilla/5.0 Chrome/120.0')

      const summary = getPromoAnalyticsSummary(testCode)
      expect(summary.botPreviewsCount).toBe(1)
      expect(summary.pageVisitsCount).toBe(1)
      expect(summary.contactClicksCount).toBe(1)
    })
  })

  describe('5. Customer Enquiry & Referral Attribution', () => {
    it('submits customer enquiry attributed to promo code', () => {
      const res = submitCustomerReferralEnquiry({
        promoCode: 'LUMO-ALEX-SOLAR',
        dealId: 'opp_solar_tz_01',
        dealSlug: 'solar-inverter-system-5kw',
        dealTitle: 'Solar Inverter System 5kW',
        customerName: 'Amani Joseph',
        customerPhone: '+255 712 345 678',
        customerRegion: 'Arusha',
        notes: 'Needs installation quote.',
      })

      expect(res.success).toBe(true)
      expect(res.referralCase).toBeDefined()

      if (res.referralCase) {
        expect(res.referralCase.customerFirstName).toBe('Amani')
        expect(res.referralCase.customerLastName).toBe('Joseph')
        expect(res.referralCase.reference).toContain('LUMO-REF-')

        const fetched = getReferralCaseByTrackingNumber(res.referralCase.reference)
        expect(fetched).not.toBeNull()
      }
    })
  })
})
