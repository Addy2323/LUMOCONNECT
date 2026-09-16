import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Hoisted mocks ensuring shared reference across all imported modules
const { mockDb, hoistedState } = vi.hoisted(() => {
  return {
    mockDb: {
      opportunity: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      dealParticipation: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      opportunityVersion: {
        create: vi.fn(),
      },
      notification: {
        create: vi.fn(),
      },
      organization: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      subscriptionPlan: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      userSubscription: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    },
    hoistedState: {
      sessionUser: {
        id: 'user_biz_1',
        email: 'owner@biz.co.tz',
        role: 'BUSINESS',
      },
      authenticatedBiz: {
        userId: 'user_biz_1',
        businessId: 'org_business_alpha_123',
        role: 'BUSINESS',
        user: { id: 'user_biz_1', email: 'owner@biz.co.tz', name: 'Business Owner' },
        organization: { id: 'org_business_alpha_123', legalName: 'Alpha Corp Ltd', verificationStatus: 'NOT_SUBMITTED' },
      },
    },
  }
})

vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

vi.mock('@/lib/database-session', () => ({
  DATABASE_SESSION_COOKIE: 'lumo_db_session',
  getDatabaseSession: vi.fn().mockImplementation(async () => {
    if (!hoistedState.sessionUser) return null
    return {
      userId: hoistedState.sessionUser.id,
      user: hoistedState.sessionUser,
    }
  }),
}))

vi.mock('@/lib/business-guard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/business-guard')>()
  return {
    ...actual,
    getAuthenticatedBusiness: vi.fn().mockImplementation(async () => hoistedState.authenticatedBiz),
  }
})

import { assertOpportunityOwnership } from '@/lib/business-guard'
import { POST as activateSubscription } from '@/app/api/subscriptions/activate/route'
import { GET as getOverview } from '@/app/api/business/overview/route'
import { GET as getOpportunities } from '@/app/api/business/opportunities/route'
import { GET as getPartners } from '@/app/api/business/partners/route'
import { DELETE as deleteOpportunity } from '@/app/api/business/opportunities/[id]/route'
import { POST as duplicateOpportunity } from '@/app/api/business/opportunities/[id]/duplicate/route'

describe('LUMO Production Business Portal Data Isolation & Security Test Suite', () => {
  const BIZ_A_ID = 'org_business_alpha_123'
  const BIZ_B_ID = 'org_business_beta_456'
  const OPP_A_ID = 'opp_cement_order_001'

  beforeEach(() => {
    vi.clearAllMocks()
    hoistedState.sessionUser = {
      id: 'user_biz_1',
      email: 'owner@biz.co.tz',
      role: 'BUSINESS',
    }
    hoistedState.authenticatedBiz = {
      userId: 'user_biz_1',
      businessId: BIZ_A_ID,
      role: 'BUSINESS',
      user: { id: 'user_biz_1', email: 'owner@biz.co.tz', name: 'Alpha Owner' },
      organization: { id: BIZ_A_ID, legalName: 'Alpha Corp Ltd', verificationStatus: 'NOT_SUBMITTED' },
    }
  })

  describe('1. Cross-Business Multi-Tenant Isolation Guard', () => {
    it('allows business to access its own opportunity', async () => {
      mockDb.opportunity.findUnique.mockResolvedValueOnce({
        id: OPP_A_ID,
        organizationId: BIZ_A_ID,
        status: 'PUBLISHED',
      })

      const opp = await assertOpportunityOwnership(OPP_A_ID, BIZ_A_ID)
      expect(opp.id).toBe(OPP_A_ID)
      expect(opp.organizationId).toBe(BIZ_A_ID)
    })

    it('rejects cross-business access with 403 Forbidden when Business B tries to access Business A opportunity', async () => {
      mockDb.opportunity.findUnique.mockResolvedValueOnce({
        id: OPP_A_ID,
        organizationId: BIZ_A_ID,
        status: 'PUBLISHED',
      })

      await expect(assertOpportunityOwnership(OPP_A_ID, BIZ_B_ID)).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringContaining('Forbidden'),
      })
    })

    it('returns 404 Not Found when opportunity does not exist', async () => {
      mockDb.opportunity.findUnique.mockResolvedValueOnce(null)

      await expect(assertOpportunityOwnership('non_existent_opp', BIZ_A_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: expect.stringContaining('Opportunity not found'),
      })
    })
  })

  describe('2. Role-Based Subscription Guard (Strict Role Enforcement)', () => {
    it('prohibits Business Merchant accounts from activating subscriptions', async () => {
      hoistedState.sessionUser = {
        id: 'user_biz_1',
        email: 'owner@biz.co.tz',
        role: 'BUSINESS',
      }

      const req = new NextRequest('http://localhost:3000/api/subscriptions/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: 'lumo_db_session=valid_token' },
        body: JSON.stringify({ planCode: 'MONTHLY', userId: 'user_biz_1' }),
      })

      const response = await activateSubscription(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Subscriptions are only available for Partner accounts')
    })

    it('prohibits Admin accounts from activating subscriptions', async () => {
      hoistedState.sessionUser = {
        id: 'user_admin_1',
        email: 'admin@lumo.co.tz',
        role: 'ADMIN',
      }

      const req = new NextRequest('http://localhost:3000/api/subscriptions/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: 'lumo_db_session=valid_token' },
        body: JSON.stringify({ planCode: 'SEMI_ANNUAL', userId: 'user_admin_1' }),
      })

      const response = await activateSubscription(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Subscriptions are only available for Partner accounts')
    })
  })

  describe('3. Clean 0-State for New Business Accounts', () => {
    it('returns 0 opportunities and 0 metrics for a newly registered business', async () => {
      mockDb.opportunity.count.mockResolvedValue(0)
      mockDb.opportunity.findMany.mockResolvedValue([])
      mockDb.dealParticipation.count.mockResolvedValue(0)
      mockDb.dealParticipation.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/business/overview?period=7D', {
        method: 'GET',
        headers: { cookie: 'lumo_db_session=valid_token' },
      })

      const res = await getOverview(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.metrics.liveOpportunitiesCount).toBe(0)
      expect(json.metrics.totalOpportunitiesCount).toBe(0)
      expect(json.metrics.activePartnersCount).toBe(0)
      expect(json.metrics.totalConversions).toBe(0)
      expect(json.metrics.totalDealValueTZS).toBe(0)
      expect(json.metrics.pipelineRevenueTZS).toBe(0)

      // Series contains 7 zero-filled rolling day buckets, no fake spikes
      expect(json.series.length).toBe(7)
      expect(json.series.every((pt: any) => pt.pipelineRevenueTZS === 0)).toBe(true)
    })

    it('returns empty array [] when new business lists its opportunities', async () => {
      mockDb.opportunity.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/business/opportunities', {
        method: 'GET',
        headers: { cookie: 'lumo_db_session=valid_token' },
      })

      const res = await getOpportunities(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.opportunities).toEqual([])
      expect(json.data).toEqual([])
    })

    it('returns empty array [] when new business lists partner applications', async () => {
      mockDb.dealParticipation.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/business/partners', {
        method: 'GET',
        headers: { cookie: 'lumo_db_session=valid_token' },
      })

      const res = await getPartners(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.partners).toEqual([])
      expect(json.data).toEqual([])
    })
  })

  describe('4. Opportunity Immutability & Lifecycle Guard', () => {
    it('refuses to delete a PUBLISHED opportunity', async () => {
      mockDb.opportunity.findUnique.mockResolvedValueOnce({
        id: 'opp_published_1',
        organizationId: BIZ_A_ID,
        status: 'PUBLISHED',
      })

      const req = new NextRequest('http://localhost:3000/api/business/opportunities/opp_published_1', {
        method: 'DELETE',
        headers: { cookie: 'lumo_db_session=valid_token' },
      })

      const res = await deleteOpportunity(req, { params: Promise.resolve({ id: 'opp_published_1' }) })
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error).toContain('Only unpublished DRAFT opportunities can be deleted')
    })

    it('allows deleting an unpublished DRAFT opportunity with 0 enrolled partners', async () => {
      mockDb.opportunity.findUnique.mockResolvedValueOnce({
        id: 'opp_draft_1',
        organizationId: BIZ_A_ID,
        status: 'DRAFT',
      })

      mockDb.dealParticipation.count.mockResolvedValueOnce(0)
      mockDb.opportunity.update.mockResolvedValueOnce({ id: 'opp_draft_1' })

      const req = new NextRequest('http://localhost:3000/api/business/opportunities/opp_draft_1', {
        method: 'DELETE',
        headers: { cookie: 'lumo_db_session=valid_token' },
      })

      const res = await deleteOpportunity(req, { params: Promise.resolve({ id: 'opp_draft_1' }) })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })

    it('duplication creates clean DRAFT opportunity owned by same business with 0 partners', async () => {
      mockDb.opportunity.findUnique.mockResolvedValueOnce({
        id: 'opp_orig',
        organizationId: BIZ_A_ID,
        title: 'Wholesale Rice Delivery',
        slug: 'wholesale-rice-delivery',
        summary: 'Deliver rice',
        description: 'Commercial deal',
        opportunityType: 'COMMERCIAL_DEAL',
        category: 'Agriculture',
        region: 'Morogoro',
        rewardType: 'FIXED',
        totalBudgetMinor: 500000000n,
        maxPartners: 20,
      })

      mockDb.opportunity.create.mockResolvedValueOnce({
        id: 'opp_orig_copy',
        organizationId: BIZ_A_ID,
        title: 'Wholesale Rice Delivery (Copy)',
        slug: 'wholesale-rice-delivery-copy',
        status: 'DRAFT',
        activePartnerCount: 0,
      })

      const req = new NextRequest('http://localhost:3000/api/business/opportunities/opp_orig/duplicate', {
        method: 'POST',
        headers: { cookie: 'lumo_db_session=valid_token' },
      })

      const res = await duplicateOpportunity(req, { params: Promise.resolve({ id: 'opp_orig' }) })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('DRAFT')
      expect(json.data.title).toContain('(Copy)')
    })
  })
})
