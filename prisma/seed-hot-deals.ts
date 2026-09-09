import { PrismaClient } from '@prisma/client'
import { createHash, randomUUID } from 'crypto'

const db = new PrismaClient()
async function main() {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_HOT_DEAL_DEV_SEED !== 'true') throw new Error('Development examples require ALLOW_HOT_DEAL_DEV_SEED=true outside production.')
  const user = await db.user.findFirst({ where: { accountStatus: 'ACTIVE', deletedAt: null, memberships: { some: { status: 'ACTIVE', businessRole: 'OWNER' } } }, include: { memberships: true } })
  const membership = user?.memberships.find(m => m.status === 'ACTIVE' && m.businessRole === 'OWNER')
  if (!user || !membership) throw new Error('Create a development merchant first.')
  for (const sample of [
    { slug: 'dev-hot-toyota-harrier', title: 'Toyota Harrier — One Unit', category: 'Vehicle Sale', location: 'Dar es Salaam', description: 'Toyota Harrier. Price: TZS 45,000,000. One completed sale only. Owner details and vehicle documentation must be supplied and reviewed before publication.', units: 1, reward: 90000000n, budget: 90000000n, type: 'ONE_UNIT' as const, terms: 'The first valid registered buyer referral resulting in verified payment receives the reward. Multiple eligible partners may activate, but only one verified sale is rewarded. Ownership, payment and delivery evidence, fraud review and a 72-hour dispute period are required.' },
    { slug: 'dev-hot-mikocheni-apartments', title: 'Verified Apartments for Rent — 10 Units', category: 'Rental Opportunity', location: 'Mikocheni, Dar es Salaam', description: 'Ten apartments. Monthly rent: TZS 1,200,000. TZS 150,000 per verified tenant. Remaining units open to subscribed Partners after the 24-hour Private Member period.', units: 10, reward: 15000000n, budget: 150000000n, type: 'MULTI_UNIT' as const, terms: 'Each verified tenant requires an attributable registered referral, signed tenancy agreement, confirmed required tenant payment, merchant validation, fraud review and a 72-hour dispute period. Each accepted tenant consumes one unit and one reward. No reward is earned solely by joining.' },
  ]) {
    if (await db.opportunity.findUnique({ where: { slug: sample.slug } })) continue
    await db.$transaction(async tx => {
      const opportunity = await tx.opportunity.create({ data: { organizationId: membership.organizationId, opportunityType: 'PRODUCT_SALES', title: sample.title, slug: sample.slug, summary: sample.title, description: sample.description, galleryImageUrls: [], region: sample.location } })
      const version = await tx.opportunityVersion.create({ data: { opportunityId: opportunity.id, versionNumber: 1, title: sample.title, description: sample.description, termsAndConditions: sample.terms, termsHash: createHash('sha256').update(sample.terms).digest('hex'), rewardSummary: sample.terms, attributionModel: 'FIRST_VALID_REGISTERED_REFERRAL', rewardRules: { create: { rewardType: 'FIXED_COMMISSION', amountMinor: sample.reward, description: 'Per verified commercial outcome' } } } })
      await tx.opportunity.update({ where: { id: opportunity.id }, data: { publishedVersionId: version.id } })
      // An explicit missing-evidence placeholder, never a fabricated verification or funding record.
      const evidence = await tx.fileAsset.create({ data: { uploaderId: user.id, fileKey: `dev-missing-evidence/${randomUUID()}`, fileName: 'REPLACE_WITH_VERIFIED_OWNERSHIP_EVIDENCE', mimeType: 'application/octet-stream', fileSizeBytes: 0, isPublic: false } })
      const deal = await tx.hotDeal.create({ data: { opportunityId: opportunity.id, teaserTitle: sample.title, category: sample.category, location: sample.location, maximumPartnerSlots: 100, availablePartnerSlots: 100, inventoryTotal: sample.units, inventoryAvailable: sample.units, rewardBudget: sample.budget, rewardRemaining: sample.budget, rewardPerVerifiedOutcome: sample.reward, dealCapacityType: sample.type, ownerEvidenceFileId: evidence.id, status: 'DRAFT' } })
      await tx.auditLog.create({ data: { actorUserId: user.id, entityType: 'HotDeal', entityId: deal.id, action: 'hot_deal.dev_example_created', afterData: { status: 'DRAFT', reason: 'Development example; ownership evidence and real funding required before publication.' } } })
    })
  }
  console.log('Development examples created as unpublished drafts; no subscriptions, funding or verification were fabricated.')
}
main().catch(error => { console.error(error.message); process.exitCode = 1 }).finally(() => db.$disconnect())
