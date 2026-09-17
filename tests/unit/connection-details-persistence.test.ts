import { describe, it, expect } from 'vitest'
import {
  createReferralTicket,
  getReferralTicket,
  listAdminReferralTickets,
  listPartnerReferralTickets,
} from '@/modules/deals/referral-cases'
import { db } from '@/lib/db'

describe('Connection Extended Details Persistence & Admin Visibility', () => {
  it('persists email, relationship, and interest level in DB and returns them for admin and partner', async () => {
    // Ensure test user exists in PostgreSQL to test real DB write
    const testUser = await db.user.upsert({
      where: { email: 'test.partner.connections@lumo.tz' },
      update: {},
      create: {
        email: 'test.partner.connections@lumo.tz',
        name: 'Baraka Partner',
        accountStatus: 'ACTIVE',
      },
    })

    const testPayload = {
      dealId: 'test-deal-uuid-1',
      dealTitle: 'Independent Cargo Inspection Partner – Tanzania to Switzerland Trade Flow',
      dealSlug: 'cargo-inspection-swiss-trade',
      submissionType: 'CUSTOMER_CONNECTION' as const,
      ticketPrefix: 'LUMO-CON' as const,
      partnerUserId: testUser.id,
      partnerName: 'Baraka Partner',
      partnerPhone: '+255712345678',
      partnerWhatsApp: '+255712345678',
      entityType: 'BUSINESS',
      customerRole: 'Direct Corporate Buyer',
      companyName: 'Swiss Cargo Inspection AG',
      contactPerson: 'Joseph Menard',
      customerFirstName: 'Joseph',
      customerLastName: 'Menard',
      customerCountry: 'Tanzania',
      customerCity: 'Dar es Salaam',
      customerPhone: '+255754510059',
      customerEmail: 'joseph.menard@swisscargo.ch',
      relationshipWithCustomer: 'Existing Business Contact',
      spokenToCustomer: 'Yes',
      customerInterestLevel: 'High (Actively Seeking Solution)',
      lumoMayContact: 'Yes',
      customerSuitability: 'Full Quality Inspection Certification',
      relevantCapabilities: ['Full Quality Inspection Certification'],
      declarationAccepted: true,
      contactPermissionConfirmed: true,
      additionalNotes: 'Urgent cargo inspection requirement for coffee exports.',
      rewardDisplay: 'TZS 2,000,000',
    }

    const res = await createReferralTicket(testPayload)
    expect(res.success).toBe(true)
    expect(res.ticket).toBeDefined()
    const ticketRef = res.ticket!.ticketReference
    expect(ticketRef).toMatch(/^LUMO-CON-/)

    // Verify row directly in PostgreSQL
    const dbRow = await db.referralTicket.findUnique({
      where: { ticketReference: ticketRef },
    })
    expect(dbRow).not.toBeNull()
    expect(dbRow!.customerEmail).toBe('joseph.menard@swisscargo.ch')
    expect(dbRow!.relationshipWithCustomer).toBe('Existing Business Contact')
    expect(dbRow!.customerInterestLevel).toBe('High (Actively Seeking Solution)')
    expect(dbRow!.companyName).toBe('Swiss Cargo Inspection AG')
    expect(dbRow!.customerPhone).toBe('+255754510059')

    // 1. Verify fields returned from createReferralTicket
    expect(res.ticket!.customerEmail).toBe('joseph.menard@swisscargo.ch')
    expect(res.ticket!.relationshipWithCustomer).toBe('Existing Business Contact')
    expect(res.ticket!.customerInterestLevel).toBe('High (Actively Seeking Solution)')
    expect(res.ticket!.companyName).toBe('Swiss Cargo Inspection AG')

    // 2. Verify fields returned by getReferralTicket
    const fetched = await getReferralTicket(ticketRef)
    expect(fetched).not.toBeNull()
    expect(fetched!.customerEmail).toBe('joseph.menard@swisscargo.ch')
    expect(fetched!.relationshipWithCustomer).toBe('Existing Business Contact')
    expect(fetched!.customerInterestLevel).toBe('High (Actively Seeking Solution)')
    expect(fetched!.companyName).toBe('Swiss Cargo Inspection AG')
    expect(fetched!.customerPhone).toBe('+255754510059')

    // 3. Verify fields returned by listAdminReferralTickets
    const adminTickets = await listAdminReferralTickets({ query: ticketRef })
    const matchedAdminTicket = adminTickets.find((t) => t.ticketReference === ticketRef)
    expect(matchedAdminTicket).toBeDefined()
    expect(matchedAdminTicket!.customerEmail).toBe('joseph.menard@swisscargo.ch')
    expect(matchedAdminTicket!.relationshipWithCustomer).toBe('Existing Business Contact')
    expect(matchedAdminTicket!.customerInterestLevel).toBe('High (Actively Seeking Solution)')
    expect(matchedAdminTicket!.companyName).toBe('Swiss Cargo Inspection AG')

    // 4. Verify fields returned by listPartnerReferralTickets
    const partnerTickets = await listPartnerReferralTickets(testUser.id)
    const matchedPartnerTicket = partnerTickets.find((t) => t.ticketReference === ticketRef)
    expect(matchedPartnerTicket).toBeDefined()
    expect(matchedPartnerTicket!.customerEmail).toBe('joseph.menard@swisscargo.ch')
    expect(matchedPartnerTicket!.relationshipWithCustomer).toBe('Existing Business Contact')
    expect(matchedPartnerTicket!.customerInterestLevel).toBe('High (Actively Seeking Solution)')
    expect(matchedPartnerTicket!.companyName).toBe('Swiss Cargo Inspection AG')

    // Clean up test records
    await db.referralTicket.deleteMany({ where: { ticketReference: ticketRef } })
  })
})
