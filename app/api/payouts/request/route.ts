import { NextResponse } from 'next/server'
import { createPartnerPayoutRequest } from '@/modules/payouts/payout-store'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=')
        return [k, decodeURIComponent(v.join('='))]
      })
    )

    let userId = req.headers.get('X-User-Id') || body.partnerUserId
    let name = req.headers.get('X-User-Name') || body.partnerName
    let phone = req.headers.get('X-User-Phone') || body.partnerPhone
    let email = req.headers.get('X-User-Email') || body.partnerEmail

    // Try DB session if available
    const token = cookies[DATABASE_SESSION_COOKIE] || cookies['lumo_session']
    if (token && process.env.DATABASE_URL?.trim()) {
      try {
        const session = await getDatabaseSession(token)
        if (session) {
          userId = session.user.id
          name = session.user.name
          phone = (session.user as any).phone || phone
          email = session.user.email
        }
      } catch {}
    }

    if (!userId && !phone && !name) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const grossAmount = Number(body.amountTZS || body.grossAmountTZS)
    if (!grossAmount || grossAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payout amount' }, { status: 400 })
    }

    const platformFee = Math.round(grossAmount * 0.03) // 3% platform fee
    const taxWithheld = Math.round(grossAmount * 0.05) // 5% TRA withholding tax
    const netAmount = grossAmount - platformFee - taxWithheld

    const payout = await createPartnerPayoutRequest({
      partnerUserId: userId || 'usr_partner_001',
      partnerName: name || 'Promoting Partner',
      partnerPhone: phone || body.accountNumber || '',
      partnerEmail: email,
      payoutChannel: body.payoutChannel || 'VODACOM_MPESA',
      accountNumber: body.accountNumber || phone || '',
      accountName: body.accountName || name,
      grossAmountTZS: grossAmount,
      platformFeeTZS: platformFee,
      taxWithheldTZS: taxWithheld,
      netAmountTZS: netAmount,
      notes: body.notes,
    })

    return NextResponse.json({
      success: true,
      message: `Payout request for TZS ${grossAmount.toLocaleString()} submitted successfully. Reference: ${payout.reference}`,
      payout,
    })
  } catch (error: any) {
    console.error('Partner payout request error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
