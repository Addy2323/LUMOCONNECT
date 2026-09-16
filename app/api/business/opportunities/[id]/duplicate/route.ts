import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedBusiness, assertOpportunityOwnership } from '@/lib/business-guard'
import { createHash } from 'crypto'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const biz = await getAuthenticatedBusiness(request)

    const opp = await assertOpportunityOwnership(id, biz.businessId)
    if (!opp) {
      return NextResponse.json({ success: false, error: 'Opportunity not found' }, { status: 404 })
    }

    const newTitle = `${opp.title} (Copy)`
    const newSlug = `${opp.slug}-copy-${Date.now().toString().slice(-4)}`

    const termsHash = createHash('sha256')
      .update(`${newTitle}|copy|${Date.now()}`)
      .digest('hex')

    // Clone into fresh DRAFT with reset metrics (0 partners, 0 conversions, 0 spend)
    const duplicated = await db.opportunity.create({
      data: {
        organizationId: biz.businessId,
        title: newTitle,
        slug: newSlug,
        opportunityType: opp.opportunityType,
        summary: opp.summary,
        description: opp.description,
        region: opp.region,
        coverImageUrl: opp.coverImageUrl,
        promoVideoUrl: opp.promoVideoUrl,
        galleryImageUrls: opp.galleryImageUrls,
        totalBudgetMinor: opp.totalBudgetMinor,
        commercialValueMinor: opp.commercialValueMinor,
        spentBudgetMinor: BigInt(0),
        currency: opp.currency,
        status: 'DRAFT',
        versions: {
          create: {
            versionNumber: 1,
            title: newTitle,
            description: opp.description,
            termsHash,
            rewardSummary: opp.versions?.[0]?.rewardSummary || 'Standard commercial terms',
            attributionWindowDays: opp.versions?.[0]?.attributionWindowDays || 30,
            termsAndConditions: opp.versions?.[0]?.termsAndConditions || 'Standard performance terms apply.',
            isExclusive: false,
            requiresApproval: true,
          },
        },
      },
      include: {
        versions: true,
      },
    })

    const oppData = {
      id: duplicated.id,
      slug: duplicated.slug,
      title: duplicated.title,
      publicSummary: duplicated.summary,
      subscriberDescription: duplicated.description,
      type: duplicated.opportunityType,
      category: duplicated.categoryId || 'Commercial Opportunity',
      region: duplicated.region || 'All Tanzania',
      commercialResult: 'COMPLETED_SALE',
      rewardStructure: 'FIXED_REWARD',
      rewardValueTZS: 50000,
      budgetTZS: Number(duplicated.totalBudgetMinor || 0) / 100,
      spentTZS: 0,
      status: duplicated.status,
      version: 1,
      activePartners: 0,
      totalConversions: 0,
      trackingMethod: 'PROMO_CODE',
      startDate: 'Open Access',
      endDate: 'Open Access',
      attributionWindowDays: 30,
      partnerDeliverables: duplicated.description,
      evidenceRequired: 'Verified customer delivery receipt.',
      cancellationTerms: '7 days notice.',
      coverImageUrl: duplicated.coverImageUrl || undefined,
      promoVideoUrl: duplicated.promoVideoUrl || undefined,
      galleryImageUrls: duplicated.galleryImageUrls || [],
      createdAt: 'Today',
    }

    return NextResponse.json({
      success: true,
      data: oppData,
      opportunity: oppData,
    })
  } catch (error: any) {
    console.error('Duplicate opportunity error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: error.statusCode || 500 }
    )
  }
}
