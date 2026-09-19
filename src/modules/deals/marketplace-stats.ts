import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import type { MarketplaceStats } from '@/lib/marketplace-stats'

export function activeMarketplaceWhere(now: Date): Prisma.OpportunityWhereInput {
  return {
    status: 'PUBLISHED', deletedAt: null, organization: { deletedAt: null },
    AND: [
      { OR: [{ startDate: null }, { startDate: { lte: now } }] },
      { OR: [{ endDate: null }, { endDate: { gt: now } }] },
      { OR: [{ hotDeal: null }, { hotDeal: { is: {
        status: { in: ['PRIVATE_HOT_DEAL', 'PARTNER_RELEASE'] }, visibilityStatus: 'PUBLIC_TEASER',
        verifiedAt: { not: null }, availablePartnerSlots: { gt: 0 }, inventoryAvailable: { gt: 0 },
      } } }] },
    ],
  }
}

export async function getMarketplaceStats(now = new Date()): Promise<MarketplaceStats> {
  const where = activeMarketplaceWhere(now)
  const [value, activeDeals, activePartners, verifiedResults] = await db.$transaction([
    db.opportunity.aggregate({ where: { ...where, currency: 'TZS', commercialValueMinor: { gte: 0n } }, _sum: { commercialValueMinor: true } }),
    db.opportunity.count({ where }),
    db.partnerProfile.count({ where: { user: { accountStatus: 'ACTIVE', deletedAt: null } } }),
    db.conversion.count({ where: { status: { in: ['APPROVED', 'PAYABLE', 'PAID'] }, opportunity: { deletedAt: null, organization: { deletedAt: null } } } }),
  ], { isolationLevel: 'RepeatableRead' })
  const minor = value._sum.commercialValueMinor ?? 0n
  return { totalOpportunityValue: `${minor / 100n}.${String(minor % 100n).padStart(2, '0')}`, currency: 'TZS', activeDeals, activePartners, verifiedResults, updatedAt: now.toISOString() }
}
