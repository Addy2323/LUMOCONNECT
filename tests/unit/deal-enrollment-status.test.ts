import { describe, it, expect, beforeEach } from 'vitest'
import {
  listOpportunities,
  joinOpportunityDeal,
  isUserEnrolledInDeal,
  getUserEnrolledDealIds,
} from '@/modules/deals/service'
import { setUserSubscription } from '@/modules/subscriptions/service'

describe('Deal Enrollment Status & Duplicate Prevention', () => {
  const testUserId = 'usr_partner_test_enrollment'

  beforeEach(() => {
    // Setup active subscription for partner so they are authorized to join deals
    setUserSubscription(testUserId, {
      id: `sub_${testUserId}`,
      userId: testUserId,
      planCode: 'MONTHLY',
      planName: 'Monthly Member',
      status: 'ACTIVE',
      isActive: true,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      daysRemaining: 30,
    })
  })

  it('reports enrolled status correctly and prevents duplicate enrollment', () => {
    const deals = listOpportunities()
    expect(deals.length).toBeGreaterThan(0)
    const deal = deals[0]

    // Before joining
    expect(isUserEnrolledInDeal(deal.id, testUserId)).toBe(false)
    const initialEnrolledIds = getUserEnrolledDealIds(testUserId)
    expect(initialEnrolledIds.has(deal.id)).toBe(false)

    const initialPartnerCount = deal.activePartnerCount

    // First join attempt
    const firstJoin = joinOpportunityDeal(deal.id, {
      userId: testUserId,
      userRole: 'PARTNER',
    })

    expect(firstJoin.success).toBe(true)
    expect(firstJoin.trackingCode).toBeDefined()
    expect(firstJoin.isAlreadyEnrolled).toBeFalsy()
    expect(deal.activePartnerCount).toBe(initialPartnerCount + 1)

    // After joining
    expect(isUserEnrolledInDeal(deal.id, testUserId)).toBe(true)
    expect(isUserEnrolledInDeal(deal.slug, testUserId)).toBe(true)

    const updatedEnrolledIds = getUserEnrolledDealIds(testUserId)
    expect(updatedEnrolledIds.has(deal.id)).toBe(true)
    expect(updatedEnrolledIds.has(deal.slug)).toBe(true)

    // Second join attempt (Duplicate attempt)
    const secondJoin = joinOpportunityDeal(deal.id, {
      userId: testUserId,
      userRole: 'PARTNER',
    })

    expect(secondJoin.success).toBe(true)
    expect(secondJoin.isAlreadyEnrolled).toBe(true)
    // Partner count must NOT increment a second time
    expect(deal.activePartnerCount).toBe(initialPartnerCount + 1)
  })

  it('detects enrollments from localStorage when in browser environment', () => {
    const mockLocalStorage: Record<string, string> = {
      lumo_partner_joined_deals: JSON.stringify([
        {
          id: 'joined_test_1',
          opportunityId: 'opp_cement_dar_01',
          title: '500 Bags Cement',
          status: 'ACTIVE',
        },
      ]),
    }

    // Set global localStorage
    const originalLocalStorage = globalThis.localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => mockLocalStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockLocalStorage[key] = value
        },
        removeItem: (key: string) => {
          delete mockLocalStorage[key]
        },
      },
      writable: true,
      configurable: true,
    })

    try {
      const ids = getUserEnrolledDealIds()
      expect(ids.has('opp_cement_dar_01')).toBe(true)
      expect(isUserEnrolledInDeal('opp_cement_dar_01')).toBe(true)
    } finally {
      if (originalLocalStorage) {
        Object.defineProperty(globalThis, 'localStorage', {
          value: originalLocalStorage,
          writable: true,
          configurable: true,
        })
      }
    }
  })
})
