import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET() {
  try {
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: true,
      },
    })

    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      recipientName: n.user?.name || 'All Active Partners',
      title: n.title,
      body: n.body,
      channel: n.channel,
      status: n.status,
      sentAt: n.sentAt ? n.sentAt.toISOString().replace('T', ' ').slice(0, 19) : n.createdAt.toISOString().replace('T', ' ').slice(0, 19),
    }))

    return NextResponse.json({ notifications: formattedNotifications })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))
    const { title, message, channel = 'IN_APP', recipientUserId } = body

    if (!title || !message) {
      return NextResponse.json({ message: 'Title and message body are required.' }, { status: 400 })
    }

    const created = await db.$transaction(async (tx) => {
      const targetUserId = recipientUserId || actorId
      const notif = await tx.notification.create({
        data: {
          userId: targetUserId,
          title,
          body: message,
          channel: channel as any,
          status: 'SENT',
          sentAt: new Date(),
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: 'ADMIN_NOTIFICATION_BROADCAST_SENT',
          entityType: 'NOTIFICATION',
          entityId: notif.id,
          afterData: { title, channel, recipientUserId },
        },
      })

      return notif
    })

    return NextResponse.json({ success: true, notification: created })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
