import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET() {
  try {
    const disputes = await db.dispute.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        openedBy: true,
        messages: true,
      },
    })

    const formattedDisputes = disputes.map((d) => ({
      id: d.id,
      disputeNumber: d.id.slice(0, 8),
      complainantName: d.openedBy?.name || 'Complainant',
      category: d.disputeType,
      subject: d.title,
      status: d.status,
      disputedAmountTZS: 0,
      createdAt: d.createdAt.toISOString().slice(0, 10),
      messageCount: d.messages.length,
    }))

    return NextResponse.json({ disputes: formattedDisputes })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))
    const { disputeId, resolution, resolutionNotes } = body

    if (!disputeId || !resolution) {
      return NextResponse.json({ message: 'Missing disputeId or resolution.' }, { status: 400 })
    }

    const updated = await db.$transaction(async (tx) => {
      const d = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED_PARTNER_FAVOR',
          resolutionNotes: resolutionNotes || resolution,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: 'ADMIN_DISPUTE_RESOLVED',
          entityType: 'DISPUTE',
          entityId: disputeId,
          afterData: { resolution, resolutionNotes },
        },
      })

      return d
    })

    return NextResponse.json({ success: true, dispute: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
