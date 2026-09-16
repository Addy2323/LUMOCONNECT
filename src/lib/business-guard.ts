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
 * Resolves the authenticated business context from the session cookie or authorization headers.
 * Throws an Error with a status code property if unauthorized.
 */
export async function getAuthenticatedBusiness(
  request: NextRequest
): Promise<AuthenticatedBusinessContext> {
  const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
  const session = await getDatabaseSession(sessionToken)

  const headerUserId = request.headers.get('x-user-id')
  const userId = session?.userId || headerUserId

  if (!userId) {
    const error: any = new Error('Authentication required')
    error.statusCode = 401
    throw error
  }

  // Find user and their organization memberships
  let user: any = session?.user
  if (!user && process.env.DATABASE_URL?.trim()) {
    user = await db.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
        roleAssignments: {
          include: {
            role: true,
          },
        },
      },
    })
  }

  // Find organization membership
  let member: any = null
  if (process.env.DATABASE_URL?.trim()) {
    member = await db.organizationMember.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        organization: true,
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  // If no membership found, check if a test/fallback organization can be resolved for this specific user
  if (!member) {
    // Check if user has an organization created for them
    const org = await db.organization.findFirst({
      where: {
        members: {
          some: { userId },
        },
        deletedAt: null,
      },
    })

    if (org) {
      member = {
        organizationId: org.id,
        businessRole: 'OWNER',
        organization: org,
      }
    }
  }

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
