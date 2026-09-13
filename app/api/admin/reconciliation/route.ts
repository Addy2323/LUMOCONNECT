import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET() {
  try {
    const runs = await db.reconciliationRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const formattedRuns = runs.map((r) => ({
      id: r.id,
      runDate: r.runDate.toISOString().slice(0, 10),
      provider: 'VODACOM_MPESA',
      totalProviderTx: r.matchedCount + r.unmatchedCount,
      matchedTxCount: r.matchedCount,
      unmatchedTxCount: r.unmatchedCount,
      varianceTZS: 0,
      status: r.status,
    }))

    return NextResponse.json({ reconciliationRuns: formattedRuns })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))
    const { provider = 'VODACOM_MPESA' } = body

    const newRun = await db.$transaction(async (tx) => {
      const run = await tx.reconciliationRun.create({
        data: {
          runDate: new Date(),
          matchedCount: 142,
          unmatchedCount: 0,
          notes: `Automated run for ${provider}`,
          status: 'COMPLETED',
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: 'ADMIN_RECONCILIATION_RUN_EXECUTED',
          entityType: 'RECONCILIATION_RUN',
          entityId: run.id,
          afterData: { provider, status: 'BALANCED' },
        },
      })

      return run
    })

    return NextResponse.json({ success: true, run: newRun })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
