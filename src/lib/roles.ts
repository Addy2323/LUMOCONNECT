export const platformRoles = [
  'CUSTOMER',
  'PARTNER',
  'BUSINESS_OWNER',
  'BUSINESS_STAFF',
  'SALES',
  'LOGISTICS',
  'SUPPORT',
  'FINANCE',
  'RISK_REVIEWER',
  // Specialized administrative roles
  'SUPPORT_ANALYST',
  'OPERATIONS_ADMIN',
  'COMPLIANCE_REVIEWER',
  'FINANCE_MAKER',
  'FINANCE_CHECKER',
  'AUDITOR',
  'ADMIN',
  'SUPER_ADMIN',
] as const

export type PlatformRole = (typeof platformRoles)[number]

export const roleStatuses = ['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REVOKED'] as const
export type RoleStatus = (typeof roleStatuses)[number]

export type RoleAssignment = {
  role: PlatformRole
  status: RoleStatus
  organizationId?: string
}

export const ADMIN_ROLES: readonly PlatformRole[] = [
  'SUPPORT_ANALYST',
  'OPERATIONS_ADMIN',
  'COMPLIANCE_REVIEWER',
  'FINANCE_MAKER',
  'FINANCE_CHECKER',
  'AUDITOR',
  'ADMIN',
  'SUPER_ADMIN',
]

export function isAdministrativeRole(role: PlatformRole): boolean {
  return ADMIN_ROLES.includes(role)
}

export function hasActiveRole(assignments: RoleAssignment[], role: PlatformRole, organizationId?: string): boolean {
  return assignments.some(
    (assignment) =>
      assignment.role === role &&
      assignment.status === 'ACTIVE' &&
      (!organizationId || assignment.organizationId === organizationId),
  )
}

export function hasAnyActiveAdminRole(assignments: RoleAssignment[]): boolean {
  return assignments.some(
    (assignment) => assignment.status === 'ACTIVE' && isAdministrativeRole(assignment.role)
  )
}
