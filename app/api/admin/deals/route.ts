import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'ALL'
    const typeFilter = searchParams.get('type') || 'ALL'
    const query = searchParams.get('q') || ''

    const opportunities = await db.opportunity.findMany({
      where: {
        deletedAt: null,
        ...(statusFilter !== 'ALL' ? { status: statusFilter as any } : {}),
        ...(typeFilter !== 'ALL' ? { opportunityType: typeFilter as any } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { companyName: { contains: query, mode: 'insensitive' } },
                { category: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        organization: true,
        _count: {
          select: {
            participations: true,
            conversions: true,
          },
        },
      },
    })

    const formattedDeals = opportunities.map((opp) => ({
      id: opp.id,
      title: opp.title,
      businessName: opp.companyName || opp.organization?.legalName || 'LUMO Business',
      type: opp.opportunityType,
      category: opp.category,
      region: opp.region,
      rewardDisplay: opp.rewardDisplay,
      status: opp.status,
      activePartnersCount: opp._count.participations,
      totalConversionsCount: opp._count.conversions,
      budgetTZS: Number(opp.totalBudgetTZS || 0n),
      createdAt: opp.createdAt.toISOString().slice(0, 10),
      publishedAt: opp.publishedAt ? opp.publishedAt.toISOString().slice(0, 10) : undefined,
    }))

    return NextResponse.json({ deals: formattedDeals })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))
    const { dealId, status, rejectionReason } = body

    if (!dealId || !status) {
      return NextResponse.json({ message: 'Missing dealId or status.' }, { status: 400 })
    }

    const opportunity = await db.opportunity.findUnique({
      where: { id: dealId },
    })

    if (!opportunity) {
      return NextResponse.json({ message: 'Opportunity not found.' }, { status: 404 })
    }

    const updatedOpp = await db.$transaction(async (tx) => {
      const updated = await tx.opportunity.update({
        where: { id: dealId },
        data: {
          status,
          ...(status === 'PUBLISHED' && !opportunity.publishedAt ? { publishedAt: new Date() } : {}),
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: 'ADMIN_DEAL_STATUS_UPDATED',
          entityType: 'OPPORTUNITY',
          entityId: dealId,
          beforeData: { status: opportunity.status },
          afterData: { status, rejectionReason },
        },
      })

      return updated
    })

    return NextResponse.json({ success: true, deal: updatedOpp })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
