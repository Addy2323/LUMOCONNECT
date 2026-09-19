import { describe, it, expect, beforeAll } from 'vitest'
import {
  createReferralTicket,
  getReferralTicket,
  updateReferralTicketStage,
  listAdminReferralTickets,
  listPartnerReferralTickets,
} from '@/modules/deals/referral-cases'
import { db } from '@/lib/db'
import { ReferralTicketStage } from '@/modules/deals/types'

describe('Connection Request Info and Rejection Lifecycle', () => {
  let partnerUserId: string
  let ticketRef: string
  let ticketId: string

  beforeAll(async () => {
    // Ensure test user exists in DB
    const testUser = await db.user.upsert({
      where: { email: 'test.lifecycle.partner@lumo.tz' },
      update: {},
      create: {
        email: 'test.lifecycle.partner@lumo.tz',
        name: 'Juma Ally',
        accountStatus: 'ACTIVE',
      },
    })
    partnerUserId = testUser.id

    // Create a connection ticket
    const res = await createReferralTicket({
      dealId: 'test-deal-uuid-lifecycle',
      dealTitle: 'Fleet Management Software - Dar Port',
      dealSlug: 'fleet-management-dar-port',
      submissionType: 'CUSTOMER_CONNECTION' as const,
      ticketPrefix: 'LUMO-CON' as const,
      partnerUserId: testUser.id,
      partnerName: 'Juma Ally',
      partnerPhone: '+255712000111',
      partnerWhatsApp: '+255712000111',
      customerFirstName: 'Baraka',
      customerLastName: 'Salim',
      customerPhone: '+255712999888',
      customerEmail: 'baraka@salimholdings.tz',
      relationshipWithCustomer: 'Former Client',
      spokenToCustomer: 'Yes',
      customerInterestLevel: 'High (Actively Seeking Solution)',
      lumoMayContact: 'Yes',
      declarationAccepted: true,
      contactPermissionConfirmed: true,
      additionalNotes: 'Initial lead note',
    })

    if (!res.success) {
      console.error('createReferralTicket error:', res.message)
    }
    expect(res.success).toBe(true)
    ticketRef = res.ticket!.ticketReference
    ticketId = res.ticket!.id
  })

  it('allows Admin to transition ticket to MORE_INFO_REQUIRED with specific notes', async () => {
    const success = await updateReferralTicketStage(
      ticketId,
      'MORE_INFO_REQUIRED' as ReferralTicketStage,
      {
        requestedInfoNotes: 'Please verify customer decision maker title and confirm active phone number.',
        coordinatorNotes: 'Awaiting phone confirmation from partner',
        partnerVisibleUpdate: 'LUMO Desk requires additional details to verify this lead.',
      }
    )
    expect(success).toBe(true)

    // Verify fetched ticket for partner & admin
    const fetched = await getReferralTicket(ticketRef)
    expect(fetched).not.toBeNull()
    expect(fetched!.stage).toBe('MORE_INFO_REQUIRED')
    expect(fetched!.requestedInfoNotes).toBe(
      'Please verify customer decision maker title and confirm active phone number.'
    )
    expect(fetched!.partnerVisibleUpdate).toBe(
      'LUMO Desk requires additional details to verify this lead.'
    )

    // Verify listPartnerReferralTickets includes requestedInfoNotes
    const partnerList = await listPartnerReferralTickets(partnerUserId)
    const partnerTicket = partnerList.find((t) => t.ticketReference === ticketRef)
    expect(partnerTicket).toBeDefined()
    expect(partnerTicket!.requestedInfoNotes).toBe(
      'Please verify customer decision maker title and confirm active phone number.'
    )
  })

  it('allows Partner to provide additional info, update contact info, and resubmit back to UNDER_REVIEW', async () => {
    const success = await updateReferralTicketStage(
      ticketId,
      'UNDER_REVIEW' as ReferralTicketStage,
      {
        partnerResubmissionNotes: 'Confirmed he is Managing Director. Added secondary line.',
        customerPhone: '+255788999000',
        customerEmail: 'direct.baraka@salimholdings.tz',
        relationshipWithCustomer: 'Managing Director & Personal Friend',
      }
    )
    expect(success).toBe(true)

    const fetched = await getReferralTicket(ticketRef)
    expect(fetched).not.toBeNull()
    expect(fetched!.stage).toBe('UNDER_REVIEW')
    expect(fetched!.customerPhone).toBe('+255788999000')
    expect(fetched!.customerEmail).toBe('direct.baraka@salimholdings.tz')
    expect(fetched!.relationshipWithCustomer).toBe('Managing Director & Personal Friend')
    expect(fetched!.additionalNotes).toContain('[Partner Resubmission')
    expect(fetched!.additionalNotes).toContain('Confirmed he is Managing Director. Added secondary line.')
    expect(fetched!.partnerVisibleUpdate).toContain('Additional information submitted by Partner')

    // Verify admin sees updated details
    const adminList = await listAdminReferralTickets({ query: ticketRef })
    const adminTicket = adminList.find((t) => t.ticketReference === ticketRef)
    expect(adminTicket).toBeDefined()
    expect(adminTicket!.customerPhone).toBe('+255788999000')
    expect(adminTicket!.customerEmail).toBe('direct.baraka@salimholdings.tz')
    expect(adminTicket!.relationshipWithCustomer).toBe('Managing Director & Personal Friend')
  })

  it('allows Admin to reject a connection with closure reason and rejection reason notes', async () => {
    const success = await updateReferralTicketStage(
      ticketId,
      'REJECTED' as ReferralTicketStage,
      {
        closureReason: 'CUSTOMER_NOT_INTERESTED',
        rejectionReasonNotes: 'Customer already engaged competitor on a 3-year signed contract.',
        coordinatorNotes: 'Lead disqualified due to competitor contract.',
      }
    )
    expect(success).toBe(true)

    const fetched = await getReferralTicket(ticketRef)
    expect(fetched).not.toBeNull()
    expect(fetched!.stage).toBe('REJECTED')
    expect(fetched!.closureReason).toBe('CUSTOMER_NOT_INTERESTED')
    expect(fetched!.rejectionReasonNotes).toBe(
      'Customer already engaged competitor on a 3-year signed contract.'
    )
    expect(fetched!.partnerVisibleUpdate).toContain('Connection rejected')

    // Verify partner sees rejection reason
    const partnerList = await listPartnerReferralTickets(partnerUserId)
    const partnerTicket = partnerList.find((t) => t.ticketReference === ticketRef)
    expect(partnerTicket).toBeDefined()
    expect(partnerTicket!.closureReason).toBe('CUSTOMER_NOT_INTERESTED')
    expect(partnerTicket!.rejectionReasonNotes).toBe(
      'Customer already engaged competitor on a 3-year signed contract.'
    )
  })
})
