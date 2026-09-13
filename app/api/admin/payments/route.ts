import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const paymentAttempts = await db.paymentAttempt.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        fundingAccount: true,
      },
    })

    const formattedPayments = paymentAttempts.map((p) => ({
      id: p.id,
      reference: p.orderId || p.providerRef || p.id,
      payerName: 'Partner / Merchant',
      payerType: p.purpose === 'SUBSCRIPTION' ? 'PARTNER' : 'BUSINESS',
      channel: p.paymentMethod || 'MOBILE_MONEY',
      purpose: p.purpose,
      grossAmountTZS: Number(p.amountMinor / 100n),
      processingFeeTZS: Math.round(Number(p.amountMinor / 100n) * 0.015),
      netAmountTZS: Math.round(Number(p.amountMinor / 100n) * 0.985),
      status: p.status,
      createdAt: p.createdAt.toISOString().replace('T', ' ').slice(0, 19),
      verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString().slice(0, 10) : 'Pending Callback',
    }))

    return NextResponse.json({ payments: formattedPayments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
