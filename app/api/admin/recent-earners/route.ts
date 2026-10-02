import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'
import { isValidRequestOrigin } from '@/lib/origin'
import { earningsConfigSchema, maskEarner, type PublicEarning } from '@/lib/public-earnings'

async function authorized(request: NextRequest) {
  const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
  return session?.user.roleAssignments.some((assignment) =>
    ['ADMIN', 'SUPER_ADMIN'].includes(assignment.role.code)
  )
}

export async function GET(request: NextRequest) {
  if (!(await authorized(request))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const configData = await db.publicEarningsConfig.findUnique({ where: { id: 'global' } })
  const config = earningsConfigSchema.parse(configData ?? {})

  // Also query recent earnings for admin auditing
  const rewards = await db.reward.findMany({
    where: {
      status: { in: ['PAID', 'APPROVED', 'PAYABLE'] },
      approvedAt: { not: null },
      netAmountMinor: { gt: 0n },
    },
    orderBy: [{ approvedAt: 'desc' }, { id: 'desc' }],
    take: 50,
    select: {
      id: true,
      netAmountMinor: true,
      currency: true,
      status: true,
      showInPublicEarningsFeed: true,
      approvedAt: true,
      partnerUser: {
        select: {
          name: true,
          phone: true,
          partnerProfile: {
            select: {
              handle: true,
              publicEarningsOptOut: true,
            },
          },
        },
      },
      conversion: {
        select: {
          opportunity: {
            select: {
              title: true,
              opportunityType: true,
              marketScope: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const earningsList: (PublicEarning & {
    rawPartnerName: string
    publicOptOut: boolean
  })[] = rewards.map((reward) => {
    const opp = reward.conversion?.opportunity
    const categoryName = opp?.category?.name || opp?.opportunityType || 'Commercial Deal'
    const dealTitle = opp?.title || 'Verified Opportunity'
    const dealType: 'LOCAL' | 'INTERNATIONAL' =
      opp?.marketScope === 'INTERNATIONAL' ? 'INTERNATIONAL' : 'LOCAL'

    const identityInput =
      reward.partnerUser.partnerProfile?.handle ||
      reward.partnerUser.name ||
      reward.partnerUser.phone

    return {
      id: reward.id,
      maskedIdentity: maskEarner(identityInput, config.maskDigits),
      rawPartnerName: reward.partnerUser.name || reward.partnerUser.phone || 'Partner',
      publicOptOut: reward.partnerUser.partnerProfile?.publicEarningsOptOut ?? false,
      amount: Number(reward.netAmountMinor) / 100,
      currency: reward.currency || 'TZS',
      category: categoryName,
      dealTitle,
      dealType,
      status: reward.status,
      earnedAt: (reward.approvedAt || new Date()).toISOString(),
      showInFeed: reward.showInPublicEarningsFeed,
    }
  })

  return Response.json({
    config,
    earnings: earningsList,
  })
}

export async function PUT(request: NextRequest) {
  if (!isValidRequestOrigin(request)) {
    return Response.json({ error: 'Invalid origin' }, { status: 403 })
  }
  if (!(await authorized(request))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = earningsConfigSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Invalid configuration' }, { status: 400 })
  }

  const config = await db.publicEarningsConfig.upsert({
    where: { id: 'global' },
    create: { id: 'global', ...parsed.data },
    update: parsed.data,
  })

  return Response.json(earningsConfigSchema.parse(config))
}

export async function PATCH(request: NextRequest) {
  if (!isValidRequestOrigin(request)) {
    return Response.json({ error: 'Invalid origin' }, { status: 403 })
  }
  if (!(await authorized(request))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { rewardId, showInPublicEarningsFeed } = await request.json()
    if (!rewardId || typeof showInPublicEarningsFeed !== 'boolean') {
      return Response.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const updated = await db.reward.update({
      where: { id: rewardId },
      data: { showInPublicEarningsFeed },
    })

    return Response.json({ success: true, rewardId: updated.id, showInPublicEarningsFeed: updated.showInPublicEarningsFeed })
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to update visibility' }, { status: 500 })
  }
}
