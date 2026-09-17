import { NextResponse } from 'next/server'
import { createPartnerPayoutRequest } from '@/modules/payouts/payout-store'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'
import { db } from '@/lib/db'
import { getReferralTicket, updateReferralTicketStage } from '@/modules/deals/referral-cases'

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
    let userId: string | null = null
    let name = 'Promoting Partner'
    let email: string | undefined = undefined
    let phone = ''

    if (token && process.env.DATABASE_URL?.trim()) {
      try {
        const session = await getDatabaseSession(token)
        if (session && session.user && session.user.accountStatus === 'ACTIVE' && !session.user.deletedAt) {
          userId = session.user.id
          name = session.user.name || name
          email = session.user.email
          phone = (session.user as any).phone || ''
        }
      } catch {}
    }

    // Header or body partner identity fallback for catalog / direct actions
    if (!userId) {
      const candidateId = req.headers.get('X-User-Id') || body.partnerUserId
      if (candidateId && process.env.DATABASE_URL?.trim()) {
        try {
          const user = await db.user.findFirst({
            where: {
              OR: [{ id: candidateId }, { email: candidateId }],
              accountStatus: 'ACTIVE',
              deletedAt: null,
            },
          })
          if (user) {
            userId = user.id
            name = user.name || name
            email = user.email
            phone = (user as any).phone || ''
          }
        } catch {}
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Verify ticket ownership & stage eligibility if ticketId is provided
    let linkedTicket: any = null
    const ticketTarget = body.ticketId || body.ticketReference
    if (ticketTarget) {
      linkedTicket = await getReferralTicket(ticketTarget, { isAdmin: false, forPartnerId: userId })
      if (!linkedTicket) {
        // Double check without forPartnerId in case user is admin or testing
        linkedTicket = await getReferralTicket(ticketTarget, { isAdmin: true })
      }
      if (linkedTicket) {
        if (linkedTicket.partnerUserId !== userId && req.headers.get('X-User-Role') !== 'ADMIN') {
          return NextResponse.json(
            { success: false, error: 'Unauthorized: This connection belongs to another partner.' },
            { status: 403 }
          )
        }
        const eligibleStages = ['SUCCESSFUL', 'REWARD_APPROVED', 'COMPLETED', 'REWARD_PENDING']
        if (!eligibleStages.includes(linkedTicket.stage)) {
          return NextResponse.json(
            {
              success: false,
              error: `Reward not yet payable. Connection is currently in stage: ${linkedTicket.stage}. Only closed successful deals can be withdrawn.`,
            },
            { status: 400 }
          )
        }
      }
    }

    let grossAmount = Number(body.amountTZS || body.grossAmountTZS)
    if ((!grossAmount || grossAmount <= 0) && linkedTicket?.rewardAmountTZS) {
      grossAmount = Number(linkedTicket.rewardAmountTZS)
    }

    if (!grossAmount || grossAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payout amount' }, { status: 400 })
    }

    const platformFee = Math.round(grossAmount * 0.03) // 3% platform fee
    const taxWithheld = Math.round(grossAmount * 0.05) // 5% TRA withholding tax
    const netAmount = grossAmount - platformFee - taxWithheld

    const payoutNotes = body.notes || (linkedTicket ? `Reward withdrawal for ${linkedTicket.ticketReference}: ${linkedTicket.dealTitle}` : 'Partner balance withdrawal')

    const payout = await createPartnerPayoutRequest({
      partnerUserId: userId,
      partnerName: body.partnerName || name,
      partnerPhone: body.accountNumber || phone || body.partnerPhone || '',
      partnerEmail: email,
      payoutChannel: body.payoutChannel || 'VODACOM_MPESA',
      accountNumber: body.accountNumber || phone || '',
      accountName: body.accountName || name,
      grossAmountTZS: grossAmount,
      platformFeeTZS: platformFee,
      taxWithheldTZS: taxWithheld,
      netAmountTZS: netAmount,
      notes: payoutNotes,
    })

    // If linked to a ticket, advance ticket stage to REWARD_PENDING and record payout reference
    if (linkedTicket) {
      await updateReferralTicketStage(linkedTicket.id, 'REWARD_PENDING', {
        payoutId: payout.id,
        payoutReference: payout.reference,
        rewardStatus: 'PENDING',
        partnerVisibleUpdate: `Payout request submitted (Ref: ${payout.reference}). Queued for LUMO Finance verification & mobile money disbursal.`,
        coordinatorNotes: `Partner requested reward payout of TZS ${grossAmount.toLocaleString()} via ${payout.payoutChannel} (${payout.accountNumber}). Reference: ${payout.reference}`,
      })

      // Dispatch Notifications
      try {
        const adminUser = await db.user.findFirst({
          where: { email: 'admin@lumo.co.tz' },
          select: { id: true },
        })
        if (adminUser) {
          await db.notification.create({
            data: {
              userId: adminUser.id,
              title: 'New Payout Request for Successful Deal',
              body: `Partner ${name} requested TZS ${grossAmount.toLocaleString()} payout for "${linkedTicket.dealTitle}" (${payout.reference}).`,
              linkUrl: '/admin?tab=rewards',
            },
          }).catch(() => {})
        }

        await db.notification.create({
          data: {
            userId,
            title: 'Payout Request Submitted',
            body: `Your payout request of TZS ${grossAmount.toLocaleString()} (Net TZS ${netAmount.toLocaleString()}) for "${linkedTicket.dealTitle}" has been submitted. Reference: ${payout.reference}.`,
            linkUrl: '/partner?tab=payouts',
          },
        }).catch(() => {})
      } catch (notifErr) {
        console.warn('Failed to dispatch payout request notifications:', notifErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payout request for TZS ${grossAmount.toLocaleString()} submitted successfully. Reference: ${payout.reference}`,
      payout,
      ticket: linkedTicket ? { id: linkedTicket.id, ticketReference: linkedTicket.ticketReference, stage: 'REWARD_PENDING' } : undefined,
    })
  } catch (error: any) {
    console.error('Partner payout request error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
