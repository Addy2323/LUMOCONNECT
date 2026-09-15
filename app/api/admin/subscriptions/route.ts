import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'
import { activateSubscriptionInDatabase } from '@/modules/subscriptions/fulfillment'
import type { SubscriptionPlanCode } from '@/modules/subscriptions/types'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const searchParams = request.nextUrl.searchParams
    const sortBy = searchParams.get('sortBy') || 'remaining_asc'

    if (process.env.DATABASE_URL?.trim()) {
      // 1. Auto-expire any subscriptions whose expiry date has passed
      await db.userSubscription.updateMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { lte: now },
        },
        data: {
          status: 'EXPIRED',
        },
      })

      // 2. Fetch subscriptions from database
      const subscriptions = await db.userSubscription.findMany({
        take: 200,
        include: {
          user: true,
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      let totalActive = 0
      let expiringTomorrow = 0
      let expiring7Days = 0
      let totalExpired = 0
      let totalRevenueTZS = 0

      const formattedSubs = subscriptions.map((s) => {
        const diffMs = s.expiresAt ? s.expiresAt.getTime() - now.getTime() : 0
        const isCurrentActive = s.status === 'ACTIVE' && (!s.expiresAt || s.expiresAt > now)
        const daysRemaining = isCurrentActive ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))) : 0
        const hoursRemaining = isCurrentActive ? Math.max(0, Math.floor(diffMs / (1000 * 60 * 60))) : 0

        const planPrice = Number(s.plan?.priceMinor ? s.plan.priceMinor / 100n : 0n)
        totalRevenueTZS += planPrice

        if (isCurrentActive) {
          totalActive++
          if (s.expiresAt && s.expiresAt <= in24Hours) {
            expiringTomorrow++
          }
          if (s.expiresAt && s.expiresAt <= in7Days) {
            expiring7Days++
          }
        } else {
          totalExpired++
        }

        const isGolden =
          s.plan?.code === 'GOLDEN_VIP' ||
          s.plan?.code === 'ANNUAL' ||
          s.plan?.code === 'ENTERPRISE'

        return {
          id: s.id,
          userId: s.userId,
          userName: s.user?.name || s.user?.email?.split('@')[0] || 'Partner',
          userEmail: s.user?.email || '—',
          userPhone: s.user?.phone || '—',
          planCode: (s.plan?.code || 'MONTHLY') as SubscriptionPlanCode,
          planName: s.plan?.name || s.plan?.code || 'Standard Subscription',
          tier: s.plan?.name || s.plan?.code || 'STANDARD',
          isGoldenVip: isGolden,
          status: isCurrentActive ? 'ACTIVE' : s.status === 'ACTIVE' ? 'EXPIRED' : s.status,
          startsAt: s.startsAt ? s.startsAt.toISOString().slice(0, 10) : 'N/A',
          expiresAt: s.expiresAt ? s.expiresAt.toISOString().slice(0, 10) : 'N/A',
          startsAtISO: s.startsAt?.toISOString(),
          expiresAtISO: s.expiresAt?.toISOString(),
          remainingMilliseconds: Math.max(0, diffMs),
          daysRemaining,
          hoursRemaining,
          autoRenew: s.autoRenew,
          amountTZS: planPrice,
          amountPaidTZS: planPrice,
          providerRef: `SUB-${s.id.slice(0, 8).toUpperCase()}`,
          createdAt: s.createdAt ? s.createdAt.toISOString().slice(0, 10) : 'N/A',
        }
      })

      // Sorting
      if (sortBy === 'remaining_asc') {
        formattedSubs.sort((a, b) => {
          if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1
          if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1
          if (a.status === 'ACTIVE' && b.status === 'ACTIVE') {
            return a.remainingMilliseconds - b.remainingMilliseconds
          }
          return 0
        })
      }

      return NextResponse.json({
        success: true,
        serverTime: now.toISOString(),
        metrics: {
          totalActive,
          expiringTomorrow,
          expiring7Days,
          totalExpired,
          totalRevenueTZS,
          totalSubscribers: subscriptions.length,
        },
        subscriptions: formattedSubs,
      })
    }

    return NextResponse.json({
      success: true,
      serverTime: now.toISOString(),
      metrics: {
        totalActive: 0,
        expiringTomorrow: 0,
        expiring7Days: 0,
        totalExpired: 0,
        totalRevenueTZS: 0,
        totalSubscribers: 0,
      },
      subscriptions: [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))
    const {
      userIdentifier,
      userId,
      email,
      phone,
      planCode = 'MONTHLY',
      daysToAdd,
      days,
      amountPaidTZS,
      amountTZS,
      reason = 'Admin manual upgrade / payment bypass',
      providerReference,
    } = body

    const targetInput = (userIdentifier || email || userId || phone || '').trim()
    if (!targetInput) {
      return NextResponse.json({ message: 'User email, phone, or ID is required.' }, { status: 400 })
    }

    const isEmail = targetInput.includes('@')
    const isPhone = /^\+?[0-9\s-]{9,15}$/.test(targetInput)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetInput)

    const finalUserId = userId || (isUuid ? targetInput : undefined)
    const finalEmail = email || (isEmail ? targetInput.toLowerCase() : undefined)
    const finalPhone = phone || (isPhone ? targetInput : undefined)

    const totalDays = Number(days || daysToAdd) || undefined
    const finalAmount =
      amountPaidTZS !== undefined
        ? Number(amountPaidTZS)
        : amountTZS !== undefined
        ? Number(amountTZS)
        : undefined

    const activated = await activateSubscriptionInDatabase({
      userId: finalUserId,
      email: finalEmail,
      phone: finalPhone,
      planCode: String(planCode).toUpperCase(),
      days: totalDays,
      amountTZS: finalAmount,
      providerReference: providerReference || `ADMIN-OVERRIDE-${Date.now().toString().slice(-6)}`,
      reason,
      actorUserId: actorId,
    })

    return NextResponse.json({
      success: true,
      message: `User subscription successfully upgraded to ${planCode}.`,
      subscription: activated,
    })
  } catch (error: any) {
    console.error('Admin subscription upgrade error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
