import { NextResponse, type NextRequest } from 'next/server'
import { performDailyReconciliation } from '@/lib/ledger'
import { requirePermission } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  try {
    // Requires 'audit.read' permission (Admin)
    await requirePermission(request, 'audit.read')
    const recResult = performDailyReconciliation()

    return NextResponse.json({
      success: true,
      data: {
        runId: recResult.runId,
        reconciliationDate: recResult.reconciliationDate,
        isBalanced: recResult.isBalanced,
        providerSettlementMatch: recResult.providerSettlementMatch,
        discrepancyMinor: recResult.discrepancyMinor.toString(),
        totalLedgerDebitsMinor: recResult.totalLedgerDebitsMinor.toString(),
        totalLedgerCreditsMinor: recResult.totalLedgerCreditsMinor.toString(),
        accountsSummary: {
          merchantRewardReserve: recResult.accountsSummary.merchantRewardReserve.toString(),
          customerPurchaseFunds: recResult.accountsSummary.customerPurchaseFunds.toString(),
          payableToMerchant: recResult.accountsSummary.payableToMerchant.toString(),
          payableToPartner: recResult.accountsSummary.payableToPartner.toString(),
          refundReserve: recResult.accountsSummary.refundReserve.toString(),
          lumoFees: recResult.accountsSummary.lumoFees.toString(),
          providerFees: recResult.accountsSummary.providerFees.toString(),
          taxes: recResult.accountsSummary.taxes.toString(),
          disputedFunds: recResult.accountsSummary.disputedFunds.toString(),
        },
      },
    })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 400
    const message = error instanceof Error ? error.message : 'Reconciliation query failed'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(request, 'audit.read')
    const recResult = performDailyReconciliation()

    return NextResponse.json({
      success: true,
      message: `Daily reconciliation run completed for ${recResult.reconciliationDate}. Invariants balanced: ${recResult.isBalanced}`,
      data: {
        runId: recResult.runId,
        isBalanced: recResult.isBalanced,
        reconciliationDate: recResult.reconciliationDate,
      },
    })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 400
    const message = error instanceof Error ? error.message : 'Reconciliation execution failed'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
