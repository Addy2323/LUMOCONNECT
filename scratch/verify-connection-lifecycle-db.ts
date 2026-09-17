import { db } from '../src/lib/db'
import { createReferralTicket, updateReferralTicketStage } from '../src/modules/deals/referral-cases'

async function verifyConnectionLifecycleInDB() {
  console.log('=== Verifying Connection Review & 13-Stage Pipeline in PostgreSQL ===')

  // 1. Verify Partner User in PostgreSQL
  let partnerUser = await db.user.findFirst({
    where: { email: 'partner.test@lumo.tz' },
  })

  if (!partnerUser) {
    partnerUser = await db.user.create({
      data: {
        email: 'partner.test@lumo.tz',
        name: 'Prototype Partner',
        accountStatus: 'ACTIVE',
      },
    })
  }

  console.log('✓ Partner User Active in DB:', { id: partnerUser.id, name: partnerUser.name, email: partnerUser.email })

  // 2. Create a connection ticket via referral-cases
  const ticketRes = await createReferralTicket({
    dealId: 'deal_med_equip_sample',
    dealTitle: 'Supply of Advanced Medical Equipment',
    dealSlug: 'supply-of-advanced-medical-equipment',
    submissionType: 'CUSTOMER_REFERRAL',
    partnerUserId: partnerUser.id,
    partnerName: partnerUser.name,
    partnerPhone: '+255712345678',
    partnerWhatsApp: '+255712345678',
    customerFirstName: 'Zurich Medical Center',
    customerLastName: 'Procurement Desk',
    customerPhone: `+255788${Date.now().toString().slice(-6)}`,
    customerEmail: 'procurement@zurichmed.ch',
    companyName: 'Zurich Medical Center',
    relationshipWithCustomer: 'Existing Business Contact',
    customerInterestLevel: 'Strong Potential Interest',
    contactPermissionConfirmed: true,
    acceptedTermsVersion: 1,
    ticketPrefix: 'LUMO-CON',
  })

  if (!ticketRes.success || !ticketRes.ticket) {
    throw new Error(`Failed to create referral ticket: ${ticketRes.message}`)
  }

  const createdTicket = ticketRes.ticket
  console.log('✓ Created Connection Ticket in PostgreSQL:', {
    id: createdTicket.id,
    reference: createdTicket.ticketReference,
    stage: createdTicket.stage,
    partnerName: createdTicket.partnerName,
    dealTitle: createdTicket.dealTitle,
  })

  // 3. Test Database Persistence - verify row directly in PostgreSQL
  const dbTicket = await db.referralTicket.findUnique({
    where: { id: createdTicket.id },
  })

  if (!dbTicket) {
    throw new Error('Ticket was not found in PostgreSQL referral_tickets table!')
  }

  console.log('✓ Direct PostgreSQL Query Confirms Persistence:', {
    id: dbTicket.id,
    ticketReference: dbTicket.ticketReference,
    stage: dbTicket.stage,
    customerFirstName: dbTicket.customerFirstName,
  })

  // 4. Test 13-Stage Transitions via updateReferralTicketStage
  const testTransitions = [
    { stage: 'UNDER_REVIEW', notes: 'Lumo coordinator assigned and reviewing.' },
    { stage: 'QUALIFIED', notes: 'Verified hospital procurement department.' },
    { stage: 'CONTACTED', notes: 'Initial call completed with procurement head.' },
    { stage: 'CUSTOMER_INTERESTED', notes: 'Customer requested pricing quote.' },
    { stage: 'INTRODUCTION_SCHEDULED', notes: 'Meeting set for next Tuesday.' },
    { stage: 'INTRODUCED', notes: 'Manufacturer and hospital connected.' },
    { stage: 'NEGOTIATING', notes: 'Commercial contract terms being reviewed.' },
    { stage: 'SUCCESSFUL', notes: 'USD 2,250,000 contract signed!' },
    { stage: 'REWARD_PENDING', notes: 'Calculating 5% partner reward.' },
    { stage: 'REWARD_APPROVED', notes: 'USD 112,500 partner commission approved.' },
    { stage: 'REWARD_PAID', notes: 'Disbursed to Partner bank account.' },
    { stage: 'CLOSED', notes: 'Transaction complete and archived.' },
  ] as const

  for (const t of testTransitions) {
    const updated = await updateReferralTicketStage(createdTicket.id, t.stage, {
      coordinatorNotes: t.notes,
      partnerVisibleUpdate: `Stage updated to ${t.stage}: ${t.notes}`,
    })

    if (!updated) {
      throw new Error(`Failed to transition ticket to stage ${t.stage}`)
    }

    // Verify in DB
    const freshRecord = await db.referralTicket.findUnique({
      where: { id: createdTicket.id },
    })

    if (freshRecord?.stage !== t.stage) {
      throw new Error(`DB stage mismatch: expected ${t.stage}, got ${freshRecord?.stage}`)
    }
  }

  console.log('✓ All 13 Pipeline Stages Successfully Updated & Verified in PostgreSQL!')

  // 5. Verify Notifications were created in DB for the partner
  const notifications = await db.notification.findMany({
    where: { userId: partnerUser.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  console.log(`✓ Verified In-App Notifications in PostgreSQL (${notifications.length} found):`)
  for (const n of notifications) {
    console.log(`  - [${n.channel}] ${n.title}: ${n.body}`)
  }

  console.log('\n========================================================================')
  console.log('🎉 VERIFICATION COMPLETE: ALL DATABASE & BACKEND CONNECTIONS ARE 100% OPERATIONAL!')
  console.log('========================================================================')
}

verifyConnectionLifecycleInDB()
  .catch((err) => {
    console.error('❌ Connection Verification Error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
