import { describe, expect, it } from 'vitest'
import type { HotDeal, HotDealStatus } from '@prisma/client'
import { accessDecision, hasCapacity, publicTeaser, releaseDates, subscriptionActive } from '@/modules/hot-deals/policy'

const start = new Date('2026-09-01T09:00:00+03:00')
const deal = {
  id: 'test', teaserTitle: 'Vehicle opportunity', category: 'Vehicle Sale', location: 'Dar es Salaam',
  status: 'PRIVATE_HOT_DEAL', privateAccessEnabled: true, generalPartnerAccessEnabled: true,
  ...releaseDates(start), maximumPartnerSlots: 10, availablePartnerSlots: 10,
  inventoryTotal: 1, inventoryAvailable: 1, rewardBudget: 90000000n, rewardRemaining: 90000000n,
  rewardPerVerifiedOutcome: 90000000n, dealCapacityType: 'ONE_UNIT',
} as HotDeal

describe('Private Hot Deal policy', () => {
  it('calculates exactly 24 hours across EAT and UTC', () => {
    expect(deal.partnerReleaseAt?.toISOString()).toBe('2026-09-02T06:00:00.000Z')
    expect(deal.partnerReleaseAt!.getTime() - start.getTime()).toBe(86400000)
  })
  it('admits Private Members and denies Partners one millisecond before release', () => {
    const before = new Date(deal.partnerReleaseAt!.getTime() - 1)
    expect(accessDecision(deal, ['PRIVATE_MEMBER'], before)).toBeNull()
    expect(accessDecision(deal, ['PARTNER_SUBSCRIBER'], before)).toMatch(/Private Member/)
    expect(accessDecision(deal, [], before)).not.toBeNull()
  })
  it('admits Partners at the exact release boundary even between job ticks', () => {
    expect(accessDecision(deal, ['PARTNER_SUBSCRIBER'], deal.partnerReleaseAt!)).toBeNull()
  })
  it.each(['FULL', 'PAUSED', 'CANCELLED', 'CLOSED', 'DRAFT', 'UNDER_REVIEW'] as HotDealStatus[])('blocks %s deals', status => {
    expect(accessDecision({ ...deal, status }, ['PRIVATE_MEMBER'], start)).not.toBeNull()
  })
  it('does not count partner activations as unit sales', () => {
    expect(accessDecision({ ...deal, availablePartnerSlots: 9 }, ['PRIVATE_MEMBER'], start)).toBeNull()
    expect(deal.inventoryAvailable).toBe(1)
  })
  it('allows an existing participant when partner slots are exhausted', () => {
    expect(accessDecision({ ...deal, availablePartnerSlots: 0 }, ['PRIVATE_MEMBER'], start, true)).toBeNull()
    expect(accessDecision({ ...deal, availablePartnerSlots: 0 }, ['PRIVATE_MEMBER'], start)).not.toBeNull()
  })
  it('blocks depleted reward budget even with unlimited inventory', () => {
    expect(hasCapacity({ ...deal, dealCapacityType: 'UNLIMITED', rewardRemaining: 0n })).toBe(false)
  })
  it('returns only a public allowlist, including when secret fields are present', () => {
    const teaser = publicTeaser({ ...deal, merchant: 'SECRET', contacts: 'SECRET', documents: ['SECRET'], description: 'SECRET' } as HotDeal)
    expect(JSON.stringify(teaser)).not.toContain('SECRET')
    expect(teaser.rewardMinor).toBe('90000000')
    expect(Object.keys(teaser).sort()).toEqual(['id', 'title', 'titleSw', 'category', 'location', 'rewardMinor', 'inventoryAvailable', 'inventoryTotal', 'availablePartnerSlots', 'capacityType', 'releaseAt', 'startsAt', 'status', 'verified'].sort())
  })
  it('rejects expired, future, cancelled and indefinite subscriptions', () => {
    const subscription = { status: 'ACTIVE' as const, startsAt: start, expiresAt: deal.partnerReleaseAt, cancelledAt: null }
    expect(subscriptionActive(subscription, start)).toBe(true)
    expect(subscriptionActive(subscription, deal.partnerReleaseAt!)).toBe(false)
    expect(subscriptionActive({ ...subscription, expiresAt: null }, start)).toBe(false)
    expect(subscriptionActive({ ...subscription, cancelledAt: start }, start)).toBe(false)
    expect(subscriptionActive(subscription, new Date(start.getTime() - 1))).toBe(false)
  })
})
