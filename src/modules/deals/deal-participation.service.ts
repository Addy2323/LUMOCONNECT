import { createHash, randomBytes } from 'crypto'
import type { Prisma } from '@prisma/client'
import { reservePartnerSlot } from './deal-capacity.service'
import { evaluateDealAccess } from './deal-access.service'

export type Tx = Prisma.TransactionClient

export function hashTermsContent(terms: string): string {
  return createHash('sha256').update(terms).digest('hex')
}

export function validateTermsHash(terms: string, hash: string): boolean {
  return hashTermsContent(terms) === hash
}

export class ParticipationError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message)
    this.name = 'ParticipationError'
  }
}

export interface ActivationParams {
  dealId: string
  userId: string
  versionId: string
  termsHash: string
}

export interface ActivationResult {
  participationId: string
  referralCode: string
  dealRoomId: string
  acceptedAt: string
}

/**
 * Activates a partner on a deal, establishing permanent agreement acceptance,
 * unique referral attribution link, and Deal Room access.
 */
export async function activateDealParticipation(
  tx: Tx,
  params: ActivationParams,
  now = new Date()
): Promise<ActivationResult> {
  const { dealId, userId, versionId, termsHash } = params

  // Lock deal row
  await tx.$queryRaw`SELECT id FROM hot_deals WHERE id = ${dealId}::uuid FOR UPDATE`

  const deal = await tx.hotDeal.findUniqueOrThrow({
    where: { id: dealId },
    include: {
      opportunity: {
        include: {
          publishedVersion: true,
        },
      },
    },
  })

  // Verify published version and terms hash match exactly
  const version = deal.opportunity.publishedVersion
  if (!version || version.id !== versionId) {
    throw new ParticipationError('The deal agreement version is unavailable or has changed. Please review current terms.', 409)
  }
  if (version.termsHash !== termsHash) {
    throw new ParticipationError('Terms and conditions hash mismatch. Please accept the updated agreement version.', 409)
  }

  // Check if already participating
  const existingParticipation = await tx.dealParticipation.findUnique({
    where: {
      opportunityId_partnerUserId: {
        opportunityId: deal.opportunityId,
        partnerUserId: userId,
      },
    },
    include: {
      dealRoom: true,
      trackingAssets: true,
    },
  })

  // Evaluate server-side access control
  const access = await evaluateDealAccess(tx, deal, userId, now, Boolean(existingParticipation))
  if (!access.canActivate && !existingParticipation) {
    throw new ParticipationError(access.denialReason || 'You are not eligible to activate this opportunity.', 403)
  }

  let participationId: string
  let referralCode: string
  let dealRoomId: string

  if (existingParticipation) {
    participationId = existingParticipation.id
    dealRoomId = existingParticipation.dealRoom?.id || ''
    referralCode = existingParticipation.trackingAssets[0]?.code || ''
  } else {
    // Reserve partner participant slot
    await reservePartnerSlot(tx, dealId)

    // Generate secure unique referral token
    referralCode = randomBytes(20).toString('hex')

    // Create participation, deal room, and tracking asset in one atomic graph
    const newParticipation = await tx.dealParticipation.create({
      data: {
        opportunityId: deal.opportunityId,
        partnerUserId: userId,
        acceptedVersionId: version.id,
        dealRoom: {
          create: {},
        },
        trackingAssets: {
          create: {
            code: referralCode,
            assetType: 'LINK',
            status: 'ACTIVE',
          },
        },
      },
      include: {
        dealRoom: true,
      },
    })

    participationId = newParticipation.id
    dealRoomId = newParticipation.dealRoom?.id || ''
  }

  // Record agreement acceptance if not already recorded for this version
  const existingAcceptance = await tx.participationAgreementAcceptance.findUnique({
    where: {
      participationId_versionId: {
        participationId,
        versionId,
      },
    },
  })

  let acceptedAt = new Date()
  if (!existingAcceptance) {
    const acceptance = await tx.participationAgreementAcceptance.create({
      data: {
        participationId,
        versionId,
        termsHash,
        acceptedAt,
      },
    })
    acceptedAt = acceptance.acceptedAt

    // Audit log
    await tx.auditLog.create({
      data: {
        actorUserId: userId,
        entityType: 'DealParticipation',
        entityId: participationId,
        action: 'deal_participation.agreement_accepted',
        afterData: {
          dealId,
          versionId,
          termsHash,
          acceptedAt: acceptedAt.toISOString(),
        },
      },
    })
  }

  return {
    participationId,
    referralCode,
    dealRoomId,
    acceptedAt: acceptedAt.toISOString(),
  }
}
