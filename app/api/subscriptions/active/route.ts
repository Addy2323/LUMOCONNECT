import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'
import { getUserSubscription } from '@/modules/subscriptions/service'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
    const session = await getDatabaseSession(sessionToken)

    const searchParams = request.nextUrl.searchParams
    const queryUserId = searchParams.get('userId')

    // If unauthenticated, return no subscription
    if (!session && !queryUserId) {
      return NextResponse.json({
        success: true,
        hasActiveSubscription: false,
        subscription: null,
      })
    }

    // Determine target user
    let targetUserId = session?.userId || ''

    if (queryUserId && queryUserId !== targetUserId) {
      // Only allow admins to inspect other users' subscriptions
      const isAdmin = session?.user?.roleAssignments?.some(
        (ra: any) => ra.role?.code === 'ADMIN' || ra.role?.code === 'SUPER_ADMIN'
      ) || session?.user?.email === 'admin@lumo.co.tz'

      if (!isAdmin && session) {
        return NextResponse.json({ success: false, error: 'Forbidden: cannot query other users subscription' }, { status: 403 })
      }
      if (isAdmin) {
        targetUserId = queryUserId
      }
    }

    if (!targetUserId) {
      return NextResponse.json({
        success: true,
        hasActiveSubscription: false,
        subscription: null,
      })
    }

    // 1. Try PostgreSQL database lookup
    if (process.env.DATABASE_URL?.trim()) {
      try {
        const now = new Date()
        const activeSub = await db.userSubscription.findFirst({
          where: {
            userId: targetUserId,
            status: 'ACTIVE',
            expiresAt: { gt: now },
          },
          include: { plan: true },
          orderBy: { expiresAt: 'desc' },
        })

        if (activeSub && activeSub.plan) {
          const daysRemaining = Math.max(
            0,
            Math.ceil(
              (new Date(activeSub.expiresAt!).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )

          const isVip =
            activeSub.plan.code === 'GOLDEN_VIP' ||
            activeSub.plan.code === 'ANNUAL' ||
            activeSub.plan.code === 'ENTERPRISE'

          return NextResponse.json({
            success: true,
            hasActiveSubscription: true,
            subscription: {
              id: activeSub.id,
              userId: activeSub.userId,
              planCode: activeSub.plan.code,
              planName: activeSub.plan.name,
              status: 'ACTIVE',
              startsAt: activeSub.startsAt,
              expiresAt: activeSub.expiresAt,
              daysRemaining,
              isActive: true,
              autoRenew: activeSub.autoRenew,
              amountPaidTZS: Number(activeSub.plan.priceMinor / 100n),
              isGoldenVip: isVip,
              hasGoldenVipAccess: isVip,
            },
          })
        }
      } catch (dbErr) {
        console.warn('[SUBSCRIPTION ACTIVE API] DB read warning:', dbErr)
      }
    }

    // 2. Strict in-memory lookup for targetUserId only
    const memorySub = getUserSubscription(targetUserId)

    if (memorySub && memorySub.isActive) {
      return NextResponse.json({
        success: true,
        hasActiveSubscription: true,
        subscription: memorySub,
      })
    }

    return NextResponse.json({
      success: true,
      hasActiveSubscription: false,
      subscription: null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error checking active subscription'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
