import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SnippePaymentAdapter } from '@/lib/providers/snippe'
import { reconcilePayment } from '@/modules/payments/reconcile'
import { PaymentError, paymentErrorResponse } from '@/modules/payments/http'

const payloadSchema = z.object({ id: z.string().max(200).optional(), type: z.string(), data: z.object({ reference: z.string().min(1).max(200), status: z.string().optional(), amount: z.object({ value: z.number().finite().nonnegative(), currency: z.string() }).optional(), metadata: z.object({ paymentAttemptId: z.string().uuid().optional() }).optional() }) })
export async function POST(request: NextRequest) {
  try {
    if (!process.env.SNIPPE_WEBHOOK_SECRET) throw new PaymentError('Webhook signing is not configured.', 503)
    const raw = await request.text()
    if (raw.length > 100000) throw new PaymentError('Payload too large.', 413)
    if (!new SnippePaymentAdapter().verifyWebhookSignature(request.headers.get('x-webhook-signature') || '', raw, request.headers.get('x-webhook-timestamp') || '')) throw new PaymentError('Invalid webhook signature.', 401)
    const parsed = payloadSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) throw new PaymentError('Invalid payment event.')
    const event = parsed.data
    const status = ({ 'payment.completed': 'SUCCESSFUL', 'payment.failed': 'FAILED', 'payment.cancelled': 'FAILED', 'payment.expired': 'EXPIRED' } as const)[event.type as 'payment.completed']
    if (!status) return NextResponse.json({ success: true, ignored: true })
    const result = await reconcilePayment({ externalId: event.id || createHash('sha256').update(raw).digest('hex'), eventType: event.type, reference: event.data.reference, attemptId: event.data.metadata?.paymentAttemptId, status, amountMinor: event.data.amount ? BigInt(Math.round(event.data.amount.value * 100)) : undefined, currency: event.data.amount?.currency })
    return NextResponse.json({ success: true, ...result })
  } catch (error) { return paymentErrorResponse(error) }
}
