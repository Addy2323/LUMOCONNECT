import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedBusiness } from '@/lib/business-guard'
import { generateDateBuckets, mergeEventSeries, AnalyticsPeriod, RawEventItem } from '@/lib/dynamicDateRange'

export async function GET(request: NextRequest) {
  try {
    let biz: any = null
    try {
      biz = await getAuthenticatedBusiness(request)
    } catch (authErr: any) {
      // If unauthenticated or no org, return a safe empty 0-state response
      const period = '7D'
      const buckets = generateDateBuckets(period)
      return NextResponse.json({
        success: true,
        metrics: {
          liveOpportunitiesCount: 0,
          pendingOpportunitiesCount: 0,
          totalOpportunitiesCount: 0,
          activePartnersCount: 0,
          totalConversions: 0,
          totalSpentTZS: 0,
          totalDealValueTZS: 0,
          activeDealValueTZS: 0,
          pendingDealValueTZS: 0,
          completedDealValueTZS: 0,
          pipelineRevenueTZS: 0,
        },
        series: buckets.map((b) => ({ ...b, day: b.label, pipelineRevenueTZS: 0 })),
      })
    }

    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period') || '7D'
    const period: AnalyticsPeriod = (['7D', '30D', '6M'].includes(periodParam)
      ? periodParam
      : '7D') as AnalyticsPeriod

    const businessId = biz.businessId

    // Query exclusively opportunities owned by this business
    let opportunities: any[] = []
    let participations: any[] = []
    let referrals: any[] = []
    let payments: any[] = []

    if (process.env.DATABASE_URL?.trim()) {
      try {
        opportunities = await db.opportunity.findMany({
          where: {
            organizationId: businessId,
            deletedAt: null,
          },
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        const oppIds = opportunities.map((o) => o.id)
        const oppTitles = opportunities.map((o) => o.title)
        const oppSlugs = opportunities.map((o) => o.slug).filter(Boolean) as string[]

        const [dbParts, dbReferrals] = await Promise.all([
          oppIds.length > 0
            ? db.dealParticipation.findMany({
                where: {
                  opportunityId: { in: oppIds },
                  status: 'ACTIVE',
                },
                select: {
                  id: true,
                  opportunityId: true,
                  partnerUserId: true,
                  joinedAt: true,
                },
              })
            : Promise.resolve([]),
          db.referralTicket?.findMany
            ? db.referralTicket.findMany({
                where: {
                  OR: [
                    ...(oppIds.length > 0 ? [{ opportunityId: { in: oppIds } }] : []),
                    { merchantOrgId: businessId },
                    ...(oppTitles.length > 0 ? [{ dealTitle: { in: oppTitles } }] : []),
                    ...(oppSlugs.length > 0 ? [{ dealSlug: { in: oppSlugs } }] : []),
                  ],
                },
                select: {
                  id: true,
                  opportunityId: true,
                  dealTitle: true,
                  dealSlug: true,
                  stage: true,
                  rewardAmountTZS: true,
                  rewardDisplay: true,
                  rewardStatus: true,
                  createdAt: true,
                },
              })
            : Promise.resolve([]),
        ])

        participations = dbParts
        referrals = dbReferrals

        payments = db.paymentAttempt?.findMany
          ? await db.paymentAttempt.findMany({
              where: {
                status: 'SUCCESSFUL',
                userId: biz.userId,
              },
              select: {
                createdAt: true,
                amountMinor: true,
              },
              take: 50,
            })
          : []
      } catch (e) {
        console.warn('Database query error in business overview:', e)
      }
    }

    const { extractNumericReward } = await import('@/modules/deals/referral-cases')

    // Compute isolated aggregates strictly for this business
    const liveOpportunities = opportunities.filter((o) => o.status === 'PUBLISHED')
    const pendingOpportunities = opportunities.filter(
      (o) => o.status === 'SUBMITTED' || o.status === 'UNDER_REVIEW'
    )
    const completedOpportunities = opportunities.filter((o) => o.status === 'CLOSED')
    const pausedOpportunities = opportunities.filter((o) => o.status === 'PAUSED')

    const activePartnersCount = new Set(participations.map((p) => p.partnerUserId)).size
    const isConversionStage = (r: any) =>
      ['COMPLETED', 'REWARD_PAID', 'REWARD_APPROVED', 'SUCCESSFUL'].includes(r.stage) ||
      ['PARTNER_CONFIRMS_RECEIPT', 'PAID', 'APPROVED'].includes(r.rewardStatus)

    const totalConversions = referrals.filter(isConversionStage).length

    // Deal Values
    const getOppValue = (o: any) => Number(o.totalBudgetMinor || 0) / 100
    const totalDealValueTZS = opportunities.reduce((sum, o) => sum + getOppValue(o), 0)
    const activeDealValueTZS = liveOpportunities.reduce((sum, o) => sum + getOppValue(o), 0)
    const pendingDealValueTZS = pendingOpportunities.reduce((sum, o) => sum + getOppValue(o), 0)
    const completedDealValueTZS = completedOpportunities.reduce((sum, o) => sum + getOppValue(o), 0)

    const ticketPaidAmount = referrals
      .filter((r) => r.stage === 'REWARD_PAID' || r.rewardStatus === 'PAID')
      .reduce((sum, r) => sum + extractNumericReward(r.rewardAmountTZS, r.rewardDisplay), 0)

    const oppSpent = opportunities.reduce(
      (sum, o) => sum + Number(o.spentBudgetMinor || 0) / 100,
      0
    )
    const totalSpentTZS = Math.max(oppSpent, ticketPaidAmount)

    // Dynamic Rolling Series
    const buckets = generateDateBuckets(period)
    const rawEvents: RawEventItem[] = []

    referrals.forEach((r) => {
      const ts = r.createdAt
      if (ts) {
        const rewardVal = extractNumericReward(r.rewardAmountTZS, r.rewardDisplay)
        rawEvents.push({
          timestamp: ts,
          type: 'LEAD',
          amountTZS: rewardVal,
        })
        if (isConversionStage(r)) {
          rawEvents.push({
            timestamp: ts,
            type: 'CONVERSION',
            amountTZS: rewardVal,
          })
        }
      }
    })

    payments.forEach((p) => {
      if (p.createdAt) {
        rawEvents.push({
          timestamp: p.createdAt,
          type: 'TRANSACTION',
          amountTZS: Number(p.amountMinor || 0) / 100,
        })
      }
    })

    const populatedSeries = mergeEventSeries(buckets, rawEvents, period).map((b) => ({
      ...b,
      day: b.label,
      pipelineRevenueTZS: b.pipelineRevenueTZS || 0,
    }))

    const totalPipelineRevenue = populatedSeries.reduce((acc, pt) => acc + pt.pipelineRevenueTZS, 0)

    return NextResponse.json({
      success: true,
      business: {
        id: biz.businessId,
        name: biz.organizationName,
        verificationStatus: biz.verificationStatus,
        registrationNumber: biz.registrationNumber,
      },
      metrics: {
        liveOpportunitiesCount: liveOpportunities.length,
        pendingOpportunitiesCount: pendingOpportunities.length,
        totalOpportunitiesCount: opportunities.length,
        activePartnersCount,
        totalConversions,
        totalSpentTZS,
        totalDealValueTZS,
        activeDealValueTZS,
        pendingDealValueTZS,
        completedDealValueTZS,
        pipelineRevenueTZS: totalPipelineRevenue,
      },
      series: populatedSeries,
    })
  } catch (error: any) {
    console.error('Business overview API error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
