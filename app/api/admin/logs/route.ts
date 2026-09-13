import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const moduleFilter = searchParams.get('module') || 'ALL'
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    const rawAuditLogs = await db.auditLog.findMany({
      where: {
        ...(moduleFilter !== 'ALL' ? { entityType: moduleFilter } : {}),
        ...(query
          ? {
              OR: [
                { action: { contains: query, mode: 'insensitive' } },
                { entityId: { contains: query, mode: 'insensitive' } },
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
      actorRole: log.actorUserId ? 'SUPER_ADMIN' : 'SYSTEM',
      action: log.action,
      module: (['AUTH', 'BUSINESS', 'DEALS', 'PAYMENTS', 'PAYOUTS', 'RISK', 'SETTINGS', 'SYSTEM'].includes(
        log.entityType?.toUpperCase() || ''
      )
        ? log.entityType?.toUpperCase()
        : 'BUSINESS') as any,
      resourceId: log.entityId || log.id,
      ipAddress: log.ipAddress || '127.0.0.1 (Localhost)',
      userAgent: log.userAgent || 'Mozilla/5.0 (Lumo Platform Auth)',
      beforeState: (log.beforeData as any) || undefined,
      afterState: (log.afterData as any) || undefined,
      hashSignature: 'sha256:' + log.id.replace(/-/g, '').slice(0, 16),
    }))

    return NextResponse.json({ auditLogs: formattedLogs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
