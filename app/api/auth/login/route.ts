import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { DATABASE_SESSION_COOKIE, sessionTokenHash } from '@/lib/database-session'
import { normalizeCanonicalEmail, normalizeCanonicalPhone } from '@/modules/sms/phone'
import { authenticateInMemoryUser } from '@/lib/userRegistry'
import { checkRateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limiter'
import { verifyPassword } from '@/lib/password'


const loginSchema = z
  .object({
    email: z.string().trim().min(1, 'Email or phone is required.').max(255),
    password: z.string().min(1, 'Password is required.').max(128),
  })
  .strict()

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    
    // IP-based Rate Limiter (Max 10 login requests per 1 minute per IP)
    const ipRateLimit = await checkRateLimit({
      keyPrefix: 'login-ip',
      identifier: ip,
      maxRequests: 10,
      windowSeconds: 60,
    })

    if (!ipRateLimit.success) {
      return rateLimitResponse(ipRateLimit.resetSeconds, 'Too many login attempts from this IP. Please try again shortly.')
    }

    const body = await req.json().catch(() => ({}))
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials payload.' },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data
    const normalizedEmail = normalizeCanonicalEmail(email)
    const normalizedPhone = normalizeCanonicalPhone(email)
    const accountIdentifier = normalizedEmail || normalizedPhone || email.trim().toLowerCase()

    // Account-based Rate Limiter (Max 5 login requests per 1 minute per account identifier)
    const accountRateLimit = await checkRateLimit({
      keyPrefix: 'login-account',
      identifier: accountIdentifier,
      maxRequests: 5,
      windowSeconds: 60,
    })

    if (!accountRateLimit.success) {
      return rateLimitResponse(accountRateLimit.resetSeconds, 'Too many login attempts for this account. Please try again shortly.')
    }

    if (!process.env.DATABASE_URL?.trim()) {
      console.warn('DATABASE_URL is not set. Processing login via in-memory user registry.')
      const result = authenticateInMemoryUser(email, password)

      if (!result.success || !result.user) {
        return NextResponse.json(
          { success: false, message: 'Invalid credentials.' },
          { status: 401 }
        )
      }

      const token = (await import('crypto')).randomBytes(32).toString('hex')
      const response = NextResponse.json({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          phone: result.user.phone,
          image: result.user.image,
          role: result.user.role,
          organizationId: result.user.organizationId,
          organizationName: result.user.organizationName,
          accountStatus: result.user.accountStatus,
          twoFactorEnabled: result.user.twoFactorEnabled,
        },
      })

      response.cookies.set(DATABASE_SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 8 * 60 * 60,
      })

      return response
    }

    const user = await db.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ],
      },
      include: {
        accounts: true,
        roleAssignments: {
          include: {
            role: true,
          },
        },
        memberships: {
          include: {
            organization: true,
          },
        },
        partnerProfile: true,
      },
    })

    if (!user) {
      // Execute constant-time dummy password hash comparison to prevent timing enumeration attacks
      verifyPassword(password, null)
      return NextResponse.json(
        { success: false, message: 'Invalid credentials.' },
        { status: 401 }
      )
    }

    // Check account lockout status
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingSeconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          message: 'Account is temporarily locked due to consecutive failed login attempts. Please try again later.',
          retryAfterSeconds: remainingSeconds,
        },
        { status: 423 }
      )
    }

    if (user.accountStatus === 'SUSPENDED' || user.accountStatus === 'LOCKED') {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials.' },
        { status: 401 }
      )
    }

    const credentialAccount = user.accounts.find((a) => a.providerId === 'credential')
    const isValidPassword = verifyPassword(password, credentialAccount?.password)

    if (!isValidPassword) {
      const nextFailedCount = user.failedLoginCount + 1
      let lockUpdate: { failedLoginCount: number; lockedUntil?: Date } = {
        failedLoginCount: nextFailedCount,
      }

      if (nextFailedCount >= MAX_FAILED_ATTEMPTS) {
        const lockoutTime = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
        lockUpdate.lockedUntil = lockoutTime
        console.warn(`[SECURITY LOCKOUT] Account locked due to failed attempts: ${user.id} (${normalizedEmail || normalizedPhone})`)
      }

      await db.user.update({
        where: { id: user.id },
        data: lockUpdate,
      }).catch(() => {})

      return NextResponse.json(
        { success: false, message: 'Invalid credentials.' },
        { status: 401 }
      )
    }

    // Reset lockout counters on successful authentication
    if (user.failedLoginCount > 0 || user.lockedUntil) {
      await db.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      }).catch(() => {})
    }

    // Determine primary role
    const roleCode = user.roleAssignments[0]?.role?.code
    const hasOrg = user.memberships.length > 0
    const resolvedRole: 'ADMIN' | 'BUSINESS' | 'PARTNER' | 'CUSTOMER' =
      roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN' || normalizedEmail === 'admin@lumo.co.tz'
        ? 'ADMIN'
        : roleCode === 'BUSINESS_OWNER' || hasOrg
        ? 'BUSINESS'
        : roleCode === 'PARTNER' || Boolean(user.partnerProfile)
        ? 'PARTNER'
        : 'CUSTOMER'

    const organization = user.memberships[0]?.organization || null

    const token = (await import('crypto')).randomBytes(32).toString('hex')
    const userAgent = req.headers.get('user-agent') || undefined

    await db.session.create({
      data: {
        userId: user.id,
        token: sessionTokenHash(token),
        ipAddress: ip,
        userAgent,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        image: user.image,
        role: resolvedRole,
        organizationId: organization?.id,
        organizationName: organization?.legalName || organization?.tradingName,
        accountStatus: user.accountStatus,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    })

    response.cookies.set(DATABASE_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 8 * 60 * 60,
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Authentication server error.' },
      { status: 500 }
    )
  }
}

