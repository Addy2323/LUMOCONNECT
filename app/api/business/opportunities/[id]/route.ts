import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { commercialValueSchema } from '@/lib/marketplace-stats'
import { getAuthenticatedBusiness, assertOpportunityOwnership } from '@/lib/business-guard'

export async function GET(
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

    return NextResponse.json({
      success: true,
      opportunity: opp,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: error.statusCode || 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const biz = await getAuthenticatedBusiness(request)

    // Assert ownership
    const current = await assertOpportunityOwnership(id, biz.businessId)

    const body = await request.json().catch(() => ({}))
    const {
      status,
      title,
      summary,
      description,
      region,
      coverImageUrl,
      promoVideoUrl,
      galleryImageUrls,
      commercialResultType,
      successCondition,
      verificationEvidence,
      verificationWindowDays,
      cancellationTerms,
      contactPersonName,
      contactPersonPhone,
      contactPersonEmail,
      closingDate,
      visibility,
      accessTier,
      requirements,
      documentsRequired,
      rewardModel,
      rewardType,
      rewardPercentage,
      rewardValueTZS,
      estimatedBudgetTZS,
      customRewardDisplay,
      customRewardDetail,
      customFormulaDescription,
      originalCurrency,
      originalDealValue,
      referenceCurrency,
      referenceValue,
    } = body

    const updateData: any = {}
    if (body.commercialValueTZS !== undefined) {
      const value = commercialValueSchema.safeParse(body.commercialValueTZS)
      if (!value.success) return NextResponse.json({ error: 'Invalid commercial deal value' }, { status: 400 })
      updateData.commercialValueMinor = value.data
    }
    if (status && ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'RETURNED', 'REJECTED', 'PUBLISHED', 'PAUSED', 'COMPLETED', 'CLOSED', 'CANCELLED', 'ARCHIVED'].includes(status)) {
      updateData.status = status === 'SUBMITTED' ? 'UNDER_REVIEW' : status
    }
    if (title) updateData.title = title
    if (summary) updateData.summary = summary
    if (description) updateData.description = description
    if (region) updateData.region = region
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl
    if (promoVideoUrl !== undefined) updateData.promoVideoUrl = promoVideoUrl
    if (galleryImageUrls !== undefined) updateData.galleryImageUrls = Array.isArray(galleryImageUrls) ? galleryImageUrls : []
    if (commercialResultType) updateData.commercialResultType = commercialResultType
    if (successCondition !== undefined) updateData.successCondition = successCondition
    if (verificationEvidence !== undefined) updateData.verificationEvidence = verificationEvidence
    if (verificationWindowDays !== undefined) updateData.verificationWindowDays = Number(verificationWindowDays)
    if (cancellationTerms !== undefined) updateData.cancellationTerms = cancellationTerms
    if (contactPersonName !== undefined) updateData.contactPersonName = contactPersonName
    if (contactPersonPhone !== undefined) updateData.contactPersonPhone = contactPersonPhone
    if (contactPersonEmail !== undefined) updateData.contactPersonEmail = contactPersonEmail
    if (closingDate !== undefined) updateData.closingDate = closingDate ? new Date(closingDate) : null
    if (visibility) updateData.visibility = visibility
    if (accessTier) updateData.accessTier = accessTier
    if (requirements !== undefined) updateData.requirements = requirements
    if (documentsRequired !== undefined) updateData.documentsRequired = documentsRequired
    if (rewardModel) updateData.rewardModel = rewardModel
    if (rewardType) updateData.rewardType = rewardType
    if (rewardPercentage !== undefined) updateData.rewardPercentage = rewardPercentage ? Number(rewardPercentage) : null
    if (rewardValueTZS !== undefined) {
      updateData.fixedRewardAmountMinor = BigInt(Math.round(Number(rewardValueTZS || 0) * 100))
    }
    if (estimatedBudgetTZS !== undefined) {
      updateData.totalBudgetMinor = BigInt(Math.round(Number(estimatedBudgetTZS || 0) * 100))
      updateData.securedBudgetMinor = updateData.totalBudgetMinor
    }
    if (customRewardDisplay) updateData.rewardDisplayLabel = customRewardDisplay
    if (customRewardDetail) updateData.rewardTrigger = customRewardDetail
    if (customFormulaDescription) updateData.payoutCondition = customFormulaDescription
    if (originalCurrency) updateData.originalCurrency = originalCurrency
    if (originalDealValue !== undefined) {
      updateData.originalDealValueMinor = originalDealValue ? BigInt(Math.round(Number(originalDealValue) * 100)) : null
    }
    if (referenceCurrency) updateData.referenceCurrency = referenceCurrency
    if (referenceValue !== undefined) {
      updateData.referenceValueMinor = referenceValue ? BigInt(Math.round(Number(referenceValue) * 100)) : null
    }

    const updated = await db.$transaction(async (tx) => {
      const opp = await tx.opportunity.update({
        where: { id },
        data: updateData,
      })

      // If resubmitting for review (transitioning to UNDER_REVIEW)
      if (updateData.status === 'UNDER_REVIEW') {
        const pendingApproval = await tx.approvalRequest.findFirst({
          where: { opportunityId: id, approvalStatus: 'PENDING_CHECKER' },
        })
        if (!pendingApproval) {
          await tx.approvalRequest.create({
            data: {
              opportunityId: id,
              makerUserId: biz.userId,
              approvalStatus: 'PENDING_CHECKER',
              submittedAt: new Date(),
            },
          })
        }
      }

      await tx.auditLog.create({
        data: {
          actorUserId: biz.userId,
          action: updateData.status === 'UNDER_REVIEW' ? 'OPPORTUNITY_RESUBMITTED' : 'OPPORTUNITY_UPDATED',
          entityType: 'OPPORTUNITY',
          entityId: id,
          afterData: { status: opp.status, title: opp.title },
        },
      })

      return opp
    })

    return NextResponse.json({
      success: true,
      message: `Opportunity ${id} updated.`,
      opportunity: JSON.parse(JSON.stringify(updated, (_, value) => typeof value === 'bigint' ? value.toString() : value)),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: error.statusCode || 500 }
    )
  }
}


export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const biz = await getAuthenticatedBusiness(request)

    // Assert ownership
    const opp = await assertOpportunityOwnership(id, biz.businessId)
    if (!opp) {
      return NextResponse.json({ success: false, error: 'Opportunity not found' }, { status: 404 })
    }

    // Safety rule 50: Draft opportunity with no activity may be deletable.
    // Published/active opportunities cannot be hard-deleted.
    const activeCount = opp.participations?.filter((p) => p.status === 'ACTIVE').length || 0
    if (opp.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only unpublished DRAFT opportunities can be deleted. Published opportunities must be paused or archived.',
        },
        { status: 400 }
      )
    }

    await db.opportunity.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Draft opportunity deleted.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: error.statusCode || 500 }
    )
  }
}
