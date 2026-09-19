import { describe, it, expect, beforeEach } from 'vitest'
import { internationalService } from '@/modules/international/service'
import { convertToEstimatedTZS, formatCurrencyValue, searchCountries } from '@/modules/international/countries'

describe('LUMO International Subsystem', () => {
  it('allows an opportunity submitter to submit without subscription or login', async () => {
    const submission = await internationalService.createSubmission({
      submitterType: 'BUSINESS',
      fullName: 'Ahmed Al Mansoori',
      organization: 'Gulf Solar Ventures FZE',
      countryCode: 'AE',
      countryName: 'United Arab Emirates',
      city: 'Dubai',
      category: 'PRODUCTS_SUPPLY',
      intent: 'OFFERING',
      title: 'Tier-1 Photovoltaic Modules for African Utility Projects',
      description: 'Supplying containerized bifacial 550W solar modules with direct CIF delivery to Dar es Salaam port.',
      declaredValue: 350000,
      currency: 'USD',
      whatNeededFromLumo: 'Verified EPC contractors and commercial buyers in East Africa',
      whatsapp: '+971501234567',
      email: 'ahmed@gulfsolar.ae',
      preferredContact: 'WHATSAPP',
    })

    expect(submission.id).toBeDefined()
    expect(submission.reference).toMatch(/^LUMO-INT-2026-\d{5}$/)
    expect(submission.status).toBe('SUBMITTED')
    expect(submission.countryCode).toBe('AE')
    expect(submission.currency).toBe('USD')

    // WhatsApp Message composer
    const wa = internationalService.buildWhatsAppMessage(submission)
    expect(wa.text).toContain('Ahmed Al Mansoori')
    expect(wa.text).toContain(submission.reference)
    expect(wa.url).toContain('wa.me/971501234567')
  })

  it('handles Admin workflow: review, verify, and publish opportunity to marketplace', async () => {
    // 1. Submit
    const submission = await internationalService.createSubmission({
      submitterType: 'INDIVIDUAL',
      fullName: 'Njoroge Kamau',
      countryCode: 'KE',
      countryName: 'Kenya',
      city: 'Nairobi',
      category: 'AGRICULTURE',
      intent: 'OFFERING',
      title: 'Bulk Export of Grade-A Kenyan Macadamia Nuts',
      description: 'Export-certified vacuum-sealed macadamia nuts with full phyto-sanitary clearance.',
      declaredValue: 120000,
      currency: 'USD',
      whatsapp: '+254712345678',
      email: 'njoroge@nairobiharvest.co.ke',
      preferredContact: 'BOTH',
    })

    // 2. Admin reviews & updates status
    const underReview = await internationalService.updateSubmissionStatus(
      submission.id,
      'UNDER_REVIEW',
      'Contacted via WhatsApp, requested phytosanitary certificates',
      'Compliance Admin'
    )
    expect(underReview?.status).toBe('UNDER_REVIEW')

    // 3. Admin logs verification communication
    await internationalService.logCommunication({
      submissionId: submission.id,
      channel: 'WHATSAPP',
      direction: 'OUTBOUND',
      subject: 'Certificate Verification Completed',
      messageBody: 'Supplier submitted KEPHIS phytosanitary certificate and company registry.',
      actorName: 'Checker Officer',
    })

    const comms = await internationalService.getCommunications(submission.id)
    expect(comms.length).toBeGreaterThanOrEqual(2)

    // 4. Admin publishes to marketplace
    const opp = await internationalService.publishOpportunity(
      submission.id,
      {
        rewardAmount: 3600,
        rewardCurrency: 'USD',
        commercialTerms: 'Contract CIF Mombasa / Dar es Salaam. 30% advance, 70% against Bill of Lading.',
      },
      'Super Admin'
    )

    expect(opp).toBeDefined()
    expect(opp?.status).toBe('ACTIVE')
    expect(opp?.reference).toBe(submission.reference)
    expect(opp?.countryFlag).toBe('🇰🇪')
    expect(opp?.rewardAmount).toBe(3600)
    expect(opp?.rewardCurrency).toBe('USD')

    // Submission status should be automatically updated to PUBLISHED
    const refreshed = await internationalService.getSubmissionById(submission.id)
    expect(refreshed?.status).toBe('PUBLISHED')
  })

  it('supports multi-currency international subscriptions and access gating', async () => {
    const testUserId = `usr_test_${Date.now()}`

    // Initially user does NOT have international access
    const initialAccess = await internationalService.hasInternationalAccess(testUserId)
    expect(initialAccess).toBe(false)

    // User subscribes in EUR currency
    const membership = await internationalService.createOrUpdateMembership({
      userId: testUserId,
      userName: 'Jean-Luc Picard',
      userEmail: 'jeanluc@starfleet.org',
      planCode: 'INT_SEMI_ANNUAL',
      currency: 'EUR',
      amountPaid: 229,
      paymentMethod: 'ONLINE_CARD',
      paymentReference: 'PAY-INT-TEST-001',
    })

    expect(membership.status).toBe('ACTIVE')
    expect(membership.currency).toBe('EUR')
    expect(membership.amountPaid).toBe(229)
    expect(new Date(membership.expiresAt).getTime()).toBeGreaterThan(Date.now())

    // Now user holds active INTERNATIONAL_PRIVATE_ACCESS
    const updatedAccess = await internationalService.hasInternationalAccess(testUserId)
    expect(updatedAccess).toBe(true)

    // Admin can extend or manage subscription
    const extended = await internationalService.updateMembershipAdmin(membership.id, 'EXTEND', {
      days: 30,
      notes: 'Customer support courtesy extension',
    })
    expect(extended?.notes).toContain('Customer support courtesy extension')

    // Member can submit inquiry
    const inquiry = await internationalService.createInquiry({
      opportunityId: 'sample-opp-id',
      memberId: testUserId,
      memberName: 'Jean-Luc Picard',
      memberEmail: 'jeanluc@starfleet.org',
      inquiryType: 'HAVE_CONNECTION',
      message: 'I have a vetted distributor in Lyon willing to take 2 containers monthly.',
    })

    expect(inquiry.status).toBe('NEW')
    expect(inquiry.inquiryType).toBe('HAVE_CONNECTION')
  })

  it('calculates dynamic statistics without demo data or hardcoded numbers', async () => {
    const stats = await internationalService.getDynamicStats()
    expect(stats.activeCountriesCount).toBeGreaterThanOrEqual(1)
    expect(stats.opportunitiesCount).toBeGreaterThanOrEqual(1)
    expect(stats.membersCount).toBeGreaterThanOrEqual(1)
    expect(stats.totalEquivalentTZS).toBeGreaterThan(0)
    expect(stats.countryDistribution).toBeDefined()
  })

  it('correctly converts ISO countries and multi-currency exchange estimations', () => {
    const kenyaSearch = searchCountries('Kenya')
    expect(kenyaSearch.length).toBe(1)
    expect(kenyaSearch[0].code).toBe('KE')
    expect(kenyaSearch[0].flag).toBe('🇰🇪')

    const tzsEquiv = convertToEstimatedTZS(1000, 'USD')
    expect(tzsEquiv).toBe(2600000)

    const formattedUSD = formatCurrencyValue(150000, 'USD')
    expect(formattedUSD).toBe('$ 150,000')

    const formattedAED = formatCurrencyValue(450000, 'AED')
    expect(formattedAED).toBe('AED 450,000')
  })
})
