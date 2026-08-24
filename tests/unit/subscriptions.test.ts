import { describe, it, expect, beforeEach } from 'vitest'
import {
  listSubscriptionPlans,
  getUserSubscription,
  setUserSubscription,
  createSubscriptionCheckout,
  submitEnterpriseInquiry,
  listEnterpriseInquiries,
  cancelSubscriptionRenewal,
} from '@/modules/subscriptions/service'
import { requireActiveDealSubscription } from '@/modules/subscriptions/authorization'
import {
  getPublicDealSummary,
  getProtectedOpportunityDetails,
  joinOpportunityDeal,
  seedTestOpportunity,
} from '@/modules/deals/service'

describe('Subscription-Gated Deal Marketplace Test Suite', () => {
  const dealId = 'opp_kijani_solar'
  const otherBusinessDealId = 'opp_mzinga_pos'

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

    seedTestOpportunity({
      id: 'opp_mobipay_merchants',
      organizationId: 'org_mobipay',
      companyName: 'MobiPay Africa',
      companyLogo: 'MP',
      isVerified: true,
      type: 'QUALIFIED_LEADS',
      title: 'MobiPay POS distribution',
      slug: 'mobipay-pos-distribution',
      summary: 'Distribute POS devices',
      description: 'MobiPay description',
      category: 'Fintech',
      countryCode: 'TZ',
      region: 'Dar es Salaam',
      currency: 'TZS',
      rewardType: 'COST_PER_LEAD',
      rewardDisplay: 'TZS 20,000',
      rewardDetail: 'per lead',
      spentBudgetTZS: 0n,
      activePartnerCount: 0,
      isFeatured: false,
      status: 'PUBLISHED',
      createdAt: new Date(),
    })
    // Reset test user states
    setUserSubscription('test_unsubscribed_user', {
      id: 'sub_unsub',
      userId: 'test_unsubscribed_user',
      planCode: 'MONTHLY',
      planName: 'Monthly',
      status: 'EXPIRED',
      startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40),
      expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // Expired 10 days ago
      daysRemaining: 0,
      isActive: false,
      autoRenew: false,
    })

    setUserSubscription('test_active_monthly_user', {
      id: 'sub_active_monthly',
      userId: 'test_active_monthly_user',
      planCode: 'MONTHLY',
      planName: 'Monthly',
      status: 'ACTIVE',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      daysRemaining: 30,
      isActive: true,
      autoRenew: true,
    })
  })

  it('1. A public visitor can browse public deal summaries', () => {
    const summary = getPublicDealSummary(dealId)
    expect(summary).toBeDefined()
    expect(summary?.title).toBeDefined()
    expect(summary?.indicativeRewardDisplay).toBeDefined()
    expect(summary?.companyName).toBeDefined()
  })

  it('2. Public summary strictly redacts confidential deliverables, commission formulas, and contact info', () => {
    const summary: any = getPublicDealSummary(dealId)
    expect(summary).toBeDefined()
    expect(summary.commissionFormula).toBeUndefined()
    expect(summary.salesAssetsUrl).toBeUndefined()
    expect(summary.businessContactEmail).toBeUndefined()
    expect(summary.businessContactPhone).toBeUndefined()
    expect(summary.deliverableChecklist).toBeUndefined()
  })

  it('3. An unauthenticated user is redirected to sign-in with returnTo and intent preserved', () => {
    const decision = requireActiveDealSubscription({
      dealIdOrSlug: dealId,
      intent: 'join',
    })
    expect(decision.isAuthorized).toBe(false)
    expect(decision.requiresSubscription).toBe(true)
    expect(decision.redirectUrl).toContain('/sign-in?returnTo=/deals/')
    expect(decision.redirectUrl).toContain('intent=join')
  })

  it('4. A signed-in non-subscriber is redirected to /subscriptions with returnTo and intent preserved', () => {
    const decision = requireActiveDealSubscription({
      userId: 'test_unsubscribed_user',
      dealIdOrSlug: dealId,
      intent: 'view',
    })
    expect(decision.isAuthorized).toBe(false)
    expect(decision.requiresSubscription).toBe(true)
    expect(decision.redirectUrl).toContain('/subscriptions?returnTo=/deals/')
    expect(decision.redirectUrl).toContain('intent=view')
  })

  it('5. Monthly subscription payment activates 30 days of access with server-enforced pricing', async () => {
    const checkout = await createSubscriptionCheckout({
      userId: 'test_buyer_monthly',
      planCode: 'MONTHLY',
      paymentMethod: 'MPESA',
      phoneNumber: '+255712345678',
    })

    expect(checkout.success).toBe(true)
    expect(checkout.status).toBe('ACTIVE')
    expect(checkout.amountTZS).toBe(25000) // Server-enforced price
    expect(checkout.planName).toBe('Monthly')

    const sub = getUserSubscription('test_buyer_monthly')
    expect(sub?.isActive).toBe(true)
    expect(sub?.daysRemaining).toBe(30)
  })

  it('6. Semi-Annual subscription payment activates 180 days (6 months) of access', async () => {
    const checkout = await createSubscriptionCheckout({
      userId: 'test_buyer_semiannual',
      planCode: 'SEMI_ANNUAL',
      paymentMethod: 'AIRTEL',
      phoneNumber: '+255788112233',
    })

    expect(checkout.success).toBe(true)
    expect(checkout.amountTZS).toBe(100000) // Server-enforced price
    expect(checkout.planName).toBe('Semi-Annual')

    const sub = getUserSubscription('test_buyer_semiannual')
    expect(sub?.isActive).toBe(true)
    expect(sub?.daysRemaining).toBe(180)
  })

  it('7. Enterprise inquiry creates a lead inquiry record without activating paid access', () => {
    const inquiry = submitEnterpriseInquiry(
      {
        fullName: 'Baraka Mushi',
        businessName: 'Kilimanjaro Corp',
        workEmail: 'baraka@kilimanjaro.tz',
        phoneNumber: '+255754112233',
        teamSize: '20-50 members',
        industry: 'Agribusiness',
        expectedDealVolume: '50+ deals',
        aiRequirements: 'Custom LLM deal routing',
        message: 'Looking to integrate our 30 sales reps.',
      },
      'baraka_lead_user'
    )

    expect(inquiry.id).toBeDefined()
    expect(inquiry.status).toBe('PENDING')

    // Enterprise lead should NOT have active subscription
    const sub = getUserSubscription('baraka_lead_user')
    expect(sub).toBeNull()
  })

  it('8. An active subscriber can view full protected deal details and join deals', () => {
    const res = getProtectedOpportunityDetails(dealId, {
      userId: 'test_active_monthly_user',
    })

    expect(res.success).toBe(true)
    expect(res.data).toBeDefined()
    expect(res.data?.commissionFormula).toBeDefined()
    expect(res.data?.businessContactEmail).toBeDefined()
    expect(res.data?.deliverableChecklist.length).toBeGreaterThan(0)
  })

  it('9. An expired subscriber is denied access and prompted to renew', () => {
    const res = getProtectedOpportunityDetails(dealId, {
      userId: 'test_unsubscribed_user',
    })

    expect(res.success).toBe(false)
    expect(res.decision.isAuthorized).toBe(false)
    expect(res.decision.requiresSubscription).toBe(true)
    expect(res.decision.subscriptionStatus).toBe('EXPIRED')
  })

  it('10. A Business user viewing their OWN published deal has access without a subscription', () => {
    // Kijani Solar Tech deal has organizationId: 'org_kijani'
    const res = getProtectedOpportunityDetails('opp_kijani_solar', {
      userId: 'business_owner_kijani',
      userRole: 'BUSINESS',
      userOrgId: 'org_kijani',
    })

    expect(res.success).toBe(true)
    expect(res.decision.isAuthorized).toBe(true)
    expect(res.decision.isOwner).toBe(true)
  })

  it('11. A Business user viewing ANOTHER business deal MUST have an active subscription', () => {
    // Viewing a deal belonging to org_mobipay while user is from org_kijani
    const res = getProtectedOpportunityDetails('opp_mobipay_merchants', {
      userId: 'business_owner_kijani_no_sub',
      userRole: 'BUSINESS',
      userOrgId: 'org_kijani',
    })

    expect(res.success).toBe(false)
    expect(res.decision.isAuthorized).toBe(false)
    expect(res.decision.requiresSubscription).toBe(true)
  })

  it('12. Platform administrators retain authorized access to all deals', () => {
    const res = getProtectedOpportunityDetails(dealId, {
      userId: 'super_admin_user',
      userRole: 'ADMIN',
    })

    expect(res.success).toBe(true)
    expect(res.decision.isAuthorized).toBe(true)
    expect(res.decision.isAdmin).toBe(true)
  })

  it('13. Duplicate deal participation records are prevented', () => {
    // First join attempt
    const join1 = joinOpportunityDeal(dealId, {
      userId: 'test_active_monthly_user',
    })
    expect(join1.success).toBe(true)
    expect(join1.isAlreadyEnrolled).toBe(false)

    // Second join attempt for same user & deal
    const join2 = joinOpportunityDeal(dealId, {
      userId: 'test_active_monthly_user',
    })
    expect(join2.success).toBe(true)
    expect(join2.isAlreadyEnrolled).toBe(true)
    expect(join2.message).toContain('already an active participant')
  })

  it('14. Subscription renewal can be cancelled while preserving remaining days', () => {
    const cancelRes = cancelSubscriptionRenewal('test_active_monthly_user')
    expect(cancelRes.success).toBe(true)

    const sub = getUserSubscription('test_active_monthly_user')
    expect(sub?.autoRenew).toBe(false)
    expect(sub?.isActive).toBe(true) // Still active until expiry!
  })
})
