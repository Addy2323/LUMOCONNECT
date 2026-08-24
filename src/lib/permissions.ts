import type { PlatformRole, RoleAssignment } from './roles'
import { hasActiveRole } from './roles'

export const permissions = [
  // Deals & Marketplace
  'deal.create',
  'deal.publish',
  'deal.view',
  'deal.review',
  'opportunity.review',

  // Conversions & Tracking
  'conversion.review',
  'conversion.adjust',

  // Financial & Payouts (Maker-Checker segregated)
  'commission.approve',
  'payout.create',       // Maker: Initiate payout batch
  'payout.authorize',    // Checker: Approve & disburse payout
  'refund.create',       // Maker: Initiate refund request
  'refund.authorize',    // Checker: Approve refund
  'ledger.read',

  // Risk, Compliance & KYC/KYB
  'risk.review',
  'compliance.kyc_review',
  'compliance.kyb_review',
  'business.review',

  // Support & Mediation
  'support.manage',
  'dispute.resolve',

  // User Administration & RBAC
  'user.view',
  'user.suspend',
  'roles.manage',
  'system.config',

  // Audit
  'audit.read',
] as const

export type Permission = (typeof permissions)[number]

/**
 * Granular Least-Privilege Role-to-Permission Mapping (Deny-by-default)
 */
export const rolePermissions: Record<PlatformRole, readonly Permission[]> = {
  CUSTOMER: ['deal.view'],
  PARTNER: ['deal.view'],
  BUSINESS_OWNER: ['deal.create', 'deal.publish', 'deal.view', 'ledger.read'],
  BUSINESS_STAFF: ['deal.create', 'deal.view'],
  SALES: ['deal.view'],
  LOGISTICS: ['deal.view'],
  SUPPORT: ['user.view', 'support.manage', 'dispute.resolve'],
  FINANCE: ['commission.approve', 'payout.create', 'refund.create', 'ledger.read'],
  RISK_REVIEWER: ['conversion.review', 'risk.review', 'compliance.kyc_review'],

  // Specialized Administrative Roles
  SUPPORT_ANALYST: [
    'user.view',
    'support.manage',
    'dispute.resolve',
  ],
  OPERATIONS_ADMIN: [
    'business.review',
    'deal.review',
    'opportunity.review',
    'compliance.kyb_review',
    'user.view',
    'dispute.resolve',
  ],
  COMPLIANCE_REVIEWER: [
    'compliance.kyc_review',
    'compliance.kyb_review',
    'risk.review',
    'conversion.review',
    'user.view',
  ],
  FINANCE_MAKER: [
    'payout.create',
    'refund.create',
    'commission.approve',
    'ledger.read',
  ],
  FINANCE_CHECKER: [
    'payout.authorize',
    'refund.authorize',
    'commission.approve',
    'ledger.read',
  ],
  AUDITOR: [
    'audit.read',
    'ledger.read',
    'user.view',
    'deal.view',
  ],
  ADMIN: [
    'deal.view',
    'deal.review',
    'opportunity.review',
    'conversion.review',
    'conversion.adjust',
    'commission.approve',
    'payout.create',
    'payout.authorize',
    'refund.create',
    'refund.authorize',
    'risk.review',
    'compliance.kyc_review',
    'compliance.kyb_review',
    'business.review',
    'support.manage',
    'dispute.resolve',
    'user.view',
    'user.suspend',
    'audit.read',
    'ledger.read',
  ],
  SUPER_ADMIN: permissions,
}

export function hasPermission(
  assignments: RoleAssignment[],
  permission: Permission,
  organizationId?: string
): boolean {
  if (!assignments || assignments.length === 0) return false

  return assignments.some((assignment) => {
    // Only ACTIVE assignments grant permissions (SUSPENDED and REVOKED grant nothing)
    if (assignment.status !== 'ACTIVE') return false
    
    // Check organization scoping if specified
    if (organizationId && assignment.organizationId && assignment.organizationId !== organizationId) {
      return false
    }

    const perms = rolePermissions[assignment.role] || []
    return perms.includes(permission)
  })
}

export function assertPermission(
  assignments: RoleAssignment[],
  permission: Permission,
  organizationId?: string
): void {
  if (!hasPermission(assignments, permission, organizationId)) {
    throw new Error(`FORBIDDEN: Missing required permission '${permission}'`)
  }
}
