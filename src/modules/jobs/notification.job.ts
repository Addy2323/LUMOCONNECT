import { db } from '@/lib/db'
import { subscriptionActive } from '../hot-deals/policy'
import { getUserEntitlements } from '../subscriptions/entitlement.service'

export interface NotificationJobResult {
  eventsProcessed: number
  inAppCreated: number
  outboxEnqueued: number
  gatewayDelivered: number
  errors: string[]
}

/**
 * Scheduled job to process notifications for deals, releases, and milestones.
 * Guarantees idempotency via unique outbox keys and honors user notification channel preferences.
 */
export async function runNotificationJob(now = new Date()): Promise<NotificationJobResult> {
  const result: NotificationJobResult = {
    eventsProcessed: 0,
    inAppCreated: 0,
    outboxEnqueued: 0,
    gatewayDelivered: 0,
    errors: [],
  }

  // 1. Process HotDealEvent queue
  const events = await db.hotDealEvent.findMany({
    where: { processedAt: null },
    include: { deal: true },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  for (const event of events) {
    try {
      await db.$transaction(async (tx) => {
        // Stale event check: don't deliver private alerts after general release
        const isStale = event.audience === 'PRIVATE_MEMBER' && (
          !event.deal.partnerReleaseAt ||
          event.deal.partnerReleaseAt <= now ||
          event.deal.status !== 'PRIVATE_HOT_DEAL'
        )

        if (isStale) {
          await tx.hotDealEvent.update({
            where: { id: event.id },
            data: { processedAt: now },
          })
          return
        }

        // Fetch target audience users
        const users = await tx.user.findMany({
          where: {
            accountStatus: 'ACTIVE',
            deletedAt: null,
            ...(event.cursorUserId ? { id: { gt: event.cursorUserId } } : {}),
            ...(event.audience === 'PARTICIPANTS'
              ? { participations: { some: { opportunityId: event.deal.opportunityId } } }
              : { subscriptions: { some: { status: 'ACTIVE', expiresAt: { gt: now } } } }),
          },
          include: {
            hotDealPreferences: true,
            subscriptions: {
              include: {
                plan: {
                  include: { entitlements: true },
                },
              },
            },
          },
          orderBy: { id: 'asc' },
          take: 100,
        })

        for (const user of users) {
          const codes = await getUserEntitlements(tx, user.id, now)

          if (event.audience !== 'PARTICIPANTS' && !codes.includes('PRIVATE_MEMBER') && !codes.includes(event.audience)) {
            continue
          }

          // Create In-App Notification if enabled (default true)
          if (user.hotDealPreferences?.inApp !== false) {
            await tx.notification.create({
              data: {
                userId: user.id,
                title: event.title,
                body: event.body,
                linkUrl: `/hot-deals/${event.dealId}`,
              },
            })
            result.inAppCreated++
          }

          // Enqueue SMS / Email outbox events with idempotency keys
          for (const channel of ['sms', 'email'] as const) {
            if (user.hotDealPreferences?.[channel]) {
              const idempotencyKey = `${event.id}:${user.id}:${channel}`
              await tx.outboxEvent.create({
                data: {
                  eventType: 'HOT_DEAL_NOTIFICATION',
                  aggregateType: 'HotDeal',
                  aggregateId: event.dealId,
                  payload: {
                    idempotencyKey,
                    userId: user.id,
                    channel,
                    title: event.title,
                    body: event.body,
                    privateUntil: event.audience === 'PRIVATE_MEMBER' ? event.deal.partnerReleaseAt?.toISOString() : null,
                  },
                },
              })
              result.outboxEnqueued++
            }
          }
        }

        if (users.length === 100) {
          await tx.hotDealEvent.update({
            where: { id: event.id },
            data: { cursorUserId: users[users.length - 1].id },
          })
        } else {
          await tx.hotDealEvent.update({
            where: { id: event.id },
            data: { processedAt: now },
          })
        }
      })

      result.eventsProcessed++
    } catch (err: any) {
      result.errors.push(`Failed to process event ${event.id}: ${err.message}`)
    }
  }

  // 2. Process Outbox notifications if gateway is configured
  const endpoint = process.env.HOT_DEALS_NOTIFICATION_GATEWAY
  const token = process.env.HOT_DEALS_GATEWAY_TOKEN

  if (endpoint && token && endpoint.startsWith('https://')) {
    const outboxEvents = await db.outboxEvent.findMany({
      where: {
        eventType: 'HOT_DEAL_NOTIFICATION',
        processedAt: null,
      },
      take: 25,
    })

    for (const evt of outboxEvents) {
      const payload = evt.payload as {
        idempotencyKey: string
        userId: string
        channel: 'sms' | 'email'
        title: string
        body: string
      }

      try {
        const user = await db.user.findUnique({
          where: { id: payload.userId },
        })

        if (user) {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Idempotency-Key': payload.idempotencyKey,
            },
            body: JSON.stringify({
              ...payload,
              recipient: payload.channel === 'sms' ? user.phone : user.email,
            }),
            signal: AbortSignal.timeout(8000),
          })

          if (res.ok) {
            result.gatewayDelivered++
          }
        }

        await db.outboxEvent.update({
          where: { id: evt.id },
          data: { processedAt: new Date() },
        })
      } catch {
        await db.outboxEvent.update({
          where: { id: evt.id },
          data: {
            retryCount: { increment: 1 },
            failedAt: new Date(),
          },
        })
      }
    }
  }

  return result
}
