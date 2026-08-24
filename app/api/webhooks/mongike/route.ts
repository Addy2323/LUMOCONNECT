import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'node:crypto'
import { postJournalEntry, CHART_OF_ACCOUNTS } from '@/lib/ledger'
import { emitOutboxEvent } from '@/lib/outbox'

// Processed webhook idempotency set
const processedWebhookIds = new Set<string>()

/**
 * Validates HMAC SHA-256 webhook signature.
 */
export function verifyMongikeSignature({
  payload,
  signature,
  secret,
}: {
  payload: string
  signature: string
  secret: string
}): boolean {
  if (!signature || !secret) return false
  const hmac = crypto.createHmac('sha256', secret)
  const computedSignature = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(computedSignature, 'hex')
  )
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('X-Mongike-Signature') || ''
    const timestampHeader = request.headers.get('X-Mongike-Timestamp') || ''
    const webhookSecret = process.env.MONGIKE_WEBHOOK_SECRET || 'test_webhook_secret_key_12345'

    // 1. Replay attack protection (within 5 minutes)
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

    // 2. Signature verification
    if (process.env.NODE_ENV === 'production' || signature) {
      const isValid = verifyMongikeSignature({
        payload: rawBody,
        signature,
        secret: webhookSecret,
      })

      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'INVALID_WEBHOOK_SIGNATURE' },
          { status: 401 }
        )
      }
    }

    const payload = JSON.parse(rawBody) as {
      eventId: string
      eventType: string
      reference: string
      amountMinor: string | number
      currency: string
      status: 'CONFIRMED' | 'FAILED'
      organizationId?: string
      customerPhone?: string
    }

    // 3. Idempotency Check
    if (processedWebhookIds.has(payload.eventId)) {
      return NextResponse.json({
        success: true,
        message: 'Webhook already processed (Idempotent OK)',
        eventId: payload.eventId,
      })
    }

    // Mark as processed
    processedWebhookIds.add(payload.eventId)

    // 4. Handle Funding / Payment confirmation
    if (payload.eventType === 'FUNDING_DEPOSIT.CONFIRMED' && payload.status === 'CONFIRMED') {
      const amountMinor = BigInt(payload.amountMinor)

      // Post Double-entry ledger entry:
      // Debit: Cash Mobile Money Asset | Credit: Business Prefunded Escrow Deposit
      const journalEntry = postJournalEntry({
        sourceType: 'PAYMENT',
        sourceId: payload.reference,
        currency: payload.currency || 'TZS',
        narration: `Business prefunding deposit confirmed via Mongike: ${payload.reference}`,
        lines: [
          {
            ledgerAccountId: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
            accountCode: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
            debitMinor: amountMinor,
            creditMinor: 0n,
            memo: 'Mongike collection into escrow pool',
          },
          {
            ledgerAccountId: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
            accountCode: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
            debitMinor: 0n,
            creditMinor: amountMinor,
            memo: 'Business pre-funded reward escrow liability',
          },
        ],
      })

      // 5. Emit Outbox Event
      emitOutboxEvent(
        'NOTIFICATION_DISPATCH',
        'FUNDING_TRANSACTION',
        payload.reference,
        {
          eventId: payload.eventId,
          reference: payload.reference,
          amountMinor: amountMinor.toString(),
          journalEntryId: journalEntry.id,
        }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook received and processed',
      eventId: payload.eventId,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook processing error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
