import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyOtpChallenge } from '@/modules/identity/otp.service'
import { checkRateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limiter'

const otpVerifySchema = z
  .object({
    identifier: z.string().trim().min(3, 'Identifier is required.').max(255),
    code: z.string().trim().min(4, 'Code is required.').max(20),
    challengeId: z.string().optional(),
    purpose: z.enum(['REGISTRATION', 'PASSWORD_RESET', 'STEP_UP_ADMIN', 'TRANSACTION_CONFIRM']).optional(),
  })
  .strict()

/** Map internal error codes to user-safe messages */
function safeErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'NO_ACTIVE_CHALLENGE':
      return 'Hakuna namba ya uthibitisho inayosubiri. Tafadhali omba namba mpya.'
    case 'OTP_EXPIRED':
      return 'Namba ya uthibitisho imeisha muda wake. Tafadhali omba namba mpya.'
    case 'MAX_ATTEMPTS_EXCEEDED':
      return 'Umezidi idadi ya majaribio. Tafadhali omba namba mpya.'
    case 'INVALID_CODE':
      return 'Namba ya uthibitisho si sahihi. Tafadhali jaribu tena.'
    default:
      return 'Uthibitisho umeshindikana. Tafadhali jaribu tena.'
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    // IP-based Rate Limiter (Max 10 verify attempts per 1 minute per IP)
    const ipRateLimit = await checkRateLimit({
      keyPrefix: 'otp-verify-ip',
      identifier: ip,
      maxRequests: 10,
      windowSeconds: 60,
    })

    if (!ipRateLimit.success) {
      return rateLimitResponse(ipRateLimit.resetSeconds, 'Too many verification attempts. Please try again shortly.')
    }

    const body = await request.json().catch(() => ({}))
    const parsed = otpVerifySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload parameters.', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { identifier, code, challengeId, purpose } = parsed.data

    const result = await verifyOtpChallenge({
      identifier: identifier.trim(),
      code: code.trim(),
      challengeId,
      purpose,
    })


    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: safeErrorMessage(result.error),
          attemptsRemaining: result.attemptsRemaining ?? 0,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Uthibitisho umefanikiwa.',
      resetToken: result.resetToken,
      attemptsRemaining: 0,
    })
  } catch {
    return NextResponse.json(
      { error: 'Hitilafu ya mfumo. Tafadhali jaribu tena.' },
      { status: 500 }
    )
  }
}
