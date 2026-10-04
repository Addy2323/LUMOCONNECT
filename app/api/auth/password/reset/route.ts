import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'node:crypto'
import { completePasswordResetWithToken } from '@/modules/identity/otp.service'
import { checkRateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limiter'

const passwordResetSchema = z
  .object({
    resetToken: z.string().trim().min(10, 'Valid reset token is required.').max(255),
    newPassword: z.string().min(8, 'Password must be at least 8 characters long.').max(128),
  })
  .strict()

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    // IP-based Rate Limiter (Max 5 password resets per 1 minute per IP)
    const ipRateLimit = await checkRateLimit({
      keyPrefix: 'password-reset-ip',
      identifier: ip,
      maxRequests: 5,
      windowSeconds: 60,
    })

    if (!ipRateLimit.success) {
      return rateLimitResponse(ipRateLimit.resetSeconds, 'Too many password reset requests. Please try again shortly.')
    }

    const body = await request.json().catch(() => ({}))
    const parsed = passwordResetSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid reset payload.', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { resetToken, newPassword } = parsed.data


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

    // Revoke all active sessions for the user upon password reset
    if (result.identifier && process.env.DATABASE_URL?.trim()) {
      const user = await (await import('@/lib/db')).db.user.findFirst({
        where: {
          OR: [{ email: result.identifier }, { phone: result.identifier }],
        },
      })
      if (user) {
        await (await import('@/lib/db')).db.session.updateMany({
          where: { userId: user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        }).catch(() => {})
      }
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
