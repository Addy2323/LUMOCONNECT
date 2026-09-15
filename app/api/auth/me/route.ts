import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DATABASE_SESSION_COOKIE, sessionTokenHash } from '@/lib/database-session'
import { findUserByEmail } from '@/lib/userRegistry'

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=')
        return [k, decodeURIComponent(v.join('='))]
      })
    )

    const token = cookies[DATABASE_SESSION_COOKIE]

    if (!token) {
      return NextResponse.json({ success: false, user: null }, { status: 401 })
    }

    // Database session lookup if DATABASE_URL is available
    if (process.env.DATABASE_URL?.trim()) {
      try {
        const session = await db.session.findUnique({
          where: { token: sessionTokenHash(token) },
          include: {
            user: {
              include: {
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
            },
          },
        })

        if (session && session.expiresAt > new Date() && session.user && session.user.accountStatus === 'ACTIVE' && !session.user.deletedAt) {
          const user = session.user
          const roleCode = user.roleAssignments[0]?.role?.code
          const hasOrg = user.memberships.length > 0
          const resolvedRole: 'ADMIN' | 'BUSINESS' | 'PARTNER' | 'CUSTOMER' =
            roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN' || user.email === 'admin@lumo.co.tz'
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
        }
      } catch (dbErr) {
        console.warn('Database session check error, checking fallback', dbErr)
      }
    }

    // If no active database session was found, return 401 unauthorized
    return NextResponse.json({ success: false, user: null }, { status: 401 })
  } catch (error: any) {
    console.error('Session retrieval error:', error)
    return NextResponse.json({ success: false, user: null }, { status: 500 })
  }
}
