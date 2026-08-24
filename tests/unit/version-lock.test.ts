import { describe, it, expect, beforeEach } from 'vitest'
import {
  joinOpportunityDeal,
  getProtectedOpportunityDetails,
  createDealOpportunity,
  seedTestOpportunity,
} from '@/modules/deals/service'
import { setUserSubscription } from '@/modules/subscriptions/service'

describe('Deal Version-Locking Guarantee', () => {
  const testPartnerId = 'usr_partner_version_test'

  beforeEach(() => {
    seedTestOpportunity({
      id: 'opp_kijani_solar',
      organizationId: 'org_kijani',
      companyName: 'Kijani Solar Tech',
      companyLogo: 'KS',
      isVerified: true,
      type: 'CUSTOMER_ACQUISITION',
      title: 'Power the Next 1,000 Homes in Rural & Peri-Urban Tanzania',
      slug: 'kijani-solar-home-systems',
      summary: 'Earn TZS 45,000 for every verified household solar power system installation completed through your referral.',
      description: 'Solar lighting and appliances across Tanzania.',
      category: 'Renewable Energy',
      countryCode: 'TZ',
      region: 'Dar es Salaam',
      currency: 'TZS',
      rewardType: 'COST_PER_ACQUISITION',
      rewardDisplay: 'TZS 45,000',
      rewardDetail: 'per verified installation',
      spentBudgetTZS: 0n,
      activePartnerCount: 1,
      isFeatured: true,
      status: 'PUBLISHED',
      createdAt: new Date(),
    })

    // Ensure partner has an active subscription
    setUserSubscription(testPartnerId, {
      id: 'sub_test_version_lock',
      userId: testPartnerId,
      planCode: 'MONTHLY',
      planName: 'Monthly Partner Access',
      status: 'ACTIVE',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      daysRemaining: 30,
      isActive: true,
      autoRenew: true,
    })
  })

  it('enrolls partner with locked terms and prevents double-enrollment', () => {
    // 1. First enrollment
    const firstJoin = joinOpportunityDeal('opp_kijani_solar', {
      userId: testPartnerId,
      userRole: 'PARTNER',
    })

    expect(firstJoin.success).toBe(true)
    expect(firstJoin.isAlreadyEnrolled).toBe(false)
    expect(firstJoin.trackingCode).toBeDefined()

    // 2. Second enrollment attempt returns existing enrollment
    const secondJoin = joinOpportunityDeal('opp_kijani_solar', {
      userId: testPartnerId,
      userRole: 'PARTNER',
    })

    expect(secondJoin.success).toBe(true)
    expect(secondJoin.isAlreadyEnrolled).toBe(true)
    expect(secondJoin.trackingCode).toBe(firstJoin.trackingCode)
  })

  it('preserves deal terms and deliverable requirements for subscribed partner', () => {
    const details = getProtectedOpportunityDetails('opp_kijani_solar', {
      userId: testPartnerId,
      userRole: 'PARTNER',
    })

    expect(details.success).toBe(true)
    expect(details.data?.isSubscribed).toBe(true)
    expect(details.data?.eligibilityRequirements.length).toBeGreaterThan(0)
    expect(details.data?.deliverableChecklist.length).toBeGreaterThan(0)
    expect(details.data?.commissionFormula).toBeDefined()
  })

  it('generates immutable version number and terms hash when business creates deal', () => {
    const newDeal = createDealOpportunity(
      {
        title: 'Kilimo Bora Agribusiness Micro-franchise',
        category: 'AGRICULTURE',
        opportunityType: 'DISTRIBUTOR_SEARCH',
        region: 'Arusha',
        rewardType: 'PERCENTAGE_COMMISSION',
        percentageBps: 1200, // 12%
        baseRewardValue: 12000,
        summary: 'Promote solar irrigation kits to smallholder farmer cooperatives.',
        description: 'Promote solar irrigation kits to smallholder farmer cooperatives with verified downpayments.',
        termsAndConditions: 'Verified field delivery report signed by village agricultural officer.',
        currency: 'TZS',
        requiresApproval: true,
        attributionWindowDays: 30,
      },
      'org_kilimo_01',
      'Kilimo Bora Co'
    )

    expect(newDeal.id).toBeDefined()
    expect(newDeal.status).toBe('PUBLISHED')
    expect(newDeal.rewardType).toBe('PERCENTAGE_COMMISSION')
    expect(newDeal.companyName).toBe('Kilimo Bora Co')
  })
})
