import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { evaluateAttribution } from '@/modules/attribution/service'
import { evaluateTransactionRisk } from '@/modules/risk/service'
import { recordConversionCommission } from '@/modules/commissions/service'
import { getOpportunityById } from '@/modules/deals/service'
import { postJournalEntry, CHART_OF_ACCOUNTS } from '@/lib/ledger'
import { emitOutboxEvent } from '@/lib/outbox'
import { conversionKey } from '@/lib/idempotency'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const body = (await request.json()) as {
      organizationId?: string
      dealId: string
      externalReference: string
      amountMinor: string | number
      trackingCode?: string
      promoCode?: string
      customerFingerprint?: string
      customerIp?: string
      partnerId?: string
    }

    const orgId = auth.organizationId || body.organizationId || 'org_mobipay'
    const transactionAmountMinor = BigInt(body.amountMinor)
    const conversionId = conversionKey()

    // 1. Fetch deal to get terms
    const deal = getOpportunityById(body.dealId)
    const dealTitle = deal?.title || 'Commercial Partner Deal'
    const rewardType = deal?.rewardType || 'PERCENTAGE_COMMISSION'

    // 2. Risk Assessment
    const partnerId = body.partnerId || 'partner_alex'
    const riskEvaluation = evaluateTransactionRisk({
      partnerId,
      customerIp: body.customerIp || '102.214.72.10',
      partnerIp: '197.186.20.1',
      transactionVelocityInLastHour: 3,
      orderValueTZS: Number(transactionAmountMinor) / 100,
    })

    // 3. Attribution Calculation
    const attribution = evaluateAttribution({
      conversionId,
      touches: body.trackingCode
        ? [
            {
              trackingLinkId: `tl_${body.trackingCode}`,
              code: body.trackingCode,
              touchType: 'CLICK',
              visitorId: body.customerFingerprint || 'vis_default',
              timestamp: new Date(),
            },
          ]
        : [],
      promoCodeUsed: body.promoCode,
      model: 'LAST_CLICK',
    })

    // 4. Create and transition commission state
    const commission = recordConversionCommission({
      organizationId: orgId,
      dealId: body.dealId,
      partnerId,
      partnerName: 'Alex Mushi',
      dealTitle,
      conversionId,
      externalRef: body.externalReference,
      transactionAmountMinor,
      rewardType,
      percentageBps: 1000,
    })

    // 5. Post Balanced Double-Entry Ledger Entry
    // Debit: Commission Expense (or Escrow) | Credit: Partner Payable & TRA Tax Payable & Fee Revenue
    const grossComm = commission.grossCommissionMinorUnits
    const taxWithheld = commission.taxWithheldMinorUnits
    const feeMinor = commission.platformFeeMinorUnits
    const netPayable = commission.netPayableMinorUnits

    const journalEntry = postJournalEntry({
      sourceType: 'CONVERSION',
      sourceId: conversionId,
      currency: 'TZS',
      narration: `Conversion ${body.externalReference} attribution for ${dealTitle}`,
      lines: [
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.COMMISSION_EXPENSE_BUSINESS,
          accountCode: CHART_OF_ACCOUNTS.COMMISSION_EXPENSE_BUSINESS,
          debitMinor: grossComm,
          creditMinor: 0n,
          memo: 'Business gross commission expense',
        },
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS,
          accountCode: CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS,
          debitMinor: 0n,
          creditMinor: netPayable,
          memo: 'Net payable to partner',
        },
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.TRA_WITHHOLDING_TAX_PAYABLE,
          accountCode: CHART_OF_ACCOUNTS.TRA_WITHHOLDING_TAX_PAYABLE,
          debitMinor: 0n,
          creditMinor: taxWithheld,
          memo: 'TRA 5% statutory withholding tax',
        },
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.PLATFORM_TRANSACTION_FEE_REVENUE,
          accountCode: CHART_OF_ACCOUNTS.PLATFORM_TRANSACTION_FEE_REVENUE,
          debitMinor: 0n,
          creditMinor: feeMinor,
          memo: 'LUMO platform service fee',
        },
      ],
    })

    // 6. Emit Transactional Outbox Event
    const outboxEvent = emitOutboxEvent(
      'CONVERSION_RECORDED',
      'CONVERSION',
      conversionId,
      {
        conversionId,
        organizationId: orgId,
        dealId: body.dealId,
        partnerId,
        netPayableMinor: netPayable.toString(),
        riskScore: riskEvaluation.riskScore,
        riskLevel: riskEvaluation.riskLevel,
        journalEntryId: journalEntry.id,
      }
    )

    return NextResponse.json(
      {
        success: true,
        message: 'Conversion successfully recorded, attributed, and posted to ledger',
        data: {
          conversionId,
          commission: {
            id: commission.id,
            status: commission.status,
            grossCommissionMinorUnits: commission.grossCommissionMinorUnits.toString(),
            taxWithheldMinorUnits: commission.taxWithheldMinorUnits.toString(),
            platformFeeMinorUnits: commission.platformFeeMinorUnits.toString(),
            netPayableMinorUnits: commission.netPayableMinorUnits.toString(),
          },
          attribution,
          risk: {
            score: riskEvaluation.riskScore,
            level: riskEvaluation.riskLevel,
            recommendedAction: riskEvaluation.recommendedAction,
            flags: riskEvaluation.flags,
          },
          ledger: {
            journalEntryId: journalEntry.id,
            entryNumber: journalEntry.entryNumber,
          },
          outboxEventId: outboxEvent.id,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 400
    const message = error instanceof Error ? error.message : 'Failed to ingest conversion'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
