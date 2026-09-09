import { db } from '@/lib/db'
import type { Prisma, HotDeal } from '@prisma/client'
import { evaluateDealAccess, dealHasCapacity } from './deal-access.service'
import { calculateReleaseDates } from './deal-release.service'

export type Tx = Prisma.TransactionClient

export interface PublicDealTeaser {
  id: string
  title: string
  titleSw: string | null
  category: string
  location: string
  rewardMinor: string
  inventoryAvailable: number
  inventoryTotal: number
  availablePartnerSlots: number
  capacityType: string
  releaseAt: string | null
  startsAt: string | null
  status: string
  verified: boolean
}

/**
 * Projects a HotDeal entity into a safe public teaser without exposing confidential merchant details.
 */
export function toPublicDealTeaser(deal: HotDeal, now = new Date()): PublicDealTeaser {
  const isReleased =
    deal.status === 'PARTNER_RELEASE' ||
    (deal.status === 'PRIVATE_HOT_DEAL' &&
      Boolean(deal.partnerReleaseAt && deal.partnerReleaseAt <= now) &&
      deal.generalPartnerAccessEnabled &&
      deal.availablePartnerSlots > 0 &&
      dealHasCapacity(deal))

  return {
    id: deal.id,
    title: deal.teaserTitle,
    titleSw: deal.teaserTitleSw,
    category: deal.category,
    location: deal.location,
    rewardMinor: deal.rewardPerVerifiedOutcome.toString(),
    inventoryAvailable: deal.inventoryAvailable,
    inventoryTotal: deal.inventoryTotal,
    availablePartnerSlots: deal.availablePartnerSlots,
    capacityType: deal.dealCapacityType,
    releaseAt: deal.partnerReleaseAt?.toISOString() ?? null,
    startsAt: deal.privateAccessStartAt?.toISOString() ?? null,
    status: isReleased ? 'PARTNER_RELEASE' : deal.status,
    verified: Boolean(deal.verifiedAt),
  }
}

/**
 * Retrieves all publicly visible deal teasers.
 */
export async function listPublicDeals(client: Tx | typeof db = db, now = new Date()): Promise<PublicDealTeaser[]> {
  const deals = await client.hotDeal.findMany({
    where: {
      visibilityStatus: { not: 'HIDDEN' },
      status: { in: ['PRIVATE_HOT_DEAL', 'PARTNER_RELEASE', 'RESERVED', 'FULL'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  return deals.map((d) => toPublicDealTeaser(d, now))
}

/**
 * Retrieves protected details of a deal according to server-side access rules.
 */
export async function getProtectedDealDetails(
  dealId: string,
  userId?: string,
  isDealRoomRequested = false,
  now = new Date()
) {
  return await db.$transaction(
    async (tx) => {
      const deal = await tx.hotDeal.findUnique({
        where: { id: dealId },
        include: {
          opportunity: {
            include: {
              organization: true,
              publishedVersion: {
                include: { rewardRules: true },
              },
            },
          },
          documents: true,
        },
      })

      if (!deal || deal.opportunity.deletedAt) {
        throw new Error('Deal opportunity not found or has been archived.')
      }

      const participation = userId
        ? await tx.dealParticipation.findUnique({
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
        : null

      const access = await evaluateDealAccess(tx, deal, userId, now, Boolean(participation))
      const version = deal.opportunity.publishedVersion

      // Base public teaser info
      const teaser = toPublicDealTeaser(deal, now)

      if (!access.canViewFullDetails || !version) {
        return {
          ...teaser,
          canViewFullDetails: false,
          canActivate: access.canActivate,
          denialReason: access.denialReason,
          statusBadge: access.statusBadge,
        }
      }

      // Check if agreement was accepted for this specific version
      const acceptance = participation
        ? await tx.participationAgreementAcceptance.findUnique({
            where: {
              participationId_versionId: {
                participationId: participation.id,
                versionId: version.id,
              },
            },
          })
        : null

      const isAgreementAccepted = Boolean(acceptance)

      // If user is inside the Deal Room
      if (isDealRoomRequested && participation && isAgreementAccepted) {
        return {
          ...teaser,
          canViewFullDetails: true,
          canActivate: false,
          isAgreementAccepted: true,
          title: version.title,
          description: version.description,
          merchantName: deal.opportunity.organization.tradingName || deal.opportunity.organization.legalName,
          termsAndConditions: version.termsAndConditions,
          versionId: version.id,
          termsHash: version.termsHash,
          participationId: participation.id,
          referrals: participation.trackingAssets.map((asset) => ({
            code: asset.code,
            assetType: asset.assetType,
          })),
          documents: deal.documents.map((doc) => ({
            id: doc.id,
            label: doc.label,
          })),
        }
      }

      // Pre-activation full preview
      return {
        ...teaser,
        canViewFullDetails: true,
        canActivate: access.canActivate,
        isAgreementAccepted,
        title: deal.teaserTitle,
        description: 'Accept participation terms to enter the Deal Room and access your referral tools.',
        termsAndConditions: version.termsAndConditions,
        versionId: version.id,
        termsHash: version.termsHash,
        statusBadge: access.statusBadge,
      }
    },
    { isolationLevel: 'ReadCommitted' }
  )
}
