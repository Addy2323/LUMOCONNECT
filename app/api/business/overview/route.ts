import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'
import { listOpportunities } from '@/modules/deals/service'
import { generateDateBuckets, mergeEventSeries, AnalyticsPeriod, RawEventItem } from '@/lib/dynamicDateRange'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
    const session = await getDatabaseSession(sessionToken)
    const userId = session?.userId || request.headers.get('x-user-id') || ''

    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period') || '7D'
    const period: AnalyticsPeriod = (['7D', '30D', '6M'].includes(periodParam)
      ? periodParam
      : '7D') as AnalyticsPeriod

    // 1. Get opportunities from authoritative deals store
    const allOpps = listOpportunities()
    const liveOpportunities = allOpps.filter((o) => o.status === 'PUBLISHED')
    const oppIds = new Set(allOpps.map((o) => o.id))

    let activePartnersCount = allOpps.reduce((acc, o) => acc + (o.activePartnerCount || 0), 0)
    let totalConversions = 0
    let totalSpentTZS = 0

    // 2. Query database for participations, referral tickets, and payments if available
    const rawEvents: RawEventItem[] = []

    if (process.env.DATABASE_URL?.trim()) {
      try {
        const [dealParts, referrals, recentPayments] = await Promise.all([
          db.dealParticipation.findMany({
            where: {
              status: 'ACTIVE',
            },
            select: {
              id: true,
              opportunityId: true,
              joinedAt: true,
            },
            take: 200,
          }),
          db.referralTicket.findMany({
            orderBy: { createdAt: 'desc' },
            take: 500,
            select: {
              id: true,
              opportunityId: true,
              stage: true,
              rewardAmountTZS: true,
              rewardStatus: true,
              createdAt: true,
            },
          }),
          db.paymentAttempt.findMany({
            where: { status: 'SUCCESSFUL' },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
              amountMinor: true,
              createdAt: true,
            },
          }),
        ])

        if (dealParts.length > 0) {
          activePartnersCount = Math.max(activePartnersCount, dealParts.length)
        }

        referrals.forEach((r) => {
          if (r.stage === 'COMPLETED' || r.rewardStatus === 'PARTNER_CONFIRMS_RECEIPT') {
            totalConversions += 1
          }
          if (r.createdAt) {
            rawEvents.push({
              timestamp: r.createdAt,
              type: 'LEAD',
              amountTZS: Number(r.rewardAmountTZS || 0),
            })
            if (r.stage === 'COMPLETED' || r.rewardStatus === 'PARTNER_CONFIRMS_RECEIPT') {
              rawEvents.push({
                timestamp: r.createdAt,
                type: 'CONVERSION',
                amountTZS: Number(r.rewardAmountTZS || 0),
              })
            }
          }
        })

        recentPayments.forEach((p) => {
          if (p.createdAt) {
            rawEvents.push({
              timestamp: p.createdAt,
              type: 'TRANSACTION',
              amountTZS: Number(p.amountMinor || 0) / 100,
            })
          }
        })
      } catch (e) {
        console.warn('Could not query database for business overview:', e)
      }
    }

    // 3. Dynamic Rolling Time-Series Engine
    const buckets = generateDateBuckets(period)
    const populatedSeries = mergeEventSeries(buckets, rawEvents, period).map((b) => ({
      ...b,
      day: b.label,
      pipelineRevenueTZS: b.pipelineRevenueTZS || 0,
    }))

    const totalPipelineRevenue = populatedSeries.reduce((acc, pt) => acc + pt.pipelineRevenueTZS, 0)

    return NextResponse.json({
      success: true,
      metrics: {
        liveOpportunitiesCount: liveOpportunities.length,
        totalOpportunitiesCount: allOpps.length,
        activePartnersCount,
        totalConversions,
        totalSpentTZS,
        pipelineRevenueTZS: totalPipelineRevenue,
      },
      series: populatedSeries,
    })
  } catch (error: any) {
    console.error('Business overview API error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
