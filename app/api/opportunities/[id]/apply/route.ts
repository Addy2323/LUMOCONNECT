import { NextResponse, type NextRequest } from 'next/server'
import { joinOpportunityDeal } from '@/modules/deals/service'
import { requireAuth } from '@/lib/auth-guard'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const auth = await requireAuth(request)
    const body = (await request.json().catch(() => ({}))) as { proposalNotes?: string }

    const result = joinOpportunityDeal(id, {
      userId: auth.userId,
      userRole: auth.roles[0]?.role,
      userOrgId: auth.organizationId,
      proposalNotes: body.proposalNotes,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          decision: result.decision,
        },
        { status: result.decision.requiresSubscription ? 402 : 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        trackingCode: result.trackingCode,
        isAlreadyEnrolled: result.isAlreadyEnrolled,
      },
      { status: result.isAlreadyEnrolled ? 200 : 201 }
    )
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 500
    const message = error instanceof Error ? error.message : 'Failed to apply to opportunity'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
