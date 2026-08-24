export type AuditEventInput = {
  action: string
  actorId: string
  organizationId?: string
  entityType: string
  entityId: string
  outcome: 'SUCCESS' | 'DENIED' | 'FAILURE'
  reason?: string
  correlationId: string
  metadata?: Record<string, string | number | boolean | null>
}

/**
 * Persistence is intentionally injected so the domain boundary can be tested
 * without coupling UI code to a database. The production adapter will write
 * append-only AuditEvent rows once the database integration is connected.
 */
export type AuditEventSink = (event: AuditEventInput) => Promise<void>

export async function recordAuditEvent(sink: AuditEventSink, event: AuditEventInput) {
  if (!event.actorId || !event.action || !event.entityType || !event.entityId || !event.correlationId) {
    throw new Error('INVALID_AUDIT_EVENT')
  }
  await sink({ ...event, metadata: event.metadata ? { ...event.metadata } : undefined })
}
