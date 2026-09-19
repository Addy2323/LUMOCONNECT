import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'
import { getUserSubscription } from '@/modules/subscriptions/service'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
    const session = await getDatabaseSession(sessionToken)

    const searchParams = request.nextUrl.searchParams
    const queryUserId = searchParams.get('userId')

    // If unauthenticated, return no subscription
    if (!session && !queryUserId) {
      return NextResponse.json({
        success: true,
        serverTime: now.toISOString(),
        hasActiveSubscription: false,
        subscription: null,
      })
    }

    // Determine target user
    let targetUserId = session?.userId || ''
    const userEmail = session?.user?.email

    if (queryUserId && queryUserId !== targetUserId) {
      // Only allow admins to inspect other users' subscriptions
      const isAdmin =
        session?.user?.roleAssignments?.some(
          (ra: any) => ra.role?.code === 'ADMIN' || ra.role?.code === 'SUPER_ADMIN'
        ) || session?.user?.email === 'admin@lumo.co.tz'

      if (!isAdmin && session) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: cannot query other users subscription' },
          { status: 403 }
        )
      }
      if (isAdmin) {
        targetUserId = queryUserId
      }
    }

    if (!targetUserId) {
      return NextResponse.json({
        success: true,
        serverTime: now.toISOString(),
        hasActiveSubscription: false,
        subscription: null,
      })
    }

    // 1. Try PostgreSQL database lookup
    if (process.env.DATABASE_URL?.trim()) {
      try {
        // Auto-expire any subscriptions whose expiresAt has arrived
        await db.userSubscription.updateMany({
          where: {
            userId: targetUserId,
            status: 'ACTIVE',
            expiresAt: { lte: now },
          },
          data: {
            status: 'EXPIRED',
          },
        })

        // Find active or most recent subscription
        const activeSub = await db.userSubscription.findFirst({
          where: {
            userId: targetUserId,
            status: 'ACTIVE',
            expiresAt: { gt: now },
          },
          include: { plan: true },
          orderBy: { expiresAt: 'desc' },
        })

        if (activeSub && activeSub.plan && activeSub.expiresAt) {
          const remainingMilliseconds = Math.max(0, new Date(activeSub.expiresAt).getTime() - now.getTime())
          const daysRemaining = Math.max(0, Math.ceil(remainingMilliseconds / (1000 * 60 * 60 * 24)))

          const isVip =
            activeSub.plan.code === 'GOLDEN_VIP' ||
            activeSub.plan.code === 'ANNUAL' ||
            activeSub.plan.code === 'ENTERPRISE'

          return NextResponse.json({
            success: true,
            serverTime: now.toISOString(),
            hasActiveSubscription: true,
            subscription: {
              id: activeSub.id,
              userId: activeSub.userId,
              planCode: activeSub.plan.code,
              planName: activeSub.plan.name,
              status: 'ACTIVE',
              startsAt: activeSub.startsAt ? activeSub.startsAt.toISOString() : now.toISOString(),
              expiresAt: activeSub.expiresAt.toISOString(),
              serverTime: now.toISOString(),
              daysRemaining,
              remainingMilliseconds,
              isActive: true,
              autoRenew: activeSub.autoRenew,
              amountPaidTZS: Number(activeSub.plan.priceMinor / 100n),
              isGoldenVip: isVip,
              hasGoldenVipAccess: isVip,
            },
          })
        }

        // If no active subscription, check for most recent expired or cancelled subscription
        const latestSub = await db.userSubscription.findFirst({
          where: { userId: targetUserId },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        })

        if (latestSub && latestSub.plan) {
          const isVip =
            latestSub.plan.code === 'GOLDEN_VIP' ||
            latestSub.plan.code === 'ANNUAL' ||
            latestSub.plan.code === 'ENTERPRISE'

          return NextResponse.json({
            success: true,
            serverTime: now.toISOString(),
            hasActiveSubscription: false,
            subscription: {
              id: latestSub.id,
              userId: latestSub.userId,
              planCode: latestSub.plan.code,
              planName: latestSub.plan.name,
              status: latestSub.status,
              startsAt: latestSub.startsAt ? latestSub.startsAt.toISOString() : null,
              expiresAt: latestSub.expiresAt ? latestSub.expiresAt.toISOString() : null,
              serverTime: now.toISOString(),
              daysRemaining: 0,
              remainingMilliseconds: 0,
              isActive: false,
              autoRenew: latestSub.autoRenew,
              amountPaidTZS: Number(latestSub.plan.priceMinor / 100n),
              isGoldenVip: isVip,
              hasGoldenVipAccess: false,
            },
          })
        }
      } catch (dbErr) {
        console.warn('[SUBSCRIPTION ACTIVE API] DB read warning:', dbErr)
      }
    }

    // 2. Strict in-memory lookup for targetUserId only (or userEmail fallback)
    const memorySub =
      getUserSubscription(targetUserId) || (userEmail ? getUserSubscription(userEmail) : null)

    if (memorySub) {
      const remainingMilliseconds = Math.max(
        0,
        new Date(memorySub.expiresAt).getTime() - now.getTime()
      )
      return NextResponse.json({
        success: true,
        serverTime: now.toISOString(),
        hasActiveSubscription: memorySub.isActive,
        subscription: {
          ...memorySub,
          serverTime: now.toISOString(),
          remainingMilliseconds,
          startsAt: new Date(memorySub.startsAt).toISOString(),
          expiresAt: new Date(memorySub.expiresAt).toISOString(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      serverTime: now.toISOString(),
      hasActiveSubscription: false,
      subscription: null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error checking active subscription'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
