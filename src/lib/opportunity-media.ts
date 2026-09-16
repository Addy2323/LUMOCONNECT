export async function readApiResponse(response: Response) {
  if (response.status === 413) throw new Error('The upload is too large. Choose a smaller image or use a hosted media URL.')
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status}). Please try again.`)
  if (!data) throw new Error('The server returned an unexpected response. Please try again.')
  return data
}

export async function uploadOpportunityImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG or WebP image.')
  if (file.size > 20 * 1024 * 1024) throw new Error('Choose an image smaller than 20 MB.')
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image processing is unavailable. Use an image URL instead.')
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    let blob: Blob | null = null
    for (const quality of [0.85, 0.7, 0.5, 0.3]) {
      blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (blob && blob.size <= 700 * 1024) break
    }
    if (!blob || blob.size > 700 * 1024) throw new Error('This image could not be reduced enough. Choose a smaller image.')
    const form = new FormData(); form.append('file', blob, 'opportunity.jpg')
    const data = await readApiResponse(await fetch('/api/business/media', { method: 'POST', body: form }))
    return data.url
  } finally { bitmap.close() }
}
