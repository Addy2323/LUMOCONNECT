import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { failure, json } from '@/modules/hot-deals/auth'
import { confirmPayout } from '@/modules/hot-deals/rewards'
export async function POST(request: NextRequest) {
  const secret = process.env.HOT_DEALS_PAYMENT_WEBHOOK_SECRET
  if (!secret || secret.length < 32) return json({ error: 'Payment confirmation is not configured.' }, 503)
  const timestamp = request.headers.get('x-lumo-timestamp') ?? ''
  if (!/^\d{10}$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp) * 1000) > 300000) return json({ error: 'Invalid timestamp.' }, 401)
  const body = await request.text()
  if (body.length > 10000) return json({ error: 'Request too large.' }, 413)
  const signature = request.headers.get('x-lumo-signature') ?? ''
  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  if (!/^[a-f0-9]{64}$/.test(signature) || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return json({ error: 'Invalid signature.' }, 401)
  try { return json(await confirmPayout(z.object({ payoutId: z.string().uuid(), providerReference: z.string().min(4).max(200), amountMinor: z.string().regex(/^[1-9]\d{0,14}$/), status: z.enum(['PAID', 'FAILED']) }).parse(JSON.parse(body)))) }
  catch (error) { return failure(error) }
}
