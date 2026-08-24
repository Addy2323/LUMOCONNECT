import { describe, it, expect, beforeEach } from 'vitest'
import {
  emitOutboxEvent,
  processOutboxQueue,
  registerOutboxHandler,
  getOutboxEvents,
  resetOutbox,
} from '@/lib/outbox'

describe('Transactional Outbox Pattern Engine', () => {
  beforeEach(() => {
    resetOutbox()
  })

  it('stages outbox events in PENDING status', () => {
    const event = emitOutboxEvent(
      'CONVERSION_RECORDED',
      'CONVERSION',
      'conv_test_outbox_01',
      { amountMinor: '50000', partnerId: 'p_01' }
    )

    expect(event.id).toBeDefined()
    expect(event.status).toBe('PENDING')
    expect(event.retryCount).toBe(0)

    const pending = getOutboxEvents({ status: 'PENDING' })
    expect(pending.length).toBe(1)
  })

  it('processes outbox events with registered event handlers', async () => {
    let handledPayload: Record<string, unknown> | null = null

    registerOutboxHandler('PAYOUT_DISBURSED', async (evt) => {
      handledPayload = evt.payload
    })

    emitOutboxEvent('PAYOUT_DISBURSED', 'PAYOUT_BATCH', 'po_batch_test', {
      batchTotal: '1500000',
    })

    const result = await processOutboxQueue()
    expect(result.processed).toBe(1)
    expect(result.failed).toBe(0)
    expect(handledPayload).toEqual({ batchTotal: '1500000' })

    const processedEvents = getOutboxEvents({ status: 'PROCESSED' })
    expect(processedEvents.length).toBe(1)
    expect(processedEvents[0].processedAt).toBeDefined()
  })

  it('increments retry count and marks as FAILED after max retries exceeded', async () => {
    registerOutboxHandler('WEBHOOK_DELIVERY', async () => {
      throw new Error('Remote HTTP gateway timeout 504')
    })

    emitOutboxEvent(
      'WEBHOOK_DELIVERY',
      'WEBHOOK',
      'wh_fail_test',
      { url: 'https://api.business.tz/webhook' },
      2 // maxRetries = 2
    )

    // Attempt 1
    const run1 = await processOutboxQueue()
    expect(run1.failed).toBe(1)
    let events = getOutboxEvents({ aggregateId: 'wh_fail_test' })
    expect(events[0].retryCount).toBe(1)
    expect(events[0].status).toBe('PENDING') // Still pending retry

    // Attempt 2 (Exceeds maxRetries)
    const run2 = await processOutboxQueue()
    expect(run2.failed).toBe(1)
    events = getOutboxEvents({ aggregateId: 'wh_fail_test' })
    expect(events[0].retryCount).toBe(2)
    expect(events[0].status).toBe('FAILED')
    expect(events[0].lastError).toContain('504')
  })
})
