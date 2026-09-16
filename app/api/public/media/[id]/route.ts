import { db } from '@/lib/db'
import { readPrivateFile } from '@/modules/hot-deals/storage'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!/^[a-f0-9-]{36}$/i.test(id)) return new Response(null, { status: 404 })
  const asset = await db.fileAsset.findFirst({ where: { id, isPublic: true, mimeType: { in: ['image/jpeg', 'image/png'] } } })
  if (!asset) return new Response(null, { status: 404 })
  try {
    return new Response(new Uint8Array(await readPrivateFile(asset.fileKey)), { headers: { 'Content-Type': asset.mimeType, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=3600' } })
  } catch { return new Response(null, { status: 503 }) }
}
