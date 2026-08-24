import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  authorize,
  requireAuth,
  requireRole,
  requirePermission,
  requireTenant,
  AuthError,
} from '@/lib/auth-guard'
import { hasPermission } from '@/lib/permissions'
import {
  createServerSession,
  getServerSession,
  rotateServerSession,
  revokeServerSession,
  SESSION_COOKIE_NAME,
} from '@/lib/session'
import { auditMemoryStore } from '@/lib/audit'
import { authorizePayoutBatch } from '@/modules/payouts/service'

describe('Enterprise Authorization, Least Privilege & Workspace Security', () => {
  beforeEach(() => {
    // Clear memory audit log between runs
    auditMemoryStore.length = 0
  })

  describe('1. Default-Deny & Authentication Enforcement', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const request = new NextRequest('http://localhost:3000/api/payouts/authorize', {
        method: 'POST',
      })

      await expect(
        authorize(request, { permission: 'payout.authorize' })
      ).rejects.toThrowError(AuthError)

      try {
        await authorize(request, { permission: 'payout.authorize' })
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError)
        expect((err as AuthError).statusCode).toBe(401)
      }
    })

    it('records security audit event upon unauthenticated access attempt', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/audit', {
        method: 'GET',
      })

      await expect(authorize(request, { permission: 'audit.read' })).rejects.toThrow()
      const deniedEvent = auditMemoryStore.find((e) => e.action.includes('UNAUTHENTICATED_ACCESS_ATTEMPT'))
      expect(deniedEvent).toBeDefined()
      expect(deniedEvent?.outcome).toBe('DENIED')
    })
  })

  describe('2. Least Privilege RBAC & Admin Gate', () => {
    it('normal partner cannot access privileged admin permissions (403 Forbidden)', async () => {
      const request = new NextRequest('http://localhost:3000/api/payouts/authorize', {
        method: 'POST',
        headers: {
          'X-User-Id': 'usr_partner_123',
          'X-User-Role': 'PARTNER',
        },
      })

      await expect(
        authorize(request, { permission: 'payout.authorize' })
      ).rejects.toThrowError(AuthError)

      try {
        await authorize(request, { permission: 'payout.authorize' })
      } catch (err) {
        expect((err as AuthError).statusCode).toBe(403)
      }
    })

    it('support analyst can view support cases but cannot approve financial payouts', async () => {
      const request = new NextRequest('http://localhost:3000/api/payouts/authorize', {
        method: 'POST',
        headers: {
          'X-User-Id': 'usr_support_01',
          'X-User-Role': 'SUPPORT_ANALYST',
        },
      })

      // Support analyst CAN manage support
      const supportAuth = await authorize(request, { permission: 'support.manage' })
      expect(supportAuth.userId).toBe('usr_support_01')

      // Support analyst CANNOT authorize payouts
      await expect(
        authorize(request, { permission: 'payout.authorize' })
      ).rejects.toThrowError(AuthError)
    })
  })

  describe('3. Anti-IDOR Tenant Isolation', () => {
    it('prevents Business A from accessing Business B data', async () => {
      const request = new NextRequest('http://localhost:3000/api/opportunities', {
        method: 'POST',
        headers: {
          'X-User-Id': 'usr_business_a',
          'X-User-Role': 'BUSINESS_OWNER',
          'X-Organization-Id': 'org_business_a',
        },
      })

      // Accessing own organization is permitted
      const ownOrgAuth = await authorize(request, {
        permission: 'deal.create',
        organizationId: 'org_business_a',
      })
      expect(ownOrgAuth.userId).toBe('usr_business_a')

      // Attempting cross-tenant access to Business B is rejected with 403
      await expect(
        authorize(request, {
          permission: 'deal.create',
          organizationId: 'org_business_b',
        })
      ).rejects.toThrowError(AuthError)

      const tenantViolation = auditMemoryStore.find((e) => e.action.includes('TENANT_ISOLATION_VIOLATION'))
      expect(tenantViolation).toBeDefined()
      expect(tenantViolation?.organizationId).toBe('org_business_b')
    })
  })

  describe('4. Maker-Checker Segregation Rule', () => {
    it('finance maker cannot approve their own initiated transaction', async () => {
      const request = new NextRequest('http://localhost:3000/api/payouts/authorize', {
        method: 'POST',
        headers: {
          'X-User-Id': 'usr_maker_1',
          'X-User-Role': 'ADMIN',
          'X-MFA-Elevated': 'true',
        },
      })

      await expect(
        authorize(request, {
          permission: 'payout.authorize',
          makerCheckerCheck: {
            makerUserId: 'usr_maker_1', // Same user as actor
          },
        })
      ).rejects.toThrowError(/Maker-Checker Violation/)

      const makerViolation = auditMemoryStore.find((e) => e.action.includes('MAKER_CHECKER_SELF_APPROVAL_BLOCKED'))
      expect(makerViolation).toBeDefined()
    })

    it('dual control engine prevents creator from authorizing payout batch', async () => {
      const draft = (await import('@/modules/payouts/service')).createPayoutDraft({
        makerUserId: 'usr_creator_finance',
        makerName: 'Finance Initiator',
        totalAmountTZS: 50000000n, // 500,000 TZS
      })

      await expect(
        authorizePayoutBatch({
          payoutId: draft.id,
          authorizerUserId: 'usr_creator_finance', // Creator of the batch
          authorizerName: 'Creator Self',
        })
      ).rejects.toThrowError(/MAKER_CHECKER_VIOLATION/)
    })
  })

  describe('5. Role Suspension & Immediate Revocation', () => {
    it('suspended role assignment immediately loses all permissions', () => {
      const activeAssignments = [
        { role: 'FINANCE_CHECKER' as const, status: 'ACTIVE' as const },
      ]
      expect(hasPermission(activeAssignments, 'payout.authorize')).toBe(true)

      const suspendedAssignments = [
        { role: 'FINANCE_CHECKER' as const, status: 'SUSPENDED' as const },
      ]
      expect(hasPermission(suspendedAssignments, 'payout.authorize')).toBe(false)

      const revokedAssignments = [
        { role: 'FINANCE_CHECKER' as const, status: 'REVOKED' as const },
      ]
      expect(hasPermission(revokedAssignments, 'payout.authorize')).toBe(false)
    })
  })

  describe('6. Opaque Server Session & OWASP Session Rotation', () => {
    it('creates opaque session token and rotates token upon privilege elevation', () => {
      const session = createServerSession({
        userId: 'usr_given',
        email: 'given@lumo.co.tz',
        name: 'Given M.',
        roles: [{ role: 'SUPER_ADMIN', status: 'ACTIVE' }],
        workspaces: [],
      })

      expect(session.sessionId).toMatch(/^ses_/)
      expect(getServerSession(session.sessionId)).not.toBeNull()

      // Rotate session after step-up MFA
      const rotated = rotateServerSession(session.sessionId, {
        authenticationLevel: 'ELEVATED_MFA',
        mfaVerifiedAt: new Date().toISOString(),
      })

      expect(rotated).not.toBeNull()
      expect(rotated?.sessionId).not.toBe(session.sessionId)
      expect(rotated?.authenticationLevel).toBe('ELEVATED_MFA')

      // Old session must be invalidated immediately
      expect(getServerSession(session.sessionId)).toBeNull()
    })

    it('revokes session immediately', () => {
      const session = createServerSession({
        userId: 'usr_alex',
        email: 'alex@lumo.co.tz',
        name: 'Alex M.',
        roles: [{ role: 'PARTNER', status: 'ACTIVE' }],
        workspaces: [],
      })

      revokeServerSession(session.sessionId)
      expect(getServerSession(session.sessionId)).toBeNull()
    })
  })

  describe('7. Production Build Guard', () => {
    it('verifies simulation is disabled by default in production config', () => {
      const isSimEnabled = process.env.ENABLE_ROLE_SIMULATOR === 'true'
      // Production must have simulation disabled
      expect(isSimEnabled).toBe(false)
    })
  })
})
