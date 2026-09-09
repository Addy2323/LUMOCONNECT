import type { Prisma } from '@prisma/client'

export type Tx = Prisma.TransactionClient

export interface FraudEvaluationResult {
  passed: boolean
  flags: string[]
  riskScore: number
  reasons: string[]
}

export interface FraudCheckParams {
  dealId: string
  partnerUserId: string
  customerPhone: string
  customerName: string
  deviceFingerprint?: string
  ipAddress?: string
}

/**
 * Runs systematic compliance and anti-fraud checks on incoming referrals and conversions.
 */
export async function evaluateFraudRisk(
  client: Tx,
  params: FraudCheckParams
): Promise<FraudEvaluationResult> {
  const flags: string[] = []
  const reasons: string[] = []
  let riskScore = 0

  const { dealId, partnerUserId, customerPhone, customerName } = params

  // 1. Partner Self-Referral Check
  const partner = await client.user.findUnique({
    where: { id: partnerUserId },
  })

  if (partner?.phone && partner.phone.replace(/[\s()-]/g, '').replace(/^0/, '+255') === customerPhone) {
    flags.push('SELF_REFERRAL')
    reasons.push('Customer phone number matches partner account phone.')
    riskScore += 100
  }

  const normalizedPartnerName = partner?.name?.trim().toLowerCase() || ''
  const normalizedCustomerName = customerName.trim().toLowerCase()
  if (normalizedPartnerName && normalizedPartnerName === normalizedCustomerName) {
    flags.push('NAME_COLLUSION')
    reasons.push('Customer name is identical to partner name.')
    riskScore += 50
  }

  // 2. Cross-Deal Referral Flooding Check (same customer referred to > 5 deals by same partner in 24h)
  const recentPartnerLeads = await client.lead.count({
    where: {
      customerPhone,
      createdAt: { gt: new Date(Date.now() - 86400000) },
      participation: { partnerUserId },
    },
  })

  if (recentPartnerLeads > 5) {
    flags.push('REFERRAL_VELOCITY_HIGH')
    reasons.push(`Partner referred this customer to ${recentPartnerLeads} opportunities in past 24 hours.`)
    riskScore += 40
  }

  // 3. Organization Collusion Check (partner is member of deal publisher org)
  const deal = await client.hotDeal.findUnique({
    where: { id: dealId },
    include: { opportunity: true },
  })

  if (deal) {
    const orgMembership = await client.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: deal.opportunity.organizationId,
          userId: partnerUserId,
        },
      },
    })

    if (orgMembership && orgMembership.status === 'ACTIVE') {
      flags.push('MERCHANT_PARTNER_COLLUSION')
      reasons.push('Partner is an active member or staff of the merchant publishing this deal.')
      riskScore += 80
    }
  }

  return {
    passed: riskScore < 70,
    flags,
    riskScore,
    reasons,
  }
}
