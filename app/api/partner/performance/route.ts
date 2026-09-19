import { NextResponse, type NextRequest } from 'next/server'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'
import { listPartnerReferralTickets } from '@/modules/deals/referral-cases'
import { listPartnerPayouts } from '@/modules/payouts/payout-store'
import { generateDateBuckets, mergeEventSeries, AnalyticsPeriod, RawEventItem } from '@/lib/dynamicDateRange'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value || request.cookies.get('lumo_session')?.value
    const session = await getDatabaseSession(sessionToken)

    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const userId = session.userId
    const phone = (session.user as any).phone || ''

    const searchParams = request.nextUrl.searchParams
    const period = (searchParams.get('period') as AnalyticsPeriod) || '7D'
    const metric = searchParams.get('metric') || 'earnings'
    const isCsvExport = searchParams.get('export') === 'csv'

    // Query Partner Referral Tickets & Payouts
    const tickets = await listPartnerReferralTickets(userId, phone)

    const qualifiedStages = new Set(['QUALIFIED', 'APPROVED', 'COMPLETED', 'CUSTOMER_ENGAGED'])
    const conversionStages = new Set(['COMPLETED'])

    const buckets = generateDateBuckets(period)
    const rawEvents: RawEventItem[] = []

    tickets.forEach((t) => {
      const ts = (t as any).submittedAt || t.createdAt
      if (ts) {
        rawEvents.push({
          timestamp: ts,
          type: 'LEAD',
          amountTZS: Number(t.rewardAmountTZS || 0),
        })
        if (conversionStages.has(t.stage) || t.rewardStatus === 'PARTNER_CONFIRMS_RECEIPT') {
          rawEvents.push({
            timestamp: ts,
            type: 'CONVERSION',
            amountTZS: Number(t.rewardAmountTZS || 0),
          })
          rawEvents.push({
            timestamp: ts,
            type: 'REWARD',
            amountTZS: Number(t.rewardAmountTZS || 0),
          })
        }
      }
    })

    const populatedSeries = mergeEventSeries(buckets, rawEvents, period)

    // Calculate period-specific totals strictly from the generated series buckets
    const periodTotals = populatedSeries.reduce(
      (acc, pt) => ({
        clicks: acc.clicks + pt.clicks,
        leads: acc.leads + pt.leads,
        conversions: acc.conversions + pt.conversions,
        earnings: acc.earnings + pt.earnings,
      }),
      { clicks: 0, leads: 0, conversions: 0, earnings: 0 }
    )

    const totalLifetimeLeads = tickets.filter((t) => qualifiedStages.has(t.stage)).length
    const totalLifetimeConversions = tickets.filter((t) => conversionStages.has(t.stage)).length
    const totalLifetimeRewards = tickets.reduce((sum, t) => sum + Number(t.rewardAmountTZS || 0), 0)

    const conversionRate =
      periodTotals.clicks > 0
        ? Math.round((periodTotals.conversions / periodTotals.clicks) * 100)
        : periodTotals.leads > 0
        ? Math.round((periodTotals.conversions / periodTotals.leads) * 100)
        : 0

    if (isCsvExport) {
      const startDate = buckets[0]?.date || 'start'
      const endDate = buckets[buckets.length - 1]?.date || 'end'
      const fileName = `lumo-partner-performance-${period.toLowerCase()}-${startDate}-to-${endDate}.csv`

      const csvRows = [
        ['LUMO DEALERS - COMMERCIAL PERFORMANCE & OUTCOME ANALYTICS'],
        [`Partner Name: ${session.user.name || 'Partner'}`],
        [`Partner ID: ${userId}`],
        [`Generated On: ${new Date().toISOString()}`],
        [`Timeframe: ${period}`],
        [''],
        ['DATE', 'LABEL', 'VERIFIED CLICKS', 'QUALIFIED LEADS', 'CONVERSIONS', 'EARNINGS (TZS)'],
        ...populatedSeries.map((d) => [d.date, d.label, d.clicks, d.leads, d.conversions, d.earnings]),
        [''],
        ['PERIOD TOTALS'],
        ['Total Clicks', periodTotals.clicks],
        ['Total Qualified Leads', periodTotals.leads],
        ['Total Conversions', periodTotals.conversions],
        ['Total Period Earnings (TZS)', periodTotals.earnings],
        ['Conversion Rate (%)', `${conversionRate}%`],
      ]

      const csvString = csvRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')

      return new NextResponse(csvString, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      period,
      metric,
      periodTotals,
      summary: {
        totalLifetimeLeads,
        totalLifetimeConversions,
        totalLifetimeRewards,
        conversionRate,
      },
      series: populatedSeries,
    })
  } catch (error: any) {
    console.error('Partner performance API error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
