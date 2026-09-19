import { NextRequest, NextResponse } from 'next/server'
import { internationalService } from '@/modules/international/service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countryCode = searchParams.get('country') || undefined
    const category = searchParams.get('category') || undefined
    const intent = searchParams.get('intent') || undefined
    const currency = searchParams.get('currency') || undefined
    const search = searchParams.get('q') || undefined
    const userId = searchParams.get('userId') || ''

    const isMember = userId ? await internationalService.hasInternationalAccess(userId) : false

    const opportunities = await internationalService.listPublishedOpportunities({
      countryCode,
      category,
      intent,
      currency,
      search,
    })

    // Mask details for non-members
    const items = opportunities.map((opp) => {
      if (isMember) {
        return { ...opp, isUnlocked: true }
      }
      return {
        ...opp,
        isUnlocked: false,
        fullDescription: opp.summary,
        commercialTerms: 'Locked — International Private Access required to view full commercial terms.',
      }
    })

    return NextResponse.json({
      success: true,
      count: items.length,
      isMember,
      opportunities: items,
    })
  } catch (error: any) {
    console.error('Fetch international opportunities error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch international opportunities' },
      { status: 500 }
    )
  }
}
