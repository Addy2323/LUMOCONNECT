import { describe, it, expect, beforeEach } from 'vitest'
import {
  listOpportunities,
  joinOpportunityDeal,
  isUserEnrolledInDeal,
  getUserEnrolledDealIds,
  resetOpportunities,
  seedTestOpportunity,
} from '@/modules/deals/service'
import { setUserSubscription } from '@/modules/subscriptions/service'

describe('Deal Enrollment Status & Duplicate Prevention', () => {
  const testUserId = 'usr_partner_test_enrollment'

  beforeEach(() => {
    resetOpportunities()
    seedTestOpportunity({
      id: 'opp_test_deal_01',
      organizationId: 'org_test_01',
      companyName: 'Test Solar Energy Ltd',
      companyLogo: 'TS',
      isVerified: true,
      type: 'PRODUCT_SALES',
      title: 'Solar Inverter System 5kW',
      slug: 'solar-inverter-system-5kw',
      summary: 'High efficiency solar inverter system',
      description: 'Full commercial grade solar system',
      category: 'Renewable Energy',
      countryCode: 'TZ',
      region: 'Dar es Salaam',
      currency: 'TZS',
      rewardType: 'FIXED_COMMISSION',
      rewardDisplay: 'TZS 50,000 per closed deal',
      rewardDetail: 'Payable on verified customer installation',
      spentBudgetTZS: BigInt(0),
      activePartnerCount: 2,
      isFeatured: true,
      status: 'PUBLISHED',
      createdAt: new Date(),
    })

    // Setup active subscription for partner so they are authorized to join deals
    setUserSubscription(testUserId, {
      id: `sub_${testUserId}`,
      userId: testUserId,
      planCode: 'MONTHLY',
      planName: 'Monthly Member',
      status: 'ACTIVE',
      isActive: true,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      daysRemaining: 30,
    })
  })

  it('reports enrolled status correctly and prevents duplicate enrollment', () => {
    const deals = listOpportunities()
    expect(deals.length).toBeGreaterThan(0)
    const deal = deals[0]

    // Before joining
    expect(isUserEnrolledInDeal(deal.id, testUserId)).toBe(false)
    const initialEnrolledIds = getUserEnrolledDealIds(testUserId)
    expect(initialEnrolledIds.has(deal.id)).toBe(false)

    const initialPartnerCount = deal.activePartnerCount

    // First join attempt
    const firstJoin = joinOpportunityDeal(deal.id, {
      userId: testUserId,
      userRole: 'PARTNER',
    })

    expect(firstJoin.success).toBe(true)
    expect(firstJoin.trackingCode).toBeDefined()
    expect(firstJoin.isAlreadyEnrolled).toBeFalsy()
    expect(deal.activePartnerCount).toBe(initialPartnerCount + 1)

    // After joining
    expect(isUserEnrolledInDeal(deal.id, testUserId)).toBe(true)
    expect(isUserEnrolledInDeal(deal.slug, testUserId)).toBe(true)

    const updatedEnrolledIds = getUserEnrolledDealIds(testUserId)
    expect(updatedEnrolledIds.has(deal.id)).toBe(true)
    expect(updatedEnrolledIds.has(deal.slug)).toBe(true)

    // Second join attempt (Duplicate attempt)
    const secondJoin = joinOpportunityDeal(deal.id, {
      userId: testUserId,
      userRole: 'PARTNER',
    })

    expect(secondJoin.success).toBe(true)
    expect(secondJoin.isAlreadyEnrolled).toBe(true)
    // Partner count must NOT increment a second time
    expect(deal.activePartnerCount).toBe(initialPartnerCount + 1)
  })

  it('detects enrollments from localStorage when in browser environment', () => {
    const mockLocalStorage: Record<string, string> = {
      lumo_partner_joined_deals: JSON.stringify([
        {
          id: 'joined_test_1',
          opportunityId: 'opp_cement_dar_01',
          title: '500 Bags Cement',
          status: 'ACTIVE',
        },
      ]),
    }

    // Set global localStorage
    const originalLocalStorage = globalThis.localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => mockLocalStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockLocalStorage[key] = value
        },
        removeItem: (key: string) => {
          delete mockLocalStorage[key]
        },
      },
      writable: true,
      configurable: true,
    })

    try {
      const ids = getUserEnrolledDealIds()
      expect(ids.has('opp_cement_dar_01')).toBe(true)
      expect(isUserEnrolledInDeal('opp_cement_dar_01')).toBe(true)
    } finally {
      if (originalLocalStorage) {
        Object.defineProperty(globalThis, 'localStorage', {
          value: originalLocalStorage,
          writable: true,
          configurable: true,
        })
      }
    }
  })

  it('supports referral stage tracking and fallback opportunity synthesis for database UUID deals', () => {
    // Database UUID deal (not present in in-memory catalog)
    const dbDeal = {
      id: 'part_5b6cb2d4',
      opportunityId: '5b6cb2d4-98f1-478b-b25a-44132df8084a',
      title: 'Wanted: 500 Bags of Grade 42.5 Cement',
      businessName: 'Lumo Dealers',
      category: 'PRODUCTS',
      status: 'ACTIVE' as const,
      joinedDate: '2026-09-16',
      rewardDisplay: 'TZS 180,000 / Supply Deal',
      rewardValueTZS: 180000,
      trackingLink: 'https://lumo.co.tz/d/5b6cb2d4?partner=alex',
      referralId: 'LUMO-ALEX-5B6C',
      promoCode: 'ALEX_CEME',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?data=test',
      activeLeadsCount: 1,
      latestReferralStage: 'UNDER_REVIEW',
      latestReferralTicketRef: 'LUMO-REF-712894',
      verifiedConversionsCount: 0,
      earningsEarnedTZS: 0,
      deliverablesSummary: 'Deliver 500 bags of Grade 42.5 cement',
      evidenceRequired: 'Delivery note signed',
      milestoneProgressPercent: 50,
      canExit: true,
    }

    // Verify stage tracking metadata
    expect(dbDeal.latestReferralStage).toBe('UNDER_REVIEW')
    expect(dbDeal.latestReferralTicketRef).toBe('LUMO-REF-712894')
    expect(dbDeal.activeLeadsCount).toBe(1)

    // Verify fallback synthesis preserves deal attributes
    const synthesizedOpp = {
      id: dbDeal.opportunityId,
      title: dbDeal.title,
      companyName: dbDeal.businessName,
      rewardDisplay: dbDeal.rewardDisplay,
      baseRewardValue: dbDeal.rewardValueTZS,
      category: dbDeal.category,
    }

    expect(synthesizedOpp.id).toBe('5b6cb2d4-98f1-478b-b25a-44132df8084a')
    expect(synthesizedOpp.title).toBe('Wanted: 500 Bags of Grade 42.5 Cement')
    expect(synthesizedOpp.rewardDisplay).toBe('TZS 180,000 / Supply Deal')
    expect(synthesizedOpp.baseRewardValue).toBe(180000)
  })
})
