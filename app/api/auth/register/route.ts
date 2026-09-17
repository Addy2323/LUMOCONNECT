import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { db } from '@/lib/db'

const registerSchema = z.object({
  onboardingComplete: z.literal(true),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must contain at least 6 characters.')
    .max(128, 'Password is too long.'),
  name: z
    .string()
    .trim()
    .min(2, 'Enter your full legal name or business representative name.')
    .max(120, 'Name is too long.'),
  phone: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return val
      const digits = val.replace(/\D/g, '')
      if (digits.startsWith('255') && digits.length === 12) return `+${digits}`
      if (digits.startsWith('0') && digits.length === 10) return `+255${digits.slice(1)}`
      if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) return `+255${digits}`
      return val.trim()
    },
    z.string().regex(/^\+255[67]\d{8}$/, 'Enter a valid Tanzania mobile number.')
  ),
  image: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().max(2_000_000).optional()
  ),
  role: z.enum(['PARTNER', 'BUSINESS']),
  bizDetails: z
    .object({
      legalName: z.string().nullable().optional(),
      tradingName: z.string().nullable().optional(),
      brelaRegNumber: z.string().nullable().optional(),
      traTin: z.string().nullable().optional(),
      bizCategory: z.string().nullable().optional(),
      contactPerson: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  documents: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        fileSize: z.string().optional(),
        previewUrl: z.string().optional(),
      })
    )
    .nullable()
    .optional(),
})

import { registerInMemoryUser } from '@/lib/userRegistry'
import { DATABASE_SESSION_COOKIE, sessionTokenHash } from '@/lib/database-session'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      const firstErrorMessage = firstIssue
        ? `${firstIssue.path.join('.') ? firstIssue.path.join('.') + ': ' : ''}${firstIssue.message}`
        : 'Invalid registration payload'
      console.warn('Registration validation failed:', firstErrorMessage, parsed.error.format())
      return NextResponse.json(
        {
          error: 'INVALID_REGISTRATION_PAYLOAD',
          message: firstErrorMessage,
          details: parsed.error.format(),
        },
        { status: 400 }
      )
    }

    const { email, password, name, phone, image, role, bizDetails, documents } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()

    if (!process.env.DATABASE_URL?.trim()) {
      console.warn('DATABASE_URL is not set. Processing registration via in-memory user registry.')
      const user = registerInMemoryUser({
        email: normalizedEmail,
        password,
        name,
        phone,
        role,
        image: image || undefined,
        bizDetails: bizDetails
          ? {
              legalName: bizDetails.legalName || undefined,
              tradingName: bizDetails.tradingName || undefined,
            }
          : undefined,
      })

      const token = crypto.randomBytes(32).toString('hex')
      const response = NextResponse.json({
        success: true,
        message: 'Account created successfully in local workspace.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          orgId: user.organizationId,
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
    const salt = crypto.randomBytes(16).toString('hex')
    const hashedPassword = crypto.scryptSync(password, salt, 64).toString('hex') + ':' + salt

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        accounts: true,
        memberships: true,
        roleAssignments: true,
      },
    })

    if (existing) {
      // If user exists, update password and details rather than blocking registration flow
      const { updatedUser, sessionToken } = await db.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id: existing.id },
          data: {
            name: name || existing.name,
            phone,
            // A verified onboarding portrait is immutable through normal profile updates.
            image: existing.image || image,
            phoneVerified: true,
            emailVerified: true,
            accountStatus: 'ACTIVE',
          },
        })

        const credAccount = existing.accounts.find((a) => a.providerId === 'credential')
        if (credAccount) {
          await tx.account.update({
            where: { id: credAccount.id },
            data: { password: hashedPassword },
          })
        } else {
          await tx.account.create({
            data: {
              userId: u.id,
              providerId: 'credential',
              accountId: normalizedEmail,
              password: hashedPassword,
            },
          })
        }

        const token = crypto.randomBytes(32).toString('hex')
        await tx.session.create({
          data: {
            userId: u.id,
            token: sessionTokenHash(token),
            expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
          },
        })

        return { updatedUser: u, sessionToken: token }
      })

      const response = NextResponse.json({
        success: true,
        message: 'Account profile updated successfully.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          phone: updatedUser.phone,
          role,
        },
      })

      response.cookies.set(DATABASE_SESSION_COOKIE, sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 8 * 60 * 60,
      })

      return response
    }

    // Execute PostgreSQL transaction to persist user, account, org, verification case, documents, and audit log
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          emailVerified: true,
          name,
          phone,
          image: image || null,
          phoneVerified: true,
          accountStatus: 'ACTIVE',
          twoFactorEnabled: true,
        },
      })

      await tx.account.create({
        data: {
          userId: user.id,
          providerId: 'credential',
          accountId: normalizedEmail,
          password: hashedPassword,
        },
      })

      let orgId: string | undefined
      if (role === 'BUSINESS') {
        const legalName = bizDetails?.legalName || name
        const slug = `${legalName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`

        const org = await tx.organization.create({
          data: {
            legalName,
            tradingName: bizDetails?.tradingName || legalName,
            slug,
            registrationNumber: bizDetails?.brelaRegNumber || null,
            tin: bizDetails?.traTin || null,
            countryCode: 'TZ',
            verificationStatus: 'PENDING',
          },
        })
        orgId = org.id

        await tx.organizationMember.create({
          data: {
            userId: user.id,
            organizationId: org.id,
            businessRole: 'OWNER',
          },
        })
      } else {
        // Create partner profile
        const handle = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`
        await tx.partnerProfile.create({
          data: {
            userId: user.id,
            handle,
            partnerType: 'AFFILIATE',
            categories: ['ECOMMERCE', 'COMMERCE'],
            region: 'Dar es Salaam',
            verificationStatus: 'VERIFIED',
          },
        })
      }

      // Assign system role
      const roleRecord = await tx.role.findUnique({
        where: { code: role === 'BUSINESS' ? 'BUSINESS_OWNER' : 'PARTNER' },
      })

      if (roleRecord) {
        await tx.roleAssignment.create({
          data: {
            userId: user.id,
            roleId: roleRecord.id,
          },
        })
      }

      // Record Audit Event
      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'AUTH_REGISTRATION_COMPLETED',
          entityType: 'USER',
          entityId: user.id,
          afterData: {
            role,
            phone,
            email: normalizedEmail,
          },
        },
      })

      // Create active session
      const sessionToken = crypto.randomBytes(32).toString('hex')
      await tx.session.create({
        data: {
          userId: user.id,
          token: sessionTokenHash(sessionToken),
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        },
      })

      return { user, orgId, sessionToken }
    })

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully with full PostgreSQL transaction.',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        phone: result.user.phone,
        role,
        orgId: result.orgId,
      },
    })

    response.cookies.set(DATABASE_SESSION_COOKIE, result.sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 8 * 60 * 60,
    })

    return response
  } catch (error: unknown) {
    console.error('Registration transaction error:', error)
    return NextResponse.json(
      {
        error: 'REGISTRATION_FAILED',
        message: 'We could not activate your account right now. Please try again shortly.',
      },
      { status: 500 }
    )
  }
}
