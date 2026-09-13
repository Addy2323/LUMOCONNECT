import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET() {
  try {
    const alerts = await db.riskAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: true,
      },
    })

    const formattedAlerts = alerts.map((a) => {
      const score = Number(a.riskScore || 0)
      const level = score > 75 ? 'CRITICAL' : score > 50 ? 'HIGH' : score > 25 ? 'MEDIUM' : 'LOW'
      return {
        id: a.id,
        caseNumber: a.id.slice(0, 8),
        userOrPartner: a.user?.name || 'Suspicious User',
        riskScore: score,
        riskLevel: level,
        triggerReason: a.reason,
        status: a.status,
        createdAt: a.createdAt.toISOString().slice(0, 10),
      }
    })

    return NextResponse.json({ alerts: formattedAlerts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))
    const { alertId, action } = body // action = 'RESOLVE' | 'SUSPEND_USER'

    if (!alertId || !action) {
      return NextResponse.json({ message: 'Invalid payload.' }, { status: 400 })
    }

    const alert = await db.riskAlert.findUnique({
      where: { id: alertId },
    })

    if (!alert) {
      return NextResponse.json({ message: 'Risk alert not found.' }, { status: 404 })
    }

    const updated = await db.$transaction(async (tx) => {
      const a = await tx.riskAlert.update({
        where: { id: alertId },
        data: {
          status: 'RESOLVED',
          dismissedBy: actorId,
        },
      })

      if (action === 'SUSPEND_USER' && alert.userId) {
        await tx.user.update({
          where: { id: alert.userId },
          data: { accountStatus: 'SUSPENDED' },
        })
      }

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: action === 'SUSPEND_USER' ? 'ADMIN_FRAUD_USER_SUSPENDED' : 'ADMIN_FRAUD_ALERT_RESOLVED',
          entityType: 'RISK_ALERT',
          entityId: alertId,
          afterData: { action },
        },
      })

      return a
    })

    return NextResponse.json({ success: true, alert: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
