import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { parseBusinessOpportunityInput } from '@/modules/deals/business-opportunity-input'
const mocks = vi.hoisted(() => ({ auth: vi.fn(), create: vi.fn(), notify: vi.fn() }))
vi.mock('@/lib/business-guard', () => ({ getAuthenticatedBusiness: mocks.auth }))
vi.mock('@/lib/db', () => ({ db: { opportunity: { create: mocks.create }, notification: { create: mocks.notify } } }))
import { POST } from '../../app/api/business/opportunities/route'

const deployedPayload = { title: 'Business product listing', summary: 'A real merchant summary', description: 'Full merchant description', opportunityType: 'COMMERCIAL_DEAL', rewardValueTZS: 12000, budgetTZS: 780000, status: 'PENDING_REVIEW' }
beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ businessId: 'business-id', userId: 'user-id' })
  mocks.create.mockImplementation(async ({ data }) => ({ ...data, id: 'new-id', versions: [] }))
})
it('maps the deployed wizard request to valid database enums without losing content or budget', () => {
  expect(parseBusinessOpportunityInput(deployedPayload)).toMatchObject({ type: 'PRODUCT_SALES', status: 'UNDER_REVIEW', publicSummary: deployedPayload.summary, subscriberDescription: deployedPayload.description, estimatedBudgetTZS: 780000 })
})
it.each([
  ['COMMERCIAL_DEAL', 'PRODUCT_SALES'], ['PRODUCT_OPPORTUNITY', 'PRODUCT_SALES'], ['AFFILIATE_PROGRAMME', 'PRODUCT_SALES'],
  ['LEAD_GENERATION', 'QUALIFIED_LEADS'], ['REVERSE_OPPORTUNITY', 'REVERSE_SOURCING'], ['ADVERTISING_CAMPAIGN', 'ADVERTISING_CAMPAIGN'],
  ['CUSTOMER_ACQUISITION', 'CUSTOMER_ACQUISITION'], ['B2B_INTRODUCTION', 'B2B_INTRODUCTION'],
])('accepts wizard type %s as %s', (type, expected) => {
  expect(parseBusinessOpportunityInput({ ...deployedPayload, type }).type).toBe(expected)
})
it('rejects invalid types, direct publication, missing title and negative budgets', () => {
  for (const patch of [{ type: 'INVALID' }, { status: 'PUBLISHED' }, { title: '' }, { budgetTZS: -1 }]) {
    expect(() => parseBusinessOpportunityInput({ ...deployedPayload, ...patch })).toThrow()
  }
})
it('persists the submitted opportunity and returns the frontend response contract', async () => {
  const response = await POST(new NextRequest('https://lumo.test/api/business/opportunities', { method: 'POST', body: JSON.stringify(deployedPayload) }))
  expect(response.status).toBe(201)
  expect(mocks.create.mock.calls[0][0].data).toMatchObject({ organizationId: 'business-id', opportunityType: 'PRODUCT_SALES', status: 'UNDER_REVIEW', totalBudgetMinor: 78000000n, summary: deployedPayload.summary, description: deployedPayload.description })
  expect(await response.json()).toMatchObject({ success: true, opportunity: { id: 'new-id', status: 'UNDER_REVIEW' } })
})
it('returns 400 instead of a Prisma enum error for malformed input', async () => {
  const response = await POST(new NextRequest('https://lumo.test/api/business/opportunities', { method: 'POST', body: JSON.stringify({ ...deployedPayload, type: 'INVALID' }) }))
  expect(response.status).toBe(400)
  expect(mocks.create).not.toHaveBeenCalled()
})
