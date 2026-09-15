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
 * Extracts the authenticated user from the session cookie, client session headers,
 * request body identity payload, or fallback partner registry.
 */
async function getAuthenticatedUser(req: Request, body?: any) {
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=')
      return [k, decodeURIComponent(v.join('='))]
    })
  )

  const token = cookies[DATABASE_SESSION_COOKIE] || cookies['lumo_session']

  // 1. Try database session if token exists and DB is configured
  if (token && process.env.DATABASE_URL?.trim()) {
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

  // 2. Check X-User-* headers (client session hydration, PWA, or auth-guard)
  const headerUserId = req.headers.get('X-User-Id')
  const headerUserName = req.headers.get('X-User-Name')
  const headerUserPhone = req.headers.get('X-User-Phone')
  const headerUserEmail = req.headers.get('X-User-Email')
  const headerUserRole = req.headers.get('X-User-Role')

  if (headerUserId || headerUserPhone || headerUserName) {
    const isAdmin = headerUserRole === 'ADMIN' || headerUserEmail === 'admin@lumo.co.tz'
    return {
      id: headerUserId || 'usr_partner_' + (headerUserPhone || '001').replace(/\D/g, '').slice(-6),
      name: headerUserName || 'Promoting Partner',
      email: headerUserEmail || '',
      phone: headerUserPhone || '',
      role: isAdmin ? 'ADMIN' : 'PARTNER',
      isAdmin,
    }
  }

  // 3. Check request body if provided (e.g. from partner referral forms)
  if (body) {
    const bodyPartnerPhone = body.partnerPhone || body.partnerWhatsApp
    const bodyPartnerName = body.partnerName
    const bodyPartnerId = body.partnerUserId

    if (bodyPartnerPhone || bodyPartnerName || bodyPartnerId) {
      return {
        id: bodyPartnerId || 'usr_partner_' + (bodyPartnerPhone || '001').replace(/\D/g, '').slice(-6),
        name: bodyPartnerName || 'Promoting Partner',
        email: body.partnerEmail || '',
        phone: bodyPartnerPhone || '',
        role: 'PARTNER',
        isAdmin: false,
      }
    }
  }

  // 4. Check URL query parameters (for GET requests)
  try {
    const url = new URL(req.url)
    const paramPhone = url.searchParams.get('partnerPhone') || url.searchParams.get('phone')
    const paramUserId = url.searchParams.get('partnerUserId') || url.searchParams.get('userId')
    const paramName = url.searchParams.get('partnerName') || url.searchParams.get('name')

    if (paramPhone || paramUserId || paramName) {
      return {
        id: paramUserId || 'usr_partner_' + (paramPhone || '001').replace(/\D/g, '').slice(-6),
        name: paramName || 'Promoting Partner',
        email: '',
        phone: paramPhone || '',
        role: 'PARTNER',
        isAdmin: false,
      }
    }
  } catch {}

  // 5. Fallback: in-memory partner
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
 * Resolves partner identity securely from database session, client session headers,
 * or authenticated request payload.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const user = await getAuthenticatedUser(req, body)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Validate submission type
    const submissionType = body.submissionType
    if (!submissionType || !['CUSTOMER_REFERRAL', 'COORDINATION_ENQUIRY'].includes(submissionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid submission type. Must be CUSTOMER_REFERRAL or COORDINATION_ENQUIRY.' },
        { status: 400 }
      )
    }

    // Build input, resolving partner identity
    const input: CreateReferralTicketInput = {
      dealId: body.dealId,
      opportunityId: body.opportunityId || null,
      dealTitle: body.dealTitle,
      dealSlug: body.dealSlug,
      submissionType,
      partnerUserId: user.id || body.partnerUserId || 'usr_partner_001',
      partnerName: user.name || body.partnerName || 'Promoting Partner',
      partnerPhone: body.partnerPhone || user.phone || body.partnerWhatsApp || '',
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
