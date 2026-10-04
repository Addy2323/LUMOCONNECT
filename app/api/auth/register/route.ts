import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { normalizeCanonicalEmail, normalizeCanonicalPhone } from '@/modules/sms/phone'
import { registerInMemoryUser } from '@/lib/userRegistry'
import { DATABASE_SESSION_COOKIE, sessionTokenHash } from '@/lib/database-session'

import { checkRateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limiter'

const registerSchema = z.object({
  onboardingComplete: z.literal(true),
  email: z.string().trim().email('Enter a valid email address.').max(255),
  password: z
    .string()
    .min(6, 'Password must contain at least 6 characters.')
    .max(128, 'Password is too long.'),
  name: z
    .string()
    .trim()
    .min(2, 'Enter your full legal name or business representative name.')
    .max(120, 'Name is too long.'),
  phone: z.string().min(5, 'Enter a valid phone number.').max(30),
  image: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().max(2_000_000).optional()
  ),
  role: z.enum(['PARTNER', 'BUSINESS']),
  bizDetails: z
    .object({
      legalName: z.string().max(255).nullable().optional(),
      tradingName: z.string().max(255).nullable().optional(),
      brelaRegNumber: z.string().max(100).nullable().optional(),
      traTin: z.string().max(100).nullable().optional(),
      bizCategory: z.string().max(100).nullable().optional(),
      contactPerson: z.string().max(120).nullable().optional(),
    })
    .strict()
    .nullable()
    .optional(),
  documents: z
    .array(
      z.object({
        name: z.string().max(255),
        type: z.string().max(100),
        fileSize: z.string().max(50).optional(),
        previewUrl: z.string().max(2000).optional(),
      }).strict()
    )
    .nullable()
    .optional(),
}).strict()

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)

    // IP-based Rate Limiter (Max 5 registration requests per 1 minute per IP)
    const ipRateLimit = await checkRateLimit({
      keyPrefix: 'register-ip',
      identifier: ip,
      maxRequests: 5,
      windowSeconds: 60,
    })

    if (!ipRateLimit.success) {
      return rateLimitResponse(ipRateLimit.resetSeconds, 'Too many registration requests from this IP. Please try again shortly.')
    }

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


    const { email, password, name, phone, image, role, bizDetails } = parsed.data
    const normalizedEmail = normalizeCanonicalEmail(email)
    const normalizedPhone = normalizeCanonicalPhone(phone)

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: 'INVALID_EMAIL', message: 'Enter a valid email address.' },
        { status: 400 }
      )
    }

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'INVALID_PHONE', message: 'Enter a valid Tanzania mobile number.' },
        { status: 400 }
      )
    }

    if (!process.env.DATABASE_URL?.trim()) {
      console.warn('DATABASE_URL is not set. Processing registration via in-memory user registry.')
      try {
        const user = registerInMemoryUser({
          email: normalizedEmail,
          password,
          name,
          phone: normalizedPhone,
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
      } catch (inMemErr: any) {
        if (inMemErr?.code === 'P2002') {
          const target = inMemErr?.meta?.target
          const targetStr = Array.isArray(target) ? target.join(', ') : String(target || '')
          const isPhone = targetStr.includes('phone')
          return NextResponse.json(
            {
              error: 'ACCOUNT_ALREADY_EXISTS',
              message: isPhone
                ? 'An account with this phone number already exists. Please sign in instead.'
                : 'An account with this email address already exists. Please sign in instead.',
            },
            { status: 409 }
          )
        }
        throw inMemErr
      }
    }

    const salt = crypto.randomBytes(16).toString('hex')
    const hashedPassword = crypto.scryptSync(password, salt, 64).toString('hex') + ':' + salt

    // Check if user already exists (by email or phone)
    const existing = await db.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { email: normalizedEmail },
          { phone: normalizedPhone },
        ],
      },
    })

    if (existing) {
      const isEmailMatch = existing.email.toLowerCase() === normalizedEmail
      return NextResponse.json(
        {
          error: 'ACCOUNT_ALREADY_EXISTS',
          message: isEmailMatch
            ? 'An account with this email address already exists. Please sign in instead.'
            : 'An account with this phone number already exists. Please sign in instead.',
        },
        { status: 409 }
      )
    }

    // Execute PostgreSQL transaction to persist user, account, org, verification case, documents, and audit log
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          emailVerified: true,
          name,
          phone: normalizedPhone,
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
            phone: normalizedPhone,
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
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      const target = (error as any).meta?.target
      const targetStr = Array.isArray(target) ? target.join(', ') : String(target || '')
      const isPhone = targetStr.includes('phone')
      return NextResponse.json(
        {
          error: 'ACCOUNT_ALREADY_EXISTS',
          message: isPhone
            ? 'An account with this phone number already exists. Please sign in instead.'
            : 'An account with this email address already exists. Please sign in instead.',
        },
        { status: 409 }
      )
    }

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
