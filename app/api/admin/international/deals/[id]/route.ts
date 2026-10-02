import { NextRequest, NextResponse } from 'next/server'
import { internationalService } from '@/src/modules/international/service'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deal = await internationalService.getAdminDealById(id)

    if (!deal) {
      return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 })
    }

    const applications = await internationalService.listDealApplications(id)

    return NextResponse.json({
      success: true,
      deal,
      applications,
    })
  } catch (error: any) {
    console.error('Error fetching admin international deal detail:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch deal detail' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    if (body.status) {
      const updated = await internationalService.updateAdminDealStatus(id, body.status)
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        deal: updated,
        message: `Deal status updated to ${body.status}`,
      })
    }

    return NextResponse.json({ success: false, error: 'No update payload provided' }, { status: 400 })
  } catch (error: any) {
    console.error('Error updating admin international deal:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update deal' },
      { status: 500 }
    )
  }
}
