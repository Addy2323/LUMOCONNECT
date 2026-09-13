import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'ALL'

    const conversions = await db.conversion.findMany({
      where: {
        ...(statusFilter !== 'ALL' ? { status: statusFilter as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        opportunity: true,
        participation: {
          include: {
            partnerUser: true,
          },
        },
        evidence: true,
      },
    })

    const formattedConversions = conversions.map((c) => ({
      id: c.id,
      dealTitle: c.opportunity?.title || 'LUMO Campaign',
      partnerName: c.participation?.partnerUser?.name || 'Partner',
      status: c.status,
      grossValueTZS: Number(c.valueMinor ? c.valueMinor / 100n : 0n),
      riskScore: c.riskScore || 0,
      evidenceCount: c.evidence?.length || 0,
      createdAt: c.createdAt.toISOString().slice(0, 10),
    }))

    return NextResponse.json({ conversions: formattedConversions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))
    const { conversionId, status } = body // status = 'APPROVED' | 'REJECTED'

    if (!conversionId || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ message: 'Invalid payload.' }, { status: 400 })
    }

    const conversion = await db.conversion.findUnique({
      where: { id: conversionId },
    })

    if (!conversion) {
      return NextResponse.json({ message: 'Conversion not found.' }, { status: 404 })
    }

    const updated = await db.$transaction(async (tx) => {
      const conv = await tx.conversion.update({
        where: { id: conversionId },
        data: {
          status,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: status === 'APPROVED' ? 'ADMIN_CONVERSION_APPROVED' : 'ADMIN_CONVERSION_REJECTED',
          entityType: 'CONVERSION',
          entityId: conversionId,
          afterData: { status },
        },
      })

      return conv
    })

    return NextResponse.json({ success: true, conversion: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
