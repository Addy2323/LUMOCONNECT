/**
 * Cryptographically Secure OTP & Password Recovery Service
 *
 * Implements:
 * - CSPRNG 6-digit OTP generation (crypto.randomInt)
 * - Keyed HMAC-SHA256 hash storage (Zero plaintext OTP storage)
 * - Anti-enumeration defenses
 * - Strict expiry, single-use, 60s cooldown, max 3 attempts
 * - Short-lived password reset tokens upon successful verification
 * - Zero OTP leakage in logs, responses, or analytics
 */

import crypto from 'node:crypto'
import { normalizeMesejiPhone, maskPhoneNumber, isValidTanzaniaPhone } from '@/modules/sms/phone'
import { providers } from '@/lib/providers'
import { renderTemplate } from '@/modules/sms/templates'
import { recordSmsJob } from '@/modules/sms/store'

export interface OtpChallengeRecord {
  challengeId: string
  identifier: string // Normalized phone number or email
  hashedCode: string // Keyed HMAC-SHA256(code + challengeId)
  purpose: 'REGISTRATION' | 'PASSWORD_RESET' | 'STEP_UP_ADMIN' | 'TRANSACTION_CONFIRM'
  attemptsRemaining: number
  expiresAt: Date
  cooldownExpiresAt: Date
  isUsed: boolean
  isSuperseded: boolean
  ipAddress?: string
  createdAt: Date
}

export interface PasswordResetTokenRecord {
  token: string
  identifier: string
  expiresAt: Date
  isUsed: boolean
  createdAt: Date
}

const otpChallengesStore: OtpChallengeRecord[] = []
const passwordResetTokensStore: PasswordResetTokenRecord[] = []

const OTP_SECRET = process.env.OTP_SECRET || 'dev_otp_hmac_secret_key_default'
const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const COOLDOWN_MS = 60 * 1000 // 60 seconds
const MAX_ATTEMPTS = 3

/**
 * Computes a keyed HMAC-SHA256 hash for an OTP code bound to its challenge ID
 */
function hashOtpCode(code: string, challengeId: string): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${code}:${challengeId}`)
    .digest('hex')
}

/**
 * Constant-time comparison of hashed OTPs
 */
function compareOtpHash(submittedCode: string, challengeId: string, expectedHash: string): boolean {
  const computedHash = hashOtpCode(submittedCode, challengeId)
  const bufA = Buffer.from(computedHash, 'hex')
  const bufB = Buffer.from(expectedHash, 'hex')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Generates and initiates an OTP challenge for phone verification or password reset
 */
export async function createAndSendOtp(params: {
  identifier: string
  purpose: OtpChallengeRecord['purpose']
  ipAddress?: string
  language?: 'EN' | 'SW'
}): Promise<{
  success: boolean
  challengeId: string
  maskedIdentifier: string
  cooldownSeconds: number
  smsAccepted?: boolean
  error?: string
}> {
  const isPhone = isValidTanzaniaPhone(params.identifier) || params.identifier.replace(/\D/g, '').length >= 9
  const normalizedId = isPhone ? normalizeMesejiPhone(params.identifier) : params.identifier.toLowerCase().trim()

  const now = Date.now()

  // 1. Check resend cooldown
  const activeExisting = otpChallengesStore.find(
    (c) => c.identifier === normalizedId && !c.isUsed && !c.isSuperseded && c.expiresAt.getTime() > now
  )

  if (activeExisting && activeExisting.cooldownExpiresAt.getTime() > now) {
    const remainingCooldown = Math.ceil((activeExisting.cooldownExpiresAt.getTime() - now) / 1000)
    return {
      success: false,
      challengeId: activeExisting.challengeId,
      maskedIdentifier: isPhone ? maskPhoneNumber(normalizedId) : normalizedId,
      cooldownSeconds: remainingCooldown,
      error: `Please wait ${remainingCooldown}s before requesting a new code.`,
    }
  }

  // 2. Supersede any previous active challenges for this recipient
  for (const c of otpChallengesStore) {
    if (c.identifier === normalizedId && !c.isUsed) {
      c.isSuperseded = true
    }
  }

  // 3. Generate 6-digit CSPRNG code
  const numericCode = crypto.randomInt(100000, 1000000).toString()
  const challengeId = `otp_${crypto.randomBytes(12).toString('hex')}`
  const hashedCode = hashOtpCode(numericCode, challengeId)

  const challenge: OtpChallengeRecord = {
    challengeId,
    identifier: normalizedId,
    hashedCode,
    purpose: params.purpose,
    attemptsRemaining: MAX_ATTEMPTS,
    expiresAt: new Date(now + OTP_EXPIRY_MS),
    cooldownExpiresAt: new Date(now + COOLDOWN_MS),
    isUsed: false,
    isSuperseded: false,
    ipAddress: params.ipAddress,
    createdAt: new Date(),
  }

  otpChallengesStore.unshift(challenge)

  // 4. Render template according to purpose
  const templateCode = params.purpose === 'PASSWORD_RESET' ? 'PASSWORD_RESET_OTP' : 'USER_REGISTRATION_OTP'
  const rendered = renderTemplate(templateCode, { code: numericCode }, params.language || 'EN')

  // 5. Stage in SMS Store with OTP redacted from sanitizedMessage
  recordSmsJob({
    deduplicationKey: `otp_${challengeId}`,
    templateCode,
    recipientPhone: normalizedId,
    purpose: 'AUTH_OTP',
    language: params.language || 'EN',
    messageText: rendered.messageText.replace(numericCode, '******'),
    sanitizedMessage: rendered.messageText.replace(numericCode, '******'),
    status: 'PENDING',
    attemptsCount: 0,
    maxAttempts: 2,
    metadata: { challengeId, purpose: params.purpose },
  })

  // 6. Send SMS via Meseji adapter (or Email if email identifier)
  if (isPhone) {
    const smsRes = await providers.sms.sendSms({
      recipientPhone: normalizedId,
      messageText: rendered.messageText,
    })
    if (!smsRes.success) {
      // Log the failure for server-side observability — never log the OTP code
      console.warn(`[SMS GATEWAY] Dispatch failed for ${maskPhoneNumber(normalizedId)}`)
      return {
        success: false,
        challengeId,
        maskedIdentifier: maskPhoneNumber(normalizedId),
        cooldownSeconds: 15,
        smsAccepted: false,
        error: 'Hatukuweza kutuma namba ya uthibitisho. Tafadhali jaribu tena baada ya muda mfupi.',
      }
    }
  } else {
    await providers.email.sendEmail({
      to: normalizedId,
      subject: `[LUMO] Your Verification Code`,
      htmlBody: `<p>${rendered.messageText}</p>`,
    })
  }

  return {
    success: true,
    challengeId,
    maskedIdentifier: isPhone ? maskPhoneNumber(normalizedId) : normalizedId,
    cooldownSeconds: 60,
    smsAccepted: true,
  }
}

/**
 * Verifies submitted OTP against stored keyed hash
 */
export function verifyOtpChallenge(params: {
  challengeId?: string
  identifier: string
  code: string
}): {
  success: boolean
  resetToken?: string
  attemptsRemaining?: number
  error?: string
} {
  const isPhone = isValidTanzaniaPhone(params.identifier) || params.identifier.replace(/\D/g, '').length >= 9
  const normalizedId = isPhone ? normalizeMesejiPhone(params.identifier) : params.identifier.toLowerCase().trim()
  const cleanCode = params.code.trim()

  // Support demo verification code 123456 in development/test environments
  const isDemoCode = process.env.NODE_ENV !== 'production' && cleanCode === '123456'

  const challenge = otpChallengesStore.find((c) => {
    if (params.challengeId && c.challengeId !== params.challengeId) return false
    return c.identifier === normalizedId && !c.isUsed && !c.isSuperseded
  })

  if (!challenge) {
    if (isDemoCode) {
      return { success: true, attemptsRemaining: 0 }
    }
    return { success: false, error: 'NO_ACTIVE_CHALLENGE', attemptsRemaining: 0 }
  }

  // Check expiration
  if (new Date() > challenge.expiresAt) {
    if (isDemoCode) {
      challenge.isUsed = true
      return { success: true, attemptsRemaining: 0 }
    }
    challenge.isUsed = true
    return { success: false, error: 'OTP_EXPIRED', attemptsRemaining: 0 }
  }

  // Check remaining attempts
  if (challenge.attemptsRemaining <= 0) {
    if (isDemoCode) {
      return { success: true, attemptsRemaining: 0 }
    }
    challenge.isUsed = true
    return { success: false, error: 'MAX_ATTEMPTS_EXCEEDED', attemptsRemaining: 0 }
  }

  // Verify hash using constant-time comparison
  const isMatch = isDemoCode || compareOtpHash(cleanCode, challenge.challengeId, challenge.hashedCode)

  if (!isMatch) {
    challenge.attemptsRemaining -= 1
    if (challenge.attemptsRemaining <= 0) {
      challenge.isUsed = true
      return { success: false, error: 'MAX_ATTEMPTS_EXCEEDED', attemptsRemaining: 0 }
    }
    return {
      success: false,
      error: `INVALID_CODE`,
      attemptsRemaining: challenge.attemptsRemaining,
    }
  }

  // Mark challenge consumed (single-use)
  challenge.isUsed = true

  // If this was for password reset, issue short-lived reset token (valid 15 mins)
  let resetToken: string | undefined
  if (challenge.purpose === 'PASSWORD_RESET') {
    resetToken = `rst_${crypto.randomBytes(24).toString('hex')}`
    passwordResetTokensStore.unshift({
      token: resetToken,
      identifier: normalizedId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      isUsed: false,
      createdAt: new Date(),
    })
  }

  return { success: true, resetToken, attemptsRemaining: 0 }
}

/**
 * Completes password reset using verified reset authorization token
 */
export function completePasswordResetWithToken(params: {
  resetToken: string
  newPasswordHash: string
}): {
  success: boolean
  identifier?: string
  error?: string
} {
  const tokenRecord = passwordResetTokensStore.find((t) => t.token === params.resetToken && !t.isUsed)
  if (!tokenRecord) {
    return { success: false, error: 'INVALID_OR_EXPIRED_RESET_TOKEN' }
  }

  if (new Date() > tokenRecord.expiresAt) {
    tokenRecord.isUsed = true
    return { success: false, error: 'RESET_TOKEN_EXPIRED' }
  }

  tokenRecord.isUsed = true

  // Send confirmation notice
  const isPhone = isValidTanzaniaPhone(tokenRecord.identifier)
  const template = renderTemplate('PASSWORD_CHANGED', {}, 'EN')

  if (isPhone) {
    providers.sms.sendSms({
      recipientPhone: tokenRecord.identifier,
      messageText: template.messageText,
    }).catch(() => {})
  }

  return {
    success: true,
    identifier: tokenRecord.identifier,
  }
}

/**
 * Reset in-memory challenge stores (used in unit test setups)
 */
export function resetOtpStoreForTesting(): void {
  otpChallengesStore.length = 0
  passwordResetTokensStore.length = 0
}
