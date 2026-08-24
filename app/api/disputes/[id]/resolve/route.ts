import { NextResponse, type NextRequest } from 'next/server'
import { resolveDispute, getDisputeById } from '@/modules/disputes/service'
import { requirePermission } from '@/lib/auth-guard'
import { postJournalEntry, CHART_OF_ACCOUNTS } from '@/lib/ledger'
import { emitOutboxEvent } from '@/lib/outbox'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    // Requires 'dispute.resolve' permission (Admin)
    const auth = await requirePermission(request, 'dispute.resolve')
    const body = (await request.json()) as {
      decision: 'RESOLVED_PARTNER_FAVOR' | 'RESOLVED_BUSINESS_FAVOR'
      resolutionNotes: string
    }

    if (!body.decision || !body.resolutionNotes) {
      return NextResponse.json(
        { success: false, error: 'decision (RESOLVED_PARTNER_FAVOR | RESOLVED_BUSINESS_FAVOR) and resolutionNotes are required' },
        { status: 400 }
      )
    }

    const dispute = getDisputeById(id)
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 })
    }

    const updated = resolveDispute({
      disputeId: id,
      decision: body.decision,
      resolutionNotes: body.resolutionNotes,
      resolverId: auth.userId,
    })

    // Post double-entry adjustment:
    // If in partner favor: Escrow -> Partner Payable
    // If in business favor: Escrow -> Refunded
    const cleanAmountStr = dispute.amountTZS.replace(/[^0-9]/g, '')
    const amountMinor = cleanAmountStr ? BigInt(parseInt(cleanAmountStr, 10) * 100) : 4500000n

    const isPartnerFavor = body.decision === 'RESOLVED_PARTNER_FAVOR'
    const targetAccount = isPartnerFavor
      ? CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS
      : CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW

    const journalEntry = postJournalEntry({
      sourceType: 'ADJUSTMENT',
      sourceId: id,
      currency: 'TZS',
      narration: `Dispute ${dispute.disputeNumber} resolution: ${body.decision}`,
      lines: [
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
          accountCode: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
          debitMinor: amountMinor,
          creditMinor: 0n,
          memo: 'Release dispute escrow hold',
        },
        {
          ledgerAccountId: targetAccount,
          accountCode: targetAccount,
          debitMinor: 0n,
          creditMinor: amountMinor,
          memo: isPartnerFavor ? 'Payable released to partner' : 'Escrow credited back to business',
        },
      ],
    })

    emitOutboxEvent('NOTIFICATION_DISPATCH', 'DISPUTE', id, {
      disputeNumber: dispute.disputeNumber,
      decision: body.decision,
      resolverId: auth.userId,
      journalEntryId: journalEntry.id,
    })

    return NextResponse.json({
      success: true,
      message: `Dispute resolved in favor of ${isPartnerFavor ? 'Partner' : 'Business'}`,
      data: updated,
      ledger: {
        journalEntryId: journalEntry.id,
        entryNumber: journalEntry.entryNumber,
      },
    })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 400
    const message = error instanceof Error ? error.message : 'Failed to resolve dispute'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
