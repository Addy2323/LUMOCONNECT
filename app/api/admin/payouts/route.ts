import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET() {
  try {
    const payouts = await db.payout.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        partnerUser: true,
        payoutMethod: true,
      },
    })

    const formattedBatches = payouts.map((p) => {
      const grossTZS = Number(p.grossAmountMinor / 100n)
      const taxTZS = Number(p.taxWithheldMinor / 100n)
      const netTZS = Number(p.netAmountMinor / 100n)

      return {
        id: p.id,
        reference: p.providerReference || p.id.slice(0, 8),
        itemCount: 1,
        grossAmountTZS: grossTZS,
        taxWithheldTZS: taxTZS,
        netAmountTZS: netTZS,
        status: p.status,
        createdAt: p.createdAt.toISOString().slice(0, 10),
        payouts: [
          {
            id: p.id,
            recipientName: p.partnerUser?.name || 'Partner',
            phone: p.partnerUser?.phone || '—',
            netAmountTZS: netTZS,
            status: p.status,
          },
        ],
      }
    })

    return NextResponse.json({ batches: formattedBatches })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))
    const { batchId, action } = body // action = 'AUTHORIZE' | 'REJECT'
    const payoutId = batchId

    if (!payoutId || !['AUTHORIZE', 'REJECT'].includes(action)) {
      return NextResponse.json({ message: 'Missing payoutId or invalid action.' }, { status: 400 })
    }

    const payout = await db.payout.findUnique({
      where: { id: payoutId },
    })

    if (!payout) {
      return NextResponse.json({ message: 'Payout not found.' }, { status: 404 })
    }

    const updated = await db.$transaction(async (tx) => {
      const b = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: action === 'AUTHORIZE' ? 'AUTHORIZED' : 'REVERSED',
          authorizedAt: action === 'AUTHORIZE' ? new Date() : null,
          authorizedBy: actorId,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: action === 'AUTHORIZE' ? 'ADMIN_PAYOUT_AUTHORIZED' : 'ADMIN_PAYOUT_REJECTED',
          entityType: 'PAYOUT',
          entityId: payoutId,
          afterData: { action, status: b.status },
        },
      })

      return b
    })

    return NextResponse.json({ success: true, batch: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
