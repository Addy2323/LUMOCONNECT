import { NextResponse, type NextRequest } from 'next/server'
import { listDisputes, openDispute, addDisputeMessage } from '@/modules/disputes/service'
import { requireAuth } from '@/lib/auth-guard'
import { emitOutboxEvent } from '@/lib/outbox'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    const disputes = listDisputes()
    return NextResponse.json({ success: true, total: disputes.length, data: disputes })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 500
    const message = error instanceof Error ? error.message : 'Failed to fetch disputes'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const body = (await request.json()) as {
      organizationId: string
      dealTitle: string
      partnerName: string
      title: string
      reason: string
      amountTZS: string
      initialEvidence?: string
      disputeId?: string // If present, adds a message to existing dispute
      messageText?: string
    }

    // Add message to existing dispute
    if (body.disputeId && body.messageText) {
      const sender = auth.email.split('@')[0]
      const updated = addDisputeMessage({
        disputeId: body.disputeId,
        sender,
        text: body.messageText,
      })
      return NextResponse.json({ success: true, message: 'Message added to dispute thread', data: updated })
    }

    // Otherwise open a new dispute
    if (!body.title || !body.reason) {
      return NextResponse.json({ success: false, error: 'Title and reason are required to open a dispute' }, { status: 400 })
    }

    const openedBy = auth.email.split('@')[0]
    const newDispute = openDispute({
      organizationId: body.organizationId || 'org_default',
      dealTitle: body.dealTitle || 'Commercial Deal',
      partnerName: body.partnerName || openedBy,
      title: body.title,
      reason: body.reason,
      amountTZS: body.amountTZS || 'TZS 0',
      initialEvidence: body.initialEvidence,
      openedBy,
    })

    emitOutboxEvent('NOTIFICATION_DISPATCH', 'DISPUTE', newDispute.id, {
      disputeNumber: newDispute.disputeNumber,
      title: newDispute.title,
      action: 'OPENED',
      openedBy: auth.userId,
    })

    return NextResponse.json({ success: true, message: 'Dispute claim filed successfully', data: newDispute }, { status: 201 })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 400
    const message = error instanceof Error ? error.message : 'Failed to process dispute'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
