import { NextRequest, NextResponse } from 'next/server'
import { verifyOtpChallenge } from '@/modules/identity/otp.service'

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
    const body = await request.json().catch(() => ({}))
    const { identifier, code, challengeId } = body

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { error: 'Identifier (phone number or email) is required.' },
        { status: 400 }
      )
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Verification code is required.' },
        { status: 400 }
      )
    }

    const result = verifyOtpChallenge({
      identifier: identifier.trim(),
      code: code.trim(),
      challengeId,
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
