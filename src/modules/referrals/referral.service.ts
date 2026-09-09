import { createHash } from 'crypto'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

export type Tx = Prisma.TransactionClient

export class ReferralError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message)
    this.name = 'ReferralError'
  }
}

export const leadRegistrationSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z
    .string()
    .transform((v) => v.replace(/[\s()-]/g, '').replace(/^0/, '+255'))
    .pipe(z.string().regex(/^\+255[67]\d{8}$/, 'Valid Tanzanian phone number (+255...) required')),
  customerEmail: z.string().email().optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Customer consent to be contacted is mandatory' }),
  }),
})

export type LeadRegistrationInput = z.infer<typeof leadRegistrationSchema>

/**
 * Sanitizes phone numbers to standard Tanzanian E.164 format (+255...).
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[\s()-]/g, '').replace(/^0/, '+255')
}

/**
 * Computes a secure hash of customer identity data using the server identity secret.
 */
export function hashCustomerPhone(phone: string): string {
  const normalized = sanitizePhone(phone)
  const secret = process.env.HOT_DEALS_IDENTITY_SECRET || process.env.JWT_SECRET || 'lumo-default-customer-identity-salt-2026'
  return createHash('sha256').update(`${secret}:${normalized}`).digest('hex')
}

/**
 * Registers a new prospective customer lead against an active partner deal participation.
 * Strictly prevents self-referrals and detects duplicates per deal.
 */
export async function registerCustomerLead(
  tx: Tx,
  dealId: string,
  partnerUserId: string,
  input: LeadRegistrationInput
) {
  const parsed = leadRegistrationSchema.parse(input)

  // Retrieve partner profile to prevent self-referral
  const partner = await tx.user.findUniqueOrThrow({
    where: { id: partnerUserId },
  })

  const normalizedPartnerPhone = partner.phone?.replace(/[\s()-]/g, '').replace(/^0/, '+255')
  if (normalizedPartnerPhone && normalizedPartnerPhone === parsed.customerPhone) {
    throw new ReferralError('Self-referrals are strictly prohibited. You cannot register yourself as a customer lead.', 409)
  }

  // Ensure active participation
  const deal = await tx.hotDeal.findUniqueOrThrow({
    where: { id: dealId },
  })

  const participation = await tx.dealParticipation.findUnique({
    where: {
      opportunityId_partnerUserId: {
        opportunityId: deal.opportunityId,
        partnerUserId,
      },
    },
  })

  if (!participation || participation.status !== 'ACTIVE') {
    throw new ReferralError('Active participation on this opportunity is required before submitting referrals.', 403)
  }

  const customerHash = hashCustomerPhone(parsed.customerPhone)

  // First-registered customer rule per deal
  const existingClaim = await tx.hotDealClaim.findUnique({
    where: {
      dealId_customerHash: {
        dealId,
        customerHash,
      },
    },
  })

  if (existingClaim) {
    if (existingClaim.participationId !== participation.id) {
      throw new ReferralError(
        'This customer has already been referred by another partner for this opportunity. First registered referral takes precedence.',
        409
      )
    }
    return {
      claimId: existingClaim.id,
      leadId: existingClaim.leadId,
      isDuplicate: true,
    }
  }

  // Create Lead record
  const lead = await tx.lead.create({
    data: {
      participationId: participation.id,
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone,
      customerEmail: parsed.customerEmail,
      validationStatus: 'NEW',
      metadata: {
        consentAt: new Date().toISOString(),
        registeredByPartnerUserId: partnerUserId,
      },
    },
  })

  // Create HotDealClaim record binding this customer hash to this deal participation
  const claim = await tx.hotDealClaim.create({
    data: {
      dealId,
      participationId: participation.id,
      customerHash,
      leadId: lead.id,
    },
  })

  // Notify partner
  await tx.notification.create({
    data: {
      userId: partnerUserId,
      title: 'Referral Registered',
      body: `Customer referral for ${parsed.customerName} registered. Validation tracking is now active.`,
      linkUrl: `/hot-deals/${dealId}`,
    },
  })

  return {
    claimId: claim.id,
    leadId: lead.id,
    isDuplicate: false,
  }
}
