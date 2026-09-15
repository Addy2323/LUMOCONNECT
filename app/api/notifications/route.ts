import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
    const session = await getDatabaseSession(sessionToken)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const notifications = await db.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 40,
    })

    const formatted = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.body,
      isRead: n.isRead,
      time: n.createdAt.toISOString(),
      type: 'REFERRAL',
      linkUrl: n.linkUrl || '/partner?tab=leads_referrals',
    }))

    return NextResponse.json({ success: true, notifications: formatted })
  } catch (error: any) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
    const session = await getDatabaseSession(sessionToken)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { notificationId, markAllRead } = body

    if (markAllRead) {
      await db.notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true },
      })
    } else if (notificationId) {
      await db.notification.updateMany({
        where: { id: notificationId, userId: session.userId },
        data: { isRead: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Notifications PATCH error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
