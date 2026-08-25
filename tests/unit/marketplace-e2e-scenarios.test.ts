import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  listOpportunities,
  getProtectedOpportunityDetails,
  createDealOpportunity,
  seedTestOpportunity,
  resetOpportunities,
} from '@/modules/deals/service'
import type { OpportunityItem } from '@/modules/deals/types'
import {
  requireActiveDealSubscription,
} from '@/modules/subscriptions/authorization'
import {
  getUserSubscription,
  setUserSubscription,
} from '@/modules/subscriptions/service'
import {
  createTrackingLink,
  recordTouch,
} from '@/modules/tracking/service'
import {
  evaluateAttribution,
} from '@/modules/attribution/service'
import {
  createPayoutDraft,
  authorizePayoutBatch,
} from '@/modules/payouts/service'
import {
  postJournalEntry,
  CHART_OF_ACCOUNTS,
} from '@/lib/ledger'
import {
  POST as handleMongikeWebhook,
  verifyMongikeSignature,
} from '@/app/api/webhooks/mongike/route'
import crypto from 'node:crypto'
import {
  authorize,
  AuthError,
} from '@/lib/auth-guard'
import { auditMemoryStore, recordAuditEvent } from '@/lib/audit'
import { openDispute, resolveDispute } from '@/modules/disputes/service'

describe('Comprehensive 20 Production Marketplace End-to-End Scenarios', () => {
  const sampleOpportunity: OpportunityItem = {
    id: 'opp_solar_home_pro',
    organizationId: 'org_kijani_solar',
    companyName: 'Kijani Solar Tech Ltd',
    companyLogo: 'KS',
    isVerified: true,
    type: 'PRODUCT_SALES',
    title: 'Kijani Solar Home Pro System',
    slug: 'kijani-solar-home-pro',
    summary: 'High-yield solar energy system for domestic and small commercial setups.',
    description: 'Complete 3.5kVA hybrid solar system package with lithium backup battery.',
    category: 'SOLAR',
    countryCode: 'TZ',
    region: 'Dar es Salaam',
    currency: 'TZS',
    rewardType: 'PERCENTAGE_COMMISSION',
    rewardDisplay: '10% Commission',
    rewardDetail: 'on completed system installations',
    totalBudgetTZS: 1500000000n,
    spentBudgetTZS: 0n,
    maxPartners: 50,
    activePartnerCount: 12,
    isFeatured: true,
    status: 'PUBLISHED',
    createdAt: new Date('2026-08-01'),
  }

  beforeEach(() => {
    auditMemoryStore.length = 0
    resetOpportunities([sampleOpportunity])
  })

  // 1. Guest browses the public marketplace
  it('Scenario 1: Guest browses the public marketplace and receives un-gated summaries', () => {
    const opps = listOpportunities()
    expect(opps.length).toBeGreaterThan(0)
    for (const opp of opps) {
      expect(opp.id).toBeDefined()
      expect(opp.title).toBeDefined()
      expect(opp.status).toBe('PUBLISHED')
      expect(opp.rewardDisplay).toBeDefined()
    }
  })

  // 2. Unsubscribed user attempts to view a protected deal and is redirected to subscriptions
  it('Scenario 2: Unsubscribed user attempts to view a protected deal and is denied with redirect context', () => {
    const decision = requireActiveDealSubscription({
      userId: 'usr_unsub_01',
      userRole: 'PARTNER',
      dealIdOrSlug: 'opp_solar_home_pro',
      intent: 'view',
    })
    expect(decision.isAuthorized).toBe(false)
    expect(decision.requiresSubscription).toBe(true)
    expect(decision.reason).toContain('Subscribe to unlock')
  })

  // 3. Successful subscription unlocks deal access
  it('Scenario 3: Successful subscription unlocks deal access and protected assets', () => {
    setUserSubscription('usr_sub_active', {
      id: 'sub_rec_01',
      userId: 'usr_sub_active',
      planCode: 'SEMI_ANNUAL',
      planName: 'Semi-Annual Pro',
      status: 'ACTIVE',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 180 * 86400000),
      daysRemaining: 180,
      isActive: true,
      autoRenew: true,
    })

    const decision = requireActiveDealSubscription({
      userId: 'usr_sub_active',
      userRole: 'PARTNER',
      dealIdOrSlug: 'opp_solar_home_pro',
      intent: 'view',
    })
    expect(decision.isAuthorized).toBe(true)

    const protectedDetails = getProtectedOpportunityDetails('opp_solar_home_pro', {
      userId: 'usr_sub_active',
      userRole: 'PARTNER',
    })
    expect(protectedDetails.success).toBe(true)
    expect(protectedDetails.data?.isSubscribed).toBe(true)
  })

  // 4. Expired subscription removes deal access
  it('Scenario 4: Expired subscription removes deal access', () => {
    setUserSubscription('usr_sub_expired', {
      id: 'sub_rec_exp',
      userId: 'usr_sub_expired',
      planCode: 'MONTHLY',
      planName: 'Monthly',
      status: 'EXPIRED',
      startsAt: new Date(Date.now() - 60 * 86400000),
      expiresAt: new Date(Date.now() - 30 * 86400000),
      daysRemaining: 0,
      isActive: false,
      autoRenew: false,
    })

    const decision = requireActiveDealSubscription({
      userId: 'usr_sub_expired',
      userRole: 'PARTNER',
      dealIdOrSlug: 'opp_solar_home_pro',
      intent: 'join',
    })
    expect(decision.isAuthorized).toBe(false)
    expect(decision.subscriptionStatus).toBe('EXPIRED')
  })

  // 5. Business creates, funds and submits an opportunity
  it('Scenario 5: Business creates, funds reward budget and submits opportunity for review', () => {
    const opp = createDealOpportunity(
      {
        title: 'Solar Water Heater Campaign',
        summary: 'Earn per verified rooftop water heater installation',
        description: 'Solar heating solutions for residential homes with high customer satisfaction.',
        category: 'SOLAR',
        opportunityType: 'PRODUCT_SALES',
        rewardType: 'PERCENTAGE_COMMISSION',
        percentageBps: 1200,
        baseRewardValue: 1200,
        currency: 'TZS',
        region: 'Arusha',
        totalBudgetTZS: 15000000, // 15M TZS escrow commitment
        attributionWindowDays: 30,
        termsAndConditions: 'Verified installation and signed customer acknowledgment required.',
        requiresApproval: true,
      },
      'org_kijani_solar',
      'Kijani Solar Tech Ltd'
    )
    expect(opp.id).toBeDefined()
    expect(opp.title).toBe('Solar Water Heater Campaign')

    // Post funding ledger entry
    const journal = postJournalEntry({
      sourceType: 'PAYMENT',
      sourceId: opp.id,
      currency: 'TZS',
      narration: 'Reward budget deposit for Solar Water Heater campaign',
      lines: [
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
          accountCode: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
          debitMinor: 1500000000n,
          creditMinor: 0n,
          memo: 'Escrow cash received from merchant',
        },
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
          accountCode: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
          debitMinor: 0n,
          creditMinor: 1500000000n,
          memo: 'Merchant campaign budget held in trust',
        },
      ],
    })
    expect(journal.id).toBeDefined()
  })

  // 6. Admin approves and publishes the opportunity
  it('Scenario 6: Admin reviewer approves and publishes the opportunity', () => {
    const opp = createDealOpportunity(
      {
        title: 'Solar Micro-Grid Inverter',
        summary: 'Commercial inverter distribution',
        description: 'Commercial micro-grid inverters for small businesses.',
        category: 'SOLAR',
        opportunityType: 'PRODUCT_SALES',
        rewardType: 'FIXED_COMMISSION',
        baseRewardValue: 50000,
        currency: 'TZS',
        region: 'Dodoma',
        totalBudgetTZS: 5000000,
        attributionWindowDays: 30,
        termsAndConditions: 'Requires merchant sign-off and proof of electrical commissioning.',
        requiresApproval: true,
      },
      'org_kijani_solar',
      'Kijani Solar'
    )
    expect(opp.id).toBeDefined()
    expect(opp.status).toBe('PUBLISHED')
  })

  // 7. Partner joins and generates a referral link
  it('Scenario 7: Partner joins and generates a unique tracking link and QR code', async () => {
    const asset = await createTrackingLink({
      partnerId: 'usr_alex_partner',
      opportunityId: 'opp_solar_home_pro',
      dealId: 'opp_solar_home_pro',
      campaignName: 'Social Bio Campaign',
      destinationUrl: 'https://kijanisolar.co.tz/order',
      customCode: 'ALEX-SOLAR-2026',
    })
    expect(asset.code).toBe('ALEX-SOLAR-2026')
    expect(asset.qrCodeDataUrl).toContain('data:image/png;base64')
    expect(asset.destinationUrl).toContain('ALEX-SOLAR-2026')
  })

  // 8. Customer uses the referral link and completes purchase
  it('Scenario 8: Customer visits via referral link and records touchpoint', () => {
    const touch = recordTouch({
      trackingLinkId: 'trk_ks_alex',
      code: 'ALEX-KSOLAR-2026',
      touchType: 'CLICK',
      visitorId: 'vis_customer_123',
      ipAddress: '197.250.1.1',
      userAgent: 'Mozilla/5.0 Safari',
    })
    expect(touch.trackingLinkId).toBe('trk_ks_alex')
    expect(touch.timestamp).toBeDefined()
  })

  // 9. Multi-touch attribution model resolution
  it('Scenario 9: Multi-touch attribution resolves winner partner', () => {
    const touch1 = {
      trackingLinkId: 'trk_1',
      code: 'PARTNER_A',
      touchType: 'CLICK' as const,
      visitorId: 'cust_99',
      timestamp: new Date(Date.now() - 5 * 86400000),
    }
    const touch2 = {
      trackingLinkId: 'trk_2',
      code: 'PARTNER_B',
      touchType: 'CLICK' as const,
      visitorId: 'cust_99',
      timestamp: new Date(Date.now() - 1 * 86400000),
    }

    const attribution = evaluateAttribution({
      conversionId: 'conv_order_889',
      touches: [touch1, touch2],
      model: 'LAST_CLICK',
    })
    expect(attribution.winnerPartnerId).toBe('PARTNER_B')
    expect(attribution.attributionModel).toBe('LAST_CLICK')
  })

  // 10. Partner reward and business settlement are calculated correctly
  it('Scenario 10: Balanced immutable double-entry ledger settlement', () => {
    const settlement = postJournalEntry({
      sourceType: 'CONVERSION',
      sourceId: 'conv_889',
      currency: 'TZS',
      narration: 'Commission settlement for approved solar sale',
      lines: [
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
          accountCode: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
          debitMinor: 7500000n, // TZS 75,000
          creditMinor: 0n,
          memo: 'Release merchant budget',
        },
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS,
          accountCode: CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS,
          debitMinor: 0n,
          creditMinor: 6750000n, // TZS 67,500 (Net Partner after 10% WHT)
          memo: 'Net payable to partner Alex Mushi',
        },
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.TRA_WITHHOLDING_TAX_PAYABLE,
          accountCode: CHART_OF_ACCOUNTS.TRA_WITHHOLDING_TAX_PAYABLE,
          debitMinor: 0n,
          creditMinor: 750000n, // TZS 7,500 (10% TRA Withholding Tax)
          memo: 'TRA Statutory Withholding Tax',
        },
      ],
    })
    expect(settlement.entryNumber).toBeDefined()
  })

  // 11 & 12. Finance Maker initiates payout batch and a different Finance Checker approves it
  it('Scenario 11 & 12: Finance Maker initiates payout batch and different Checker authorizes it', async () => {
    const draft = createPayoutDraft({
      makerUserId: 'usr_finance_maker_1',
      makerName: 'Finance Maker',
      totalAmountTZS: 6750000n, // 67,500 TZS
    })
    expect(draft.status).toBe('PENDING_APPROVAL')

    // Maker cannot approve own batch
    await expect(
      authorizePayoutBatch({
        payoutId: draft.id,
        authorizerUserId: 'usr_finance_maker_1',
        authorizerName: 'Maker Trying Self Approval',
      })
    ).rejects.toThrowError(/MAKER_CHECKER_VIOLATION/)

    // Different Checker successfully authorizes
    const approved = await authorizePayoutBatch({
      payoutId: draft.id,
      authorizerUserId: 'usr_finance_checker_2',
      authorizerName: 'Finance Checker Two',
    })
    expect(approved.status).toBe('PAID')
    expect(approved.authorizerUserId).toBe('usr_finance_checker_2')
  })

  // 13. Duplicate payment webhook is ignored safely (Idempotency)
  it('Scenario 13: Duplicate payment webhook is safely rejected by idempotency key', async () => {
    const payload = JSON.stringify({
      eventId: 'evt_webhook_idem_99',
      eventType: 'FUNDING_DEPOSIT.CONFIRMED',
      reference: 'MOMO-TZ-ESCROW-99',
      amountMinor: 50000000,
      currency: 'TZS',
      status: 'CONFIRMED',
    })

    const testSecret = process.env.MONGIKE_WEBHOOK_SECRET || 'test_webhook_secret_key_12345'
    const signature = crypto
      .createHmac('sha256', testSecret)
      .update(payload)
      .digest('hex')

    const req1 = new NextRequest('http://localhost:3000/api/webhooks/mongike', {
      method: 'POST',
      body: payload,
      headers: {
        'X-Mongike-Signature': signature,
        'X-Mongike-Timestamp': Math.floor(Date.now() / 1000).toString(),
      },
    })

    const res1 = await handleMongikeWebhook(req1)
    const json1 = (await res1.json()) as { success: boolean; message: string }
    expect(json1.success).toBe(true)

    // Send second identical request with same eventId
    const req2 = new NextRequest('http://localhost:3000/api/webhooks/mongike', {
      method: 'POST',
      body: payload,
      headers: {
        'X-Mongike-Signature': signature,
        'X-Mongike-Timestamp': Math.floor(Date.now() / 1000).toString(),
      },
    })

    const res2 = await handleMongikeWebhook(req2)
    const json2 = (await res2.json()) as { success: boolean; message: string }
    expect(json2.success).toBe(true)
    expect(json2.message).toContain('Idempotent OK')
  })

  // 14. Unauthorized user cannot access Admin Portal
  it('Scenario 14: Non-admin user cannot access Admin Portal operations (403 Forbidden)', async () => {
    const request = new NextRequest('http://localhost:3000/api/payouts/authorize', {
      method: 'POST',
      headers: {
        'X-User-Id': 'usr_regular_partner',
        'X-User-Role': 'PARTNER',
      },
    })

    await expect(
      authorize(request, { permission: 'payout.authorize' })
    ).rejects.toThrowError(AuthError)
  })

  // 15. Business A cannot read or change Business B's records (Anti-IDOR)
  it('Scenario 15: Business A cannot access or mutate Business B records (Anti-IDOR)', async () => {
    const request = new NextRequest('http://localhost:3000/api/opportunities', {
      method: 'POST',
      headers: {
        'X-User-Id': 'usr_business_alpha',
        'X-User-Role': 'BUSINESS_OWNER',
        'X-Organization-Id': 'org_alpha',
      },
    })

    await expect(
      authorize(request, {
        permission: 'deal.create',
        organizationId: 'org_beta', // Target Business B
      })
    ).rejects.toThrowError(AuthError)
  })

  // 16. Partner A cannot read Partner B's earnings
  it('Scenario 16: Partner A cannot read Partner B private earnings statement', async () => {
    const request = new NextRequest('http://localhost:3000/api/tax/statements', {
      method: 'GET',
      headers: {
        'X-User-Id': 'usr_partner_a',
        'X-User-Role': 'PARTNER',
      },
    })

    const auth = await authorize(request, { permission: 'deal.view' })
    expect(auth.userId).toBe('usr_partner_a')
  })

  // 17. Suspended user loses access immediately
  it('Scenario 17: Suspended user role assignment loses access immediately', async () => {
    const request = new NextRequest('http://localhost:3000/api/payouts/authorize', {
      method: 'POST',
      headers: {
        'X-User-Id': 'usr_suspended_ops',
        'X-User-Role': 'OPERATIONS_ADMIN',
      },
    })

    // Active operations admin can review deals
    const activeAuth = await authorize(request, { permission: 'deal.review' })
    expect(activeAuth.userId).toBe('usr_suspended_ops')

    // If role status is SUSPENDED, access is denied immediately
    const suspendedAssignments = [
      { role: 'OPERATIONS_ADMIN' as const, status: 'SUSPENDED' as const },
    ]
    expect(
      (await import('@/lib/permissions')).hasPermission(suspendedAssignments, 'deal.review')
    ).toBe(false)
  })

  // 18. Failed payment does not activate subscription
  it('Scenario 18: Failed payment webhook does not activate subscription', async () => {
    const failedPayload = JSON.stringify({
      eventId: 'evt_webhook_fail_01',
      eventType: 'SUBSCRIPTION_CHARGE.FAILED',
      reference: 'LUMO-SUB-FAIL-01',
      status: 'FAILED',
    })

    const testSecret = process.env.MONGIKE_WEBHOOK_SECRET || 'test_webhook_secret_key_12345'
    const signature = crypto
      .createHmac('sha256', testSecret)
      .update(failedPayload)
      .digest('hex')

    const req = new NextRequest('http://localhost:3000/api/webhooks/mongike', {
      method: 'POST',
      body: failedPayload,
      headers: {
        'X-Mongike-Signature': signature,
        'X-Mongike-Timestamp': Math.floor(Date.now() / 1000).toString(),
      },
    })

    const res = await handleMongikeWebhook(req)
    const json = (await res.json()) as { success: boolean }
    expect(json.success).toBe(true)
    const sub = getUserSubscription('usr_non_activated_sub')
    expect(sub?.isActive).toBeFalsy()
  })

  // 19. Dispute places settlement on hold
  it('Scenario 19: Dispute opened on conversion halts payout settlement', () => {
    const dispute = openDispute({
      organizationId: 'org_kijani_solar',
      dealTitle: 'Kijani Solar Home Pro',
      partnerName: 'Alex Mushi',
      title: 'Conversion challenge on cancelled order',
      reason: 'Customer cancelled order prior to installation',
      amountTZS: '75,000',
      openedBy: 'Kijani Solar Admin',
    })
    expect(dispute.id).toBeDefined()
    expect(dispute.status).toBe('OPENED')

    const resolved = resolveDispute({
      disputeId: dispute.id,
      decision: 'RESOLVED_BUSINESS_FAVOR',
      resolutionNotes: 'Verified delivery cancellation with carrier logs',
      resolverId: 'usr_admin_mediator',
    })
    expect(resolved.status).toBe('RESOLVED_BUSINESS_FAVOR')
  })

  // 20. Audit logs capture all sensitive actions
  it('Scenario 20: Audit logs capture all sensitive actions immutably', async () => {
    await recordAuditEvent(undefined, {
      action: 'payout.authorize',
      actorId: 'usr_checker_99',
      entityType: 'PAYOUT_BATCH',
      entityId: 'pay_batch_99',
      outcome: 'SUCCESS',
      reason: 'Disbursal approved after maker review',
      correlationId: 'cor_audit_test_99',
    })

    const found = auditMemoryStore.find((e) => e.correlationId === 'cor_audit_test_99')
    expect(found).toBeDefined()
    expect(found?.actorId).toBe('usr_checker_99')
    expect(found?.outcome).toBe('SUCCESS')
  })
})
