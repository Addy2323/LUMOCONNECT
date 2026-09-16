import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

export class MerchantDeletionError extends Error {
  constructor(message: string, public status = 409) { super(message) }
}

type Transaction = Prisma.TransactionClient

export async function inspectMerchantDeletion(tx: Transaction, organizationId: string, actorId: string) {
  const organization = await tx.organization.findUnique({
    where: { id: organizationId },
    include: { members: { include: { user: { include: {
      memberships: true, roleAssignments: { include: { role: true } }, partnerProfile: true,
      _count: { select: { paymentAttempts: true, participations: true, subscriptions: true, payoutsReceived: true, rewards: true, ordersPlaced: true, ordersAttributed: true, verificationDecisions: true, deliverablesCreated: true, hotDealVerifications: true, hotDealFraudReviews: true, disputesOpened: true, disputeMessages: true } },
    } } } } },
  })
  if (!organization) throw new MerchantDeletionError('Merchant not found.', 404)

  const accountIds = organization.members.filter(({ user }) =>
    user.id !== actorId && !user.partnerProfile &&
    user.memberships.every((membership) => membership.organizationId === organizationId) &&
    user.roleAssignments.every((assignment) =>
      assignment.organizationId === organizationId ||
      (!assignment.organizationId && ['BUSINESS', 'BUSINESS_OWNER', 'BUSINESS_ADMIN', 'BUSINESS_STAFF', 'MERCHANT'].includes(assignment.role.code))
    ) && Object.values(user._count).every((count) => count === 0)
  ).map(({ userId }) => userId)

  const opportunityWhere = { organizationId }
  const [opportunities, verificationCases, orders, rewards, funding, disputes] = await Promise.all([
    tx.opportunity.count({ where: opportunityWhere }),
    tx.verificationCase.count({ where: { organizationId } }),
    tx.order.count({ where: { OR: [{ organizationId }, { opportunity: opportunityWhere }] } }),
    tx.reward.count({ where: { conversion: { opportunity: opportunityWhere } } }),
    tx.hotDealFunding.count({ where: { deal: { opportunity: opportunityWhere } } }),
    tx.dispute.count({ where: { participation: { opportunity: opportunityWhere } } }),
  ])
  const blockers: string[] = []
  if (orders) blockers.push(`${orders} linked order(s) must be retained.`)
  if (rewards) blockers.push(`${rewards} partner reward record(s) must be retained.`)
  if (funding) blockers.push(`${funding} funded hot deal(s) must be retained.`)
  if (disputes) blockers.push(`${disputes} dispute record(s) must be retained.`)
  return { organizationId, legalName: organization.legalName, opportunities, verificationCases,
    members: organization.members.length, accountIds, preservedAccounts: organization.members.length - accountIds.length, blockers }
}

export async function deleteMerchant(input: { organizationId: string; actorId: string; confirmation: string; reason: string; deleteAccounts: boolean }) {
  return db.$transaction(async (tx) => {
    // Recompute inside the transaction; a preview is never authorization to delete changed data.
    const preview = await inspectMerchantDeletion(tx, input.organizationId, input.actorId)
    if (input.confirmation !== preview.legalName) throw new MerchantDeletionError('Type the exact merchant name to confirm deletion.', 400)
    if (input.reason.trim().length < 5) throw new MerchantDeletionError('Enter a deletion reason (at least 5 characters).', 400)
    if (preview.blockers.length) throw new MerchantDeletionError(preview.blockers.join(' '))

    const organizationId = input.organizationId
    const opportunity = { organizationId }
    const deal = { opportunity }
    const accountIds = input.deleteAccounts ? preview.accountIds : []
    // Collect document metadata before cascading the verification records.
    const files = await tx.fileAsset.findMany({ where: { OR: [
      { verificationDocuments: { some: { verificationCase: { organizationId } } } },
      { uploaderId: { in: accountIds } },
      { hotDealOwnershipEvidence: { some: { opportunity } } },
      { hotDealMaterials: { some: { deal } } },
    ] }, select: { id: true } })

    await tx.hotDealClaim.deleteMany({ where: { deal } })
    await tx.hotDealSave.deleteMany({ where: { deal } })
    await tx.hotDealEvent.deleteMany({ where: { deal } })
    await tx.hotDealMaterial.deleteMany({ where: { deal } })
    await tx.hotDeal.deleteMany({ where: { opportunity } })
    await tx.participationAgreementAcceptance.deleteMany({ where: { participation: { opportunity } } })
    await tx.dealParticipation.deleteMany({ where: { opportunity } })
    await tx.referralTicket.deleteMany({ where: { opportunity } })
    await tx.riskAlert.deleteMany({ where: { organizationId } })
    await tx.opportunity.deleteMany({ where: { organizationId } })
    await tx.organization.delete({ where: { id: organizationId } })
    // User-specific KYB records and login sessions belong only to accounts selected for deletion.
    await tx.verificationCase.deleteMany({ where: { userId: { in: accountIds } } })
    const orphanedFiles = await tx.fileAsset.findMany({ where: {
      id: { in: files.map((file) => file.id) },
      verificationDocuments: { none: {} }, hotDealOwnershipEvidence: { none: {} }, hotDealMaterials: { none: {} },
      conversionEvidence: { none: {} }, dealDeliverables: { none: {} }, disputeEvidence: { none: {} },
    }, select: { id: true, fileKey: true } })
    for (const file of orphanedFiles) {
      if (!/^hot-deals\/[a-f0-9-]{36}$/.test(file.fileKey)) {
        throw new MerchantDeletionError('A document uses an unsupported storage location. Configure document cleanup before permanently deleting this merchant.')
      }
      await tx.outboxEvent.create({ data: {
        eventType: 'merchant.file.delete', aggregateType: 'Organization', aggregateId: organizationId,
        payload: { fileKey: file.fileKey },
      } })
    }
    await tx.fileAsset.deleteMany({ where: { id: { in: orphanedFiles.map((file) => file.id) } } })
    // A remaining shared file prevents deleting its uploader and rolling back another tenant's data.
    const sharedUploads = await tx.fileAsset.count({ where: { uploaderId: { in: accountIds } } })
    if (sharedUploads) throw new MerchantDeletionError('A merchant account owns files used by another record. Retry with login-account deletion unchecked.')
    await tx.enterpriseInquiry.deleteMany({ where: { userId: { in: accountIds } } })
    await tx.user.deleteMany({ where: { id: { in: accountIds } } })
    await tx.auditLog.create({ data: {
      actorUserId: input.actorId, action: 'merchant.deleted_permanently', entityType: 'Organization', entityId: organizationId,
      beforeData: { legalName: preview.legalName, opportunities: preview.opportunities, members: preview.members },
      afterData: { reason: input.reason.trim(), deletedAccounts: accountIds.length },
    } })
    return { organizationId, deletedAccounts: accountIds.length }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 })
}
