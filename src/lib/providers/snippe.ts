import crypto from 'node:crypto'
import type {
  PaymentProvider,
  PaymentInitiationRequest,
  PaymentInitiationResult,
  PaymentVerificationResult,
} from './types'

export interface SnippeConfig {
  baseUrl?: string
  apiKey?: string
  webhookSecret?: string
}

export interface SnippeCustomerInput {
  firstname?: string
  lastname?: string
  email?: string
}

export interface SnippeInitiateOptions extends PaymentInitiationRequest {
  customerName?: string
  metadata?: Record<string, unknown>
}

export interface SnippeBalanceData {
  currency: string
  available: number
  balance: number
}

/**
 * Normalizes any Tanzanian phone number into canonical Snippe format: "255XXXXXXXXX"
 * Handles:
 * - "+255 781 000 000" -> "255781000000"
 * - "0781000000" -> "255781000000"
 * - "781000000" -> "255781000000"
 * - "255781000000" -> "255781000000"
 */
export function normalizeTanzanianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('255') && digits.length === 12) {
    return digits
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `255${digits.slice(1)}`
  }
  if (digits.length === 9) {
    return `255${digits}`
  }
  return digits
}

/**
 * Formats idempotency key to satisfy Snippe's strict requirement: <= 30 characters
 */
export function sanitizeIdempotencyKey(key: string): string {
  if (!key) return `idemp_${Date.now()}`.slice(0, 30)
  if (key.length <= 30) return key
  // Hash key if it exceeds 30 chars to maintain uniqueness
  const hash = crypto.createHash('md5').update(key).digest('hex')
  return `id_${hash.slice(0, 26)}`
}

/**
 * Snippe Payment Gateway Adapter
 * Supports Airtel Money, Vodacom M-Pesa, Mixx by Yas (Tigo), and Halotel in Tanzania.
 * Direct USSD push authorization flow with instant webhook callbacks.
 */
export class SnippePaymentAdapter implements PaymentProvider {
  name = 'SNIPPE_PAYMENT'
  private baseUrl: string
  private apiKey: string
  private webhookSecret: string

  constructor(config?: SnippeConfig) {
    this.baseUrl = (config?.baseUrl || process.env.SNIPPE_BASE_URL || 'https://api.snippe.sh').replace(/\/$/, '')
    this.apiKey =
      config?.apiKey ||
      process.env.SNIPPE_API_KEY ||
      'snp_02cbe72fa72352d42cc5e488e6613686e716a92ba62dee309bb86dd40700f3ef'
    this.webhookSecret =
      config?.webhookSecret || process.env.SNIPPE_WEBHOOK_SECRET || 'dev_snippe_webhook_secret_key'
  }

  /**
   * Initiates USSD push payment via POST /v1/payments
   */
  async initiatePayment(req: SnippeInitiateOptions): Promise<PaymentInitiationResult> {
    const rawPhone = req.customerPhone || '255781000000'
    const formattedPhone = normalizeTanzanianPhone(rawPhone)

    // Parse name
    let firstname = 'Customer'
    let lastname = 'LUMO'
    if (req.customerName?.trim()) {
      const parts = req.customerName.trim().split(/\s+/)
      firstname = parts[0]
      lastname = parts.slice(1).join(' ') || 'Customer'
    }

    const email = req.customerEmail || `customer_${formattedPhone}@lumo.co.tz`

    // Amount calculation: Snippe requires integer TZS (min 500)
    // Minor units in LUMO are 1/100 TZS. If amountMinorUnits is 5000000n => 50,000 TZS.
    let amountTZS = Number(req.amountMinorUnits / 100n)
    if (amountTZS <= 0) {
      amountTZS = Number(req.amountMinorUnits)
    }
    if (amountTZS < 500) {
      amountTZS = 500
    }

    const idempotencyKey = sanitizeIdempotencyKey(req.idempotencyKey || req.orderId)
    let callbackUrl =
      req.callbackUrl ||
      process.env.SNIPPE_WEBHOOK_URL ||
      'https://lumo.co.tz/api/webhooks/snippe'

    // Snippe rejects localhost, 127.0.0.1, or non-https URLs in all environments
    if (
      !callbackUrl ||
      callbackUrl.includes('localhost') ||
      callbackUrl.includes('127.0.0.1') ||
      callbackUrl.startsWith('http://')
    ) {
      callbackUrl = 'https://lumo.co.tz/api/webhooks/snippe'
    }

    const payload = {
      payment_type: 'mobile',
      details: {
        amount: Math.round(amountTZS),
        currency: 'TZS',
      },
      phone_number: formattedPhone,
      customer: {
        firstname,
        lastname,
        email,
      },
      webhook_url: callbackUrl,
      metadata: {
        order_id: req.orderId,
        payment_method: req.paymentMethod,
        ...(req.metadata || {}),
      },
    }

    try {
      const res = await fetch(`${this.baseUrl}/v1/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || data.status !== 'success') {
        const errMsg = data.message || `Snippe payment failed with status ${res.status}`
        return {
          success: false,
          providerReference: `ERR-${Date.now()}`,
          status: 'FAILED',
          instructions: errMsg,
          rawResponse: data,
        }
      }

      const paymentData = data.data
      const providerReference = paymentData.reference || paymentData.id

      return {
        success: true,
        providerReference,
        status: paymentData.status === 'completed' ? 'SUCCESSFUL' : 'PENDING',
        instructions: `A USSD push has been sent to your phone (${formattedPhone}). Please enter your PIN to authorize TZS ${amountTZS.toLocaleString()}.`,
        rawResponse: paymentData,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error connecting to Snippe'
      return {
        success: false,
        providerReference: `ERR-${Date.now()}`,
        status: 'FAILED',
        instructions: message,
        rawResponse: { error: message },
      }
    }
  }

  /**
   * Retrieves payment status via GET /v1/payments/{reference}
   */
  async verifyPayment(providerReference: string): Promise<PaymentVerificationResult> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/payments/${encodeURIComponent(providerReference)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      const data = await res.json()

      if (!res.ok || data.status !== 'success' || !data.data) {
        return {
          providerReference,
          orderId: '',
          amountMinorUnits: 0n,
          currency: 'TZS',
          status: 'FAILED',
          paymentMethod: 'MOBILE_MONEY',
        }
      }

      const item = data.data
      let status: 'SUCCESSFUL' | 'FAILED' | 'PENDING' = 'PENDING'
      if (item.status === 'completed') {
        status = 'SUCCESSFUL'
      } else if (item.status === 'failed' || item.status === 'voided' || item.status === 'expired') {
        status = 'FAILED'
      }

      const amountVal = item.amount?.value || 0
      const amountMinorUnits = BigInt(Math.round(amountVal * 100))

      return {
        providerReference,
        orderId: item.metadata?.order_id || '',
        amountMinorUnits,
        currency: item.amount?.currency || 'TZS',
        status,
        paymentMethod: item.channel?.provider ? item.channel.provider.toUpperCase() : 'MOBILE_MONEY',
        paidAt: item.completed_at ? new Date(item.completed_at) : undefined,
      }
    } catch {
      return {
        providerReference,
        orderId: '',
        amountMinorUnits: 0n,
        currency: 'TZS',
        status: 'PENDING',
        paymentMethod: 'MOBILE_MONEY',
      }
    }
  }

  /**
   * Triggers USSD Push to customer phone again via POST /v1/payments/{reference}/push
   */
  async triggerUssdPush(providerReference: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/payments/${encodeURIComponent(providerReference)}/push`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })
      const data = await res.json()
      return {
        success: res.ok && data.status === 'success',
        message: data.message || (res.ok ? 'USSD push prompt sent' : 'Failed to trigger USSD push'),
      }
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to trigger USSD push',
      }
    }
  }

  /**
   * Retrieves account balance via GET /v1/payments/balance
   */
  async getAccountBalance(): Promise<SnippeBalanceData> {
    const res = await fetch(`${this.baseUrl}/v1/payments/balance`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })
    const data = await res.json()
    if (!res.ok || data.status !== 'success' || !data.data) {
      throw new Error(data.message || 'Failed to fetch Snippe balance')
    }
    return {
      currency: data.data.balance?.currency || 'TZS',
      available: data.data.available?.value || 0,
      balance: data.data.balance?.value || 0,
    }
  }

  /**
   * Lists payments with pagination via GET /v1/payments?limit=...&offset=...
   */
  async listPayments(limit = 20, offset = 0): Promise<{ items: unknown[]; total: number }> {
    const res = await fetch(`${this.baseUrl}/v1/payments?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })
    const data = await res.json()
    if (!res.ok || data.status !== 'success') {
      throw new Error(data.message || 'Failed to list Snippe payments')
    }
    return {
      items: data.data?.items || [],
      total: data.data?.total || 0,
    }
  }

  /**
   * Verifies HMAC-SHA256 signature for Snippe Webhooks:
   * X-Webhook-Signature = hex(HMAC-SHA256(secret, "${timestamp}.${raw_body}"))
   */
  verifyWebhookSignature(signature: string, payload: string, timestamp?: string): boolean {
    if (!signature || !this.webhookSecret) return false

    try {
      let cleanSig = signature.trim()
      let ts = timestamp

      // Support Svix/Standard format: 't=12345,v1=abcdef...'
      if (cleanSig.includes('t=') && cleanSig.includes('v1=')) {
        const parts = cleanSig.split(',')
        for (const p of parts) {
          if (p.startsWith('t=')) ts = p.slice(2)
          if (p.startsWith('v1=')) cleanSig = p.slice(3)
        }
      } else if (cleanSig.startsWith('v1=')) {
        cleanSig = cleanSig.slice(3)
      } else if (cleanSig.startsWith('sha256=')) {
        cleanSig = cleanSig.slice(7)
      }

      const message = ts ? `${ts}.${payload}` : payload

      // Support secret with or without 'whsec_' prefix
      const secretsToTry = [this.webhookSecret]
      if (this.webhookSecret.startsWith('whsec_')) {
        secretsToTry.push(this.webhookSecret.slice(6))
      }

      for (const sec of secretsToTry) {
        // 1. Hex comparison
        const hmacHex = crypto.createHmac('sha256', sec).update(message).digest('hex')
        try {
          const sigBuf = Buffer.from(cleanSig, 'hex')
          const compBuf = Buffer.from(hmacHex, 'hex')
          if (sigBuf.length === compBuf.length && crypto.timingSafeEqual(sigBuf, compBuf)) {
            return true
          }
        } catch {}

        // 2. Base64 comparison
        const hmacB64 = crypto.createHmac('sha256', sec).update(message).digest('base64')
        if (cleanSig === hmacB64) {
          return true
        }

        // 3. Fallback: payload without timestamp
        const rawHmacHex = crypto.createHmac('sha256', sec).update(payload).digest('hex')
        try {
          const sigBuf = Buffer.from(cleanSig, 'hex')
          const compBuf = Buffer.from(rawHmacHex, 'hex')
          if (sigBuf.length === compBuf.length && crypto.timingSafeEqual(sigBuf, compBuf)) {
            return true
          }
        } catch {}

        const rawHmacB64 = crypto.createHmac('sha256', sec).update(payload).digest('base64')
        if (cleanSig === rawHmacB64) {
          return true
        }
      }

      return false
    } catch {
      return false
    }
  }
}
