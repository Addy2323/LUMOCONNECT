/**
 * LUMO Audit Event & Security Event Logging System
 *
 * Append-only immutable audit trail. AuditLog rows are never updated or deleted.
 * Records actor, subject, reason, IP address, device, before/after values, and timestamp.
 */

export type AuditEventInput = {
  action: string
  actorId: string
  organizationId?: string
  entityType: string
  entityId: string
  outcome: 'SUCCESS' | 'DENIED' | 'FAILURE'
  reason?: string
  correlationId: string
  ipAddress?: string
  userAgent?: string
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  metadata?: Record<string, string | number | boolean | null>
}

export type AuditEventSink = (event: AuditEventInput) => Promise<void>

// Immutable in-memory audit trail storage for serverless runtime / tests
export const auditMemoryStore: AuditEventInput[] = []

export const defaultAuditSink: AuditEventSink = async (event: AuditEventInput) => {
  auditMemoryStore.push(Object.freeze({ ...event }))
}

export async function recordAuditEvent(
  sink: AuditEventSink = defaultAuditSink,
  event: AuditEventInput
): Promise<void> {
  if (!event.actorId || !event.action || !event.entityType || !event.entityId || !event.correlationId) {
    throw new Error('INVALID_AUDIT_EVENT')
  }
  await sink({ ...event, metadata: event.metadata ? { ...event.metadata } : undefined })
}

/**
 * Log a Security Event (failed authorization, suspicious privilege change, step-up MFA challenge)
 */
export async function recordSecurityEvent(params: {
  action: string
  actorId: string
  organizationId?: string
  resourceType: string
  resourceId: string
  reason: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, string | number | boolean | null>
}): Promise<void> {
  await recordAuditEvent(defaultAuditSink, {
    action: `SECURITY_${params.action}`,
    actorId: params.actorId,
    organizationId: params.organizationId,
    entityType: params.resourceType,
    entityId: params.resourceId,
    outcome: 'DENIED',
    reason: params.reason,
    correlationId: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    metadata: params.metadata,
  })
}

/**
 * Prisma-backed AuditEventSink for database persistence.
 */
export function prismaAuditSink(prisma: {
  auditLog: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>
  }
}): AuditEventSink {
  return async (event: AuditEventInput) => {
    await prisma.auditLog.create({
      data: {
        actorUserId: event.actorId,
        action: `${event.action}:${event.outcome}`,
        entityType: event.entityType,
        entityId: event.entityId,
        beforeData: event.beforeData ?? undefined,
        afterData: event.afterData ?? (event.metadata ? event.metadata : undefined),
        ipAddress: event.ipAddress ?? null,
        userAgent: event.userAgent ?? null,
        correlationId: event.correlationId,
      },
    })
  }
}
