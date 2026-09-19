import { NextResponse, type NextRequest } from 'next/server'
import { SnippePaymentAdapter } from '@/lib/providers/snippe'
import { db } from '@/lib/db'
import { reconcilePayment } from '@/modules/payments/reconcile'

const snippe = new SnippePaymentAdapter()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await context.params

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    // 1. Check local database record first
    const local = await db.paymentAttempt.findFirst({
      where: {
        OR: [
          { id: reference },
          { providerReference: reference },
        ],
      },
    })

    if (local) {
      // If already resolved to a terminal state, return directly from database
      if (['SUCCESSFUL', 'FAILED', 'EXPIRED'].includes(local.status)) {
        return NextResponse.json({
          success: true,
          data: {
            reference: local.providerReference || local.id,
            orderId: local.checkoutKey || '',
            status: local.status,
            amountMinorUnits: local.amountMinor.toString(),
            currency: local.currency,
            paymentMethod: local.paymentMethod || 'MOBILE_MONEY',
            paidAt: local.status === 'SUCCESSFUL' ? local.updatedAt : undefined,
          },
        }, { headers: { 'Cache-Control': 'private, no-cache' } })
      }

      // If active/pending, check provider status using providerReference
      const providerRef = local.providerReference || reference
      const verification = await snippe.verifyPayment(providerRef)

      // Reconcile status update if terminal
      if (verification.status === 'SUCCESSFUL' || verification.status === 'FAILED') {
        await reconcilePayment({
          externalId: `status_check_${local.id}_${Date.now()}`,
          eventType: verification.status === 'SUCCESSFUL' ? 'payment.completed' : 'payment.failed',
          reference: providerRef,
          attemptId: local.id,
          status: verification.status,
          amountMinor: verification.amountMinorUnits,
          currency: verification.currency,
        }).catch((err) => {
          console.warn('[Status Check] Could not reconcile payment:', err)
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          reference: verification.providerReference || local.providerReference || local.id,
          orderId: verification.orderId || local.checkoutKey || '',
          status: verification.status,
          amountMinorUnits: verification.amountMinorUnits ? verification.amountMinorUnits.toString() : local.amountMinor.toString(),
          currency: verification.currency || local.currency,
          paymentMethod: verification.paymentMethod || local.paymentMethod,
          paidAt: verification.paidAt,
        },
      }, { headers: { 'Cache-Control': 'private, no-cache' } })
    }

    // 2. If no local record matches, only query provider if reference looks valid
    const verification = await snippe.verifyPayment(reference)

    return NextResponse.json({
      success: true,
      data: {
        reference: verification.providerReference,
        orderId: verification.orderId,
        status: verification.status,
        amountMinorUnits: verification.amountMinorUnits.toString(),
        currency: verification.currency,
        paymentMethod: verification.paymentMethod,
        paidAt: verification.paidAt,
      },
    }, { headers: { 'Cache-Control': 'private, no-cache' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching payment status'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
