import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { completePasswordResetWithToken } from '@/modules/identity/otp.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { resetToken, newPassword } = body

    if (!resetToken || typeof resetToken !== 'string') {
      return NextResponse.json(
        { error: 'Valid password reset token is required.' },
        { status: 400 }
      )
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    // Compute secure hash of new password
    const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex')

    const result = completePasswordResetWithToken({
      resetToken,
      newPasswordHash,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Password reset token is invalid or expired.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully updated. You can now log in with your new password.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to complete password reset' },
      { status: 500 }
    )
  }
}
