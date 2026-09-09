import { db } from '@/lib/db'
import { SubscriptionStatus } from '@prisma/client'

export interface ExpireSubscriptionsResult {
  checked: number
  expired: number
  errors: string[]
}

/**
 * Scheduled job to sweep and expire outdated subscriptions.
 * Ensures users who drop below active subscription immediately lose access to private member deals.
 */
export async function runExpireSubscriptionsJob(now = new Date()): Promise<ExpireSubscriptionsResult> {
  const result: ExpireSubscriptionsResult = {
    checked: 0,
    expired: 0,
    errors: [],
  }

  const expiredSubs = await db.userSubscription.findMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      expiresAt: { lte: now },
    },
    include: {
      user: true,
      plan: true,
    },
    take: 200,
  })

  result.checked = expiredSubs.length

  for (const sub of expiredSubs) {
    try {
      await db.$transaction(async (tx) => {
        await tx.userSubscription.update({
          where: { id: sub.id },
          data: {
            status: SubscriptionStatus.EXPIRED,
          },
        })

        // Notify user about subscription expiry
        await tx.notification.create({
          data: {
            userId: sub.userId,
            title: 'Membership Expired',
            body: `Your ${sub.plan.name} subscription expired on ${sub.expiresAt?.toLocaleDateString()}. Renew to regain private deal access.`,
            linkUrl: '/memberships',
          },
        })

        // Outbox event for system broadcast / SMS / email
        await tx.outboxEvent.create({
          data: {
            eventType: 'SUBSCRIPTION_EXPIRED',
            aggregateType: 'UserSubscription',
            aggregateId: sub.id,
            payload: {
              userId: sub.userId,
              planId: sub.planId,
              planName: sub.plan.name,
              expiredAt: sub.expiresAt?.toISOString(),
            },
          },
        })
      })

      result.expired++
    } catch (err: any) {
      result.errors.push(`Failed to expire subscription ${sub.id}: ${err.message}`)
    }
  }

  return result
}
