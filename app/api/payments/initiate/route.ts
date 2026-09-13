import { NextResponse, type NextRequest } from 'next/server'
import { SnippePaymentAdapter, normalizeTanzanianPhone } from '@/lib/providers/snippe'

const snippe = new SnippePaymentAdapter()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      amountTZS,
      phoneNumber,
      customerName,
      customerEmail,
      orderId = `ORD-${Date.now()}`,
      paymentMethod = 'MPESA',
      metadata = {},
    } = body

    if (!amountTZS || Number(amountTZS) < 500) {
      return NextResponse.json(
        {
          success: false,
          error: 'Minimum payment amount is 500 TZS',
          code: 'INVALID_AMOUNT',
        },
        { status: 400 }
      )
    }

    if (!phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phone number is required for mobile money USSD push',
          code: 'PHONE_REQUIRED',
        },
        { status: 400 }
      )
    }

    const formattedPhone = normalizeTanzanianPhone(phoneNumber)
    if (formattedPhone.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Tanzanian mobile phone number format',
          code: 'INVALID_PHONE',
        },
        { status: 400 }
      )
    }

    const result = await snippe.initiatePayment({
      orderId,
      idempotencyKey: `idemp_${orderId}_${Date.now()}`.slice(0, 30),
      amountMinorUnits: BigInt(Math.round(Number(amountTZS) * 100)),
      currency: 'TZS',
      customerPhone: formattedPhone,
      customerEmail: customerEmail || `cust_${formattedPhone}@lumo.co.tz`,
      customerName: customerName || 'Customer',
      paymentMethod:
        paymentMethod === 'AIRTEL_MONEY' || paymentMethod === 'AIRTEL'
          ? 'AIRTEL_MONEY'
          : paymentMethod === 'TIGO_PESA' || paymentMethod === 'TIGO'
          ? 'TIGO_PESA'
          : paymentMethod === 'HALOPESA'
          ? 'HALOPESA'
          : 'MPESA',
      callbackUrl:
        process.env.SNIPPE_WEBHOOK_URL ||
        (request.nextUrl.origin && request.nextUrl.origin.startsWith('https://')
          ? `${request.nextUrl.origin}/api/webhooks/snippe`
          : 'https://lumo.co.tz/api/webhooks/snippe'),
      metadata,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.instructions || 'Failed to initiate Snippe payment',
          raw: result.rawResponse,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        reference: result.providerReference,
        status: result.status,
        instructions: result.instructions,
        phoneNumber: formattedPhone,
        amountTZS: Number(amountTZS),
        currency: 'TZS',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error processing payment initiation'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
