import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'
import { listOpportunities } from '@/modules/deals/service'
import type { JoinedDealItem, JoinedDealStatus } from '@/components/dashboards/partner/types'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
    const session = await getDatabaseSession(sessionToken)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const userId = session.userId
    const catalogOpps = listOpportunities()

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json({ success: true, deals: [] })
    }

    // Query DB participations for this user only
    const participations = await db.dealParticipation.findMany({
      where: { partnerUserId: userId },
      include: {
        opportunity: {
          include: {
            organization: true,
            publishedVersion: true,
          },
        },
        trackingAssets: true,
      },
      orderBy: { joinedAt: 'desc' },
    })

    // Also get all tickets for this user to correlate stages accurately
    const userTickets = await db.referralTicket.findMany({
      where: { partnerUserId: userId },
      orderBy: { createdAt: 'desc' },
    }).catch(() => [] as any[])

    const partnerCode = (session.user.name || 'partner').toLowerCase().replace(/[^a-z0-9]/g, '_')

    const deals: JoinedDealItem[] = participations.map((p) => {
      const opp = p.opportunity
      const catalogMatch = catalogOpps.find(
        (c) => c.id === opp.id || c.slug === opp.slug
      )

      const title = opp.title || catalogMatch?.title || 'Opportunity'
      const slug = opp.slug || catalogMatch?.slug || opp.id
      const businessName = opp.organization?.tradingName || opp.organization?.legalName || catalogMatch?.companyName || 'Lumo Commercial'
      const category = catalogMatch?.category || 'General'
      const status: JoinedDealStatus = (p.status as any) || 'ACTIVE'
      const trackingCode = p.trackingAssets[0]?.code || `LUMO-${partnerCode.slice(0, 4).toUpperCase()}-${p.id.slice(0, 4)}`

      const rewardDisplay = catalogMatch?.rewardDisplay || 'Commercial Partner Commission'
      const rewardValueTZS = catalogMatch ? Number((catalogMatch as any).baseRewardValue || (catalogMatch as any).rewardValue || 50000) : 50000

      const matchingTickets = userTickets.filter((t: any) =>
        t.opportunityId === opp.id ||
        t.dealId === opp.id ||
        t.dealId === slug ||
        t.dealSlug === slug ||
        (catalogMatch && (t.dealId === catalogMatch.id || t.dealId === catalogMatch.slug))
      )
      const latestTicket = matchingTickets[0] || null
      const activeLeads = matchingTickets.length

      return {
        id: p.id,
        opportunityId: opp.id,
        slug,
        title,
        businessName,
        category,
        status,
        joinedDate: p.joinedAt.toISOString().slice(0, 10),
        rewardDisplay,
        rewardValueTZS,
        trackingLink: `https://lumo.co.tz/d/${slug}?partner=${partnerCode}`,
        referralId: trackingCode,
        promoCode: `${partnerCode.slice(0, 4).toUpperCase()}${slug.slice(0, 4).toUpperCase()}`,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://lumo.co.tz/d/${slug}?partner=${partnerCode}`,
        activeLeadsCount: activeLeads,
        latestReferralStage: latestTicket?.stage || undefined,
        latestReferralTicketRef: latestTicket?.ticketReference || undefined,
        latestReferralCustomerName: latestTicket?.customerFirstName
          ? `${latestTicket.customerFirstName} ${latestTicket.customerLastName || ''}`.trim()
          : undefined,
        latestReferralDate: latestTicket?.createdAt ? new Date(latestTicket.createdAt).toISOString() : undefined,
        verifiedConversionsCount: 0,
        earningsEarnedTZS: 0,
        deliverablesSummary: opp.description || catalogMatch?.description || 'Commercial lead and referral acquisition',
        evidenceRequired: catalogMatch?.termsAndConditions || 'Verified customer proof and merchant sign-off.',
        milestoneProgressPercent: activeLeads > 0 ? 50 : 0,
        canExit: true,
        coverImageUrl: catalogMatch?.featuredImageUrl,
        promoVideoUrl: catalogMatch?.promoVideoUrl,
      }
    })

    return NextResponse.json({ success: true, deals })
  } catch (error: any) {
    console.error('Partner deals fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to retrieve partner deals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
    const session = await getDatabaseSession(sessionToken)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const userId = session.userId
    const body = await request.json().catch(() => ({}))
    const { opportunityId, dealId, slug } = body

    if (!opportunityId && !dealId && !slug) {
      return NextResponse.json({ success: false, error: 'Opportunity ID or slug is required' }, { status: 400 })
    }

    const catalogOpps = listOpportunities()
    const catalogMatch = catalogOpps.find(
      (c) => c.id === opportunityId || c.id === dealId || c.slug === slug || c.slug === dealId
    )

    if (process.env.DATABASE_URL?.trim()) {
      // 1. Ensure PartnerProfile exists
      await db.partnerProfile.upsert({
        where: { userId },
        create: {
          userId,
          handle: `partner_${userId.slice(0, 8)}`,
          partnerType: 'AFFILIATE',
          categories: ['SOLAR', 'FINTECH', 'ECOMMERCE'],
        },
        update: {},
      }).catch(() => {})

      // 2. Resolve or find database Opportunity
      let dbOpp = null
      if (opportunityId && opportunityId.length === 36) {
        dbOpp = await db.opportunity.findUnique({
          where: { id: opportunityId },
          include: { publishedVersion: true, versions: true, organization: true },
        })
      }
      if (!dbOpp && slug) {
        dbOpp = await db.opportunity.findFirst({
          where: { slug },
          include: { publishedVersion: true, versions: true, organization: true },
        })
      }
      if (!dbOpp && catalogMatch) {
        dbOpp = await db.opportunity.findFirst({
          where: { slug: catalogMatch.slug },
          include: { publishedVersion: true, versions: true, organization: true },
        })
      }

      // If opportunity not yet in DB, create organization and opportunity from catalog item
      if (!dbOpp && catalogMatch) {
        const org = await db.organization.create({
          data: {
            legalName: catalogMatch.companyName || 'Lumo Commercial Merchant',
            tradingName: catalogMatch.companyName || 'Lumo Commercial Merchant',
            slug: `merchant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            verificationStatus: 'VERIFIED',
          },
        })

        const opportunity = await db.opportunity.create({
          data: {
            organizationId: org.id,
            title: catalogMatch.title,
            slug: catalogMatch.slug,
            summary: catalogMatch.summary || catalogMatch.title,
            description: catalogMatch.description,
            status: 'PUBLISHED',
            opportunityType: 'CUSTOMER_ACQUISITION',
            currency: 'TZS',
          },
          include: { organization: true },
        })

        const version = await db.opportunityVersion.create({
          data: {
            opportunityId: opportunity.id,
            versionNumber: 1,
            title: catalogMatch.title,
            description: catalogMatch.description,
            termsHash: 'sha256_canonical_terms',
            termsAndConditions: catalogMatch.termsAndConditions || 'Standard promotional terms.',
            rewardSummary: catalogMatch.rewardDisplay || 'Commercial Reward',
          },
        })

        await db.opportunity.update({
          where: { id: opportunity.id },
          data: { publishedVersionId: version.id },
        })

        dbOpp = {
          ...opportunity,
          publishedVersion: version,
          publishedVersionId: version.id,
          versions: [version],
        }
      }

      if (dbOpp) {
        const versionId = dbOpp.publishedVersionId || dbOpp.versions[0]?.id
        if (!versionId) {
          return NextResponse.json({ success: false, error: 'Deal agreement terms unavailable' }, { status: 409 })
        }

        const participation = await db.dealParticipation.upsert({
          where: {
            opportunityId_partnerUserId: {
              opportunityId: dbOpp.id,
              partnerUserId: userId,
            },
          },
          create: {
            opportunityId: dbOpp.id,
            partnerUserId: userId,
            acceptedVersionId: versionId,
            status: 'ACTIVE',
          },
          update: {
            status: 'ACTIVE',
          },
          include: {
            trackingAssets: true,
          },
        })

        // Audit log
        await db.auditLog.create({
          data: {
            actorUserId: userId,
            action: 'PARTNER_DEAL_ENROLLED',
            entityType: 'DealParticipation',
            entityId: participation.id,
            afterData: { opportunityId: dbOpp.id, title: dbOpp.title },
          },
        }).catch(() => {})

        const partnerCode = (session.user.name || 'partner').toLowerCase().replace(/[^a-z0-9]/g, '_')
        const trackingCode = participation.trackingAssets[0]?.code || `LUMO-${partnerCode.slice(0, 4).toUpperCase()}-${participation.id.slice(0, 4)}`

        const newJoined: JoinedDealItem = {
          id: participation.id,
          opportunityId: dbOpp.id,
          slug: dbOpp.slug,
          title: dbOpp.title,
          businessName: dbOpp.organization?.tradingName || dbOpp.organization?.legalName || 'Lumo Commercial',
          category: catalogMatch?.category || 'General',
          status: 'ACTIVE',
          joinedDate: participation.joinedAt.toISOString().slice(0, 10),
          rewardDisplay: catalogMatch?.rewardDisplay || 'Commercial Commission',
          rewardValueTZS: catalogMatch ? Number((catalogMatch as any).baseRewardValue || (catalogMatch as any).rewardValue || 50000) : 50000,
          trackingLink: `https://lumo.co.tz/d/${dbOpp.slug}?partner=${partnerCode}`,
          referralId: trackingCode,
          promoCode: `${partnerCode.slice(0, 4).toUpperCase()}${dbOpp.slug.slice(0, 4).toUpperCase()}`,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://lumo.co.tz/d/${dbOpp.slug}?partner=${partnerCode}`,
          activeLeadsCount: 0,
          verifiedConversionsCount: 0,
          earningsEarnedTZS: 0,
          deliverablesSummary: (catalogMatch as any)?.deliverablesSummary || dbOpp.description || 'Commercial lead and referral acquisition',
          evidenceRequired: catalogMatch?.termsAndConditions || 'Verified customer proof and merchant sign-off.',
          milestoneProgressPercent: 0,
          canExit: true,
          coverImageUrl: catalogMatch?.featuredImageUrl,
          promoVideoUrl: catalogMatch?.promoVideoUrl,
        }

        return NextResponse.json({ success: true, deal: newJoined }, { status: 201 })
      }
    }

    // Fallback if DB is unavailable
    const partnerCode = (session.user.name || 'partner').toLowerCase().replace(/[^a-z0-9]/g, '_')
    const fallbackSlug = catalogMatch?.slug || slug || opportunityId || 'deal'
    const fallbackItem: JoinedDealItem = {
      id: `joined_${Date.now()}`,
      opportunityId: opportunityId || dealId || 'opp_default',
      slug: fallbackSlug,
      title: catalogMatch?.title || body.title || 'Opportunity',
      businessName: catalogMatch?.companyName || 'Lumo Commercial',
      category: catalogMatch?.category || 'General',
      status: 'ACTIVE',
      joinedDate: new Date().toISOString().slice(0, 10),
      rewardDisplay: catalogMatch?.rewardDisplay || 'Commission',
      rewardValueTZS: 50000,
      trackingLink: `https://lumo.co.tz/d/${catalogMatch?.slug || 'deal'}?partner=${partnerCode}`,
      referralId: `LUMO-${partnerCode.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      promoCode: `${partnerCode.slice(0, 4).toUpperCase()}`,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://lumo.co.tz/d/${catalogMatch?.slug || 'deal'}?partner=${partnerCode}`,
      activeLeadsCount: 0,
      verifiedConversionsCount: 0,
      earningsEarnedTZS: 0,
      deliverablesSummary: catalogMatch?.description || 'Commercial promotion',
      evidenceRequired: 'Verified matching',
      milestoneProgressPercent: 0,
      canExit: true,
    }

    return NextResponse.json({ success: true, deal: fallbackItem }, { status: 201 })
  } catch (error: any) {
    console.error('Partner deal join error:', error)
    return NextResponse.json({ success: false, error: 'Failed to enroll in opportunity' }, { status: 500 })
  }
}
