import { describe, expect, it, vi } from 'vitest'
import type { HotDeal, HotDealClaim, UserSubscription, User } from '@prisma/client'
import { calculateReleaseDates, isDealDueForPartnerRelease } from '@/modules/deals/deal-release.service'
import { isSubscriptionActive } from '@/modules/subscriptions/entitlement.service'
import { evaluateDealAccess } from '@/modules/deals/deal-access.service'
import { toPublicDealTeaser } from '@/modules/deals/deal.service'
import { hashTermsContent, validateTermsHash } from '@/modules/deals/deal-participation.service'
import { sanitizePhone, hashCustomerPhone } from '@/modules/referrals/referral.service'
import { evaluateFraudRisk } from '@/modules/risk/fraud.service'
import { postRewardJournalEntry } from '@/modules/rewards/reward-ledger.service'
import { approveCommercialReward, RewardLifecycleError } from '@/modules/rewards/reward.service'
import { createPayoutInstruction } from '@/modules/rewards/payout.service'
import { raiseClaimDispute, resolveClaimDispute } from '@/modules/risk/dispute.service'

describe('Commercial Operations & Hot Deals Architecture', () => {
  const startAt = new Date('2026-09-09T10:00:00Z')
  const baseDeal = {
    id: 'd1111111-1111-1111-1111-111111111111',
    opportunityId: 'o1111111-1111-1111-1111-111111111111',
    teaserTitle: 'Prime Commercial Property',
    teaserTitleSw: 'Mali ya Biashara',
    category: 'Real Estate',
    location: 'Dar es Salaam',
    status: 'PRIVATE_HOT_DEAL',
    visibilityStatus: 'PUBLIC_TEASER',
    privateAccessEnabled: true,
    generalPartnerAccessEnabled: true,
    ...calculateReleaseDates(startAt, 24),
    maximumPartnerSlots: 5,
    availablePartnerSlots: 5,
    dealCapacityType: 'ONE_UNIT',
    inventoryTotal: 1,
    inventoryAvailable: 1,
    reservedUnits: 0,
    rewardBudget: 100000000n,
    rewardRemaining: 100000000n,
    rewardPerVerifiedOutcome: 100000000n,
    disputeWindowHours: 72,
    verifiedAt: startAt,
    createdAt: startAt,
    updatedAt: startAt,
  } as HotDeal

  describe('Module 1: Private Hot Deals Engine', () => {
    it('calculates deterministic 24-hour server-side release window', () => {
      const dates = calculateReleaseDates(startAt, 24)
      expect(dates.partnerReleaseAt.getTime() - dates.privateAccessStartAt.getTime()).toBe(24 * 3600 * 1000)
      expect(dates.partnerReleaseAt.toISOString()).toBe('2026-09-10T10:00:00.000Z')
    })

    it('rejects invalid duration hours outside 1 to 168 range', () => {
      expect(() => calculateReleaseDates(startAt, 0)).toThrow()
      expect(() => calculateReleaseDates(startAt, 200)).toThrow()
    })

    it('isDealDueForPartnerRelease checks all capacity and time boundaries', () => {
      const beforeRelease = new Date(baseDeal.partnerReleaseAt!.getTime() - 1000)
      const afterRelease = new Date(baseDeal.partnerReleaseAt!.getTime() + 1000)

      // Before release window: not due
      expect(isDealDueForPartnerRelease(baseDeal, beforeRelease)).toBe(false)

      // After release window with available capacity: due
      expect(isDealDueForPartnerRelease(baseDeal, afterRelease)).toBe(true)

      // If inventory exhausted: not due
      expect(isDealDueForPartnerRelease({ ...baseDeal, inventoryAvailable: 0 }, afterRelease)).toBe(false)

      // If reward budget exhausted: not due
      expect(isDealDueForPartnerRelease({ ...baseDeal, rewardRemaining: 0n }, afterRelease)).toBe(false)
    })
  })

  describe('Module 2: Entitlement & Subscription Middleware', () => {
    it('evaluates active subscription strictly inside window', () => {
      const sub = {
        status: 'ACTIVE',
        startsAt: startAt,
        expiresAt: new Date(startAt.getTime() + 30 * 86400000),
        cancelledAt: null,
      }
      expect(isSubscriptionActive(sub, startAt)).toBe(true)
      expect(isSubscriptionActive(sub, new Date(startAt.getTime() - 1000))).toBe(false) // Before start
      expect(isSubscriptionActive(sub, new Date(startAt.getTime() + 31 * 86400000))).toBe(false) // Expired
      expect(isSubscriptionActive({ ...sub, cancelledAt: new Date() }, startAt)).toBe(false) // Cancelled
    })

    it('toPublicDealTeaser never leaks private merchant or contact data', () => {
      const leakedDeal = {
        ...baseDeal,
        ownerContact: '+255700123456',
        commissionSecret: 'TOP_SECRET',
        contractUrl: 'https://vault.lumo.internal/contracts/123.pdf',
      }
      const teaser = toPublicDealTeaser(leakedDeal as any)
      const json = JSON.stringify(teaser)
      expect(json).not.toContain('+255700123456')
      expect(json).not.toContain('TOP_SECRET')
      expect(json).not.toContain('vault.lumo.internal')
      expect(teaser.rewardMinor).toBe('100000000')
      expect(teaser.inventoryAvailable).toBe(1)
    })

    it('evaluateDealAccess correctly gates Private Member deal before release', async () => {
      const before = new Date(baseDeal.partnerReleaseAt!.getTime() - 1000)
      const after = new Date(baseDeal.partnerReleaseAt!.getTime() + 1000)

      const mockTx: any = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            const isPM = where.id === 'user-private-member'
            return Promise.resolve({
              id: where.id,
              accountStatus: 'ACTIVE',
              deletedAt: null,
              subscriptions: [
                {
                  status: 'ACTIVE',
                  startsAt: startAt,
                  expiresAt: new Date(startAt.getTime() + 30 * 86400000),
                  cancelledAt: null,
                  plan: {
                    isActive: true,
                    entitlements: [{ code: isPM ? 'PRIVATE_MEMBER' : 'PARTNER_SUBSCRIBER' }],
                  },
                },
              ],
            })
          }),
        },
      }

      // Private Member gets access before release
      const accessPM = await evaluateDealAccess(mockTx, baseDeal, 'user-private-member', before)
      expect(accessPM.canViewFullDetails).toBe(true)
      expect(accessPM.canActivate).toBe(true)

      // General Partner blocked before release
      const accessPartnerBefore = await evaluateDealAccess(mockTx, baseDeal, 'user-general-partner', before)
      expect(accessPartnerBefore.canViewFullDetails).toBe(false)
      expect(accessPartnerBefore.canActivate).toBe(false)
      expect(accessPartnerBefore.denialReason).toContain('Private Member early access')

      // General Partner allowed after release
      const accessPartnerAfter = await evaluateDealAccess(mockTx, baseDeal, 'user-general-partner', after)
      expect(accessPartnerAfter.canViewFullDetails).toBe(true)
      expect(accessPartnerAfter.canActivate).toBe(true)
    })
  })

  describe('Module 3: Deal Participation & Attribution Engine', () => {
    it('validates agreement terms SHA-256 hash', () => {
      const terms = 'Standard Lumo Partner Commercial Agreement Version 1.0. Zero tolerance for fraud.'
      const hash = hashTermsContent(terms)
      expect(hash).toHaveLength(64)
      expect(validateTermsHash(terms, hash)).toBe(true)
      expect(validateTermsHash('Tampered agreement terms text', hash)).toBe(false)
    })

    it('sanitizes Tanzanian phone numbers and creates deterministic identity hashes', () => {
      expect(sanitizePhone('0712 345 678')).toBe('+255712345678')
      expect(sanitizePhone('+255-754-000-111')).toBe('+255754000111')
      expect(sanitizePhone('0685999888')).toBe('+255685999888')

      const hash1 = hashCustomerPhone('+255712345678')
      const hash2 = hashCustomerPhone('0712 345 678')
      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64)
    })
  })

  describe('Module 4: Double-Entry Balanced Ledger Accounting', () => {
    it('posts balanced journal entries where Debit == Sum(Credits)', async () => {
      let createdJournal: any = null
      let createdEntries: any[] = []

      const mockTx: any = {
        ledgerAccount: {
          upsert: vi.fn().mockImplementation((args) =>
            Promise.resolve({ id: 'acc-' + args.where.accountCode, accountCode: args.where.accountCode })
          ),
        },
        journalEntry: {
          create: vi.fn().mockImplementation((args) => {
            createdJournal = args.data
            return Promise.resolve({ id: 'journal-uuid-1', ...args.data })
          }),
        },
        accountBalance: {
          upsert: vi.fn().mockResolvedValue({}),
        },
      }

      const gross = 100000000n // TZS 1,000,000
      const tax = 5000000n // TZS 50,000 (5% statutory withholding)
      const fee = 10000000n // TZS 100,000 (10% platform fee)
      const net = gross - tax - fee // TZS 850,000

      const result = await postRewardJournalEntry(mockTx, {
        rewardId: 'reward-uuid-1',
        grossAmountMinor: gross,
        netAmountMinor: net,
        taxWithheldMinor: tax,
        platformFeeMinor: fee,
        narration: 'Test commercial reward approval',
      })

      expect(result).toBe('journal-uuid-1')
      expect(createdJournal).toBeDefined()
      createdEntries = createdJournal.lines.create

      // Total Debits vs Total Credits verification
      let totalDebits = 0n
      let totalCredits = 0n

      for (const line of createdEntries) {
        totalDebits += line.debitMinor
        totalCredits += line.creditMinor
      }

      expect(totalDebits).toBe(gross)
      expect(totalCredits).toBe(net + tax + fee)
      expect(totalDebits).toBe(totalCredits) // DEBIT == CREDIT (Balanced!)
    })
  })

  describe('Module 5: Dual-Control Maker-Checker & Dispute Window', () => {
    it('rejects approval when Maker (validator) attempts to act as Checker (approver)', async () => {
      const adminMakerId = 'admin-user-1111'
      const adminCheckerId = adminMakerId // Violating dual-control!

      const mockClaim: any = {
        id: 'claim-1',
        dealId: baseDeal.id,
        disputed: false,
        fraudReviewedBy: adminMakerId, // Validator is adminMakerId
        disputeUntil: new Date(Date.now() - 3600000), // Dispute window passed
        conversion: {
          id: 'conv-1',
          rewards: [
            {
              id: 'reward-1',
              partnerUserId: 'partner-user-999',
              grossAmountMinor: 100000000n,
              status: 'VALIDATING',
            },
          ],
        },
      }

      const mockTx: any = {
        $queryRaw: vi.fn().mockResolvedValue([]),
        hotDealClaim: {
          findUniqueOrThrow: vi.fn().mockResolvedValue(mockClaim),
        },
      }

      await expect(
        approveCommercialReward(mockTx, {
          dealId: baseDeal.id,
          claimId: 'claim-1',
          approverUserId: adminCheckerId,
          taxWithheldMinor: 5000000n,
          platformFeeMinor: 10000000n,
          reason: 'Attempted self-approval',
        })
      ).rejects.toThrow(/Maker-Checker violation/)
    })

    it('rejects reward approval before the 72-hour dispute window has elapsed', async () => {
      const adminMakerId = 'admin-user-1111'
      const adminCheckerId = 'admin-user-2222'

      const mockClaim: any = {
        id: 'claim-1',
        dealId: baseDeal.id,
        disputed: false,
        fraudReviewedBy: adminMakerId,
        disputeUntil: new Date(Date.now() + 24 * 3600000), // 24h remaining in dispute window!
        conversion: {
          id: 'conv-1',
          rewards: [
            {
              id: 'reward-1',
              partnerUserId: 'partner-user-999',
              grossAmountMinor: 100000000n,
              status: 'VALIDATING',
            },
          ],
        },
      }

      const mockTx: any = {
        $queryRaw: vi.fn().mockResolvedValue([]),
        hotDealClaim: {
          findUniqueOrThrow: vi.fn().mockResolvedValue(mockClaim),
        },
      }

      await expect(
        approveCommercialReward(mockTx, {
          dealId: baseDeal.id,
          claimId: 'claim-1',
          approverUserId: adminCheckerId,
          taxWithheldMinor: 5000000n,
          platformFeeMinor: 10000000n,
          reason: 'Premature approval',
        })
      ).rejects.toThrow(/dispute window has not elapsed/)
    })

    it('enforces 24-hour hold on recently updated bank/wallet payout accounts', async () => {
      const partnerUserId = 'partner-user-999'
      const financeAdminUserId = 'finance-admin-888'
      const recentUpdate = new Date(Date.now() - 2 * 3600000) // Updated 2 hours ago (< 24h)

      const mockClaim: any = {
        id: 'claim-1',
        dealId: baseDeal.id,
        disputed: false,
        conversion: {
          id: 'conv-1',
          rewards: [
            {
              id: 'reward-1',
              partnerUserId,
              status: 'PAYABLE',
              grossAmountMinor: 100000000n,
              taxWithheldMinor: 5000000n,
              platformFeeMinor: 10000000n,
              netAmountMinor: 85000000n,
              approvedBy: 'checker-admin-333',
            },
          ],
        },
      }

      const mockTx: any = {
        $queryRaw: vi.fn().mockResolvedValue([]),
        hotDealClaim: {
          findUniqueOrThrow: vi.fn().mockResolvedValue(mockClaim),
        },
        payout: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        payoutMethod: {
          findUniqueOrThrow: vi.fn().mockResolvedValue({
            id: 'method-1',
            userId: partnerUserId,
            accountName: 'Baraka Mkuu',
            isVerified: true,
            currency: 'TZS',
            createdAt: recentUpdate,
            updatedAt: recentUpdate, // Recently updated!
            user: { id: partnerUserId, name: 'Baraka Mkuu' },
          }),
        },
      }

      await expect(
        createPayoutInstruction(mockTx, {
          dealId: baseDeal.id,
          claimId: 'claim-1',
          financeAdminUserId,
          payoutMethodId: 'method-1',
        })
      ).rejects.toThrow(/24 hours cannot receive disbursements/)
    })
  })

  describe('Module 6: Fraud Detection & Dispute Freezing', () => {
    it('detects partner self-referral by phone matching', async () => {
      const partnerUser = {
        id: 'partner-123',
        name: 'Amani Joseph',
        phone: '+255712000000',
      }

      const mockTx: any = {
        user: {
          findUnique: vi.fn().mockResolvedValue(partnerUser),
        },
        lead: {
          count: vi.fn().mockResolvedValue(0),
        },
        hotDeal: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      }

      const evaluation = await evaluateFraudRisk(mockTx, {
        dealId: baseDeal.id,
        partnerUserId: 'partner-123',
        customerPhone: '+255712000000', // Matches partner's own phone!
        customerName: 'Amani J.',
      })

      expect(evaluation.passed).toBe(false)
      expect(evaluation.flags).toContain('SELF_REFERRAL')
      expect(evaluation.reasons[0]).toContain('Customer phone number matches partner account phone')
    })

    it('freezes claim and opens dispute without deleting claim or rewards', async () => {
      let claimDisputedUpdated = false
      let disputeRecordCreated = false

      const mockClaim: any = {
        id: 'claim-999',
        dealId: baseDeal.id,
        participationId: 'part-999',
        disputed: false,
        disputeUntil: new Date(Date.now() + 48 * 3600000),
        deal: {
          id: baseDeal.id,
          teaserTitle: baseDeal.teaserTitle,
        },
      }

      const mockTx: any = {
        hotDealClaim: {
          findUnique: vi.fn().mockResolvedValue(mockClaim),
          update: vi.fn().mockImplementation((args) => {
            if (args.data.disputed === true) claimDisputedUpdated = true
            return Promise.resolve({ ...mockClaim, disputed: true })
          }),
        },
        dispute: {
          create: vi.fn().mockImplementation((args) => {
            disputeRecordCreated = true
            return Promise.resolve({ id: 'disp-1', ...args.data })
          }),
        },
        disputeEvidence: {
          create: vi.fn().mockResolvedValue({}),
        },
        disputeMessage: {
          create: vi.fn().mockResolvedValue({}),
        },
      }

      const outcome = await raiseClaimDispute(mockTx, {
        claimId: 'claim-999',
        raisedByUserId: 'merchant-admin-1',
        reason: 'Customer cancelled transaction before completion.',
      })

      expect(outcome.success).toBe(true)
      expect(claimDisputedUpdated).toBe(true)
      expect(disputeRecordCreated).toBe(true)
      expect(outcome.claim.disputed).toBe(true)
    })
  })
})
