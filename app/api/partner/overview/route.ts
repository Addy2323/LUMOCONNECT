import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'
import { listPartnerReferralTickets } from '@/modules/deals/referral-cases'
import { listPartnerPayouts } from '@/modules/payouts/payout-store'
import { generateDateBuckets, mergeEventSeries, AnalyticsPeriod, RawEventItem } from '@/lib/dynamicDateRange'
import { calculatePartnerProfileCompletion } from '@/components/dashboards/partner/profileCompletion'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value || request.cookies.get('lumo_session')?.value
    const session = await getDatabaseSession(sessionToken)

    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const userId = session.userId
    const user = session.user
    const phone = (user as any).phone || ''

    const searchParams = request.nextUrl.searchParams
    const period = (searchParams.get('period') as AnalyticsPeriod) || '7D'

    // 1. Query Active Deals
    let activeDealsCount = 0
    if (process.env.DATABASE_URL?.trim()) {
      try {
        activeDealsCount = await db.dealParticipation.count({
          where: {
            partnerUserId: userId,
            status: 'ACTIVE',
          },
        })
      } catch (e) {
        console.warn('Could not count deal participations from db:', e)
      }
    }

    // 2. Query Partner Referral Tickets
    const tickets = await listPartnerReferralTickets(userId, phone)

    const qualifiedStages = new Set(['QUALIFIED', 'APPROVED', 'COMPLETED', 'CUSTOMER_ENGAGED'])
    const conversionStages = new Set(['COMPLETED'])

    const qualifiedLeads = tickets.filter((t) => qualifiedStages.has(t.stage) || (t.rewardAmountTZS && t.rewardAmountTZS > 0))
    const verifiedConversions = tickets.filter((t) => conversionStages.has(t.stage) || t.rewardStatus === 'PARTNER_CONFIRMS_RECEIPT')

    const totalApprovedRewardsTZS = tickets.reduce((sum, t) => {
      if (t.rewardAmountTZS && qualifiedStages.has(t.stage)) {
        return sum + Number(t.rewardAmountTZS)
      }
      return sum
    }, 0)

    // 3. Query Partner Payouts
    const payouts = await listPartnerPayouts(userId, phone)

    const completedPayoutsTotal = payouts
      .filter((p: any) => p.status === 'PAID')
      .reduce((sum: number, p: any) => sum + Number(p.grossAmountTZS || 0), 0)

    const pendingPayouts = payouts.filter(
      (p: any) => ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'SCHEDULED', 'PROCESSING'].includes(p.status)
    )

    const pendingPayoutsTotal = pendingPayouts.reduce(
      (sum: number, p: any) => sum + Number(p.grossAmountTZS || 0),
      0
    )

    // Available = approved rewards minus already paid payouts minus currently pending payouts
    const availableEarningsTZS = Math.max(0, totalApprovedRewardsTZS - completedPayoutsTotal - pendingPayoutsTotal)

    // 4. Next Payout Batch info
    const scheduledPayout = pendingPayouts[0] || null
    let nextPayoutBatch = null

    if (scheduledPayout) {
      nextPayoutBatch = {
        amountTZS: scheduledPayout.netAmountTZS || scheduledPayout.grossAmountTZS,
        grossAmountTZS: scheduledPayout.grossAmountTZS,
        scheduledDate: (scheduledPayout as any).scheduledDate || scheduledPayout.createdAt,
        method: (scheduledPayout.payoutChannel || 'MOBILE_MONEY').replace(/_/g, ' '),
        accountNumber: scheduledPayout.accountNumber,
        status: scheduledPayout.status,
        reference: scheduledPayout.reference,
      }
    }

    // Settlement Method
    let settlementMethod = 'Not Configured'
    if (scheduledPayout?.accountNumber) {
      settlementMethod = `${(scheduledPayout.payoutChannel || 'Vodacom M-Pesa').replace(/_/g, ' ')} (${scheduledPayout.accountNumber})`
    } else if (phone) {
      settlementMethod = `Vodacom M-Pesa (${phone})`
    }

    // Profile Completion
    const profileCompletion = calculatePartnerProfileCompletion({
      fullName: user.name || '',
      phoneMasked: phone,
      email: user.email || '',
      partnerType: 'AFFILIATE',
      nidaNumberMasked: '',
      tinNumberMasked: '',
      isIdentityVerified: false,
      region: 'Dar es Salaam',
      channels: [],
      audienceSize: '0',
    })

    // 5. Dynamic Time-Series Buckets
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

    return NextResponse.json({
      success: true,
      metrics: {
        activeDeals: activeDealsCount,
        qualifiedLeads: qualifiedLeads.length,
        verifiedConversions: verifiedConversions.length,
        availableEarningsTZS,
        approvedRewardsTZS: totalApprovedRewardsTZS,
        profileCompletion,
      },
      payoutSummary: {
        nextPayout: nextPayoutBatch,
        availableEarningsTZS,
        agreedMerchantRewardTZS: totalApprovedRewardsTZS,
        settlementMethod,
        platformFeeDisplay: '3% (Standard)',
        platformFeePercent: 3,
      },
      series: populatedSeries,
    })
  } catch (error: any) {
    console.error('Partner overview API error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
