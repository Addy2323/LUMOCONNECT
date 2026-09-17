import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import {
  SnippePaymentAdapter,
  normalizeTanzanianPhone,
  sanitizeIdempotencyKey,
} from '@/lib/providers/snippe'

describe('Snippe Mobile Money Provider & Payment Adapter', () => {
  describe('normalizeTanzanianPhone', () => {
    it('normalizes international format with plus and spaces', () => {
      expect(normalizeTanzanianPhone('+255 781 000 000')).toBe('255781000000')
    })

    it('normalizes local leading-zero format (0781000000)', () => {
      expect(normalizeTanzanianPhone('0781000000')).toBe('255781000000')
    })

    it('normalizes 9-digit format without prefix (781000000)', () => {
      expect(normalizeTanzanianPhone('781000000')).toBe('255781000000')
    })

    it('leaves standard 12-digit format untouched (255781000000)', () => {
      expect(normalizeTanzanianPhone('255781000000')).toBe('255781000000')
    })
  })

  describe('sanitizeIdempotencyKey', () => {
    it('preserves keys that are 30 characters or fewer', () => {
      const shortKey = 'order-12345-attempt-1'
      expect(sanitizeIdempotencyKey(shortKey)).toBe(shortKey)
      expect(sanitizeIdempotencyKey(shortKey).length).toBeLessThanOrEqual(30)
    })

    it('hashes and shortens keys that exceed 30 characters', () => {
      const longKey = 'this_is_an_extremely_long_idempotency_key_that_exceeds_thirty_chars_1234567890'
      const sanitized = sanitizeIdempotencyKey(longKey)
      expect(sanitized.length).toBeLessThanOrEqual(30)
      expect(sanitized.startsWith('id_')).toBe(true)
    })
  })

  describe('SnippePaymentAdapter', () => {
    let adapter: SnippePaymentAdapter
    const secret = 'test_webhook_secret_snippe_123'
    const apiKey = 'snp_02cbe72fa72352d42cc5e488e6613686e716a92ba62dee309bb86dd40700f3ef'

    beforeEach(() => {
      adapter = new SnippePaymentAdapter({
        baseUrl: 'https://api.snippe.sh',
        apiKey,
        webhookSecret: secret,
      })
    })

    describe('verifyWebhookSignature', () => {
      it('successfully verifies a valid HMAC-SHA256 signature with timestamp', () => {
        const payload = JSON.stringify({
          id: 'evt_123',
          type: 'payment.completed',
          data: { reference: 'pi_test123', status: 'completed' },
        })
        const timestamp = '1789320000'
        const message = `${timestamp}.${payload}`
        const validSignature = crypto.createHmac('sha256', secret).update(message).digest('hex')

        const isValid = adapter.verifyWebhookSignature(validSignature, payload, timestamp)
        expect(isValid).toBe(true)
      })

      it('rejects a tampered signature', () => {
        const payload = JSON.stringify({ id: 'evt_123', type: 'payment.completed' })
        const timestamp = '1789320000'
        const invalidSig = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'

        const isValid = adapter.verifyWebhookSignature(invalidSig, payload, timestamp)
        expect(isValid).toBe(false)
      })

      it('rejects verification if payload is modified', () => {
        const payload = JSON.stringify({ id: 'evt_123', amount: 5000 })
        const tamperedPayload = JSON.stringify({ id: 'evt_123', amount: 50000 })
        const timestamp = '1789320000'
        const signature = crypto
          .createHmac('sha256', secret)
          .update(`${timestamp}.${payload}`)
          .digest('hex')

        const isValid = adapter.verifyWebhookSignature(signature, tamperedPayload, timestamp)
        expect(isValid).toBe(false)
      })
    })

    describe('initiatePayment payload formatting', () => {
      it('enforces minimum 500 TZS and constructs proper Snippe request', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            status: 'success',
            code: 201,
            data: {
              reference: 'pi_snippe_ref_001',
              status: 'pending',
              amount: { currency: 'TZS', value: 500 },
            },
          }),
        })

        global.fetch = mockFetch as unknown as typeof fetch

        const result = await adapter.initiatePayment({
          orderId: 'ORD-999',
          idempotencyKey: 'idemp-test-key',
          amountMinorUnits: 100n, // less than 500 TZS
          currency: 'TZS',
          customerPhone: '0765123456',
          customerName: 'Juma Kapwani',
          paymentMethod: 'MPESA',
          callbackUrl: 'https://lumo.co.tz/api/webhooks/snippe',
        })

        expect(result.success).toBe(true)
        expect(result.providerReference).toBe('pi_snippe_ref_001')
        expect(result.status).toBe('PENDING')

        expect(mockFetch).toHaveBeenCalledTimes(1)
        const [url, options] = mockFetch.mock.calls[0]
        expect(url).toBe('https://api.snippe.sh/v1/payments')
        expect(options.headers['Authorization']).toBe(`Bearer ${apiKey}`)
        expect(options.headers['Idempotency-Key']).toBe('idemp-test-key')

        const body = JSON.parse(options.body)
        expect(body.payment_type).toBe('mobile')
        expect(body.phone_number).toBe('255765123456')
        expect(body.details.amount).toBe(500) // Adjusted to 500 minimum
        expect(body.customer.firstname).toBe('Juma')
        expect(body.customer.lastname).toBe('Kapwani')
      })
    })

    describe('verifyPayment status mapping', () => {
      it('maps completed status to SUCCESSFUL', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            status: 'success',
            code: 200,
            data: {
              reference: 'pi_test_abc',
              status: 'completed',
              amount: { currency: 'TZS', value: 150000 },
              channel: { provider: 'mpesa', type: 'mobile_money' },
              completed_at: '2026-09-13T10:00:00Z',
              metadata: { order_id: 'ord_123' },
            },
          }),
        }) as unknown as typeof fetch

        const res = await adapter.verifyPayment('pi_test_abc')
        expect(res.status).toBe('SUCCESSFUL')
        expect(res.providerReference).toBe('pi_test_abc')
        expect(res.orderId).toBe('ord_123')
        expect(res.amountMinorUnits).toBe(15000000n)
        expect(res.paymentMethod).toBe('MPESA')
      })

      it('maps failed or voided status to FAILED', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            status: 'success',
            code: 200,
            data: {
              reference: 'pi_test_fail',
              status: 'failed',
              amount: { currency: 'TZS', value: 5000 },
            },
          }),
        }) as unknown as typeof fetch

        const res = await adapter.verifyPayment('pi_test_fail')
        expect(res.status).toBe('FAILED')
      })
    })

    describe('getAccountBalance', () => {
      it('fetches live account balance', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            status: 'success',
            code: 200,
            data: {
              api_version: '2026-01-25',
              available: { currency: 'TZS', value: 4875 },
              balance: { currency: 'TZS', value: 4875 },
              object: 'balance',
            },
          }),
        }) as unknown as typeof fetch

        const balance = await adapter.getAccountBalance()
        expect(balance.available).toBe(4875)
        expect(balance.balance).toBe(4875)
        expect(balance.currency).toBe('TZS')
      })
    })

    describe('sendPayout (Direct Mobile Money Transfer)', () => {
      it('rejects invalid recipient phone numbers', async () => {
        await expect(
          adapter.sendPayout({
            amountTZS: 10000,
            recipientPhone: '12345',
            recipientName: 'Test Recipient',
          })
        ).rejects.toThrow('Enter a valid Tanzanian mobile phone number')
      })

      it('rejects amounts under minimum 5,000 TZS', async () => {
        await expect(
          adapter.sendPayout({
            amountTZS: 2000,
            recipientPhone: '0711788830',
            recipientName: 'Given Mhema',
          })
        ).rejects.toThrow('Minimum mobile money payout via Snippe is TZS 5,000')
      })

      it('successfully dispatches payout and returns reference', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 201,
          json: async () => ({
            status: 'success',
            code: 201,
            message: 'Payout initiated successfully',
            data: {
              id: 'payout-uuid-123',
              reference: 'SNIPPE-PAY-882910',
              status: 'completed',
            },
          }),
        }) as unknown as typeof fetch

        const res = await adapter.sendPayout({
          amountTZS: 18400,
          recipientPhone: '0711788830',
          recipientName: 'Given Mhema',
          narration: 'Reward payout for LUMO-PAY-240893',
        })

        expect(res.success).toBe(true)
        expect(res.reference).toBe('SNIPPE-PAY-882910')
        expect(res.status).toBe('SUCCESSFUL')
      })
    })
  })

  describe('Snippe API Routes Security & Validation', () => {
    it('app/api/payments/initiate rejects unauthenticated requests with 401', async () => {
      const { POST } = await import('@/../app/api/payments/initiate/route')
      const req = {
        json: async () => ({
          action: 'PAY_NOW',
          requestId: 'b1442bb5-b541-4702-be53-f72be04ff6be',
          planCode: 'MONTHLY',
          phoneNumber: '0765123456',
          paymentMethod: 'MPESA',
        }),
        cookies: { get: () => undefined },
        headers: new Headers(),
        nextUrl: { origin: 'http://localhost:3000' },
      } as any

      const res = await POST(req)
      expect([401, 503].includes(res.status)).toBe(true)
    })

    it('app/api/webhooks/snippe rejects requests without valid HMAC signature with 401', async () => {
      const { POST } = await import('@/../app/api/webhooks/snippe/route')
      const webhookPayload = JSON.stringify({
        id: `evt_test_${Date.now()}`,
        type: 'payment.completed',
        data: {
          reference: `SNP-TEST-${Date.now()}`,
          status: 'completed',
        },
      })

      const req = {
        text: async () => webhookPayload,
        headers: new Headers({
          'X-Webhook-Event': 'payment.completed',
          'X-Webhook-Timestamp': Math.floor(Date.now() / 1000).toString(),
        }),
      } as any

      const res = await POST(req)
      expect(res.status).toBe(401)
    })
  })
})

