import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { actor, failure, requireAdmin } from '@/modules/hot-deals/auth'
import { DealAccessError } from '@/modules/hot-deals/policy'
import { readPrivateFile } from '@/modules/hot-deals/storage'
export async function GET(request: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  try {
    const user = await actor(request); requireAdmin(user)
    const fileId = z.string().uuid().parse((await context.params).fileId)
    const file = await db.fileAsset.findUnique({ where: { id: fileId } })
    if (!file || file.isPublic) throw new DealAccessError('Private file not found.', 404)
    const buffer = await readPrivateFile(file.fileKey)
    await db.auditLog.create({ data: { actorUserId: user.id, entityType: 'HotDeal', entityId: file.id, action: 'hot_deal.evidence_reviewed', afterData: { fileId } } })
    return new NextResponse(new Uint8Array(buffer), { headers: { 'Content-Type': file.mimeType, 'Content-Disposition': 'attachment; filename="lumo-evidence"', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" } })
  } catch (error) { return failure(error) }
}
