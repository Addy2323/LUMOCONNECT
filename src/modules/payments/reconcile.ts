import 'server-only'
import { db } from '@/lib/db'
import { lockPaymentKeys } from './checkout'
import { PaymentError } from './http'

export type PaymentEvent = {
  externalId: string; eventType: string; reference: string; attemptId?: string
  status: 'SUCCESSFUL' | 'FAILED' | 'EXPIRED'
  amountMinor?: bigint; currency?: string
}

/** Reconciliation can only update an existing attempt; it never initiates a collection. */
export async function reconcilePayment(event: PaymentEvent) {
  return db.$transaction(async tx => {
    const found = await tx.paymentAttempt.findFirst({ where: { provider: 'SNIPPE', OR: [{ providerReference: event.reference }, ...(event.attemptId ? [{ id: event.attemptId, providerReference: null }] : [])] } })
    if (!found) return { ignored: true }
    await lockPaymentKeys(tx, [`payment:${found.id}`, `subscription:${found.userId}`, `event:${event.externalId}`])
    const duplicate = await tx.paymentWebhookEvent.findUnique({ where: { provider_externalId: { provider: 'SNIPPE', externalId: event.externalId } } })
    if (duplicate) return { duplicate: true }
    const attempt = await tx.paymentAttempt.findUniqueOrThrow({ where: { id: found.id } })
    if (attempt.providerReference && attempt.providerReference !== event.reference) throw new PaymentError('Provider reference mismatch.', 409)
    if (event.status === 'SUCCESSFUL' && (event.amountMinor !== attempt.amountMinor || event.currency !== attempt.currency)) throw new PaymentError('Provider amount or currency does not match this payment.', 409)
    await tx.paymentWebhookEvent.create({ data: { provider: 'SNIPPE', externalId: event.externalId, eventType: event.eventType, paymentAttemptId: attempt.id } })
    if (!['CREATED', 'INITIATED', 'PENDING', 'PROCESSING'].includes(attempt.status)) return { ignored: true }
    await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { status: event.status, providerReference: event.reference, errorMessage: null } })
    if (event.status === 'SUCCESSFUL') {
      if (attempt.planId) {
        if (!attempt.planDays) throw new PaymentError('Payment plan duration is missing.', 409)
        const existing = await tx.userSubscription.findFirst({ where: { userId: attempt.userId, status: 'ACTIVE' }, orderBy: { expiresAt: 'desc' } })
        const now = new Date()
        const base = existing?.expiresAt && existing.expiresAt > now ? existing.expiresAt : now
        await tx.userSubscription.updateMany({ where: { userId: attempt.userId, status: 'ACTIVE' }, data: { status: 'EXPIRED' } })
        const subscription = await tx.userSubscription.create({ data: { userId: attempt.userId, planId: attempt.planId, status: 'ACTIVE', startsAt: now, expiresAt: new Date(base.getTime() + attempt.planDays * 86400000), autoRenew: false } })
        await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { fulfilledSubscriptionId: subscription.id } })
      }
      await tx.order.updateMany({ where: { paymentAttemptId: attempt.id, paymentStatus: { not: 'PAID' } }, data: { paymentStatus: 'PAID', status: 'CONFIRMED', confirmedAt: new Date() } })
      const codes = [
        { accountCode: '1010_CASH_MOMONEY', name: 'Cash — mobile money' },
        attempt.planId ? { accountCode: '4010_REV_SUBSCRIPTIONS', name: 'Subscription revenue' } : { accountCode: '2040_ESCROW_CUSTOMER_PURCHASE', name: 'Customer purchase collections' },
      ]
      const accounts = []
      for (const definition of codes) accounts.push(await tx.ledgerAccount.upsert({ where: { accountCode: definition.accountCode }, create: { ...definition, currency: attempt.currency }, update: {} }))
      await tx.journalEntry.create({ data: { sourceType: 'PAYMENT', sourceId: attempt.id, narration: `Confirmed Snippe collection ${event.reference}`, lines: { create: [
        { ledgerAccountId: accounts[0].id, debitMinor: attempt.amountMinor, creditMinor: 0n, currency: attempt.currency },
        { ledgerAccountId: accounts[1].id, debitMinor: 0n, creditMinor: attempt.amountMinor, currency: attempt.currency },
      ] } } })
    } else {
      await tx.order.updateMany({ where: { paymentAttemptId: attempt.id, paymentStatus: 'PENDING' }, data: { paymentStatus: 'FAILED' } })
    }
    await tx.notification.create({ data: { userId: attempt.userId, channel: 'IN_APP', templateCode: `PAYMENT_${event.status}`, title: event.status === 'SUCCESSFUL' ? 'Payment confirmed' : 'Payment not completed', body: `${attempt.currency} ${Number(attempt.amountMinor) / 100} — reference ${event.reference}`, linkUrl: attempt.planId ? '/subscriptions' : '/customer' } })
    await tx.auditLog.create({ data: { actorUserId: attempt.userId, action: `SNIPPE_PAYMENT_${event.status}`, entityType: 'PAYMENT', entityId: attempt.id, beforeData: { status: attempt.status }, afterData: { status: event.status, providerReference: event.reference, eventId: event.externalId } } })
    return { processed: true }
  }, { isolationLevel: 'ReadCommitted', timeout: 15000 })
}
