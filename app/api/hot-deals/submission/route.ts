import { createHash, randomUUID } from 'crypto'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { actor, failure, json } from '@/modules/hot-deals/auth'
import { submissionSchema, submit } from '@/modules/hot-deals/management'
import { DealAccessError } from '@/modules/hot-deals/policy'

export async function GET(request: NextRequest) {
  try {
    const user = await actor(request)
    return json({ organizations: await db.organization.findMany({ where: { deletedAt: null, members: { some: { userId: user.id, status: 'ACTIVE', businessRole: { in: ['OWNER', 'ADMIN'] } } } }, select: { id: true, legalName: true } }) })
  } catch (error) { return failure(error) }
}
export async function POST(request: NextRequest) {
  try {
    const user = await actor(request)
    const body = await request.json()
    const input = z.object({ organizationId: z.string().uuid(), title: z.string().min(3).max(160), description: z.string().min(20).max(20000), terms: z.string().min(30).max(20000), rewardTrigger: z.string().min(20).max(2000), requestId: z.string().uuid() }).parse(body)
    const config = submissionSchema.parse({ ...body, opportunityId: input.requestId })
    const member = await db.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: input.organizationId, userId: user.id } } })
    if (!member || member.status !== 'ACTIVE' || !['OWNER', 'ADMIN'].includes(member.businessRole)) throw new DealAccessError('Active merchant owner or administrator access is required.')
    // Stable request ID makes a retried submission reuse its opportunity and terms.
    const result = await db.$transaction(async tx => {
      const previous = await tx.opportunity.findUnique({ where: { id: input.requestId }, include: { hotDeal: true } })
      if (previous) {
        if (previous.organizationId !== input.organizationId) throw new DealAccessError('Submission conflict.', 409)
        return previous.hotDeal ? { id: previous.hotDeal.id, status: previous.hotDeal.status } : submit(user, { ...config, opportunityId: previous.id }, tx)
      }
      const created = await tx.opportunity.create({ data: { id: input.requestId, organizationId: input.organizationId, opportunityType: config.dealCapacityType === 'LEAD_LIMIT' ? 'QUALIFIED_LEADS' : 'PRODUCT_SALES', title: input.title, slug: `hot-deal-${randomUUID()}`, summary: config.teaserTitle, description: input.description, region: config.location, totalBudgetMinor: config.rewardBudget, maxPartners: config.maximumPartnerSlots, galleryImageUrls: [] } })
      const version = await tx.opportunityVersion.create({ data: { opportunityId: created.id, versionNumber: 1, title: input.title, description: input.description, termsAndConditions: input.terms, termsHash: createHash('sha256').update(input.terms).digest('hex'), rewardSummary: input.rewardTrigger, attributionModel: 'FIRST_VALID_REGISTERED_REFERRAL', rewardRules: { create: { rewardType: 'FIXED_COMMISSION', amountMinor: config.rewardPerVerifiedOutcome, description: input.rewardTrigger } } } })
      await tx.opportunity.update({ where: { id: created.id }, data: { publishedVersionId: version.id } })
      return submit(user, { ...config, opportunityId: created.id }, tx)
    })
    return json(result, 201)
  } catch (error) { return failure(error) }
}
