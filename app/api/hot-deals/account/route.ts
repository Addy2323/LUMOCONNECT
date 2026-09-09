import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { actor, failure, json } from '@/modules/hot-deals/auth'
import { publicTeaser, subscriptionActive } from '@/modules/hot-deals/policy'

export async function GET(request: NextRequest) {
  try {
    const user = await actor(request)
    const [subscriptions, participations, rewards, payouts, notifications, saved, preferences] = await Promise.all([
      db.userSubscription.findMany({ where: { userId: user.id }, select: { status: true, expiresAt: true, startsAt: true, cancelledAt: true, plan: { select: { name: true, isActive: true, entitlements: { select: { code: true } } } } } }),
      db.dealParticipation.findMany({ where: { partnerUserId: user.id, opportunity: { hotDeal: { isNot: null } } }, select: { id: true, status: true, joinedAt: true, opportunity: { select: { hotDeal: true } } } }),
      db.reward.findMany({ where: { partnerUserId: user.id }, select: { id: true, status: true, grossAmountMinor: true, netAmountMinor: true, createdAt: true }, take: 100, orderBy: { createdAt: 'desc' } }),
      db.payout.findMany({ where: { partnerUserId: user.id }, select: { id: true, status: true, netAmountMinor: true, createdAt: true }, take: 100, orderBy: { createdAt: 'desc' } }),
      db.notification.findMany({ where: { userId: user.id }, select: { id: true, title: true, body: true, linkUrl: true, isRead: true, createdAt: true }, take: 50, orderBy: { createdAt: 'desc' } }),
      db.hotDealSave.findMany({ where: { userId: user.id }, include: { deal: true } }),
      db.hotDealPreference.findUnique({ where: { userId: user.id } }),
    ])
    const now = new Date()
    const codes = subscriptions.filter(subscription => subscription.plan.isActive && subscriptionActive(subscription, now))
      .flatMap(subscription => subscription.plan.entitlements.map(entitlement => entitlement.code))
    const access = {
      privateMember: codes.includes('PRIVATE_MEMBER'),
      partner: codes.includes('PRIVATE_MEMBER') || codes.includes('PARTNER_SUBSCRIBER'),
      canManageDeals: user.roleAssignments.some(assignment => !assignment.organizationId && ['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE'].includes(assignment.role.code)),
    }
    return json({ access, subscriptions: subscriptions.map(subscription => ({ status: subscription.status, expiresAt: subscription.expiresAt, startsAt: subscription.startsAt, plan: { name: subscription.plan.name } })), participations: participations.map(p => ({ id: p.id, status: p.status, joinedAt: p.joinedAt, deal: p.opportunity.hotDeal && publicTeaser(p.opportunity.hotDeal) })), rewards, payouts, notifications, saved: saved.map(s => publicTeaser(s.deal)), preferences })
  } catch (error) { return failure(error) }
}
export async function POST(request: NextRequest) {
  try {
    const user = await actor(request)
    const body = await request.json()
    if (body.action === 'save') {
      const input = z.object({ dealId: z.string().uuid(), saved: z.boolean() }).parse(body)
      if (input.saved) {
        const deal = await db.hotDeal.findFirst({ where: { id: input.dealId, visibilityStatus: 'PUBLIC_TEASER', status: { in: ['PRIVATE_HOT_DEAL', 'PARTNER_RELEASE', 'SCHEDULED_PRIVATE_RELEASE'] } } })
        if (!deal) return json({ error: 'Deal not found.' }, 404)
        await db.hotDealSave.upsert({ where: { userId_dealId: { userId: user.id, dealId: input.dealId } }, update: {}, create: { userId: user.id, dealId: input.dealId } })
      } else await db.hotDealSave.deleteMany({ where: { userId: user.id, dealId: input.dealId } })
      return json({ saved: input.saved })
    }
    const preferences = z.object({ inApp: z.boolean(), email: z.boolean(), sms: z.boolean() }).parse(body)
    return json(await db.hotDealPreference.upsert({ where: { userId: user.id }, update: preferences, create: { userId: user.id, ...preferences } }))
  } catch (error) { return failure(error) }
}
