import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'
import { getUserSubscription } from '@/modules/subscriptions/service'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
    const session = await getDatabaseSession(sessionToken)

    const searchParams = request.nextUrl.searchParams
    const requestedUserId = searchParams.get('userId') || session?.userId || ''
    const requestedEmail = searchParams.get('email') || session?.user?.email || ''

    // 1. Try PostgreSQL database lookup first
    if (process.env.DATABASE_URL?.trim() && (requestedUserId || requestedEmail)) {
      try {
        let userDb = null
        if (requestedUserId && requestedUserId.length >= 10 && !requestedUserId.includes('guest')) {
          userDb = await db.user.findUnique({
            where: { id: requestedUserId },
            select: { id: true, email: true },
          })
        }
        if (!userDb && requestedEmail) {
          userDb = await db.user.findUnique({
            where: { email: requestedEmail.toLowerCase().trim() },
            select: { id: true, email: true },
          })
        }

        if (userDb) {
          const now = new Date()
          const activeSub = await db.userSubscription.findFirst({
            where: {
              userId: userDb.id,
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
        }
      } catch (dbErr) {
        console.warn('[SUBSCRIPTION ACTIVE API] DB read warning:', dbErr)
      }
    }

    // 2. Fallback to in-memory store
    const lookupKey = requestedUserId || requestedEmail || 'partner_user'
    const memorySub =
      getUserSubscription(lookupKey) ||
      (requestedEmail ? getUserSubscription(requestedEmail) : null)

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
