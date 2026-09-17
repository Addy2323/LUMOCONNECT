import { describe, it, expect, beforeAll } from 'vitest'
import {
  createReferralTicket,
  getReferralTicket,
  updateReferralTicketStage,
} from '@/modules/deals/referral-cases'
import {
  createPartnerPayoutRequest,
  updatePayoutStatus,
  listPartnerPayouts,
} from '@/modules/payouts/payout-store'
import { db } from '@/lib/db'
import { ReferralTicketStage } from '@/modules/deals/types'

describe('Partner Deal Payout Request Lifecycle', () => {
  let partnerUserId: string
  let ticketRef: string
  let ticketId: string
  const testDealTitle = 'Independent Cargo Inspection - Swiss Trade Flow'
  const grossReward = 10000000 // TZS 10,000,000

  beforeAll(async () => {
    // Ensure partner user exists in DB
    const testUser = await db.user.upsert({
      where: { email: 'partner.deals.payout@lumo.tz' },
      update: {},
      create: {
        email: 'partner.deals.payout@lumo.tz',
        name: 'Ally Mwamba',
        phone: '+255768111222',
        accountStatus: 'ACTIVE',
      },
    })
    partnerUserId = testUser.id

    // Create a new connection ticket
    const uniqueSuffix = Date.now().toString().slice(-6)
    const res = await createReferralTicket({
      dealId: `deal-cargo-inspection-${uniqueSuffix}`,
      dealTitle: testDealTitle,
      dealSlug: `cargo-inspection-${uniqueSuffix}`,
      submissionType: 'CUSTOMER_CONNECTION' as const,
      ticketPrefix: 'LUMO-CON' as const,
      partnerUserId: testUser.id,
      partnerName: 'Ally Mwamba',
      partnerPhone: '+255768111222',
      partnerWhatsApp: '+255768111222',
      customerFirstName: 'Joseph',
      customerLastName: 'Menard',
      customerPhone: `+255754${uniqueSuffix}`,
      customerEmail: 'joseph@swisscargo.ch',
      relationshipWithCustomer: 'Existing Business Contact',
      spokenToCustomer: 'Yes',
      customerInterestLevel: 'High (Actively Seeking Solution)',
      lumoMayContact: 'Yes',
      declarationAccepted: true,
      contactPermissionConfirmed: true,
      rewardAmountTZS: grossReward,
      rewardDisplay: 'TZS 10,000,000',
    })

    expect(res.success).toBe(true)
    ticketRef = res.ticket!.ticketReference
    ticketId = res.ticket!.id
  })

  it('sets rewardStatus to APPROVED when connection transitions to SUCCESSFUL', async () => {
    // Admin moves deal to SUCCESSFUL (Stage 9)
    const success = await updateReferralTicketStage(
      ticketId,
      'SUCCESSFUL' as ReferralTicketStage,
      {
        coordinatorNotes: 'Deal closed and buyer confirmed purchase order.',
      }
    )
    expect(success).toBe(true)

    const fetched = await getReferralTicket(ticketRef)
    expect(fetched).not.toBeNull()
    expect(fetched!.stage).toBe('SUCCESSFUL')
    expect(fetched!.rewardStatus).toBe('APPROVED')
    expect(fetched!.rewardAmountTZS).toBe(grossReward)
  })

  it('allows partner to submit payout request, creating payout and advancing ticket to REWARD_PENDING', async () => {
    // 1. Calculate fee and taxes
    const platformFee = Math.round(grossReward * 0.03) // 300,000
    const taxWithheld = Math.round(grossReward * 0.05) // 500,000
    const netAmount = grossReward - platformFee - taxWithheld // 9,200,000

    // 2. Create payout request
    const payout = await createPartnerPayoutRequest({
      partnerUserId,
      partnerName: 'Ally Mwamba',
      partnerPhone: '+255768111222',
      payoutChannel: 'VODACOM_MPESA',
      accountNumber: '+255768111222',
      accountName: 'Ally Mwamba',
      grossAmountTZS: grossReward,
      platformFeeTZS: platformFee,
      taxWithheldTZS: taxWithheld,
      netAmountTZS: netAmount,
      notes: `Reward withdrawal for ${ticketRef}: ${testDealTitle}`,
    })

    expect(payout).toBeDefined()
    expect(payout.reference).toMatch(/^LUMO-PAY-/)
    expect(payout.status).toBe('PENDING_APPROVAL')
    expect(payout.grossAmountTZS).toBe(grossReward)
    expect(payout.netAmountTZS).toBe(netAmount)

    // 3. Link payout to ticket and advance stage to REWARD_PENDING (Stage 10)
    const updated = await updateReferralTicketStage(
      ticketId,
      'REWARD_PENDING' as ReferralTicketStage,
      {
        payoutId: payout.id,
        payoutReference: payout.reference,
        rewardStatus: 'PENDING',
      }
    )
    expect(updated).toBe(true)

    // 4. Verify ticket state
    const fetched = await getReferralTicket(ticketRef)
    expect(fetched).not.toBeNull()
    expect(fetched!.stage).toBe('REWARD_PENDING')
    expect(fetched!.rewardStatus).toBe('PENDING')
    expect(fetched!.payoutReference).toBe(payout.reference)
    expect(fetched!.partnerVisibleUpdate).toContain(payout.reference)

    // 5. Verify partner sees payout in their payout list
    const partnerPayouts = await listPartnerPayouts(partnerUserId)
    const matched = partnerPayouts.find((p) => p.reference === payout.reference)
    expect(matched).toBeDefined()
    expect(matched!.status).toBe('PENDING_APPROVAL')
  })

  it('auto-advances ticket to REWARD_PAID when Admin disburses payout', async () => {
    const partnerPayouts = await listPartnerPayouts(partnerUserId)
    const pendingPayout = partnerPayouts.find((p) => p.grossAmountTZS === grossReward)
    expect(pendingPayout).toBeDefined()

    // Admin disburses payout
    const disbursalRef = `MM-MOMOPAY-${Date.now().toString().slice(-6)}`
    const disbursed = await updatePayoutStatus({
      payoutId: pendingPayout!.id,
      action: 'DISBURSE',
      adminActor: 'Finance Desk Officer',
      disbursalReference: disbursalRef,
      notes: 'Disbursed via Vodacom Bulk Disbursal portal',
    })

    expect(disbursed).not.toBeNull()
    expect(disbursed!.status).toBe('PAID')
    expect(disbursed!.disbursalReference).toBe(disbursalRef)

    // Verify referral ticket was automatically advanced to REWARD_PAID
    const fetchedTicket = await getReferralTicket(ticketRef)
    expect(fetchedTicket).not.toBeNull()
    expect(fetchedTicket!.stage).toBe('REWARD_PAID')
    expect(fetchedTicket!.rewardStatus).toBe('PAID')
    expect(fetchedTicket!.partnerVisibleUpdate).toContain(disbursalRef)
  })

  it('guarantees no duplicate payouts are returned when identical references exist in memory and DB', async () => {
    const { listAllPayoutRequests } = await import('@/modules/payouts/payout-store')
    const allPayouts = await listAllPayoutRequests()
    const partnerPayouts = await listPartnerPayouts(partnerUserId)

    // Check allPayouts has unique references
    const allRefs = allPayouts.map((p) => p.reference)
    const uniqueAllRefs = new Set(allRefs)
    expect(allRefs.length).toBe(uniqueAllRefs.size)

    // Check partnerPayouts has unique references
    const partnerRefs = partnerPayouts.map((p) => p.reference)
    const uniquePartnerRefs = new Set(partnerRefs)
    expect(partnerRefs.length).toBe(uniquePartnerRefs.size)
  })
})
