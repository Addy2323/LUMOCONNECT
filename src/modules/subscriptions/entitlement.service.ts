import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export type Tx = Prisma.TransactionClient

export interface UserEntitlementSummary {
  userId: string
  isActive: boolean
  isPrivateMember: boolean
  isPartnerSubscriber: boolean
  isBusinessSubscriber: boolean
  entitlements: string[]
  status: string
  expiresAt: Date | null
}

export class EntitlementError extends Error {
  constructor(message: string, public statusCode = 403) {
    super(message)
    this.name = 'EntitlementError'
  }
}

/**
 * Checks if a subscription record is currently active at the specified timestamp.
 */
export function isSubscriptionActive(
  sub: { status: string; startsAt?: Date | null; expiresAt?: Date | null; cancelledAt?: Date | null },
  now = new Date()
): boolean {
  return (
    sub.status === 'ACTIVE' &&
    !sub.cancelledAt &&
    Boolean(sub.startsAt && sub.startsAt <= now) &&
    Boolean(sub.expiresAt && sub.expiresAt > now)
  )
}

/**
 * Resolves all active entitlement codes for a given user from the database.
 */
export async function getUserEntitlements(
  client: Tx | typeof db,
  userId: string,
  now = new Date()
): Promise<string[]> {
  const user = await client.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: {
          status: 'ACTIVE',
          expiresAt: { gt: now },
        },
        include: {
          plan: {
            include: {
              entitlements: true,
            },
          },
        },
      },
    },
  })

  if (!user || user.accountStatus !== 'ACTIVE' || user.deletedAt) {
    return []
  }

  const codes = new Set<string>()

  for (const sub of user.subscriptions) {
    if (sub.plan.isActive && isSubscriptionActive(sub, now)) {
      for (const entitlement of sub.plan.entitlements) {
        codes.add(entitlement.code)
      }
    }
  }

  return Array.from(codes)
}

/**
 * Evaluates whether a user has a specific entitlement (e.g., 'PRIVATE_MEMBER', 'PARTNER_SUBSCRIBER').
 */
export async function hasEntitlement(
  client: Tx | typeof db,
  userId: string,
  requiredCode: string,
  now = new Date()
): Promise<boolean> {
  const codes = await getUserEntitlements(client, userId, now)
  return codes.includes(requiredCode)
}

/**
 * Returns a comprehensive entitlement summary for the user.
 */
export async function getEntitlementSummary(
  client: Tx | typeof db,
  userId: string,
  now = new Date()
): Promise<UserEntitlementSummary> {
  const user = await client.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        orderBy: { expiresAt: 'desc' },
        include: {
          plan: {
            include: {
              entitlements: true,
            },
          },
        },
      },
    },
  })

  if (!user || user.accountStatus !== 'ACTIVE' || user.deletedAt) {
    return {
      userId,
      isActive: false,
      isPrivateMember: false,
      isPartnerSubscriber: false,
      isBusinessSubscriber: false,
      entitlements: [],
      status: 'INACTIVE',
      expiresAt: null,
    }
  }

  const activeSubs = user.subscriptions.filter((s) => s.plan.isActive && isSubscriptionActive(s, now))
  const codes = new Set<string>()

  for (const sub of activeSubs) {
    for (const ent of sub.plan.entitlements) {
      codes.add(ent.code)
    }
  }

  const entitlementList = Array.from(codes)
  const latestSub = user.subscriptions[0]

  return {
    userId,
    isActive: activeSubs.length > 0,
    isPrivateMember: entitlementList.includes('PRIVATE_MEMBER'),
    isPartnerSubscriber: entitlementList.includes('PARTNER_SUBSCRIBER'),
    isBusinessSubscriber: entitlementList.includes('BUSINESS_TIER'),
    entitlements: entitlementList,
    status: latestSub ? latestSub.status : 'NO_SUBSCRIPTION',
    expiresAt: latestSub?.expiresAt ?? null,
  }
}

/**
 * Server-side guard that throws an EntitlementError if the user does not hold the required entitlement.
 */
export async function requireEntitlement(
  client: Tx | typeof db,
  userId: string,
  requiredCode: string,
  denialMessage = 'You do not hold the required subscription entitlement to access this resource.'
): Promise<void> {
  const allowed = await hasEntitlement(client, userId, requiredCode)
  if (!allowed) {
    throw new EntitlementError(denialMessage, 403)
  }
}
