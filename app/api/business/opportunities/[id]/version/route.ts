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

    const body = await request.json().catch(() => ({}))
    const { newRewardValueTZS, amendmentReason, attributionWindowDays } = body

    if (!amendmentReason || !amendmentReason.trim()) {
      return NextResponse.json(
        { success: false, error: 'Reason for amendment and changelog notes are required.' },
        { status: 400 }
      )
    }

    const currentVersions = opp.versions || []
    const nextVersionNumber = currentVersions.length > 0 ? currentVersions[0].versionNumber + 1 : 2

    const rewardSummary = newRewardValueTZS
      ? `TZS ${Number(newRewardValueTZS).toLocaleString()} per verified result`
      : currentVersions[0]?.rewardSummary || 'Updated commercial terms'

    const termsHash = createHash('sha256')
      .update(`${opp.id}|${nextVersionNumber}|${newRewardValueTZS}|${Date.now()}`)
      .digest('hex')

    const newVersion = await db.opportunityVersion.create({
      data: {
        opportunityId: opp.id,
        versionNumber: nextVersionNumber,
        title: opp.title,
        description: opp.description,
        termsHash,
        rewardSummary,
        attributionWindowDays: Number(attributionWindowDays) || currentVersions[0]?.attributionWindowDays || 30,
        termsAndConditions: `${currentVersions[0]?.termsAndConditions || ''}\n\nChangelog (v${nextVersionNumber}): ${amendmentReason.trim()}`,
        isExclusive: false,
        requiresApproval: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Version ${nextVersionNumber} created for "${opp.title}".`,
      version: newVersion,
      versionNumber: nextVersionNumber,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: error.statusCode || 500 }
    )
  }
}
