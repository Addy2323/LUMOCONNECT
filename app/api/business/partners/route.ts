import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedBusiness } from '@/lib/business-guard'

export async function GET(request: NextRequest) {
  try {
    const biz = await getAuthenticatedBusiness(request)

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json({ success: true, partners: [], data: [], total: 0 })
    }

    // Find opportunities owned by this business
    const opportunities = await db.opportunity.findMany({
      where: {
        organizationId: biz.businessId,
        deletedAt: null,
      },
      select: { id: true, title: true },
    })

    const oppMap = new Map(opportunities.map((o) => [o.id, o.title]))
    const oppIds = Array.from(oppMap.keys())

    if (oppIds.length === 0) {
      return NextResponse.json({ success: true, partners: [], data: [], total: 0 })
    }

    // Query participations for this business's opportunities only
    const participations = await db.dealParticipation.findMany({
      where: {
        opportunityId: { in: oppIds },
      },
      include: {
        partnerUser: {
          include: {
            partnerProfile: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    // Query referrals/conversions for these participations
    const referrals = await db.referralTicket.findMany({
      where: {
        opportunityId: { in: oppIds },
      },
      select: {
        id: true,
        opportunityId: true,
        partnerUserId: true,
        stage: true,
        rewardAmountTZS: true,
      },
    })

    const mapped = participations.map((p, idx) => {
      const pUserId = p.partnerUserId
      const pUser = p.partnerUser
      const pProfile = pUser?.partnerProfile
      const pReferrals = referrals.filter((r) => r.partnerUserId === pUserId && r.opportunityId === p.opportunityId)
      const pConversions = pReferrals.filter((r) => r.stage === 'COMPLETED').length
      const pEarnedTZS = pReferrals.reduce((sum, r) => sum + Number(r.rewardAmountTZS || 0), 0)

      return {
        id: `p_${idx}_${p.id}`,
        partnerName: pUser?.name || `Partner ${pUserId.slice(0, 6)}`,
        partnerType: pProfile?.partnerType || 'SALES_AGENT',
        avatar: pUser?.image || '',
        phoneMasked: pUser?.phone ? `${pUser.phone.slice(0, 7)}***` : 'Not provided',
        channels: pProfile?.categories || [],
        region: pProfile?.region || 'Not provided',
        performanceScore: Number(pProfile?.partnerScore ?? 0),
        completedDeals: pConversions,
        conversionQuality: 'Not available',
        cancellationRate: 'Not available',
        businessRating: null,
        appliedOpportunityId: p.opportunityId,
        appliedOpportunityTitle: oppMap.get(p.opportunityId) || 'Commercial Campaign',
        applicationDate: p.joinedAt ? p.joinedAt.toISOString().split('T')[0] : 'Today',
        applicationPitch: '',
        status: p.status === 'ACTIVE' ? 'ACTIVE' : 'COMPLETED',
        joinedProgramDate: p.joinedAt ? p.joinedAt.toISOString().split('T')[0] : 'Today',
        totalEarnedTZS: pEarnedTZS,
        verifiedConversionsCount: pConversions,
      }
    })

    return NextResponse.json({
      success: true,
      partners: mapped,
      data: mapped,
      total: mapped.length,
    })
  } catch (error: any) {
    console.error('List business partners error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: error.statusCode || 500 }
    )
  }
}
