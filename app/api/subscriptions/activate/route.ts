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
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
