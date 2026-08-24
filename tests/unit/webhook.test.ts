import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import { verifyMongikeSignature } from '@/app/api/webhooks/mongike/route'

describe('Mongike Ingress Webhook Verification', () => {
  const testSecret = 'whsec_test_secret_key_884920'

  it('validates a correct HMAC SHA-256 webhook signature', () => {
    const payload = JSON.stringify({
      eventId: 'evt_momo_01',
      eventType: 'FUNDING_DEPOSIT.CONFIRMED',
      reference: 'MOMO-TZ-98234',
      amountMinor: 25000000,
      currency: 'TZS',
      status: 'CONFIRMED',
    })

    const signature = crypto
      .createHmac('sha256', testSecret)
      .update(payload)
      .digest('hex')

    const isValid = verifyMongikeSignature({
      payload,
      signature,
      secret: testSecret,
    })

    expect(isValid).toBe(true)
  })

  it('rejects an altered payload or invalid signature (Tampering Protection)', () => {
    const originalPayload = JSON.stringify({ amount: 10000 })
    const tamperedPayload = JSON.stringify({ amount: 1000000 }) // Tampered amount

    const signature = crypto
      .createHmac('sha256', testSecret)
      .update(originalPayload)
      .digest('hex')

    const isValid = verifyMongikeSignature({
      payload: tamperedPayload,
      signature,
      secret: testSecret,
    })

    expect(isValid).toBe(false)
  })

  it('rejects signature when signed with different secret key', () => {
    const payload = JSON.stringify({ eventId: 'evt_001' })
    const wrongSignature = crypto
      .createHmac('sha256', 'wrong_secret_key')
      .update(payload)
      .digest('hex')

    const isValid = verifyMongikeSignature({
      payload,
      signature: wrongSignature,
      secret: testSecret,
    })

    expect(isValid).toBe(false)
  })
})
