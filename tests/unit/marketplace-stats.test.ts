import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ aggregate: vi.fn(), deals: vi.fn(), partners: vi.fn(), results: vi.fn(), transaction: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: {
  opportunity: { aggregate: mocks.aggregate, count: mocks.deals }, partnerProfile: { count: mocks.partners }, conversion: { count: mocks.results }, $transaction: mocks.transaction,
} }))
import { activeMarketplaceWhere, getMarketplaceStats } from '@/modules/deals/marketplace-stats'
import { commercialValueSchema, compactOpportunityValue } from '@/lib/marketplace-stats'
import { GET } from '../../app/api/public/marketplace-stats/route'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.aggregate.mockResolvedValue({ _sum: { commercialValueMinor: null } })
  mocks.deals.mockResolvedValue(0); mocks.partners.mockResolvedValue(0); mocks.results.mockResolvedValue(0)
  mocks.transaction.mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries))
})
describe('live marketplace statistics', () => {
  it('returns genuine zero totals when no deals exist', async () => {
    expect(await getMarketplaceStats()).toMatchObject({ totalOpportunityValue: '0.00', activeDeals: 0, activePartners: 0, verifiedResults: 0 })
  })
  it('aggregates only commercial TZS values while counting valueless deals', async () => {
    mocks.aggregate.mockResolvedValue({ _sum: { commercialValueMinor: 3000000000n } })
    mocks.deals.mockResolvedValue(3)
    const stats = await getMarketplaceStats()
    expect(stats.totalOpportunityValue).toBe('30000000.00')
    expect(stats.activeDeals).toBe(3)
    expect(mocks.aggregate.mock.calls[0][0]).toMatchObject({ where: { currency: 'TZS', commercialValueMinor: { gte: 0n } }, _sum: { commercialValueMinor: true } })
    expect(mocks.deals.mock.calls[0][0].where.commercialValueMinor).toBeUndefined()
  })
  it('restricts eligibility to published, undeleted, started, unexpired and visible deals', () => {
    const now = new Date('2026-09-16T12:00:00Z')
    expect(activeMarketplaceWhere(now)).toEqual({
      status: 'PUBLISHED', deletedAt: null, organization: { deletedAt: null },
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gt: now } }] },
        { OR: [{ hotDeal: null }, { hotDeal: { is: { status: { in: ['PRIVATE_HOT_DEAL', 'PARTNER_RELEASE'] }, visibilityStatus: 'PUBLIC_TEASER', verifiedAt: { not: null }, availablePartnerSlots: { gt: 0 }, inventoryAvailable: { gt: 0 } } } }] },
      ],
    })
  })
  it('recalculates on every request after publication, archive or edits', async () => {
    for (const total of [10000000n, 30000000n, 30000000n, 20000000n, 25000000n]) {
      mocks.aggregate.mockResolvedValue({ _sum: { commercialValueMinor: total * 100n } })
      expect((await getMarketplaceStats()).totalOpportunityValue).toBe(`${total}.00`)
    }
    expect(mocks.aggregate).toHaveBeenCalledTimes(5)
  })
  it('returns aggregate fields only and no stale response cache', async () => {
    const response = await GET()
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(Object.keys(await response.json()).sort()).toEqual(['activeDeals', 'activePartners', 'currency', 'totalOpportunityValue', 'updatedAt', 'verifiedResults'])
  })
  it('does not present database failures as zero activity', async () => {
    mocks.transaction.mockRejectedValue(new Error('private connection details'))
    const response = await GET()
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'Marketplace statistics unavailable' })
  })
  it('formats large values without rounding up or inventing totals', () => {
    expect(compactOpportunityValue('1254000000.00')).toBe('1.25B+')
    expect(compactOpportunityValue('875000000.00')).toBe('875M')
    expect(compactOpportunityValue('0.00')).toBe('0')
    expect(compactOpportunityValue('999999999.00')).toBe('999.99M+')
  })
  it('validates optional merchant values with exact minor units', () => {
    expect(commercialValueSchema.parse('1234.56')).toBe(123456n)
    expect(commercialValueSchema.parse('')).toBeNull()
    expect(commercialValueSchema.parse(undefined)).toBeNull()
    for (const invalid of [-1, 'NaN', 1.234, '1e12', Infinity]) expect(commercialValueSchema.safeParse(invalid).success).toBe(false)
  })
})
