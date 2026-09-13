import { NextResponse, type NextRequest } from 'next/server'
import { SnippePaymentAdapter } from '@/lib/providers/snippe'
import { postJournalEntry, CHART_OF_ACCOUNTS } from '@/lib/ledger'
import { emitOutboxEvent } from '@/lib/outbox'

// Processed webhook idempotency cache
const processedSnippeEventIds = new Set<string>()

const snippeAdapter = new SnippePaymentAdapter()

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-webhook-signature') || request.headers.get('X-Webhook-Signature') || ''
    const timestampHeader =
      request.headers.get('x-webhook-timestamp') || request.headers.get('X-Webhook-Timestamp') || ''
    const eventHeader = request.headers.get('x-webhook-event') || request.headers.get('X-Webhook-Event') || ''

    // 1. Replay attack protection (within 5 minutes = 300 seconds)
    if (timestampHeader) {
      const webhookTime = parseInt(timestampHeader, 10)
      const nowSeconds = Math.floor(Date.now() / 1000)
      if (Math.abs(nowSeconds - webhookTime) > 300) {
        return NextResponse.json(
          { success: false, error: 'WEBHOOK_TIMESTAMP_OUT_OF_TOLERANCE' },
          { status: 400 }
        )
      }
    }

    // 2. Signature verification (if secret configured and in production or signature provided)
    const webhookSecret = process.env.SNIPPE_WEBHOOK_SECRET
    if (signature && webhookSecret) {
      const isValid = snippeAdapter.verifyWebhookSignature(signature, rawBody, timestampHeader)
      if (!isValid && process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'INVALID_WEBHOOK_SIGNATURE' },
          { status: 401 }
        )
      }
    }

    const payload = JSON.parse(rawBody) as {
      id?: string
      type?: string
      api_version?: string
      created_at?: string
      data?: {
        reference?: string
        external_reference?: string
        status?: string
        failure_reason?: string
        amount?: {
          value?: number
          currency?: string
        }
        settlement?: {
          gross?: { value?: number }
          fees?: { value?: number }
          net?: { value?: number }
        }
        channel?: {
          type?: string
          provider?: string
        }
        customer?: {
          phone?: string
          name?: string
          email?: string
        }
        metadata?: Record<string, unknown>
        completed_at?: string
      }
    }

    const eventId = payload.id || `evt_${payload.data?.reference || Date.now()}`
    const eventType = payload.type || eventHeader || 'payment.completed'
    const paymentData = payload.data || {}
    const reference = paymentData.reference || `ref_${Date.now()}`

    // 3. Idempotency Check
    if (processedSnippeEventIds.has(eventId)) {
      return NextResponse.json({
        success: true,
        message: 'Snippe webhook event already processed (Idempotent OK)',
        eventId,
      })
    }

    processedSnippeEventIds.add(eventId)

    // 4. Handle Successful Payment
    if (eventType === 'payment.completed' || paymentData.status === 'completed') {
      const grossTZS = paymentData.amount?.value || paymentData.settlement?.gross?.value || 0
      const amountMinor = BigInt(Math.round(grossTZS * 100))
      const currency = paymentData.amount?.currency || 'TZS'
      const provider = paymentData.channel?.provider?.toUpperCase() || 'MOBILE_MONEY'
      const orderId = (paymentData.metadata?.order_id as string) || ''

      // Double-entry ledger entry:
      // Debit: Cash Mobile Money Asset | Credit: Escrow / Collection Revenue
      const journalEntry = postJournalEntry({
        sourceType: 'PAYMENT',
        sourceId: reference,
        currency,
        narration: `Mobile money collection confirmed via Snippe (${provider}): Ref ${reference}${orderId ? ` for Order ${orderId}` : ''}`,
        lines: [
          {
            ledgerAccountId: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
            accountCode: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
            debitMinor: amountMinor,
            creditMinor: 0n,
            memo: `Snippe collection via ${provider}`,
          },
          {
            ledgerAccountId: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
            accountCode: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
            debitMinor: 0n,
            creditMinor: amountMinor,
            memo: `Secured mobile money funds for ${orderId || reference}`,
          },
        ],
      })

      // Dispatch Outbox Notification Event
      emitOutboxEvent(
        'NOTIFICATION_DISPATCH',
        'PAYMENT_CONFIRMATION',
        reference,
        {
          eventId,
          reference,
          orderId,
          amountTZS: grossTZS,
          currency,
          provider,
          journalEntryId: journalEntry.id,
          customerPhone: paymentData.customer?.phone,
        }
      )
    }

    // 5. Handle Failed Payment
    if (eventType === 'payment.failed' || paymentData.status === 'failed') {
      emitOutboxEvent(
        'NOTIFICATION_DISPATCH',
        'PAYMENT_FAILED',
        reference,
        {
          eventId,
          reference,
          orderId: paymentData.metadata?.order_id,
          failureReason: paymentData.failure_reason || 'Payment rejected by user or expired',
          customerPhone: paymentData.customer?.phone,
        }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Snippe webhook processed successfully',
      eventId,
      reference,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Snippe webhook processing error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
