import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ session: vi.fn(), member: vi.fn(), rewards: vi.fn(), conversions: vi.fn(), team: vi.fn(), partners: vi.fn(), user: vi.fn() }))
vi.mock('@/lib/database-session', () => ({ DATABASE_SESSION_COOKIE: 'session', getDatabaseSession: mocks.session }))
vi.mock('@/lib/db', () => ({ db: {
  organizationMember: { findFirst: mocks.member, findMany: mocks.team }, reward: { findMany: mocks.rewards }, conversion: { findMany: mocks.conversions }, partnerProfile: { findMany: mocks.partners }, user: { findUniqueOrThrow: mocks.user },
} }))
import { getAuthenticatedBusiness } from '@/lib/business-guard'
import { GET } from '../../app/api/business/records/route'
const request = (kind = 'payments') => new NextRequest(`https://lumo.test/api/business/records?kind=${kind}&organizationId=other-merchant`, { headers: { 'x-user-id': 'forged-user' } })
beforeEach(() => {
  vi.clearAllMocks()
  mocks.session.mockResolvedValue({ userId: 'real-user', user: { name: 'Merchant', email: 'merchant@example.test', roleAssignments: [] } })
  mocks.member.mockResolvedValue({ businessRole: 'OWNER', organization: { id: 'merchant-a', legalName: 'Merchant A', verificationStatus: 'VERIFIED' } })
  for (const fn of [mocks.rewards, mocks.conversions, mocks.team, mocks.partners]) fn.mockResolvedValue([])
})
it('rejects forged user headers without a session', async () => {
  mocks.session.mockResolvedValue(null)
  await expect(getAuthenticatedBusiness(request())).rejects.toMatchObject({ statusCode: 401 })
  expect(mocks.member).not.toHaveBeenCalled()
})
it('requires active membership in a non-deleted business and never synthesizes ownership', async () => {
  mocks.member.mockResolvedValue(null)
  await expect(getAuthenticatedBusiness(request())).rejects.toMatchObject({ statusCode: 403 })
  expect(mocks.member.mock.calls[0][0].where).toEqual({ userId: 'real-user', status: 'ACTIVE', organization: { deletedAt: null } })
})
it.each(['payments', 'rewards'])('scopes %s to the authenticated merchant rather than a requested organization', async kind => {
  const response = await GET(request(kind))
  expect(response.status).toBe(200)
  expect(mocks.rewards.mock.calls[0][0].where).toEqual({ conversion: { opportunity: { organizationId: 'merchant-a' } } })
  expect(await response.json()).toEqual({ items: [] })
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
})
it('scopes conversions and team records to the business', async () => {
  await GET(request('conversions')); await GET(request('team'))
  expect(mocks.conversions.mock.calls[0][0].where).toEqual({ opportunity: { organizationId: 'merchant-a' } })
  expect(mocks.team.mock.calls[0][0].where).toEqual({ organizationId: 'merchant-a' })
})
it('shows only verified partners connected to this merchant without disclosing private contacts', async () => {
  await GET(request('partners'))
  const query = mocks.partners.mock.calls[0][0]
  expect(query.where.user.participations.some.opportunity.organizationId).toBe('merchant-a')
  expect(query.where.verificationStatus).toBe('VERIFIED')
  expect(query.select.user.select).toEqual({ name: true })
})
it('does not reuse the previous merchant scope after changing sessions', async () => {
  await GET(request())
  mocks.member.mockResolvedValue({ businessRole: 'OWNER', organization: { id: 'merchant-b', legalName: 'Merchant B' } })
  await GET(request())
  expect(mocks.rewards.mock.calls[1][0].where.conversion.opportunity.organizationId).toBe('merchant-b')
})
it('returns a failure instead of fictitious empty financial records on database errors', async () => {
  mocks.rewards.mockRejectedValue(new Error('database unavailable'))
  expect((await GET(request())).status).toBe(503)
})
