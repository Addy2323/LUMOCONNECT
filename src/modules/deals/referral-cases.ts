import { ReferralCase, ReferralCaseStage, DirectRewardStatus } from './types'

export const LUMO_OFFICIAL_WHATSAPP = process.env.NEXT_PUBLIC_LUMO_WHATSAPP_NUMBER || '255775717501'

/**
 * Normalizes Tanzanian phone numbers to standard E.164 format (+2557XXXXXXXX or +2556XXXXXXXX).
 */
export function normalizeTanzanianPhone(input: string): string {
  const cleaned = input.replace(/[\s()\-+]/g, '')
  if (cleaned.startsWith('0')) {
    return `+255${cleaned.slice(1)}`
  }
  if (cleaned.startsWith('255')) {
    return `+${cleaned}`
  }
  if (cleaned.length === 9) {
    return `+255${cleaned}`
  }
  return `+${cleaned}`
}

/**
 * Validates whether a phone number matches Tanzanian mobile prefixes.
 */
export function isValidTanzanianPhone(phone: string): boolean {
  const normalized = normalizeTanzanianPhone(phone)
  return /^\+255[67]\d{8}$/.test(normalized)
}

/**
 * Masks a phone number for privacy display (e.g. +255 712 *** 678).
 */
export function maskPhone(phone: string): string {
  const normalized = normalizeTanzanianPhone(phone)
  if (normalized.length >= 13) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} *** ${normalized.slice(-3)}`
  }
  return phone
}

/**
 * Builds the official WhatsApp coordination URL carrying ONLY the reference and deal title (no customer PII).
 * Spec: "Hello Lumo, I am following up on referral LUMO-REF-000123 for [Deal Title]. Please assist with availability and the next steps."
 */
export function getWhatsAppCoordinationUrl(reference: string, dealTitle: string): string {
  const message = `Hello Lumo, I am following up on referral ${reference} for ${dealTitle}. Please assist with availability and the next steps.`
  const cleanNumber = LUMO_OFFICIAL_WHATSAPP.replace(/[^0-9]/g, '')
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
}

export interface SubmitReferralInput {
  dealId: string
  dealTitle: string
  dealSlug: string
  partnerUserId: string
  partnerName: string
  partnerPhone: string
  customerFirstName: string
  customerLastName: string
  customerPhone: string
  contactPermissionConfirmed: boolean
  additionalNotes?: string
  rewardAmountTZS?: number
  rewardDisplay?: string
}

// Initial seed cases for immediate rich UI experience
const INITIAL_REFERRAL_CASES: ReferralCase[] = [
  {
    id: 'case_001',
    reference: 'LUMO-REF-000121',
    dealId: 'deal_gold_vip_001',
    dealTitle: 'Toyota Land Cruiser Prado TX 2021 (Grade A Japan Direct Import)',
    dealSlug: 'toyota-land-cruiser-prado-tx-2021',
    partnerUserId: 'alex',
    partnerName: 'Alex Mwakasege',
    partnerPhone: '+255712345678',
    partnerPhoneMasked: '+255 712 *** 678',
    customerFirstName: 'Baraka',
    customerLastName: 'Mrema',
    customerPhone: '+255714902311',
    customerPhoneMasked: '+255 714 *** 311',
    contactPermissionConfirmed: true,
    additionalNotes: 'Customer is ready with full payment. Needs vehicle inspection in Mikocheni.',
    assignedCoordinator: 'Sarah (Lumo Coordination Desk)',
    stage: 'IN_PROGRESS',
    stageUpdatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    nextAction: 'Schedule inspection walkthrough with buyer & merchant',
    nextActionDueDate: 'Today, 4:00 PM',
    coordinatorNotes: 'Availability confirmed with merchant. Coordinating direct inspection.',
    partnerVisibleUpdate: 'Lumo confirmed vehicle availability with the supplier. Inspection scheduled.',
    rewardAmountTZS: 2500000,
    rewardDisplay: 'TZS 2,500,000 Flat Reward',
    rewardStatus: 'AWAITING_MERCHANT_PAYMENT',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'case_002',
    reference: 'LUMO-REF-000122',
    dealId: 'deal_gold_vip_002',
    dealTitle: 'Commercial Beachfront Villa 6-Bedroom - Oysterbay / Masaki',
    dealSlug: 'commercial-beachfront-villa-oysterbay',
    partnerUserId: 'alex',
    partnerName: 'Alex Mwakasege',
    partnerPhone: '+255712345678',
    partnerPhoneMasked: '+255 712 *** 678',
    customerFirstName: 'Amina',
    customerLastName: 'Al-Harthy',
    customerPhone: '+255755123984',
    customerPhoneMasked: '+255 755 *** 984',
    contactPermissionConfirmed: true,
    additionalNotes: 'Corporate tenant seeking 2-year lease. Payment via bank transfer.',
    assignedCoordinator: 'Kelvin (Lumo Real Estate Desk)',
    stage: 'AVAILABILITY_CONFIRMED',
    stageUpdatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    nextAction: 'Merchant to issue draft commercial lease directly to client',
    nextActionDueDate: 'Tomorrow, 10:00 AM',
    coordinatorNotes: 'Unit is vacant. Landlord accepts proposed commercial tenancy terms.',
    partnerVisibleUpdate: 'Merchant confirmed property availability. Lease introduction ongoing.',
    rewardAmountTZS: 4500000,
    rewardDisplay: 'TZS 4,500,000 Commission',
    rewardStatus: 'NOT_YET_EARNED',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'case_003',
    reference: 'LUMO-REF-000123',
    dealId: 'deal_gold_vip_003',
    dealTitle: 'Heavy Agricultural Tractor Massey Ferguson 375 4WD (75HP)',
    dealSlug: 'tractor-massey-ferguson-375-4wd',
    partnerUserId: 'alex',
    partnerName: 'Alex Mwakasege',
    partnerPhone: '+255712345678',
    partnerPhoneMasked: '+255 712 *** 678',
    customerFirstName: 'Joseph',
    customerLastName: 'Massawe',
    customerPhone: '+255788443322',
    customerPhoneMasked: '+255 788 *** 322',
    contactPermissionConfirmed: true,
    additionalNotes: 'Commercial farmer in Morogoro. Delivery needed to farm premises.',
    assignedCoordinator: 'Sarah (Lumo Coordination Desk)',
    stage: 'COMPLETED',
    stageUpdatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    nextAction: 'Confirm partner direct reward receipt',
    nextActionDueDate: 'Within 24 hours',
    coordinatorNotes: 'Customer paid merchant in full. Merchant reported direct reward disbursement.',
    partnerVisibleUpdate: 'Sale completed. Merchant reported payment of your referral reward.',
    rewardAmountTZS: 1850000,
    rewardDisplay: 'TZS 1,850,000 Flat Reward',
    rewardStatus: 'MERCHANT_REPORTS_PAID',
    merchantPaymentReportedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    merchantPaymentReference: 'MPESA-TX-2026-98842',
    merchantPaymentNotes: 'Transferred via Vodacom M-Pesa to partner registered phone.',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
]

let inMemoryCases: ReferralCase[] = [...INITIAL_REFERRAL_CASES]

function loadCasesFromStorage() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('lumo_referral_cases')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryCases = parsed
          return
        }
      }
    } catch (e) {
      console.warn('Could not load referral cases from storage', e)
    }
  }
}

function syncCasesToStorage() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('lumo_referral_cases', JSON.stringify(inMemoryCases))
      window.dispatchEvent(new Event('lumo:referral-cases-updated'))
    } catch (e) {
      console.warn('Could not sync referral cases to storage', e)
    }
  }
}

// Initial load
loadCasesFromStorage()

/**
 * Submits a new customer referral case according to Lumo Dealers Operating Model Section 5.
 */
export function submitCustomerReferral(input: SubmitReferralInput): {
  success: boolean
  message: string
  referralCase?: ReferralCase
} {
  loadCasesFromStorage()

  if (!input.customerFirstName.trim() || !input.customerLastName.trim()) {
    return { success: false, message: 'Customer first name and last name are required.' }
  }

  if (!input.customerPhone.trim()) {
    return { success: false, message: 'Customer mobile phone number is required.' }
  }

  if (!isValidTanzanianPhone(input.customerPhone)) {
    return {
      success: false,
      message: 'Please provide a valid Tanzanian mobile phone number (e.g. 07XXXXXXXX or +255XXXXXXXXX).',
    }
  }

  if (!input.contactPermissionConfirmed) {
    return {
      success: false,
      message: 'Confirmation of customer contact permission is mandatory.',
    }
  }

  const normalizedCustomerPhone = normalizeTanzanianPhone(input.customerPhone)
  const normalizedPartnerPhone = normalizeTanzanianPhone(input.partnerPhone)

  // Prevent self-referral
  if (normalizedCustomerPhone === normalizedPartnerPhone) {
    return {
      success: false,
      message: 'Self-referral is not permitted. You cannot submit your own phone number as a customer.',
    }
  }

  // Duplicate referral check per deal (Section 7)
  const existingDuplicate = inMemoryCases.find(
    (c) =>
      c.dealId === input.dealId &&
      c.customerPhone === normalizedCustomerPhone &&
      c.stage !== 'CLOSED'
  )

  if (existingDuplicate) {
    if (existingDuplicate.partnerUserId === input.partnerUserId) {
      return {
        success: false,
        message: `You have already submitted this customer for this deal (Reference: ${existingDuplicate.reference}).`,
      }
    }
    return {
      success: false,
      message: 'This customer has already been referred for this opportunity by another partner. First registered referral takes precedence.',
    }
  }

  // Generate unique reference (e.g. LUMO-REF-000124)
  const caseNumber = (inMemoryCases.length + 124).toString().padStart(6, '0')
  const reference = `LUMO-REF-${caseNumber}`

  const newCase: ReferralCase = {
    id: `case_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    reference,
    dealId: input.dealId,
    dealTitle: input.dealTitle,
    dealSlug: input.dealSlug,
    partnerUserId: input.partnerUserId,
    partnerName: input.partnerName,
    partnerPhone: input.partnerPhone,
    partnerPhoneMasked: maskPhone(input.partnerPhone),
    customerFirstName: input.customerFirstName.trim(),
    customerLastName: input.customerLastName.trim(),
    customerPhone: normalizedCustomerPhone,
    customerPhoneMasked: maskPhone(normalizedCustomerPhone),
    contactPermissionConfirmed: true,
    additionalNotes: input.additionalNotes?.trim() || undefined,
    assignedCoordinator: 'Sarah (Lumo Coordination Desk)',
    stage: 'SUBMITTED',
    stageUpdatedAt: new Date().toISOString(),
    nextAction: 'Lumo Coordinator to verify details and confirm availability with merchant',
    nextActionDueDate: 'Within 1 business day',
    coordinatorNotes: 'New referral submitted. Awaiting merchant availability confirmation.',
    partnerVisibleUpdate: 'Referral submitted. Lumo coordinator assigned to verify supplier availability.',
    rewardAmountTZS: input.rewardAmountTZS || 50000,
    rewardDisplay: input.rewardDisplay || 'TZS 50,000 Standard Reward',
    rewardStatus: 'NOT_YET_EARNED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  inMemoryCases = [newCase, ...inMemoryCases]
  syncCasesToStorage()

  return {
    success: true,
    message: `Your customer referral has been submitted successfully. Reference: ${reference}. Lumo will confirm availability and guide you through the next steps. Your deal is not yet completed.`,
    referralCase: newCase,
  }
}

/**
 * Returns all referral cases for a specific partner.
 */
export function listPartnerReferralCases(partnerUserId: string): ReferralCase[] {
  loadCasesFromStorage()
  return inMemoryCases.filter(
    (c) => c.partnerUserId === partnerUserId || partnerUserId === 'all' || !partnerUserId
  )
}

/**
 * Returns all referral cases for admin / coordinator desk.
 */
export function listAdminReferralCases(): ReferralCase[] {
  loadCasesFromStorage()
  return [...inMemoryCases]
}

/**
 * Updates the stage of a referral case (Admin / Coordinator action).
 */
export function updateReferralCaseStage(
  caseId: string,
  stage: ReferralCaseStage,
  details?: {
    assignedCoordinator?: string
    nextAction?: string
    nextActionDueDate?: string
    coordinatorNotes?: string
    partnerVisibleUpdate?: string
    closureReason?: 'UNAVAILABLE' | 'DUPLICATE' | 'CANCELLED' | 'UNSUCCESSFUL' | 'OTHER'
    rewardStatus?: DirectRewardStatus
  }
): boolean {
  loadCasesFromStorage()
  const target = inMemoryCases.find((c) => c.id === caseId || c.reference === caseId)
  if (!target) return false

  target.stage = stage
  target.stageUpdatedAt = new Date().toISOString()
  target.updatedAt = new Date().toISOString()

  if (details?.assignedCoordinator) target.assignedCoordinator = details.assignedCoordinator
  if (details?.nextAction) target.nextAction = details.nextAction
  if (details?.nextActionDueDate) target.nextActionDueDate = details.nextActionDueDate
  if (details?.coordinatorNotes) target.coordinatorNotes = details.coordinatorNotes
  if (details?.partnerVisibleUpdate) target.partnerVisibleUpdate = details.partnerVisibleUpdate
  if (details?.closureReason) target.closureReason = details.closureReason
  if (details?.rewardStatus) target.rewardStatus = details.rewardStatus

  syncCasesToStorage()
  return true
}

/**
 * Merchant reports direct payment of reward to partner.
 */
export function reportMerchantDirectPayment(
  caseId: string,
  report: {
    paymentReference?: string
    notes?: string
  }
): boolean {
  loadCasesFromStorage()
  const target = inMemoryCases.find((c) => c.id === caseId || c.reference === caseId)
  if (!target) return false

  target.rewardStatus = 'MERCHANT_REPORTS_PAID'
  target.merchantPaymentReportedAt = new Date().toISOString()
  target.merchantPaymentReference = report.paymentReference || `TX-REF-${Date.now().toString().slice(-6)}`
  target.merchantPaymentNotes = report.notes || 'Merchant marked direct payment as disbursed.'
  target.updatedAt = new Date().toISOString()
  target.partnerVisibleUpdate = 'Merchant reported direct payment of your referral reward. Please confirm receipt once received.'

  syncCasesToStorage()
  return true
}

/**
 * Partner confirms receipt of reward directly from merchant.
 */
export function confirmPartnerRewardReceipt(caseId: string, partnerUserId?: string): boolean {
  loadCasesFromStorage()
  const target = inMemoryCases.find((c) => c.id === caseId || c.reference === caseId)
  if (!target) return false

  target.rewardStatus = 'PARTNER_CONFIRMS_RECEIPT'
  target.partnerReceiptConfirmedAt = new Date().toISOString()
  target.updatedAt = new Date().toISOString()
  target.partnerVisibleUpdate = 'Reward receipt confirmed. Transaction successfully concluded.'

  syncCasesToStorage()
  return true
}

/**
 * Partner or Merchant raises a dispute regarding the referral reward.
 */
export function disputeReferralReward(caseId: string, reason: string): boolean {
  loadCasesFromStorage()
  const target = inMemoryCases.find((c) => c.id === caseId || c.reference === caseId)
  if (!target) return false

  target.rewardStatus = 'DISPUTED'
  target.disputeReason = reason
  target.disputedAt = new Date().toISOString()
  target.updatedAt = new Date().toISOString()
  target.coordinatorNotes = `Dispute raised: ${reason}. Escalated to Lumo Review Desk.`
  target.partnerVisibleUpdate = 'Dispute logged. Lumo administrator will review supporting records.'

  syncCasesToStorage()
  return true
}
