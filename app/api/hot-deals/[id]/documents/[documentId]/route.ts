import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { actor, failure } from '@/modules/hot-deals/auth'
import { audit, eligible, lockDeal, refreshRelease, transaction } from '@/modules/hot-deals/service'
import { DealAccessError } from '@/modules/hot-deals/policy'
import { readPrivateFile } from '@/modules/hot-deals/storage'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    const user = await actor(request)
    const { id, documentId } = z.object({ id: z.string().uuid(), documentId: z.string().uuid() }).parse(await context.params)
    const result = await transaction(async tx => {
      const deal = await refreshRelease(tx, await lockDeal(tx, id), new Date())
      const { participation, codes } = await eligible(tx, deal, user.id, new Date())
      if (!participation || !deal.opportunity.publishedVersionId || !await tx.participationAgreementAcceptance.findUnique({ where: { participationId_versionId: { participationId: participation.id, versionId: deal.opportunity.publishedVersionId } } })) throw new DealAccessError('Accept current participation terms first.')
      const document = await tx.hotDealMaterial.findFirst({ where: { id: documentId, dealId: id } })
      if (!document || document.privateMembersOnly && !codes.includes('PRIVATE_MEMBER')) throw new DealAccessError('Document not found.', 404)
      const file = await tx.fileAsset.findUnique({ where: { id: document.fileId } })
      if (!file || file.isPublic) throw new DealAccessError('Document not found.', 404)
      await audit(tx, id, user, 'hot_deal.document_access', {}, { documentId })
      return { buffer: await readPrivateFile(file.fileKey), type: file.mimeType }
    })
    return new NextResponse(new Uint8Array(result.buffer), { headers: { 'Content-Type': result.type, 'Content-Disposition': 'attachment; filename="lumo-document"', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'", Vary: 'Cookie' } })
  } catch (error) { return failure(error) }
}
