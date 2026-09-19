import { describe, it, expect, beforeEach } from 'vitest'
import {
  getUserEnrolledDealIds,
  joinOpportunityDeal,
  isUserEnrolledInDeal,
  seedTestOpportunity,
} from '@/modules/deals/service'
import {
  getUserSubscription,
  setUserSubscription,
} from '@/modules/subscriptions/service'
import {
  createReferralTicket,
  listPartnerReferralTickets,
  getReferralTicket,
} from '@/modules/deals/referral-cases'
import {
  createPartnerPayoutRequest,
  listPartnerPayouts,
} from '@/modules/payouts/payout-store'

describe('Production Account Isolation & Data Consistency Test Suite', () => {
  const PARTNER_A_ID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
  const PARTNER_B_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'

  const DEAL_SOLAR = 'opp_isolation_solar'
  const DEAL_WATER = 'opp_isolation_water'

  beforeEach(() => {
    seedTestOpportunity({
      id: DEAL_SOLAR,
      organizationId: 'org_solar_co',
      companyName: 'Solar Systems Tanzania',
      companyLogo: 'SST',
      isVerified: true,
      type: 'CUSTOMER_ACQUISITION',
      title: 'Solar Home Installation',
      slug: 'solar-home-installation',
      summary: 'Earn TZS 50,000 per verified home solar setup.',
      description: 'Clean energy for households.',
      category: 'Renewable Energy',
      countryCode: 'TZ',
      region: 'Dar es Salaam',
      currency: 'TZS',
      rewardType: 'FIXED_COMMISSION',
      rewardDisplay: 'TZS 50,000',
      rewardDetail: 'per verified installation',
      spentBudgetTZS: 0n,
      activePartnerCount: 0,
      isFeatured: true,
      status: 'PUBLISHED',
      createdAt: new Date(),
    })

    seedTestOpportunity({
      id: DEAL_WATER,
      organizationId: 'org_water_co',
      companyName: 'Clean Water Initiative',
      companyLogo: 'CWI',
      isVerified: true,
      type: 'CUSTOMER_ACQUISITION',
      title: 'Water Purification Units',
      slug: 'water-purification-units',
      summary: 'Earn TZS 30,000 per water unit deployed.',
      description: 'Clean drinking water systems.',
      category: 'Health & Sanitation',
      countryCode: 'TZ',
      region: 'Arusha',
      currency: 'TZS',
      rewardType: 'FIXED_COMMISSION',
      rewardDisplay: 'TZS 30,000',
      rewardDetail: 'per water unit deployed',
      spentBudgetTZS: 0n,
      activePartnerCount: 0,
      isFeatured: false,
      status: 'PUBLISHED',
      createdAt: new Date(),
    })
  })

  // --------------------------------------------------------------------------
  // 1. DEAL ENROLLMENT ISOLATION
  // --------------------------------------------------------------------------
  it('1. Enrolling Partner A in a deal does NOT enroll Partner B (Zero Cross-Account Bleed)', async () => {
    // Give both partners active subscriptions so they are authorized to join deals
    setUserSubscription(PARTNER_A_ID, {
      id: 'sub_partner_a',
      userId: PARTNER_A_ID,
      planCode: 'MONTHLY',
      planName: 'Monthly Pass',
      status: 'ACTIVE',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      daysRemaining: 30,
      isActive: true,
      autoRenew: true,
    })

    setUserSubscription(PARTNER_B_ID, {
      id: 'sub_partner_b',
      userId: PARTNER_B_ID,
      planCode: 'MONTHLY',
      planName: 'Monthly Pass',
      status: 'ACTIVE',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      daysRemaining: 30,
      isActive: true,
      autoRenew: true,
    })

    // Partner A joins DEAL_SOLAR
    const joinResA = joinOpportunityDeal(DEAL_SOLAR, { userId: PARTNER_A_ID })
    expect(joinResA.success).toBe(true)

    // Verify Partner A is enrolled in DEAL_SOLAR
    expect(isUserEnrolledInDeal(DEAL_SOLAR, PARTNER_A_ID)).toBe(true)
    const partnerADeals = getUserEnrolledDealIds(PARTNER_A_ID)
    expect(partnerADeals.has(DEAL_SOLAR)).toBe(true)

    // Verify Partner B is NOT enrolled in DEAL_SOLAR
    expect(isUserEnrolledInDeal(DEAL_SOLAR, PARTNER_B_ID)).toBe(false)
    const partnerBDeals = getUserEnrolledDealIds(PARTNER_B_ID)
    expect(partnerBDeals.has(DEAL_SOLAR)).toBe(false)

    // Partner B joins DEAL_WATER
    const joinResB = joinOpportunityDeal(DEAL_WATER, { userId: PARTNER_B_ID })
    expect(joinResB.success).toBe(true)

    // Verify Partner B only has DEAL_WATER, and Partner A does not have DEAL_WATER
    expect(isUserEnrolledInDeal(DEAL_WATER, PARTNER_B_ID)).toBe(true)
    expect(getUserEnrolledDealIds(PARTNER_B_ID).has(DEAL_WATER)).toBe(true)
    expect(getUserEnrolledDealIds(PARTNER_B_ID).has(DEAL_SOLAR)).toBe(false)

    expect(isUserEnrolledInDeal(DEAL_WATER, PARTNER_A_ID)).toBe(false)
    expect(getUserEnrolledDealIds(PARTNER_A_ID).has(DEAL_WATER)).toBe(false)
  })

  // --------------------------------------------------------------------------
  // 2. SUBSCRIPTION ISOLATION
  // --------------------------------------------------------------------------
  it('2. Partner A subscribing to PRO plan does NOT activate other partners (Strict Subscription Isolation)', async () => {
    const UNSUBSCRIBED_USER_ID = '3c8d9bee-cffd-4c3e-8c6e-bc9efccd5cfe'

    // Partner A subscribes to ANNUAL
    setUserSubscription(PARTNER_A_ID, {
      id: 'sub_partner_a',
      userId: PARTNER_A_ID,
      planCode: 'ANNUAL',
      planName: 'Annual Elite',
      status: 'ACTIVE',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      daysRemaining: 365,
      isActive: true,
      autoRenew: true,
    })

    const subA = await getUserSubscription(PARTNER_A_ID)
    expect(subA).toBeDefined()
    expect(subA?.isActive).toBe(true)
    expect(subA?.planCode).toBe('ANNUAL')

    // An unsubscribed partner must NOT receive Partner A's subscription
    const subUnsubscribed = await getUserSubscription(UNSUBSCRIBED_USER_ID)
    expect(subUnsubscribed?.isActive ?? false).toBe(false)
    expect(subUnsubscribed?.status).not.toBe('ACTIVE')
  })

  // --------------------------------------------------------------------------
  // 3. REFERRAL FLOW & ANTI-IDOR OWNERSHIP
  // --------------------------------------------------------------------------
  it('3. Referrals submitted by Partner A are strictly owned by Partner A and hidden from Partner B', async () => {
    const resultA = await createReferralTicket({
      dealId: DEAL_SOLAR,
      dealTitle: 'Solar Home Installation',
      dealSlug: 'solar-home-installation',
      submissionType: 'CUSTOMER_REFERRAL',
      partnerUserId: PARTNER_A_ID,
      partnerName: 'Alice Partner',
      partnerPhone: '+255711111111',
      partnerWhatsApp: '+255711111111',
      customerFirstName: 'Juma',
      customerLastName: 'Rashid',
      customerPhone: '+255788123456',
      contactPermissionConfirmed: true,
      quantity: 2,
    })

    expect(resultA.success).toBe(true)
    expect(resultA.ticket).toBeDefined()
    const ticketA = resultA.ticket!
    expect(ticketA.ticketReference).toMatch(/^LUMO-REF-/)
    expect(ticketA.partnerUserId).toBe(PARTNER_A_ID)

    // Partner A lists their referral tickets
    const ticketsForA = await listPartnerReferralTickets(PARTNER_A_ID)
    expect(ticketsForA.some((t) => t.id === ticketA.id)).toBe(true)

    // Partner B lists their referral tickets — must NOT include Partner A's ticket
    const ticketsForB = await listPartnerReferralTickets(PARTNER_B_ID)
    expect(ticketsForB.some((t) => t.id === ticketA.id)).toBe(false)

    // Direct lookup by ID ensures owner matches
    const retrievedTicket = await getReferralTicket(ticketA.id)
    expect(retrievedTicket?.partnerUserId).toBe(PARTNER_A_ID)
    expect(retrievedTicket?.partnerUserId).not.toBe(PARTNER_B_ID)
  })

  // --------------------------------------------------------------------------
  // 4. FINANCIAL & PAYOUT ISOLATION
  // --------------------------------------------------------------------------
  it('4. Payout requests by Partner A are isolated strictly to Partner A', async () => {
    const payoutA = await createPartnerPayoutRequest({
      partnerUserId: PARTNER_A_ID,
      partnerName: 'Alice Partner',
      partnerPhone: '+255711111111',
      payoutChannel: 'VODACOM_MPESA',
      accountNumber: '+255711111111',
      grossAmountTZS: 100000,
      platformFeeTZS: 3000,
      taxWithheldTZS: 5000,
      netAmountTZS: 92000,
      notes: 'Monthly payout request',
    })

    expect(payoutA.reference).toMatch(/^LUMO-PAY-/)
    expect(payoutA.partnerUserId).toBe(PARTNER_A_ID)

    // Partner A gets their payouts
    const payoutsA = await listPartnerPayouts(PARTNER_A_ID)
    expect(payoutsA.some((p) => p.id === payoutA.id || p.reference === payoutA.reference)).toBe(true)

    // Partner B gets their payouts — must NOT see Partner A's payout
    const payoutsB = await listPartnerPayouts(PARTNER_B_ID)
    expect(payoutsB.some((p) => p.id === payoutA.id || p.reference === payoutA.reference)).toBe(false)
  })

  // --------------------------------------------------------------------------
  // 5. UNBOUND / ANONYMOUS REQUEST SAFETY
  // --------------------------------------------------------------------------
  it('5. Queries with missing/empty partner IDs return empty array and never bleed data', async () => {
    const unauthenticatedDeals = getUserEnrolledDealIds('')
    expect(unauthenticatedDeals.size).toBe(0)

    const unauthenticatedPayouts = await listPartnerPayouts('')
    expect(unauthenticatedPayouts).toEqual([])

    const unauthenticatedTickets = await listPartnerReferralTickets('')
    expect(unauthenticatedTickets).toEqual([])
  })
})
