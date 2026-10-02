import { NextRequest, NextResponse } from 'next/server'
import { internationalService } from '@/src/modules/international/service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.dealId || !body.partnerUserId || !body.partnerName || !body.partnerEmail) {
      return NextResponse.json(
        { success: false, error: 'dealId, partnerUserId, partnerName, and partnerEmail are required' },
        { status: 400 }
      )
    }

    const application = await internationalService.applyToInternationalDeal({
      dealId: body.dealId,
      partnerUserId: body.partnerUserId,
      partnerName: body.partnerName,
      partnerEmail: body.partnerEmail,
      partnerPhone: body.partnerPhone,
      partnerCountry: body.partnerCountry,
      applicationNote: body.applicationNote,
    })

    return NextResponse.json({
      success: true,
      application,
      message: application.status === 'APPROVED' 
        ? 'Enrolled in International Deal successfully! Your tracking link is ready.'
        : 'Application submitted for Admin review. You will be notified once approved.',
    })
  } catch (error: any) {
    console.error('Error applying to international deal:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit application' },
      { status: 500 }
    )
  }
}
