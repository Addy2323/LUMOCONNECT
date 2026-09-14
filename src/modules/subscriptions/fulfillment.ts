import { db } from '@/lib/db'
import { normalizeTanzaniaPhone } from '@/modules/sms/phone'
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  grantUserSubscription,
  getUserSubscription,
} from './service'
import type { UserSubscriptionItem, SubscriptionPlanCode } from './types'

/**
 * Activates a subscription in the PostgreSQL database and runtime memory.
 * Permanently links the active pass to the user account by ID, Email, and Phone.
 */
export async function activateSubscriptionInDatabase(params: {
  userId?: string
  email?: string
  phone?: string
  planCode: string
  amountTZS?: number
  providerReference?: string
}): Promise<UserSubscriptionItem | null> {
  const { userId, email, phone, planCode, amountTZS, providerReference } = params

  const normalizedCode = (planCode || 'MONTHLY').toUpperCase() as SubscriptionPlanCode
  const days =
    normalizedCode === 'SEMI_ANNUAL'
      ? 180
      : normalizedCode === 'ANNUAL'
      ? 365
      : 30

  const startsAt = new Date()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)

  const isVip =
    normalizedCode === 'GOLDEN_VIP' ||
    normalizedCode === 'ANNUAL' ||
    normalizedCode === 'ENTERPRISE'

  // 1. Find user in PostgreSQL database
  let targetUser: { id: string; email: string; phone?: string | null; name: string } | null = null

  if (process.env.DATABASE_URL?.trim()) {
    try {
      if (userId && !userId.includes('guest') && userId.length >= 10) {
        // Try finding by UUID or cuid
        targetUser = await db.user.findFirst({
          where: {
            OR: [
              { id: userId },
              ...(email ? [{ email: email.toLowerCase().trim() }] : []),
            ],
          },
          select: { id: true, email: true, phone: true, name: true },
        })
      }

      if (!targetUser && email) {
        targetUser = await db.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          select: { id: true, email: true, phone: true, name: true },
        })
      }

      if (!targetUser && phone) {
        const normPhone = normalizeTanzaniaPhone(phone)
        targetUser = await db.user.findFirst({
          where: {
            OR: [{ phone }, { phone: normPhone }],
          },
          select: { id: true, email: true, phone: true, name: true },
        })
      }

      // 2. Ensure SubscriptionPlan exists in DB
      let dbPlan = await db.subscriptionPlan.findUnique({
        where: { code: normalizedCode },
      })

      if (!dbPlan) {
        const defaultPlan =
          DEFAULT_SUBSCRIPTION_PLANS.find((p) => p.code === normalizedCode) ||
          DEFAULT_SUBSCRIPTION_PLANS[0]

        dbPlan = await db.subscriptionPlan.create({
          data: {
            code: normalizedCode,
            name: defaultPlan.name,
            billingPeriod: defaultPlan.billingPeriod,
            priceMinor: BigInt((amountTZS || defaultPlan.priceTZS) * 100),
            currency: 'TZS',
            enterprise: defaultPlan.isEnterprise,
            features: defaultPlan.features,
            isActive: true,
          },
        })
      }

      // 3. Persist to user_subscriptions table if targetUser found
      if (targetUser && dbPlan) {
        // Expire any existing active subscriptions for this user
        await db.userSubscription.updateMany({
          where: {
            userId: targetUser.id,
            status: 'ACTIVE',
          },
          data: {
            status: 'EXPIRED',
          },
        })

        // Create new active subscription
        await db.userSubscription.create({
          data: {
            userId: targetUser.id,
            planId: dbPlan.id,
            status: 'ACTIVE',
            startsAt,
            expiresAt,
            autoRenew: true,
          },
        })

        console.log(`[SUBSCRIPTION FULFILLMENT] Activated plan ${normalizedCode} for user ${targetUser.email} (ID: ${targetUser.id})`)
      }
    } catch (dbError) {
      console.warn('[SUBSCRIPTION FULFILLMENT] Database activation warning:', dbError)
    }
  }

  // 4. Update in-memory and local session across all user aliases
  const targetId = targetUser?.id || userId || email || 'partner_user'
  const userSub = grantUserSubscription(
    targetId,
    normalizedCode,
    days,
    amountTZS || 25000
  )

  // Also index by email so lookups by email find it
  if (targetUser?.email && targetUser.email !== targetId) {
    grantUserSubscription(targetUser.email, normalizedCode, days, amountTZS || 25000)
  }
  if (email && email !== targetId) {
    grantUserSubscription(email.toLowerCase().trim(), normalizedCode, days, amountTZS || 25000)
  }

  return userSub
}
