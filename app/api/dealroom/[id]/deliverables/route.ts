import { NextResponse, type NextRequest } from 'next/server'
import { submitDeliverable, reviewDeliverable, getDealRoom } from '@/modules/dealroom/service'
import { requireAuth } from '@/lib/auth-guard'
import { postJournalEntry, CHART_OF_ACCOUNTS } from '@/lib/ledger'
import { emitOutboxEvent } from '@/lib/outbox'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const auth = await requireAuth(request)
    const body = (await request.json()) as {
      action: 'SUBMIT' | 'REVIEW'
      deliverableId: string
      evidenceUrl?: string
      notes?: string
      status?: 'APPROVED' | 'REVISION_REQUESTED'
      reviewNotes?: string
    }

    const room = getDealRoom(id)
    if (!room) {
      return NextResponse.json({ success: false, error: 'Deal room not found' }, { status: 404 })
    }

    if (body.action === 'SUBMIT') {
      if (!body.evidenceUrl) {
        return NextResponse.json({ success: false, error: 'evidenceUrl is required for submission' }, { status: 400 })
      }

      const updatedDel = submitDeliverable({
        dealRoomId: id,
        deliverableId: body.deliverableId,
        evidenceUrl: body.evidenceUrl,
        notes: body.notes,
      })

      emitOutboxEvent('NOTIFICATION_DISPATCH', 'DELIVERABLE', body.deliverableId, {
        dealRoomId: id,
        deliverableTitle: updatedDel.title,
        action: 'SUBMITTED',
        submittedBy: auth.userId,
      })

      return NextResponse.json({
        success: true,
        message: 'Deliverable submitted for review',
        data: updatedDel,
      })
    }

    if (body.action === 'REVIEW') {
      if (!body.status || !body.reviewNotes) {
        return NextResponse.json(
          { success: false, error: 'status (APPROVED|REVISION_REQUESTED) and reviewNotes are required' },
          { status: 400 }
        )
      }

      const updatedDel = reviewDeliverable({
        dealRoomId: id,
        deliverableId: body.deliverableId,
        status: body.status,
        reviewNotes: body.reviewNotes,
        reviewerId: auth.userId,
        reviewerName: auth.email.split('@')[0] || 'Business Reviewer',
      })

      // If approved and room has fixed fee milestone, post double-entry milestone release from escrow
      if (body.status === 'APPROVED' && room.fixedFeeTZS > 0n) {
        postJournalEntry({
          sourceType: 'REWARD',
          sourceId: `${id}_${body.deliverableId}`,
          currency: 'TZS',
          narration: `Deal room milestone deliverable approved: ${updatedDel.title}`,
          lines: [
            {
              ledgerAccountId: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
              accountCode: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
              debitMinor: room.fixedFeeTZS,
              creditMinor: 0n,
              memo: 'Release prefunded escrow for verified milestone',
            },
            {
              ledgerAccountId: CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS,
              accountCode: CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS,
              debitMinor: 0n,
              creditMinor: room.fixedFeeTZS,
              memo: 'Milestone fixed reward payable to creator',
            },
          ],
        })
      }

      emitOutboxEvent('NOTIFICATION_DISPATCH', 'DELIVERABLE', body.deliverableId, {
        dealRoomId: id,
        deliverableTitle: updatedDel.title,
        status: body.status,
        reviewedBy: auth.userId,
      })

      return NextResponse.json({
        success: true,
        message: `Deliverable ${body.status.toLowerCase()}`,
        data: updatedDel,
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 400
    const message = error instanceof Error ? error.message : 'Deliverable operation failed'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
