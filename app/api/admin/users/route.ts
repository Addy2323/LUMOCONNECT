import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, randomUUID, scryptSync } from 'crypto'
import { z } from 'zod'
import { db } from '@/lib/db'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform(value => value.toLowerCase()),
  phone: z.string().transform(value => value.replace(/[\s()-]/g, '').replace(/^0/, '+255'))
    .refine(value => /^\+255[67]\d{8}$/.test(value), 'Enter a valid Tanzania mobile number.'),
  role: z.enum(['ADMIN', 'BUSINESS', 'PARTNER']),
  password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/),
  confirmPassword: z.string(),
}).refine(value => value.password === value.confirmPassword, { message: 'Passwords do not match.' })

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ message: 'Invalid request origin.' }, { status: 403 })
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    if (!session) return NextResponse.json({ message: 'Please sign out and sign in again before creating accounts.' }, { status: 401 })
    const allowed = session.user.roleAssignments.some(assignment =>
      !assignment.organizationId && ['ADMIN', 'SUPER_ADMIN'].includes(assignment.role.code))
    if (!allowed) return NextResponse.json({ message: 'Administrator access is required.' }, { status: 403 })
    const parsed = schema.safeParse(await request.json().catch(() => null))
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
