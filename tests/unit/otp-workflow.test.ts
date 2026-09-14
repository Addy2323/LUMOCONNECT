import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import crypto from 'node:crypto'
import {
  createAndSendOtp,
  verifyOtpChallenge,
  completePasswordResetWithToken,
  resetOtpStoreForTesting,
} from '@/modules/identity/otp.service'
import { providers } from '@/lib/providers'

describe('OTP & Password Recovery Security Service', () => {
  const originalProvider = process.env.SMS_PROVIDER

  beforeEach(() => {
    process.env.SMS_PROVIDER = 'meseji'
    resetOtpStoreForTesting()
    vi.restoreAllMocks()
  })

  afterAll(() => {
    process.env.SMS_PROVIDER = originalProvider
  })

  it('generates an OTP challenge with masked phone and initiates SMS dispatch', async () => {
    const sendSmsSpy = vi.spyOn(providers.sms, 'sendSms').mockResolvedValue({
      success: true,
      messageId: 'msg_test_1',
    })

    const result = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
      language: 'EN',
    })

    expect(result.success).toBe(true)
    expect(result.challengeId).toBeDefined()
    expect(result.maskedIdentifier).toBe('25571***5678')
    expect(result.cooldownSeconds).toBe(60)

    // Verify SMS was dispatched
    expect(sendSmsSpy).toHaveBeenCalledTimes(1)
    const callArgs = sendSmsSpy.mock.calls[0][0]
    expect(callArgs.recipientPhone).toBe('255712345678')
    // Ensure message contains a 6-digit number
    expect(callArgs.messageText).toMatch(/\b\d{6}\b/)
  })

  it('enforces 60-second cooldown on repeated OTP requests', async () => {
    vi.spyOn(providers.sms, 'sendSms').mockResolvedValue({ success: true })

    const first = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })
    expect(first.success).toBe(true)

    // Immediate second request must be blocked by cooldown
    const second = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })
    expect(second.success).toBe(false)
    expect(second.cooldownSeconds).toBeGreaterThan(0)
    expect(second.error).toContain('Please wait')
  })

  it('locks out the challenge after 3 incorrect attempts', async () => {
    vi.spyOn(providers.sms, 'sendSms').mockResolvedValue({ success: true })

    const challenge = await createAndSendOtp({
      identifier: '0712345678',
      purpose: 'REGISTRATION',
    })

    // Attempt 1: wrong code
    const attempt1 = await verifyOtpChallenge({
      identifier: '0712345678',
      code: '000000',
      challengeId: challenge.challengeId,
    })
    expect(attempt1.success).toBe(false)
    expect(attempt1.attemptsRemaining).toBe(2)

    // Attempt 2: wrong code
    const attempt2 = await verifyOtpChallenge({
      identifier: '0712345678',
      code: '000001',
      challengeId: challenge.challengeId,
    })
    expect(attempt2.success).toBe(false)
    expect(attempt2.attemptsRemaining).toBe(1)

    // Attempt 3: wrong code -> lockout
    const attempt3 = await verifyOtpChallenge({
      identifier: '0712345678',
      code: '000002',
      challengeId: challenge.challengeId,
    })
    expect(attempt3.success).toBe(false)
    expect(attempt3.error).toBe('MAX_ATTEMPTS_EXCEEDED')

    // Attempt 4: challenge is now dead
    const attempt4 = await verifyOtpChallenge({
      identifier: '0712345678',
      code: '000003',
      challengeId: challenge.challengeId,
    })
    expect(attempt4.success).toBe(false)
    expect(attempt4.error).toBe('NO_ACTIVE_CHALLENGE')
  })

  it('completes the end-to-end password reset token workflow safely', async () => {
    let capturedCode = ''
    vi.spyOn(providers.sms, 'sendSms').mockImplementation(async (args) => {
      const match = args.messageText.match(/\b(\d{6})\b/)
      if (match) capturedCode = match[1]
      return { success: true }
    })

    // Step 1: Request Password Reset
    const otpRequest = await createAndSendOtp({
      identifier: '0754123456',
      purpose: 'PASSWORD_RESET',
      language: 'SW',
    })
    expect(otpRequest.success).toBe(true)
    expect(capturedCode).toHaveLength(6)

    // Step 2: Verify correct OTP
    const verifyResult = await verifyOtpChallenge({
      identifier: '0754123456',
      code: capturedCode,
      challengeId: otpRequest.challengeId,
    })
    expect(verifyResult.success).toBe(true)
    expect(verifyResult.resetToken).toBeDefined()
    expect(verifyResult.resetToken).toMatch(/^rst_[a-f0-9]{48}$/)

    // Step 3: Complete Password Reset with reset token
    const newHash = crypto.createHash('sha256').update('NewSuperSecretPassword2026!').digest('hex')
    const resetResult = completePasswordResetWithToken({
      resetToken: verifyResult.resetToken!,
      newPasswordHash: newHash,
    })
    expect(resetResult.success).toBe(true)
    expect(resetResult.identifier).toBe('255754123456')

    // Step 4: Token is single-use and cannot be re-used
    const reuseResult = completePasswordResetWithToken({
      resetToken: verifyResult.resetToken!,
      newPasswordHash: newHash,
    })
    expect(reuseResult.success).toBe(false)
    expect(reuseResult.error).toBe('INVALID_OR_EXPIRED_RESET_TOKEN')
  })
})
