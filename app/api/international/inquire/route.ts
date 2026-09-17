import { NextRequest, NextResponse } from 'next/server'
import { internationalService } from '@/modules/international/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { opportunityId, memberId, memberName, memberEmail, memberPhone, inquiryType, message } = body

    if (!opportunityId || !memberId || !memberEmail || !message) {
      return NextResponse.json(
        { success: false, error: 'Opportunity, member credentials, and message are required.' },
        { status: 400 }
      )
    }

    // Verify membership
    const hasAccess = await internationalService.hasInternationalAccess(memberId)
    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'International Private Access is required to initiate connection introductions on this opportunity.',
        },
        { status: 403 }
      )
    }

    const inquiry = await internationalService.createInquiry({
      opportunityId,
      memberId,
      memberName: memberName || 'Member',
      memberEmail,
      memberPhone,
      inquiryType: inquiryType === 'HAVE_CONNECTION' ? 'HAVE_CONNECTION' : 'INTERESTED',
      message: String(message).trim(),
    })

    return NextResponse.json({
      success: true,
      inquiry,
      message: 'Your inquiry has been registered with LUMO Cross-border Desk. A coordinator will follow up.',
    })
  } catch (error: any) {
    console.error('International inquiry error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit inquiry' },
      { status: 500 }
    )
  }
}
