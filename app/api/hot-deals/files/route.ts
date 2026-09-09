import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { actor, failure, json } from '@/modules/hot-deals/auth'
import { removePrivateFile, storeFile } from '@/modules/hot-deals/storage'

export async function POST(request: NextRequest) {
  try {
    const user = await actor(request)
    if (Number(request.headers.get('content-length')) > 6 * 1024 * 1024) return json({ error: 'Upload exceeds 5 MB.' }, 413)
    const recent = await db.fileAsset.count({ where: { uploaderId: user.id, createdAt: { gt: new Date(Date.now() - 3600000) } } })
    if (recent >= 50) return json({ error: 'Upload limit reached. Please try again later.' }, 429)
    const reader = request.body?.getReader()
    if (!reader) return json({ error: 'A file is required.' }, 400)
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 6 * 1024 * 1024) { await reader.cancel(); return json({ error: 'Upload exceeds 5 MB.' }, 413) }
      chunks.push(value)
    }
    const form = await new Response(new Uint8Array(Buffer.concat(chunks)), { headers: { 'Content-Type': request.headers.get('content-type') ?? '' } }).formData()
    const file = form.get('file')
    if (!(file instanceof File)) return json({ error: 'A file is required.' }, 400)
    const fileKey = await storeFile(file)
    try {
      const asset = await db.fileAsset.create({ data: { uploaderId: user.id, fileKey, fileName: file.name.slice(0, 200), fileSizeBytes: file.size, mimeType: file.type, isPublic: false } })
      return json({ id: asset.id, name: asset.fileName }, 201)
    } catch (error) { await removePrivateFile(fileKey); throw error }
  } catch (error) { return failure(error) }
}
