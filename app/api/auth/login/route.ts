import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scryptSync, timingSafeEqual, randomBytes } from 'crypto'
import { DATABASE_SESSION_COOKIE, sessionTokenHash } from '@/lib/database-session'

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [hash, salt] = storedHash.split(':')
    if (!hash || !salt) return false
    const hashBuffer = Buffer.from(hash, 'hex')
    const testHash = scryptSync(password, salt, 64)
    return timingSafeEqual(hashBuffer, testHash)
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error('Login unavailable: DATABASE_URL is not configured for this deployment.')
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_NOT_CONFIGURED',
        message: 'Sign in is temporarily unavailable. Please try again after the database is connected.',
      },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
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
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. User does not exist.' },
        { status: 401 }
      )
    }

    if (user.accountStatus === 'SUSPENDED' || user.accountStatus === 'LOCKED') {
      return NextResponse.json(
        { success: false, message: `Access denied. Your account is ${user.accountStatus.toLowerCase()}.` },
        { status: 403 }
      )
    }

    if (user.accountStatus !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'Complete all registration and onboarding steps before accessing your dashboard.' },
        { status: 403 }
      )
    }

    const credentialAccount = user.accounts.find((a) => a.providerId === 'credential')

    if (!credentialAccount) {
      return NextResponse.json(
        { success: false, message: 'No password credential set for this account.' },
        { status: 401 }
      )
    }

    const isValidPassword = Boolean(credentialAccount.password && verifyPassword(password, credentialAccount.password))

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid password. Please check your credentials.' },
        { status: 401 }
      )
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

    const token = randomBytes(32).toString('hex')
    await db.session.create({ data: {
      userId: user.id,
      token: sessionTokenHash(token),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    } })
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
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      path: '/', maxAge: 8 * 60 * 60,
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
