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

    let userId = req.headers.get('X-User-Id') || url.searchParams.get('userId') || url.searchParams.get('partnerUserId')
    let phone = req.headers.get('X-User-Phone') || url.searchParams.get('phone')
    let userRole = req.headers.get('X-User-Role')

    const token = cookies[DATABASE_SESSION_COOKIE] || cookies['lumo_session']
    if (token && process.env.DATABASE_URL?.trim()) {
      try {
        const session = await getDatabaseSession(token)
        if (session) {
          userId = session.user.id
          phone = (session.user as any).phone || phone
          const roleCode = session.user.roleAssignments[0]?.role?.code
          if (roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN' || session.user.email === 'admin@lumo.co.tz') {
            userRole = 'ADMIN'
          }
        }
      } catch {}
    }

    if (userRole === 'ADMIN') {
      const all = await listAllPayoutRequests()
      return NextResponse.json({ success: true, payouts: all })
    }

    if (!userId && !phone) {
      // Fallback in case no query was provided
      return NextResponse.json({ success: true, payouts: [] })
    }

    const payouts = await listPartnerPayouts(userId || '', phone || undefined)
    return NextResponse.json({ success: true, payouts })
  } catch (error: any) {
    console.error('List payouts error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
