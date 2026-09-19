import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSession } from '@/lib/admin-session'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied
  const body = await request.json().catch(() => null)
  if (body?.confirmation !== 'REMOVE ALL PRODUCTS') return NextResponse.json({ error: 'Explicit bulk removal confirmation required.' }, { status: 400 })
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    if (!session) return NextResponse.json({ error: 'Session expired.' }, { status: 401 })
    const result = await db.$transaction(async tx => {
      // Archive listings, retaining orders, referrals, rewards and financial history.
      const opportunities = await tx.opportunity.updateMany({
        where: { deletedAt: null, status: { not: 'ARCHIVED' } }, data: { status: 'ARCHIVED' },
      })
      const hotDeals = await tx.hotDeal.updateMany({
        where: { opportunity: { status: 'ARCHIVED' }, visibilityStatus: { not: 'HIDDEN' } },
        data: { visibilityStatus: 'HIDDEN' },
      })
      await tx.auditLog.create({ data: {
        actorUserId: session.userId, action: 'ADMIN_ALL_PRODUCTS_REMOVED', entityType: 'OPPORTUNITY', entityId: 'ALL',
        afterData: { archivedCount: opportunities.count, hiddenHotDeals: hotDeals.count },
      } })
      return { archivedCount: opportunities.count, hiddenHotDeals: hotDeals.count }
    }, { isolationLevel: 'Serializable' })
    return NextResponse.json({ success: true, ...result })
  } catch {
    return NextResponse.json({ error: 'Removal failed. Refresh and retry; no partial removal was committed.' }, { status: 500 })
  }
}
