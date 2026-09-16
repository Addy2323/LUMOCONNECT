import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ auth: vi.fn(), update: vi.fn(), read: vi.fn() }))
vi.mock('@/lib/business-guard', () => ({ getAuthenticatedBusiness: mocks.auth }))
vi.mock('@/lib/db', () => ({ db: { organization: { update: mocks.update, findUnique: mocks.read } } }))
import { GET, PUT } from '../../app/api/business/profile/route'
beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ businessId: 'merchant-a', businessRole: 'OWNER' }); mocks.update.mockResolvedValue({ id: 'merchant-a' }); mocks.read.mockResolvedValue({ id: 'merchant-a', industry: null }) })
it('loads only the authenticated merchant profile without filling missing fields', async () => {
  const response = await GET(new NextRequest('https://lumo.test/api/business/profile?organizationId=merchant-b'))
  expect(mocks.read.mock.calls[0][0].where).toEqual({ id: 'merchant-a' })
  expect((await response.json()).data.industry).toBeNull()
})
it('persists merchant-specific details without accepting a target business from the client', async () => {
  const response = await PUT(new NextRequest('https://lumo.test/api/business/profile', { method: 'PUT', body: JSON.stringify({ organizationId: 'merchant-b', industry: 'Agriculture', contactEmail: 'owner@example.test', hqAddress: 'Merchant entered address' }) }))
  expect(response.status).toBe(200)
  expect(mocks.update.mock.calls[0][0]).toMatchObject({ where: { id: 'merchant-a' }, data: { industry: 'Agriculture', contactEmail: 'owner@example.test', hqAddress: 'Merchant entered address' } })
  expect(mocks.update.mock.calls[0][0].data.organizationId).toBeUndefined()
})
it('rejects profile writes from non-administrative members', async () => {
  mocks.auth.mockResolvedValue({ businessId: 'merchant-a', businessRole: 'VIEWER' })
  expect((await PUT(new NextRequest('https://lumo.test/api/business/profile', { method: 'PUT', body: '{}' }))).status).toBe(403)
  expect(mocks.update).not.toHaveBeenCalled()
})
