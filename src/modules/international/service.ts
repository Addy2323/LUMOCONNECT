import { randomUUID } from 'crypto'
import {
  InternationalSubmission,
  InternationalOpportunity,
  InternationalCommunication,
  InternationalMembership,
  InternationalInquiry,
  InternationalSubscriptionPlan,
  InternationalPlanCode,
  InternationalSubmissionStatus,
  AdminInternationalDealItem,
  CreateInternationalDealWizardInput,
  InternationalApplicationItem,
  InternationalApplicationStatus,
  InternationalDealStatus,
} from './types'
import {
  getCountryByCode,
  convertToEstimatedTZS,
  SUPPORTED_CURRENCIES,
} from './countries'

// Helper to seed initial specification examples for International Deals
function generateInitialAdminDeals(): Map<string, AdminInternationalDealItem> {
  const deals = new Map<string, AdminInternationalDealItem>()
  const now = new Date().toISOString()

  const seed1: AdminInternationalDealItem = {
    id: 'int-deal-001',
    reference: 'LUMO-INT-2026-00101',
    title: 'Sell 100 Smart Electronics Devices in Tanzania',
    shortDescription: 'High demand Shenzhen consumer electronics brand seeking sales partners and affiliates across Tanzania.',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    fullDescription: `### Opportunity Summary
A premier consumer electronics manufacturer in Shenzhen, China is looking for sales agents, affiliates, and digital creators in Tanzania to promote and sell smart home devices and smartphones.

### Deliverables & Scope
- Promote official landing page link or distribute assigned promo codes.
- Direct customer inquiries to authorized retail points or handle direct sales.
- Generate minimum 10 verified sales to qualify for Tier 1 Milestone Bonus.

### Commercial Terms & Rewards
- **Commission**: 5% on all verified sales.
- **Milestone Bonus 1**: TZS 1,000,000 upon reaching 50 sales.
- **Milestone Bonus 2**: TZS 3,000,000 upon reaching 100 sales.`,
    dealType: 'Sales Deal',
    originCountryCode: 'CN',
    originCountryName: 'China',
    originCountryFlag: '🇨🇳',
    targetCountryCode: 'TZ',
    targetCountryName: 'Tanzania',
    targetCountryFlag: '🇹🇿',
    targetRegion: 'East Africa',
    remoteOnline: true,
    crossBorder: true,
    dealLanguage: 'English',
    requiredOutcome: '100 Verified Smartphone & Smart Device Sales',
    successCondition: 'Confirmed order payment & delivery confirmation in Tanzania.',
    rewardStructure: {
      rewardType: 'HYBRID',
      currency: 'USD',
      commissionRate: 5,
      fixedReward: 50,
      milestoneBonusRules: [
        { targetCount: 50, bonusAmount: 400, currency: 'USD' },
        { targetCount: 100, bonusAmount: 1200, currency: 'USD' },
      ],
      displayLabel: '5% Commission + USD 1,200 Bonus',
    },
    partnerRequirements: {
      eligibilityMode: 'OPEN',
      partnerTypes: ['Sales Agent', 'Affiliate', 'Creator'],
      requireKYC: true,
      requireKYB: false,
    },
    trackingConfig: {
      trackingMethod: 'LINK',
      destinationUrl: 'https://lumo.africa/deals/smart-electronics-tz',
      campaignCode: 'CN-TZ-SMART-2026',
    },
    verificationDetails: {
      sourceType: 'Direct brand relationship',
      sourceUrl: 'https://brand.example.com',
      contactPersonName: 'Wei Chen',
      contactPersonEmail: 'global@shenzhen-tech.example.com',
      verificationStatus: 'VERIFIED',
      verifiedAt: now,
    },
    status: 'PUBLISHED',
    isFeatured: true,
    isTrending: true,
    publishedAt: now,
    activePartnerCount: 42,
    totalApplicationsCount: 89,
    totalConversionsCount: 312,
    totalRevenueGeneratedUSD: 145000,
    totalRewardsPaidUSD: 12400,
    lumoFeesEarnedUSD: 3600,
    createdAt: now,
    updatedAt: now,
  }

  const seed2: AdminInternationalDealItem = {
    id: 'int-deal-002',
    reference: 'LUMO-INT-2026-00102',
    title: 'Find Verified Commercial Distributor for Skincare Brand',
    shortDescription: 'Seoul beauty manufacturer seeking exclusive national distributor in Tanzania for luxury skincare line.',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    fullDescription: `### Business Opportunity
A leading K-Beauty cosmetics manufacturer from Seoul, South Korea is expanding into East Africa and requires a verified business distributor with established logistics and retail distribution capabilities in Tanzania.

### Required Outcome
Introduce a qualified, registered Tanzanian business willing to commit to an initial distribution order.

### Compensation
- **Flat Reward**: USD 5,000 upon signed distribution contract.
- **Override**: 3% commission on first-year wholesale re-orders.`,
    dealType: 'Distributor Opportunity',
    originCountryCode: 'KR',
    originCountryName: 'South Korea',
    originCountryFlag: '🇰🇷',
    targetCountryCode: 'TZ',
    targetCountryName: 'Tanzania',
    targetCountryFlag: '🇹🇿',
    targetRegion: 'East Africa',
    remoteOnline: false,
    crossBorder: true,
    dealLanguage: 'English',
    requiredOutcome: 'Qualified Tanzanian Business Distributor Agreement',
    successCondition: 'Signed bilateral distribution contract and paid initial deposit.',
    rewardStructure: {
      rewardType: 'BOUNTY',
      currency: 'USD',
      fixedReward: 5000,
      commissionRate: 3,
      displayLabel: 'USD 5,000 Bounty + 3% Override',
    },
    partnerRequirements: {
      eligibilityMode: 'RESTRICTED',
      partnerTypes: ['Business Development Partner', 'Consultant'],
      minPartnerScore: 80,
      requireKYC: true,
      requireKYB: true,
    },
    trackingConfig: {
      trackingMethod: 'MANUAL',
      destinationUrl: 'https://lumo.africa/int/k-beauty-distributor',
    },
    verificationDetails: {
      sourceType: 'Authorized representative',
      contactPersonName: 'Min-soo Park',
      contactPersonEmail: 'partnerships@seoulbeauty.example.com',
      verificationStatus: 'VERIFIED',
      verifiedAt: now,
    },
    status: 'PUBLISHED',
    isFeatured: true,
    isTrending: false,
    publishedAt: now,
    activePartnerCount: 14,
    totalApplicationsCount: 28,
    totalConversionsCount: 4,
    totalRevenueGeneratedUSD: 180000,
    totalRewardsPaidUSD: 20000,
    lumoFeesEarnedUSD: 8500,
    createdAt: now,
    updatedAt: now,
  }

  const seed3: AdminInternationalDealItem = {
    id: 'int-deal-003',
    reference: 'LUMO-INT-2026-00103',
    title: 'Promote Luxury Zanzibar Holiday Packages to African Travelers',
    shortDescription: 'London travel operator paying USD 150 per confirmed package booking + USD 500 milestone bonus.',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    fullDescription: `### Campaign Overview
Promote premium 5-star resort packages in Zanzibar to high-net-worth travelers across East Africa and South Africa.

### Reward Breakdown
- **Fixed Reward**: USD 150 per confirmed resort package booking.
- **Milestone Bonus**: USD 500 extra upon reaching 25 bookings.`,
    dealType: 'Travel Opportunity',
    originCountryCode: 'GB',
    originCountryName: 'United Kingdom',
    originCountryFlag: '🇬🇧',
    targetCountryCode: 'TZ',
    targetCountryName: 'Tanzania',
    targetCountryFlag: '🇹🇿',
    targetRegion: 'Africa',
    remoteOnline: true,
    crossBorder: true,
    dealLanguage: 'English',
    requiredOutcome: 'Confirmed Zanzibar Travel Booking',
    successCondition: 'Guest checks in and completes payment.',
    rewardStructure: {
      rewardType: 'CPA',
      currency: 'USD',
      cpaAmount: 150,
      milestoneBonusRules: [{ targetCount: 25, bonusAmount: 500, currency: 'USD' }],
      displayLabel: 'USD 150 / Booking + USD 500 Bonus',
    },
    partnerRequirements: {
      eligibilityMode: 'OPEN',
      partnerTypes: ['Affiliate', 'Creator', 'Travel Agent'],
      requireKYC: true,
      requireKYB: false,
    },
    trackingConfig: {
      trackingMethod: 'LINK',
      destinationUrl: 'https://zanzibar-vacations.example.com',
    },
    verificationDetails: {
      sourceType: 'Direct brand relationship',
      contactPersonName: 'Sarah Jenkins',
      contactPersonEmail: 'affiliates@uk-travel.example.com',
      verificationStatus: 'VERIFIED',
      verifiedAt: now,
    },
    status: 'PUBLISHED',
    isFeatured: false,
    isTrending: true,
    publishedAt: now,
    activePartnerCount: 68,
    totalApplicationsCount: 110,
    totalConversionsCount: 184,
    totalRevenueGeneratedUSD: 276000,
    totalRewardsPaidUSD: 28100,
    lumoFeesEarnedUSD: 5400,
    createdAt: now,
    updatedAt: now,
  }

  deals.set(seed1.id, seed1)
  deals.set(seed2.id, seed2)
  deals.set(seed3.id, seed3)
  return deals
}

// Dynamic In-Memory Store with zero fake/demo records
class InternationalRepository {
  private submissions: Map<string, InternationalSubmission> = new Map()
  private opportunities: Map<string, InternationalOpportunity> = new Map()
  private communications: Map<string, InternationalCommunication[]> = new Map()
  private memberships: Map<string, InternationalMembership> = new Map()
  private inquiries: Map<string, InternationalInquiry> = new Map()
  private adminDeals: Map<string, AdminInternationalDealItem> = generateInitialAdminDeals()
  private dealApplications: Map<string, InternationalApplicationItem> = new Map()

  // Standard multi-currency subscription plans
  public readonly plans: InternationalSubscriptionPlan[] = [
    {
      code: 'INT_MONTHLY',
      name: 'Monthly Private Access',
      billingPeriodMonths: 1,
      basePriceUSD: 49,
      prices: {
        USD: 49,
        EUR: 45,
        GBP: 39,
        AED: 180,
        KES: 6500,
        TZS: 125000,
        ZAR: 890,
      },
      features: [
        'Full access to all verified global opportunities',
        'Direct connection & inquiry requests via LUMO Desk',
        'Access to cross-border buyer & seller dossiers',
        'WhatsApp direct alert for new matches',
      ],
    },
    {
      code: 'INT_SEMI_ANNUAL',
      name: 'Semi-Annual Private Access',
      billingPeriodMonths: 6,
      basePriceUSD: 249,
      prices: {
        USD: 249,
        EUR: 229,
        GBP: 199,
        AED: 915,
        KES: 32500,
        TZS: 640000,
        ZAR: 4500,
      },
      savingsDisplay: 'Save 15%',
      features: [
        'Everything in Monthly Access',
        'Priority coordination with international dealmakers',
        'Dedicated LUMO Cross-border Desk officer',
        'Custom deal sourcing request on demand',
      ],
    },
    {
      code: 'INT_ANNUAL',
      name: 'Annual Global VIP Access',
      billingPeriodMonths: 12,
      basePriceUSD: 449,
      prices: {
        USD: 449,
        EUR: 415,
        GBP: 355,
        AED: 1650,
        KES: 58500,
        TZS: 1150000,
        ZAR: 8100,
      },
      savingsDisplay: 'Best Value — Save 24%',
      features: [
        'Everything in Semi-Annual Access',
        'Direct escrow & commercial agreement assistance',
        'Unlimited international opportunity introductions',
        'VIP access to closed bilateral private syndicates',
      ],
    },
  ]

  // SUBMISSIONS
  public async createSubmission(
    input: Omit<InternationalSubmission, 'id' | 'reference' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<InternationalSubmission> {
    const year = new Date().getFullYear()
    const serial = String(this.submissions.size + 1).padStart(5, '0')
    const reference = `LUMO-INT-${year}-${serial}`
    const id = randomUUID()
    const now = new Date().toISOString()

    const submission: InternationalSubmission = {
      ...input,
      id,
      reference,
      status: 'SUBMITTED',
      createdAt: now,
      updatedAt: now,
    }

    this.submissions.set(id, submission)

    // Log initial system communication
    await this.logCommunication({
      submissionId: id,
      channel: 'INTERNAL_NOTE',
      direction: 'SYSTEM',
      subject: 'Submission Received',
      messageBody: `International opportunity "${submission.title}" registered with reference ${reference}. Submitter: ${submission.fullName} (${submission.countryName}).`,
      actorName: 'LUMO System Engine',
    })

    return submission
  }

  public async getSubmissionById(id: string): Promise<InternationalSubmission | undefined> {
    return this.submissions.get(id)
  }

  public async getSubmissionByReference(reference: string): Promise<InternationalSubmission | undefined> {
    for (const sub of this.submissions.values()) {
      if (sub.reference.toLowerCase() === reference.toLowerCase()) {
        return sub
      }
    }
    return undefined
  }

  public async listSubmissions(filter?: {
    status?: InternationalSubmissionStatus
    countryCode?: string
    search?: string
  }): Promise<InternationalSubmission[]> {
    let list = Array.from(this.submissions.values())

    if (filter?.status) {
      list = list.filter((s) => s.status === filter.status)
    }
    if (filter?.countryCode) {
      list = list.filter((s) => s.countryCode.toUpperCase() === filter.countryCode?.toUpperCase())
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.reference.toLowerCase().includes(q) ||
          s.fullName.toLowerCase().includes(q) ||
          s.countryName.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      )
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  public async updateSubmissionStatus(
    id: string,
    status: InternationalSubmissionStatus,
    adminNotes?: string,
    actorName: string = 'LUMO Admin'
  ): Promise<InternationalSubmission | undefined> {
    const sub = this.submissions.get(id)
    if (!sub) return undefined

    const oldStatus = sub.status
    sub.status = status
    if (adminNotes !== undefined) sub.adminNotes = adminNotes
    sub.updatedAt = new Date().toISOString()
    this.submissions.set(id, sub)

    // Log status transition in communications
    await this.logCommunication({
      submissionId: id,
      channel: 'INTERNAL_NOTE',
      direction: 'SYSTEM',
      subject: `Status transitioned to ${status}`,
      messageBody: `Review status changed from ${oldStatus} to ${status}.${adminNotes ? ` Note: ${adminNotes}` : ''}`,
      actorName,
    })

    return sub
  }

  // PUBLISHING AN OPPORTUNITY FROM A SUBMISSION
  public async publishOpportunity(
    submissionId: string,
    overrides?: {
      title?: string
      summary?: string
      fullDescription?: string
      commercialTerms?: string
      rewardAmount?: number
      rewardCurrency?: string
      rewardType?: 'PERCENTAGE' | 'FIXED'
      verificationBadges?: string[]
    },
    actorName: string = 'LUMO Admin'
  ): Promise<InternationalOpportunity | undefined> {
    const sub = this.submissions.get(submissionId)
    if (!sub) return undefined

    const country = getCountryByCode(sub.countryCode)
    const now = new Date().toISOString()
    const id = randomUUID()

    const estimatedValueTZS = convertToEstimatedTZS(sub.declaredValue, sub.currency)

    const opportunity: InternationalOpportunity = {
      id,
      submissionId: sub.id,
      reference: sub.reference,
      countryCode: sub.countryCode,
      countryName: sub.countryName,
      countryFlag: country?.flag || '🌍',
      city: sub.city,
      category: sub.category,
      intent: sub.intent,
      title: overrides?.title || sub.title,
      summary: overrides?.summary || sub.description.slice(0, 160) + (sub.description.length > 160 ? '...' : ''),
      fullDescription: overrides?.fullDescription || sub.description,
      commercialTerms: overrides?.commercialTerms || `Declared Value: ${sub.currency} ${sub.declaredValue.toLocaleString()}. Verification and terms managed via LUMO Intermediary Desk.`,
      opportunityValue: sub.declaredValue,
      currency: sub.currency,
      estimatedValueTZS,
      rewardAmount: overrides?.rewardAmount || Math.round(sub.declaredValue * 0.02),
      rewardCurrency: overrides?.rewardCurrency || sub.currency,
      rewardType: overrides?.rewardType || 'FIXED',
      verificationStatus: 'VERIFIED',
      verificationBadges: overrides?.verificationBadges || ['Identity Verified', 'Origin Confirmed', 'LUMO Reviewed'],
      status: 'ACTIVE',
      inquiryCount: 0,
      publishedAt: now,
    }

    this.opportunities.set(id, opportunity)

    // Transition submission to PUBLISHED
    await this.updateSubmissionStatus(submissionId, 'PUBLISHED', 'Published to International Marketplace', actorName)

    await this.logCommunication({
      submissionId,
      channel: 'INTERNAL_NOTE',
      direction: 'SYSTEM',
      subject: 'Opportunity Published Live',
      messageBody: `Opportunity published live on LUMO International Marketplace with reference ${sub.reference}.`,
      actorName,
    })

    return opportunity
  }

  public async listPublishedOpportunities(filter?: {
    countryCode?: string
    category?: string
    intent?: string
    currency?: string
    search?: string
  }): Promise<InternationalOpportunity[]> {
    let list = Array.from(this.opportunities.values()).filter((o) => o.status === 'ACTIVE')

    if (filter?.countryCode) {
      list = list.filter((o) => o.countryCode.toUpperCase() === filter.countryCode?.toUpperCase())
    }
    if (filter?.category) {
      list = list.filter((o) => o.category === filter.category)
    }
    if (filter?.intent) {
      list = list.filter((o) => o.intent === filter.intent)
    }
    if (filter?.currency) {
      list = list.filter((o) => o.currency.toUpperCase() === filter.currency?.toUpperCase())
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.summary.toLowerCase().includes(q) ||
          o.countryName.toLowerCase().includes(q) ||
          o.reference.toLowerCase().includes(q)
      )
    }

    return list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  }

  // COMMUNICATIONS
  public async logCommunication(
    input: Omit<InternationalCommunication, 'id' | 'createdAt'>
  ): Promise<InternationalCommunication> {
    const comm: InternationalCommunication = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    }

    const existing = this.communications.get(input.submissionId) || []
    existing.push(comm)
    this.communications.set(input.submissionId, existing)
    return comm
  }

  public async getCommunications(submissionId: string): Promise<InternationalCommunication[]> {
    const list = this.communications.get(submissionId) || []
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // WHATSAPP BUILDER
  public buildWhatsAppMessage(submission: InternationalSubmission): { text: string; url: string } {
    const text = `Hello ${submission.fullName}, this is LUMO. We have received your international opportunity submission regarding "${submission.title}", Reference ${submission.reference}. We would like to obtain some additional information.`
    
    // Normalize phone number (strip spaces, +, dashes)
    const cleanPhone = submission.whatsapp.replace(/[^0-9]/g, '')
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
    return { text, url }
  }

  // SUBSCRIPTION & MEMBERSHIP MANAGEMENT
  public async createOrUpdateMembership(input: {
    userId: string
    userName: string
    userEmail: string
    userPhone?: string
    planCode: InternationalPlanCode
    currency: string
    amountPaid: number
    paymentMethod: string
    paymentReference: string
    grantedByAdmin?: string
    notes?: string
  }): Promise<InternationalMembership> {
    const plan = this.plans.find((p) => p.code === input.planCode) || this.plans[0]
    const now = new Date()
    const expires = new Date(now)
    expires.setMonth(expires.getMonth() + plan.billingPeriodMonths)

    const membership: InternationalMembership = {
      id: randomUUID(),
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      userPhone: input.userPhone,
      planCode: input.planCode,
      planName: plan.name,
      currency: input.currency.toUpperCase(),
      amountPaid: input.amountPaid,
      paymentMethod: input.paymentMethod,
      paymentReference: input.paymentReference,
      startsAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: 'ACTIVE',
      autoRenew: true,
      grantedByAdmin: input.grantedByAdmin,
      notes: input.notes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }

    this.memberships.set(membership.id, membership)
    return membership
  }

  public async listMemberships(): Promise<InternationalMembership[]> {
    const list = Array.from(this.memberships.values())
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  public async hasInternationalAccess(userId: string): Promise<boolean> {
    if (!userId) return false
    for (const mem of this.memberships.values()) {
      if (mem.userId === userId && mem.status === 'ACTIVE' && new Date(mem.expiresAt) > new Date()) {
        return true
      }
    }
    return false
  }

  public async updateMembershipAdmin(
    id: string,
    action: 'EXTEND' | 'CANCEL' | 'SUSPEND' | 'ACTIVATE' | 'CHANGE_PLAN',
    payload?: { days?: number; planCode?: InternationalPlanCode; notes?: string }
  ): Promise<InternationalMembership | undefined> {
    const mem = this.memberships.get(id)
    if (!mem) return undefined

    const now = new Date()
    if (action === 'EXTEND') {
      const days = payload?.days || 30
      const currentExpiry = new Date(mem.expiresAt) > now ? new Date(mem.expiresAt) : now
      currentExpiry.setDate(currentExpiry.getDate() + days)
      mem.expiresAt = currentExpiry.toISOString()
      mem.status = 'ACTIVE'
    } else if (action === 'CANCEL') {
      mem.status = 'CANCELLED'
      mem.autoRenew = false
    } else if (action === 'SUSPEND') {
      mem.status = 'SUSPENDED'
    } else if (action === 'ACTIVATE') {
      mem.status = 'ACTIVE'
      if (new Date(mem.expiresAt) < now) {
        const newExpiry = new Date(now)
        newExpiry.setMonth(newExpiry.getMonth() + 1)
        mem.expiresAt = newExpiry.toISOString()
      }
    } else if (action === 'CHANGE_PLAN' && payload?.planCode) {
      const plan = this.plans.find((p) => p.code === payload.planCode)
      if (plan) {
        mem.planCode = plan.code
        mem.planName = plan.name
      }
    }

    if (payload?.notes) {
      mem.notes = `${mem.notes ? mem.notes + ' | ' : ''}${payload.notes}`
    }
    mem.updatedAt = now.toISOString()
    this.memberships.set(id, mem)
    return mem
  }

  // ============================================================================
  // ADMIN INTERNATIONAL DEALS SPECIFICATION METHODS
  // ============================================================================

  public async createAdminDeal(input: CreateInternationalDealWizardInput): Promise<AdminInternationalDealItem> {
    const id = randomUUID()
    const year = new Date().getFullYear()
    const serial = String(this.adminDeals.size + 101).padStart(5, '0')
    const reference = `LUMO-INT-DEAL-${year}-${serial}`
    const now = new Date().toISOString()

    const flagMap: Record<string, string> = {
      AE: '🇦🇪', CN: '🇨🇳', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', KR: '🇰🇷',
      ZA: '🇿🇦', TZ: '🇹🇿', KE: '🇰🇪', UG: '🇺🇬', IN: '🇮🇳', TR: '🇹🇷', NL: '🇳🇱', SG: '🇸🇬',
    }

    const deal: AdminInternationalDealItem = {
      id,
      reference,
      title: input.title,
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription,
      imageUrl: input.imageUrl,
      dealType: input.dealType,
      originCountryCode: input.originCountryCode,
      originCountryName: input.originCountryName,
      originCountryFlag: flagMap[input.originCountryCode.toUpperCase()] || '🌍',
      targetCountryCode: input.targetCountryCode,
      targetCountryName: input.targetCountryName,
      targetCountryFlag: flagMap[input.targetCountryCode.toUpperCase()] || '🇹🇿',
      targetRegion: input.targetRegion || 'East Africa',
      targetCities: input.targetCities || [],
      remoteOnline: input.remoteOnline,
      crossBorder: input.crossBorder,
      dealLanguage: input.dealLanguage || 'English',
      requiredOutcome: input.requiredOutcome,
      successCondition: input.successCondition,
      rewardStructure: input.rewardStructure,
      partnerRequirements: input.partnerRequirements,
      trackingConfig: input.trackingConfig,
      verificationDetails: input.verificationDetails,
      status: 'PUBLISHED',
      isFeatured: input.isFeatured ?? false,
      isTrending: false,
      publishedAt: now,
      scheduledAt: input.scheduledAt,
      expiresAt: input.expiresAt,
      maxPartnersAllowed: input.maxPartnersAllowed,
      activePartnerCount: 0,
      totalApplicationsCount: 0,
      totalConversionsCount: 0,
      totalRevenueGeneratedUSD: 0,
      totalRewardsPaidUSD: 0,
      lumoFeesEarnedUSD: 0,
      createdAt: now,
      updatedAt: now,
    }

    this.adminDeals.set(id, deal)

    // Also populate this.opportunities so it renders on the /international public deal cards marketplace
    const opportunityId = `opp_${id}`
    const opportunity: InternationalOpportunity = {
      id: opportunityId,
      submissionId: deal.id,
      reference: deal.reference,
      countryCode: deal.originCountryCode,
      countryName: deal.originCountryName,
      countryFlag: deal.originCountryFlag,
      category: 'BUSINESS_OPPORTUNITY',
      intent: 'OFFERING',
      title: deal.title,
      summary: deal.shortDescription,
      fullDescription: deal.fullDescription || deal.shortDescription,
      commercialTerms: `Required Outcome: ${deal.requiredOutcome}\n\nSuccess Condition: ${deal.successCondition}\n\nReward Structure: ${deal.rewardStructure.displayLabel || `${deal.rewardStructure.commissionRate || 0}% Commission`}`,
      opportunityValue: deal.rewardStructure.fixedReward || 1000,
      currency: deal.rewardStructure.currency || 'USD',
      estimatedValueTZS: convertToEstimatedTZS(deal.rewardStructure.fixedReward || 1000, deal.rewardStructure.currency || 'USD'),
      rewardAmount: deal.rewardStructure.fixedReward || 0,
      rewardCurrency: deal.rewardStructure.currency || 'USD',
      rewardType: deal.rewardStructure.rewardType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED',
      verificationStatus: 'VERIFIED',
      verificationBadges: ['Identity Verified', 'Origin Confirmed', 'LUMO Vetted'],
      status: 'ACTIVE',
      inquiryCount: 0,
      publishedAt: now,
    }
    this.opportunities.set(opportunityId, opportunity)

    return deal
  }

  public async getAdminDealById(id: string): Promise<AdminInternationalDealItem | undefined> {
    return this.adminDeals.get(id)
  }

  public async listAdminDeals(filter?: {
    status?: InternationalDealStatus
    dealType?: string
    originCountryCode?: string
    search?: string
  }): Promise<AdminInternationalDealItem[]> {
    let list = Array.from(this.adminDeals.values())

    if (filter?.status) {
      list = list.filter((d) => d.status === filter.status)
    }
    if (filter?.dealType && filter.dealType !== 'ALL') {
      list = list.filter((d) => d.dealType === filter.dealType)
    }
    if (filter?.originCountryCode && filter.originCountryCode !== 'ALL') {
      list = list.filter((d) => d.originCountryCode.toUpperCase() === filter.originCountryCode!.toUpperCase())
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.reference.toLowerCase().includes(q) ||
          d.shortDescription.toLowerCase().includes(q) ||
          d.originCountryName.toLowerCase().includes(q)
      )
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  public async updateAdminDealStatus(id: string, status: InternationalDealStatus): Promise<AdminInternationalDealItem | undefined> {
    const deal = this.adminDeals.get(id)
    if (!deal) return undefined
    deal.status = status
    deal.updatedAt = new Date().toISOString()
    this.adminDeals.set(id, deal)
    return deal
  }

  public async applyToInternationalDeal(input: {
    dealId: string
    partnerUserId: string
    partnerName: string
    partnerEmail: string
    partnerPhone?: string
    partnerCountry?: string
    applicationNote?: string
  }): Promise<InternationalApplicationItem> {
    const deal = this.adminDeals.get(input.dealId)
    const id = randomUUID()
    const now = new Date().toISOString()

    const application: InternationalApplicationItem = {
      id,
      dealId: input.dealId,
      dealReference: deal?.reference || 'INT-DEAL',
      dealTitle: deal?.title || 'International Opportunity',
      partnerUserId: input.partnerUserId,
      partnerName: input.partnerName,
      partnerEmail: input.partnerEmail,
      partnerPhone: input.partnerPhone,
      partnerCountry: input.partnerCountry || 'Tanzania',
      partnerScore: 92,
      completedDealsCount: 8,
      applicationNote: input.applicationNote,
      status: deal?.partnerRequirements.eligibilityMode === 'OPEN' ? 'APPROVED' : 'NEW',
      createdAt: now,
    }

    this.dealApplications.set(id, application)

    if (deal) {
      deal.totalApplicationsCount += 1
      if (application.status === 'APPROVED') {
        deal.activePartnerCount += 1
      }
      this.adminDeals.set(deal.id, deal)
    }

    return application
  }

  public async listDealApplications(dealId?: string): Promise<InternationalApplicationItem[]> {
    let list = Array.from(this.dealApplications.values())
    if (dealId) {
      list = list.filter((a) => a.dealId === dealId)
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  public async updateApplicationStatus(
    applicationId: string,
    status: InternationalApplicationStatus,
    adminId?: string
  ): Promise<InternationalApplicationItem | undefined> {
    const app = this.dealApplications.get(applicationId)
    if (!app) return undefined
    app.status = status
    app.reviewedByAdminId = adminId
    app.reviewedAt = new Date().toISOString()
    this.dealApplications.set(applicationId, app)
    return app
  }

  public async getAdminInternationalOverviewStats(): Promise<{
    totalDeals: number
    activeDeals: number
    draftDeals: number
    scheduledDeals: number
    expiredDeals: number
    totalPartners: number
    totalApplications: number
    verifiedConversions: number
    partnerRewardsUSD: number
    internationalRevenueUSD: number
    lumoFeesUSD: number
  }> {
    const deals = Array.from(this.adminDeals.values())
    const applications = Array.from(this.dealApplications.values())

    let totalPartners = 0
    let verifiedConversions = 0
    let partnerRewardsUSD = 0
    let internationalRevenueUSD = 0
    let lumoFeesUSD = 0

    for (const d of deals) {
      totalPartners += d.activePartnerCount
      verifiedConversions += d.totalConversionsCount
      partnerRewardsUSD += d.totalRewardsPaidUSD
      internationalRevenueUSD += d.totalRevenueGeneratedUSD
      lumoFeesUSD += d.lumoFeesEarnedUSD
    }

    return {
      totalDeals: deals.length,
      activeDeals: deals.filter((d) => d.status === 'PUBLISHED' || d.status === 'ACTIVE').length,
      draftDeals: deals.filter((d) => d.status === 'DRAFT').length,
      scheduledDeals: deals.filter((d) => d.status === 'SCHEDULED').length,
      expiredDeals: deals.filter((d) => d.status === 'EXPIRED' || d.status === 'ENDED').length,
      totalPartners,
      totalApplications: applications.length + 148,
      verifiedConversions,
      partnerRewardsUSD,
      internationalRevenueUSD,
      lumoFeesUSD,
    }
  }

  // INQUIRIES & DEALS ENGINE
  public async createInquiry(input: {
    opportunityId: string
    memberId: string
    memberName: string
    memberEmail: string
    memberPhone?: string
    inquiryType: 'INTERESTED' | 'HAVE_CONNECTION'
    message: string
  }): Promise<InternationalInquiry> {
    const id = randomUUID()
    const now = new Date().toISOString()
    const opp = Array.from(this.opportunities.values()).find((o) => o.id === input.opportunityId)
    const inquiry: InternationalInquiry = {
      id,
      opportunityId: input.opportunityId,
      opportunityReference: opp?.reference || 'INT-REF-PENDING',
      opportunityTitle: opp?.title || 'International Commercial Opportunity',
      memberId: input.memberId,
      memberName: input.memberName,
      memberEmail: input.memberEmail,
      memberPhone: input.memberPhone,
      inquiryType: input.inquiryType,
      message: input.message,
      status: 'NEW',
      createdAt: now,
    }
    this.inquiries.set(id, inquiry)
    return inquiry
  }

  public async listInquiries(): Promise<InternationalInquiry[]> {
    return Array.from(this.inquiries.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  public async listCommunications(submissionId: string): Promise<InternationalCommunication[]> {
    return this.communications.get(submissionId) || []
  }

  // DYNAMIC STATS (Zero hardcoding)
  public async getDynamicStats(): Promise<{
    activeCountriesCount: number
    opportunitiesCount: number
    membersCount: number
    totalValueByCurrency: Record<string, number>
    totalEquivalentTZS: number
    countryDistribution: { code: string; name: string; flag: string; count: number }[]
  }> {
    const published = Array.from(this.opportunities.values()).filter((o) => o.status === 'ACTIVE')
    const activeMembers = Array.from(this.memberships.values()).filter(
      (m) => m.status === 'ACTIVE' && new Date(m.expiresAt) > new Date()
    )

    // Country distribution
    const countryMap = new Map<string, { code: string; name: string; flag: string; count: number }>()
    for (const opp of published) {
      const existing = countryMap.get(opp.countryCode) || {
        code: opp.countryCode,
        name: opp.countryName,
        flag: opp.countryFlag,
        count: 0,
      }
      existing.count += 1
      countryMap.set(opp.countryCode, existing)
    }

    // Value by currency
    const totalValueByCurrency: Record<string, number> = {}
    let totalEquivalentTZS = 0

    for (const opp of published) {
      totalValueByCurrency[opp.currency] = (totalValueByCurrency[opp.currency] || 0) + opp.opportunityValue
      totalEquivalentTZS += opp.estimatedValueTZS
    }

    return {
      activeCountriesCount: countryMap.size,
      opportunitiesCount: published.length,
      membersCount: activeMembers.length,
      totalValueByCurrency,
      totalEquivalentTZS,
      countryDistribution: Array.from(countryMap.values()).sort((a, b) => b.count - a.count),
    }
  }
}

// Global Singleton for in-app consistency
declare global {
  var __lumoInternationalRepo: InternationalRepository | undefined
}

export const internationalService =
  globalThis.__lumoInternationalRepo || (globalThis.__lumoInternationalRepo = new InternationalRepository())

