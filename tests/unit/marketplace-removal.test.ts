import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
const mocks = vi.hoisted(() => ({ guard: vi.fn(), session: vi.fn(), archive: vi.fn(), hide: vi.fn(), audit: vi.fn(), transaction: vi.fn() }))
vi.mock('@/lib/admin-session', () => ({ checkAdminSession: mocks.guard }))
vi.mock('@/lib/database-session', () => ({ DATABASE_SESSION_COOKIE: 'session', getDatabaseSession: mocks.session }))
vi.mock('@/lib/db', () => ({ db: { $transaction: mocks.transaction } }))
import { POST } from '../../app/api/admin/deals/remove-all/route'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.guard.mockResolvedValue(null)
  mocks.session.mockResolvedValue({ userId: 'admin' })
  mocks.archive.mockResolvedValue({ count: 250 })
  mocks.hide.mockResolvedValue({ count: 4 })
  mocks.transaction.mockImplementation(async callback => callback({ opportunity: { updateMany: mocks.archive }, hotDeal: { updateMany: mocks.hide }, auditLog: { create: mocks.audit } }))
})
afterEach(() => vi.unstubAllGlobals())
const request = (confirmation = 'REMOVE ALL PRODUCTS') => new NextRequest('https://lumo.test/api/admin/deals/remove-all', { method: 'POST', body: JSON.stringify({ confirmation }) })

it('rejects unauthorized callers without modifying listings', async () => {
  mocks.guard.mockResolvedValue(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
  expect((await POST(request())).status).toBe(403)
  expect(mocks.transaction).not.toHaveBeenCalled()
})
it('requires explicit bulk-removal intent', async () => {
  expect((await POST(request(''))).status).toBe(400)
  expect(mocks.archive).not.toHaveBeenCalled()
})
it('archives all pages and hides attached hot deals in one audited transaction', async () => {
  expect(await (await POST(request())).json()).toEqual({ success: true, archivedCount: 250, hiddenHotDeals: 4 })
  expect(mocks.archive).toHaveBeenCalledWith({ where: { deletedAt: null, status: { not: 'ARCHIVED' } }, data: { status: 'ARCHIVED' } })
  expect(mocks.hide).toHaveBeenCalledWith({ where: { opportunity: { status: 'ARCHIVED' }, visibilityStatus: { not: 'HIDDEN' } }, data: { visibilityStatus: 'HIDDEN' } })
  expect(mocks.audit.mock.calls[0][0].data.actorUserId).toBe('admin')
})
it('reports transaction failures without exposing internal errors', async () => {
  mocks.transaction.mockRejectedValue(new Error('private database error'))
  const response = await POST(request())
  expect(response.status).toBe(500)
  expect(await response.text()).not.toContain('private database error')
})
it('starts with no bundled products', async () => {
  const { INITIAL_OPPORTUNITIES } = await import('@/modules/deals/mock-data')
  expect(INITIAL_OPPORTUNITIES).toEqual([])
})
it('removes saved sample products without restoring them on the next read', async () => {
  const store = new Map<string, string>([['lumo_deals', JSON.stringify([
    { id: 'opp_cement_bulk_01' }, { id: 'opp_hiace_tz_02' }, { id: 'opp_farmland_03' },
    { id: 'opp_smartphones_04' }, { id: 'opp_zanzibar_hotel_05' }, { id: 'opp_clothing_06' },
    { id: 'opp_import_supplier_07' }, { id: 'opp_vip_solar_hybrid_08' }, { id: 'opp_vip_macbook_fleet_09' },
  ])]])
  vi.stubGlobal('window', {})
  vi.stubGlobal('localStorage', { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) })
  const { listOpportunities } = await import('@/modules/deals/service')
  expect(listOpportunities()).toEqual([])
  expect(store.get('lumo_deals')).toBe('[]')
  expect(listOpportunities()).toEqual([])
})
