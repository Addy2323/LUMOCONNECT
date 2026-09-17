import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSession } from '@/lib/admin-session'
import { internationalService } from '@/modules/international/service'

export async function POST(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied

  try {
    const body = await request.json()
    const { action, submissionId, status, adminNotes, overrides, commInput, actorName = 'LUMO Admin' } = body

    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'submissionId is required' }, { status: 400 })
    }

    const submission = await internationalService.getSubmissionById(submissionId)
    if (!submission) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 })
    }

    if (action === 'UPDATE_STATUS' && status) {
      const updated = await internationalService.updateSubmissionStatus(submissionId, status, adminNotes, actorName)
      return NextResponse.json({ success: true, submission: updated })
    }

    if (action === 'PUBLISH') {
      const opportunity = await internationalService.publishOpportunity(submissionId, overrides, actorName)
      return NextResponse.json({ success: true, opportunity })
    }

    if (action === 'LOG_COMMUNICATION' && commInput) {
      const comm = await internationalService.logCommunication({
        submissionId,
        channel: commInput.channel || 'INTERNAL_NOTE',
        direction: commInput.direction || 'OUTBOUND',
        subject: commInput.subject || 'Admin Communication',
        messageBody: commInput.messageBody || '',
        actorName,
      })
      return NextResponse.json({ success: true, communication: comm })
    }

    if (action === 'GET_COMMUNICATIONS') {
      const communications = await internationalService.getCommunications(submissionId)
      const whatsApp = internationalService.buildWhatsAppMessage(submission)
      return NextResponse.json({ success: true, communications, whatsApp })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    console.error('Admin international action error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error processing international action' },
      { status: 500 }
    )
  }
}
