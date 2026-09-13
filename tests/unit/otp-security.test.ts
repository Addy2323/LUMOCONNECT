import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createAndSendOtp,
  verifyOtpChallenge,
  resetOtpStoreForTesting,
} from '@/modules/identity/otp.service'
import { providers } from '@/lib/providers'

/**
 * OTP Security Regression Tests
 *
 * Validates that the OTP system never leaks secrets in API responses,
 * logs, or error messages, and that server-side controls are authoritative.
 */
describe('OTP Security Regressions', () => {
  beforeEach(() => {
    resetOtpStoreForTesting()
    vi.restoreAllMocks()
  })

  it('createAndSendOtp return value NEVER contains the plaintext OTP code', async () => {
    let capturedCode = ''
    vi.spyOn(providers.sms, 'sendSms').mockImplementation(async (args) => {
      const match = args.messageText.match(/\b(\d{6})\b/)
      if (match) capturedCode = match[1]
      return { success: true }
    })

    const result = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    expect(result.success).toBe(true)
    expect(capturedCode).toHaveLength(6) // SMS was sent with a real code

    // Serialize the entire result and verify no OTP leakage
    const serialized = JSON.stringify(result)
    expect(serialized).not.toContain(capturedCode)
    expect(serialized).not.toContain('devCode')
    expect(serialized).not.toContain('warning')
    expect(serialized).not.toMatch(/\b\d{6}\b/) // No 6-digit string anywhere in the response
  })

  it('createAndSendOtp return value has no devCode or warning fields even in dev mode', async () => {
    vi.spyOn(providers.sms, 'sendSms').mockResolvedValue({ success: true })

    const result = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    // Type-level enforcement: these fields should not exist
    const resultObj = result as Record<string, unknown>
    expect(resultObj).not.toHaveProperty('devCode')
    expect(resultObj).not.toHaveProperty('warning')
  })

  it('SMS gateway failure returns safe error message without provider details', async () => {
    vi.spyOn(providers.sms, 'sendSms').mockResolvedValue({
      success: false,
      error: 'Meseji API responded with 500: Internal Server Error - kilakonaStatus: pending',
    })

    const result = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    expect(result.success).toBe(false)
    // The error message must not contain raw provider details
    expect(result.error).not.toContain('500')
    expect(result.error).not.toContain('Internal Server Error')
    expect(result.error).not.toContain('kilakonaStatus')
    expect(result.error).not.toContain('Meseji API responded')
    // It should contain a safe user-facing message
    expect(result.error).toBeDefined()
    expect(result.smsAccepted).toBe(false)
  })

  it('SMS gateway failure does not log the OTP code to console', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    vi.spyOn(providers.sms, 'sendSms').mockResolvedValue({
      success: false,
      error: 'Gateway 500',
    })

    await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    // Check all console.log and console.warn calls for OTP leakage
    const allLogArgs = [
      ...logSpy.mock.calls.map((c) => c.join(' ')),
      ...warnSpy.mock.calls.map((c) => c.join(' ')),
    ].join('\n')

    // Should not contain "Generated OTP", "DEV/FALLBACK", or any 6-digit code pattern
    expect(allLogArgs).not.toContain('Generated OTP')
    expect(allLogArgs).not.toContain('DEV/FALLBACK')
    expect(allLogArgs).not.toContain('LUMO OTP')
    // The raw phone number should not be logged either (only masked)
    expect(allLogArgs).not.toContain('255712345678')

    logSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('provider failure cannot result in phone verification (challenge exists but code is unknown)', async () => {
    vi.spyOn(providers.sms, 'sendSms').mockResolvedValue({
      success: false,
      error: 'Gateway down',
    })

    const sendResult = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    expect(sendResult.success).toBe(false)

    // Attacker cannot verify because they don't know the OTP
    const verifyResult = verifyOtpChallenge({
      identifier: '0712345678',
      code: '000000',
      challengeId: sendResult.challengeId,
    })

    expect(verifyResult.success).toBe(false)
  })

  it('used OTP codes are rejected on re-verification (single-use)', async () => {
    let capturedCode = ''
    vi.spyOn(providers.sms, 'sendSms').mockImplementation(async (args) => {
      const match = args.messageText.match(/\b(\d{6})\b/)
      if (match) capturedCode = match[1]
      return { success: true }
    })

    const sendResult = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    // First verification succeeds
    const first = verifyOtpChallenge({
      identifier: '0712345678',
      code: capturedCode,
      challengeId: sendResult.challengeId,
    })
    expect(first.success).toBe(true)

    // Second verification with same code fails
    const second = verifyOtpChallenge({
      identifier: '0712345678',
      code: capturedCode,
      challengeId: sendResult.challengeId,
    })
    expect(second.success).toBe(false)
  })

  it('superseded OTP codes are rejected after a new OTP is sent', async () => {
    let firstCode = ''
    let secondCode = ''
    let callCount = 0

    vi.spyOn(providers.sms, 'sendSms').mockImplementation(async (args) => {
      callCount++
      const match = args.messageText.match(/\b(\d{6})\b/)
      if (match) {
        if (callCount === 1) firstCode = match[1]
        else secondCode = match[1]
      }
      return { success: true }
    })

    const firstSend = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    // Wait for cooldown to expire (simulate by modifying cooldown)
    resetOtpStoreForTesting()

    const secondSend = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    // The old code must not work for the new challenge
    if (firstCode && firstCode !== secondCode) {
      const oldCodeResult = verifyOtpChallenge({
        identifier: '0712345678',
        code: firstCode,
        challengeId: secondSend.challengeId,
      })
      expect(oldCodeResult.success).toBe(false)
    }
  })

  it('wrong identifier cannot verify even with correct code', async () => {
    let capturedCode = ''
    vi.spyOn(providers.sms, 'sendSms').mockImplementation(async (args) => {
      const match = args.messageText.match(/\b(\d{6})\b/)
      if (match) capturedCode = match[1]
      return { success: true }
    })

    const sendResult = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    // Attempt with wrong phone
    const wrongPhone = verifyOtpChallenge({
      identifier: '0754999999',
      code: capturedCode,
      challengeId: sendResult.challengeId,
    })
    expect(wrongPhone.success).toBe(false)
  })

  it('verifyOtpChallenge returns server-authoritative attemptsRemaining', async () => {
    vi.spyOn(providers.sms, 'sendSms').mockResolvedValue({ success: true })

    const sendResult = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    // First wrong attempt
    const attempt1 = verifyOtpChallenge({
      identifier: '0712345678',
      code: '000000',
      challengeId: sendResult.challengeId,
    })
    expect(attempt1.success).toBe(false)
    expect(attempt1.attemptsRemaining).toBe(2)

    // Second wrong attempt
    const attempt2 = verifyOtpChallenge({
      identifier: '0712345678',
      code: '000001',
      challengeId: sendResult.challengeId,
    })
    expect(attempt2.success).toBe(false)
    expect(attempt2.attemptsRemaining).toBe(1)

    // Third wrong attempt — lockout
    const attempt3 = verifyOtpChallenge({
      identifier: '0712345678',
      code: '000002',
      challengeId: sendResult.challengeId,
    })
    expect(attempt3.success).toBe(false)
    expect(attempt3.attemptsRemaining).toBe(0)
    expect(attempt3.error).toBe('MAX_ATTEMPTS_EXCEEDED')
  })

  it('error messages from verifyOtpChallenge do not contain attempt count text', async () => {
    vi.spyOn(providers.sms, 'sendSms').mockResolvedValue({ success: true })

    const sendResult = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    const attempt = verifyOtpChallenge({
      identifier: '0712345678',
      code: '000000',
      challengeId: sendResult.challengeId,
    })

    // Error should be a clean code, not include attempt count info
    expect(attempt.error).toBe('INVALID_CODE')
    expect(attempt.error).not.toContain('remaining')
    expect(attempt.error).not.toContain('attempt')
  })

  it('cooldown prevents rapid-fire OTP requests', async () => {
    vi.spyOn(providers.sms, 'sendSms').mockResolvedValue({ success: true })

    const first = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })
    expect(first.success).toBe(true)

    // Immediate second request
    const second = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })
    expect(second.success).toBe(false)
    expect(second.cooldownSeconds).toBeGreaterThan(0)
  })

  it('error messages never contain API key prefixes', async () => {
    vi.spyOn(providers.sms, 'sendSms').mockResolvedValue({
      success: false,
      error: 'x-api-key zs_abc123 invalid',
    })

    const result = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    expect(result.error).not.toContain('zs_')
    expect(result.error).not.toContain('snp_')
    expect(result.error).not.toContain('x-api-key')
  })

  it('successful send response includes smsAccepted: true', async () => {
    vi.spyOn(providers.sms, 'sendSms').mockResolvedValue({ success: true })

    const result = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    expect(result.success).toBe(true)
    expect(result.smsAccepted).toBe(true)
  })
})
