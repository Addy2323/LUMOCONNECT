import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export interface AuthenticatedBusinessContext {
  userId: string
  userEmail: string
  userName: string
  userRole: string
  businessId: string // organizationId
  organizationName: string
  tradingName?: string
  verificationStatus: string
  registrationNumber?: string
  tin?: string
  businessRole: string // OWNER, ADMIN, STAFF, FINANCE, VIEWER
}

/**
 * Resolves the authenticated business context from a verified database session and active organization membership.
 * Throws an Error with a status code property if unauthorized.
 */
export async function getAuthenticatedBusiness(
  request: NextRequest
): Promise<AuthenticatedBusinessContext> {
  const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
  const session = await getDatabaseSession(sessionToken)

  if (!session) throw Object.assign(new Error('Authentication required'), { statusCode: 401 })
  const userId = session.userId
  const user = session.user
  const member = await db.organizationMember.findFirst({
    where: { userId, status: 'ACTIVE', organization: { deletedAt: null } },
    include: { organization: true }, orderBy: { createdAt: 'asc' },
  })

  if (!member || !member.organization) {
    const error: any = new Error('No active business profile or organization membership associated with this account.')
    error.statusCode = 403
    throw error
  }

  const org = member.organization
  const roleCode = user?.roleAssignments?.[0]?.role?.code || 'BUSINESS_OWNER'

  return {
    userId,
    userEmail: user?.email || '',
    userName: user?.name || org.legalName,
    userRole: roleCode,
    businessId: org.id,
    organizationName: org.legalName,
    tradingName: org.tradingName || org.legalName,
    verificationStatus: org.verificationStatus || 'PENDING',
    registrationNumber: org.registrationNumber || undefined,
    tin: org.tin || undefined,
    businessRole: member.businessRole || 'OWNER',
  }
}

/**
 * Asserts that an opportunity is owned by the specified businessId.
 * Throws 404 if opportunity not found, 403 if owned by another business.
 */
export async function assertOpportunityOwnership(
  opportunityId: string,
  businessId: string
) {
  const opp = await db.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
      },
      participations: true,
    },
  })

  if (!opp || opp.deletedAt) {
    const error: any = new Error('Opportunity not found')
    error.statusCode = 404
    throw error
  }

  if (opp.organizationId !== businessId) {
    const error: any = new Error('Forbidden: You do not have permission to access or modify this opportunity.')
    error.statusCode = 403
    throw error
  }

  return opp
}
