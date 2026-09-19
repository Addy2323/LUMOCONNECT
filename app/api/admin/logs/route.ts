import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSession } from '@/lib/admin-session'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied
  try {
    const { searchParams } = new URL(request.url)
    const moduleFilter = searchParams.get('module') || 'ALL'
    const query = searchParams.get('q') || ''
    const limit = Math.min(1000, Math.max(1, Number(searchParams.get('limit')) || 100))

    const rawAuditLogs = await db.auditLog.findMany({
      where: {
        ...(moduleFilter !== 'ALL' ? { entityType: moduleFilter } : {}),
        ...(query
          ? {
              OR: [
                { action: { contains: query, mode: 'insensitive' } },
                ...(query.length === 36 ? [{ entityId: query }] : []),
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: true,
      },
    })

    const formattedLogs = rawAuditLogs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString().replace('T', ' ').slice(0, 19),
      actorId: log.actorUserId || 'SYSTEM',
      actorName: log.actor?.name || 'System / Automated Process',
      actorRole: log.actorUserId ? 'Not recorded at event time' : 'SYSTEM',
      action: log.action,
      module: (['AUTH', 'BUSINESS', 'DEALS', 'PAYMENTS', 'PAYOUTS', 'RISK', 'SETTINGS', 'SYSTEM'].includes(
        log.entityType?.toUpperCase() || ''
      )
        ? log.entityType?.toUpperCase()
        : 'BUSINESS'),
      resourceId: log.entityId || log.id,
      ipAddress: log.ipAddress || 'Not recorded',
      userAgent: log.userAgent || 'Not recorded',
      beforeState: log.beforeData || undefined,
      afterState: log.afterData || undefined,
      hashSignature: 'Not recorded',
    }))

    return NextResponse.json({ auditLogs: formattedLogs }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'Unable to load audit records. Please retry.' }, { status: 500 })
  }
}
