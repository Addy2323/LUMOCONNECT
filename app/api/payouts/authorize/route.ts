import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '@/lib/auth-guard'
import { authorizePayoutBatch } from '@/modules/payouts/service'
import { postJournalEntry, CHART_OF_ACCOUNTS } from '@/lib/ledger'
import { emitOutboxEvent } from '@/lib/outbox'

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce 'payout.authorize' permission (Admin / Finance authorizers)
    const auth = await requirePermission(request, 'payout.authorize')
    const body = (await request.json()) as { payoutId: string }

    if (!body.payoutId) {
      return NextResponse.json(
        { success: false, error: 'payoutId is required' },
        { status: 400 }
      )
    }

    // 2. Authorize batch through Maker-Checker rule engine
    const authorizerName = auth.email.split('@')[0] || 'System Authorizer'
    const authorizedBatch = await authorizePayoutBatch({
      payoutId: body.payoutId,
      authorizerUserId: auth.userId,
      authorizerName,
    })

    // 3. Post double-entry settlement to ledger
    // Debit: Partner Payable Commissions | Credit: Cash Mobile Money Asset
    const journalEntry = postJournalEntry({
      sourceType: 'PAYOUT',
      sourceId: authorizedBatch.id,
      currency: authorizedBatch.currency,
      narration: `Payout settlement batch ${authorizedBatch.payoutNumber} authorized by ${authorizerName}`,
      lines: [
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS,
          accountCode: CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS,
          debitMinor: authorizedBatch.totalAmountTZS,
          creditMinor: 0n,
          memo: 'Clear partner payable liability',
        },
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
          accountCode: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
          debitMinor: 0n,
          creditMinor: authorizedBatch.totalAmountTZS,
          memo: 'Disbursal via Mongike M-Pesa / Tigo Pesa cash account',
        },
      ],
    })

    // 4. Emit outbox event
    const outboxEvent = emitOutboxEvent(
      'PAYOUT_DISBURSED',
      'PAYOUT_BATCH',
      authorizedBatch.id,
      {
        payoutId: authorizedBatch.id,
        payoutNumber: authorizedBatch.payoutNumber,
        amountMinor: authorizedBatch.totalAmountTZS.toString(),
        authorizerUserId: auth.userId,
        journalEntryId: journalEntry.id,
      }
    )

    return NextResponse.json({
      success: true,
      message: `Payout batch ${authorizedBatch.payoutNumber} successfully authorized and disbursed`,
      data: {
        payoutId: authorizedBatch.id,
        payoutNumber: authorizedBatch.payoutNumber,
        status: authorizedBatch.status,
        authorizerUserId: authorizedBatch.authorizerUserId,
        authorizedAt: authorizedBatch.authorizedAt,
        ledger: {
          journalEntryId: journalEntry.id,
          entryNumber: journalEntry.entryNumber,
        },
        outboxEventId: outboxEvent.id,
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      const authErr = error as import('@/lib/auth-guard').AuthError
      return NextResponse.json(
        { success: false, error: authErr.message, code: authErr.code },
        { status: authErr.statusCode }
      )
    }
    const message = error instanceof Error ? error.message : 'Payout authorization failed'
    const isMakerViolation = message.includes('MAKER_CHECKER_VIOLATION')
    const statusCode = isMakerViolation ? 403 : 400

    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
