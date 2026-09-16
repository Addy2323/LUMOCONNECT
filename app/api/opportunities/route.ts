import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || undefined
    const category = searchParams.get('category') || undefined
    const type = searchParams.get('type') || undefined
    const region = searchParams.get('region') || undefined
    const sortBy = (searchParams.get('sortBy') as 'recommended' | 'highest_reward' | 'newest' | 'ending_soon') || 'recommended'

    const where: any = {
      status: { in: ['PUBLISHED', 'APPROVED'] },
      deletedAt: null,
    }

    if (category && category !== 'ALL' && category !== 'All Categories') {
      where.OR = [
        { category: { name: { contains: category, mode: 'insensitive' } } },
        { subcategory: { contains: category, mode: 'insensitive' } },
      ]
    }

    if (type && type !== 'ALL') {
      where.opportunityType = type
    }

    if (region && region !== 'All Regions (National - Tanzania)' && region !== 'All Tanzania') {
      where.region = { contains: region, mode: 'insensitive' }
    }

    if (query && query.trim()) {
      const q = query.trim()
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { summary: { contains: q, mode: 'insensitive' } },
            { organization: { tradingName: { contains: q, mode: 'insensitive' } } },
            { organization: { legalName: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ]
    }

    let orderBy: any = [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
    if (sortBy === 'newest') {
      orderBy = [{ createdAt: 'desc' }]
    } else if (sortBy === 'highest_reward') {
      orderBy = [{ fixedRewardAmountMinor: 'desc' }, { rewardPercentage: 'desc' }]
    }

    const opportunities = await db.opportunity.findMany({
      where,
      orderBy,
      include: {
        organization: {
          select: {
            id: true,
            legalName: true,
            tradingName: true,
            slug: true,
            logoUrl: true,
            verificationStatus: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        publishedVersion: {
          include: { rewardRules: true },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: { rewardRules: true },
        },
        _count: {
          select: {
            participations: { where: { status: 'ACTIVE' } },
            conversions: true,
          },
        },
      },
    })

    const formatted = opportunities.map((opp) => {
      const activeVersion = opp.publishedVersion ?? opp.versions[0] ?? null
      const fixedRewardTZS = opp.fixedRewardAmountMinor ? Number(opp.fixedRewardAmountMinor) / 100 : 0
      const rewardDisplay =
        opp.rewardDisplayLabel ||
        activeVersion?.rewardSummary ||
        (fixedRewardTZS > 0
          ? `TZS ${fixedRewardTZS.toLocaleString()} per verified outcome`
          : opp.rewardPercentage
          ? `${opp.rewardPercentage}% commission`
          : 'Standard Performance Terms')

      return {
        id: opp.id,
        organizationId: opp.organizationId,
        companyName: opp.organization?.tradingName || opp.organization?.legalName || 'Verified Merchant',
        companyLogo: opp.organization?.logoUrl || undefined,
        isVerified: opp.organization?.verificationStatus === 'VERIFIED',
        type: opp.opportunityType as any,
        title: opp.title,
        slug: opp.slug,
        summary: opp.summary || opp.description?.slice(0, 160) || opp.title,
        description: opp.description,
        category: opp.category?.name || 'General',
        subcategory: opp.subcategory || undefined,
        countryCode: 'TZ',
        region: opp.region || 'All Tanzania',
        currency: opp.currency || 'TZS',
        rewardType: (opp.rewardType as any) || 'FIXED_COMMISSION',
        rewardDisplay,
        rewardDetail: opp.rewardTrigger || 'per verified outcome',
        totalBudgetTZS: opp.totalBudgetMinor ? Number(opp.totalBudgetMinor) / 100 : 0,
        spentBudgetTZS: opp.spentBudgetMinor ? Number(opp.spentBudgetMinor) / 100 : 0,
        activePartnerCount: opp._count.participations,
        isFeatured: opp.isFeatured,
        featuredImageUrl: opp.coverImageUrl || undefined,
        promoVideoUrl: opp.promoVideoUrl || undefined,
        galleryImageUrls: opp.galleryImageUrls || [],
        termsAndConditions: activeVersion?.termsAndConditions || undefined,
        status: 'PUBLISHED' as const,
        createdAt: opp.createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      total: formatted.length,
      data: formatted,
      opportunities: formatted,
    })
  } catch (error: unknown) {
    console.error('GET /api/opportunities error:', error)
    const message = error instanceof Error ? error.message : 'Failed to retrieve opportunities'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
