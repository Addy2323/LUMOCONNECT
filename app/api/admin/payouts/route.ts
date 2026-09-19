import { NextRequest, NextResponse } from 'next/server'
import { listAllPayoutRequests, updatePayoutStatus } from '@/modules/payouts/payout-store'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || undefined
    const status = searchParams.get('status') || undefined

    const payouts = await listAllPayoutRequests(q, status)
    return NextResponse.json({ success: true, payouts, total: payouts.length })
  } catch (error: any) {
    console.error('Admin list payouts error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorName = session?.user?.name || request.headers.get('X-User-Name') || 'Finance Administrator'

    const body = await request.json().catch(() => ({}))
    const { payoutId, action, disbursalReference, rejectionReason, notes } = body

    if (!payoutId || !['AUTHORIZE', 'DISBURSE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Missing payoutId or invalid action. Must be AUTHORIZE, DISBURSE, or REJECT.' },
        { status: 400 }
      )
    }

    const updated = await updatePayoutStatus({
      payoutId,
      action,
      adminActor: actorName,
      disbursalReference,
      rejectionReason,
      notes,
    })

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Payout request not found.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Payout ${updated.reference} updated to ${updated.status}.`,
      payout: updated,
    })
  } catch (error: any) {
    console.error('Admin payout action error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
