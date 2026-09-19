import { NextResponse } from 'next/server'
import { listPartnerPayouts, listAllPayoutRequests } from '@/modules/payouts/payout-store'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=')
        return [k, decodeURIComponent(v.join('='))]
      })
    )

    const token = cookies[DATABASE_SESSION_COOKIE] || cookies['lumo_session']
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    let session: any = null
    try {
      session = await getDatabaseSession(token)
    } catch {}

    if (!session) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session' }, { status: 401 })
    }

    const roleCode = session.user.roleAssignments?.[0]?.role?.code
    const isAdmin = roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN' || session.user.email === 'admin@lumo.co.tz'

    if (isAdmin) {
      const partnerUserId = url.searchParams.get('userId') || url.searchParams.get('partnerUserId')
      if (partnerUserId) {
        const payouts = await listPartnerPayouts(partnerUserId)
        return NextResponse.json({ success: true, payouts })
      }
      const all = await listAllPayoutRequests()
      return NextResponse.json({ success: true, payouts: all })
    }

    // Non-admin partners can ONLY access their own payouts
    const payouts = await listPartnerPayouts(session.user.id, (session.user as any).phone)
    return NextResponse.json({ success: true, payouts })
  } catch (error: any) {
    console.error('List payouts error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
