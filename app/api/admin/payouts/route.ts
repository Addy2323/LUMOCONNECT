import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET() {
  try {
    const batches = await db.payoutBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        payouts: {
          include: {
            user: true,
          },
        },
      },
    })

    const formattedBatches = batches.map((b) => {
      const grossTZS = Number(b.totalGrossMinor / 100n)
      const taxTZS = Number(b.totalTaxWithheldMinor / 100n)
      const netTZS = Number(b.totalNetMinor / 100n)

      return {
        id: b.id,
        reference: b.batchNumber,
        itemCount: b.totalItems,
        grossAmountTZS: grossTZS,
        taxWithheldTZS: taxTZS,
        netAmountTZS: netTZS,
        status: b.status,
        createdAt: b.createdAt.toISOString().slice(0, 10),
        payouts: b.payouts.map((p) => ({
          id: p.id,
          recipientName: p.user?.name || 'Partner',
          phone: p.user?.phone || '—',
          netAmountTZS: Number(p.netAmountMinor / 100n),
          status: p.status,
        })),
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

    if (!batchId || !['AUTHORIZE', 'REJECT'].includes(action)) {
      return NextResponse.json({ message: 'Missing batchId or invalid action.' }, { status: 400 })
    }

    const batch = await db.payoutBatch.findUnique({
      where: { id: batchId },
    })

    if (!batch) {
      return NextResponse.json({ message: 'Payout batch not found.' }, { status: 404 })
    }

    const updated = await db.$transaction(async (tx) => {
      const b = await tx.payoutBatch.update({
        where: { id: batchId },
        data: {
          status: action === 'AUTHORIZE' ? 'COMPLETED' : 'REJECTED',
          approvedAt: action === 'AUTHORIZE' ? new Date() : null,
          approvedByUserId: actorId,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: action === 'AUTHORIZE' ? 'ADMIN_PAYOUT_BATCH_AUTHORIZED' : 'ADMIN_PAYOUT_BATCH_REJECTED',
          entityType: 'PAYOUT_BATCH',
          entityId: batchId,
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
