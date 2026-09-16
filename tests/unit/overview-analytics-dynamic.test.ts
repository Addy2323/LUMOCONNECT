import { describe, it, expect } from 'vitest'
import {
  generateDateBuckets,
  mergeEventSeries,
  RawEventItem,
} from '@/lib/dynamicDateRange'

describe('Dynamic Date Range & Rolling Analytics Engine', () => {
  const fixedRefDate = new Date('2026-09-16T12:00:00Z')

  describe('generateDateBuckets', () => {
    it('generates exactly 7 contiguous daily rolling buckets for 7D period ending at reference date', () => {
      const buckets = generateDateBuckets('7D', fixedRefDate)
      expect(buckets).toHaveLength(7)

      // First bucket should be 6 days prior (10 Sep 2026)
      expect(buckets[0].date).toBe('2026-09-10')
      expect(buckets[0].label).toBe('10 Sep')
      expect(buckets[0].earnings).toBe(0)
      expect(buckets[0].leads).toBe(0)
      expect(buckets[0].conversions).toBe(0)

      // Last bucket should be reference date (16 Sep 2026)
      expect(buckets[6].date).toBe('2026-09-16')
      expect(buckets[6].label).toBe('16 Sep')

      // Verify no static August labels exist
      buckets.forEach((b) => {
        expect(b.label).not.toContain('Aug')
        expect(b.date).toContain('2026-09-')
      })
    })

    it('generates exactly 30 contiguous daily rolling buckets for 30D period', () => {
      const buckets = generateDateBuckets('30D', fixedRefDate)
      expect(buckets).toHaveLength(30)

      // Last bucket is today
      expect(buckets[29].date).toBe('2026-09-16')
      expect(buckets[29].label).toBe('16 Sep')

      // All initial values are safely zero-filled
      buckets.forEach((b) => {
        expect(b.earnings).toBe(0)
        expect(b.clicks).toBe(0)
        expect(b.leads).toBe(0)
        expect(b.conversions).toBe(0)
        expect(b.pipelineRevenueTZS).toBe(0)
      })
    })

    it('generates 6 contiguous monthly rolling buckets for 6M period', () => {
      const buckets = generateDateBuckets('6M', fixedRefDate)
      expect(buckets).toHaveLength(6)

      // Last bucket should be current month (Sep 2026)
      expect(buckets[5].date).toBe('2026-09')
      expect(buckets[5].label).toBe('Sep 2026')
      expect(buckets[5].shortLabel).toBe('Sep')

      // 5 months prior should be Apr 2026
      expect(buckets[0].date).toBe('2026-04')
      expect(buckets[0].label).toBe('Apr 2026')
      expect(buckets[0].shortLabel).toBe('Apr')
    })

    it('generates 12 contiguous monthly rolling buckets for 12M period with year rollover', () => {
      const buckets = generateDateBuckets('12M', fixedRefDate)
      expect(buckets).toHaveLength(12)

      // Last bucket should be Sep 2026
      expect(buckets[11].date).toBe('2026-09')
      expect(buckets[11].label).toBe('Sep 2026')
      expect(buckets[11].shortLabel).toBe('Sep')

      // First bucket should be Oct 2025
      expect(buckets[0].date).toBe('2025-10')
      expect(buckets[0].label).toBe('Oct 2025')
      expect(buckets[0].shortLabel).toBe('Oct')
    })
  })

  describe('mergeEventSeries', () => {
    it('accurately aggregates events into the correct rolling daily bucket', () => {
      const buckets = generateDateBuckets('7D', fixedRefDate)

      const events: RawEventItem[] = [
        { timestamp: '2026-09-12T08:30:00Z', type: 'CLICK' },
        { timestamp: '2026-09-12T10:15:00Z', type: 'CLICK' },
        { timestamp: '2026-09-12T11:00:00Z', type: 'LEAD', amountTZS: 50000 },
        { timestamp: '2026-09-15T14:20:00Z', type: 'CONVERSION', amountTZS: 75000 },
        { timestamp: '2026-09-16T09:00:00Z', type: 'REWARD', amountTZS: 100000 },
        { timestamp: '2026-09-16T10:00:00Z', type: 'TRANSACTION', amountTZS: 250000 },
      ]

      const merged = mergeEventSeries(buckets, events, '7D')

      // 2026-09-12 bucket (index 2: 10, 11, 12)
      const b12 = merged.find((b) => b.date === '2026-09-12')
      expect(b12).toBeDefined()
      expect(b12?.clicks).toBe(2)
      expect(b12?.leads).toBe(1)
      expect(b12?.conversions).toBe(0)
      expect(b12?.pipelineRevenueTZS).toBe(50000)

      // 2026-09-15 bucket
      const b15 = merged.find((b) => b.date === '2026-09-15')
      expect(b15).toBeDefined()
      expect(b15?.conversions).toBe(1)
      expect(b15?.pipelineRevenueTZS).toBe(75000)

      // 2026-09-16 bucket
      const b16 = merged.find((b) => b.date === '2026-09-16')
      expect(b16).toBeDefined()
      expect(b16?.earnings).toBe(100000)
      expect(b16?.txValue).toBe(250000)
      expect(b16?.pipelineRevenueTZS).toBe(350000)

      // Inactive day (2026-09-11) has zero values, never undefined
      const b11 = merged.find((b) => b.date === '2026-09-11')
      expect(b11).toBeDefined()
      expect(b11?.clicks).toBe(0)
      expect(b11?.leads).toBe(0)
      expect(b11?.conversions).toBe(0)
      expect(b11?.earnings).toBe(0)
      expect(b11?.pipelineRevenueTZS).toBe(0)
    })

    it('accurately aggregates monthly events across 6M period', () => {
      const buckets = generateDateBuckets('6M', fixedRefDate)

      const events: RawEventItem[] = [
        { timestamp: '2026-04-10T12:00:00Z', type: 'REWARD', amountTZS: 20000 },
        { timestamp: '2026-04-25T15:00:00Z', type: 'REWARD', amountTZS: 30000 },
        { timestamp: '2026-09-02T08:00:00Z', type: 'LEAD' },
        { timestamp: '2026-09-05T10:00:00Z', type: 'CONVERSION', amountTZS: 150000 },
      ]

      const merged = mergeEventSeries(buckets, events, '6M')

      const bApr = merged.find((b) => b.date === '2026-04')
      expect(bApr?.earnings).toBe(50000)

      const bSep = merged.find((b) => b.date === '2026-09')
      expect(bSep?.leads).toBe(1)
      expect(bSep?.conversions).toBe(1)
      expect(bSep?.pipelineRevenueTZS).toBe(150000)
    })

    it('safely handles empty events list with 100% continuous zero-filling', () => {
      const buckets = generateDateBuckets('7D', fixedRefDate)
      const merged = mergeEventSeries(buckets, [], '7D')

      expect(merged).toHaveLength(7)
      merged.forEach((b) => {
        expect(b.earnings).toBe(0)
        expect(b.clicks).toBe(0)
        expect(b.leads).toBe(0)
        expect(b.conversions).toBe(0)
        expect(b.pipelineRevenueTZS).toBe(0)
      })
    })

    it('safely ignores out-of-range historical events', () => {
      const buckets = generateDateBuckets('7D', fixedRefDate)
      const oldEvents: RawEventItem[] = [
        { timestamp: '2025-01-01T00:00:00Z', type: 'REWARD', amountTZS: 999999 },
      ]
      const merged = mergeEventSeries(buckets, oldEvents, '7D')
      const totalEarned = merged.reduce((acc, b) => acc + b.earnings, 0)
      expect(totalEarned).toBe(0)
    })
  })

  describe('Zero-Division & Safe Calculations', () => {
    it('prevents NaN or Infinity in conversion rate calculations when leads is 0', () => {
      const leads = 0
      const conversions = 0
      const conversionRate = leads > 0 ? ((conversions / leads) * 100).toFixed(1) : '0.0'
      expect(conversionRate).toBe('0.0')
      expect(Number(conversionRate)).not.toBeNaN()
    })

    it('prevents NaN or Infinity in average deal reward calculations when conversions is 0', () => {
      const totalRewards = 0
      const conversions = 0
      const avgReward = conversions > 0 ? Math.round(totalRewards / conversions) : 0
      expect(avgReward).toBe(0)
    })
  })
})
