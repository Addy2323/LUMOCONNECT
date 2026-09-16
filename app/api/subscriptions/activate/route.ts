import { NextResponse, type NextRequest } from 'next/server'
import { activateSubscriptionInDatabase } from '@/modules/subscriptions/fulfillment'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
    const session = await getDatabaseSession(sessionToken)

    const body = await request.json().catch(() => ({}))
    const { planCode, userId, email, phone, amountTZS, providerReference } = body

    if (!planCode) {
      return NextResponse.json(
        { success: false, error: 'planCode is required' },
        { status: 400 }
      )
    }

    const effectiveUserId = userId || session?.userId || undefined
    const effectiveEmail = email || session?.user?.email || undefined

    // Role check: Only PARTNER can activate subscription
    if (session?.user) {
      const userRole = (session.user as any).role || (session.user as any).roleAssignments?.[0]?.role?.code
      if (userRole && userRole !== 'PARTNER') {
        return NextResponse.json(
          {
            success: false,
            error: 'Subscriptions are only available for Partner accounts. Business and Admin accounts do not require subscriptions.',
          },
          { status: 403 }
        )
      }
    }

    const activated = await activateSubscriptionInDatabase({
      userId: effectiveUserId,
      email: effectiveEmail,
      phone,
      planCode,
      amountTZS,
      providerReference,
    })

    return NextResponse.json({
      success: true,
      subscription: activated,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error activating subscription'
    const status = message.includes('only available for Partner accounts') ? 403 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
