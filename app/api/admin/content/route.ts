import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET() {
  try {
    const featuredDeals = await db.opportunity.findMany({
      where: { isFeatured: true, status: 'PUBLISHED', deletedAt: null },
      take: 10,
    })

    const promotions = [
      {
        id: 'promo_hero_01',
        title: 'Kilimanjaro Solar Home Systems Expansion',
        subtitle: 'Earn TZS 45,000 per verified home installation in Arusha & Dar',
        bannerUrl: '/logo/startup.mp4',
        ctaText: 'Claim Hot Deal Exclusive',
        isLive: true,
        priority: 1,
      },
    ]

    return NextResponse.json({ promotions, featuredDeals })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))
    const { opportunityId, isFeatured } = body

    if (!opportunityId) {
      return NextResponse.json({ message: 'Missing opportunityId.' }, { status: 400 })
    }

    const updated = await db.$transaction(async (tx) => {
      const opp = await tx.opportunity.update({
        where: { id: opportunityId },
        data: { isFeatured: Boolean(isFeatured) },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: 'ADMIN_PROMOTION_FEATURED_UPDATED',
          entityType: 'OPPORTUNITY',
          entityId: opportunityId,
          afterData: { isFeatured },
        },
      })

      return opp
    })

    return NextResponse.json({ success: true, opportunity: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
