import { describe, it, expect, beforeEach } from 'vitest'
import { emitOutboxEvent, processOutboxQueue, resetOutbox } from '@/lib/outbox'
import { getNotificationsForUser } from '@/modules/notifications/service'
import '@/modules/notifications/worker'

describe('Multi-Channel Notification Worker & SMS/Email Dispatch', () => {
  beforeEach(() => {
    resetOutbox()
  })

  it('dispatches in-app and SMS notification when a conversion is recorded', async () => {
    emitOutboxEvent('CONVERSION_RECORDED', 'CONVERSION', 'conv_notif_test', {
      conversionId: 'conv_notif_test',
      partnerId: 'partner_alex',
      netPayableMinor: '2250000', // TZS 22,500
      dealId: 'deal_ks_01',
    })

    const result = await processOutboxQueue()
    expect(result.processed).toBe(1)

    const notifs = getNotificationsForUser('partner_alex')
    expect(notifs.some((n) => n.title.includes('New Conversion'))).toBe(true)
  })

  it('dispatches payout disbursed notifications via SMS and email adapters', async () => {
    emitOutboxEvent('PAYOUT_DISBURSED', 'PAYOUT_BATCH', 'po_notif_test', {
      payoutNumber: 'LUMO-PAY-202608-99',
      amountMinor: '185000000', // TZS 1,850,000
    })

    const result = await processOutboxQueue()
    expect(result.processed).toBe(1)
  })
})
