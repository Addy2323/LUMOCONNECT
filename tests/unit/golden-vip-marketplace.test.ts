import { describe, it, expect, beforeEach } from 'vitest'
import {
  createSubscriptionCheckout,
  getUserSubscription,
} from '@/modules/subscriptions/service'
import { listOpportunities, seedTestOpportunity, resetOpportunities } from '@/modules/deals/service'

describe('Golden VIP 24-Hour Marketplace & Escrow Engine', () => {
  beforeEach(() => {
    resetOpportunities()
    const now = Date.now()
    seedTestOpportunity({
      id: 'opp_vip_test_01',
      organizationId: 'org_vip_01',
      companyName: 'VIP Solar Corp',
      isVerified: true,
      type: 'PRODUCT_SALES',
      title: 'Solar Hybrid Pack 10kW',
      slug: 'solar-hybrid-pack-10kw',
      summary: 'High yield solar pack',
      description: 'Exclusive 24h VIP solar commercial deal',
      category: 'Renewable Energy',
      countryCode: 'TZ',
      region: 'Dar es Salaam',
      currency: 'TZS',
      rewardType: 'FIXED_COMMISSION',
      rewardDisplay: 'TZS 150,000 VIP Reward',
      rewardDetail: 'Payable upon verified outcome',
      spentBudgetTZS: BigInt(0),
      activePartnerCount: 0,
      isFeatured: true,
      status: 'PUBLISHED',
      createdAt: new Date(),
      isGoldenVip: true,
      vipAccessStartAt: new Date(now),
      vipReleaseAt: new Date(now + 24 * 60 * 60 * 1000),
      qualityScore: 95,
      inspectionWindowHours: 48,
      productCondition: 'BRAND_NEW',
      sellerPhone: '+255711223344',
    })

    seedTestOpportunity({
      id: 'opp_vip_test_02',
      organizationId: 'org_vip_02',
      companyName: 'VIP Fleet Ltd',
      isVerified: true,
      type: 'PRODUCT_SALES',
      title: 'Fleet Commercial Deal',
      slug: 'fleet-commercial-deal',
      summary: 'Fleet management equipment',
      description: 'VIP exclusive deal with escrow',
      category: 'Automotive & Transportation',
      countryCode: 'TZ',
      region: 'Arusha',
      currency: 'TZS',
      rewardType: 'FIXED_COMMISSION',
      rewardDisplay: 'TZS 250,000 VIP Reward',
      rewardDetail: 'Payable upon verified outcome',
      spentBudgetTZS: BigInt(0),
      activePartnerCount: 0,
      isFeatured: true,
      status: 'PUBLISHED',
      createdAt: new Date(),
      isGoldenVip: true,
      vipAccessStartAt: new Date(now),
      vipReleaseAt: new Date(now + 24 * 60 * 60 * 1000),
      qualityScore: 92,
      inspectionWindowHours: 48,
      productCondition: 'CERTIFIED_REFURBISHED',
      sellerPhone: '+255755667788',
    })

    seedTestOpportunity({
      id: 'opp_std_test_03',
      organizationId: 'org_std_03',
      companyName: 'Standard Merchant',
      isVerified: true,
      type: 'PRODUCT_SALES',
      title: 'Standard Product Deal',
      slug: 'standard-product-deal',
      summary: 'General access opportunity',
      description: 'Available to all active partners',
      category: 'Retail & Wholesale',
      countryCode: 'TZ',
      region: 'Mwanza',
      currency: 'TZS',
      rewardType: 'PERCENTAGE_COMMISSION',
      rewardDisplay: '5% Commission',
      rewardDetail: 'Payable upon verified outcome',
      spentBudgetTZS: BigInt(0),
      activePartnerCount: 5,
      isFeatured: false,
      status: 'PUBLISHED',
      createdAt: new Date(),
      isGoldenVip: false,
    })
  })
  it('1. Annual subscription grants 1-month FREE Golden VIP access', async () => {
    const userId = 'partner_annual_vip_test'
    const checkout = await createSubscriptionCheckout({
      userId,
      userRole: 'PARTNER',
      planCode: 'ANNUAL',
      amountTZS: 180000,
      paymentMethod: 'MPESA',
      phoneNumber: '+255712345678',
    })

    expect(checkout.success).toBe(true)
    expect(checkout.status).toBe('ACTIVE')

    const sub = getUserSubscription(userId)
    expect(sub).toBeDefined()
    expect(sub?.planCode).toBe('ANNUAL')
    expect(sub?.isActive).toBe(true)
    expect(sub?.isGoldenVip).toBe(true)
    expect(sub?.hasGoldenVipAccess).toBe(true)
    expect(sub?.freeVipMonthsBonus).toBe(1)
  })

  it('2. Direct Golden VIP subscription activates VIP access immediately', async () => {
    const userId = 'partner_direct_vip_test'
    const checkout = await createSubscriptionCheckout({
      userId,
      userRole: 'PARTNER',
      planCode: 'GOLDEN_VIP',
      amountTZS: 65000,
      paymentMethod: 'MPESA',
      phoneNumber: '+255712345678',
    })

    expect(checkout.success).toBe(true)
    expect(checkout.status).toBe('ACTIVE')

    const sub = getUserSubscription(userId)
    expect(sub?.planCode).toBe('GOLDEN_VIP')
    expect(sub?.isGoldenVip).toBe(true)
    expect(sub?.hasGoldenVipAccess).toBe(true)
  })

  it('3. Standard Monthly subscription does NOT have Golden VIP priority access', async () => {
    const userId = 'partner_monthly_test'
    const checkout = await createSubscriptionCheckout({
      userId,
      userRole: 'PARTNER',
      planCode: 'MONTHLY',
      amountTZS: 25000,
      paymentMethod: 'MPESA',
      phoneNumber: '+255712345678',
    })

    expect(checkout.success).toBe(true)
    expect(checkout.status).toBe('ACTIVE')

    const sub = getUserSubscription(userId)
    expect(sub?.isActive).toBe(true)
    expect(sub?.hasGoldenVipAccess).toBe(false)
    expect(sub?.isGoldenVip).toBe(false)
  })

  it('4. Golden VIP opportunities specify 24h exclusivity windows and quality scores', () => {
    const opportunities = listOpportunities()
    const vipOpportunities = opportunities.filter((o) => o.isGoldenVip)

    expect(vipOpportunities.length).toBeGreaterThanOrEqual(2)

    for (const opp of vipOpportunities) {
      expect(opp.isGoldenVip).toBe(true)
      expect(opp.vipAccessStartAt).toBeDefined()
      expect(opp.vipReleaseAt).toBeDefined()

      // Exclusivity window calculation
      const startMs = new Date(opp.vipAccessStartAt!).getTime()
      const endMs = new Date(opp.vipReleaseAt!).getTime()
      const windowHours = (endMs - startMs) / (1000 * 60 * 60)
      expect(windowHours).toBeCloseTo(24, 0.1)

      // Quality specs & escrow parameters
      expect(opp.qualityScore).toBeGreaterThanOrEqual(90)
      expect(opp.inspectionWindowHours).toBe(48)
      expect(opp.productCondition).toBeDefined()
      expect(opp.sellerPhone).toBeDefined()
    }
  })

  it('5. Marketplace filters support VIP filter parameter', () => {
    const all = listOpportunities()
    const vipOnly = listOpportunities({ vipFilter: 'VIP_ONLY' })
    const standardOnly = listOpportunities({ vipFilter: 'PARTNER_ONLY' })

    expect(vipOnly.every((o) => o.isGoldenVip)).toBe(true)
    expect(standardOnly.every((o) => !o.isGoldenVip)).toBe(true)
    expect(vipOnly.length + standardOnly.length).toBe(all.length)
  })
})
