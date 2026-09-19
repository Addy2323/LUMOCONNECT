import { NextRequest, NextResponse } from 'next/server'
import { internationalService } from '@/modules/international/service'
import { InternationalPlanCode } from '@/modules/international/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      userId,
      userName,
      userEmail,
      userPhone,
      planCode,
      currency,
      paymentMethod = 'CARD_CROSS_BORDER',
    } = body

    if (!userId || !userEmail || !planCode) {
      return NextResponse.json(
        { success: false, error: 'Missing userId, userEmail, or planCode' },
        { status: 400 }
      )
    }

    const plan = internationalService.plans.find((p) => p.code === planCode)
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Invalid international plan selected' }, { status: 400 })
    }

    const selectedCurrency = (currency || 'USD').toUpperCase()
    const amountPaid = plan.prices[selectedCurrency] || plan.basePriceUSD
    const paymentReference = `INT-PAY-${Date.now().toString().slice(-8)}`

    const membership = await internationalService.createOrUpdateMembership({
      userId,
      userName: userName || userEmail.split('@')[0],
      userEmail,
      userPhone,
      planCode: plan.code as InternationalPlanCode,
      currency: selectedCurrency,
      amountPaid,
      paymentMethod,
      paymentReference,
      notes: 'Subscribed via LUMO International Portal',
    })

    return NextResponse.json({
      success: true,
      membership,
      message: `Congratulations! International Private Access is now active until ${new Date(membership.expiresAt).toLocaleDateString()}.`,
    })
  } catch (error: any) {
    console.error('International subscribe error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process international subscription' },
      { status: 500 }
    )
  }
}
