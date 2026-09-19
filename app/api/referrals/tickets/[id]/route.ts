import { NextResponse } from 'next/server'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'
import { findUserByEmail } from '@/lib/userRegistry'
import {
  getReferralTicket,
  updateReferralTicketStage,
} from '@/modules/deals/referral-cases'
import type { ReferralTicketStage, ReferralClosureReason } from '@/modules/deals/types'

async function getAuthenticatedUser(req: Request) {
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=')
      return [k, decodeURIComponent(v.join('='))]
    })
  )

  const token = cookies[DATABASE_SESSION_COOKIE] || cookies['lumo_session']
  if (!token) return null

  if (process.env.DATABASE_URL?.trim()) {
    try {
      const session = await getDatabaseSession(token)
      if (session && session.user && session.user.accountStatus === 'ACTIVE' && !session.user.deletedAt) {
        const user = session.user
        const roleCode = user.roleAssignments[0]?.role?.code
        const isAdmin = roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN' || user.email === 'admin@lumo.co.tz'
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: isAdmin ? 'ADMIN' : 'PARTNER',
          isAdmin,
        }
      }
    } catch {
      // Fallback below
    }
  }

  return null
}

/**
 * GET /api/referrals/tickets/[id]
 *
 * Retrieves a single referral ticket by ID or ticket reference.
 * Partners can only see their own tickets (merchant data stripped).
 * Admins see full ticket detail.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params

    const ticket = await getReferralTicket(id, {
      forPartnerId: user.isAdmin ? undefined : user.id,
      isAdmin: user.isAdmin,
    })

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, ticket })
  } catch (error: any) {
    console.error('Referral ticket retrieval error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/referrals/tickets/[id]
 *
 * Updates a ticket's stage, coordinator assignment, and details.
 * Admin-only action.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json().catch(() => ({}))

    // Handle Partner Resubmission
    if (!user.isAdmin) {
      const ticket = await getReferralTicket(id, { forPartnerId: user.id })
      if (!ticket || ticket.partnerUserId !== user.id) {
        return NextResponse.json({ success: false, error: 'Connection ticket not found' }, { status: 404 })
      }

      if (ticket.stage !== 'MORE_INFO_REQUIRED') {
        return NextResponse.json(
          { success: false, error: 'Additional information can only be submitted when stage is More Info Required' },
          { status: 400 }
        )
      }

      const resubmissionNotes = body.partnerResubmissionNotes?.trim() || body.additionalInfo?.trim() || 'Partner provided additional information.'

      const updated = await updateReferralTicketStage(id, 'UNDER_REVIEW', {
        partnerResubmissionNotes: resubmissionNotes,
        customerEmail: body.customerEmail?.trim() || undefined,
        customerPhone: body.customerPhone?.trim() || undefined,
        relationshipWithCustomer: body.relationshipWithCustomer?.trim() || undefined,
        partnerVisibleUpdate: 'Additional information submitted by Partner. Under review by LUMO Desk.',
        coordinatorNotes: `Partner provided requested information: "${resubmissionNotes}". Ready for review.`,
      })

      if (!updated) {
        return NextResponse.json({ success: false, error: 'Failed to update connection' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Additional information submitted successfully. Connection is now Under Review.',
      })
    }

    // Admin Stage & Action Updates
    const validStages: ReferralTicketStage[] = [
      'SUBMITTED',
      'UNDER_REVIEW',
      'MORE_INFO_REQUIRED',
      'QUALIFIED',
      'CONTACTED',
      'CUSTOMER_INTERESTED',
      'INTRODUCTION_SCHEDULED',
      'INTRODUCED',
      'NEGOTIATING',
      'SUCCESSFUL',
      'REJECTED',
      'AVAILABILITY_CONFIRMED',
      'IN_PROGRESS',
      'COMPLETED',
      'CLOSED',
      'REWARD_PENDING',
      'REWARD_APPROVED',
      'REWARD_PAID',
      'DUPLICATE',
      'RESUBMITTED',
      'CUSTOMER_NOT_INTERESTED',
    ]
    if (body.stage && !validStages.includes(body.stage)) {
      return NextResponse.json({ success: false, error: 'Invalid stage' }, { status: 400 })
    }

    const updated = await updateReferralTicketStage(id, body.stage, {
      assignedCoordinator: body.assignedCoordinator,
      nextAction: body.nextAction,
      nextActionDueDate: body.nextActionDueDate,
      coordinatorNotes: body.coordinatorNotes,
      partnerVisibleUpdate: body.partnerVisibleUpdate,
      closureReason: body.closureReason,
      rewardStatus: body.rewardStatus,
      requestedInfoNotes: body.requestedInfoNotes?.trim() || undefined,
      rejectionReasonNotes: body.rejectionReasonNotes?.trim() || undefined,
      customerEmail: body.customerEmail?.trim() || undefined,
      customerPhone: body.customerPhone?.trim() || undefined,
      relationshipWithCustomer: body.relationshipWithCustomer?.trim() || undefined,
    })

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Ticket not found or update failed' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Ticket updated successfully' })
  } catch (error: any) {
    console.error('Referral ticket update error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
