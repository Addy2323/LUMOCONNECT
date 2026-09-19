import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { providers } from '@/lib/providers'
import { normalizeTanzaniaPhone } from '@/modules/sms/phone'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET(request: NextRequest) {
  return handleSubscriptionSweep(request)
}

export async function POST(request: NextRequest) {
  return handleSubscriptionSweep(request)
}

async function handleSubscriptionSweep(request: NextRequest) {
  try {
    const now = new Date()

    // Authorization verification: allow cron secret header or authenticated admin
    const authHeader = request.headers.get('authorization')
    const cronSecretHeader = request.headers.get('x-cron-secret')
    const configuredSecret = process.env.CRON_SECRET

    let isAuthorized = false

    if (configuredSecret && cronSecretHeader === configuredSecret) {
      isAuthorized = true
    } else if (configuredSecret && authHeader === `Bearer ${configuredSecret}`) {
      isAuthorized = true
    } else {
      // Check if caller is admin session
      const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
      const session = await getDatabaseSession(sessionToken)
      if (session) {
        const isAdmin =
          session.user.roleAssignments?.some(
            (ra: any) => ra.role?.code === 'ADMIN' || ra.role?.code === 'SUPER_ADMIN'
          ) || session.user.email === 'admin@lumo.co.tz'
        if (isAdmin) isAuthorized = true
      }

      // In local dev without secret configured, allow manual trigger for testing
      if (!configuredSecret && process.env.NODE_ENV !== 'production') {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: invalid cron authorization' },
        { status: 401 }
      )
    }

    let expiredCount = 0
    let remindersSent = 0
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    if (process.env.DATABASE_URL?.trim()) {
      // 1. Auto-expire any active subscriptions past their expiresAt
      const expireResult = await db.userSubscription.updateMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { lte: now },
        },
        data: {
          status: 'EXPIRED',
        },
      })
      expiredCount = expireResult.count

      // 2. Find all active subscriptions expiring in the next 24 hours
      const expiringSoon = await db.userSubscription.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            gt: now,
            lte: in24Hours,
          },
        },
        include: {
          user: {
            select: { id: true, name: true, phone: true, email: true },
          },
          plan: {
            select: { id: true, code: true, name: true },
          },
        },
      })

      for (const sub of expiringSoon) {
        // Idempotency: Check if a 24h reminder notification was already created for this cycle
        const existingNotification = await db.notification.findFirst({
          where: {
            userId: sub.userId,
            templateCode: 'SUB_REMINDER_1_DAY',
            createdAt: {
              gte: sub.startsAt || new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        })

        if (existingNotification) {
          // Already sent for this subscription cycle
          continue
        }

        const phone = sub.user.phone
        const userName = sub.user.name || 'Partner'
        const planName = sub.plan?.name || 'Access Pass'
        const expiryDateStr = sub.expiresAt
          ? sub.expiresAt.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'soon'

        const messageText = `[LUMO] Habari ${userName}, ${planName} yako inaisha tarehe ${expiryDateStr}. Lipia sasa kupitia M-Pesa/Airtel/Tigo kuendelea kufikia fursa na kamisheni bila kukatizwa: https://lumo.co.tz/subscriptions`

        let smsDispatched = false
        if (phone) {
          try {
            const formattedPhone = normalizeTanzaniaPhone(phone)
            const smsRes = await providers.sms.sendSms({
              recipientPhone: formattedPhone,
              messageText,
            })
            smsDispatched = smsRes.success
          } catch (smsErr) {
            console.warn(`[CRON SUB REMINDER] SMS dispatch error for ${phone}:`, smsErr)
          }
        }

        // Record in notifications table (serves as idempotency record and in-app alert)
        await db.notification.create({
          data: {
            userId: sub.userId,
            templateCode: 'SUB_REMINDER_1_DAY',
            channel: phone ? 'SMS' : 'IN_APP',
            title: 'LUMO Pass Expiring Soon (24 Hours Remaining)',
            body: `Your ${planName} expires on ${expiryDateStr}. Renew now to keep your commercial deal room and marketing kits active.`,
            linkUrl: '/dashboard/partner?tab=subscription',
          },
        })

        // Record audit trail
        try {
          await db.auditLog.create({
            data: {
              actorUserId: sub.userId,
              action: 'SUBSCRIPTION_EXPIRY_REMINDER_DISPATCHED',
              entityType: 'UserSubscription',
              entityId: sub.id,
              afterData: {
                userId: sub.userId,
                planCode: sub.plan?.code,
                expiresAt: sub.expiresAt,
                phone,
                smsDispatched,
              },
            },
          })
        } catch (auditErr) {
          console.warn('[CRON SUB REMINDER] Audit log write warning:', auditErr)
        }

        remindersSent++
      }
    }

    return NextResponse.json({
      success: true,
      serverTime: now.toISOString(),
      expiredCount,
      remindersSent,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cron execution failed'
    console.error('[CRON SUBSCRIPTION REMINDERS ERROR]:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
