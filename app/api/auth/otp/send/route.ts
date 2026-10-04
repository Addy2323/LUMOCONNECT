import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAndSendOtp } from '@/modules/identity/otp.service'
import { isValidTanzaniaPhone } from '@/modules/sms/phone'
import { checkRateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limiter'

const otpSendSchema = z
  .object({
    identifier: z.string().trim().min(3, 'Identifier is required.').max(255),
    purpose: z.enum(['REGISTRATION', 'PASSWORD_RESET', 'STEP_UP_ADMIN', 'TRANSACTION_CONFIRM']).default('REGISTRATION'),
    language: z.enum(['EN', 'SW']).default('EN'),
  })
  .strict()

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    // IP-based Rate Limiter (Max 5 OTP requests per 1 minute per IP)
    const ipRateLimit = await checkRateLimit({
      keyPrefix: 'otp-send-ip',
      identifier: ip,
      maxRequests: 5,
      windowSeconds: 60,
    })

    if (!ipRateLimit.success) {
      return rateLimitResponse(ipRateLimit.resetSeconds, 'Too many OTP requests from this IP. Please wait before trying again.')
    }

    const body = await request.json().catch(() => ({}))
    const parsed = otpSendSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload parameters.', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { identifier, purpose, language } = parsed.data

    // Account-based Rate Limiter (Max 3 OTP requests per 1 minute per identifier)
    const accountRateLimit = await checkRateLimit({
      keyPrefix: 'otp-send-account',
      identifier,
      maxRequests: 3,
      windowSeconds: 60,
    })

    if (!accountRateLimit.success) {
      return rateLimitResponse(accountRateLimit.resetSeconds, 'Too many verification requests for this recipient. Please wait before requesting another code.')
    }

    const cleanId = identifier.trim()
    const isPhone = isValidTanzaniaPhone(cleanId)
    const isEmail = cleanId.includes('@') && cleanId.includes('.')

    if (!isPhone && !isEmail) {
      return NextResponse.json(
        { error: 'Invalid identifier. Must be a valid Tanzanian mobile number (e.g. 07XXXXXXXX) or email address.' },
        { status: 400 }
      )
    }

    const result = await createAndSendOtp({
      identifier: cleanId,
      purpose,
      ipAddress: ip,
      language,
    })


    console.log('[OTP SEND API] Service result', {
      success: result.success,
      challengeId: result.challengeId,
      smsAccepted: result.smsAccepted,
      error: result.error,
      cooldownSeconds: result.cooldownSeconds,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, cooldownSeconds: result.cooldownSeconds },
        { status: 429 }
      )
    }

    // Success: return only safe, non-secret fields
    return NextResponse.json({
      success: true,
      challengeId: result.challengeId,
      maskedIdentifier: result.maskedIdentifier,
      cooldownSeconds: result.cooldownSeconds,
      message: result.smsAccepted
        ? 'Ombi la kutuma namba ya uthibitisho limepokelewa. SMS inaweza kuchukua muda kufika.'
        : 'Verification code dispatched.',
    })
  } catch (err) {
    console.error('[OTP SEND API] Unexpected error', err)
    return NextResponse.json(
      { error: 'Hitilafu ya mfumo. Tafadhali jaribu tena.' },
      { status: 500 }
    )
  }
}
