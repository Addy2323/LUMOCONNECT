import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'
import { activateSubscriptionInDatabase } from '@/modules/subscriptions/fulfillment'
import type { SubscriptionPlanCode } from '@/modules/subscriptions/types'

export async function GET() {
  try {
    const subscriptions = await db.userSubscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 150,
      include: {
        user: true,
        plan: true,
      },
    })

    const now = new Date()

    const formattedSubs = subscriptions.map((s) => {
      const diffMs = s.expiresAt ? s.expiresAt.getTime() - now.getTime() : 0
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      const isGolden =
        s.plan?.code === 'GOLDEN_VIP' ||
        s.plan?.code === 'ANNUAL' ||
        s.plan?.code === 'ENTERPRISE'

      const isCurrentActive = s.status === 'ACTIVE' && (!s.expiresAt || s.expiresAt > now)

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
        daysRemaining: isCurrentActive ? daysRemaining : 0,
        autoRenew: s.autoRenew,
        amountTZS: Number(s.plan?.priceMinor ? s.plan.priceMinor / 100n : 0n),
        amountPaidTZS: Number(s.plan?.priceMinor ? s.plan.priceMinor / 100n : 0n),
        providerRef: `SUB-${s.id.slice(0, 8).toUpperCase()}`,
        createdAt: s.createdAt ? s.createdAt.toISOString().slice(0, 10) : 'N/A',
      }
    })

    return NextResponse.json({ success: true, subscriptions: formattedSubs })
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
    const finalAmount = amountPaidTZS !== undefined ? Number(amountPaidTZS) : amountTZS !== undefined ? Number(amountTZS) : undefined

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
