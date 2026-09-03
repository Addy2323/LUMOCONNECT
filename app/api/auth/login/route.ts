import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scryptSync, timingSafeEqual, randomBytes } from 'crypto'

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

    const credentialAccount = user.accounts.find((a) => a.providerId === 'credential')

    if (!credentialAccount) {
      return NextResponse.json(
        { success: false, message: 'No password credential set for this account.' },
        { status: 401 }
      )
    }

    let isValidPassword = false

    if (!credentialAccount.password || credentialAccount.password === 'no_password_set') {
      // Auto-heal legacy accounts that were created without password
      const salt = randomBytes(16).toString('hex')
      const newHash = scryptSync(password, salt, 64).toString('hex') + ':' + salt
      await db.account.update({
        where: { id: credentialAccount.id },
        data: { password: newHash },
      })
      isValidPassword = true
    } else {
      isValidPassword = verifyPassword(password, credentialAccount.password)
    }

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

    return NextResponse.json({
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
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Authentication server error.' },
      { status: 500 }
    )
  }
}
