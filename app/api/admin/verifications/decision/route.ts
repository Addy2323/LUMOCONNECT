import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { VerificationCaseStatus } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { caseId, action, reason } = body

    if (!caseId || !action) {
      return NextResponse.json(
        { error: 'MISSING_REQUIRED_FIELDS', message: 'caseId and action are required' },
        { status: 400 }
      )
    }

    let caseStatus: VerificationCaseStatus = 'PENDING'
    let orgStatus: string = 'PENDING'

    if (action === 'APPROVE') {
      caseStatus = 'APPROVED'
      orgStatus = 'VERIFIED'
    } else if (action === 'REJECT') {
      caseStatus = 'REJECTED'
      orgStatus = 'REJECTED'
    } else if (action === 'REQUEST_INFO') {
      caseStatus = 'IN_REVIEW'
      orgStatus = 'PENDING'
    } else if (action === 'SUSPEND') {
      caseStatus = 'REJECTED'
      orgStatus = 'REJECTED'
    } else if (action === 'REQUIRE_REVERIFY') {
      caseStatus = 'IN_REVIEW'
      orgStatus = 'PENDING'
    }

    const updatedCase = await db.$transaction(async (tx) => {
      const vCase = await tx.verificationCase.findUnique({
        where: { id: caseId },
      })

      if (!vCase) {
        throw new Error('Verification case not found')
      }

      const updated = await tx.verificationCase.update({
        where: { id: caseId },
        data: {
          status: caseStatus,
        },
      })

      if (vCase.organizationId) {
        await tx.organization.update({
          where: { id: vCase.organizationId },
          data: {
            verificationStatus: orgStatus,
          },
        })
      }

      if (vCase.userId) {
        await tx.partnerProfile.updateMany({
          where: { userId: vCase.userId },
          data: {
            verificationStatus: orgStatus,
          },
        })
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          action: `verification.${action.toLowerCase()}`,
          entityType: 'VerificationCase',
          entityId: caseId,
          afterData: {
            status: caseStatus,
            reason: reason || 'Decision executed by Super Admin',
          },
        },
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      case: updatedCase,
      message: `Verification case successfully updated to ${caseStatus}`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
