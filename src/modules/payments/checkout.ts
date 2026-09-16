import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import { Prisma, type PaymentAttempt } from '@prisma/client'
import { z } from 'zod'
import { db } from '@/lib/db'
import { SnippePaymentAdapter, normalizeTanzanianPhone } from '@/lib/providers/snippe'
import { PaymentError } from './http'

export const paymentInput = z.object({
  action: z.enum(['PAY_NOW', 'RETRY_PAYMENT']),
  requestId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  planCode: z.string().min(1).max(40).optional(),
  phoneNumber: z.string().min(1).max(30),
  paymentMethod: z.enum(['MPESA', 'AIRTEL_MONEY', 'TIGO_PESA', 'HALOPESA']),
  previousAttemptId: z.string().uuid().optional(),
}).refine(value => Boolean(value.orderId) !== Boolean(value.planCode), 'Select a saved order or a subscription plan.')

type Input = z.infer<typeof paymentInput>
type Customer = { id: string; name: string; email: string; roles: string[] }
const active = ['CREATED', 'INITIATED', 'PENDING', 'PROCESSING'] as const
const digest = (value: string) => createHash('sha256').update(value).digest('hex')

export async function lockPaymentKeys(tx: Prisma.TransactionClient, keys: string[]) {
  for (const key of [...new Set(keys)].sort()) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`
  }
}

export function paymentView(attempt: PaymentAttempt) {
  return { reference: attempt.id, providerReference: attempt.providerReference, status: attempt.status, amountTZS: Number(attempt.amountMinor) / 100, currency: attempt.currency, instructions: attempt.status === 'SUCCESSFUL' ? 'Payment confirmed.' : 'Check your phone for the payment prompt. An existing payment will be reused while its status is pending.' }
}

/** The only application service permitted to initiate a Snippe collection. */
export async function initiateCheckout(input: Input, customer: Customer, ip: string) {
  const phone = normalizeTanzanianPhone(input.phoneNumber)
  if (!/^255[67]\d{8}$/.test(phone)) throw new PaymentError('Enter a valid Tanzanian mobile number.', 400, 'INVALID_PHONE')
  if (!customer.name?.trim() || !z.string().email().safeParse(customer.email).success) throw new PaymentError('Complete your customer name and email before paying.')
  if (!process.env.SNIPPE_API_KEY || !process.env.SNIPPE_WEBHOOK_SECRET || !process.env.SNIPPE_WEBHOOK_URL?.startsWith('https://')) throw new PaymentError('Payment gateway configuration is incomplete.', 503)
  const checkoutKey = input.orderId ? `order:${input.orderId}` : `subscription:${customer.id}:${input.planCode}`
  const idempotencyKey = digest(`${customer.id}:${input.requestId}`).slice(0, 30)
  const phoneHash = digest(phone)
  const ipHash = digest(ip)
  const sourceRoute = input.action === 'RETRY_PAYMENT' ? 'PAYMENT_RETRY' : 'CHECKOUT'

  const reserved = await db.$transaction(async tx => {
    await lockPaymentKeys(tx, [`checkout:${checkoutKey}`, `payer:${customer.id}`, `phone:${phoneHash}`, `ip:${ipHash}`])
    let amountMinor: bigint
    let currency: string
    let planId: string | null = null
    let planDays: number | null = null
    if (input.planCode) {
      if (!customer.roles.includes('PARTNER') || customer.roles.some(role => /ADMIN|BUSINESS|MERCHANT/.test(role))) throw new PaymentError('Subscriptions are available only to partner accounts.', 403)
      const plan = await tx.subscriptionPlan.findUnique({ where: { code: input.planCode } })
      if (!plan || !plan.isActive || plan.enterprise) throw new PaymentError('This subscription plan is not available.')
      amountMinor = plan.priceMinor
      currency = plan.currency
      planId = plan.id
      planDays = ({ MONTHLY: 30, SEMI_ANNUALLY: 180, ANNUALLY: 365 } as Record<string, number>)[plan.billingPeriod]
      if (!planDays) throw new PaymentError('This plan has no supported billing period.')
    } else {
      const order = await tx.order.findUnique({ where: { id: input.orderId } })
      if (!order || order.customerUserId !== customer.id) throw new PaymentError('Order not found or not authorized.', 403)
      if (order.status === 'CANCELLED' || order.status === 'REFUNDED' || !['UNPAID', 'PENDING', 'FAILED'].includes(order.paymentStatus)) throw new PaymentError('This order is not payable.', 409)
      amountMinor = order.totalAmountMinor
      currency = order.currency
    }
    if (currency !== 'TZS' || amountMinor < 50000n || amountMinor % 100n !== 0n || amountMinor > BigInt(Number.MAX_SAFE_INTEGER)) throw new PaymentError('The saved total is not a supported mobile money amount.')
    const sameRequest = await tx.paymentAttempt.findUnique({ where: { idempotencyKey } })
    if (sameRequest) {
      if (sameRequest.checkoutKey !== checkoutKey) throw new PaymentError('Request identifier is already used for a different checkout.', 409)
      return { attempt: sameRequest, created: false }
    }
    const latest = await tx.paymentAttempt.findFirst({ where: { checkoutKey, provider: 'SNIPPE' }, orderBy: { createdAt: 'desc' } })
    if (latest && (active.some(status => status === latest.status) || latest.status === 'SUCCESSFUL')) return { attempt: latest, created: false }
    if (latest && (!['FAILED', 'EXPIRED'].includes(latest.status) || input.action !== 'RETRY_PAYMENT' || input.previousAttemptId !== latest.id)) throw new PaymentError('Check the previous payment, then explicitly choose Retry Payment.', 409, 'RETRY_REQUIRED')
    if (!latest && input.action === 'RETRY_PAYMENT') throw new PaymentError('There is no previous payment to retry.', 409)
    const recent = { provider: 'SNIPPE', createdAt: { gte: new Date(Date.now() - 600000) } }
    const counts = await Promise.all([
      tx.paymentAttempt.count({ where: { ...recent, checkoutKey } }),
      tx.paymentAttempt.count({ where: { ...recent, userId: customer.id } }),
      tx.paymentAttempt.count({ where: { ...recent, phoneHash } }),
      tx.paymentAttempt.count({ where: { ...recent, ipHash } }),
    ])
    if (counts.some((count, i) => count >= [3, 5, 5, 20][i])) throw new PaymentError('Too many payment attempts. Please wait ten minutes.', 429, 'RATE_LIMITED')
    const attempt = await tx.paymentAttempt.create({ data: { id: randomUUID(), userId: customer.id, purpose: planId ? 'SUBSCRIPTION' : 'ORDER_PAYMENT', amountMinor, currency, provider: 'SNIPPE', status: 'CREATED', paymentMethod: input.paymentMethod, idempotencyKey, checkoutKey, phoneHash, ipHash, planId, planDays, sourceRoute } })
    if (input.orderId) await tx.order.update({ where: { id: input.orderId }, data: { paymentAttemptId: attempt.id, paymentStatus: 'PENDING' } })
    await tx.auditLog.create({ data: { actorUserId: customer.id, action: 'SNIPPE_PAYMENT_CREATE_ATTEMPT', entityType: 'PAYMENT', entityId: attempt.id, afterData: { requestId: input.requestId, paymentAttemptId: attempt.id, orderId: input.orderId ?? null, userId: customer.id, amountMinor: amountMinor.toString(), currency, sourceRoute, timestamp: new Date().toISOString() } } })
    return { attempt, created: true }
  }, { isolationLevel: 'ReadCommitted', timeout: 15000 })

  if (!reserved.created) return reserved.attempt
  // The reservation is durable before HTTP. Other workers return it without calling Snippe.
  const attempt = reserved.attempt
  let result
  try {
    result = await new SnippePaymentAdapter().initiatePayment({ orderId: input.orderId ?? attempt.id, idempotencyKey: attempt.idempotencyKey, amountMinorUnits: attempt.amountMinor, currency: attempt.currency, customerPhone: phone, customerName: customer.name, customerEmail: customer.email, paymentMethod: input.paymentMethod, callbackUrl: process.env.SNIPPE_WEBHOOK_URL!, metadata: { paymentAttemptId: attempt.id } })
  } catch {
    result = { success: false, providerReference: '', status: 'PENDING' as const }
  }
  const providerReference = result.providerReference || null
  const nextStatus = !result.success && result.status === 'FAILED' ? 'FAILED' : 'PENDING'
  return db.$transaction(async tx => {
    await lockPaymentKeys(tx, [`payment:${attempt.id}`])
    const current = await tx.paymentAttempt.findUniqueOrThrow({ where: { id: attempt.id } })
    const updated = await tx.paymentAttempt.update({ where: { id: attempt.id }, data: {
      ...(providerReference && !current.providerReference ? { providerReference } : {}),
      ...(current.status === 'CREATED' ? { status: nextStatus, errorMessage: !result.success ? 'Gateway request failed or its outcome is uncertain. Check status before retrying.' : null } : {}),
    } })
    await tx.auditLog.create({ data: { actorUserId: customer.id, action: 'SNIPPE_PAYMENT_CREATE_RESULT', entityType: 'PAYMENT', entityId: attempt.id, afterData: { requestId: input.requestId, paymentAttemptId: attempt.id, providerReference, status: updated.status, sourceRoute } } })
    return updated
  })
}
