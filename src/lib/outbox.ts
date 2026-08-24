/**
 * LUMO Transactional Outbox Pattern Manager
 *
 * Guarantees at-least-once asynchronous event delivery for:
 * - SMS notifications (Meseji)
 * - Email alerts (Mailpit / SMTP)
 * - Webhook dispatches to external business systems
 * - Payout dispatches to Mongike mobile money
 * - Risk assessment triggers
 */

import { nanoid } from 'nanoid'

export type OutboxEventType =
  | 'CONVERSION_RECORDED'
  | 'REWARD_PENDING'
  | 'REWARD_APPROVED'
  | 'PAYOUT_AUTHORIZED'
  | 'PAYOUT_DISBURSED'
  | 'RISK_ALERT_TRIGGERED'
  | 'NOTIFICATION_DISPATCH'
  | 'WEBHOOK_DELIVERY'

export type OutboxStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED'

export interface OutboxEventRecord {
  id: string
  eventType: OutboxEventType
  aggregateType: string
  aggregateId: string
  payload: Record<string, unknown>
  status: OutboxStatus
  retryCount: number
  maxRetries: number
  lastError?: string
  createdAt: Date
  processedAt?: Date
}

// In-memory outbox store for fast asynchronous processing & testing
const inMemoryOutbox: OutboxEventRecord[] = []
const handlers: Map<OutboxEventType, Array<(event: OutboxEventRecord) => Promise<void>>> = new Map()

/**
 * Stage an event in the transactional outbox.
 */
export function emitOutboxEvent(
  eventType: OutboxEventType,
  aggregateType: string,
  aggregateId: string,
  payload: Record<string, unknown>,
  maxRetries: number = 3
): OutboxEventRecord {
  const event: OutboxEventRecord = {
    id: `evt_${nanoid(21)}`,
    eventType,
    aggregateType,
    aggregateId,
    payload,
    status: 'PENDING',
    retryCount: 0,
    maxRetries,
    createdAt: new Date(),
  }

  inMemoryOutbox.push(event)
  return event
}

/**
 * Register an event listener for an outbox event type.
 */
export function registerOutboxHandler(
  eventType: OutboxEventType,
  handler: (event: OutboxEventRecord) => Promise<void>
): void {
  const existing = handlers.get(eventType) || []
  handlers.set(eventType, [...existing, handler])
}

/**
 * Process all pending events in the outbox queue.
 * Simulates background worker execution.
 */
export async function processOutboxQueue(limit: number = 50): Promise<{
  processed: number
  failed: number
  remaining: number
}> {
  const pendingEvents = inMemoryOutbox
    .filter((e) => e.status === 'PENDING' || (e.status === 'FAILED' && e.retryCount < e.maxRetries))
    .slice(0, limit)

  let processedCount = 0
  let failedCount = 0

  for (const event of pendingEvents) {
    event.status = 'PROCESSING'
    const eventHandlers = handlers.get(event.eventType) || []

    try {
      if (eventHandlers.length > 0) {
        await Promise.all(eventHandlers.map((h) => h(event)))
      }
      event.status = 'PROCESSED'
      event.processedAt = new Date()
      processedCount++
    } catch (err: unknown) {
      event.retryCount += 1
      event.lastError = err instanceof Error ? err.message : 'Unknown worker error'
      event.status = event.retryCount >= event.maxRetries ? 'FAILED' : 'PENDING'
      failedCount++
    }
  }

  const remaining = inMemoryOutbox.filter((e) => e.status === 'PENDING').length

  return {
    processed: processedCount,
    failed: failedCount,
    remaining,
  }
}

/**
 * Get all outbox events, optionally filtered by status or aggregate ID.
 */
export function getOutboxEvents(filter?: {
  status?: OutboxStatus
  aggregateId?: string
  eventType?: OutboxEventType
}): OutboxEventRecord[] {
  return inMemoryOutbox.filter((e) => {
    if (filter?.status && e.status !== filter.status) return false
    if (filter?.aggregateId && e.aggregateId !== filter.aggregateId) return false
    if (filter?.eventType && e.eventType !== filter.eventType) return false
    return true
  })
}

/**
 * Clears the outbox queue (used in unit test resets).
 */
export function resetOutbox(): void {
  inMemoryOutbox.length = 0
}
