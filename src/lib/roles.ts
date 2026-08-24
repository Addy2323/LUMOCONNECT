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

export function hasActiveRole(assignments: RoleAssignment[], role: PlatformRole, organizationId?: string) {
  return assignments.some(
    (assignment) =>
      assignment.role === role &&
      assignment.status === 'ACTIVE' &&
      (!organizationId || assignment.organizationId === organizationId),
  )
}
