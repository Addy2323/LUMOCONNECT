import { describe, it, expect, beforeEach } from 'vitest'
import {
  normalizeTanzanianPhone,
  isValidTanzanianPhone,
  maskPhone,
  getWhatsAppCoordinationUrl,
  submitCustomerReferral,
  listPartnerReferralCases,
  listAdminReferralCases,
  updateReferralCaseStage,
  reportMerchantDirectPayment,
  confirmPartnerRewardReceipt,
  disputeReferralReward,
  LUMO_OFFICIAL_WHATSAPP,
} from '@/modules/deals/referral-cases'
import { getProtectedOpportunityDetails, joinOpportunityDeal, seedTestOpportunity } from '@/modules/deals/service'
import { setUserSubscription } from '@/modules/subscriptions/service'

describe('Lumo Dealers Operating Model & System Requirements (Version 1.0)', () => {
  const testDealId = 'deal_lumo_test_001'

  beforeEach(() => {
    // Clear localStorage mockup if present
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }

    seedTestOpportunity({
      id: testDealId,
      organizationId: 'org_test_merchant',
      companyName: 'Private Solar Merchant Ltd',
      isVerified: true,
      sellerPhone: '+255754889900',
      sellerWhatsApp: '255754889900',
      type: 'PRODUCT_SALES',
      title: 'Solar Home Energy Kit 200W',
      slug: 'solar-home-energy-kit-200w',
      summary: 'High efficiency solar home kit for domestic lighting',
      description: 'Full solar panel package with inverter and battery backup.',
      category: 'Renewable Energy',
      countryCode: 'TZ',
      region: 'Dar es Salaam',
      currency: 'TZS',
      rewardType: 'FIXED_COMMISSION',
      rewardDisplay: 'TZS 75,000 Flat Reward',
      rewardDetail: 'per unit delivered',
      spentBudgetTZS: 0n,
      activePartnerCount: 0,
      isFeatured: true,
      status: 'PUBLISHED',
      createdAt: new Date(),
    })

    setUserSubscription('alex_partner', {
      id: 'sub_alex_active',
      userId: 'alex_partner',
      planCode: 'MONTHLY',
      planName: 'Monthly Pro',
      status: 'ACTIVE',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      daysRemaining: 30,
      isActive: true,
      autoRenew: true,
    })

    setUserSubscription('partner_unique_test', {
      id: 'sub_unique_active',
      userId: 'partner_unique_test',
      planCode: 'MONTHLY',
      planName: 'Monthly Pro',
      status: 'ACTIVE',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      daysRemaining: 30,
      isActive: true,
      autoRenew: true,
    })
  })

  describe('1. Merchant Privacy & Publication (Section 1 & 3)', () => {
    it('redacts merchant personal email and phone in partner-facing discovery', () => {
      const result = getProtectedOpportunityDetails(testDealId, {
        userId: 'alex_partner',
        userRole: 'PARTNER',
      })

      expect(result.success).toBe(true)
      expect(result.data).not.toBeNull()

      // Should be published under Lumo Dealers
      expect(result.data?.companyName).toBe('Lumo Dealers')
      expect(result.data?.publisherName).toBe('Lumo Dealers')
      expect(result.data?.coordinationNote).toContain('handled by Lumo')

      // Merchant direct contacts must be omitted / redirected to Lumo desk for partners
      expect(result.data?.businessContactEmail).toBe('coordination@lumo.co.tz')
      expect(result.data?.sellerPhone).toBeUndefined()
      expect(result.data?.sellerWhatsApp).toBeUndefined()
    })

    it('allows admin/owner to view internal merchant source data', () => {
      const result = getProtectedOpportunityDetails(testDealId, {
        userId: 'admin_usr',
        userRole: 'SUPER_ADMIN',
      })

      expect(result.success).toBe(true)
      expect(result.decision.isAdmin).toBe(true)
      // Admins retain access to internal merchant contact and review information
      expect(result.data?.businessContactEmail).toContain('merchant-desk')
      expect(result.data?.sellerPhone).toBeDefined()
    })
  })

  describe('2. Phone Normalization & Validation (Section 5)', () => {
    it('normalizes Tanzanian local numbers (07XX / 06XX) to E.164 (+255...) format', () => {
      expect(normalizeTanzanianPhone('0714 902 311')).toBe('+255714902311')
      expect(normalizeTanzanianPhone('0755123984')).toBe('+255755123984')
      expect(normalizeTanzanianPhone('255788443322')).toBe('+255788443322')
      expect(normalizeTanzanianPhone('+255 712 345 678')).toBe('+255712345678')
    })

    it('validates Tanzanian phone prefixes correctly', () => {
      expect(isValidTanzanianPhone('0714902311')).toBe(true)
      expect(isValidTanzanianPhone('0685123456')).toBe(true)
      expect(isValidTanzanianPhone('+255788443322')).toBe(true)
      // Invalid
      expect(isValidTanzanianPhone('12345')).toBe(false)
      expect(isValidTanzanianPhone('+15551234567')).toBe(false)
    })

    it('masks phone numbers safely for display', () => {
      expect(maskPhone('0714902311')).toBe('+255 714 *** 311')
    })
  })

  describe('3. Customer Referral Submission ("I Have a Customer" - Section 5)', () => {
    it('creates a referral case with unique reference LUMO-REF-XXXXXX', () => {
      const input = {
        dealId: 'deal_gold_vip_001',
        dealTitle: 'Toyota Land Cruiser Prado TX 2021',
        dealSlug: 'toyota-land-cruiser-prado-tx-2021',
        partnerUserId: 'test_partner_1',
        partnerName: 'Fatma Juma',
        partnerPhone: '+255712000000',
        customerFirstName: 'Juma',
        customerLastName: 'Bakari',
        customerPhone: '0715998877',
        contactPermissionConfirmed: true,
        additionalNotes: 'Customer needs vehicle in Arusha',
        rewardAmountTZS: 2500000,
        rewardDisplay: 'TZS 2,500,000 Flat Reward',
      }

      const res = submitCustomerReferral(input)
      expect(res.success).toBe(true)
      expect(res.referralCase).toBeDefined()
      expect(res.referralCase?.reference).toMatch(/^LUMO-REF-\d{6}$/)
      expect(res.referralCase?.customerPhone).toBe('+255715998877')
      expect(res.referralCase?.stage).toBe('SUBMITTED')
      expect(res.referralCase?.rewardStatus).toBe('NOT_YET_EARNED')
      expect(res.referralCase?.contactPermissionConfirmed).toBe(true)
    })

    it('rejects referral submission when contact permission is not confirmed', () => {
      const res = submitCustomerReferral({
        dealId: 'deal_gold_vip_001',
        dealTitle: 'Toyota Land Cruiser',
        dealSlug: 'toyota-land-cruiser',
        partnerUserId: 'test_partner_1',
        partnerName: 'Fatma Juma',
        partnerPhone: '+255712000000',
        customerFirstName: 'Juma',
        customerLastName: 'Bakari',
        customerPhone: '0715998877',
        contactPermissionConfirmed: false,
      })

      expect(res.success).toBe(false)
      expect(res.message).toContain('contact permission is mandatory')
    })

    it('prohibits self-referrals when partner submits own phone number', () => {
      const res = submitCustomerReferral({
        dealId: 'deal_gold_vip_001',
        dealTitle: 'Toyota Land Cruiser',
        dealSlug: 'toyota-land-cruiser',
        partnerUserId: 'test_partner_1',
        partnerName: 'Fatma Juma',
        partnerPhone: '+255715998877',
        customerFirstName: 'Fatma',
        customerLastName: 'Juma',
        customerPhone: '0715998877', // Same as partner
        contactPermissionConfirmed: true,
      })

      expect(res.success).toBe(false)
      expect(res.message).toContain('Self-referral is not permitted')
    })

    it('detects duplicate customer referrals on the same deal', () => {
      const baseInput = {
        dealId: 'deal_duplicate_test',
        dealTitle: 'Beachfront Villa',
        dealSlug: 'beachfront-villa',
        partnerUserId: 'partner_A',
        partnerName: 'Partner A',
        partnerPhone: '+255711111111',
        customerFirstName: 'Hassan',
        customerLastName: 'Ali',
        customerPhone: '0714223344',
        contactPermissionConfirmed: true,
      }

      // First submission succeeds
      const first = submitCustomerReferral(baseInput)
      expect(first.success).toBe(true)

      // Another partner tries to submit the same customer phone for this deal
      const duplicate = submitCustomerReferral({
        ...baseInput,
        partnerUserId: 'partner_B',
        partnerName: 'Partner B',
        partnerPhone: '+255722222222',
      })

      expect(duplicate.success).toBe(false)
      expect(duplicate.message).toContain('First registered referral takes precedence')
    })
  })

  describe('4. WhatsApp Coordination Handoff (Section 7)', () => {
    it('formats WhatsApp message using the reference ID without leaking customer PII in the URL', () => {
      const reference = 'LUMO-REF-000123'
      const dealTitle = 'Commercial Villa Masaki'
      const url = getWhatsAppCoordinationUrl(reference, dealTitle)

      // Should target Lumo official WhatsApp destination
      expect(url).toContain('https://wa.me/')
      // Must contain referral reference
      expect(url).toContain(encodeURIComponent(reference))
      // Must contain deal title
      expect(url).toContain(encodeURIComponent(dealTitle))
      // Spec exact wording
      expect(decodeURIComponent(url)).toContain(
        `Hello Lumo, I am following up on referral ${reference} for ${dealTitle}. Please assist with availability and the next steps.`
      )
      // Must NOT contain any personal phone or name in the query string
      expect(url).not.toContain('0714')
      expect(url).not.toContain('Hassan')
    })
  })

  describe('5. Direct Reward Tracking & Settlement Lifecycle (Section 8)', () => {
    it('executes merchant payment reporting, partner receipt confirmation, and disputes', () => {
      // Create test case
      const created = submitCustomerReferral({
        dealId: 'deal_settlement_test',
        dealTitle: 'Heavy Agricultural Tractor',
        dealSlug: 'tractor-test',
        partnerUserId: 'alex',
        partnerName: 'Alex Mwakasege',
        partnerPhone: '+255712345678',
        customerFirstName: 'Grace',
        customerLastName: 'Mboya',
        customerPhone: '0788776655',
        contactPermissionConfirmed: true,
        rewardAmountTZS: 1850000,
        rewardDisplay: 'TZS 1,850,000 Flat Reward',
      })

      expect(created.success).toBe(true)
      const caseId = created.referralCase!.id

      // 1. Progress case stage to COMPLETED
      const stageUpdated = updateReferralCaseStage(caseId, 'COMPLETED', {
        rewardStatus: 'AWAITING_MERCHANT_PAYMENT',
        coordinatorNotes: 'Customer settled directly with merchant. Reward due from merchant.',
      })
      expect(stageUpdated).toBe(true)

      // 2. Merchant reports direct payment
      const paymentReported = reportMerchantDirectPayment(caseId, {
        paymentReference: 'MPESA-REF-2026-ABC',
        notes: 'Disbursed via Vodacom M-Pesa to partner registered phone.',
      })
      expect(paymentReported).toBe(true)

      let partnerCases = listPartnerReferralCases('alex')
      let currentCase = partnerCases.find((c) => c.id === caseId)
      expect(currentCase?.rewardStatus).toBe('MERCHANT_REPORTS_PAID')
      expect(currentCase?.merchantPaymentReference).toBe('MPESA-REF-2026-ABC')

      // 3. Partner confirms receipt
      const confirmed = confirmPartnerRewardReceipt(caseId, 'alex')
      expect(confirmed).toBe(true)

      partnerCases = listPartnerReferralCases('alex')
      currentCase = partnerCases.find((c) => c.id === caseId)
      expect(currentCase?.rewardStatus).toBe('PARTNER_CONFIRMS_RECEIPT')
      expect(currentCase?.partnerReceiptConfirmedAt).toBeDefined()

      // 4. Dispute handling test
      const disputed = disputeReferralReward(caseId, 'Amount received was less than agreed reward')
      expect(disputed).toBe(true)

      partnerCases = listPartnerReferralCases('alex')
      currentCase = partnerCases.find((c) => c.id === caseId)
      expect(currentCase?.rewardStatus).toBe('DISPUTED')
      expect(currentCase?.disputeReason).toBe('Amount received was less than agreed reward')
    })
  })

  describe('6. Terms Acceptance & Participation Tracking ("Join & Promote" - Section 5)', () => {
    it('creates deal participation without duplicate records on repeated joins', () => {
      const dealId = testDealId
      const partnerContext = {
        userId: 'partner_unique_test',
        userRole: 'PARTNER',
      }

      // First join
      const join1 = joinOpportunityDeal(dealId, partnerContext)
      expect(join1.success).toBe(true)
      expect(join1.isAlreadyEnrolled).toBeFalsy()
      expect(join1.trackingCode).toBeDefined()

      // Second join with same partner
      const join2 = joinOpportunityDeal(dealId, partnerContext)
      expect(join2.success).toBe(true)
      expect(join2.isAlreadyEnrolled).toBe(true)
      expect(join2.trackingCode).toBe(join1.trackingCode)
    })
  })
})
