import { OpportunityStatus, OpportunityType } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSession } from '@/lib/admin-session'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'ALL'
    const typeFilter = searchParams.get('type') || 'ALL'
    const query = searchParams.get('q') || ''
    if ((statusFilter !== 'ALL' && !Object.values(OpportunityStatus).includes(statusFilter as OpportunityStatus)) || (typeFilter !== 'ALL' && !Object.values(OpportunityType).includes(typeFilter as OpportunityType))) {
      return NextResponse.json({ error: 'Invalid deal filter.' }, { status: 400 })
    }

    const opportunities = await db.opportunity.findMany({
      where: {
        deletedAt: null,
        ...(statusFilter !== 'ALL' ? { status: statusFilter as OpportunityStatus } : {}),
        ...(typeFilter !== 'ALL' ? { opportunityType: typeFilter as OpportunityType } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { organization: { legalName: { contains: query, mode: 'insensitive' } } },
                { organization: { tradingName: { contains: query, mode: 'insensitive' } } },
                { category: { name: { contains: query, mode: 'insensitive' } } },
                { subcategory: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        organization: true,
        category: true,
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        publishedVersion: { include: { rewardRules: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: { rewardRules: true },
        },
        approvalRequests: {
          orderBy: { createdAt: 'desc' },
          include: {
            makerUser: { select: { id: true, name: true, email: true } },
            checkerUser: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: {
            participations: { where: { status: 'ACTIVE' } },
            conversions: true,
          },
        },
      },
    })

    const formattedDeals = opportunities.map((opp) => {
      const activeVersion = opp.publishedVersion ?? opp.versions[0] ?? null
      const latestApproval = opp.approvalRequests[0] ?? null
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
        title: opp.title,
        slug: opp.slug,
        businessName: opp.organization?.tradingName || opp.organization?.legalName || 'LUMO Business',
        businessTin: opp.organization?.tin || 'Not recorded',
        businessRegNumber: opp.organization?.registrationNumber || 'Not recorded',
        organizationId: opp.organizationId,
        type: opp.opportunityType,
        category: opp.category?.name || 'General',
        subcategory: opp.subcategory || '',
        region: opp.region || 'All Tanzania',
        rewardDisplay,
        rewardModel: opp.rewardModel || 'FIXED_REWARD',
        rewardType: opp.rewardType || 'FIXED',
        rewardPercentage: opp.rewardPercentage ? Number(opp.rewardPercentage) : 0,
        rewardValueTZS: fixedRewardTZS,
        rewardTrigger: opp.rewardTrigger || 'per verified outcome',
        payoutCondition: opp.payoutCondition || 'Upon verified outcome',
        status: opp.status,
        version: activeVersion?.versionNumber ?? (opp.publishedVersionId ? 1 : null),
        versionCount: opp.versions.length,
        summary: opp.summary,
        description: opp.description,
        requirements: opp.requirements,
        targetAudience: (opp.requirements as any)?.targetAudience || opp.accessTier || 'All Partners',
        deliverables: opp.successCondition || (opp.requirements as any)?.deliverables || 'Deliver verified conversions',
        documentsRequired: opp.documentsRequired,
        contactPersonName: opp.contactPersonName || '',
        contactPersonPhone: opp.contactPersonPhone || '',
        contactPersonEmail: opp.contactPersonEmail || '',
        closingDate: opp.closingDate ? opp.closingDate.toISOString().slice(0, 10) : null,
        visibility: opp.visibility || 'PUBLIC',
        accessTier: opp.accessTier || 'ALL_PARTNERS',
        featured: opp.isFeatured,
        commissionModel: opp.rewardModel || opp.rewardType || 'FIXED_REWARD',
        payoutStructure: opp.payoutCondition || 'ESCROW',
        commercialResultType: opp.commercialResultType || 'COMPLETED_SALE',
        successCondition: opp.successCondition || '',
        verificationEvidence: opp.verificationEvidence || activeVersion?.termsAndConditions || '',
        verificationWindowDays: opp.verificationWindowDays ?? 14,
        cancellationTerms: opp.cancellationTerms || 'Standard 7 days notice.',
        featuredImageUrl: opp.coverImageUrl,
        bannerUrl: opp.coverImageUrl,
        promoVideoUrl: opp.promoVideoUrl,
        galleryImageUrls: opp.galleryImageUrls || [],
        mediaUrls: opp.galleryImageUrls || [],
        termsAndConditions: activeVersion?.termsAndConditions ?? null,
        termsHash: activeVersion?.termsHash ?? null,
        spentTZS: Number(opp.spentBudgetMinor) / 100,
        budgetRecorded: opp.totalBudgetMinor !== null,
        budgetTZS: Number(opp.totalBudgetMinor ? opp.totalBudgetMinor / 100n : 0n),
        commercialValueTZS: opp.commercialValueMinor !== null ? Number(opp.commercialValueMinor) / 100 : null,
        originalCurrency: opp.originalCurrency || 'TZS',
        originalDealValue: opp.originalDealValueMinor ? Number(opp.originalDealValueMinor) / 100 : null,
        referenceCurrency: opp.referenceCurrency || 'TZS',
        referenceValue: opp.referenceValueMinor ? Number(opp.referenceValueMinor) / 100 : null,
        exchangeRateUsed: opp.exchangeRateUsed ? Number(opp.exchangeRateUsed) : null,
        exchangeRateDate: opp.exchangeRateDate ? opp.exchangeRateDate.toISOString().slice(0, 10) : null,
        activePartnersCount: opp._count.participations,
        activePartners: opp._count.participations,
        totalConversionsCount: opp._count.conversions,
        totalConversions: opp._count.conversions,
        makerOperator: latestApproval?.makerUser?.name || opp.createdByUser?.name || 'Business Maker',
        checkerOperator: latestApproval?.checkerUser?.name || (opp.status === 'PUBLISHED' ? 'Platform Compliance' : null),
        approvalStatus: latestApproval?.approvalStatus || (opp.status === 'UNDER_REVIEW' ? 'PENDING_CHECKER' : opp.status),
        reviewerComments: latestApproval?.reviewerComments || null,
        approvalHistory: opp.approvalRequests.map((a) => ({
          id: a.id,
          status: a.approvalStatus,
          makerName: a.makerUser?.name || 'Maker',
          checkerName: a.checkerUser?.name || 'Pending',
          comments: a.reviewerComments,
          submittedAt: a.submittedAt.toISOString(),
          reviewedAt: a.reviewedAt?.toISOString() || null,
        })),
        createdAt: opp.createdAt.toISOString().slice(0, 10),
        updatedAt: opp.updatedAt.toISOString().slice(0, 10),
        publishedAt: opp.publishedVersion ? opp.publishedVersion.effectiveAt.toISOString().slice(0, 10) : undefined,
      }
    })

    return NextResponse.json({ deals: formattedDeals })
  } catch (err: any) {
    console.error('GET /api/admin/deals error:', err)
    return NextResponse.json({ error: 'Unable to process the deal request. Please refresh and retry.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    if (!session) return NextResponse.json({ error: 'Session expired.' }, { status: 401 })
    const actorId = session.userId

    const body = await request.json().catch(() => ({}))
    const { dealId, status, rejectionReason, ...editFields } = body

    if (typeof dealId !== 'string' || !/^[0-9a-f-]{36}$/i.test(dealId)) {
      return NextResponse.json({ message: 'Valid dealId is required.' }, { status: 400 })
    }

    const opportunity = await db.opportunity.findUnique({
      where: { id: dealId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    })

    if (!opportunity) {
      return NextResponse.json({ message: 'Opportunity not found.' }, { status: 404 })
    }

    const updateData: any = {}

    // Status update handling
    if (status) {
      const allowed = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'RETURNED', 'REJECTED', 'PUBLISHED', 'PAUSED', 'COMPLETED', 'CLOSED', 'ARCHIVED'].includes(status)
      if (!allowed) {
        return NextResponse.json({ error: 'Invalid target status.' }, { status: 400 })
      }

      if (status === 'PUBLISHED' && (!opportunity.publishedVersionId || opportunity.status === 'DRAFT')) {
        return NextResponse.json({ error: 'Cannot publish a draft deal directly. Deals must go through checker approval.' }, { status: 409 })
      }

      updateData.status = status
    }

    // Permitted administrative content updates
    if (editFields.title !== undefined) updateData.title = String(editFields.title).trim()
    if (editFields.summary !== undefined) updateData.summary = String(editFields.summary).trim()
    if (editFields.description !== undefined) updateData.description = String(editFields.description).trim()
    if (editFields.region !== undefined) updateData.region = String(editFields.region).trim()
    if (editFields.subcategory !== undefined) updateData.subcategory = String(editFields.subcategory).trim()
    if (editFields.coverImageUrl !== undefined) updateData.coverImageUrl = editFields.coverImageUrl
    if (editFields.promoVideoUrl !== undefined) updateData.promoVideoUrl = editFields.promoVideoUrl
    if (editFields.galleryImageUrls !== undefined) updateData.galleryImageUrls = Array.isArray(editFields.galleryImageUrls) ? editFields.galleryImageUrls : []
    if (editFields.requirements !== undefined) updateData.requirements = editFields.requirements
    if (editFields.documentsRequired !== undefined) updateData.documentsRequired = editFields.documentsRequired
    if (editFields.commercialResultType !== undefined) updateData.commercialResultType = editFields.commercialResultType
    if (editFields.successCondition !== undefined) updateData.successCondition = editFields.successCondition
    if (editFields.verificationEvidence !== undefined) updateData.verificationEvidence = editFields.verificationEvidence
    if (editFields.verificationWindowDays !== undefined) updateData.verificationWindowDays = Number(editFields.verificationWindowDays)
    if (editFields.cancellationTerms !== undefined) updateData.cancellationTerms = editFields.cancellationTerms
    if (editFields.rewardDisplayLabel !== undefined) updateData.rewardDisplayLabel = editFields.rewardDisplayLabel
    if (editFields.rewardTrigger !== undefined) updateData.rewardTrigger = editFields.rewardTrigger
    if (editFields.payoutCondition !== undefined) updateData.payoutCondition = editFields.payoutCondition
    if (editFields.contactPersonName !== undefined) updateData.contactPersonName = editFields.contactPersonName
    if (editFields.contactPersonPhone !== undefined) updateData.contactPersonPhone = editFields.contactPersonPhone
    if (editFields.contactPersonEmail !== undefined) updateData.contactPersonEmail = editFields.contactPersonEmail
    if (editFields.closingDate !== undefined) updateData.closingDate = editFields.closingDate ? new Date(editFields.closingDate) : null
    if (editFields.visibility !== undefined) updateData.visibility = editFields.visibility
    if (editFields.accessTier !== undefined) updateData.accessTier = editFields.accessTier

    const updatedOpp = await db.$transaction(async (tx) => {
      const updated = await tx.opportunity.update({
        where: { id: dealId },
        data: updateData,
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: 'ADMIN_DEAL_UPDATED',
          entityType: 'OPPORTUNITY',
          entityId: dealId,
          beforeData: { status: opportunity.status, title: opportunity.title },
          afterData: { status: updated.status, updateData, rejectionReason },
        },
      })

      return updated
    })

    return NextResponse.json({ success: true, deal: { id: updatedOpp.id, status: updatedOpp.status } })
  } catch (err: any) {
    console.error('PATCH /api/admin/deals error:', err)
    return NextResponse.json({ error: 'Unable to update deal. Please refresh and retry.' }, { status: 500 })
  }
}

