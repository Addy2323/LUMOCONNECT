import { NextResponse, type NextRequest } from 'next/server'
import { getOpportunityById } from '@/modules/deals/service'
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
    const body = (await request.json().catch(() => ({}))) as {
      amountMinor?: string | number
      paymentMethod?: 'MPESA' | 'AIRTEL_MONEY' | 'TIGO_PESA' | 'BANK_TRANSFER'
    }

    const opp = getOpportunityById(id)
    if (!opp) {
      return NextResponse.json({ success: false, error: 'Opportunity not found' }, { status: 404 })
    }

    const fundingAmountMinor = body.amountMinor ? BigInt(body.amountMinor) : 250000000n // TZS 2,500,000 default budget
    const providerRef = `MOMO-FUND-${Date.now()}`

    // 1. Post pre-funding deposit to ledger escrow
    // Debit: Cash Mobile Money | Credit: Business Prefunded Escrow Deposits
    const journalEntry = postJournalEntry({
      sourceType: 'PAYMENT',
      sourceId: `fund_${opp.id}`,
      currency: 'TZS',
      narration: `Merchant prefunded reward escrow for Opportunity: ${opp.title}`,
      lines: [
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
          accountCode: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
          debitMinor: fundingAmountMinor,
          creditMinor: 0n,
          memo: 'Escrow reward deposit via mobile money',
        },
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
          accountCode: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
          debitMinor: 0n,
          creditMinor: fundingAmountMinor,
          memo: 'Reward budget locked in platform escrow',
        },
      ],
    })

    // 2. Unlock and transition opportunity to PUBLISHED
    opp.status = 'PUBLISHED'

    emitOutboxEvent('NOTIFICATION_DISPATCH', 'OPPORTUNITY', opp.id, {
      opportunityId: opp.id,
      title: opp.title,
      status: 'PUBLISHED',
      fundedAmountMinor: fundingAmountMinor.toString(),
      journalEntryId: journalEntry.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Reward escrow successfully funded. Opportunity is now live and published on LUMO marketplace.',
      data: {
        opportunityId: opp.id,
        status: opp.status,
        fundingStatus: 'FUNDED',
        rewardSecured: true,
        amountReservedMinor: fundingAmountMinor.toString(),
        providerReference: providerRef,
        fundingExpiry: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
        ledger: {
          journalEntryId: journalEntry.id,
          entryNumber: journalEntry.entryNumber,
        },
      },
    })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 400
    const message = error instanceof Error ? error.message : 'Reward funding failed'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
