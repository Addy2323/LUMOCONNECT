/**
 * Cryptographically Secure OTP & Password Recovery Service
 *
 * Implements:
 * - Provider-managed OTP via Beem Africa (when SMS_PROVIDER=beem)
 * - CSPRNG 6-digit OTP generation with keyed HMAC-SHA256 hash storage (for email / local fallback)
 * - Anti-enumeration defenses and strict phone normalization
 * - Strict expiry, single-use atomic consumption, 60s cooldown, max 3 attempts
 * - Invalidation of previous challenges upon phone or request change
 * - Short-lived password reset tokens upon successful verification
 * - Zero OTP leakage in logs, responses, or analytics
 * - Provider-consistent verification (existing challenges verified with the provider that issued them)
 */

import crypto from 'node:crypto'
import { normalizeTanzaniaPhone, maskPhoneNumber, isValidTanzaniaPhone } from '@/modules/sms/phone'
import { providers, getActiveSmsProviderName } from '@/lib/providers'
import { renderTemplate } from '@/modules/sms/templates'
import { recordSmsJob } from '@/modules/sms/store'

export type OtpProviderType = 'BEEM' | 'LOCAL_MESEJI' | 'EMAIL'

export interface OtpChallengeRecord {
  challengeId: string
  identifier: string // Normalized phone number or email
  provider: OtpProviderType
  providerPinId?: string // Server-side provider challenge identifier (e.g. Beem pinId)
  hashedCode?: string // Keyed HMAC-SHA256(code + challengeId) for local/email challenges
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
  const normalizedId = isPhone ? normalizeTanzaniaPhone(params.identifier) : params.identifier.toLowerCase().trim()

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

  const challengeId = `otp_${crypto.randomBytes(12).toString('hex')}`
  const activeSmsProvider = getActiveSmsProviderName()

  // 3. Provider-Managed OTP via Beem Africa
  if (isPhone && activeSmsProvider === 'beem') {
    const otpRes = await providers.otp.requestOtp({
      phone: normalizedId,
      appId: process.env.BEEM_APPLICATION_ID || 5075,
    })

    if (!otpRes.success || !otpRes.pinId) {
      // Log the failure for server-side observability — never log the OTP code or secret
      console.warn(`[BEEM OTP GATEWAY] Dispatch failed for ${maskPhoneNumber(normalizedId)}: ${otpRes.error || otpRes.message}`)
      return {
        success: false,
        challengeId,
        maskedIdentifier: maskPhoneNumber(normalizedId),
        cooldownSeconds: 15,
        smsAccepted: false,
        error: params.language === 'SW'
          ? 'Hatukuweza kutuma namba ya uthibitisho kwa sasa. Tafadhali jaribu tena baada ya muda mfupi.'
          : 'Failed to send verification code. Please try again in a few moments.',
      }
    }

    const expirySeconds = otpRes.expiresInSeconds || (otpRes.pinExpiryMinutes ? otpRes.pinExpiryMinutes * 60 : 300)

    const challenge: OtpChallengeRecord = {
      challengeId,
      identifier: normalizedId,
      provider: 'BEEM',
      providerPinId: otpRes.pinId,
      purpose: params.purpose,
      attemptsRemaining: MAX_ATTEMPTS,
      expiresAt: new Date(now + expirySeconds * 1000),
      cooldownExpiresAt: new Date(now + COOLDOWN_MS),
      isUsed: false,
      isSuperseded: false,
      ipAddress: params.ipAddress,
      createdAt: new Date(),
    }

    otpChallengesStore.unshift(challenge)

    // Stage in SMS Audit Store without generating a redundant local code
    const templateCode = params.purpose === 'PASSWORD_RESET' ? 'PASSWORD_RESET_OTP' : 'USER_REGISTRATION_OTP'
    recordSmsJob({
      deduplicationKey: `otp_${challengeId}`,
      templateCode,
      recipientPhone: normalizedId,
      purpose: 'AUTH_OTP',
      language: params.language || 'EN',
      provider: 'BEEM',
      providerRequestId: otpRes.pinId,
      messageText: `[BEEM OTP DISPATCHED - PIN ID: ${otpRes.pinId}]`,
      sanitizedMessage: `[BEEM OTP DISPATCHED - PIN ID: ${otpRes.pinId}]`,
      status: 'SUBMITTED',
      attemptsCount: 1,
      maxAttempts: 3,
      metadata: { challengeId, purpose: params.purpose, pinId: otpRes.pinId },
    })

    return {
      success: true,
      challengeId,
      maskedIdentifier: maskPhoneNumber(normalizedId),
      cooldownSeconds: 60,
      smsAccepted: true,
    }
  }

  // 4. Local OTP Generation (for Email or legacy Meseji fallback)
  const numericCode = crypto.randomInt(100000, 1000000).toString()
  const hashedCode = hashOtpCode(numericCode, challengeId)
  const providerType: OtpProviderType = isPhone ? 'LOCAL_MESEJI' : 'EMAIL'

  const challenge: OtpChallengeRecord = {
    challengeId,
    identifier: normalizedId,
    provider: providerType,
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

  const templateCode = params.purpose === 'PASSWORD_RESET' ? 'PASSWORD_RESET_OTP' : 'USER_REGISTRATION_OTP'
  const rendered = renderTemplate(templateCode, { code: numericCode }, params.language || 'EN')

  if (isPhone) {
    recordSmsJob({
      deduplicationKey: `otp_${challengeId}`,
      templateCode,
      recipientPhone: normalizedId,
      purpose: 'AUTH_OTP',
      language: params.language || 'EN',
      provider: 'MESEJI',
      messageText: rendered.messageText.replace(numericCode, '******'),
      sanitizedMessage: rendered.messageText.replace(numericCode, '******'),
      status: 'PENDING',
      attemptsCount: 0,
      maxAttempts: 2,
      metadata: { challengeId, purpose: params.purpose },
    })

    const smsRes = await providers.sms.sendSms({
      recipientPhone: normalizedId,
      messageText: rendered.messageText,
    })

    if (!smsRes.success) {
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
 * Verifies submitted OTP against the provider that issued it
 */
export async function verifyOtpChallenge(params: {
  challengeId?: string
  identifier: string
  code: string
  purpose?: OtpChallengeRecord['purpose']
}): Promise<{
  success: boolean
  resetToken?: string
  attemptsRemaining?: number
  error?: string
}> {
  const isPhone = isValidTanzaniaPhone(params.identifier) || params.identifier.replace(/\D/g, '').length >= 9
  const normalizedId = isPhone ? normalizeTanzaniaPhone(params.identifier) : params.identifier.toLowerCase().trim()
  const cleanCode = params.code.trim()

  const challenge = otpChallengesStore.find((c) => {
    if (params.challengeId && c.challengeId !== params.challengeId) return false
    if (params.purpose && c.purpose !== params.purpose) return false
    return c.identifier === normalizedId && !c.isUsed && !c.isSuperseded
  })

  if (!challenge) {
    return { success: false, error: 'NO_ACTIVE_CHALLENGE', attemptsRemaining: 0 }
  }

  // Check expiration
  if (new Date() > challenge.expiresAt) {
    challenge.isUsed = true
    return { success: false, error: 'OTP_EXPIRED', attemptsRemaining: 0 }
  }

  // Check remaining attempts
  if (challenge.attemptsRemaining <= 0) {
    challenge.isUsed = true
    return { success: false, error: 'MAX_ATTEMPTS_EXCEEDED', attemptsRemaining: 0 }
  }

  // Verify according to the provider that issued the challenge
  if (challenge.provider === 'BEEM') {
    if (!challenge.providerPinId) {
      challenge.isUsed = true
      return { success: false, error: 'NO_ACTIVE_CHALLENGE', attemptsRemaining: 0 }
    }

    const verifyRes = await providers.otp.verifyOtp({
      pinId: challenge.providerPinId,
      pin: cleanCode,
    })

    if (!verifyRes.success) {
      challenge.attemptsRemaining -= 1

      if (verifyRes.code === 115) {
        challenge.isUsed = true
        return { success: false, error: 'OTP_EXPIRED', attemptsRemaining: 0 }
      }
      if (verifyRes.code === 116 || challenge.attemptsRemaining <= 0) {
        challenge.isUsed = true
        return { success: false, error: 'MAX_ATTEMPTS_EXCEEDED', attemptsRemaining: 0 }
      }
      if (verifyRes.code === 118) {
        challenge.isUsed = true
        return { success: false, error: 'DUPLICATE_PIN', attemptsRemaining: 0 }
      }

      return {
        success: false,
        error: 'INVALID_CODE',
        attemptsRemaining: challenge.attemptsRemaining,
      }
    }
  } else {
    // Local keyed HMAC hash comparison (for Email / legacy Meseji)
    const isMatch = challenge.hashedCode
      ? compareOtpHash(cleanCode, challenge.challengeId, challenge.hashedCode)
      : false

    if (!isMatch) {
      challenge.attemptsRemaining -= 1
      if (challenge.attemptsRemaining <= 0) {
        challenge.isUsed = true
        return { success: false, error: 'MAX_ATTEMPTS_EXCEEDED', attemptsRemaining: 0 }
      }
      return {
        success: false,
        error: 'INVALID_CODE',
        attemptsRemaining: challenge.attemptsRemaining,
      }
    }
  }

  // Positive result: Mark challenge consumed (atomic single-use)
  challenge.isUsed = true

  // Issue password reset token if this was for password recovery
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
 * Retrieve in-memory challenge by ID (used for testing and audit visibility)
 */
export function getOtpChallengeById(challengeId: string): OtpChallengeRecord | undefined {
  return otpChallengesStore.find((c) => c.challengeId === challengeId)
}

/**
 * Reset in-memory challenge stores (used in unit test setups)
 */
export function resetOtpStoreForTesting(): void {
  otpChallengesStore.length = 0
  passwordResetTokensStore.length = 0
}
