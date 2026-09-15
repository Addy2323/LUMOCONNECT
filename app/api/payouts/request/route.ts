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

    const token = cookies[DATABASE_SESSION_COOKIE] || cookies['lumo_session']
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    let session: any = null
    try {
      session = await getDatabaseSession(token)
    } catch {}

    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session' }, { status: 401 })
    }

    const userId = session.user.id
    const name = session.user.name || 'Promoting Partner'
    const email = session.user.email
    const phone = (session.user as any).phone || body.accountNumber || body.partnerPhone || ''

    const grossAmount = Number(body.amountTZS || body.grossAmountTZS)
    if (!grossAmount || grossAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payout amount' }, { status: 400 })
    }

    const platformFee = Math.round(grossAmount * 0.03) // 3% platform fee
    const taxWithheld = Math.round(grossAmount * 0.05) // 5% TRA withholding tax
    const netAmount = grossAmount - platformFee - taxWithheld

    const payout = await createPartnerPayoutRequest({
      partnerUserId: userId,
      partnerName: name,
      partnerPhone: phone,
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
