import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { scryptSync } from 'crypto'

const db = vi.hoisted(() => ({
  session: { findUnique: vi.fn() }, role: { findUnique: vi.fn() },
  user: { create: vi.fn() }, organization: { create: vi.fn() },
  partnerProfile: { create: vi.fn() }, roleAssignment: { create: vi.fn() },
  auditLog: { create: vi.fn() }, $transaction: vi.fn(),
}))
vi.mock('@/lib/db', () => ({ db }))
import { POST } from '../../app/api/admin/users/route'

const input = { name: 'Test Account', email: 'TEST@example.test', phone: '0712345678', role: 'BUSINESS', password: 'TestPassword123!', confirmPassword: 'TestPassword123!' }
function request(body = input, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/admin/users', { method: 'POST', headers: { cookie: 'lumo_db_session=test-token', ...headers }, body: JSON.stringify(body) })
}
beforeEach(() => {
  vi.resetAllMocks()
  db.session.findUnique.mockResolvedValue({ userId: 'actor', expiresAt: new Date(Date.now() + 60000), user: { accountStatus: 'ACTIVE', roleAssignments: [{ organizationId: null, role: { code: 'SUPER_ADMIN' } }] } })
  db.role.findUnique.mockResolvedValue({ id: 'role' })
  db.user.create.mockImplementation(async ({ data }) => ({ ...data, id: 'new-user', createdAt: new Date() }))
  db.organization.create.mockResolvedValue({ id: 'org' })
  db.$transaction.mockImplementation(callback => callback(db))
})
describe('Database-backed admin account creation', () => {
  it('rejects forged admin headers without a valid session', async () => {
    db.session.findUnique.mockResolvedValue(null)
    expect((await POST(request(input, { 'X-User-Role': 'SUPER_ADMIN', Authorization: 'Bearer admin_token' }))).status).toBe(401)
    expect(db.user.create).not.toHaveBeenCalled()
  })
  it('rejects non-admin and expired sessions', async () => {
    db.session.findUnique.mockResolvedValue({ expiresAt: new Date(Date.now() + 60000), user: { accountStatus: 'ACTIVE', roleAssignments: [{ role: { code: 'PARTNER' } }] } })
    expect((await POST(request())).status).toBe(403)
    db.session.findUnique.mockResolvedValue({ expiresAt: new Date(0), user: { accountStatus: 'ACTIVE' } })
    expect((await POST(request())).status).toBe(401)
  })
  it('rejects cross-origin creation', async () => {
    expect((await POST(request(input, { origin: 'https://other.example' }))).status).toBe(403)
  })
  it('rejects password mismatches and unsupported roles before writing', async () => {
    expect((await POST(request({ ...input, confirmPassword: 'Different123!' }))).status).toBe(400)
    expect((await POST(request({ ...input, role: 'SUPER_ADMIN' }))).status).toBe(400)
    expect(db.user.create).not.toHaveBeenCalled()
  })
  it.each(['BUSINESS', 'PARTNER', 'ADMIN'])('creates %s credentials and role without exposing the password', async role => {
    const response = await POST(request({ ...input, role }))
    expect(response.status).toBe(201)
    const data = db.user.create.mock.calls[0][0].data
    expect(data.email).toBe('test@example.test')
    expect(data.phone).toBe('+255712345678')
    const [hash, salt] = data.accounts.create.password.split(':')
    expect(scryptSync(input.password, salt, 64).toString('hex')).toBe(hash)
    expect(db.roleAssignment.create).toHaveBeenCalledWith({ data: { userId: 'new-user', roleId: 'role', organizationId: role === 'BUSINESS' ? 'org' : undefined } })
    if (role === 'BUSINESS') expect(db.organization.create.mock.calls[0][0].data.members.create.businessRole).toBe('OWNER')
    if (role === 'PARTNER') expect(db.partnerProfile.create).toHaveBeenCalled()
    expect(JSON.stringify(await response.json())).not.toContain(input.password)
    expect(JSON.stringify(db.auditLog.create.mock.calls)).not.toContain(input.password)
  })
  it('reports duplicate accounts without resetting existing credentials', async () => {
    db.user.create.mockRejectedValue({ code: 'P2002' })
    expect((await POST(request())).status).toBe(409)
  })
})
