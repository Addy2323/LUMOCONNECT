import { NextRequest, NextResponse } from 'next/server'
import { getMesejiClient } from '@/lib/providers/meseji-client'
import { recordFundingAttempt, updateFundingAttemptStatus, getFundingHistory, addSmsAuditLog } from '@/modules/sms/store'
import { isValidTanzaniaPhone, normalizeTanzaniaPhone } from '@/modules/sms/phone'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (orderId) {
      const client = getMesejiClient()
      const statusResult = await client.getZenopayStatus(orderId)

      const isCompleted = statusResult.payment_status === 'COMPLETED' || statusResult.status === 'COMPLETED'
      updateFundingAttemptStatus(orderId, isCompleted ? 'COMPLETED' : 'PENDING')

      return NextResponse.json({ orderId, status: statusResult })
    }

    const history = getFundingHistory()
    return NextResponse.json({ history })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to query funding status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { method = 'USSD', amount, phone, provider = 'M-PESA', buyerName, buyerEmail } = body

    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount < 1000) {
      return NextResponse.json(
        { error: 'Minimum SMS credit purchase amount is TZS 1,000.' },
        { status: 400 }
      )
    }

    const client = getMesejiClient()

    if (method === 'USSD') {
      if (!phone || !isValidTanzaniaPhone(phone)) {
        return NextResponse.json(
          { error: 'Valid Tanzanian phone number is required for USSD push (e.g. 07XXXXXXXX or 2557XXXXXXXX).' },
          { status: 400 }
        )
      }

      const normalizedPhone = normalizeTanzaniaPhone(phone)
      const result = await client.buySmsCredits({
        amount: numericAmount,
        phone: normalizedPhone,
        provider,
      })

      const attempt = recordFundingAttempt({
        method: 'USSD_PUSH',
        amountTzs: numericAmount,
        reference: result.reference || `ussd_${Date.now()}`,
        status: result.success ? 'PENDING' : 'FAILED',
        provider,
        phone: normalizedPhone,
      })

      addSmsAuditLog(
        'SMS_CREDIT_PURCHASE_INITIATED',
        'admin_console',
        { method: 'USSD', amount: numericAmount, reference: attempt.reference },
        attempt.id
      )

      return NextResponse.json({ success: result.success, attempt, result })
    }

    if (method === 'ZENOPAY') {
      if (!phone || !isValidTanzaniaPhone(phone)) {
        return NextResponse.json(
          { error: 'Valid Tanzanian phone number is required.' },
          { status: 400 }
        )
      }
      const origin = request.headers.get('origin') || 'https://lumo.co.tz'
      const webhookUrl = `${origin}/api/webhooks/zenopay`

      const result = await client.createZenopayOrder({
        amount: numericAmount,
        buyerEmail: buyerEmail || 'admin@lumo.co.tz',
        buyerName: buyerName || 'LUMO Platform Admin',
        buyerPhone: normalizeTanzaniaPhone(phone),
        webhookUrl,
      })

      const attempt = recordFundingAttempt({
        method: 'ZENOPAY_GATEWAY',
        amountTzs: numericAmount,
        reference: result.order_id || `zeno_${Date.now()}`,
        status: 'PENDING',
        provider: 'ZENOPAY',
        phone: phone ? normalizeTanzaniaPhone(phone) : undefined,
      })

      addSmsAuditLog(
        'SMS_ZENOPAY_ORDER_CREATED',
        'admin_console',
        { orderId: result.order_id, paymentUrl: result.payment_url, amount: numericAmount },
        attempt.id
      )

      return NextResponse.json({
        success: true,
        orderId: result.order_id,
        paymentUrl: result.payment_url,
        attempt,
      })
    }

    return NextResponse.json({ error: `Unsupported funding method: ${method}` }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to initiate funding transaction' },
      { status: 500 }
    )
  }
}
