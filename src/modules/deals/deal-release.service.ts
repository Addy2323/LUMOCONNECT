import type { Prisma, HotDeal } from '@prisma/client'

export type Tx = Prisma.TransactionClient

export interface ReleaseDatesCalculation {
  privateAccessStartAt: Date
  privateAccessEndsAt: Date
  partnerReleaseAt: Date
}

/**
 * Calculates deterministic server-side release dates.
 * Defaults to 24 hours.
 */
export function calculateReleaseDates(startAt = new Date(), durationHours = 24): ReleaseDatesCalculation {
  if (!Number.isInteger(durationHours) || durationHours < 1 || durationHours > 168) {
    throw new Error('Access duration must be an integer between 1 and 168 hours.')
  }
  const endAt = new Date(startAt.getTime() + durationHours * 3600000)
  return {
    privateAccessStartAt: startAt,
    privateAccessEndsAt: endAt,
    partnerReleaseAt: endAt,
  }
}

/**
 * Evaluates whether a deal is due for automated release to the general Partner network.
 */
export function isDealDueForPartnerRelease(deal: HotDeal, now = new Date()): boolean {
  if (deal.status !== 'PRIVATE_HOT_DEAL') return false
  if (!deal.partnerReleaseAt || now < deal.partnerReleaseAt) return false
  if (!deal.generalPartnerAccessEnabled) return false
  if (deal.dealCapacityType !== 'UNLIMITED' && deal.inventoryAvailable <= 0) return false
  if (deal.rewardRemaining <= 0n) return false
  if (deal.availablePartnerSlots <= 0) return false
  if (['FULL', 'PAUSED', 'CANCELLED', 'CLOSED'].includes(deal.status)) return false

  return true
}

/**
 * Idempotently transitions a single deal from PRIVATE_HOT_DEAL to PARTNER_RELEASE.
 * Returns true if a transition occurred, false if already released or not due.
 */
export async function executePartnerRelease(
  tx: Tx,
  dealId: string,
  now = new Date()
): Promise<{ transitioned: boolean; deal: HotDeal }> {
  // Concurrency row lock
  await tx.$queryRaw`SELECT id FROM hot_deals WHERE id = ${dealId}::uuid FOR UPDATE`

  const deal = await tx.hotDeal.findUniqueOrThrow({
    where: { id: dealId },
  })

  if (!isDealDueForPartnerRelease(deal, now)) {
    return { transitioned: false, deal }
  }

  const updatedDeal = await tx.hotDeal.update({
    where: { id: dealId },
    data: {
      status: 'PARTNER_RELEASE',
      version: { increment: 1 },
    },
  })

  // Create audit record
  await tx.auditLog.create({
    data: {
      entityType: 'HotDeal',
      entityId: dealId,
      action: 'hot_deal.partner_release',
      beforeData: { status: deal.status },
      afterData: {
        status: 'PARTNER_RELEASE',
        reason: 'Automated 24-hour server-side release window expiry',
        releasedAt: now.toISOString(),
      },
    },
  })

  // Idempotent outbox notification event (key ensures uniqueness)
  const eventKey = `${dealId}:RELEASE:${deal.partnerReleaseAt?.toISOString() ?? 'default'}`
  await tx.hotDealEvent.upsert({
    where: { key: eventKey },
    update: {},
    create: {
      dealId,
      key: eventKey,
      audience: 'PARTNER_SUBSCRIBER',
      title: 'Released to Partners',
      body: `${deal.teaserTitle} is now available to all subscribed Partners. Participation and verification terms apply.`,
    },
  })

  return { transitioned: true, deal: updatedDeal }
}
