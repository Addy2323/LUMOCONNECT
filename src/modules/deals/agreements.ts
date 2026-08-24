/**
 * LUMO Electronic Deal Terms & Agreement Engine
 *
 * Generates immutable, SHA-256 hashed commercial terms agreements for opportunities.
 * Records electronic acceptance from Merchants (upon publishing) and Partners (upon joining).
 */

import crypto from 'node:crypto'
import { nanoid } from 'nanoid'

export interface DealAgreementTerms {
  opportunityId: string
  versionNumber: number
  title: string
  qualifyingResult: string
  customerPriceDisplay: string
  rewardAmountDisplay: string
  partnerResponsibilities: string[]
  merchantResponsibilities: string[]
  requiredEvidence: string[]
  attributionRules: {
    model: string
    windowDays: number
  }
  cancellationConditions: string
  payoutTimeline: string
  disputePeriodDays: number
  autoReleaseInspectionDays: number
  refundAndChargebackTreatment: string
}

export interface ElectronicAcceptanceRecord {
  id: string
  opportunityId: string
  versionNumber: number
  userId: string
  userRole: 'MERCHANT' | 'PARTNER'
  termsHash: string
  ipAddress: string
  userAgent?: string
  acceptedAt: Date
}

// In-memory acceptance records store
const acceptanceRecords: ElectronicAcceptanceRecord[] = []

/**
 * Computes canonical SHA-256 hash of agreement terms.
 */
export function computeTermsHash(terms: DealAgreementTerms): string {
  const canonicalString = JSON.stringify({
    opportunityId: terms.opportunityId,
    versionNumber: terms.versionNumber,
    title: terms.title,
    qualifyingResult: terms.qualifyingResult,
    customerPriceDisplay: terms.customerPriceDisplay,
    rewardAmountDisplay: terms.rewardAmountDisplay,
    attributionRules: terms.attributionRules,
    disputePeriodDays: terms.disputePeriodDays,
    autoReleaseInspectionDays: terms.autoReleaseInspectionDays,
  })

  return crypto.createHash('sha256').update(canonicalString).digest('hex')
}

/**
 * Generates default standard commercial agreement terms for an opportunity.
 */
export function generateDefaultAgreementTerms(params: {
  opportunityId: string
  versionNumber?: number
  title: string
  customerPriceDisplay?: string
  rewardAmountDisplay?: string
  attributionWindowDays?: number
}): DealAgreementTerms {
  return {
    opportunityId: params.opportunityId,
    versionNumber: params.versionNumber ?? 1,
    title: params.title,
    qualifyingResult: 'Customer completes authorized payment and product delivery/acceptance is verified.',
    customerPriceDisplay: params.customerPriceDisplay ?? 'TZS 100,000',
    rewardAmountDisplay: params.rewardAmountDisplay ?? 'TZS 10,000',
    partnerResponsibilities: [
      'Promote product honestly using designated LUMO referral links and promotional assets.',
      'Refrain from self-referral, fake lead generation, or spamming unsolicited bulk messages.',
      'Assist referred customers with genuine onboarding and product inquiries.',
    ],
    merchantResponsibilities: [
      'Fulfill orders promptly upon receipt of payment confirmation.',
      'Provide valid tracking numbers and upload signed delivery notes.',
      'Maintain adequate inventory and respond to customer questions within 24 hours.',
    ],
    requiredEvidence: [
      'Authorized payment gateway transaction receipt.',
      'Signed delivery confirmation note or digital dispatch tracking log.',
    ],
    attributionRules: {
      model: 'LAST_CLICK',
      windowDays: params.attributionWindowDays ?? 30,
    },
    cancellationConditions: 'Merchant may pause or cancel opportunity with 48 hours notice. Existing attributed referrals in progress remain protected.',
    payoutTimeline: 'Commissions transition to PAYABLE upon customer acceptance or expiration of the 7-day inspection window.',
    disputePeriodDays: 7,
    autoReleaseInspectionDays: 7,
    refundAndChargebackTreatment: 'In the event of an unfulfilled delivery or verified return, customer purchase funds are refunded and partner commission is cancelled.',
  }
}

/**
 * Records electronic acceptance of deal terms.
 */
export function recordTermsAcceptance(params: {
  opportunityId: string
  versionNumber: number
  userId: string
  userRole: 'MERCHANT' | 'PARTNER'
  termsHash: string
  ipAddress?: string
  userAgent?: string
}): ElectronicAcceptanceRecord {
  const record: ElectronicAcceptanceRecord = {
    id: `acc_${nanoid(16)}`,
    opportunityId: params.opportunityId,
    versionNumber: params.versionNumber,
    userId: params.userId,
    userRole: params.userRole,
    termsHash: params.termsHash,
    ipAddress: params.ipAddress ?? '127.0.0.1',
    userAgent: params.userAgent,
    acceptedAt: new Date(),
  }

  acceptanceRecords.push(record)
  return record
}

/**
 * Checks whether a user has accepted a specific deal version.
 */
export function getTermsAcceptance(opportunityId: string, userId: string, versionNumber: number): ElectronicAcceptanceRecord | undefined {
  return acceptanceRecords.find(
    (a) => a.opportunityId === opportunityId && a.userId === userId && a.versionNumber === versionNumber
  )
}
