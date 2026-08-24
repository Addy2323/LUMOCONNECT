import type { PlatformRole, RoleAssignment } from './roles'
import { hasActiveRole } from './roles'

export const permissions = [
  'deal.create',
  'deal.publish',
  'conversion.review',
  'commission.approve',
  'payout.authorize',
  'risk.review',
  'dispute.resolve',
  'user.suspend',
  'audit.read',
] as const

export type Permission = (typeof permissions)[number]

const rolePermissions: Partial<Record<PlatformRole, readonly Permission[]>> = {
  BUSINESS_OWNER: ['deal.create', 'deal.publish'],
  BUSINESS_STAFF: ['deal.create'],
  FINANCE: ['commission.approve'],
  RISK_REVIEWER: ['conversion.review', 'risk.review'],
  SUPPORT: ['dispute.resolve'],
  ADMIN: ['conversion.review', 'commission.approve', 'risk.review', 'dispute.resolve', 'user.suspend', 'audit.read'],
  SUPER_ADMIN: permissions,
}

export function hasPermission(assignments: RoleAssignment[], permission: Permission, organizationId?: string) {
  return assignments.some((assignment) => {
    if (!hasActiveRole(assignments, assignment.role, organizationId)) return false
    return rolePermissions[assignment.role]?.includes(permission) ?? false
  })
}

export function assertPermission(assignments: RoleAssignment[], permission: Permission, organizationId?: string) {
  if (!hasPermission(assignments, permission, organizationId)) {
    throw new Error('FORBIDDEN')
  }
}
