/**
 * Beem Africa API Client (Server-Only)
 *
 * Implements authoritative integration with Beem Africa:
 * - Provider-managed OTP Request (POST https://apiotp.beem.africa/v1/request)
 * - Provider-managed OTP Verify (POST https://apiotp.beem.africa/v1/verify)
 * - SMS Dispatch (POST https://apisms.beem.africa/v1/send)
 * - Delivery Reports (GET https://dlrapi.beem.africa/public/v1/delivery-reports)
 * - Vendor Balance (GET https://apisms.beem.africa/public/v1/vendors/balance)
 * - Sender Names (GET https://apisms.beem.africa/public/v1/sender-names)
 *
 * Security:
 * - Uses standard HTTP Basic Auth: Authorization: Basic base64(apiKey:secretKey).
 * - Treats the secretKey as an opaque credential without decoding it.
 * - Credentials are kept strictly server-side and never returned to clients or logged.
 */

import { normalizeTanzaniaPhone, isValidTanzaniaPhone, maskPhoneNumber } from '@/modules/sms/phone'
import {
  BEEM_SMS_ERROR_MAP,
  BEEM_OTP_REQUEST_ERROR_MAP,
  BEEM_OTP_VERIFY_ERROR_MAP,
} from '@/modules/sms/errors'

export interface BeemConfig {
  apiKey?: string
  secretKey?: string
  appId?: number | string
  appName?: string
  senderId?: string
  smsEnabled?: boolean
  enabled?: boolean
  dryRun?: boolean
  timeoutMs?: number
  otpBaseUrl?: string
  smsBaseUrl?: string
  dlrBaseUrl?: string
}

export interface BeemOtpRequestParams {
  msisdn?: string
  phone?: string
  appId?: number | string
}

export interface BeemOtpRequestResult {
  success: boolean
  pinId?: string
  code: number
  message: string
  pinExpiryMinutes?: number
  expiresInSeconds?: number
  isDryRun?: boolean
  error?: string
}

export interface BeemOtpVerifyParams {
  pinId: string
  pin: string
}

export interface BeemOtpVerifyResult {
  success: boolean
  code: number
  message: string
  isDryRun?: boolean
  error?: string
}

export interface BeemSendSmsRecipient {
  recipient_id: number
  dest_addr: string
}

export interface BeemSendSmsParams {
  source_addr?: string
  message: string
  encoding?: number
  recipients: BeemSendSmsRecipient[] | string[] | string
  schedule_time?: string
  job_name?: string
  campaign_title?: string
}

export interface BeemSendSmsResult {
  successful: boolean
  success?: boolean
  request_id?: string
  code: number
  message: string
  valid: number
  invalid: number
  duplicates: number
  opted_out: number
  total_validated: number
  isDryRun?: boolean
  isUncertain?: boolean
  error?: string
}

export interface BeemDeliveryReportItem {
  dest_addr: string
  status: 'DELIVERED' | 'PENDING' | 'UNDELIVERED' | string
  request_id: string
}

export interface BeemDeliveryReportResult {
  success: boolean
  reports: BeemDeliveryReportItem[]
  isPendingLookup?: boolean
  error?: string
}

export interface BeemSenderNameItem {
  id: string
  senderid: string
  status: string
  sample_content?: string
  created?: string
}

// In-memory dry run simulation store for OTPs
const dryRunOtpStore = new Map<string, { pin: string; expiresAt: number; attempts: number }>()

export class BeemClient {
  private apiKey: string
  private secretKey: string
  private appId: number | string
  private appName: string
  private _senderId: string
  private isSmsEnabled: boolean
  private isDryRun: boolean
  private timeoutMs: number
  private otpBaseUrl: string
  private smsBaseUrl: string
  private dlrBaseUrl: string

  constructor(config?: BeemConfig) {
    this.apiKey = config?.apiKey || process.env.BEEM_API_KEY || ''
    this.secretKey = config?.secretKey || process.env.BEEM_SECRET_KEY || ''
    this.appId = config?.appId || process.env.BEEM_APPLICATION_ID || 5075
    this.appName = config?.appName || process.env.BEEM_APPLICATION_NAME || 'lumo'
    this._senderId = config?.senderId || process.env.BEEM_SENDER_ID || 'MHEMA CARGO'
    this.isSmsEnabled = config?.enabled ?? config?.smsEnabled ?? (process.env.SMS_ENABLED === 'true')
    this.isDryRun = config?.dryRun ?? (process.env.SMS_DRY_RUN !== 'false')
    this.timeoutMs = config?.timeoutMs || 15000
    this.otpBaseUrl = (config?.otpBaseUrl || process.env.BEEM_OTP_BASE_URL || 'https://apiotp.beem.africa/v1').replace(/\/$/, '')
    this.smsBaseUrl = (config?.smsBaseUrl || process.env.BEEM_SMS_BASE_URL || 'https://apisms.beem.africa').replace(/\/$/, '')
    this.dlrBaseUrl = (config?.dlrBaseUrl || process.env.BEEM_DLR_BASE_URL || 'https://dlrapi.beem.africa').replace(/\/$/, '')
  }

  get senderId(): string {
    return this._senderId
  }

  get configuredSenderId(): string {
    return this._senderId
  }

  get applicationId(): number | string {
    return this.appId
  }

  get applicationName(): string {
    return this.appName
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.secretKey && this.apiKey.trim().length > 0 && this.secretKey.trim().length > 0)
  }

  get inDryRunMode(): boolean {
    return this.isDryRun || !this.isSmsEnabled
  }

  getConfig() {
    return {
      provider: 'beem',
      isConfigured: this.isConfigured,
      dryRun: this.inDryRunMode,
      enabled: this.isSmsEnabled,
      appId: this.appId,
      appName: this.appName,
      senderId: this.senderId,
    }
  }

  /**
   * Generates standard HTTP Basic Authentication header value.
   * Treats secretKey as an opaque string without decoding.
   */
  getAuthHeader(): string {
    const credentials = `${this.apiKey}:${this.secretKey}`
    return `Basic ${Buffer.from(credentials).toString('base64')}`
  }

  /**
   * Returns complete auth headers dictionary
   */
  getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: this.getAuthHeader(),
    }
  }

  /**
   * Safe fetch with timeout and bounded error handling
   */
  private async safeFetch(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      return res
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error(`Beem request timed out after ${this.timeoutMs}ms`)
      }
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }

  // ==========================================================================
  // 1. PROVIDER-MANAGED OTP
  // ==========================================================================

  /**
   * Requests a provider-managed OTP from Beem
   * Endpoint: POST https://apiotp.beem.africa/v1/request
   */
  async requestOtp(params: BeemOtpRequestParams): Promise<BeemOtpRequestResult> {
    const rawPhone = params.msisdn || (params as any).phone || ''
    const normalizedPhone = normalizeTanzaniaPhone(rawPhone)
    if (!normalizedPhone || normalizedPhone.length !== 12) {
      return {
        success: false,
        code: 102,
        message: 'Invalid phone number (MSISDN)',
        error: BEEM_OTP_REQUEST_ERROR_MAP[102]?.adminDescription || 'Invalid phone number',
      }
    }

    const targetAppId = params.appId ?? this.appId

    // Offline dry-run simulation
    if (this.inDryRunMode) {
      const simulatedPinId = `pin_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      // Store simulated 6-digit PIN in dry-run map (default 123456 for predictable testing)
      dryRunOtpStore.set(simulatedPinId, {
        pin: '123456',
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
      })

      const masked = maskPhoneNumber(normalizedPhone)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[BEEM OTP DRY-RUN] Dispatched to ${masked} (App: ${targetAppId}, PIN ID: ${simulatedPinId})`)
      }

      return {
        success: true,
        pinId: simulatedPinId,
        code: 100,
        message: 'OTP sent successfully',
        pinExpiryMinutes: 5,
        expiresInSeconds: 300,
        isDryRun: true,
      }
    }

    // Live execution
    try {
      const res = await this.safeFetch(`${this.otpBaseUrl}/request`, {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          appId: Number(targetAppId) || targetAppId,
          msisdn: normalizedPhone,
        }),
      })

      const json = await res.json().catch(() => ({}))
      const code = json?.data?.message?.code ?? json?.code ?? (res.ok ? 100 : 101)
      const message = json?.data?.message?.message ?? json?.message ?? (res.ok ? 'OTP sent successfully' : 'Request failed')

      if (!res.ok || code !== 100) {
        return {
          success: false,
          code,
          message,
          error: BEEM_OTP_REQUEST_ERROR_MAP[code]?.adminDescription || message,
        }
      }

      return {
        success: true,
        pinId: json?.data?.pinId,
        code: 100,
        message,
        pinExpiryMinutes: json?.data?.pinExpiryTimeInMinutes ?? 5,
        expiresInSeconds: json?.data?.expiresInSeconds ?? 300,
      }
    } catch (err: any) {
      return {
        success: false,
        code: 103,
        message: 'Network error communicating with Beem OTP gateway',
        error: err instanceof Error ? err.message : 'Unknown gateway error',
      }
    }
  }

  /**
   * Verifies an entered OTP with Beem using the server-stored pinId
   * Endpoint: POST https://apiotp.beem.africa/v1/verify
   */
  async verifyOtp(params: BeemOtpVerifyParams): Promise<BeemOtpVerifyResult> {
    const cleanPin = (params.pin || '').trim()
    const pinId = (params.pinId || '').trim()

    if (!pinId) {
      return {
        success: false,
        code: 112,
        message: 'pinId parameter is missing',
        error: BEEM_OTP_VERIFY_ERROR_MAP[112]?.adminDescription,
      }
    }

    if (!cleanPin) {
      return {
        success: false,
        code: 111,
        message: 'PIN parameter is missing',
        error: BEEM_OTP_VERIFY_ERROR_MAP[111]?.adminDescription,
      }
    }

    // Offline dry-run simulation
    if (this.inDryRunMode) {
      // Deterministic simulation based on code for test scenarios
      if (cleanPin === '000000') {
        return {
          success: false,
          code: 115,
          message: 'PIN timeout — PIN has expired',
          isDryRun: true,
          error: BEEM_OTP_VERIFY_ERROR_MAP[115]?.adminDescription,
        }
      }
      if (cleanPin === '888888') {
        return {
          success: false,
          code: 116,
          message: 'Attempts exceeded',
          isDryRun: true,
          error: BEEM_OTP_VERIFY_ERROR_MAP[116]?.adminDescription,
        }
      }

      const stored = dryRunOtpStore.get(pinId)
      if (stored) {
        if (Date.now() > stored.expiresAt) {
          dryRunOtpStore.delete(pinId)
          return {
            success: false,
            code: 115,
            message: 'PIN timeout',
            isDryRun: true,
            error: BEEM_OTP_VERIFY_ERROR_MAP[115]?.adminDescription,
          }
        }

        stored.attempts += 1
        if (stored.attempts > 3) {
          dryRunOtpStore.delete(pinId)
          return {
            success: false,
            code: 116,
            message: 'Attempts exceeded',
            isDryRun: true,
            error: BEEM_OTP_VERIFY_ERROR_MAP[116]?.adminDescription,
          }
        }

        if (cleanPin === stored.pin || cleanPin === '123456') {
          dryRunOtpStore.delete(pinId)
          return {
            success: true,
            code: 117,
            message: 'Valid PIN',
            isDryRun: true,
          }
        }

        return {
          success: false,
          code: 114,
          message: 'Incorrect PIN',
          isDryRun: true,
          error: BEEM_OTP_VERIFY_ERROR_MAP[114]?.adminDescription,
        }
      }

      // If not found in map but matches standard mock pin:
      if (cleanPin === '123456') {
        return {
          success: true,
          code: 117,
          message: 'Valid PIN',
          isDryRun: true,
        }
      }

      return {
        success: false,
        code: 114,
        message: 'Incorrect PIN',
        isDryRun: true,
        error: BEEM_OTP_VERIFY_ERROR_MAP[114]?.adminDescription,
      }
    }

    // Live execution
    try {
      const res = await this.safeFetch(`${this.otpBaseUrl}/verify`, {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          pinId,
          pin: cleanPin,
        }),
      })

      const json = await res.json().catch(() => ({}))
      const code = json?.data?.message?.code ?? json?.code ?? (res.ok ? 117 : 114)
      const message = json?.data?.message?.message ?? json?.message ?? (code === 117 ? 'Valid PIN' : 'Verification failed')

      if (!res.ok || code !== 117) {
        return {
          success: false,
          code,
          message,
          error: BEEM_OTP_VERIFY_ERROR_MAP[code]?.adminDescription || message,
        }
      }

      return {
        success: true,
        code: 117,
        message: 'Valid PIN',
      }
    } catch (err: any) {
      return {
        success: false,
        code: 103,
        message: 'Network error communicating with Beem OTP gateway',
        error: err instanceof Error ? err.message : 'Unknown gateway error',
      }
    }
  }

  // ==========================================================================
  // 2. ORDINARY TRANSACTIONAL SMS
  // ==========================================================================

  /**
   * Dispatches ordinary SMS messages via Beem SMS API
   * Endpoint: POST https://apisms.beem.africa/v1/send
   * Source Address: MHEMA CARGO (by default)
   */
  async sendSms(params: BeemSendSmsParams): Promise<BeemSendSmsResult> {
    const sender = params.source_addr || this.senderId
    const encoding = params.encoding ?? 0

    // Normalize recipients
    let recipientsList: BeemSendSmsRecipient[] = []
    if (typeof params.recipients === 'string') {
      const norm = normalizeTanzaniaPhone(params.recipients)
      recipientsList = [{ recipient_id: 1, dest_addr: norm }]
    } else if (Array.isArray(params.recipients)) {
      recipientsList = params.recipients.map((r, idx) => {
        if (typeof r === 'string') {
          return { recipient_id: idx + 1, dest_addr: normalizeTanzaniaPhone(r) }
        }
        return {
          recipient_id: r.recipient_id || idx + 1,
          dest_addr: normalizeTanzaniaPhone(r.dest_addr),
        }
      })
    }

    // Filter invalid addresses
    const validRecipients = recipientsList.filter((r) => r.dest_addr.length === 12 && r.dest_addr.startsWith('255'))
    if (validRecipients.length === 0) {
      return {
        successful: false,
        code: 101,
        message: 'Invalid destination phone number(s)',
        valid: 0,
        invalid: recipientsList.length,
        duplicates: 0,
        opted_out: 0,
        total_validated: recipientsList.length,
        error: BEEM_SMS_ERROR_MAP[101]?.adminDescription,
      }
    }

    if (!params.message || params.message.trim().length === 0) {
      return {
        successful: false,
        code: 109,
        message: 'Message text is empty',
        valid: 0,
        invalid: 1,
        duplicates: 0,
        opted_out: 0,
        total_validated: 1,
        error: BEEM_SMS_ERROR_MAP[109]?.adminDescription,
      }
    }

    // Offline dry-run simulation
    if (this.inDryRunMode) {
      const simulatedReqId = `beem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const masked = maskPhoneNumber(validRecipients[0].dest_addr)

      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[BEEM SMS DRY-RUN] Dispatched to ${masked} from ${sender}: "${params.message.slice(0, 45)}..." (ReqId: ${simulatedReqId})`
        )
      }

      return {
        successful: true,
        success: true,
        request_id: simulatedReqId,
        code: 100,
        message: 'Submitted for processing',
        valid: validRecipients.length,
        invalid: recipientsList.length - validRecipients.length,
        duplicates: 0,
        opted_out: 0,
        total_validated: recipientsList.length,
        isDryRun: true,
      }
    }

    // Live execution
    try {
      const res = await this.safeFetch(`${this.smsBaseUrl}/v1/send`, {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          source_addr: sender,
          message: params.message,
          encoding,
          recipients: validRecipients,
          schedule_time: params.schedule_time || '',
          job_name: params.job_name || '',
          campaign_title: params.campaign_title || '',
        }),
      })

      const json = await res.json().catch(() => ({}))
      const code = json?.code ?? (res.ok ? 100 : 103)
      const message = json?.message ?? (res.ok ? 'Submitted for processing' : 'Send failed')

      if (!res.ok || code !== 100) {
        return {
          successful: false,
          request_id: json?.request_id,
          code,
          message,
          valid: json?.valid ?? 0,
          invalid: json?.invalid ?? validRecipients.length,
          duplicates: json?.duplicates ?? 0,
          opted_out: json?.opted_out ?? 0,
          total_validated: json?.total_validated ?? validRecipients.length,
          error: BEEM_SMS_ERROR_MAP[code]?.adminDescription || message,
        }
      }

      return {
        successful: Boolean(json.successful ?? true),
        success: Boolean(json.successful ?? true),
        request_id: json.request_id,
        code: 100,
        message,
        valid: json.valid ?? validRecipients.length,
        invalid: json.invalid ?? 0,
        duplicates: json.duplicates ?? 0,
        opted_out: json.opted_out ?? 0,
        total_validated: json.total_validated ?? validRecipients.length,
      }
    } catch (err: any) {
      // Timeout after possible submission: treat as UNCERTAIN to avoid blind duplicates
      const isTimeout = err?.message?.includes('timed out')
      return {
        successful: false,
        code: 103,
        message: isTimeout
          ? 'Submission timed out. Treated as UNCERTAIN to avoid duplicate charges.'
          : 'Network error communicating with Beem SMS Gateway',
        valid: 0,
        invalid: 0,
        duplicates: 0,
        opted_out: 0,
        total_validated: validRecipients.length,
        isUncertain: isTimeout,
        error: err instanceof Error ? err.message : 'Unknown network failure',
      }
    }
  }

  // ==========================================================================
  // 3. DELIVERY REPORTS
  // ==========================================================================

  /**
   * Retrieves delivery status for a sent message
   * Endpoint: GET https://dlrapi.beem.africa/public/v1/delivery-reports
   * Note: HTTP 404 is an unsuccessful lookup (in-flight), NOT proof of delivery failure.
   */
  async getDeliveryReports(dest_addr: string, request_id: string): Promise<BeemDeliveryReportResult> {
    const norm = normalizeTanzaniaPhone(dest_addr)
    const reqId = (request_id || '').trim()

    if (!norm || !reqId) {
      return {
        success: false,
        reports: [],
        error: 'Both dest_addr and request_id are required for delivery reports.',
      }
    }

    // Dry-run simulation
    if (this.inDryRunMode) {
      return {
        success: true,
        reports: [
          {
            dest_addr: norm,
            status: 'DELIVERED',
            request_id: reqId,
          },
        ],
      }
    }

    try {
      const url = `${this.dlrBaseUrl}/public/v1/delivery-reports?dest_addr=${encodeURIComponent(norm)}&request_id=${encodeURIComponent(reqId)}`
      const res = await this.safeFetch(url, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: 'application/json',
        },
      })

      if (res.status === 404) {
        // Documented behavior: 404 is an unsuccessful lookup (not proof of failure)
        return {
          success: true,
          reports: [
            {
              dest_addr: norm,
              status: 'PENDING',
              request_id: reqId,
            },
          ],
          isPendingLookup: true,
        }
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        return {
          success: false,
          reports: [],
          error: json?.message || `Delivery report lookup returned HTTP ${res.status}`,
        }
      }

      const list = await res.json().catch(() => [])
      if (Array.isArray(list)) {
        return {
          success: true,
          reports: list.map((item: any) => ({
            dest_addr: item.dest_addr,
            status: item.status || 'PENDING',
            request_id: item.request_id || reqId,
          })),
        }
      }

      return {
        success: true,
        reports: [],
      }
    } catch (err: any) {
      return {
        success: false,
        reports: [],
        error: err instanceof Error ? err.message : 'Failed to query delivery reports',
      }
    }
  }

  /**
   * Retrieves single delivery report result with status helper
   */
  async getDeliveryReport(params: { dest_addr: string; request_id: string }): Promise<{ success: boolean; status?: string; reports?: BeemDeliveryReportItem[]; error?: string }> {
    const res = await this.getDeliveryReports(params.dest_addr, params.request_id)
    return {
      success: res.success,
      status: res.isPendingLookup ? 'IN_FLIGHT' : (res.reports[0]?.status || 'PENDING'),
      reports: res.reports,
      error: res.error,
    }
  }

  // ==========================================================================
  // 4. VENDOR BALANCE & SENDER NAMES
  // ==========================================================================

  /**
   * Retrieves account SMS credit balance
   * Endpoint: GET https://apisms.beem.africa/public/v1/vendors/balance
   */
  async getVendorBalance(): Promise<{ success: boolean; credit_balance: number; currency: string; error?: string }> {
    if (this.inDryRunMode) {
      return {
        success: true,
        credit_balance: 75000,
        currency: 'TZS',
      }
    }

    try {
      const res = await this.safeFetch(`${this.smsBaseUrl}/public/v1/vendors/balance`, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: 'application/json',
        },
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        return {
          success: false,
          credit_balance: 0,
          currency: 'TZS',
          error: json?.message || `Balance query returned HTTP ${res.status}`,
        }
      }

      return {
        success: true,
        credit_balance: json?.data?.credit_balance ?? 0,
        currency: 'TZS',
      }
    } catch (err: any) {
      return {
        success: false,
        credit_balance: 0,
        currency: 'TZS',
        error: err instanceof Error ? err.message : 'Balance query failed',
      }
    }
  }

  /**
   * Lists approved sender names on this account
   * Endpoint: GET https://apisms.beem.africa/public/v1/sender-names
   */
  async listSenderNames(): Promise<{ success: boolean; sender_names: BeemSenderNameItem[]; error?: string }> {
    if (this.inDryRunMode) {
      return {
        success: true,
        sender_names: [
          {
            id: 'snd_beem_1',
            senderid: this.senderId,
            status: 'ACTIVE',
            created: new Date().toISOString(),
          },
        ],
      }
    }

    try {
      const res = await this.safeFetch(`${this.smsBaseUrl}/public/v1/sender-names`, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: 'application/json',
        },
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        return {
          success: false,
          sender_names: [],
          error: json?.message || `Sender names query returned HTTP ${res.status}`,
        }
      }

      const list: any[] = json?.data || []
      return {
        success: true,
        sender_names: list.map((item) => ({
          id: item.id || '',
          senderid: item.senderid || '',
          status: (item.status || 'PENDING').toUpperCase(),
          sample_content: item.sample_content,
          created: item.created,
        })),
      }
    } catch (err: any) {
      return {
        success: false,
        sender_names: [],
        error: err instanceof Error ? err.message : 'Failed to retrieve sender names',
      }
    }
  }
}

let defaultBeemClient: BeemClient | null = null

export function getBeemClient(): BeemClient {
  if (!defaultBeemClient) {
    defaultBeemClient = new BeemClient()
  }
  return defaultBeemClient
}
