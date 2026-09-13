import { NextResponse, type NextRequest } from 'next/server'
import { SnippePaymentAdapter } from '@/lib/providers/snippe'

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

    const verification = await snippe.verifyPayment(reference)

    return NextResponse.json({
      success: true,
      data: {
        reference: verification.providerReference,
        orderId: verification.orderId,
        status: verification.status, // 'SUCCESSFUL' | 'FAILED' | 'PENDING'
        amountMinorUnits: verification.amountMinorUnits.toString(),
        currency: verification.currency,
        paymentMethod: verification.paymentMethod,
        paidAt: verification.paidAt,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching payment status'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
