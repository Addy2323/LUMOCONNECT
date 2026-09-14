import { NextRequest, NextResponse } from 'next/server'
import { createAndSendOtp } from '@/modules/identity/otp.service'
import { isValidTanzaniaPhone } from '@/modules/sms/phone'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { identifier, purpose = 'REGISTRATION', language = 'EN' } = body

    console.log('[OTP SEND API] Request received', {
      identifier: identifier ? `${identifier.slice(0, 4)}***` : 'MISSING',
      purpose,
      language,
    })

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { error: 'Identifier (phone number or email) is required.' },
        { status: 400 }
      )
    }

    const cleanId = identifier.trim()
    const isPhone = isValidTanzaniaPhone(cleanId)
    const isEmail = cleanId.includes('@') && cleanId.includes('.')

    if (!isPhone && !isEmail) {
      console.warn('[OTP SEND API] Invalid identifier format', { cleanId: cleanId.slice(0, 5) + '***' })
      return NextResponse.json(
        { error: 'Invalid identifier. Must be a valid Tanzanian mobile number (e.g. 07XXXXXXXX) or email address.' },
        { status: 400 }
      )
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined

    const result = await createAndSendOtp({
      identifier: cleanId,
      purpose,
      ipAddress: ip,
      language: language === 'SW' ? 'SW' : 'EN',
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
