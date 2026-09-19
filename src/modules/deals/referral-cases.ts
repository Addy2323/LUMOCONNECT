import { db } from '@/lib/db'
import { providers } from '@/lib/providers'
import { createPartnerPayoutRequest } from '@/modules/payouts/payout-store'
import {
  ReferralCase,
  ReferralCaseStage,
  DirectRewardStatus,
  ReferralSubmissionType,
  ReferralTicketStage,
  ReferralClosureReason,
  ReferralTicketDTO,
} from './types'

export const LUMO_OFFICIAL_WHATSAPP = process.env.NEXT_PUBLIC_LUMO_WHATSAPP_NUMBER || '255775717501'

/**
 * Extracts a numeric reward value in TZS from rewardAmountTZS or rewardDisplay string.
 */
export function extractNumericReward(
  rewardAmountTZS?: any,
  rewardDisplay?: string | null
): number {
  if (rewardAmountTZS !== undefined && rewardAmountTZS !== null) {
    const rawVal =
      typeof rewardAmountTZS === 'object' && rewardAmountTZS !== null && 'toNumber' in rewardAmountTZS
        ? (rewardAmountTZS as any).toNumber()
        : rewardAmountTZS
    const num = Number(rawVal)
    if (!isNaN(num) && num > 0) return num
  }
  if (!rewardDisplay) return 0

  const matchTZS = rewardDisplay.match(/TZS\s*([\d,]+(?:\.\d+)?)/i)
  if (matchTZS) {
    return parseFloat(matchTZS[1].replace(/,/g, ''))
  }

  const matchUSD = rewardDisplay.match(/USD\s*([\d,]+(?:\.\d+)?)/i)
  if (matchUSD) {
    return parseFloat(matchUSD[1].replace(/,/g, '')) * 2600
  }

  const numbers = rewardDisplay.match(/[\d,]+/g)
  if (numbers) {
    for (const raw of numbers) {
      const parsed = parseFloat(raw.replace(/,/g, ''))
      if (!isNaN(parsed) && parsed >= 1000) {
        return parsed
      }
    }
  }

  return 0
}

/**
 * Normalizes Tanzanian phone numbers to standard E.164 format (+2557XXXXXXXX or +2556XXXXXXXX).
 */
export function normalizeTanzanianPhone(input: string): string {
  if (!input) return ''
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
  if (!phone) return false
  const normalized = normalizeTanzanianPhone(phone)
  return /^\+255[67]\d{8}$/.test(normalized)
}

/**
 * Masks a phone number for privacy display (e.g. +255 712 *** 678).
 */
export function maskPhone(phone: string): string {
  if (!phone) return ''
  const normalized = normalizeTanzanianPhone(phone)
  if (normalized.length >= 13) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} *** ${normalized.slice(-3)}`
  }
  return phone
}

/**
 * Generates a unique ticket reference formatted as LUMO-REF-XXXXXX.
 */
export function generateTicketReference(prefix: 'LUMO-REF' | 'LUMO-CON' = 'LUMO-REF'): string {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `${prefix}-${num.toString().padStart(6, '0')}`
}

/**
 * Generates a unique Partner Customer Connection reference formatted as LUMO-CON-XXXXXX.
 */
export function generateConnectionReference(): string {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `LUMO-CON-${num.toString().padStart(6, '0')}`
}

/**
 * Builds the official WhatsApp coordination URL carrying ONLY the reference and deal title (zero customer PII).
 * Connects exclusively to the official Lumo WhatsApp contact.
 */
export function getWhatsAppCoordinationUrl(reference: string, dealTitle: string): string {
  const message = `Hello Lumo, I am following up on referral ${reference} for ${dealTitle}. Please assist with availability and the next steps.`
  const cleanNumber = LUMO_OFFICIAL_WHATSAPP.replace(/[^0-9]/g, '')
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
}

export interface CreateReferralTicketInput {
  dealId: string
  opportunityId?: string | null
  dealTitle: string
  dealSlug: string
  submissionType: ReferralSubmissionType | 'CUSTOMER_CONNECTION'
  partnerUserId: string
  promotionalCode?: string | null
  partnerName: string
  partnerPhone: string
  partnerWhatsApp: string
  // Extended Connection Details (60-Step Process)
  entityType?: 'INDIVIDUAL' | 'BUSINESS' | 'INSTITUTION' | 'GOVERNMENT' | 'ASSOCIATION' | 'OTHER' | string | null
  customerRole?: string | null
  companyName?: string | null
  contactPerson?: string | null
  customerCountry?: string | null
  customerRegion?: string | null
  customerCity?: string | null
  customerEmail?: string | null
  customerWebsite?: string | null
  relationshipWithCustomer?: string | null
  spokenToCustomer?: string | null
  customerInterestLevel?: string | null
  lumoMayContact?: string | null
  customerSuitability?: string | null
  relevantCapabilities?: string[] | null
  supportingDocuments?: string[] | null
  isDuplicatePotential?: boolean
  declarationAccepted?: boolean
  ticketPrefix?: 'LUMO-CON' | 'LUMO-REF'
  // Customer info (Only required for CUSTOMER_REFERRAL)
  customerFirstName?: string | null
  customerLastName?: string | null
  customerName?: string | null
  customerPhone?: string | null
  contactPermissionConfirmed?: boolean
  // Deal Requirement Details
  quantity?: number
  deliveryDestination?: string | null
  specifications?: string | null
  terminalOption?: string | null
  additionalNotes?: string | null
  // Terms & Merchant Privacy
  acceptedTermsVersion?: number
  merchantOrgId?: string | null
  merchantName?: string | null
  rewardAmountTZS?: number | null
  rewardDisplay?: string | null
  idempotencyKey?: string | null
}

export interface ReferralTicketResult {
  success: boolean
  message: string
  ticket?: ReferralTicketDTO
  errorCode?: 'INVALID_INPUT' | 'SELF_REFERRAL' | 'DUPLICATE_SUBMISSION' | 'SERVER_ERROR'
}

// In-memory fallback cache for dynamic tickets created during runtime
let inMemoryTickets: ReferralTicketDTO[] = []


/**
 * Strips all internal merchant details and coordinator private notes for partner-facing views.
 * Strictly guarantees that merchant identity, phone, or company name is never leaked.
 */
export function sanitizeTicketForPartner(ticket: ReferralTicketDTO): ReferralTicketDTO {
  return {
    ...ticket,
    merchantOrgId: null,
    merchantName: 'Published by Lumo Dealers',
    coordinatorNotes: null,
  }
}

/**
 * Preserves merchant details for admin desk views only.
 */
export function sanitizeTicketForAdmin(ticket: ReferralTicketDTO): ReferralTicketDTO {
  return {
    ...ticket,
  }
}

function mapPrismaTicketToDTO(raw: any): ReferralTicketDTO {
  let specMeta: any = null
  if (raw.specifications && typeof raw.specifications === 'string' && raw.specifications.trim().startsWith('{')) {
    try {
      specMeta = JSON.parse(raw.specifications)
    } catch {}
  }

  return {
    id: raw.id,
    ticketReference: raw.ticketReference,
    dealId: raw.dealId,
    opportunityId: raw.opportunityId ?? null,
    dealTitle: raw.dealTitle,
    dealSlug: raw.dealSlug,
    submissionType: raw.submissionType,
    partnerUserId: raw.partnerUserId,
    promotionalCode: raw.promotionalCode ?? null,
    partnerName: raw.partnerName,
    partnerPhone: raw.partnerPhone,
    partnerPhoneMasked: raw.partnerPhoneMasked || maskPhone(raw.partnerPhone),
    partnerWhatsApp: raw.partnerWhatsApp,
    partnerWhatsAppMasked: maskPhone(raw.partnerWhatsApp),
    customerFirstName: raw.customerFirstName ?? specMeta?.customerFirstName ?? null,
    customerLastName: raw.customerLastName ?? specMeta?.customerLastName ?? null,
    customerPhone: raw.customerPhone ?? specMeta?.customerPhone ?? null,
    customerPhoneMasked: raw.customerPhoneMasked ?? null,
    contactPermissionConfirmed: Boolean(raw.contactPermissionConfirmed ?? specMeta?.contactPermissionConfirmed),
    quantity: raw.quantity ?? 1,
    deliveryDestination: raw.deliveryDestination ?? null,
    specifications: specMeta ? (specMeta.specifications ?? null) : (raw.specifications ?? null),
    terminalOption: raw.terminalOption ?? null,
    additionalNotes: raw.additionalNotes ?? specMeta?.additionalNotes ?? null,
    acceptedTermsVersion: raw.acceptedTermsVersion ?? 1,
    stage: raw.stage,
    stageUpdatedAt: raw.stageUpdatedAt instanceof Date ? raw.stageUpdatedAt.toISOString() : String(raw.stageUpdatedAt),
    assignedCoordinator: raw.assignedCoordinator ?? 'Sarah (Lumo Coordination Desk)',
    nextAction: raw.nextAction ?? null,
    nextActionDueDate: raw.nextActionDueDate ?? null,
    partnerVisibleUpdate: raw.partnerVisibleUpdate ?? null,
    coordinatorNotes: raw.coordinatorNotes ?? null,
    closureReason: specMeta?.closureReason ?? raw.closureReason ?? null,
    requestedInfoNotes:
      raw.requestedInfoNotes ??
      specMeta?.requestedInfoNotes ??
      (raw.stage === 'MORE_INFO_REQUIRED' && raw.partnerVisibleUpdate?.startsWith('Information Required by LUMO: ')
        ? raw.partnerVisibleUpdate.replace('Information Required by LUMO: ', '').trim()
        : null),
    rejectionReasonNotes:
      raw.rejectionReasonNotes ??
      specMeta?.rejectionReasonNotes ??
      (raw.stage === 'REJECTED' && raw.partnerVisibleUpdate?.startsWith('Connection rejected: ')
        ? raw.partnerVisibleUpdate.replace('Connection rejected: ', '').trim()
        : null),
    payoutId: specMeta?.payoutId ?? null,
    payoutReference: specMeta?.payoutReference ?? null,
    rewardAmountTZS: raw.rewardAmountTZS ? Number(raw.rewardAmountTZS) : null,
    rewardDisplay: raw.rewardDisplay ?? null,
    rewardStatus: raw.rewardStatus ?? 'NOT_YET_EARNED',
    // Extended Connection Details (60-Step Process)
    entityType: raw.entityType ?? specMeta?.entityType ?? null,
    customerRole: raw.customerRole ?? specMeta?.customerRole ?? null,
    companyName: raw.companyName ?? specMeta?.companyName ?? null,
    contactPerson: raw.contactPerson ?? specMeta?.contactPerson ?? null,
    customerCountry: raw.customerCountry ?? specMeta?.customerCountry ?? null,
    customerRegion: raw.customerRegion ?? specMeta?.customerRegion ?? null,
    customerCity: raw.customerCity ?? specMeta?.customerCity ?? null,
    customerEmail: raw.customerEmail ?? specMeta?.customerEmail ?? null,
    customerWebsite: raw.customerWebsite ?? specMeta?.customerWebsite ?? null,
    relationshipWithCustomer: raw.relationshipWithCustomer ?? specMeta?.relationshipWithCustomer ?? null,
    spokenToCustomer: raw.spokenToCustomer ?? specMeta?.spokenToCustomer ?? null,
    customerInterestLevel: raw.customerInterestLevel ?? specMeta?.customerInterestLevel ?? null,
    lumoMayContact: raw.lumoMayContact ?? specMeta?.lumoMayContact ?? null,
    customerSuitability: raw.customerSuitability ?? specMeta?.customerSuitability ?? null,
    relevantCapabilities: raw.relevantCapabilities ?? specMeta?.relevantCapabilities ?? null,
    supportingDocuments: raw.supportingDocuments ?? specMeta?.supportingDocuments ?? null,
    isDuplicatePotential: Boolean(raw.isDuplicatePotential ?? specMeta?.isDuplicatePotential),
    declarationAccepted: Boolean(raw.declarationAccepted ?? specMeta?.declarationAccepted),
    merchantOrgId: raw.merchantOrgId ?? null,
    merchantName: raw.merchantName ?? null,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt),
  }
}

/**
 * Creates a new Referral or Coordination Ticket in the database.
 * Enforces strict validation, duplicate prevention, and authoritative partner identity.
 */
export async function createReferralTicket(input: CreateReferralTicketInput): Promise<ReferralTicketResult> {
  const isCustomerReferral = input.submissionType === 'CUSTOMER_REFERRAL' || input.submissionType === 'CUSTOMER_CONNECTION'

  // 1. Partner Validation
  if (!input.partnerUserId) {
    return {
      success: false,
      message: 'Partner identity could not be verified from active session.',
      errorCode: 'INVALID_INPUT',
    }
  }

  const normalizedPartnerPhone = normalizeTanzanianPhone(input.partnerPhone || '0775717501')
  const rawPartnerWhatsApp = input.partnerWhatsApp || input.partnerPhone || '0775717501'
  const normalizedPartnerWhatsApp = isValidTanzanianPhone(normalizeTanzanianPhone(rawPartnerWhatsApp))
    ? normalizeTanzanianPhone(rawPartnerWhatsApp)
    : '+255775717501'

  // 2. Validate Customer Referral specific constraints
  let normalizedCustomerPhone: string | null = null
  let finalCustomerFirstName: string | null = null
  let finalCustomerLastName: string | null = null

  if (isCustomerReferral) {
    const derivedFirst =
      input.customerFirstName?.trim() ||
      (input.contactPerson ? input.contactPerson.trim().split(/\s+/)[0] : '') ||
      (input.companyName ? input.companyName.trim().split(/\s+/)[0] : '') ||
      (input.customerName ? input.customerName.trim().split(/\s+/)[0] : '')

    const derivedLast =
      input.customerLastName?.trim() ||
      (input.contactPerson ? input.contactPerson.trim().split(/\s+/).slice(1).join(' ') : '') ||
      (input.companyName ? input.companyName.trim().split(/\s+/).slice(1).join(' ') : '') ||
      (input.customerName ? input.customerName.trim().split(/\s+/).slice(1).join(' ') : '') ||
      (input.entityType && input.entityType !== 'Individual' ? input.entityType : 'Contact')

    if (!derivedFirst) {
      return {
        success: false,
        message: 'Customer name or company contact person is required for connections and referrals.',
        errorCode: 'INVALID_INPUT',
      }
    }

    finalCustomerFirstName = derivedFirst
    finalCustomerLastName = derivedLast || 'Contact'

    if (!input.customerPhone?.trim()) {
      return {
        success: false,
        message: 'Customer mobile phone number is required.',
        errorCode: 'INVALID_INPUT',
      }
    }

    const isTanzanian = isValidTanzanianPhone(input.customerPhone)
    const cleanPhoneDigits = input.customerPhone.replace(/\D/g, '')
    const isInternational = cleanPhoneDigits.length >= 9 && cleanPhoneDigits.length <= 15

    if (!isTanzanian && !isInternational) {
      return {
        success: false,
        message: 'Please provide a valid mobile phone number for customer (at least 9-10 digits, e.g. 07XXXXXXXX or +255XXXXXXXXX).',
        errorCode: 'INVALID_INPUT',
      }
    }

    if (!input.contactPermissionConfirmed) {
      return {
        success: false,
        message: 'Explicit customer contact consent is required before submitting.',
        errorCode: 'INVALID_INPUT',
      }
    }

    normalizedCustomerPhone = isTanzanian
      ? normalizeTanzanianPhone(input.customerPhone)
      : input.customerPhone.trim()

    // Prevent self-referral
    if (normalizedCustomerPhone === normalizedPartnerPhone || normalizedCustomerPhone === normalizedPartnerWhatsApp) {
      return {
        success: false,
        message: 'Self-referral is not permitted. You cannot refer your own contact details as a customer.',
        errorCode: 'SELF_REFERRAL',
      }
    }
  }

  // 3. Check Idempotency Key
  if (input.idempotencyKey) {
    try {
      const existing = await db.referralTicket.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      })
      if (existing) {
        return {
          success: true,
          message: `Referral ticket already recorded (Reference: ${existing.ticketReference}).`,
          ticket: sanitizeTicketForPartner(mapPrismaTicketToDTO(existing)),
        }
      }
    } catch {
      // In-memory fallback check
      const memExisting = inMemoryTickets.find((t) => (t as any).idempotencyKey === input.idempotencyKey)
      if (memExisting) {
        return {
          success: true,
          message: `Referral ticket already recorded (Reference: ${memExisting.ticketReference}).`,
          ticket: sanitizeTicketForPartner(memExisting),
        }
      }
    }
  }

  // 4. Duplicate Check for Customer Referrals
  if (isCustomerReferral && normalizedCustomerPhone) {
    try {
      const existingDuplicate = await db.referralTicket.findFirst({
        where: {
          dealId: input.dealId,
          customerPhone: normalizedCustomerPhone,
          stage: { not: 'CLOSED' },
        },
      })

      if (existingDuplicate) {
        if (existingDuplicate.partnerUserId === input.partnerUserId) {
          return {
            success: false,
            message: `You have already submitted this customer for this deal (Reference: ${existingDuplicate.ticketReference}).`,
            errorCode: 'DUPLICATE_SUBMISSION',
          }
        }
        return {
          success: false,
          message: 'This Customer may already be associated with this opportunity. LUMO will review the attribution.',
          errorCode: 'DUPLICATE_SUBMISSION',
        }
      }
    } catch {
      // In-memory duplicate check
      const memDup = inMemoryTickets.find(
        (t) =>
          t.dealId === input.dealId &&
          t.customerPhone === normalizedCustomerPhone &&
          t.stage !== 'CLOSED'
      )
      if (memDup) {
        if (memDup.partnerUserId === input.partnerUserId) {
          return {
            success: false,
            message: `You have already submitted this customer for this deal (Reference: ${memDup.ticketReference}).`,
            errorCode: 'DUPLICATE_SUBMISSION',
          }
        }
        return {
          success: false,
          message: 'This Customer may already be associated with this opportunity. LUMO will review the attribution.',
          errorCode: 'DUPLICATE_SUBMISSION',
        }
      }
    }
  }

  // 5. Generate Reference and Prepare Data
  const isConnection = input.submissionType === 'CUSTOMER_CONNECTION' || input.ticketPrefix === 'LUMO-CON' || Boolean(input.entityType)
  const ticketReference = isConnection
    ? generateConnectionReference()
    : generateTicketReference(input.ticketPrefix || 'LUMO-REF')
  const partnerPhoneMasked = maskPhone(normalizedPartnerPhone)
  const customerPhoneMasked = normalizedCustomerPhone ? maskPhone(normalizedCustomerPhone) : null

  // Ensure internal merchant data and opportunity linkage are resolved
  let resolvedOpportunityId =
    input.opportunityId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.opportunityId)
      ? input.opportunityId
      : null
  let merchantOrgId = input.merchantOrgId || null
  let merchantName = input.merchantName || 'Internal Merchant Partner'

  try {
    const isDealIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.dealId)
    const matchedOpp = await db.opportunity.findFirst({
      where: {
        OR: [
          ...(resolvedOpportunityId ? [{ id: resolvedOpportunityId }] : []),
          { slug: input.dealSlug },
          { title: input.dealTitle },
          ...(isDealIdUuid ? [{ id: input.dealId }] : []),
        ],
      },
      include: { organization: true },
    })
    if (matchedOpp) {
      resolvedOpportunityId = matchedOpp.id
      if (!merchantOrgId && matchedOpp.organizationId) {
        merchantOrgId = matchedOpp.organizationId
      }
      if (merchantName === 'Internal Merchant Partner' && matchedOpp.organization?.legalName) {
        merchantName = matchedOpp.organization.legalName
      }
    }
  } catch (oppLookupErr) {}

  const parsedNumericReward = extractNumericReward(input.rewardAmountTZS, input.rewardDisplay)

  const successMessage = isConnection
    ? `Your Customer Connection has been submitted successfully and is awaiting LUMO review (Reference: ${ticketReference}).`
    : `Your referral ticket has been created successfully (Reference: ${ticketReference}). Lumo is reviewing availability.`

  const connectionMetadata = {
    entityType: input.entityType || null,
    customerRole: input.customerRole || null,
    companyName: input.companyName || null,
    contactPerson: input.contactPerson || null,
    customerCountry: input.customerCountry || 'Tanzania',
    customerRegion: input.customerRegion || null,
    customerCity: input.customerCity || null,
    customerEmail: input.customerEmail || null,
    customerWebsite: input.customerWebsite || null,
    relationshipWithCustomer: input.relationshipWithCustomer || null,
    spokenToCustomer: input.spokenToCustomer || null,
    customerInterestLevel: input.customerInterestLevel || null,
    lumoMayContact: input.lumoMayContact || null,
    customerSuitability: input.customerSuitability || null,
    relevantCapabilities: Array.isArray(input.relevantCapabilities) ? input.relevantCapabilities : [],
    supportingDocuments: Array.isArray(input.supportingDocuments) ? input.supportingDocuments : undefined,
    isDuplicatePotential: Boolean(input.isDuplicatePotential),
    declarationAccepted: Boolean(input.declarationAccepted),
  }

  // Specifications fallback preserves JSON metadata for any DB without the new columns yet
  const fallbackSpecifications = input.specifications?.trim()
    ? JSON.stringify({ ...connectionMetadata, specifications: input.specifications.trim() })
    : JSON.stringify(connectionMetadata)

  try {
    const created = await db.referralTicket.create({
      data: {
        ticketReference,
        dealId: input.dealId,
        opportunityId: resolvedOpportunityId,
        dealTitle: input.dealTitle,
        dealSlug: input.dealSlug,
        submissionType: (input.submissionType === 'CUSTOMER_CONNECTION' ? 'CUSTOMER_REFERRAL' : input.submissionType) as any,
        partnerUserId: input.partnerUserId,
        promotionalCode: input.promotionalCode || null,
        partnerName: input.partnerName,
        partnerPhone: normalizedPartnerPhone,
        partnerWhatsApp: normalizedPartnerWhatsApp,
        partnerPhoneMasked,
        customerFirstName: isCustomerReferral ? finalCustomerFirstName : null,
        customerLastName: isCustomerReferral ? finalCustomerLastName : null,
        customerPhone: normalizedCustomerPhone,
        customerPhoneMasked,
        contactPermissionConfirmed: isCustomerReferral ? Boolean(input.contactPermissionConfirmed) : false,
        quantity: input.quantity && input.quantity > 0 ? input.quantity : 1,
        deliveryDestination: input.deliveryDestination?.trim() || null,
        specifications: fallbackSpecifications,
        terminalOption: input.terminalOption?.trim() || null,
        additionalNotes: input.additionalNotes?.trim() || null,
        acceptedTermsVersion: input.acceptedTermsVersion || 1,
        merchantOrgId,
        merchantName,
        stage: 'SUBMITTED',
        assignedCoordinator: 'Sarah (Lumo Coordination Desk)',
        nextAction: 'Lumo Coordinator to verify details and confirm availability with merchant',
        nextActionDueDate: 'Within 1 business day',
        coordinatorNotes: isCustomerReferral
          ? 'New referral submitted. Awaiting merchant availability confirmation.'
          : 'Coordination enquiry logged. Verifying product specifications and dispatch timelines.',
        partnerVisibleUpdate: isCustomerReferral
          ? 'Referral ticket submitted. Lumo coordinator reviewing availability.'
          : 'Coordination enquiry submitted. Lumo coordinator reviewing specifications.',
        rewardAmountTZS: parsedNumericReward > 0 ? parsedNumericReward : (input.rewardAmountTZS ? Number(input.rewardAmountTZS) : null),
        rewardDisplay: input.rewardDisplay || null,
        rewardStatus: 'NOT_YET_EARNED',
        idempotencyKey: input.idempotencyKey || null,
        ...connectionMetadata,
      },
    })

    const dto = mapPrismaTicketToDTO(created)
    inMemoryTickets = [dto, ...inMemoryTickets]

    return {
      success: true,
      message: successMessage,
      ticket: sanitizeTicketForPartner(dto),
    }
  } catch (error: any) {
    // If DB has not yet applied the new column migration, retry without the new columns using fallbackSpecifications
    try {
      const legacyCreated = await db.referralTicket.create({
        data: {
          ticketReference,
          dealId: input.dealId,
          opportunityId: resolvedOpportunityId,
          dealTitle: input.dealTitle,
          dealSlug: input.dealSlug,
          submissionType: (input.submissionType === 'CUSTOMER_CONNECTION' ? 'CUSTOMER_REFERRAL' : input.submissionType) as any,
          partnerUserId: input.partnerUserId,
          promotionalCode: input.promotionalCode || null,
          partnerName: input.partnerName,
          partnerPhone: normalizedPartnerPhone,
          partnerWhatsApp: normalizedPartnerWhatsApp,
          partnerPhoneMasked,
          customerFirstName: isCustomerReferral ? finalCustomerFirstName : null,
          customerLastName: isCustomerReferral ? finalCustomerLastName : null,
          customerPhone: normalizedCustomerPhone,
          customerPhoneMasked,
          contactPermissionConfirmed: isCustomerReferral ? Boolean(input.contactPermissionConfirmed) : false,
          quantity: input.quantity && input.quantity > 0 ? input.quantity : 1,
          deliveryDestination: input.deliveryDestination?.trim() || null,
          specifications: fallbackSpecifications,
          terminalOption: input.terminalOption?.trim() || null,
          additionalNotes: input.additionalNotes?.trim() || null,
          acceptedTermsVersion: input.acceptedTermsVersion || 1,
          merchantOrgId,
          merchantName,
          stage: 'SUBMITTED',
          assignedCoordinator: 'Sarah (Lumo Coordination Desk)',
          nextAction: 'Lumo Coordinator to verify details and confirm availability with merchant',
          nextActionDueDate: 'Within 1 business day',
          coordinatorNotes: isCustomerReferral
            ? 'New referral submitted. Awaiting merchant availability confirmation.'
            : 'Coordination enquiry logged. Verifying product specifications and dispatch timelines.',
          partnerVisibleUpdate: isCustomerReferral
            ? 'Referral ticket submitted. Lumo coordinator reviewing availability.'
            : 'Coordination enquiry submitted. Lumo coordinator reviewing specifications.',
          rewardAmountTZS: parsedNumericReward > 0 ? parsedNumericReward : (input.rewardAmountTZS ? Number(input.rewardAmountTZS) : null),
          rewardDisplay: input.rewardDisplay || null,
          rewardStatus: 'NOT_YET_EARNED',
          idempotencyKey: input.idempotencyKey || null,
        } as any,
      })

      const dto = mapPrismaTicketToDTO(legacyCreated)
      inMemoryTickets = [dto, ...inMemoryTickets]

      return {
        success: true,
        message: successMessage,
        ticket: sanitizeTicketForPartner(dto),
      }
    } catch (fallbackErr: any) {
      console.warn('Database referral ticket creation fallback to in-memory store:', fallbackErr?.message || error?.message || error)
    }

    // Create in in-memory fallback
    const memTicket: ReferralTicketDTO = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ticketReference,
      dealId: input.dealId,
      opportunityId: input.opportunityId ?? null,
      dealTitle: input.dealTitle,
      dealSlug: input.dealSlug,
      submissionType: input.submissionType as any,
      partnerUserId: input.partnerUserId,
      promotionalCode: input.promotionalCode || null,
      partnerName: input.partnerName,
      partnerPhone: normalizedPartnerPhone,
      partnerPhoneMasked,
      partnerWhatsApp: normalizedPartnerWhatsApp,
      partnerWhatsAppMasked: maskPhone(normalizedPartnerWhatsApp),
      entityType: input.entityType || null,
      customerRole: input.customerRole || null,
      companyName: input.companyName || null,
      contactPerson: input.contactPerson || null,
      customerCountry: input.customerCountry || 'Tanzania',
      customerRegion: input.customerRegion || null,
      customerCity: input.customerCity || null,
      customerEmail: input.customerEmail || null,
      customerWebsite: input.customerWebsite || null,
      relationshipWithCustomer: input.relationshipWithCustomer || null,
      spokenToCustomer: input.spokenToCustomer || null,
      customerInterestLevel: input.customerInterestLevel || null,
      lumoMayContact: input.lumoMayContact || null,
      customerSuitability: input.customerSuitability || null,
      relevantCapabilities: input.relevantCapabilities || null,
      supportingDocuments: input.supportingDocuments || null,
      isDuplicatePotential: Boolean(input.isDuplicatePotential),
      declarationAccepted: Boolean(input.declarationAccepted),
      customerFirstName: isCustomerReferral ? finalCustomerFirstName : null,
      customerLastName: isCustomerReferral ? finalCustomerLastName : null,
      customerPhone: normalizedCustomerPhone,
      customerPhoneMasked,
      contactPermissionConfirmed: isCustomerReferral ? Boolean(input.contactPermissionConfirmed) : false,
      quantity: input.quantity && input.quantity > 0 ? input.quantity : 1,
      deliveryDestination: input.deliveryDestination?.trim() || null,
      specifications: input.specifications?.trim() || null,
      terminalOption: input.terminalOption?.trim() || null,
      additionalNotes: input.additionalNotes?.trim() || null,
      acceptedTermsVersion: input.acceptedTermsVersion || 1,
      stage: 'SUBMITTED',
      stageUpdatedAt: new Date().toISOString(),
      assignedCoordinator: 'Sarah (Lumo Coordination Desk)',
      nextAction: 'Lumo Coordinator to verify details and confirm availability with merchant',
      nextActionDueDate: 'Within 1 business day',
      coordinatorNotes: isCustomerReferral
        ? 'New referral submitted. Awaiting merchant availability confirmation.'
        : 'Coordination enquiry logged. Verifying product specifications.',
      partnerVisibleUpdate: isCustomerReferral
        ? 'Referral ticket submitted. Lumo coordinator reviewing availability.'
        : 'Coordination enquiry submitted. Lumo coordinator reviewing specifications.',
      rewardAmountTZS: input.rewardAmountTZS || null,
      rewardDisplay: input.rewardDisplay || null,
      rewardStatus: 'NOT_YET_EARNED',
      merchantOrgId,
      merchantName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (input.idempotencyKey) {
      ;(memTicket as any).idempotencyKey = input.idempotencyKey
    }

    inMemoryTickets = [memTicket, ...inMemoryTickets]

    return {
      success: true,
      message: successMessage,
      ticket: sanitizeTicketForPartner(memTicket),
    }
  }
}

/**
 * Retrieves a single ticket by ID or Reference.
 * Sanitizes according to viewer role (partner vs admin).
 */
export async function getReferralTicket(
  idOrRef: string,
  options?: { forPartnerId?: string; isAdmin?: boolean }
): Promise<ReferralTicketDTO | null> {
  let ticket: ReferralTicketDTO | null = null

  try {
    const record = await db.referralTicket.findFirst({
      where: {
        OR: [{ id: idOrRef.length === 36 ? idOrRef : undefined }, { ticketReference: idOrRef }].filter(Boolean) as any,
      },
    })
    if (record) {
      ticket = mapPrismaTicketToDTO(record)
    }
  } catch {
    // Fallback in-memory
  }

  if (!ticket) {
    const mem = inMemoryTickets.find(
      (t) => t.id === idOrRef || t.ticketReference.toLowerCase() === idOrRef.toLowerCase()
    )
    if (mem) ticket = mem
  }

  if (!ticket) return null

  // Authorization check
  if (!options?.isAdmin && options?.forPartnerId && ticket.partnerUserId !== options.forPartnerId) {
    return null
  }

  return options?.isAdmin ? sanitizeTicketForAdmin(ticket) : sanitizeTicketForPartner(ticket)
}

/**
 * Lists all tickets belonging to an authenticated partner, with merchant data strictly stripped.
 */
export async function listPartnerReferralTickets(partnerUserId: string, partnerPhone?: string): Promise<ReferralTicketDTO[]> {
  if (!partnerUserId) return []

  const dbTickets: ReferralTicketDTO[] = []
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partnerUserId)
  if (process.env.DATABASE_URL?.trim() && isUuid) {
    try {
      const records = await db.referralTicket.findMany({
        where: {
          partnerUserId,
        },
        orderBy: { createdAt: 'desc' },
      })
      for (const r of records) {
        dbTickets.push(sanitizeTicketForPartner(mapPrismaTicketToDTO(r)))
      }
    } catch (err) {
      console.error('listPartnerReferralTickets DB error:', err)
    }
  }

  const memoryTickets = inMemoryTickets
    .filter((t) => t.partnerUserId === partnerUserId)
    .map(sanitizeTicketForPartner)

  const ticketMap = new Map<string, ReferralTicketDTO>()
  for (const t of memoryTickets) {
    ticketMap.set(t.id, t)
    if (t.ticketReference) ticketMap.set(t.ticketReference, t)
  }
  for (const t of dbTickets) {
    ticketMap.set(t.id, t)
    if (t.ticketReference) ticketMap.set(t.ticketReference, t)
  }

  return Array.from(new Set(ticketMap.values())).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * Lists all tickets for Admin Coordination Desk.
 * Allows searching by ticket reference, promotional code, or deal title, and filtering by stage/type.
 */
export async function listAdminReferralTickets(filters?: {
  query?: string
  stage?: ReferralTicketStage
  submissionType?: ReferralSubmissionType
}): Promise<ReferralTicketDTO[]> {
  try {
    const where: any = {}
    if (filters?.stage) where.stage = filters.stage
    if (filters?.submissionType) where.submissionType = filters.submissionType
    if (filters?.query) {
      const q = filters.query.trim()
      where.OR = [
        { ticketReference: { contains: q, mode: 'insensitive' } },
        { promotionalCode: { contains: q, mode: 'insensitive' } },
        { dealTitle: { contains: q, mode: 'insensitive' } },
        { partnerName: { contains: q, mode: 'insensitive' } },
        { customerFirstName: { contains: q, mode: 'insensitive' } },
        { customerLastName: { contains: q, mode: 'insensitive' } },
      ]
    }

    const records = await db.referralTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    if (records.length > 0) {
      return records.map(mapPrismaTicketToDTO)
    }
  } catch {
    // Fallback
  }

  let results = [...inMemoryTickets]
  if (filters?.stage) {
    results = results.filter((t) => t.stage === filters.stage)
  }
  if (filters?.submissionType) {
    results = results.filter((t) => t.submissionType === filters.submissionType)
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase()
    results = results.filter(
      (t) =>
        t.ticketReference.toLowerCase().includes(q) ||
        (t.promotionalCode && t.promotionalCode.toLowerCase().includes(q)) ||
        t.dealTitle.toLowerCase().includes(q) ||
        t.partnerName.toLowerCase().includes(q) ||
        (t.customerFirstName && t.customerFirstName.toLowerCase().includes(q)) ||
        (t.customerLastName && t.customerLastName.toLowerCase().includes(q))
    )
  }

  return results.map(sanitizeTicketForAdmin)
}

/**
 * Updates stage and coordinator details of a ticket (Admin action).
 */
export async function updateReferralTicketStage(
  idOrRef: string,
  stage: ReferralTicketStage,
  details?: {
    assignedCoordinator?: string
    nextAction?: string
    nextActionDueDate?: string
    coordinatorNotes?: string
    partnerVisibleUpdate?: string
    closureReason?: ReferralClosureReason | string
    rewardStatus?: string
    requestedInfoNotes?: string
    rejectionReasonNotes?: string
    partnerResubmissionNotes?: string
    customerEmail?: string
    customerPhone?: string
    relationshipWithCustomer?: string
    payoutId?: string
    payoutReference?: string
  }
): Promise<boolean> {
  const stageUpdatedAt = new Date()

  // Determine inferred rewardStatus based on stage if not explicitly passed
  let inferredRewardStatus = details?.rewardStatus
  if (!inferredRewardStatus) {
    if (stage === 'REWARD_PAID') {
      inferredRewardStatus = 'PAID'
    } else if (stage === 'REWARD_APPROVED') {
      inferredRewardStatus = 'APPROVED'
    } else if (stage === 'REWARD_PENDING') {
      inferredRewardStatus = 'PENDING'
    } else if (stage === 'SUCCESSFUL') {
      inferredRewardStatus = 'APPROVED'
    } else if (stage === 'COMPLETED') {
      inferredRewardStatus = 'PARTNER_CONFIRMS_RECEIPT'
    }
  }

  let effectiveRewardAmount = 0

  // Standardize notes and messages for info requests, rejections, resubmission, and payout requests
  let effectivePartnerVisibleUpdate = details?.partnerVisibleUpdate
  let effectiveCoordinatorNotes = details?.coordinatorNotes

  if (stage === 'MORE_INFO_REQUIRED' && details?.requestedInfoNotes) {
    if (!effectivePartnerVisibleUpdate) {
      effectivePartnerVisibleUpdate = `Information Required by LUMO: ${details.requestedInfoNotes}`
    }
    if (!effectiveCoordinatorNotes) {
      effectiveCoordinatorNotes = `Admin requested additional info: ${details.requestedInfoNotes}`
    }
  } else if (stage === 'REJECTED' && details?.rejectionReasonNotes) {
    if (!effectivePartnerVisibleUpdate) {
      effectivePartnerVisibleUpdate = `Connection rejected: ${details.rejectionReasonNotes}`
    }
    if (!effectiveCoordinatorNotes) {
      effectiveCoordinatorNotes = `Connection rejected (${details.closureReason || 'OTHER'}): ${details.rejectionReasonNotes}`
    }
  } else if (details?.partnerResubmissionNotes) {
    if (!effectivePartnerVisibleUpdate) {
      effectivePartnerVisibleUpdate = `Additional information submitted by Partner. Under review by LUMO Desk.`
    }
    if (!effectiveCoordinatorNotes) {
      effectiveCoordinatorNotes = `Partner provided requested information: "${details.partnerResubmissionNotes}". Ready for review.`
    }
  } else if (stage === 'REWARD_PENDING') {
    if (!effectivePartnerVisibleUpdate) {
      effectivePartnerVisibleUpdate = details?.payoutReference
        ? `Payout request submitted (${details.payoutReference}). Awaiting LUMO Finance verification & disbursal.`
        : `Payout request submitted. Awaiting LUMO Finance verification & disbursal.`
    }
    if (!effectiveCoordinatorNotes) {
      effectiveCoordinatorNotes = details?.payoutReference
        ? `Partner requested reward payout (${details.payoutReference}). Queued for disbursal.`
        : `Partner requested reward payout. Queued for disbursal.`
    }
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrRef)
    const existingTicket = await db.referralTicket.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: idOrRef }] : []),
          { ticketReference: idOrRef },
          { id: idOrRef },
        ],
      },
    })

    if (existingTicket) {
      // Calculate reward amount if missing
      effectiveRewardAmount = extractNumericReward(existingTicket.rewardAmountTZS, existingTicket.rewardDisplay)

      // Resolve opportunity & merchant linkage if missing
      let resolvedOpportunityId = existingTicket.opportunityId
      let resolvedMerchantOrgId = existingTicket.merchantOrgId
      let resolvedMerchantName = existingTicket.merchantName

      try {
        const isDealIdUuid = existingTicket.dealId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingTicket.dealId)
        const matchedOpp = await db.opportunity.findFirst({
          where: {
            OR: [
              ...(resolvedOpportunityId ? [{ id: resolvedOpportunityId }] : []),
              { slug: existingTicket.dealSlug },
              { title: existingTicket.dealTitle },
              ...(isDealIdUuid ? [{ id: existingTicket.dealId }] : []),
            ],
          },
          include: { organization: true, publishedVersion: true },
        })

        if (matchedOpp) {
          if (!resolvedOpportunityId) resolvedOpportunityId = matchedOpp.id
          if (!resolvedMerchantOrgId && matchedOpp.organizationId) resolvedMerchantOrgId = matchedOpp.organizationId
          if (!resolvedMerchantName && matchedOpp.organization?.legalName) resolvedMerchantName = matchedOpp.organization.legalName
          if (effectiveRewardAmount <= 0) {
            if (matchedOpp.fixedRewardAmountMinor) {
              effectiveRewardAmount = Number(matchedOpp.fixedRewardAmountMinor) / 100
            } else if (matchedOpp.publishedVersion?.rewardSummary) {
              effectiveRewardAmount = extractNumericReward(null, matchedOpp.publishedVersion.rewardSummary)
            }
          }
        }
      } catch (oppLookupErr) {
        console.warn('Opp lookup failed during ticket stage update:', oppLookupErr)
      }

      // Merge metadata into specifications JSON for resilient storage
      let updatedSpecifications: string | undefined = undefined
      try {
        let currentMeta: any = {}
        if (existingTicket.specifications && existingTicket.specifications.startsWith('{')) {
          currentMeta = JSON.parse(existingTicket.specifications)
        }
        if (details?.requestedInfoNotes !== undefined) {
          currentMeta.requestedInfoNotes = details.requestedInfoNotes
        }
        if (details?.rejectionReasonNotes !== undefined) {
          currentMeta.rejectionReasonNotes = details.rejectionReasonNotes
        }
        if (details?.closureReason !== undefined) {
          currentMeta.closureReason = details.closureReason
        }
        if (details?.partnerResubmissionNotes !== undefined) {
          currentMeta.partnerResubmissionNotes = details.partnerResubmissionNotes
          currentMeta.requestedInfoNotes = null
        }
        if (details?.payoutId !== undefined) {
          currentMeta.payoutId = details.payoutId
        }
        if (details?.payoutReference !== undefined) {
          currentMeta.payoutReference = details.payoutReference
        }
        updatedSpecifications = JSON.stringify(currentMeta)
      } catch {}

      let updatedAdditionalNotes: string | undefined = undefined
      if (details?.partnerResubmissionNotes) {
        const timestamp = new Date().toLocaleDateString('en-GB')
        updatedAdditionalNotes = existingTicket.additionalNotes
          ? `${existingTicket.additionalNotes}\n\n[Partner Resubmission ${timestamp}]: ${details.partnerResubmissionNotes}`
          : `[Partner Resubmission ${timestamp}]: ${details.partnerResubmissionNotes}`
      }

      const validPrismaClosureReasons = ['UNAVAILABLE', 'DUPLICATE', 'CANCELLED', 'UNSUCCESSFUL', 'OTHER']
      let prismaClosureReason: any = undefined
      if (details?.closureReason) {
        if (validPrismaClosureReasons.includes(details.closureReason)) {
          prismaClosureReason = details.closureReason
        } else if (details.closureReason === 'CUSTOMER_NOT_INTERESTED' || details.closureReason === 'OUT_OF_SCOPE') {
          prismaClosureReason = 'UNSUCCESSFUL'
        } else if (details.closureReason === 'INVALID_CONTACT') {
          prismaClosureReason = 'UNAVAILABLE'
        } else {
          prismaClosureReason = 'OTHER'
        }
      }

      await db.referralTicket.update({
        where: { id: existingTicket.id },
        data: {
          stage: stage as any,
          stageUpdatedAt,
          ...(inferredRewardStatus ? { rewardStatus: inferredRewardStatus } : {}),
          ...(effectiveRewardAmount > 0 ? { rewardAmountTZS: effectiveRewardAmount } : {}),
          ...(resolvedOpportunityId ? { opportunityId: resolvedOpportunityId } : {}),
          ...(resolvedMerchantOrgId ? { merchantOrgId: resolvedMerchantOrgId } : {}),
          ...(resolvedMerchantName ? { merchantName: resolvedMerchantName } : {}),
          ...(details?.assignedCoordinator !== undefined ? { assignedCoordinator: details.assignedCoordinator } : {}),
          ...(details?.nextAction !== undefined ? { nextAction: details.nextAction } : {}),
          ...(details?.nextActionDueDate !== undefined ? { nextActionDueDate: details.nextActionDueDate } : {}),
          ...(effectiveCoordinatorNotes !== undefined ? { coordinatorNotes: effectiveCoordinatorNotes } : {}),
          ...(effectivePartnerVisibleUpdate !== undefined ? { partnerVisibleUpdate: effectivePartnerVisibleUpdate } : {}),
          ...(prismaClosureReason !== undefined ? { closureReason: prismaClosureReason } : {}),
          ...(updatedSpecifications ? { specifications: updatedSpecifications } : {}),
          ...(updatedAdditionalNotes ? { additionalNotes: updatedAdditionalNotes } : {}),
          ...(details?.customerEmail ? { customerEmail: details.customerEmail } : {}),
          ...(details?.customerPhone ? { customerPhone: details.customerPhone } : {}),
          ...(details?.relationshipWithCustomer ? { relationshipWithCustomer: details.relationshipWithCustomer } : {}),
        },
      })

      // If stage transitioned to REWARD_PAID, ensure a payout record is created/marked PAID and opportunity spent budget incremented
      if ((stage === 'REWARD_PAID' || inferredRewardStatus === 'PAID') && effectiveRewardAmount > 0) {
        if (resolvedOpportunityId) {
          try {
            await db.opportunity.update({
              where: { id: resolvedOpportunityId },
              data: {
                spentBudgetMinor: {
                  increment: BigInt(Math.round(effectiveRewardAmount * 100)),
                },
              },
            })
          } catch (budgetErr) {
            console.warn('Failed to increment spentBudgetMinor:', budgetErr)
          }
        }

        if (existingTicket.partnerUserId) {
          try {
            const { createPartnerPayoutRequest, updatePayoutStatus } = await import('@/modules/payouts/payout-store')
            const gross = effectiveRewardAmount
            const fee = Math.round(gross * 0.03)
            const tax = Math.round(gross * 0.05)
            const net = Math.max(0, gross - fee - tax)

            const payout = await createPartnerPayoutRequest({
              partnerUserId: existingTicket.partnerUserId,
              partnerName: existingTicket.partnerName || 'Partner',
              partnerPhone: existingTicket.partnerPhone || '—',
              payoutChannel: 'MOBILE_MONEY',
              accountNumber: existingTicket.partnerPhone || '—',
              grossAmountTZS: gross,
              platformFeeTZS: fee,
              taxWithheldTZS: tax,
              netAmountTZS: net,
              notes: `Disbursement for ${existingTicket.ticketReference} - ${existingTicket.dealTitle}`,
            })

            await updatePayoutStatus({
              payoutId: payout.id,
              action: 'DISBURSE',
              adminActor: details?.assignedCoordinator || 'Admin Coordination Desk',
              disbursalReference: `PAY-${existingTicket.ticketReference}`,
              notes: `Auto-disbursed upon REWARD_PAID stage transition.`,
            })
          } catch (payoutErr) {
            console.warn('Failed to auto-create payout for REWARD_PAID ticket:', payoutErr)
          }
        }
      }

      // Send In-App notification to the partner user
      if (existingTicket.partnerUserId) {
        try {
          const stageNames: Record<string, string> = {
            SUBMITTED: 'Submitted',
            UNDER_REVIEW: 'Under Review',
            MORE_INFO_REQUIRED: 'Action Needed: More Info Required',
            REJECTED: 'Connection Rejected',
            AVAILABILITY_CONFIRMED: 'Availability Confirmed',
            IN_PROGRESS: 'In Progress',
            COMPLETED: 'Completed',
            REWARD_PENDING: 'Reward Pending',
            REWARD_APPROVED: 'Reward Approved',
            REWARD_PAID: 'Reward Paid',
            CLOSED: 'Closed',
          }
          const stageLabel = stageNames[stage] || stage
          const updateTitle =
            stage === 'MORE_INFO_REQUIRED'
              ? 'LUMO: Additional Information Required'
              : stage === 'REJECTED'
              ? 'LUMO: Connection Not Approved'
              : `Referral Updated: ${stageLabel}`

          const updateText =
            effectivePartnerVisibleUpdate ||
            `Your referral (${existingTicket.ticketReference}) for "${existingTicket.dealTitle}" is now: ${stageLabel}. Next Action: ${details?.nextAction || 'Completed'}.`

          await db.notification.create({
            data: {
              userId: existingTicket.partnerUserId,
              channel: 'IN_APP',
              title: updateTitle,
              body: updateText,
              linkUrl: '/partner?tab=leads_referrals',
            },
          })
        } catch (notifError) {
          console.warn('Could not create notification for partner:', notifError)
        }
      }

      // If partner resubmitted information, alert the admin team
      if (details?.partnerResubmissionNotes) {
        try {
          const adminUser = await db.user.findFirst({
            where: { email: 'admin@lumo.co.tz' },
            select: { id: true },
          })
          if (adminUser) {
            await db.notification.create({
              data: {
                userId: adminUser.id,
                channel: 'IN_APP',
                title: 'Connection Info Resubmitted',
                body: `Partner ${existingTicket.partnerName} resubmitted requested information for connection ${existingTicket.ticketReference}.`,
                linkUrl: '/admin?tab=referrals',
              },
            })
          }
        } catch (adminNotifErr) {
          console.warn('Could not notify admin on partner resubmission:', adminNotifErr)
        }
      }

      // If partner phone exists, optionally dispatch SMS notification
      if (existingTicket.partnerPhone) {
        try {
          await providers.sms.sendSms({
            recipientPhone: existingTicket.partnerPhone,
            messageText: `[LUMO] Rufaa #${existingTicket.ticketReference} imeboreshwa: ${effectivePartnerVisibleUpdate || stage}. Ingia kwenye Lumo kufuatilia hatua inayofuata.`,
          })
        } catch (smsError) {
          console.warn('SMS alert failed (non-blocking):', smsError)
        }
      }
    } else {
      await db.referralTicket.updateMany({
        where: {
          OR: [{ id: idOrRef.length === 36 ? idOrRef : undefined }, { ticketReference: idOrRef }].filter(Boolean) as any,
        },
        data: {
          stage: stage as any,
          stageUpdatedAt,
          ...(inferredRewardStatus ? { rewardStatus: inferredRewardStatus } : {}),
          ...(details?.assignedCoordinator ? { assignedCoordinator: details.assignedCoordinator } : {}),
          ...(details?.nextAction ? { nextAction: details.nextAction } : {}),
          ...(details?.nextActionDueDate ? { nextActionDueDate: details.nextActionDueDate } : {}),
          ...(effectiveCoordinatorNotes ? { coordinatorNotes: effectiveCoordinatorNotes } : {}),
          ...(effectivePartnerVisibleUpdate ? { partnerVisibleUpdate: effectivePartnerVisibleUpdate } : {}),
          ...(details?.closureReason ? { closureReason: details.closureReason as any } : {}),
        },
      })
    }
  } catch (err) {
    console.error('updateReferralTicketStage db error:', err)
  }

  const target = inMemoryTickets.find(
    (t) => t.id === idOrRef || t.ticketReference.toLowerCase() === idOrRef.toLowerCase()
  )
  if (target) {
    target.stage = stage
    target.stageUpdatedAt = stageUpdatedAt.toISOString()
    target.updatedAt = stageUpdatedAt.toISOString()
    if (inferredRewardStatus) target.rewardStatus = inferredRewardStatus
    if (effectiveRewardAmount > 0) target.rewardAmountTZS = effectiveRewardAmount
    if (details?.assignedCoordinator) target.assignedCoordinator = details.assignedCoordinator
    if (details?.nextAction) target.nextAction = details.nextAction
    if (details?.nextActionDueDate) target.nextActionDueDate = details.nextActionDueDate
    if (effectiveCoordinatorNotes) target.coordinatorNotes = effectiveCoordinatorNotes
    if (effectivePartnerVisibleUpdate) target.partnerVisibleUpdate = effectivePartnerVisibleUpdate
    if (details?.closureReason) target.closureReason = details.closureReason
    if (details?.requestedInfoNotes !== undefined) target.requestedInfoNotes = details.requestedInfoNotes
    if (details?.rejectionReasonNotes !== undefined) target.rejectionReasonNotes = details.rejectionReasonNotes
    if (details?.partnerResubmissionNotes) {
      target.requestedInfoNotes = null
      target.additionalNotes = target.additionalNotes
        ? `${target.additionalNotes}\n\n[Partner Resubmission]: ${details.partnerResubmissionNotes}`
        : `[Partner Resubmission]: ${details.partnerResubmissionNotes}`
    }
    if (details?.customerEmail) target.customerEmail = details.customerEmail
    if (details?.customerPhone) target.customerPhone = details.customerPhone
    if (details?.relationshipWithCustomer) target.relationshipWithCustomer = details.relationshipWithCustomer

    if ((stage === 'REWARD_PAID' || inferredRewardStatus === 'PAID') && (target.rewardAmountTZS || 0) > 0) {
      try {
        const { createPartnerPayoutRequest, updatePayoutStatus } = await import('@/modules/payouts/payout-store')
        const gross = target.rewardAmountTZS || 0
        const fee = Math.round(gross * 0.03)
        const tax = Math.round(gross * 0.05)
        const net = Math.max(0, gross - fee - tax)

        const payout = await createPartnerPayoutRequest({
          partnerUserId: target.partnerUserId,
          partnerName: target.partnerName || 'Partner',
          partnerPhone: target.partnerPhone || '—',
          payoutChannel: 'MOBILE_MONEY',
          accountNumber: target.partnerPhone || '—',
          grossAmountTZS: gross,
          platformFeeTZS: fee,
          taxWithheldTZS: tax,
          netAmountTZS: net,
          notes: `Disbursement for ${target.ticketReference} - ${target.dealTitle}`,
        })

        await updatePayoutStatus({
          payoutId: payout.id,
          action: 'DISBURSE',
          adminActor: details?.assignedCoordinator || 'Admin Coordination Desk',
          disbursalReference: `PAY-${target.ticketReference}`,
          notes: `Auto-disbursed upon REWARD_PAID stage transition.`,
        })
      } catch (payoutErr) {
        console.warn('Memory payout creation fallback failed:', payoutErr)
      }
    }
  }

  return true
}

// ============================================================================
// BACKWARD COMPATIBILITY ADAPTERS FOR EXISTING CODE
// ============================================================================

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

export function submitCustomerReferral(input: SubmitReferralInput): {
  success: boolean
  message: string
  referralCase?: ReferralCase
} {
  const normalizedCustomerPhone = normalizeTanzanianPhone(input.customerPhone)
  const normalizedPartnerPhone = normalizeTanzanianPhone(input.partnerPhone)

  if (!input.customerFirstName.trim() || !input.customerLastName.trim()) {
    return { success: false, message: 'Customer first name and last name are required.' }
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

  if (normalizedCustomerPhone === normalizedPartnerPhone) {
    return {
      success: false,
      message: 'Self-referral is not permitted. You cannot submit your own phone number as a customer.',
    }
  }

  const existing = inMemoryTickets.find(
    (t) => t.dealId === input.dealId && t.customerPhone === normalizedCustomerPhone && t.stage !== 'CLOSED'
  )
  if (existing) {
    if (existing.partnerUserId === input.partnerUserId) {
      return {
        success: false,
        message: `You have already submitted this customer for this deal (Reference: ${existing.ticketReference}).`,
      }
    }
    return {
      success: false,
      message: 'This customer has already been referred for this opportunity by another partner. First registered referral takes precedence.',
    }
  }

  const ticketReference = generateTicketReference()
  const legacyCase: ReferralCase = {
    id: `case_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    reference: ticketReference,
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

  // Also add to inMemoryTickets
  inMemoryTickets = [
    {
      ...(legacyCase as any),
      ticketReference,
      submissionType: 'CUSTOMER_REFERRAL',
      quantity: 1,
      acceptedTermsVersion: 1,
      merchantName: 'Published by Lumo Dealers',
    },
    ...inMemoryTickets,
  ]

  return {
    success: true,
    message: `Your customer referral has been submitted successfully. Reference: ${ticketReference}. Lumo will confirm availability and guide you through the next steps. Your deal is not yet completed.`,
    referralCase: legacyCase,
  }
}

export function listPartnerReferralCases(partnerUserId: string): ReferralCase[] {
  return inMemoryTickets
    .filter((c) => c.partnerUserId === partnerUserId || partnerUserId === 'all' || !partnerUserId)
    .map((c) => ({
      id: c.id,
      reference: c.ticketReference,
      dealId: c.dealId,
      dealTitle: c.dealTitle,
      dealSlug: c.dealSlug,
      partnerUserId: c.partnerUserId,
      partnerName: c.partnerName,
      partnerPhone: c.partnerPhone || '',
      partnerPhoneMasked: c.partnerPhoneMasked,
      customerFirstName: c.customerFirstName || '',
      customerLastName: c.customerLastName || '',
      customerPhone: c.customerPhone || '',
      customerPhoneMasked: c.customerPhoneMasked || '',
      contactPermissionConfirmed: c.contactPermissionConfirmed,
      additionalNotes: c.additionalNotes || undefined,
      assignedCoordinator: c.assignedCoordinator || undefined,
      stage: c.stage,
      stageUpdatedAt: c.stageUpdatedAt,
      nextAction: c.nextAction || undefined,
      nextActionDueDate: c.nextActionDueDate || undefined,
      partnerVisibleUpdate: c.partnerVisibleUpdate || undefined,
      rewardAmountTZS: c.rewardAmountTZS || 0,
      rewardDisplay: c.rewardDisplay || 'Commercial Reward Direct from Merchant',
      rewardStatus: (c.rewardStatus as DirectRewardStatus) || 'NOT_YET_EARNED',
      merchantPaymentReportedAt: c.merchantPaymentReportedAt || undefined,
      merchantPaymentReference: c.merchantPaymentReference || undefined,
      merchantPaymentNotes: c.merchantPaymentNotes || undefined,
      partnerReceiptConfirmedAt: c.partnerReceiptConfirmedAt || undefined,
      disputeReason: c.disputeReason || undefined,
      disputedAt: c.disputedAt || undefined,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
}

export function listAdminReferralCases(): ReferralCase[] {
  return inMemoryTickets.map((c) => ({
    id: c.id,
    reference: c.ticketReference,
    dealId: c.dealId,
    dealTitle: c.dealTitle,
    dealSlug: c.dealSlug,
    partnerUserId: c.partnerUserId,
    partnerName: c.partnerName,
    partnerPhone: c.partnerPhone || '',
    partnerPhoneMasked: c.partnerPhoneMasked,
    customerFirstName: c.customerFirstName || '',
    customerLastName: c.customerLastName || '',
    customerPhone: c.customerPhone || '',
    customerPhoneMasked: c.customerPhoneMasked || '',
    contactPermissionConfirmed: c.contactPermissionConfirmed,
    additionalNotes: c.additionalNotes || undefined,
    assignedCoordinator: c.assignedCoordinator || undefined,
    stage: c.stage,
    stageUpdatedAt: c.stageUpdatedAt,
    nextAction: c.nextAction || undefined,
    nextActionDueDate: c.nextActionDueDate || undefined,
    coordinatorNotes: c.coordinatorNotes || undefined,
    partnerVisibleUpdate: c.partnerVisibleUpdate || undefined,
    closureReason: (c.closureReason as any) || undefined,
    rewardAmountTZS: c.rewardAmountTZS || 0,
    rewardDisplay: c.rewardDisplay || 'Commercial Reward Direct from Merchant',
    rewardStatus: (c.rewardStatus as DirectRewardStatus) || 'NOT_YET_EARNED',
    merchantPaymentReportedAt: c.merchantPaymentReportedAt || undefined,
    merchantPaymentReference: c.merchantPaymentReference || undefined,
    merchantPaymentNotes: c.merchantPaymentNotes || undefined,
    partnerReceiptConfirmedAt: c.partnerReceiptConfirmedAt || undefined,
    disputeReason: c.disputeReason || undefined,
    disputedAt: c.disputedAt || undefined,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }))
}

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
  // Synchronous in-memory update only (backward compat)
  const target = inMemoryTickets.find(
    (t) => t.id === caseId || t.ticketReference.toLowerCase() === caseId.toLowerCase()
  )
  if (!target) return false
  target.stage = stage as any
  target.stageUpdatedAt = new Date().toISOString()
  target.updatedAt = new Date().toISOString()
  if (details?.assignedCoordinator) target.assignedCoordinator = details.assignedCoordinator
  if (details?.nextAction) target.nextAction = details.nextAction
  if (details?.nextActionDueDate) target.nextActionDueDate = details.nextActionDueDate
  if (details?.coordinatorNotes) target.coordinatorNotes = details.coordinatorNotes
  if (details?.partnerVisibleUpdate) target.partnerVisibleUpdate = details.partnerVisibleUpdate
  if (details?.closureReason) target.closureReason = details.closureReason
  if (details?.rewardStatus) target.rewardStatus = details.rewardStatus
  return true
}

export function getReferralCaseByTrackingNumber(trackingRef: string): ReferralCase | null {
  const found = inMemoryTickets.find((c) => c.ticketReference.toLowerCase() === trackingRef.toLowerCase())
  if (!found) return null
  return {
    id: found.id,
    reference: found.ticketReference,
    dealId: found.dealId,
    dealTitle: found.dealTitle,
    dealSlug: found.dealSlug,
    partnerUserId: found.partnerUserId,
    partnerName: found.partnerName,
    partnerPhone: found.partnerPhone || '',
    partnerPhoneMasked: found.partnerPhoneMasked,
    customerFirstName: found.customerFirstName || '',
    customerLastName: found.customerLastName || '',
    customerPhone: found.customerPhone || '',
    customerPhoneMasked: found.customerPhoneMasked || '',
    contactPermissionConfirmed: found.contactPermissionConfirmed,
    additionalNotes: found.additionalNotes || undefined,
    assignedCoordinator: found.assignedCoordinator || undefined,
    stage: found.stage,
    stageUpdatedAt: found.stageUpdatedAt,
    nextAction: found.nextAction || undefined,
    nextActionDueDate: found.nextActionDueDate || undefined,
    partnerVisibleUpdate: found.partnerVisibleUpdate || undefined,
    rewardAmountTZS: found.rewardAmountTZS || 0,
    rewardDisplay: found.rewardDisplay || '',
    rewardStatus: (found.rewardStatus as DirectRewardStatus) || 'NOT_YET_EARNED',
    createdAt: found.createdAt,
    updatedAt: found.updatedAt,
  }
}

export function submitCustomerReferralEnquiry(input: {
  promoCode: string
  dealId: string
  dealSlug: string
  dealTitle: string
  customerName: string
  customerPhone: string
  customerRegion?: string
  notes?: string
}): {
  success: boolean
  message: string
  referralCase?: ReferralCase
} {
  const nameParts = input.customerName.trim().split(' ')
  const customerFirstName = nameParts[0] || 'Customer'
  const customerLastName = nameParts.slice(1).join(' ') || 'Enquirer'

  const parts = input.promoCode.split('-')
  const partnerCode = parts.length >= 2 ? parts[1] : 'partner'

  return submitCustomerReferral({
    dealId: input.dealId,
    dealTitle: input.dealTitle,
    dealSlug: input.dealSlug,
    partnerUserId: partnerCode,
    partnerName: `Partner ${partnerCode.toUpperCase()}`,
    partnerPhone: '+255700000000',
    customerFirstName,
    customerLastName,
    customerPhone: input.customerPhone,
    contactPermissionConfirmed: true,
    additionalNotes: input.notes,
  })
}

export function reportMerchantDirectPayment(
  caseId: string,
  report: { paymentReference?: string; notes?: string }
): boolean {
  const target = inMemoryTickets.find((c) => c.id === caseId || c.ticketReference === caseId)
  if (!target) return false
  target.rewardStatus = 'MERCHANT_REPORTS_PAID'
  target.merchantPaymentReportedAt = new Date().toISOString()
  target.merchantPaymentReference = report.paymentReference || `TX-REF-${Date.now().toString().slice(-6)}`
  target.merchantPaymentNotes = report.notes || 'Merchant marked direct payment as disbursed.'
  target.partnerVisibleUpdate =
    'Merchant reported direct payment of your referral reward. Please confirm receipt once received.'
  target.updatedAt = new Date().toISOString()
  return true
}

export function confirmPartnerRewardReceipt(caseId: string, _partnerUserId?: string): boolean {
  const target = inMemoryTickets.find((c) => c.id === caseId || c.ticketReference === caseId)
  if (!target) return false
  target.rewardStatus = 'PARTNER_CONFIRMS_RECEIPT'
  target.partnerReceiptConfirmedAt = new Date().toISOString()
  target.partnerVisibleUpdate = 'Reward receipt confirmed. Transaction successfully concluded.'
  target.updatedAt = new Date().toISOString()
  return true
}

export function disputeReferralReward(caseId: string, reason: string): boolean {
  const target = inMemoryTickets.find((c) => c.id === caseId || c.ticketReference === caseId)
  if (!target) return false
  target.rewardStatus = 'DISPUTED'
  target.disputeReason = reason
  target.disputedAt = new Date().toISOString()
  target.coordinatorNotes = `Dispute raised: ${reason}. Escalated to Lumo Review Desk.`
  target.partnerVisibleUpdate = 'Dispute logged. Lumo administrator will review supporting records.'
  target.updatedAt = new Date().toISOString()
  return true
}
