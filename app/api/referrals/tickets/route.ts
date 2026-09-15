import { NextResponse } from 'next/server'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'
import { db } from '@/lib/db'
import {
  createReferralTicket,
  listPartnerReferralTickets,
  listAdminReferralTickets,
  CreateReferralTicketInput,
} from '@/modules/deals/referral-cases'

/**
 * Strictly extracts the authenticated user from the database session.
 * Never allows client-supplied identity overrides or generic fallbacks.
 */
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
          phone: (user as any).phone || '',
          role: isAdmin ? 'ADMIN' : 'PARTNER',
          isAdmin,
        }
      }
    } catch (err) {
      console.warn('Session resolution error in referral tickets route:', err)
    }
  }

  return null
}

/**
 * POST /api/referrals/tickets
 *
 * Creates a new referral or coordination ticket.
 * Partner identity is strictly bound to the authenticated database session.
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))

    // Validate submission type
    const submissionType = body.submissionType
    if (!submissionType || !['CUSTOMER_REFERRAL', 'COORDINATION_ENQUIRY'].includes(submissionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid submission type. Must be CUSTOMER_REFERRAL or COORDINATION_ENQUIRY.' },
        { status: 400 }
      )
    }

    // Strictly enforce partner identity from authenticated session
    const input: CreateReferralTicketInput = {
      dealId: body.dealId,
      opportunityId: body.opportunityId || null,
      dealTitle: body.dealTitle || 'Opportunity Deal',
      dealSlug: body.dealSlug || body.dealId,
      submissionType,
      partnerUserId: user.id, // Immutable authenticated ID
      partnerName: user.name,
      partnerPhone: user.phone || body.partnerPhone || '',
      partnerWhatsApp: body.partnerWhatsApp || user.phone || body.partnerPhone || '',
      promotionalCode: body.promotionalCode || null,
      // Customer info (only validated for CUSTOMER_REFERRAL)
      customerFirstName: body.customerFirstName || null,
      customerLastName: body.customerLastName || null,
      customerPhone: body.customerPhone || null,
      contactPermissionConfirmed: Boolean(body.contactPermissionConfirmed),
      // Deal requirement details
      quantity: body.quantity ? parseInt(body.quantity, 10) : 1,
      deliveryDestination: body.deliveryDestination || null,
      specifications: body.specifications || null,
      terminalOption: body.terminalOption || null,
      additionalNotes: body.additionalNotes || null,
      // Terms
      acceptedTermsVersion: body.acceptedTermsVersion || 1,
      // Internal merchant association
      merchantOrgId: body.merchantOrgId || null,
      merchantName: body.merchantName || null,
      // Reward info
      rewardAmountTZS: body.rewardAmountTZS || null,
      rewardDisplay: body.rewardDisplay || null,
      // Idempotency
      idempotencyKey: body.idempotencyKey || null,
    }

    const result = await createReferralTicket(input)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message, errorCode: result.errorCode },
        { status: result.errorCode === 'DUPLICATE_SUBMISSION' ? 409 : 400 }
      )
    }

    // Real-time notification dispatch in PostgreSQL
    if (process.env.DATABASE_URL?.trim()) {
      try {
        // 1. Notify Partner
        await db.notification.create({
          data: {
            userId: user.id,
            title: 'Referral Ticket Submitted',
            body: `Your customer referral for "${input.dealTitle}" has been submitted (Ref: ${result.ticket?.ticketReference}) and is currently under review by Lumo.`,
            linkUrl: '/partner?tab=leads_referrals',
          },
        }).catch(() => {})

        // 2. Notify Platform Administrator
        const adminUser = await db.user.findFirst({
          where: { email: 'admin@lumo.co.tz' },
          select: { id: true },
        })
        if (adminUser) {
          await db.notification.create({
            data: {
              userId: adminUser.id,
              title: 'New Customer Referral Received',
              body: `Partner ${user.name} submitted a customer referral for "${input.dealTitle}". Reference: ${result.ticket?.ticketReference}.`,
              linkUrl: '/admin?tab=referrals',
            },
          }).catch(() => {})
        }
      } catch (notifErr) {
        console.warn('Failed to dispatch referral notifications:', notifErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      ticket: result.ticket,
    })
  } catch (error: any) {
    console.error('Referral ticket creation error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

/**
 * GET /api/referrals/tickets
 *
 * Lists referral tickets strictly scoped to the authenticated viewer.
 * - Partners see ONLY their own tickets (merchant data stripped).
 * - Admins see all tickets with full audit detail.
 */
export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const url = new URL(req.url)
    const query = url.searchParams.get('q') || undefined
    const stage = url.searchParams.get('stage') || undefined
    const submissionType = url.searchParams.get('type') || undefined

    if (user.isAdmin) {
      const tickets = await listAdminReferralTickets({
        query,
        stage: stage as any,
        submissionType: submissionType as any,
      })
      return NextResponse.json({ success: true, tickets, total: tickets.length })
    }

    // Partner view: strictly their own tickets
    const tickets = await listPartnerReferralTickets(user.id, user.phone)
    return NextResponse.json({ success: true, tickets, total: tickets.length })
  } catch (error: any) {
    console.error('Referral tickets list error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
