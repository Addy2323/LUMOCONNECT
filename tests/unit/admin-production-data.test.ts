import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({ session: vi.fn(), payments: vi.fn(), logs: vi.fn(), deals: vi.fn(), deal: vi.fn(), transaction: vi.fn() }))
vi.mock('@/lib/database-session', () => ({ DATABASE_SESSION_COOKIE: 'lumo_db_session', getDatabaseSession: mocks.session }))
vi.mock('@/lib/db', () => ({ db: { paymentAttempt: { findMany: mocks.payments }, auditLog: { findMany: mocks.logs }, opportunity: { findMany: mocks.deals, findUnique: mocks.deal }, $transaction: mocks.transaction } }))
import { GET as payments } from '../../app/api/admin/payments/route'
import { GET as logs } from '../../app/api/admin/logs/route'
import { checkAdminSession } from '@/lib/admin-session'
import { GET as deals, PATCH as updateDeal } from '../../app/api/admin/deals/route'

function request(path = '/api/admin/payments', init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`https://lumo.co.tz${path}`, init)
}
const admin = { user: { roleAssignments: [{ organizationId: null, role: { code: 'SUPER_ADMIN' } }] } }

beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue(admin) })

describe('Production admin data', () => {
  it('rejects unauthenticated requests, including forged legacy credentials', async () => {
    mocks.session.mockResolvedValue(null)
    const response = await payments(request(undefined, { headers: { 'x-user-role': 'SUPER_ADMIN', authorization: 'Bearer admin_token' } }))
    expect(response.status).toBe(401)
    expect(mocks.payments).not.toHaveBeenCalled()
  })
  it.each(['PARTNER', 'BUSINESS'])('rejects %s accounts', async code => {
    mocks.session.mockResolvedValue({ user: { roleAssignments: [{ organizationId: null, role: { code } }] } })
    expect((await payments(request())).status).toBe(403)
    expect(mocks.payments).not.toHaveBeenCalled()
  })
  it('rejects organization-scoped admin assignments', async () => {
    mocks.session.mockResolvedValue({ user: { roleAssignments: [{ organizationId: 'another-org', role: { code: 'ADMIN' } }] } })
    expect((await logs(request('/api/admin/logs'))).status).toBe(403)
  })
  it('returns an empty database as empty, with no sample transactions', async () => {
    mocks.payments.mockResolvedValue([])
    const response = await payments(request())
    expect(await response.json()).toEqual({ payments: [] })
    expect(response.headers.get('cache-control')).toContain('no-store')
  })
  it('preserves recorded amounts and status without inventing fees or callback verification', async () => {
    mocks.payments.mockResolvedValue([{ id: 'id', user: { name: 'Actual payer' }, providerReference: 'actual-ref', purpose: 'SUBSCRIPTION', amountMinor: 12345n, currency: 'TZS', paymentMethod: null, status: 'PENDING', createdAt: new Date('2026-09-16T10:00:00Z') }])
    const data = await (await payments(request())).json()
    expect(data.payments[0]).toMatchObject({ grossAmountTZS: 123.45, processingFeeTZS: null, netAmountTZS: null, status: 'PENDING', channel: 'Not recorded' })
    expect(data.payments[0].verifiedAt).toBeUndefined()
  })
  it('does not fabricate audit signatures, IP addresses, or historical roles', async () => {
    mocks.logs.mockResolvedValue([{ id: 'log-id', actorUserId: 'user', actor: { name: 'Actor' }, action: 'changed', entityType: 'DEALS', createdAt: new Date(), ipAddress: null, userAgent: null }])
    const data = await (await logs(request('/api/admin/logs?limit=-1'))).json()
    expect(data.auditLogs[0]).toMatchObject({ hashSignature: 'Not recorded', ipAddress: 'Not recorded', actorRole: 'Not recorded at event time' })
    expect(mocks.logs.mock.calls[0][0].take).toBe(1)
  })
  it('reports database failures instead of returning demo data', async () => {
    mocks.payments.mockRejectedValue(new Error('private database details'))
    const response = await payments(request())
    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain('private database details')
  })
  it('fails closed if session storage is unavailable', async () => {
    mocks.session.mockRejectedValue(new Error('offline'))
    expect((await payments(request())).status).toBe(503)
  })
  it('blocks cross-origin mutations', async () => {
    const denied = await checkAdminSession(request(undefined, { method: 'POST', headers: { origin: 'https://other.example' } }))
    expect(denied?.status).toBe(403)
  })
  it('returns no opportunities when the database has none', async () => {
    mocks.deals.mockResolvedValue([])
    expect(await (await deals(request('/api/admin/deals'))).json()).toEqual({ deals: [] })
    expect(mocks.deals.mock.calls[0][0].include._count.select.participations).toEqual({ where: { status: 'ACTIVE' } })
  })
  it('does not turn a draft into a published deal through the pause/resume endpoint', async () => {
    mocks.deal.mockResolvedValue({ status: 'DRAFT', publishedVersionId: null })
    const result = await updateDeal(request('/api/admin/deals', { method: 'PATCH', body: JSON.stringify({ dealId: 'a'.repeat(36), status: 'PUBLISHED' }) }))
    expect(result.status).toBe(409)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
})
