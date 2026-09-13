import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, randomUUID, scryptSync } from 'crypto'
import { z } from 'zod'
import { db } from '@/lib/db'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform(value => value.toLowerCase()),
  phone: z.string().transform(value => value.replace(/[\s()-]/g, '').replace(/^0/, '+255'))
    .refine(value => /^\+255[67]\d{8}$/.test(value), 'Enter a valid Tanzania mobile number.'),
  role: z.enum(['ADMIN', 'BUSINESS', 'PARTNER']),
  password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/),
  confirmPassword: z.string(),
}).refine(value => value.password === value.confirmPassword, { message: 'Passwords do not match.' })

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_VERIFICATION']).optional(),
  role: z.enum(['ADMIN', 'BUSINESS', 'PARTNER']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const roleFilter = searchParams.get('role') || 'ALL'
    const statusFilter = searchParams.get('status') || 'ALL'
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    const users = await db.user.findMany({
      where: {
        deletedAt: null,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(statusFilter !== 'ALL' ? { accountStatus: statusFilter as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
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
        verificationCasesUser: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    const formattedUsers = users.map((u) => {
      const hasOrg = u.memberships && u.memberships.length > 0
      const roleCode = u.roleAssignments[0]?.role?.code || (hasOrg ? 'BUSINESS_OWNER' : 'CUSTOMER')
      const roleMapped =
        roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN'
          ? 'ADMIN'
          : roleCode === 'BUSINESS_OWNER' || roleCode === 'BUSINESS' || hasOrg
          ? 'BUSINESS'
          : roleCode === 'PARTNER'
          ? 'PARTNER'
          : 'CUSTOMER'

      if (roleFilter !== 'ALL' && roleMapped !== roleFilter) {
        return null
      }

      const kycStatus =
        u.verificationCasesUser[0]?.status === 'APPROVED'
          ? 'VERIFIED'
          : u.verificationCasesUser[0]?.status === 'REJECTED'
          ? 'REJECTED'
          : 'PENDING'

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '—',
        role: roleMapped,
        status: u.accountStatus,
        mfaEnabled: u.twoFactorEnabled,
        lastActive: 'Active',
        joinedDate: u.createdAt.toISOString().slice(0, 10),
        totalTransactions: 0,
        balanceTZS: 0,
        kycStatus,
        organizationName:
          u.memberships[0]?.organization?.tradingName ||
          u.memberships[0]?.organization?.legalName,
      }
    }).filter(Boolean)

    return NextResponse.json({ users: formattedUsers })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch users.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ message: 'Invalid request origin.' }, { status: 403 })
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    if (!session) return NextResponse.json({ message: 'Please sign out and sign in again before creating accounts.' }, { status: 401 })
    const allowed = session.user.roleAssignments.some(assignment =>
      !assignment.organizationId && ['ADMIN', 'SUPER_ADMIN'].includes(assignment.role.code))
    if (!allowed) return NextResponse.json({ message: 'Administrator access is required.' }, { status: 403 })
    const parsed = createUserSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ message: 'Check your name, email and phone. Use matching passwords with at least 12 characters, uppercase, lowercase and a number.' }, { status: 400 })
    const input = parsed.data
    const roleCode = input.role === 'BUSINESS' ? 'BUSINESS_OWNER' : input.role
    const role = await db.role.findUnique({ where: { code: roleCode } })
    if (!role) return NextResponse.json({ message: 'The selected role has not been configured.' }, { status: 409 })
    const salt = randomBytes(16).toString('hex')
    const password = scryptSync(input.password, salt, 64).toString('hex') + ':' + salt
    const user = await db.$transaction(async tx => {
      const created = await tx.user.create({ data: {
        name: input.name, email: input.email, phone: input.phone, accountStatus: 'ACTIVE',
        accounts: { create: { providerId: 'credential', accountId: input.email, password } },
      } })
      let organizationId: string | undefined
      if (input.role === 'BUSINESS') {
        const org = await tx.organization.create({ data: {
          legalName: input.name, slug: `business-${randomUUID()}`, verificationStatus: 'PENDING',
          members: { create: { userId: created.id, businessRole: 'OWNER', status: 'ACTIVE' } },
        } })
        organizationId = org.id
      }
      if (input.role === 'PARTNER') await tx.partnerProfile.create({ data: {
        userId: created.id, handle: `partner_${randomUUID()}`, partnerType: 'AFFILIATE', verificationStatus: 'PENDING',
      } })
      await tx.roleAssignment.create({ data: { userId: created.id, roleId: role.id, organizationId } })
      await tx.auditLog.create({ data: {
        actorUserId: session.userId, action: 'ADMIN_USER_CREATED', entityType: 'USER', entityId: created.id,
        afterData: { email: created.email, role: input.role },
      } })
      return created
    })
    return NextResponse.json({ user: {
      id: user.id, name: user.name, email: user.email, phone: user.phone, role: input.role,
      status: user.accountStatus, mfaEnabled: false, lastActive: 'Not yet signed in',
      joinedDate: user.createdAt.toISOString(), totalTransactions: 0, balanceTZS: 0, kycStatus: 'NOT_SUBMITTED',
    } }, { status: 201 })
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002')
      return NextResponse.json({ message: 'An account with that email or phone already exists.' }, { status: 409 })
    return NextResponse.json({ message: 'Unable to create the account. Please try again.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid user update payload.' }, { status: 400 })
    }

    const { userId, status } = parsed.data

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: { role: true },
        },
      },
    })

    if (!targetUser) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 })
    }

    // Protection: Prevent suspending the last Super Admin
    const isTargetSuperAdmin = targetUser.roleAssignments.some((r) => r.role.code === 'SUPER_ADMIN' || r.role.code === 'ADMIN')
    if (isTargetSuperAdmin && (status === 'SUSPENDED' || status === 'LOCKED')) {
      const superAdminCount = await db.roleAssignment.count({
        where: {
          role: { code: { in: ['SUPER_ADMIN', 'ADMIN'] } },
          user: { accountStatus: 'ACTIVE' },
        },
      })
      if (superAdminCount <= 1) {
        return NextResponse.json({ message: 'Cannot suspend the last active platform administrator.' }, { status: 403 })
      }
    }

    const updatedUser = await db.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          ...(status ? { accountStatus: status } : {}),
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: 'ADMIN_USER_STATUS_UPDATED',
          entityType: 'USER',
          entityId: userId,
          beforeData: { status: targetUser.accountStatus },
          afterData: { status: updated.accountStatus },
        },
      })

      return updated
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to update user.' }, { status: 500 })
  }
}
