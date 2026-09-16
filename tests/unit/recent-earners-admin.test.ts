import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ session: vi.fn(), upsert: vi.fn(), origin: vi.fn() }))
vi.mock('@/lib/database-session', () => ({ DATABASE_SESSION_COOKIE: 'session', getDatabaseSession: mocks.session }))
vi.mock('@/lib/origin', () => ({ isValidRequestOrigin: mocks.origin }))
vi.mock('@/lib/db', () => ({ db: { publicEarningsConfig: { upsert: mocks.upsert } } }))
import { PUT } from '../../app/api/admin/recent-earners/route'

beforeEach(() => { vi.clearAllMocks(); mocks.origin.mockReturnValue(true); mocks.session.mockResolvedValue(null) })
const request = (body: unknown) => new NextRequest('https://lumo.test/api/admin/recent-earners', { method: 'PUT', body: JSON.stringify(body) })
it('blocks unauthenticated changes', async () => {
  expect((await PUT(request({ enabled: false }))).status).toBe(403)
  expect(mocks.upsert).not.toHaveBeenCalled()
})
it('blocks partner accounts', async () => {
  mocks.session.mockResolvedValue({ user: { roleAssignments: [{ role: { code: 'PARTNER' } }] } })
  expect((await PUT(request({ enabled: false }))).status).toBe(403)
})
it('blocks requests from invalid origins', async () => {
  mocks.origin.mockReturnValue(false)
  expect((await PUT(request({}))).status).toBe(403)
  expect(mocks.upsert).not.toHaveBeenCalled()
})
it('validates and persists admin settings', async () => {
  mocks.session.mockResolvedValue({ user: { roleAssignments: [{ role: { code: 'SUPER_ADMIN' } }] } })
  expect((await PUT(request({ maskDigits: 12 }))).status).toBe(400)
  mocks.upsert.mockImplementation(async ({ update }) => update)
  const response = await PUT(request({ enabled: false, mode: 'PAID' }))
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({ enabled: false, mode: 'PAID' })
  expect(mocks.upsert).toHaveBeenCalledTimes(1)
})
