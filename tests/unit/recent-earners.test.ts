import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ config: vi.fn(), rewards: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: { publicEarningsConfig: { findUnique: mocks.config }, reward: { findMany: mocks.rewards } } }))
import { GET } from '../../app/api/public/recent-earners/route'
import { earningsConfigSchema, maskEarner, earningsTimeAgo } from '@/lib/public-earnings'

describe('public recent earners', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.config.mockResolvedValue(null); mocks.rewards.mockResolvedValue([]) })
  it('returns no invented entries when rewards are empty', async () => {
    expect((await (await GET()).json()).items).toEqual([])
  })
  it('returns only safe fields and converts actual minor units', async () => {
    mocks.rewards.mockResolvedValue([{ id: 'reward-a', netAmountMinor: 5000000n, currency: 'TZS', approvedAt: new Date('2026-09-16T09:00:00Z'), partnerUser: { phone: '+255712345678' } }])
    const response = await GET()
    const body = await response.json()
    expect(body.items).toEqual([{ id: 'reward-a', maskedIdentity: 'Partner ********5678', amount: 50000, currency: 'TZS', category: 'Business Opportunity', earnedAt: '2026-09-16T09:00:00.000Z' }])
    expect(JSON.stringify(body)).not.toContain('+255712345678')
    expect(JSON.stringify(body)).not.toContain('partnerUser')
  })
  it('filters reversed, unverified, deleted and opted-out records at the database and orders newest first', async () => {
    await GET()
    expect(mocks.rewards).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: { in: ['APPROVED', 'PAYABLE', 'PAID'] }, approvedAt: { not: null }, netAmountMinor: { gt: 0n, gte: 0n }, conversion: { status: { in: ['APPROVED', 'PAYABLE', 'PAID'] } }, partnerUser: { deletedAt: null, accountStatus: 'ACTIVE', partnerProfile: { is: { publicEarningsOptOut: false } } } }),
      orderBy: [{ approvedAt: 'desc' }, { id: 'desc' }], take: 20,
    }))
  })
  it('supports paid-only mode and configurable query bounds', async () => {
    mocks.config.mockResolvedValue({ mode: 'PAID', minimumTZS: 10000, maximumCards: 7 })
    await GET()
    expect(mocks.rewards.mock.calls[0][0].where.status).toEqual({ in: ['PAID'] })
    expect(mocks.rewards.mock.calls[0][0].where.netAmountMinor.gte).toBe(1000000n)
    expect(mocks.rewards.mock.calls[0][0].take).toBe(7)
  })
  it('does not query earnings when disabled', async () => {
    mocks.config.mockResolvedValue({ enabled: false })
    expect((await (await GET()).json()).items).toEqual([])
    expect(mocks.rewards).not.toHaveBeenCalled()
  })
  it('fails closed without exposing database errors', async () => {
    mocks.rewards.mockRejectedValue(new Error('private database details'))
    const response = await GET()
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ items: [], error: 'Recent earnings unavailable' })
  })
  it('masks identities without fallback phone numbers', () => {
    expect(maskEarner(null, 4)).toBe('Partner')
    expect(maskEarner('1234', 4)).toBe('Partner')
    expect(maskEarner('+255712345678', 3)).toBe('Partner ********678')
  })
  it('calculates relative time from the earning timestamp', () => {
    expect(earningsTimeAgo('2026-09-16T09:00:00Z', Date.parse('2026-09-16T09:08:00Z'))).toBe('8 min ago')
  })
  it('rejects excessive public data limits and unsafe mask lengths', () => {
    expect(earningsConfigSchema.safeParse({ maximumCards: 10000 }).success).toBe(false)
    expect(earningsConfigSchema.safeParse({ maskDigits: 12 }).success).toBe(false)
  })
})
