import { db } from '@/lib/db'
import { enqueue, entitlements, lockDeal, refreshRelease, transaction } from './service'
import { hasCapacity, subscriptionActive } from './policy'

// Run from a persistent scheduler every minute. Authorization also applies the release at the exact boundary.
export async function processHotDeals(now = new Date()) {
  let checked = 0
  let cursor: string | undefined
  while (true) {
  const due = await db.hotDeal.findMany({ where: { ...(cursor ? { id: { gt: cursor } } : {}), OR: [
    { status: 'SCHEDULED_PRIVATE_RELEASE', privateAccessStartAt: { lte: now } },
    { status: 'PRIVATE_HOT_DEAL', partnerReleaseAt: { lte: new Date(now.getTime() + 3600000) } },
  ] }, select: { id: true }, orderBy: { id: 'asc' }, take: 200 })
  for (const { id } of due) await transaction(async tx => {
    const deal = await refreshRelease(tx, await lockDeal(tx, id), now)
    if (deal.status === 'PRIVATE_HOT_DEAL' && deal.partnerReleaseAt && deal.partnerReleaseAt > now && hasCapacity(deal))
      await enqueue(tx, deal, 'REMINDER', 'PRIVATE_MEMBER')
  })
  checked += due.length
  if (due.length < 200) break
  cursor = due[due.length - 1].id
  }
  const events = await db.hotDealEvent.findMany({ where: { processedAt: null }, select: { id: true }, orderBy: { createdAt: 'asc' }, take: 100 })
  for (const { id } of events) await transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM hot_deal_events WHERE id = ${id}::uuid FOR UPDATE`
    const event = await tx.hotDealEvent.findUniqueOrThrow({ where: { id }, include: { deal: true } })
    if (event.processedAt) return
    // Expired alerts are discarded, so an outage cannot send a private alert after release.
    const stale = event.audience === 'PRIVATE_MEMBER' && (!event.deal.partnerReleaseAt || event.deal.partnerReleaseAt <= now || event.deal.status !== 'PRIVATE_HOT_DEAL')
    if (!stale) {
      const users = await tx.user.findMany({ where: { accountStatus: 'ACTIVE', deletedAt: null, ...(event.cursorUserId ? { id: { gt: event.cursorUserId } } : {}),
        ...(event.audience === 'PARTICIPANTS' ? { participations: { some: { opportunityId: event.deal.opportunityId } } } : { subscriptions: { some: { status: 'ACTIVE', expiresAt: { gt: now } } } }),
      }, include: { hotDealPreferences: true, subscriptions: { include: { plan: { include: { entitlements: true } } } } }, orderBy: { id: 'asc' }, take: 200 })
      for (const user of users) {
        const codes = user.subscriptions.filter(s => s.plan.isActive && subscriptionActive(s, now)).flatMap(s => s.plan.entitlements.map(e => e.code))
        if (event.audience !== 'PARTICIPANTS' && !codes.includes('PRIVATE_MEMBER') && !codes.includes(event.audience)) continue
        if (user.hotDealPreferences?.inApp !== false) await tx.notification.create({ data: { userId: user.id, title: event.title, body: event.body, linkUrl: `/hot-deals/${event.dealId}` } })
        // Durable per-recipient outbox entries. The delivery bridge must honor the idempotency key.
        for (const channel of ['sms', 'email'] as const) if (user.hotDealPreferences?.[channel]) {
          await tx.outboxEvent.create({ data: { eventType: 'HOT_DEAL_NOTIFICATION', aggregateType: 'HotDeal', aggregateId: event.dealId,
            payload: { idempotencyKey: `${event.id}:${user.id}:${channel}`, userId: user.id, channel, title: event.title, body: event.body, privateUntil: event.audience === 'PRIVATE_MEMBER' ? event.deal.partnerReleaseAt?.toISOString() : null },
          } })
        }
      }
      if (users.length === 200) {
        await tx.hotDealEvent.update({ where: { id }, data: { cursorUserId: users[users.length - 1].id } })
        return
      }
    }
    await tx.hotDealEvent.update({ where: { id }, data: { processedAt: now } })
  })
  return { checked, events: events.length }
}

// Configurable gateway avoids treating the existing simulated SMS/email adapters as successful delivery.
export async function deliverHotDealNotifications() {
  const endpoint = process.env.HOT_DEALS_NOTIFICATION_GATEWAY
  const token = process.env.HOT_DEALS_GATEWAY_TOKEN
  if (!endpoint || !token) return { delivered: 0, configured: false }
  if (!endpoint.startsWith('https://')) throw new Error('Notification gateway must use HTTPS')
  const events = await db.outboxEvent.findMany({ where: { eventType: 'HOT_DEAL_NOTIFICATION', processedAt: null }, orderBy: { createdAt: 'asc' }, take: 50 })
  let delivered = 0
  for (const event of events) {
    const payload = event.payload as { idempotencyKey: string; userId: string; channel: 'sms' | 'email'; title: string; body: string; privateUntil: string | null }
    try {
      const user = await db.user.findUnique({ where: { id: payload.userId }, include: { hotDealPreferences: true } })
      const codes = user ? await entitlements(db, user.id) : []
      const eligible = user?.hotDealPreferences?.[payload.channel] && (payload.privateUntil
        ? new Date(payload.privateUntil) > new Date() && codes.includes('PRIVATE_MEMBER')
        : codes.some(c => ['PRIVATE_MEMBER', 'PARTNER_SUBSCRIBER'].includes(c)))
      if (eligible) {
        const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': payload.idempotencyKey }, body: JSON.stringify({ ...payload, recipient: payload.channel === 'sms' ? user.phone : user.email }), signal: AbortSignal.timeout(10000) })
        if (!response.ok) throw new Error('Delivery failed')
        delivered++
      }
      await db.outboxEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } })
    } catch {
      await db.outboxEvent.update({ where: { id: event.id }, data: { retryCount: { increment: 1 }, failedAt: new Date() } })
    }
  }
  return { delivered, configured: true }
}
