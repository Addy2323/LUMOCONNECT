import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET() {
  try {
    const subscriptions = await db.userSubscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: true,
        plan: true,
      },
    })

    const formattedSubs = subscriptions.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: s.user?.name || 'Partner',
      userEmail: s.user?.email || '—',
      planCode: s.plan?.code || 'STANDARD',
      tier: s.plan?.name || 'STANDARD',
      status: s.status,
      startsAt: s.startsAt ? s.startsAt.toISOString().slice(0, 10) : 'N/A',
      expiresAt: s.expiresAt ? s.expiresAt.toISOString().slice(0, 10) : 'N/A',
      autoRenew: s.autoRenew,
      amountPaidTZS: Number(s.plan?.priceMinor ? s.plan.priceMinor / 100n : 0n),
    }))

    return NextResponse.json({ subscriptions: formattedSubs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))
    const { userId, planCode, daysToAdd = 30 } = body

    if (!userId || !planCode) {
      return NextResponse.json({ message: 'Missing userId or planCode.' }, { status: 400 })
    }

    const startsAt = new Date()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + Number(daysToAdd))

    let plan = await db.subscriptionPlan.findUnique({
      where: { code: planCode },
    })

    if (!plan) {
      plan = await db.subscriptionPlan.create({
        data: {
          code: planCode,
          name: planCode,
          billingPeriod: 'MONTHLY',
          priceMinor: BigInt(0),
        },
      })
    }

    const created = await db.$transaction(async (tx) => {
      const sub = await tx.userSubscription.create({
        data: {
          userId,
          planId: plan.id,
          status: 'ACTIVE',
          startsAt,
          expiresAt,
          autoRenew: true,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: 'ADMIN_SUBSCRIPTION_GRANTED',
          entityType: 'USER_SUBSCRIPTION',
          entityId: sub.id,
          afterData: { userId, planCode, daysToAdd },
        },
      })

      return sub
    })

    return NextResponse.json({ success: true, subscription: created })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
