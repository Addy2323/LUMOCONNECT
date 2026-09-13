import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET() {
  try {
    const pendingDeals = await db.opportunity.findMany({
      where: {
        status: 'UNDER_REVIEW',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        organization: true,
        category: true,
        publishedVersion: true,
      },
    })

    const formattedApprovals = pendingDeals.map((opp) => ({
      id: opp.id,
      title: opp.title,
      companyName: opp.organization?.tradingName || opp.organization?.legalName || 'Business',
      type: opp.opportunityType,
      category: opp.category?.name || 'General',
      rewardDisplay: opp.publishedVersion?.rewardSummary || 'Standard Reward',
      submittedAt: opp.createdAt.toISOString().slice(0, 10),
      budgetTZS: Number(opp.totalBudgetMinor ? opp.totalBudgetMinor / 100n : 0n),
      status: opp.status,
    }))

    return NextResponse.json({ approvals: formattedApprovals })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))
    const { dealId, action, notes } = body // action = 'APPROVE' | 'REJECT'

    if (!dealId || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ message: 'Invalid payload.' }, { status: 400 })
    }

    const opportunity = await db.opportunity.findUnique({
      where: { id: dealId },
    })

    if (!opportunity) {
      return NextResponse.json({ message: 'Opportunity not found.' }, { status: 404 })
    }

    const targetStatus = action === 'APPROVE' ? 'PUBLISHED' : 'RETURNED'

    const updated = await db.$transaction(async (tx) => {
      const opp = await tx.opportunity.update({
        where: { id: dealId },
        data: {
          status: targetStatus,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: action === 'APPROVE' ? 'ADMIN_DEAL_APPROVED' : 'ADMIN_DEAL_REJECTED',
          entityType: 'OPPORTUNITY',
          entityId: dealId,
          afterData: { action, notes, targetStatus },
        },
      })

      return opp
    })

    return NextResponse.json({ success: true, deal: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
