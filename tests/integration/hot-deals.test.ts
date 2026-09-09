import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createHash, randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { activate, dealDetails } from '@/modules/hot-deals/service'
import { registerLead, validateOutcome } from '@/modules/hot-deals/claims'
import { processHotDeals } from '@/modules/hot-deals/worker'
import { approveReward, confirmPayout, createPayoutInstruction } from '@/modules/hot-deals/rewards'
import { disputeClaim } from '@/modules/hot-deals/claims'
import { NextRequest } from 'next/server'
import { GET as publicDeals } from '@/app/api/hot-deals/route'
import { GET as documentDownload } from '@/app/api/hot-deals/[id]/documents/[documentId]/route'
import { sessionTokenHash } from '@/lib/database-session'
import type { Actor } from '@/modules/hot-deals/auth'
import { releaseDates as dates } from '@/modules/hot-deals/policy'

// Run through scripts/test-hot-deals.mjs. Never mutate the application schema.
const isolated = /^lumo_hot_deals_test_[a-f0-9]{32}$/.test(process.env.HOT_DEALS_TEST_SCHEMA ?? '')
describe.skipIf(!isolated)('PostgreSQL Hot Deals', () => {
  let privateUser: Actor, partner: Actor, other: Actor, admin: Actor
  let organizationId: string, evidenceId: string
  const terms = 'First valid registered customer referral with verified payment wins. Subject to fraud review and 72-hour dispute period.'

  beforeAll(async () => {
    const users = await Promise.all(['private', 'partner', 'other', 'admin'].map(name => db.user.create({ data: { name, email: `${name}@example.test`, phone: `+2557${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`, accountStatus: 'ACTIVE' }, include: { roleAssignments: { include: { role: true } } } })))
    ;[privateUser, partner, other, admin] = users
    const role = await db.role.create({ data: { code: 'ADMIN', name: 'Admin', permissions: [] } })
    const assignment = await db.roleAssignment.create({ data: { userId: admin.id, roleId: role.id }, include: { role: true } })
    admin.roleAssignments = [assignment]
    const privatePlan = await db.subscriptionPlan.create({ data: { code: 'PRIVATE_TEST', name: 'Private', billingPeriod: 'MONTHLY', priceMinor: 1n, features: [], entitlements: { create: { code: 'PRIVATE_MEMBER' } } } })
    const partnerPlan = await db.subscriptionPlan.create({ data: { code: 'PARTNER_TEST', name: 'Partner', billingPeriod: 'MONTHLY', priceMinor: 1n, features: [], entitlements: { create: { code: 'PARTNER_SUBSCRIBER' } } } })
    for (const user of [privateUser, partner, other]) await db.userSubscription.create({ data: { userId: user.id, planId: user.id === partner.id ? partnerPlan.id : privatePlan.id, status: 'ACTIVE', startsAt: new Date(Date.now() - 1000), expiresAt: new Date(Date.now() + 86400000) } })
    organizationId = (await db.organization.create({ data: { legalName: 'Test merchant', slug: randomUUID(), members: { create: { userId: admin.id, businessRole: 'OWNER' } } } })).id
    evidenceId = (await db.fileAsset.create({ data: { uploaderId: admin.id, fileKey: `hot-deals/${randomUUID()}`, fileName: 'evidence.pdf', mimeType: 'application/pdf', fileSizeBytes: 10 } })).id
  }, 60000)
  afterAll(async () => { await db.$disconnect() })

  async function fixture(units = 1, slots = 5, released = false) {
    const opportunity = await db.opportunity.create({ data: { organizationId, opportunityType: 'PRODUCT_SALES', title: 'Secret commercial title', slug: randomUUID(), summary: 'Secret summary', description: 'Secret owner contact', galleryImageUrls: [] } })
    const version = await db.opportunityVersion.create({ data: { opportunityId: opportunity.id, versionNumber: 1, title: 'Toyota Harrier', description: 'TZS 45,000,000. SECRET OWNER PHONE', termsHash: createHash('sha256').update(terms).digest('hex'), termsAndConditions: terms, rewardSummary: 'Verified payment', rewardRules: { create: { rewardType: 'FIXED_COMMISSION', amountMinor: 90000000n, description: 'Verified outcome' } } } })
    await db.opportunity.update({ where: { id: opportunity.id }, data: { publishedVersionId: version.id } })
    const deal = await db.hotDeal.create({ data: { opportunityId: opportunity.id, teaserTitle: 'Toyota Harrier — One Unit', category: units === 1 ? 'Vehicle Sale' : 'Rental Opportunity', location: 'Dar es Salaam', status: 'PRIVATE_HOT_DEAL', ownerEvidenceFileId: evidenceId, verifiedAt: new Date(), maximumPartnerSlots: slots, availablePartnerSlots: slots, inventoryTotal: units, inventoryAvailable: units, rewardBudget: 90000000n * BigInt(units), rewardRemaining: 90000000n * BigInt(units), rewardPerVerifiedOutcome: 90000000n, dealCapacityType: units === 1 ? 'ONE_UNIT' : 'MULTI_UNIT', ...dates(new Date(Date.now() - (released ? 86400001 : 1000))) } })
    const payment = await db.paymentAttempt.create({ data: { userId: admin.id, purpose: 'REWARD_FUNDING', amountMinor: deal.rewardBudget, provider: 'TEST_ONLY', providerReference: randomUUID(), idempotencyKey: randomUUID(), status: 'SUCCESSFUL' } })
    await db.hotDealFunding.create({ data: { dealId: deal.id, paymentAttemptId: payment.id, amountMinor: deal.rewardBudget } })
    return { deal, version }
  }

  it('enforces private access and allows released Partners', async () => {
    const { deal } = await fixture()
    await expect(dealDetails(deal.id, privateUser.id)).resolves.toHaveProperty('title', 'Toyota Harrier — One Unit')
    await expect(dealDetails(deal.id, partner.id)).rejects.toThrow('Private Member')
    const released = await fixture(1, 5, true)
    await expect(dealDetails(released.deal.id, partner.id)).resolves.toHaveProperty('status', 'PARTNER_RELEASE')
  }, 60000)

  it('requires current agreements and creates one participation on repeated activation', async () => {
    const { deal, version } = await fixture()
    await expect(dealDetails(deal.id, privateUser.id, true)).rejects.toThrow('Accept')
    const one = await activate(deal.id, privateUser, version.id, version.termsHash)
    expect(await activate(deal.id, privateUser, version.id, version.termsHash)).toEqual(one)
    expect(await db.dealParticipation.count({ where: { opportunityId: deal.opportunityId } })).toBe(1)
    expect(await db.participationAgreementAcceptance.count({ where: { participationId: one.participationId } })).toBe(1)
    expect((await db.hotDeal.findUniqueOrThrow({ where: { id: deal.id } })).inventoryAvailable).toBe(1)
    await expect(db.participationAgreementAcceptance.updateMany({ where: { participationId: one.participationId }, data: { termsHash: 'tampered' } })).rejects.toThrow()
    await expect(db.opportunityVersion.update({ where: { id: version.id }, data: { termsAndConditions: 'tampered' } })).rejects.toThrow()
  }, 60000)

  it('serializes concurrent activation at the last partner slot', async () => {
    const { deal, version } = await fixture(1, 1)
    const results = await Promise.allSettled([privateUser, other].map(user => activate(deal.id, user, version.id, version.termsHash)))
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
    expect((await db.hotDeal.findUniqueOrThrow({ where: { id: deal.id } })).availablePartnerSlots).toBe(0)
  }, 60000)

  it('retries serialization conflicts when both partners have available slots', async () => {
    const { deal, version } = await fixture(1, 2)
    const results = await Promise.all([privateUser, other].map(user => activate(deal.id, user, version.id, version.termsHash)))
    expect(results).toHaveLength(2)
    expect((await db.hotDeal.findUniqueOrThrow({ where: { id: deal.id } })).availablePartnerSlots).toBe(0)
  }, 60000)

  it('prevents expired users activating new deals', async () => {
    const { deal, version } = await fixture()
    await db.userSubscription.updateMany({ where: { userId: other.id }, data: { expiresAt: new Date(Date.now() - 1) } })
    await expect(activate(deal.id, other, version.id, version.termsHash)).rejects.toThrow()
    await db.userSubscription.updateMany({ where: { userId: other.id }, data: { expiresAt: new Date(Date.now() + 86400000) } })
  }, 60000)

  it('allocates only one reward under concurrent car conversions and preserves attribution', async () => {
    const { deal, version } = await fixture()
    await activate(deal.id, privateUser, version.id, version.termsHash)
    await activate(deal.id, other, version.id, version.termsHash)
    const first = await registerLead(deal.id, privateUser, { customerName: 'Buyer one', customerPhone: '+255711111111', consent: true })
    await expect(registerLead(deal.id, other, { customerName: 'Buyer one', customerPhone: '+255711111111', consent: true })).rejects.toThrow('already')
    const second = await registerLead(deal.id, other, { customerName: 'Buyer two', customerPhone: '+255722222222', consent: true })
    const validate = (claimId: string) => validateOutcome(deal.id, admin, { claimId, paymentReference: randomUUID(), evidenceFileIds: [evidenceId], valueMinor: 4500000000n, paymentConfirmed: true, signedAgreementConfirmed: true, reason: 'Objective bank payment and delivery checked', fraudChecks: { duplicateCustomer: true, selfReferral: true, devicesAndPatterns: true, collusion: true, documents: true, merchantConfirmed: true } })
    const results = await Promise.allSettled([validate(first.id), validate(second.id)])
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
    const updated = await db.hotDeal.findUniqueOrThrow({ where: { id: deal.id } })
    expect(updated.status).toBe('FULL'); expect(updated.inventoryAvailable).toBe(0); expect(updated.rewardRemaining).toBe(0n)
    expect(await db.reward.count({ where: { conversion: { opportunityId: deal.opportunityId } } })).toBe(1)
    await expect(db.hotDealClaim.update({ where: { id: first.id }, data: { customerHash: 'tampered' } })).rejects.toThrow()
    await expect(db.hotDeal.update({ where: { id: deal.id }, data: { inventoryAvailable: -1 } })).rejects.toThrow()
    await expect(db.auditLog.deleteMany({ where: { entityType: 'HotDeal', entityId: deal.id } })).rejects.toThrow()
  }, 60000)

  it('keeps closed, paused and sold-out deals private and makes worker replay idempotent', async () => {
    for (const status of ['FULL', 'PAUSED', 'CANCELLED', 'CLOSED'] as const) {
      const { deal } = await fixture(1, 5, true)
      await db.hotDeal.update({ where: { id: deal.id }, data: { status } })
      await processHotDeals()
      expect((await db.hotDeal.findUniqueOrThrow({ where: { id: deal.id } })).status).toBe(status)
    }
    await fixture(1, 5, true)
    await processHotDeals()
    const count = await db.notification.count()
    await processHotDeals()
    expect(await db.notification.count()).toBe(count)
  }, 60000)

  it('reduces ten apartments to seven and holds rewards through disputes and independent approval', async () => {
    const { deal, version } = await fixture(10)
    await activate(deal.id, privateUser, version.id, version.termsHash)
    let claimId = ''
    for (let i = 0; i < 3; i++) {
      const lead = await registerLead(deal.id, privateUser, { customerName: `Tenant ${i}`, customerPhone: `+25573333333${i}`, consent: true })
      claimId = lead.id
      await validateOutcome(deal.id, admin, { claimId, paymentReference: randomUUID(), evidenceFileIds: [evidenceId], valueMinor: 120000000n, paymentConfirmed: true, signedAgreementConfirmed: true, reason: 'Tenancy signed and required tenant payment verified', fraudChecks: { duplicateCustomer: true, selfReferral: true, devicesAndPatterns: true, collusion: true, documents: true, merchantConfirmed: true } })
    }
    const updated = await db.hotDeal.findUniqueOrThrow({ where: { id: deal.id } })
    expect(updated.inventoryAvailable).toBe(7)
    expect(updated.rewardRemaining).toBe(deal.rewardBudget - 270000000n)
    const approver = { ...admin, id: other.id }
    const approval = { claimId, taxWithheldMinor: 100n, platformFeeMinor: 100n, reason: 'Independent evidence and deductions review completed' }
    await expect(approveReward(deal.id, approver, approval)).rejects.toThrow('dispute period')
    await db.hotDealClaim.update({ where: { id: claimId }, data: { disputeUntil: new Date(Date.now() - 1) } })
    await disputeClaim(deal.id, privateUser, claimId, 'Tenant payment needs further review')
    await expect(approveReward(deal.id, approver, approval)).rejects.toThrow('dispute period')
    await disputeClaim(deal.id, admin, claimId, 'Payment confirmed with documentary evidence', true)
    await expect(approveReward(deal.id, admin, approval)).rejects.toThrow('second administrator')
    const approved = await approveReward(deal.id, approver, approval)
    expect(approved.status).toBe('PAYABLE')
    expect(await approveReward(deal.id, approver, approval)).toEqual(approved)
    expect(await db.journalEntry.count({ where: { sourceId: approved.rewardId } })).toBe(1)
    const method = await db.payoutMethod.create({ data: { userId: privateUser.id, provider: 'TEST_ONLY', accountNumber: 'test-destination', accountName: privateUser.name, isVerified: true, createdAt: new Date(Date.now() - 172800000), updatedAt: new Date(Date.now() - 172800000) } })
    const instruction = await createPayoutInstruction(deal.id, admin, claimId, method.id)
    expect(await createPayoutInstruction(deal.id, admin, claimId, method.id)).toEqual(instruction)
    const confirmed = { payoutId: instruction.payoutId, providerReference: randomUUID(), amountMinor: '89999800', status: 'PAID' as const }
    await expect(confirmPayout({ ...confirmed, amountMinor: '1' })).rejects.toThrow('mismatch')
    await confirmPayout(confirmed); await confirmPayout(confirmed)
    expect((await db.reward.findUniqueOrThrow({ where: { id: approved.rewardId } })).status).toBe('PAID')
    expect(await db.journalEntry.count({ where: { sourceId: instruction.payoutId } })).toBe(1)
  }, 60000)

  it('public APIs redact confidential data and direct document requests require current entitlements', async () => {
    const { deal, version } = await fixture()
    const response = await publicDeals()
    const body = await response.text()
    expect(body).not.toContain('SECRET OWNER PHONE')
    expect(body).not.toContain('ownerEvidenceFileId')
    const material = await db.hotDealMaterial.create({ data: { dealId: deal.id, fileId: evidenceId, label: 'Confidential owner document' } })
    const params = { params: Promise.resolve({ id: deal.id, documentId: material.id }) }
    expect((await documentDownload(new NextRequest('http://localhost/api/hot-deals/document'), params)).status).toBe(401)
    await activate(deal.id, privateUser, version.id, version.termsHash)
    const token = randomUUID()
    await db.session.create({ data: { userId: privateUser.id, token: sessionTokenHash(token), expiresAt: new Date(Date.now() + 3600000) } })
    await db.userSubscription.updateMany({ where: { userId: privateUser.id }, data: { expiresAt: new Date(Date.now() - 1) } })
    const expired = new NextRequest('http://localhost/api/hot-deals/document', { headers: { Cookie: `lumo_db_session=${token}` } })
    expect((await documentDownload(expired, params)).status).toBe(403)
    await db.userSubscription.updateMany({ where: { userId: privateUser.id }, data: { expiresAt: new Date(Date.now() + 86400000) } })
  }, 60000)
})
