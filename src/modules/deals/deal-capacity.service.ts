import type { Prisma, HotDeal } from '@prisma/client'

export type Tx = Prisma.TransactionClient

export class CapacityExceededError extends Error {
  constructor(message: string, public statusCode = 409) {
    super(message)
    this.name = 'CapacityExceededError'
  }
}

export interface CapacityReservationResult {
  dealId: string
  unitsReserved: number
  inventoryRemaining: number
  rewardReservedMinor: bigint
  rewardBudgetRemainingMinor: bigint
  newStatus: HotDeal['status']
}

/**
 * Atomically reserves inventory and reward budget for an in-progress customer lead/conversion.
 * Transitions status to RESERVED or FULL if remaining inventory drops to zero.
 */
export async function reserveDealCapacity(
  tx: Tx,
  dealId: string,
  unitsToReserve = 1
): Promise<CapacityReservationResult> {
  // Row-level exclusive lock on the deal
  await tx.$queryRaw`SELECT id FROM hot_deals WHERE id = ${dealId}::uuid FOR UPDATE`

  const deal = await tx.hotDeal.findUniqueOrThrow({
    where: { id: dealId },
  })

  if (deal.dealCapacityType !== 'UNLIMITED' && deal.inventoryAvailable < unitsToReserve) {
    throw new CapacityExceededError(
      `Insufficient inventory available to reserve ${unitsToReserve} unit(s). Remaining: ${deal.inventoryAvailable}`
    )
  }

  const requiredReward = deal.rewardPerVerifiedOutcome * BigInt(unitsToReserve)
  if (deal.rewardRemaining < requiredReward) {
    throw new CapacityExceededError(
      `Insufficient reward budget remaining. Required: ${requiredReward}, Remaining: ${deal.rewardRemaining}`
    )
  }

  const newInventory = deal.dealCapacityType === 'UNLIMITED' ? deal.inventoryAvailable : deal.inventoryAvailable - unitsToReserve
  const newReservedUnits = deal.reservedUnits + unitsToReserve
  const newRewardRemaining = deal.rewardRemaining - requiredReward

  let newStatus = deal.status
  if (deal.dealCapacityType !== 'UNLIMITED' && newInventory === 0) {
    newStatus = 'RESERVED'
  }

  await tx.hotDeal.update({
    where: { id: dealId },
    data: {
      inventoryAvailable: newInventory,
      reservedUnits: newReservedUnits,
      rewardRemaining: newRewardRemaining,
      status: newStatus,
      version: { increment: 1 },
    },
  })

  return {
    dealId,
    unitsReserved: unitsToReserve,
    inventoryRemaining: newInventory,
    rewardReservedMinor: requiredReward,
    rewardBudgetRemainingMinor: newRewardRemaining,
    newStatus,
  }
}

/**
 * Releases a prior reservation back to available inventory and reward budget (e.g., if lead expired or rejected).
 */
export async function releaseDealCapacity(
  tx: Tx,
  dealId: string,
  unitsToRelease = 1
): Promise<void> {
  await tx.$queryRaw`SELECT id FROM hot_deals WHERE id = ${dealId}::uuid FOR UPDATE`

  const deal = await tx.hotDeal.findUniqueOrThrow({
    where: { id: dealId },
  })

  const releasedReward = deal.rewardPerVerifiedOutcome * BigInt(unitsToRelease)
  const newInventory = deal.dealCapacityType === 'UNLIMITED' ? deal.inventoryAvailable : deal.inventoryAvailable + unitsToRelease
  const newReservedUnits = Math.max(0, deal.reservedUnits - unitsToRelease)
  const newRewardRemaining = deal.rewardRemaining + releasedReward

  let restoredStatus = deal.status
  if (deal.status === 'RESERVED' || deal.status === 'FULL') {
    const isReleased = deal.partnerReleaseAt && deal.partnerReleaseAt <= new Date()
    restoredStatus = isReleased ? 'PARTNER_RELEASE' : 'PRIVATE_HOT_DEAL'
  }

  await tx.hotDeal.update({
    where: { id: dealId },
    data: {
      inventoryAvailable: newInventory,
      reservedUnits: newReservedUnits,
      rewardRemaining: newRewardRemaining,
      status: restoredStatus,
      version: { increment: 1 },
    },
  })
}

/**
 * Finalizes a verified conversion, permanently deducting from reservedUnits.
 * If all units across the opportunity are converted, marks deal as FULL.
 */
export async function commitVerifiedCapacity(
  tx: Tx,
  dealId: string,
  unitsToCommit = 1
): Promise<void> {
  await tx.$queryRaw`SELECT id FROM hot_deals WHERE id = ${dealId}::uuid FOR UPDATE`

  const deal = await tx.hotDeal.findUniqueOrThrow({
    where: { id: dealId },
  })

  const newReservedUnits = Math.max(0, deal.reservedUnits - unitsToCommit)
  const isCompletelyFull =
    deal.dealCapacityType !== 'UNLIMITED' && deal.inventoryAvailable === 0 && newReservedUnits === 0

  await tx.hotDeal.update({
    where: { id: dealId },
    data: {
      reservedUnits: newReservedUnits,
      status: isCompletelyFull ? 'FULL' : deal.status,
      version: { increment: 1 },
    },
  })
}

/**
 * Reserves one of the allowed Partner marketing participant slots.
 */
export async function reservePartnerSlot(tx: Tx, dealId: string): Promise<number> {
  await tx.$queryRaw`SELECT id FROM hot_deals WHERE id = ${dealId}::uuid FOR UPDATE`

  const deal = await tx.hotDeal.findUniqueOrThrow({
    where: { id: dealId },
  })

  if (deal.availablePartnerSlots <= 0) {
    throw new CapacityExceededError('All available Partner participation slots have been taken.')
  }

  const updated = await tx.hotDeal.update({
    where: { id: dealId },
    data: {
      availablePartnerSlots: { decrement: 1 },
      version: { increment: 1 },
    },
  })

  return updated.availablePartnerSlots
}
