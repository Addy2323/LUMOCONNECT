import { NextRequest } from 'next/server'
import { z } from 'zod'
import { actor, failure, json } from '@/modules/hot-deals/auth'
import { audit, lockDeal, transaction } from '@/modules/hot-deals/service'
import { DealAccessError } from '@/modules/hot-deals/policy'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await actor(request)
    const id = z.string().uuid().parse((await context.params).id)
    const input = z.object({ claimId: z.string().uuid(), fileId: z.string().uuid() }).parse(await request.json())
    return json(await transaction(async tx => {
      await lockDeal(tx, id)
      const claim = await tx.hotDealClaim.findUnique({ where: { id: input.claimId }, include: { participation: true } })
      // Historical evidence/dispute access deliberately survives subscription expiry.
      if (!claim || claim.dealId !== id || claim.participation.partnerUserId !== user.id) throw new DealAccessError('Referral not found.', 404)
      const file = await tx.fileAsset.findUnique({ where: { id: input.fileId } })
      if (!file || file.isPublic || file.uploaderId !== user.id) throw new DealAccessError('Upload your private evidence first.')
      if (!claim.evidenceFileIds.includes(input.fileId)) {
        await tx.hotDealClaim.update({ where: { id: claim.id }, data: { evidenceFileIds: { push: input.fileId } } })
        await audit(tx, id, user, 'hot_deal.evidence_submitted', {}, { claimId: claim.id, fileId: file.id })
      }
      return { received: true }
    }))
  } catch (error) { return failure(error) }
}
