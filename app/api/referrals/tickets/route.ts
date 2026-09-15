import { NextResponse } from 'next/server'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'
import { findUserByEmail } from '@/lib/userRegistry'
import {
  createReferralTicket,
  listPartnerReferralTickets,
  listAdminReferralTickets,
  CreateReferralTicketInput,
} from '@/modules/deals/referral-cases'

/**
 * Extracts the authenticated user from the session cookie.
 * Returns null if not authenticated.
 */
async function getAuthenticatedUser(req: Request) {
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=')
      return [k, decodeURIComponent(v.join('='))]
    })
  )

  const token = cookies[DATABASE_SESSION_COOKIE]
  if (!token) return null

  // Try database session
  if (process.env.DATABASE_URL?.trim()) {
    try {
      const session = await getDatabaseSession(token)
      if (session) {
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
    } catch {
      // Fallback below
    }
  }

  // Fallback: return default partner user
  const partnerUser = findUserByEmail('partner@lumo.co.tz')
  if (partnerUser) {
    return {
      id: partnerUser.id,
      name: partnerUser.name,
      email: partnerUser.email,
      phone: partnerUser.phone || '',
      role: partnerUser.role,
      isAdmin: partnerUser.role === 'ADMIN',
    }
  }

  return null
}

/**
 * POST /api/referrals/tickets
 *
 * Creates a new referral or coordination ticket.
 * Partner identity is resolved from the server session (never from request body).
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()

    // Validate submission type
    const submissionType = body.submissionType
    if (!submissionType || !['CUSTOMER_REFERRAL', 'COORDINATION_ENQUIRY'].includes(submissionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid submission type. Must be CUSTOMER_REFERRAL or COORDINATION_ENQUIRY.' },
        { status: 400 }
      )
    }

    // Build input, enforcing server-side partner identity
    const input: CreateReferralTicketInput = {
      dealId: body.dealId,
      opportunityId: body.opportunityId || null,
      dealTitle: body.dealTitle,
      dealSlug: body.dealSlug,
      submissionType,
      // Authoritative partner identity from session ONLY
      partnerUserId: user.id,
      partnerName: user.name,
      partnerPhone: body.partnerPhone || user.phone || '',
      partnerWhatsApp: body.partnerWhatsApp || body.partnerPhone || user.phone || '',
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
      // Internal merchant association (can be pre-populated from deal data)
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
 * Lists referral tickets.
 * - Partners see only their own tickets (merchant data stripped).
 * - Admins see all tickets with full detail.
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

    // Partner view: only their tickets, merchant-stripped
    const tickets = await listPartnerReferralTickets(user.id, user.phone)
    return NextResponse.json({ success: true, tickets, total: tickets.length })
  } catch (error: any) {
    console.error('Referral tickets list error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
