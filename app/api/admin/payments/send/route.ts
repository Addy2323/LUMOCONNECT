import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSession } from '@/lib/admin-session'
import { SnippePaymentAdapter } from '@/lib/providers/snippe'
import { updatePayoutStatus } from '@/modules/payouts/payout-store'
import { db } from '@/lib/db'

const snippe = new SnippePaymentAdapter()

export async function POST(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied

  try {
    const body = await request.json().catch(() => ({}))
    const {
      recipientPhone,
      recipientName,
      amountTZS,
      narration,
      payoutId,
    } = body

    if (!recipientPhone || !recipientPhone.trim()) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number is required.' },
        { status: 400 }
      )
    }

    if (!recipientName || !recipientName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Recipient name is required.' },
        { status: 400 }
      )
    }

    const amount = Number(amountTZS)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid payment amount.' },
        { status: 400 }
      )
    }

    if (amount < 5000) {
      return NextResponse.json(
        { success: false, error: 'Minimum mobile money disbursal amount via Snippe is TZS 5,000.' },
        { status: 400 }
      )
    }

    // Call Snippe Disbursements API
    const result = await snippe.sendPayout({
      amountTZS: amount,
      recipientPhone: recipientPhone.trim(),
      recipientName: recipientName.trim(),
      narration: narration || (payoutId ? `LUMO Partner Payout ${payoutId}` : 'Direct Mobile Money Disbursal'),
      metadata: {
        disbursed_by: 'admin_portal',
        payout_id: payoutId || null,
      },
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || 'Failed to dispatch mobile money via Snippe gateway.',
        },
        { status: 400 }
      )
    }

    const disbursalRef = result.reference || result.externalReference || `SNIPPE-MM-${Date.now()}`

    // If linked to an existing payout request, advance status to PAID
    let updatedPayout = null
    if (payoutId) {
      try {
        updatedPayout = await updatePayoutStatus({
          payoutId,
          action: 'DISBURSE',
          adminActor: 'Admin Finance Gateway',
          disbursalReference: disbursalRef,
          notes: `Direct Snippe Mobile Money Disbursal to ${recipientPhone.trim()}`,
        })
      } catch (storeErr) {
        console.warn('Could not update payout store after Snippe disbursal:', storeErr)
      }
    }

    // Record direct disbursement in DB if user is found
    try {
      if (process.env.DATABASE_URL?.trim() && !payoutId) {
        const cleanPhone = recipientPhone.trim().replace(/\D/g, '').slice(-9)
        const user = await db.user.findFirst({
          where: {
            OR: [
              { phone: { contains: cleanPhone } },
              { name: { contains: recipientName.trim(), mode: 'insensitive' } },
            ],
          },
        })
        if (user) {
          let payoutMethod = await db.payoutMethod.findFirst({
            where: { userId: user.id },
          })
          if (!payoutMethod) {
            payoutMethod = await db.payoutMethod.create({
              data: {
                userId: user.id,
                provider: 'MOBILE_MONEY',
                accountNumber: recipientPhone.trim(),
                accountName: recipientName.trim(),
                isDefault: true,
                isVerified: true,
              },
            })
          }
          await db.payout.create({
            data: {
              partnerUserId: user.id,
              payoutMethodId: payoutMethod.id,
              grossAmountMinor: BigInt(Math.round(amount * 100)),
              netAmountMinor: BigInt(Math.round(amount * 100)),
              providerReference: disbursalRef,
              idempotencyKey: `direct_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              status: 'PAID',
              authorizedBy: 'Admin Direct Transfer',
              authorizedAt: new Date(),
            },
          }).catch(() => null)
        }
      }
    } catch (dbErr) {
      console.warn('Could not record direct payout in DB:', dbErr)
    }

    return NextResponse.json({
      success: true,
      reference: disbursalRef,
      externalReference: result.externalReference,
      status: result.status,
      message: `Successfully dispatched TZS ${amount.toLocaleString()} directly to ${recipientPhone.trim()} via Snippe.`,
      payout: updatedPayout,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error processing direct transfer'
    console.error('Direct money transfer error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
