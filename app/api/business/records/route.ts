import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedBusiness } from '@/lib/business-guard'

export async function GET(request: NextRequest) {
  try {
    const business = await getAuthenticatedBusiness(request)
    const kind = request.nextUrl.searchParams.get('kind')
    const opportunity = { organizationId: business.businessId }
    let items: { id: string; title: string; detail: string; status: string; amount?: string; currency?: string }[] = []
    if (kind === 'rewards' || kind === 'payments') {
      const records = await db.reward.findMany({ where: { conversion: { opportunity } }, orderBy: { createdAt: 'desc' }, take: 100,
        select: { id: true, status: true, currency: true, netAmountMinor: true, partnerUser: { select: { name: true } }, conversion: { select: { opportunity: { select: { title: true } } } } } })
      items = records.map(record => ({ id: record.id, title: record.partnerUser.name, detail: record.conversion.opportunity.title, status: record.status, amount: (Number(record.netAmountMinor) / 100).toLocaleString('en-TZ'), currency: record.currency }))

      try {
        const opps = db.opportunity?.findMany
          ? await db.opportunity.findMany({
              where: { organizationId: business.businessId, deletedAt: null },
              select: { id: true, title: true, slug: true },
            })
          : []
        const oppIds = opps.map((o) => o.id)
        const oppTitles = opps.map((o) => o.title)
        const oppSlugs = opps.map((o) => o.slug).filter(Boolean) as string[]

        const tickets = db.referralTicket?.findMany
          ? await db.referralTicket.findMany({
              where: {
                OR: [
                  ...(oppIds.length > 0 ? [{ opportunityId: { in: oppIds } }] : []),
                  { merchantOrgId: business.businessId },
                  ...(oppTitles.length > 0 ? [{ dealTitle: { in: oppTitles } }] : []),
                  ...(oppSlugs.length > 0 ? [{ dealSlug: { in: oppSlugs } }] : []),
                ],
                AND: [
                  {
                    OR: [
                      { stage: { in: ['REWARD_PAID', 'REWARD_APPROVED', 'REWARD_PENDING', 'COMPLETED', 'SUCCESSFUL', 'IN_PROGRESS'] } },
                      { rewardStatus: { in: ['PAID', 'APPROVED', 'PENDING', 'PARTNER_CONFIRMS_RECEIPT'] } },
                      { rewardAmountTZS: { gt: 0 } },
                      { rewardDisplay: { not: null } },
                    ],
                  },
                ],
              },
              orderBy: { createdAt: 'desc' },
              take: 100,
            })
          : []

        const { extractNumericReward } = await import('@/modules/deals/referral-cases')

        for (const t of tickets) {
          const rewardVal = extractNumericReward(t.rewardAmountTZS, t.rewardDisplay)
          const formattedAmount = rewardVal > 0 ? rewardVal.toLocaleString('en-TZ') : undefined

          if (kind === 'rewards') {
            items.push({
              id: t.id,
              title: t.partnerName || 'Verified Partner',
              detail: `${t.dealTitle} (${t.ticketReference})`,
              status: t.rewardStatus || t.stage,
              amount: formattedAmount,
              currency: formattedAmount ? 'TZS' : undefined,
            })
          } else {
            // payments ledger
            const paymentStatus =
              t.stage === 'REWARD_PAID' || t.rewardStatus === 'PAID'
                ? 'PAID'
                : t.stage === 'REWARD_APPROVED' || t.rewardStatus === 'APPROVED'
                ? 'APPROVED'
                : 'PENDING'

            items.push({
              id: `pay_${t.id}`,
              title: t.partnerName || 'Verified Partner',
              detail: `Reward Obligation · ${t.dealTitle} (${t.ticketReference})`,
              status: paymentStatus,
              amount: formattedAmount,
              currency: formattedAmount ? 'TZS' : undefined,
            })
          }
        }
      } catch (ticketErr) {
        console.warn('Failed to query referral tickets for business records:', ticketErr)
      }
    } else if (kind === 'conversions') {
      const records = await db.conversion.findMany({ where: { opportunity }, orderBy: { occurredAt: 'desc' }, take: 100,
        select: { id: true, status: true, currency: true, valueMinor: true, opportunity: { select: { title: true } }, occurredAt: true } })
      items = records.map(record => ({ id: record.id, title: record.opportunity.title, detail: record.occurredAt.toISOString(), status: record.status, amount: (Number(record.valueMinor) / 100).toLocaleString('en-TZ'), currency: record.currency }))

      try {
        const opps = db.opportunity?.findMany
          ? await db.opportunity.findMany({
              where: { organizationId: business.businessId, deletedAt: null },
              select: { id: true, title: true, slug: true },
            })
          : []
        const oppIds = opps.map((o) => o.id)
        const oppTitles = opps.map((o) => o.title)
        const oppSlugs = opps.map((o) => o.slug).filter(Boolean) as string[]

        const tickets = db.referralTicket?.findMany
          ? await db.referralTicket.findMany({
              where: {
                OR: [
                  ...(oppIds.length > 0 ? [{ opportunityId: { in: oppIds } }] : []),
                  { merchantOrgId: business.businessId },
                  ...(oppTitles.length > 0 ? [{ dealTitle: { in: oppTitles } }] : []),
                  ...(oppSlugs.length > 0 ? [{ dealSlug: { in: oppSlugs } }] : []),
                ],
                stage: {
                  in: ['COMPLETED', 'REWARD_PAID', 'REWARD_APPROVED', 'SUCCESSFUL', 'INTRODUCED', 'NEGOTIATING'],
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 100,
            })
          : []

        const { extractNumericReward } = await import('@/modules/deals/referral-cases')

        for (const t of tickets) {
          const rewardVal = extractNumericReward(t.rewardAmountTZS, t.rewardDisplay)
          const customerName = `${t.customerFirstName || ''} ${t.customerLastName || ''}`.trim()
          items.push({
            id: t.id,
            title: t.dealTitle,
            detail: `${customerName ? customerName + ' · ' : ''}${t.ticketReference}`,
            status: t.stage,
            amount: rewardVal > 0 ? rewardVal.toLocaleString('en-TZ') : undefined,
            currency: rewardVal > 0 ? 'TZS' : undefined,
          })
        }
      } catch (ticketErr) {
        console.warn('Failed to query referral tickets for conversions:', ticketErr)
      }
    } else if (kind === 'team') {
      const records = await db.organizationMember.findMany({ where: { organizationId: business.businessId }, take: 100,
        select: { id: true, status: true, businessRole: true, user: { select: { name: true, email: true } } } })
      items = records.map(record => ({ id: record.id, title: record.user.name, detail: `${record.businessRole} · ${record.user.email}`, status: record.status }))
    } else if (kind === 'partners') {
      const records = await db.partnerProfile.findMany({ where: { verificationStatus: 'VERIFIED', user: { deletedAt: null, accountStatus: 'ACTIVE', participations: { some: { opportunity } } } }, take: 100,
        select: { id: true, partnerType: true, region: true, user: { select: { name: true } } } })
      items = records.map(record => ({ id: record.id, title: record.user.name, detail: [record.partnerType, record.region].filter(Boolean).join(' · '), status: 'VERIFIED' }))
    } else if (kind === 'security') {
      const user = await db.user.findUniqueOrThrow({ where: { id: business.userId }, select: { twoFactorEnabled: true } })
      items = [{ id: 'mfa', title: 'Two-factor authentication', detail: 'Current account setting', status: user.twoFactorEnabled ? 'ENABLED' : 'DISABLED' }]
    } else return Response.json({ error: 'Unknown record type' }, { status: 400 })
    return Response.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode ?? 503
    return Response.json({ error: status === 401 ? 'Please sign in.' : status === 403 ? 'Active business membership required.' : 'Unable to load business records.' }, { status })
  }
}
