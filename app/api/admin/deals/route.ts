import { OpportunityStatus, OpportunityType } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSession } from '@/lib/admin-session'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'ALL'
    const typeFilter = searchParams.get('type') || 'ALL'
    const query = searchParams.get('q') || ''
    if ((statusFilter !== 'ALL' && !Object.values(OpportunityStatus).includes(statusFilter as OpportunityStatus)) || (typeFilter !== 'ALL' && !Object.values(OpportunityType).includes(typeFilter as OpportunityType))) return NextResponse.json({ error: 'Invalid deal filter.' }, { status: 400 })

    const opportunities = await db.opportunity.findMany({
      where: {
        deletedAt: null,
        ...(statusFilter !== 'ALL' ? { status: statusFilter as OpportunityStatus } : {}),
        ...(typeFilter !== 'ALL' ? { opportunityType: typeFilter as OpportunityType } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { organization: { legalName: { contains: query, mode: 'insensitive' } } },
                { category: { name: { contains: query, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        organization: true,
        category: true,
        publishedVersion: { include: { rewardRules: true } },
        _count: {
          select: {
            participations: { where: { status: 'ACTIVE' } },
            conversions: true,
          },
        },
      },
    })

    const formattedDeals = opportunities.map((opp) => ({
      id: opp.id,
      title: opp.title,
      businessName: opp.organization?.tradingName || opp.organization?.legalName || 'LUMO Business',
      type: opp.opportunityType,
      category: opp.category?.name || 'General',
      region: opp.region,
      rewardDisplay: opp.publishedVersion?.rewardSummary || 'Terms not recorded',
      status: opp.status,
      activePartnersCount: opp._count.participations,
      activePartners: opp._count.participations,
      version: opp.publishedVersion?.versionNumber ?? null,
      slug: opp.slug,
      summary: opp.summary,
      description: opp.description,
      featuredImageUrl: opp.coverImageUrl,
      promoVideoUrl: opp.promoVideoUrl,
      galleryImageUrls: opp.galleryImageUrls,
      termsAndConditions: opp.publishedVersion?.termsAndConditions ?? null,
      spentTZS: Number(opp.spentBudgetMinor) / 100,
      budgetRecorded: opp.totalBudgetMinor !== null,
      totalConversionsCount: opp._count.conversions,
      budgetTZS: Number(opp.totalBudgetMinor ? opp.totalBudgetMinor / 100n : 0n),
      createdAt: opp.createdAt.toISOString().slice(0, 10),
      publishedAt: opp.publishedVersion ? opp.publishedVersion.effectiveAt.toISOString().slice(0, 10) : undefined,
    }))

    return NextResponse.json({ deals: formattedDeals })
  } catch {
    return NextResponse.json({ error: 'Unable to process the deal request. Please refresh and retry.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    if (!session) return NextResponse.json({ error: 'Session expired.' }, { status: 401 })
    const actorId = session.userId

    const body = await request.json().catch(() => ({}))
    const { dealId, status, rejectionReason } = body

    if (typeof dealId !== 'string' || !/^[0-9a-f-]{36}$/i.test(dealId) || !['PAUSED', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      return NextResponse.json({ message: 'Missing dealId or status.' }, { status: 400 })
    }

    const opportunity = await db.opportunity.findUnique({
      where: { id: dealId },
    })

    if (!opportunity) {
      return NextResponse.json({ message: 'Opportunity not found.' }, { status: 404 })
    }

    const allowed = status === 'ARCHIVED' ? opportunity.status !== 'ARCHIVED' : (status === 'PAUSED' ? opportunity.status === 'PUBLISHED' : opportunity.status === 'PAUSED' && !!opportunity.publishedVersionId)
    if (!allowed) return NextResponse.json({ error: 'This status transition is not allowed. Use the approval workflow to publish a draft.' }, { status: 409 })

    const updatedOpp = await db.$transaction(async (tx) => {
      const updated = await tx.opportunity.update({
        where: { id: dealId, status: opportunity.status },
        data: {
          status,
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

    return NextResponse.json({ success: true, deal: { id: updatedOpp.id, status: updatedOpp.status } })
  } catch {
    return NextResponse.json({ error: 'Unable to process the deal request. Please refresh and retry.' }, { status: 500 })
  }
}
