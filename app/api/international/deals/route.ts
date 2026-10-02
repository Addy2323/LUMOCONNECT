import { NextRequest, NextResponse } from 'next/server'
import { internationalService } from '@/src/modules/international/service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dealType = searchParams.get('dealType') || undefined
    const originCountryCode = searchParams.get('originCountryCode') || undefined
    const search = searchParams.get('search') || undefined

    const deals = await internationalService.listAdminDeals({
      status: 'PUBLISHED',
      dealType,
      originCountryCode,
      search,
    })

    return NextResponse.json({
      success: true,
      deals,
      totalCount: deals.length,
    })
  } catch (error: any) {
    console.error('Error fetching international deals for marketplace:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}
