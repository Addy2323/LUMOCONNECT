import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/database-session', () => ({ DATABASE_SESSION_COOKIE: 'lumo_db_session', getDatabaseSession: vi.fn() }))
vi.mock('@/modules/identity/merchant-file-cleanup', () => ({ cleanupDeletedMerchantFiles: vi.fn().mockResolvedValue(0) }))
vi.mock('@/modules/identity/delete-merchant', () => ({
  deleteMerchant: vi.fn(), inspectMerchantDeletion: vi.fn(),
  MerchantDeletionError: class extends Error { constructor(message: string, public status = 409) { super(message) } },
}))
import { getDatabaseSession } from '@/lib/database-session'
import { deleteMerchant } from '@/modules/identity/delete-merchant'
import { DELETE } from '../../app/api/admin/merchants/[id]/route'

const id = '11111111-1111-4111-8111-111111111111'
const context = { params: Promise.resolve({ id }) }
function request(headers: Record<string, string> = {}, body = { confirmation: 'Merchant', reason: 'Duplicate merchant', deleteAccounts: true }) {
  return new NextRequest(`https://lumo.co.tz/api/admin/merchants/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
}
beforeEach(() => vi.clearAllMocks())

describe('Merchant deletion authorization', () => {
  it('rejects spoofed admin headers without a real session', async () => {
    vi.mocked(getDatabaseSession).mockResolvedValue(null)
    expect((await DELETE(request({ 'X-User-Role': 'SUPER_ADMIN', Authorization: 'Bearer admin_token' }), context)).status).toBe(401)
    expect(deleteMerchant).not.toHaveBeenCalled()
  })
  it('rejects business-scoped administrators', async () => {
    vi.mocked(getDatabaseSession).mockResolvedValue({ userId: 'actor', user: { roleAssignments: [{ organizationId: id, role: { code: 'ADMIN' } }] } } as never)
    expect((await DELETE(request(), context)).status).toBe(403)
    expect(deleteMerchant).not.toHaveBeenCalled()
  })
  it('rejects cross-origin requests', async () => {
    vi.mocked(getDatabaseSession).mockResolvedValue({ userId: 'actor', user: { roleAssignments: [{ organizationId: null, role: { code: 'SUPER_ADMIN' } }] } } as never)
    expect((await DELETE(request({ origin: 'https://other.test' }), context)).status).toBe(403)
    expect(deleteMerchant).not.toHaveBeenCalled()
  })
  it('uses the authenticated admin identity for a valid deletion', async () => {
    vi.mocked(getDatabaseSession).mockResolvedValue({ userId: 'actor', user: { roleAssignments: [{ organizationId: null, role: { code: 'SUPER_ADMIN' } }] } } as never)
    vi.mocked(deleteMerchant).mockResolvedValue({ organizationId: id, deletedAccounts: 1 })
    expect((await DELETE(request({ origin: 'https://lumo.co.tz' }), context)).status).toBe(200)
    expect(deleteMerchant).toHaveBeenCalledWith(expect.objectContaining({ actorId: 'actor', organizationId: id }))
  })
})
