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
    await assertOpportunityOwnership(id, biz.businessId)

    const body = await request.json().catch(() => ({}))
    const { status, title, summary, description, region, coverImageUrl, promoVideoUrl } = body

    const updateData: any = {}
    if (body.commercialValueTZS !== undefined) {
      const value = commercialValueSchema.safeParse(body.commercialValueTZS)
      if (!value.success) return NextResponse.json({ error: 'Invalid commercial deal value' }, { status: 400 })
      updateData.commercialValueMinor = value.data
    }
    if (status && ['DRAFT', 'UNDER_REVIEW', 'RETURNED', 'REJECTED', 'PUBLISHED', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED'].includes(status)) {
      updateData.status = status
    }
    if (title) updateData.title = title
    if (summary) updateData.summary = summary
    if (description) updateData.description = description
    if (region) updateData.region = region
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl
    if (promoVideoUrl !== undefined) updateData.promoVideoUrl = promoVideoUrl

    const updated = await db.opportunity.update({
      where: { id },
      data: updateData,
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
