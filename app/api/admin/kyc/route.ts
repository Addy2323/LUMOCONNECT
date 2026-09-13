import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET() {
  try {
    const kycCases = await db.verificationCase.findMany({
      where: { organizationId: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: true,
        documents: {
          include: {
            fileAsset: true,
          },
        },
      },
    })

    const formattedKyc = kycCases.map((k) => ({
      id: k.id,
      userId: k.userId,
      partnerName: k.user?.name || 'Partner',
      email: k.user?.email || '—',
      phone: k.user?.phone || '—',
      status: k.status,
      submittedAt: k.createdAt.toISOString().slice(0, 10),
      documentCount: k.documents.length,
    }))

    return NextResponse.json({ kycCases: formattedKyc })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))
    const { caseId, status } = body // status = 'APPROVED' | 'REJECTED'

    if (!caseId || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ message: 'Invalid payload.' }, { status: 400 })
    }

    const updated = await db.$transaction(async (tx) => {
      const kCase = await tx.verificationCase.update({
        where: { id: caseId },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedByUserId: actorId,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: status === 'APPROVED' ? 'ADMIN_KYC_APPROVED' : 'ADMIN_KYC_REJECTED',
          entityType: 'VERIFICATION_CASE',
          entityId: caseId,
          afterData: { status },
        },
      })

      return kCase
    })

    return NextResponse.json({ success: true, case: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
