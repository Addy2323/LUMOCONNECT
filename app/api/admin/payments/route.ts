import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSession } from '@/lib/admin-session'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied
  try {
    const paymentAttempts = await db.paymentAttempt.findMany({
      orderBy: { createdAt: 'desc' },

      include: {
        user: true,
      },
    })

    const formattedPayments = paymentAttempts.map((p) => ({
      id: p.id,
      reference: p.providerReference || p.id,
      payerName: p.user?.name || 'Name not recorded',
      payerType: 'Not recorded',
      channel: p.paymentMethod || 'Not recorded',
      currency: p.currency,
      purpose: p.purpose,
      grossAmountTZS: Number(p.amountMinor) / 100,
      processingFeeTZS: null,
      netAmountTZS: null,
      status: p.status,
      createdAt: p.createdAt.toISOString().replace('T', ' ').slice(0, 19),
      verifiedAt: undefined,
    }))

    return NextResponse.json({ payments: formattedPayments }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'Unable to load payments. Please retry.' }, { status: 500 })
  }
}
