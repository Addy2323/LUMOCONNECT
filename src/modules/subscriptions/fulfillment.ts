import { db } from '@/lib/db'
import { normalizeTanzaniaPhone } from '@/modules/sms/phone'
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  grantUserSubscription,
  getUserSubscription,
  calculateSubscriptionExpiry,
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
  days?: number
  reason?: string
  actorUserId?: string
}): Promise<UserSubscriptionItem | null> {
  const { userId, email, phone, planCode, amountTZS, providerReference, reason, actorUserId } = params

  const normalizedCode = (planCode || 'MONTHLY').toUpperCase() as SubscriptionPlanCode

  const isVip =
    normalizedCode === 'GOLDEN_VIP' ||
    normalizedCode === 'ANNUAL' ||
    normalizedCode === 'ENTERPRISE'

  // 1. Find user in PostgreSQL database
  let targetUser: any = null

  if (process.env.DATABASE_URL?.trim()) {
    try {
      const userSelect = {
        id: true,
        email: true,
        phone: true,
        name: true,
        roleAssignments: {
          select: {
            role: {
              select: { code: true },
            },
          },
        },
      }

      if (userId && !userId.includes('guest') && userId.length >= 10) {
        // Try finding by UUID or cuid
        targetUser = await db.user.findFirst({
          where: {
            OR: [
              { id: userId },
              ...(email ? [{ email: email.toLowerCase().trim() }] : []),
            ],
          },
          select: userSelect,
        })
      }

      if (!targetUser && email) {
        targetUser = await db.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          select: userSelect,
        })
      }

      if (!targetUser && phone) {
        const normPhone = normalizeTanzaniaPhone(phone)
        targetUser = await db.user.findFirst({
          where: {
            OR: [{ phone }, { phone: normPhone }],
          },
          select: userSelect,
        })
      }

      if (targetUser?.roleAssignments?.length) {
        const roles = targetUser.roleAssignments.map((ra: any) => ra.role?.code).filter(Boolean)
        if (roles.length > 0 && !roles.includes('PARTNER')) {
          throw new Error('Subscriptions are only available for Partner accounts. Business and Admin accounts do not require subscriptions.')
        }
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
        const now = new Date()
        const existingActiveSub = await db.userSubscription.findFirst({
          where: {
            userId: targetUser.id,
            status: 'ACTIVE',
          },
          orderBy: { expiresAt: 'desc' },
        })

        const baseDate =
          existingActiveSub?.expiresAt && new Date(existingActiveSub.expiresAt) > now
            ? new Date(existingActiveSub.expiresAt)
            : now

        const startsAt =
          existingActiveSub?.expiresAt && new Date(existingActiveSub.expiresAt) > now
            ? existingActiveSub.startsAt || now
            : now

        let expiresAt: Date
        if (params.days && params.days > 0) {
          expiresAt = new Date(baseDate.getTime() + params.days * 86400000)
        } else {
          expiresAt = calculateSubscriptionExpiry(baseDate, normalizedCode)
        }

        // Expire any existing active subscriptions for this user so only the new prolonged one is ACTIVE
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
        const newSub = await db.userSubscription.create({
          data: {
            userId: targetUser.id,
            planId: dbPlan.id,
            status: 'ACTIVE',
            startsAt,
            expiresAt,
            autoRenew: true,
          },
        })

        const effectiveDays = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000))

        if (actorUserId) {
          try {
            await db.auditLog.create({
              data: {
                actorUserId,
                action: 'ADMIN_SUBSCRIPTION_UPGRADE',
                entityType: 'USER_SUBSCRIPTION',
                entityId: newSub.id,
                afterData: {
                  userId: targetUser.id,
                  userEmail: targetUser.email,
                  planCode: normalizedCode,
                  days: effectiveDays,
                  amountTZS,
                  reason: reason || 'Admin manual upgrade',
                  providerReference,
                },
              },
            })
          } catch (auditErr) {
            console.warn('[SUBSCRIPTION FULFILLMENT] Audit log recording failed:', auditErr)
          }
        }

        console.log(`[SUBSCRIPTION FULFILLMENT] Activated plan ${normalizedCode} for user ${targetUser.email} (ID: ${targetUser.id}), expires: ${expiresAt.toISOString()}`)
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
    params.days,
    amountTZS || 25000
  )

  // Also index by email so lookups by email find it
  if (targetUser?.email && targetUser.email !== targetId) {
    grantUserSubscription(targetUser.email, normalizedCode, params.days, amountTZS || 25000)
  }
  if (email && email !== targetId) {
    grantUserSubscription(email.toLowerCase().trim(), normalizedCode, params.days, amountTZS || 25000)
  }

  return userSub
}
