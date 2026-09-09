import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { actor, failure, json, requireAdmin } from '@/modules/hot-deals/auth'
import { audit, lockDeal, transaction } from '@/modules/hot-deals/service'
import { DealAccessError } from '@/modules/hot-deals/policy'

export async function GET(request: NextRequest) {
  try {
    requireAdmin(await actor(request))
    return json({ deals: await db.hotDeal.findMany({ include: { opportunity: { select: { title: true, organization: { select: { legalName: true } } } }, funding: true, claims: { include: { participation: { select: { partnerUserId: true } } } } }, take: 100, orderBy: { createdAt: 'desc' } }) })
  } catch (error) { return failure(error) }
}
export async function POST(request: NextRequest) {
  try {
    const user = await actor(request); requireAdmin(user)
    const input = z.object({ dealId: z.string().uuid(), fileId: z.string().uuid(), label: z.string().trim().min(2).max(100), privateMembersOnly: z.boolean().default(false) }).parse(await request.json())
    return json(await transaction(async tx => {
      await lockDeal(tx, input.dealId)
      const file = await tx.fileAsset.findUnique({ where: { id: input.fileId } })
      if (!file || file.isPublic || file.uploaderId !== user.id) throw new DealAccessError('Upload and review a private document first.')
      const document = await tx.hotDealMaterial.create({ data: input })
      await audit(tx, input.dealId, user, 'hot_deal.material_approved', {}, { documentId: document.id, fileId: file.id })
      return { id: document.id }
    }), 201)
  } catch (error) { return failure(error) }
}
