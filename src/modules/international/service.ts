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
} from './types'
import {
  getCountryByCode,
  convertToEstimatedTZS,
  SUPPORTED_CURRENCIES,
} from './countries'

// Dynamic In-Memory Store with zero fake/demo records
class InternationalRepository {
  private submissions: Map<string, InternationalSubmission> = new Map()
  private opportunities: Map<string, InternationalOpportunity> = new Map()
  private communications: Map<string, InternationalCommunication[]> = new Map()
  private memberships: Map<string, InternationalMembership> = new Map()
  private inquiries: Map<string, InternationalInquiry> = new Map()

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

  // INQUIRIES
  public async createInquiry(input: {
    opportunityId: string
    memberId: string
    memberName: string
    memberEmail: string
    memberPhone?: string
    inquiryType: 'INTERESTED' | 'HAVE_CONNECTION'
    message: string
  }): Promise<InternationalInquiry> {
    const opp = this.opportunities.get(input.opportunityId)
    const id = randomUUID()
    const now = new Date().toISOString()

    const inquiry: InternationalInquiry = {
      id,
      opportunityId: input.opportunityId,
      opportunityReference: opp?.reference || 'INT-OPP',
      opportunityTitle: opp?.title || 'International Opportunity',
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

    if (opp) {
      opp.inquiryCount = (opp.inquiryCount || 0) + 1
      this.opportunities.set(opp.id, opp)

      if (opp.submissionId) {
        await this.logCommunication({
          submissionId: opp.submissionId,
          channel: 'INTERNAL_NOTE',
          direction: 'INBOUND',
          subject: `Member Inquiry (${input.inquiryType === 'INTERESTED' ? 'Direct Interest' : 'Connection Lead'})`,
          messageBody: `Member ${input.memberName} submitted an inquiry: "${input.message}"`,
          actorName: input.memberName,
        })
      }
    }

    return inquiry
  }

  public async listInquiries(): Promise<InternationalInquiry[]> {
    return Array.from(this.inquiries.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
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
