import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedBusiness } from '@/lib/business-guard'
import { createHash } from 'crypto'
import { commercialValueSchema } from '@/lib/marketplace-stats'
import { parseBusinessOpportunityInput } from '@/modules/deals/business-opportunity-input'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const biz = await getAuthenticatedBusiness(request)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ALL'
    const search = searchParams.get('search')?.toLowerCase() || ''
    const category = searchParams.get('category') || 'ALL'

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json({
        success: true,
        opportunities: [],
        data: [],
        total: 0,
      })
    }

    const opportunities = await db.opportunity.findMany({
      where: {
        organizationId: biz.businessId,
        deletedAt: null,
        ...(status !== 'ALL' ? { status: status as any } : {}),
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        participations: {
          where: { status: 'ACTIVE' },
          select: { id: true, partnerUserId: true },
        },
        referralTickets: {
          where: {
            OR: [
              { stage: 'COMPLETED' },
              { rewardStatus: 'PARTNER_CONFIRMS_RECEIPT' },
            ],
          },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = opportunities
      .filter((opp) => {
        if (!search) return true
        return (
          opp.title.toLowerCase().includes(search) ||
          opp.summary.toLowerCase().includes(search) ||
          (opp.description && opp.description.toLowerCase().includes(search))
        )
      })
      .map((opp) => {
        const latestVersion = opp.versions[0] || null
        const activePartnersCount = new Set(opp.participations.map((p) => p.partnerUserId)).size
        const totalConversions = opp.referralTickets.length
        const budgetTZS = Number(opp.totalBudgetMinor || 0) / 100
        const spentTZS = Number(opp.spentBudgetMinor || 0) / 100

        // Parse reward rate from latest version or default
        let rewardValueTZS = 0
        if (latestVersion?.rewardSummary) {
          const match = latestVersion.rewardSummary.match(/[\d,]+/)
          if (match) {
            rewardValueTZS = parseInt(match[0].replace(/,/g, ''), 10) || 0
          }
        }

        return {
          id: opp.id,
          slug: opp.slug,
          title: opp.title,
          publicSummary: opp.summary,
          subscriberDescription: opp.description,
          type: opp.opportunityType,
          category: opp.categoryId || 'Commercial Opportunity',
          region: opp.region || 'All Tanzania',
          commercialResult: 'COMPLETED_SALE',
          rewardStructure: 'FIXED_REWARD',
          rewardValueTZS,
          budgetTZS,
          commercialValueTZS: opp.commercialValueMinor === null ? null : Number(opp.commercialValueMinor) / 100,
          spentTZS,
          status: opp.status,
          version: latestVersion ? latestVersion.versionNumber : 1,
          activePartners: activePartnersCount,
          totalConversions,
          trackingMethod: 'PROMO_CODE',
          startDate: opp.startDate ? opp.startDate.toISOString().split('T')[0] : 'Open Access',
          endDate: opp.endDate ? opp.endDate.toISOString().split('T')[0] : 'Open Access',
          attributionWindowDays: latestVersion?.attributionWindowDays || 30,
          partnerDeliverables: opp.description,
          evidenceRequired: latestVersion?.termsAndConditions || '',
          cancellationTerms: '7 days written notice with protection for all verified conversions.',
          coverImageUrl: opp.coverImageUrl || undefined,
          promoVideoUrl: opp.promoVideoUrl || undefined,
          galleryImageUrls: opp.galleryImageUrls || [],
          createdAt: opp.createdAt.toISOString().split('T')[0],
        }
      })

    return NextResponse.json({
      success: true,
      opportunities: mapped,
      data: mapped,
      total: mapped.length,
    })
  } catch (error: any) {
    console.error('List business opportunities error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: error.statusCode || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const biz = await getAuthenticatedBusiness(request)
    const rawBody = await request.json().catch(() => ({}))
    const body = { ...rawBody, ...parseBusinessOpportunityInput(rawBody) }

    const {
      title,
      type = 'CUSTOMER_ACQUISITION',
      category = 'Commercial Opportunity',
      region = '',
      publicSummary,
      subscriberDescription,
      rewardStructure = 'FIXED_REWARD',
      rewardValueTZS = 0,
      rewardPercent,
      estimatedBudgetTZS = 0,
      trackingMethod = 'PROMO_CODE',
      attributionWindowDays = 30,
      partnerDeliverables,
      evidenceRequired,
      cancellationTerms,
      coverImageUrl,
      promoVideoUrl,
      galleryImageUrls = [],
      status = 'UNDER_REVIEW',
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Opportunity title is required.' },
        { status: 400 }
      )
    }

    const slug = `${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-6)}`
    const commercialValue = commercialValueSchema.safeParse(body.commercialValueTZS)
    if (!commercialValue.success) return NextResponse.json({ error: 'Invalid commercial deal value' }, { status: 400 })
    const totalBudgetMinor = BigInt(Math.round(Number(estimatedBudgetTZS || 0) * 100))
    const termsHash = createHash('sha256')
      .update(`${title}|${rewardValueTZS}|${attributionWindowDays}|${Date.now()}`)
      .digest('hex')

    // Create Opportunity and initial Version 1 in Database
    const created = await db.opportunity.create({
      data: {
        organizationId: biz.businessId,
        title: title.trim(),
        slug,
        opportunityType: type as any,
        summary: publicSummary || title.trim(),
        description: subscriberDescription || publicSummary || title.trim(),
        region,
        coverImageUrl: coverImageUrl || null,
        promoVideoUrl: promoVideoUrl || null,
        galleryImageUrls: Array.isArray(galleryImageUrls) ? galleryImageUrls : [],
        totalBudgetMinor,
        commercialValueMinor: commercialValue.data,
        spentBudgetMinor: BigInt(0),
        currency: 'TZS',
        status: (status === 'SUBMITTED' ? 'UNDER_REVIEW' : status) as any,
        versions: {
          create: {
            versionNumber: 1,
            title: title.trim(),
            description: subscriberDescription || publicSummary || title.trim(),
            termsHash,
            rewardSummary: `TZS ${Number(rewardValueTZS).toLocaleString()} per verified result`,
            attributionWindowDays: Number(attributionWindowDays) || 30,
            termsAndConditions: cancellationTerms || evidenceRequired || 'Standard commercial performance terms apply.',
            isExclusive: false,
            requiresApproval: true,
          },
        },
      },
      include: {
        versions: true,
      },
    })

    // Create an Operational Notification for Admin Review Queue
    try {
      await db.notification.create({
        data: {
          userId: biz.userId, // in-app confirmation for creator
          channel: 'IN_APP',
          title: 'Opportunity Submitted',
          body: `"${title}" has been submitted for review by LUMO compliance.`,
          linkUrl: '/dashboard/business?tab=my_opportunities',
        },
      })
    } catch (notifErr) {
      console.warn('Could not create submission notification:', notifErr)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Opportunity successfully created and submitted for review.',
        opportunity: {
          id: created.id,
          slug: created.slug,
          title: created.title,
          publicSummary: created.summary,
          subscriberDescription: created.description,
          type: created.opportunityType,
          category,
          region: created.region || region,
          commercialResult: 'COMPLETED_SALE',
          rewardStructure,
          rewardValueTZS: Number(rewardValueTZS),
          budgetTZS: Number(estimatedBudgetTZS),
          spentTZS: 0,
          status: created.status,
          version: 1,
          activePartners: 0,
          totalConversions: 0,
          trackingMethod,
          startDate: new Date().toISOString().split('T')[0],
          endDate: 'Open Access',
          attributionWindowDays: Number(attributionWindowDays) || 30,
          partnerDeliverables: partnerDeliverables || created.description,
          evidenceRequired: evidenceRequired || '',
          cancellationTerms: cancellationTerms || '7 days notice.',
          coverImageUrl: created.coverImageUrl || undefined,
          promoVideoUrl: created.promoVideoUrl || undefined,
          galleryImageUrls: created.galleryImageUrls || [],
          createdAt: 'Today',
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof ZodError) return NextResponse.json({ success: false, error: error.issues[0]?.message || 'Invalid opportunity details.' }, { status: 400 })
    console.error('Create business opportunity error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: error.statusCode || 500 }
    )
  }
}
