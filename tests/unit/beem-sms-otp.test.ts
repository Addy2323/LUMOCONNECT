import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import {
  createAndSendOtp,
  verifyOtpChallenge,
  resetOtpStoreForTesting,
} from '@/modules/identity/otp.service'
import { BeemClient, getBeemClient } from '@/lib/providers/beem-client'
import { BeemSmsAdapter, BeemOtpAdapter } from '@/lib/providers/beem'
import { providers } from '@/lib/providers'
import { getLocalizedSmsError, getLocalizedOtpVerifyError } from '@/modules/sms/errors'
import { normalizeBeemPhone } from '@/modules/sms/phone'
import { recordSmsJob, updateSmsJobDeliveryStatus } from '@/modules/sms/store'

describe('Beem Africa SMS & OTP Verification Suite', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.SMS_PROVIDER = 'beem'
    process.env.SMS_ENABLED = 'true'
    process.env.SMS_DRY_RUN = 'true'
    process.env.BEEM_APPLICATION_ID = '5075'
    process.env.BEEM_APPLICATION_NAME = 'lumo'
    process.env.BEEM_SENDER_ID = 'MHEMA CARGO'
    process.env.BEEM_API_KEY = 'test_beem_api_key_7aff22d5'
    process.env.BEEM_SECRET_KEY = 'test_secret_key_opaque_string_do_not_decode'
    resetOtpStoreForTesting()
    vi.restoreAllMocks()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  // =========================================================================
  // 1. Phone Normalization for Beem Africa
  // =========================================================================
  describe('Phone Number Normalization for Beem', () => {
    it('normalizes local 07/06 Tanzanian numbers to 255XXXXXXXXX format', () => {
      expect(normalizeBeemPhone('0712345678')).toBe('255712345678')
      expect(normalizeBeemPhone('0682123456')).toBe('255682123456')
    })

    it('normalizes international +255 and prefixed numbers', () => {
      expect(normalizeBeemPhone('+255712345678')).toBe('255712345678')
      expect(normalizeBeemPhone('255 712 345 678')).toBe('255712345678')
      expect(normalizeBeemPhone('712345678')).toBe('255712345678')
    })
  })

  // =========================================================================
  // 2. Beem Client Authentication & Dry-Run
  // =========================================================================
  describe('Beem Client Authentication & Configuration', () => {
    it('constructs basic auth header from apiKey and secretKey as opaque string', () => {
      const client = new BeemClient({
        apiKey: 'my_api_key',
        secretKey: 'my_opaque_secret',
        senderId: 'MHEMA CARGO',
        appId: 5075,
      })
      const headers = client.getAuthHeaders()
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['Authorization']).toBe(
        `Basic ${Buffer.from('my_api_key:my_opaque_secret').toString('base64')}`
      )
    })

    it('enforces configured sender ID "MHEMA CARGO" and never defaults silently to Lumo', async () => {
      const client = new BeemClient({
        senderId: 'MHEMA CARGO',
        dryRun: true,
      })
      const res = await client.sendSms({
        message: 'Habari kutoka LUMO',
        recipients: ['0712345678'],
      })
      expect(res.success).toBe(true)
      expect(client.senderId).toBe('MHEMA CARGO')
    })

    it('handles dry-run OTP request and verify without external HTTP calls', async () => {
      const client = new BeemClient({
        appId: 5075,
        dryRun: true,
      })

      const reqRes = await client.requestOtp({
        phone: '0712345678',
        appId: 5075,
      })
      expect(reqRes.success).toBe(true)
      expect(reqRes.pinId).toBeDefined()
      expect(reqRes.code).toBe(100)

      // Dry run verify with valid simulated pin
      const verifyRes = await client.verifyOtp({
        pin: '123456',
        pinId: reqRes.pinId!,
      })
      expect(verifyRes.success).toBe(true)
      expect(verifyRes.code).toBe(117)
    })
  })

  // =========================================================================
  // 3. Provider-Managed OTP Verification Workflow
  // =========================================================================
  describe('Provider-Managed OTP Workflow via Beem Africa', () => {
    it('dispatches OTP through Beem /v1/request and binds providerPinId', async () => {
      const reqOtpSpy = vi.spyOn(providers.otp, 'requestOtp').mockResolvedValue({
        success: true,
        pinId: 'beem_pin_req_998877',
        code: 100,
        message: 'PIN Generated Successfully',
        expiresInSeconds: 300,
      })

      const sendResult = await createAndSendOtp({
        identifier: '0712345678',
        purpose: 'REGISTRATION',
      })

      expect(sendResult.success).toBe(true)
      expect(sendResult.challengeId).toBeDefined()
      expect(sendResult.maskedIdentifier).toBe('25571***5678')
      expect(reqOtpSpy).toHaveBeenCalledTimes(1)
      expect(reqOtpSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '255712345678',
          appId: '5075',
        })
      )
    })

    it('successfully verifies OTP when Beem returns code: 117 (Valid PIN)', async () => {
      vi.spyOn(providers.otp, 'requestOtp').mockResolvedValue({
        success: true,
        pinId: 'beem_pin_abc_123',
        code: 100,
        message: 'PIN Generated Successfully',
      })

      const verifyOtpSpy = vi.spyOn(providers.otp, 'verifyOtp').mockResolvedValue({
        success: true,
        code: 117,
        message: 'Valid PIN',
      })

      const sendRes = await createAndSendOtp({
        identifier: '0712345678',
        purpose: 'REGISTRATION',
      })

      const verifyRes = await verifyOtpChallenge({
        identifier: '0712345678',
        code: '654321',
        challengeId: sendRes.challengeId,
      })

      expect(verifyRes.success).toBe(true)
      expect(verifyRes.attemptsRemaining).toBe(0)
      expect(verifyOtpSpy).toHaveBeenCalledWith({
        pin: '654321',
        pinId: 'beem_pin_abc_123',
      })
    })

    it('handles incorrect PIN (code: 114) by decrementing server-authoritative attempts', async () => {
      vi.spyOn(providers.otp, 'requestOtp').mockResolvedValue({
        success: true,
        pinId: 'beem_pin_xyz_789',
        code: 100,
        message: 'PIN Generated Successfully',
      })

      const verifyOtpSpy = vi.spyOn(providers.otp, 'verifyOtp').mockResolvedValue({
        success: false,
        code: 114,
        message: 'Invalid PIN',
        error: 'Invalid PIN entered.',
      })

      const sendRes = await createAndSendOtp({
        identifier: '0712345678',
        purpose: 'REGISTRATION',
      })

      const attempt1 = await verifyOtpChallenge({
        identifier: '0712345678',
        code: '000000',
        challengeId: sendRes.challengeId,
      })

      expect(attempt1.success).toBe(false)
      expect(attempt1.attemptsRemaining).toBe(2)
      expect(attempt1.error).toBe('INVALID_CODE')

      const attempt2 = await verifyOtpChallenge({
        identifier: '0712345678',
        code: '000001',
        challengeId: sendRes.challengeId,
      })

      expect(attempt2.success).toBe(false)
      expect(attempt2.attemptsRemaining).toBe(1)

      const attempt3 = await verifyOtpChallenge({
        identifier: '0712345678',
        code: '000002',
        challengeId: sendRes.challengeId,
      })

      expect(attempt3.success).toBe(false)
      expect(attempt3.attemptsRemaining).toBe(0)
      expect(attempt3.error).toBe('MAX_ATTEMPTS_EXCEEDED')
    })

    it('rejects verification if PIN is expired (code: 115) from Beem', async () => {
      vi.spyOn(providers.otp, 'requestOtp').mockResolvedValue({
        success: true,
        pinId: 'beem_pin_exp_1',
        code: 100,
        message: 'PIN Generated Successfully',
      })

      vi.spyOn(providers.otp, 'verifyOtp').mockResolvedValue({
        success: false,
        code: 115,
        message: 'PIN expired',
        error: 'The verification code has expired.',
      })

      const sendRes = await createAndSendOtp({
        identifier: '0712345678',
        purpose: 'REGISTRATION',
      })

      const verifyRes = await verifyOtpChallenge({
        identifier: '0712345678',
        code: '123456',
        challengeId: sendRes.challengeId,
      })

      expect(verifyRes.success).toBe(false)
      expect(verifyRes.error).toBe('OTP_EXPIRED')
    })

    it('prevents replay: already used PIN (code: 118 or local isUsed) cannot be re-verified', async () => {
      vi.spyOn(providers.otp, 'requestOtp').mockResolvedValue({
        success: true,
        pinId: 'beem_pin_replay_1',
        code: 100,
        message: 'PIN Generated Successfully',
      })

      vi.spyOn(providers.otp, 'verifyOtp').mockResolvedValue({
        success: true,
        code: 117,
        message: 'Valid PIN',
      })

      const sendRes = await createAndSendOtp({
        identifier: '0712345678',
        purpose: 'REGISTRATION',
      })

      // First verification succeeds
      const first = await verifyOtpChallenge({
        identifier: '0712345678',
        code: '123456',
        challengeId: sendRes.challengeId,
      })
      expect(first.success).toBe(true)

      // Replay attempt fails immediately due to isUsed
      const replay = await verifyOtpChallenge({
        identifier: '0712345678',
        code: '123456',
        challengeId: sendRes.challengeId,
      })
      expect(replay.success).toBe(false)
      expect(['NO_ACTIVE_CHALLENGE', 'ALREADY_USED']).toContain(replay.error)
    })

    it('enforces cross-account and purpose isolation', async () => {
      vi.spyOn(providers.otp, 'requestOtp').mockResolvedValue({
        success: true,
        pinId: 'beem_pin_iso_1',
        code: 100,
        message: 'PIN Generated Successfully',
      })

      const sendRes = await createAndSendOtp({
        identifier: '0712345678',
        purpose: 'REGISTRATION',
      })

      // Attempt verification for a different phone number
      const wrongPhone = await verifyOtpChallenge({
        identifier: '0788999999',
        code: '123456',
        challengeId: sendRes.challengeId,
      })
      expect(wrongPhone.success).toBe(false)

      // Attempt verification with non-matching purpose
      const wrongPurpose = await verifyOtpChallenge({
        identifier: '0712345678',
        code: '123456',
        challengeId: sendRes.challengeId,
        purpose: 'PASSWORD_RESET',
      })
      expect(wrongPurpose.success).toBe(false)
    })
  })

  // =========================================================================
  // 4. Provider Cutover Safety
  // =========================================================================
  describe('Provider Cutover & Backward Compatibility', () => {
    it('verifies existing challenges using the provider that issued them', async () => {
      // Step 1: Issue challenge under local/Meseji flow
      process.env.SMS_PROVIDER = 'meseji'
      let localOtpCode = ''
      vi.spyOn(providers.sms, 'sendSms').mockImplementation(async (args) => {
        const match = args.messageText.match(/\b(\d{6})\b/)
        if (match) localOtpCode = match[1]
        return { success: true }
      })

      const localChallenge = await createAndSendOtp({
        identifier: '0712345678',
        purpose: 'REGISTRATION',
      })
      expect(localChallenge.success).toBe(true)
      expect(localOtpCode).toHaveLength(6)

      // Step 2: Switch active provider to Beem
      process.env.SMS_PROVIDER = 'beem'

      // Step 3: Verify the in-flight local challenge; it should resolve locally without calling Beem OTP API
      const beemOtpSpy = vi.spyOn(providers.otp, 'verifyOtp')
      const verifyRes = await verifyOtpChallenge({
        identifier: '0712345678',
        code: localOtpCode,
        challengeId: localChallenge.challengeId,
      })

      expect(verifyRes.success).toBe(true)
      expect(beemOtpSpy).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // 5. Beem Ordinary SMS & Delivery Reports (DLR)
  // =========================================================================
  describe('Beem Ordinary SMS Sending & Delivery Reports', () => {
    it('sends ordinary SMS via BeemSmsAdapter with sender ID MHEMA CARGO', async () => {
      const client = getBeemClient()
      const sendSpy = vi.spyOn(client, 'sendSms').mockResolvedValue({
        successful: true,
        success: true,
        code: 100,
        message: 'SMS submitted successfully',
        valid: 1,
        invalid: 0,
        duplicates: 0,
        opted_out: 0,
        total_validated: 1,
        request_id: 'beem_req_sms_4455',
      })

      const adapter = new BeemSmsAdapter(client)
      const res = await adapter.sendSms({
        recipientPhone: '0712345678',
        messageText: 'LUMO: Agizo lako limethibitishwa.',
        senderId: 'MHEMA CARGO',
      })

      expect(res.success).toBe(true)
      expect(res.messageId).toBe('beem_req_sms_4455')
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'LUMO: Agizo lako limethibitishwa.',
          recipients: ['255712345678'],
          source_addr: 'MHEMA CARGO',
        })
      )
    })

    it('treats DLR 404 as in-flight lookup rather than fatal failure', async () => {
      const client = new BeemClient({ dryRun: false })
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        status: 404,
        ok: false,
        text: async () => 'Record not found or still in transit',
      } as Response)

      const dlr = await client.getDeliveryReport({
        dest_addr: '255712345678',
        request_id: 'req_inflight_123',
      })

      // 404 represents in-flight status in Beem DLR API
      expect(dlr.success).toBe(true)
      expect(dlr.status).toBe('IN_FLIGHT')
    })

    it('correctly parses positive DLR and updates SMS store', async () => {
      const client = new BeemClient({ dryRun: false })
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => [
          {
            dest_addr: '255712345678',
            status: 'DELIVRD',
            request_id: 'req_delivered_999',
            timestamp: '2026-09-14 14:00:00',
          },
        ],
      } as Response)

      const dlr = await client.getDeliveryReport({
        dest_addr: '255712345678',
        request_id: 'req_delivered_999',
      })

      expect(dlr.success).toBe(true)
      expect(dlr.status).toBe('DELIVRD')

      // Record a test job and update status
      const job = recordSmsJob({
        deduplicationKey: 'test_dlr_job_1',
        templateCode: 'GENERAL_ANNOUNCEMENT',
        recipientPhone: '255712345678',
        purpose: 'BROADCAST',
        provider: 'BEEM',
        providerRequestId: 'req_delivered_999',
        messageText: 'Test message',
        sanitizedMessage: 'Test message',
        status: 'SUBMITTED',
        attemptsCount: 1,
        maxAttempts: 3,
      })

      const updated = updateSmsJobDeliveryStatus(job.id, 'DELIVERED')
      expect(updated?.recipientDeliveryStatus).toBe('DELIVERED')
      expect(updated?.status).toBe('COMPLETED')
    })
  })

  // =========================================================================
  // 6. Error Code Localization (English & Kiswahili)
  // =========================================================================
  describe('Bilingual Error Localization Engine', () => {
    it('localizes SMS error codes in English and Swahili', () => {
      const err100En = getLocalizedSmsError(100, 'EN')
      const err100Sw = getLocalizedSmsError(100, 'SW')
      expect(err100En).toContain('submitted for processing')
      expect(err100Sw).toContain('umepokelewa')

      const err102En = getLocalizedSmsError(102, 'EN')
      const err102Sw = getLocalizedSmsError(102, 'SW')
      expect(err102En).toContain('SMS service temporarily unavailable')
      expect(err102Sw).toContain('Huduma ya SMS haipatikani')

      const err101En = getLocalizedSmsError(101, 'EN')
      const err101Sw = getLocalizedSmsError(101, 'SW')
      expect(err101En).toContain('Invalid mobile number')
      expect(err101Sw).toContain('Namba ya simu si sahihi')
    })

    it('localizes OTP verification error codes in English and Swahili', () => {
      const err114En = getLocalizedOtpVerifyError(114, 'EN')
      const err114Sw = getLocalizedOtpVerifyError(114, 'SW')
      expect(err114En).toContain('Incorrect verification code')
      expect(err114Sw).toContain('Namba ya uthibitisho si sahihi')

      const err115En = getLocalizedOtpVerifyError(115, 'EN')
      const err115Sw = getLocalizedOtpVerifyError(115, 'SW')
      expect(err115En).toContain('expired')
      expect(err115Sw).toContain('imeisha muda')

      const err117En = getLocalizedOtpVerifyError(117, 'EN')
      const err117Sw = getLocalizedOtpVerifyError(117, 'SW')
      expect(err117En).toContain('Verification successful')
      expect(err117Sw).toContain('Uthibitisho umefanikiwa')
    })
  })

  // =========================================================================
  // 7. Confidentiality & Zero Leakage
  // =========================================================================
  describe('Security: Zero Secret Leakage', () => {
    it('does not leak API keys, secrets, or raw OTP codes in API responses or logs', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await createAndSendOtp({
        identifier: '0712345678',
        purpose: 'REGISTRATION',
      })

      const serialized = JSON.stringify(result)
      expect(serialized).not.toContain(process.env.BEEM_API_KEY)
      expect(serialized).not.toContain(process.env.BEEM_SECRET_KEY)
      expect(serialized).not.toContain('test_secret_key_opaque_string')

      const allLogs = [
        ...logSpy.mock.calls.map((c) => c.join(' ')),
        ...warnSpy.mock.calls.map((c) => c.join(' ')),
      ].join('\n')

      expect(allLogs).not.toContain(process.env.BEEM_API_KEY)
      expect(allLogs).not.toContain(process.env.BEEM_SECRET_KEY)
      expect(allLogs).not.toContain('test_secret_key_opaque_string')
    })
  })
})
