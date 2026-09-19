import { NextRequest } from 'next/server'
import { getAuthenticatedBusiness } from '@/lib/business-guard'
import { isValidRequestOrigin } from '@/lib/origin'
import { db } from '@/lib/db'
import { storeFile, removePrivateFile } from '@/modules/hot-deals/storage'

export async function POST(request: NextRequest) {
  try {
    if (!isValidRequestOrigin(request)) return Response.json({ error: 'Invalid origin' }, { status: 403 })
    const business = await getAuthenticatedBusiness(request)
    const recent = await db.fileAsset.count({ where: { uploaderId: business.userId, createdAt: { gt: new Date(Date.now() - 3600000) } } })
    if (recent >= 100) return Response.json({ error: 'Upload limit reached. Try again later.' }, { status: 429 })

    let file: File | null = null
    try {
      const form = await request.formData()
      const formFile = form.get('file')
      if (formFile instanceof File) file = formFile
    } catch {
      // Fallback to manual reader if request.formData() is unavailable
      const reader = request.body?.getReader()
      if (reader) {
        const chunks: Uint8Array[] = []
        let size = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          size += value.byteLength
          if (size > 10 * 1024 * 1024) {
            await reader.cancel()
            return Response.json({ error: 'Image too large' }, { status: 413 })
          }
          chunks.push(value)
        }
        const form = await new Response(new Uint8Array(Buffer.concat(chunks)), {
          headers: { 'Content-Type': request.headers.get('content-type') ?? '' },
        }).formData()
        const f = form.get('file')
        if (f instanceof File) file = f
      }
    }

    if (!file || !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      return Response.json({ error: 'A JPEG, PNG, or WebP image is required.' }, { status: 400 })
    }

    const key = await storeFile(file)
    try {
      const asset = await db.fileAsset.create({
        data: {
          uploaderId: business.userId,
          fileKey: key,
          fileName: file.name || 'opportunity-image',
          fileSizeBytes: file.size,
          mimeType: file.type,
          isPublic: true,
        },
      })
      return Response.json({ url: `/api/public/media/${asset.id}`, assetId: asset.id }, { status: 201 })
    } catch (error) {
      await removePrivateFile(key)
      throw error
    }
  } catch (error) {
    const status = (error as { statusCode?: number; status?: number }).statusCode ?? (error as { status?: number }).status ?? 503
    return Response.json(
      { error: status === 401 ? 'Please sign in.' : 'Unable to store this image. Try again or use an image URL.' },
      { status }
    )
  }
}
