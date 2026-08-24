import { NextResponse, type NextRequest } from 'next/server'
import { listOpportunities, createDealOpportunity } from '@/modules/deals/service'
import { getAuthContext, requirePermission } from '@/lib/auth-guard'
import type { DealCreateInput } from '@/modules/deals/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || undefined
    const category = searchParams.get('category') || undefined
    const type = searchParams.get('type') || undefined
    const region = searchParams.get('region') || undefined
    const sortBy = (searchParams.get('sortBy') as 'recommended' | 'highest_reward' | 'newest' | 'ending_soon') || 'recommended'

    const opportunities = listOpportunities({
      query,
      category,
      type,
      region,
      sortBy,
    })

    return NextResponse.json({
      success: true,
      total: opportunities.length,
      data: opportunities,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve opportunities'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require 'deal.create' permission
    const auth = await requirePermission(request, 'deal.create')
    const body = (await request.json()) as DealCreateInput

    // Ensure created deal belongs to authenticated organization
    const orgId = auth.organizationId || 'org_default'
    const companyName = auth.email.split('@')[0] || 'My Business Ltd'

    const newDeal = createDealOpportunity(body, orgId, companyName)

    return NextResponse.json(
      {
        success: true,
        message: 'Opportunity successfully created and versioned',
        data: newDeal,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 400
    const message = error instanceof Error ? error.message : 'Invalid deal creation payload'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
