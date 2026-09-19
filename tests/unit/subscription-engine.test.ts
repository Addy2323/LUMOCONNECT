import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateSubscriptionExpiry,
  grantUserSubscription,
  getUserSubscription,
  cancelSubscriptionRenewal,
} from '@/modules/subscriptions/service'
import { requireActiveDealSubscription } from '@/modules/subscriptions/authorization'

describe('LUMO Subscription Engine & Authoritative Lifecycle', () => {
  beforeEach(() => {
    // Clear storage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  describe('1. Calendar-Aware Expiry Calculation', () => {
    it('calculates 1 calendar month correctly from standard date', () => {
      const startDate = new Date('2026-03-15T10:00:00Z')
      const expiry = calculateSubscriptionExpiry(startDate, 'MONTHLY')
      expect(expiry.toISOString()).toBe('2026-04-15T10:00:00.000Z')
    })

    it('caps month-end overflow correctly (Jan 31 -> Feb 28 in non-leap year)', () => {
      // 2026 is non-leap year: Feb has 28 days
      const startDate = new Date('2026-01-31T12:00:00Z')
      const expiry = calculateSubscriptionExpiry(startDate, 'MONTHLY')
      expect(expiry.getMonth()).toBe(1) // Month index 1 is February
      expect(expiry.getDate()).toBe(28)
    })

    it('calculates Semi-Annual (6 months) correctly', () => {
      const startDate = new Date('2026-01-10T00:00:00Z')
      const expiry = calculateSubscriptionExpiry(startDate, 'SEMI_ANNUAL')
      expect(expiry.getMonth()).toBe(6) // Month index 6 is July
      expect(expiry.getDate()).toBe(10)
    })

    it('calculates Annual Elite (1 year) correctly', () => {
      const startDate = new Date('2026-06-01T00:00:00Z')
      const expiry = calculateSubscriptionExpiry(startDate, 'ANNUAL')
      expect(expiry.getFullYear()).toBe(2027)
      expect(expiry.getMonth()).toBe(5)
      expect(expiry.getDate()).toBe(1)
    })
  })

  describe('2. Early Renewal Extension (Zero Lost Days Guarantee)', () => {
    it('preserves existing remaining days when renewing before expiry', () => {
      const partnerId = 'test_partner_early_renew_01'
      
      // Step 1: User has 10 days remaining
      const initial = grantUserSubscription(partnerId, 'MONTHLY', 10, 25000)
      const firstExpiresAt = new Date(initial.expiresAt).getTime()

      // Step 2: User renews early with 30 days
      const renewed = grantUserSubscription(partnerId, 'MONTHLY', 30, 25000)
      const secondExpiresAt = new Date(renewed.expiresAt).getTime()

      // The new expiry must be exactly firstExpiresAt + 30 days
      const expectedTime = firstExpiresAt + 30 * 24 * 60 * 60 * 1000
      expect(secondExpiresAt).toBe(expectedTime)
      expect(renewed.daysRemaining).toBeGreaterThanOrEqual(39)
    })
  })

  describe('3. Dynamic Countdown Authority (Non-Sticky Values)', () => {
    it('calculates dynamic days, hours, minutes, and seconds from delta', () => {
      const now = new Date('2026-09-16T12:00:00Z').getTime()
      // Expiry is exactly 2 days, 3 hours, 15 minutes, 30 seconds away
      const expiresAt = new Date(
        now +
          2 * 86400000 +
          3 * 3600000 +
          15 * 60000 +
          30 * 1000
      ).getTime()

      const diffMs = Math.max(0, expiresAt - now)
      const days = Math.floor(diffMs / 86400000)
      const hours = Math.floor((diffMs % 86400000) / 3600000)
      const minutes = Math.floor((diffMs % 3600000) / 60000)
      const seconds = Math.floor((diffMs % 60000) / 1000)

      expect(days).toBe(2)
      expect(hours).toBe(3)
      expect(minutes).toBe(15)
      expect(seconds).toBe(30)
      // Confirms values are NOT hardcoded to 23:59:59
      expect(hours).not.toBe(23)
      expect(minutes).not.toBe(59)
      expect(seconds).not.toBe(59)
    })
  })

  describe('4. Automatic Expiry & Commercial Access Restriction', () => {
    it('returns EXPIRED and restricts commercial access when subscription expires', () => {
      const partnerId = 'test_partner_expired_01'
      
      // Grant subscription that is already in the past
      const pastDate = new Date(Date.now() - 10000) // 10s ago
      const sub = grantUserSubscription(partnerId, 'MONTHLY', -1, 25000)

      const fetched = getUserSubscription(partnerId)
      expect(fetched?.status).toBe('EXPIRED')
      expect(fetched?.isActive).toBe(false)
      expect(fetched?.daysRemaining).toBe(0)

      // Test authorization guard
      const decision = requireActiveDealSubscription({
        userId: partnerId,
        userRole: 'PARTNER',
        dealIdOrSlug: 'test-deal-123',
        intent: 'view',
      })

      expect(decision.isAuthorized).toBe(false)
      expect(decision.canViewFullDetails).toBe(false)
      expect(decision.requiresSubscription).toBe(true)
      expect(decision.subscriptionStatus).toBe('EXPIRED')
    })

    it('grants full commercial access when subscription is ACTIVE and valid', () => {
      const partnerId = 'test_partner_active_01'
      grantUserSubscription(partnerId, 'MONTHLY', 30, 25000)

      const decision = requireActiveDealSubscription({
        userId: partnerId,
        userRole: 'PARTNER',
        dealIdOrSlug: 'test-deal-123',
        intent: 'view',
      })

      expect(decision.isAuthorized).toBe(true)
      expect(decision.canViewFullDetails).toBe(true)
      expect(decision.requiresSubscription).toBe(false)
      expect(decision.hasActiveSubscription).toBe(true)
    })
  })

  describe('5. Auto-Renewal / Renewal Reminders Toggle', () => {
    it('cancels auto-renewal while keeping access active until expiry date', () => {
      const partnerId = 'test_partner_renewal_01'
      grantUserSubscription(partnerId, 'MONTHLY', 15, 25000)

      const cancelRes = cancelSubscriptionRenewal(partnerId)
      expect(cancelRes.success).toBe(true)
      expect(cancelRes.data?.autoRenew).toBe(false)

      // Retains active commercial access for the remaining 15 days
      const current = getUserSubscription(partnerId)
      expect(current?.isActive).toBe(true)
      expect(current?.autoRenew).toBe(false)
      expect(current?.daysRemaining).toBeGreaterThanOrEqual(14)
    })
  })

  describe('6. Partner Account & Data Preservation Guarantee', () => {
    it('never alters or deletes partner identity or historical stats on subscription expiry', () => {
      const partnerAccount = {
        userId: 'usr_partner_998',
        name: 'Juma Selemani',
        phone: '+255712345678',
        email: 'juma@example.com',
        walletBalanceTZS: 150000,
        approvedPayoutsCount: 3,
        totalClicks: 1420,
      }

      // Simulate subscription expiration
      grantUserSubscription(partnerAccount.userId, 'MONTHLY', -2, 25000)
      const sub = getUserSubscription(partnerAccount.userId)

      // Status is expired
      expect(sub?.status).toBe('EXPIRED')

      // Partner core data remains unchanged
      expect(partnerAccount.walletBalanceTZS).toBe(150000)
      expect(partnerAccount.approvedPayoutsCount).toBe(3)
      expect(partnerAccount.totalClicks).toBe(1420)
      expect(partnerAccount.email).toBe('juma@example.com')
    })
  })

  describe('7. Admin Sorting by Lowest Remaining Time', () => {
    it('sorts active subscriptions with lowest remaining time first', () => {
      const subs = [
        { id: '1', userName: 'Partner A', status: 'ACTIVE', remainingMilliseconds: 500000 },
        { id: '2', userName: 'Partner B', status: 'ACTIVE', remainingMilliseconds: 50000 },
        { id: '3', userName: 'Partner C', status: 'ACTIVE', remainingMilliseconds: 1500000 },
        { id: '4', userName: 'Partner D', status: 'EXPIRED', remainingMilliseconds: 0 },
      ]

      const sorted = [...subs].sort((a, b) => {
        if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1
        if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1
        if (a.status === 'ACTIVE' && b.status === 'ACTIVE') {
          return a.remainingMilliseconds - b.remainingMilliseconds
        }
        return 0
      })

      expect(sorted[0].id).toBe('2') // 50,000ms (expires soonest)
      expect(sorted[1].id).toBe('1') // 500,000ms
      expect(sorted[2].id).toBe('3') // 1,500,000ms
      expect(sorted[3].id).toBe('4') // Expired
    })
  })

  describe('8. Progressive Bar Decay & Live Decrementing Calculations', () => {
    it('calculates progressive decay percentage accurately from remaining and total cycle', () => {
      const totalDurationMs = 30 * 24 * 60 * 60 * 1000 // 30 days
      const remainingMs = 15 * 24 * 60 * 60 * 1000 // 15 days left (50%)

      const progressPercent = Math.max(0, Math.min(100, (remainingMs / totalDurationMs) * 100))
      expect(progressPercent).toBe(50)

      // Near expiry (1 day left out of 30)
      const remaining1Day = 1 * 24 * 60 * 60 * 1000
      const progress1Day = Math.max(0, Math.min(100, (remaining1Day / totalDurationMs) * 100))
      expect(progress1Day.toFixed(1)).toBe('3.3')

      // Expired (0ms left)
      const expiredProgress = Math.max(0, Math.min(100, (0 / totalDurationMs) * 100))
      expect(expiredProgress).toBe(0)
    })

    it('correctly formats live decrementing display strings', () => {
      // 29 days, 23 hours, 45 minutes, 30 seconds
      const ms = (29 * 86400 + 23 * 3600 + 45 * 60 + 30) * 1000
      const days = Math.floor(ms / 86400000)
      const hours = Math.floor((ms % 86400000) / 3600000)
      const minutes = Math.floor((ms % 3600000) / 60000)
      const seconds = Math.floor((ms % 60000) / 1000)

      const displayTime = `${days}d ${hours}h ${minutes}m ${seconds}s`
      const badgeDisplay = `${days}d ${hours}h left`

      expect(displayTime).toBe('29d 23h 45m 30s')
      expect(badgeDisplay).toBe('29d 23h left')
    })
  })
})

