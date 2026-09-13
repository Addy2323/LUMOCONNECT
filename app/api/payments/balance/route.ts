import { NextResponse } from 'next/server'
import { SnippePaymentAdapter } from '@/lib/providers/snippe'

const snippe = new SnippePaymentAdapter()

export async function GET() {
  try {
    const balance = await snippe.getAccountBalance()
    return NextResponse.json({
      success: true,
      data: balance,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching Snippe balance'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
