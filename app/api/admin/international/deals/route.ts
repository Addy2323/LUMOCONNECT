import { NextRequest, NextResponse } from 'next/server'
import { internationalService } from '@/src/modules/international/service'
import { CreateInternationalDealWizardInput } from '@/src/modules/international/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as any
    const dealType = searchParams.get('dealType') || undefined
    const originCountryCode = searchParams.get('originCountryCode') || undefined
    const search = searchParams.get('search') || undefined

    const deals = await internationalService.listAdminDeals({
      status,
      dealType,
      originCountryCode,
      search,
    })

    const stats = await internationalService.getAdminInternationalOverviewStats()

    return NextResponse.json({
      success: true,
      deals,
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching admin international deals:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateInternationalDealWizardInput = await req.json()

    if (!body.title || !body.dealType || !body.originCountryCode || !body.targetCountryCode) {
      return NextResponse.json(
        { success: false, error: 'Title, dealType, originCountryCode, and targetCountryCode are required' },
        { status: 400 }
      )
    }

    const createdDeal = await internationalService.createAdminDeal(body)

    return NextResponse.json({
      success: true,
      deal: createdDeal,
      message: 'International deal created successfully by Admin',
    })
  } catch (error: any) {
    console.error('Error creating admin international deal:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create deal' },
      { status: 500 }
    )
  }
}
