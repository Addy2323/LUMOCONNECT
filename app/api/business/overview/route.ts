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

        if (oppIds.length > 0) {
          const [dbParts, dbReferrals] = await Promise.all([
            db.dealParticipation.findMany({
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
            }),
            db.referralTicket.findMany({
              where: {
                opportunityId: { in: oppIds },
              },
              select: {
                id: true,
                opportunityId: true,
                stage: true,
                rewardAmountTZS: true,
                rewardStatus: true,
                createdAt: true,
              },
            }),
          ])

          participations = dbParts
          referrals = dbReferrals
        }

        payments = await db.paymentAttempt.findMany({
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
      } catch (e) {
        console.warn('Database query error in business overview:', e)
      }
    }

    // Compute isolated aggregates strictly for this business
    const liveOpportunities = opportunities.filter((o) => o.status === 'PUBLISHED')
    const pendingOpportunities = opportunities.filter(
      (o) => o.status === 'SUBMITTED' || o.status === 'UNDER_REVIEW'
    )
    const completedOpportunities = opportunities.filter((o) => o.status === 'CLOSED')
    const pausedOpportunities = opportunities.filter((o) => o.status === 'PAUSED')

    const activePartnersCount = new Set(participations.map((p) => p.partnerUserId)).size
    const totalConversions = referrals.filter(
      (r) => r.stage === 'COMPLETED' || r.rewardStatus === 'PARTNER_CONFIRMS_RECEIPT'
    ).length

    // Deal Values
    const getOppValue = (o: any) => Number(o.totalBudgetMinor || 0) / 100
    const totalDealValueTZS = opportunities.reduce((sum, o) => sum + getOppValue(o), 0)
    const activeDealValueTZS = liveOpportunities.reduce((sum, o) => sum + getOppValue(o), 0)
    const pendingDealValueTZS = pendingOpportunities.reduce((sum, o) => sum + getOppValue(o), 0)
    const completedDealValueTZS = completedOpportunities.reduce((sum, o) => sum + getOppValue(o), 0)
    const totalSpentTZS = opportunities.reduce(
      (sum, o) => sum + Number(o.spentBudgetMinor || 0) / 100,
      0
    )

    // Dynamic Rolling Series
    const buckets = generateDateBuckets(period)
    const rawEvents: RawEventItem[] = []

    referrals.forEach((r) => {
      const ts = r.createdAt
      if (ts) {
        rawEvents.push({
          timestamp: ts,
          type: 'LEAD',
          amountTZS: Number(r.rewardAmountTZS || 0),
        })
        if (r.stage === 'COMPLETED' || r.rewardStatus === 'PARTNER_CONFIRMS_RECEIPT') {
          rawEvents.push({
            timestamp: ts,
            type: 'CONVERSION',
            amountTZS: Number(r.rewardAmountTZS || 0),
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
