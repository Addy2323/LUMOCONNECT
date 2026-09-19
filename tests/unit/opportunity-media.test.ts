import { expect, it, vi, afterEach } from 'vitest'
import { readApiResponse, uploadOpportunityImage } from '@/lib/opportunity-media'
afterEach(() => vi.unstubAllGlobals())
it('explains a proxy HTML 413 without attempting to parse HTML as JSON', async () => {
  await expect(readApiResponse(new Response('<html>Too large</html>', { status: 413 }))).rejects.toThrow('upload is too large')
})
it('handles non-JSON server failures and preserves API validation messages', async () => {
  await expect(readApiResponse(new Response('<html>Error</html>', { status: 502 }))).rejects.toThrow('502')
  await expect(readApiResponse(Response.json({ error: 'Title required' }, { status: 400 }))).rejects.toThrow('Title required')
})
it('uploads an optimized image separately and returns only its URL', async () => {
  const close = vi.fn(); const draw = vi.fn()
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 3200, height: 1600, close }))
  const canvas = { width: 0, height: 0, getContext: () => ({ fillStyle: '', fillRect: vi.fn(), drawImage: draw }), toBlob: (callback: (blob: Blob) => void) => callback(new Blob(['image'], { type: 'image/jpeg' })) }
  vi.stubGlobal('document', { createElement: () => canvas })
  const fetch = vi.fn().mockResolvedValue(Response.json({ url: '/api/public/media/image-id' }))
  vi.stubGlobal('fetch', fetch)
  expect(await uploadOpportunityImage(new File(['source'], 'large.jpg', { type: 'image/jpeg' }))).toBe('/api/public/media/image-id')
  expect(canvas.width).toBe(1600); expect(canvas.height).toBe(800)
  expect(fetch.mock.calls[0][0]).toBe('/api/business/media')
  expect(fetch.mock.calls[0][1].body).toBeInstanceOf(FormData)
  expect(close).toHaveBeenCalled()
})
it('rejects unsupported files before uploading', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
  await expect(uploadOpportunityImage(new File(['svg'], 'image.svg', { type: 'image/svg+xml' }))).rejects.toThrow('JPEG')
  expect(fetch).not.toHaveBeenCalled()
})
