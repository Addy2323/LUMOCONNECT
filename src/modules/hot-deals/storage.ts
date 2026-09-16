import { mkdir, readFile, writeFile, unlink } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { DealAccessError } from './policy'
import { privateObject, s3Configured } from './s3'

function root() {
  const directory = process.env.HOT_DEALS_PRIVATE_STORAGE_DIR || path.join(process.cwd(), '.storage')
  const resolved = path.resolve(directory)
  if (resolved === path.resolve('public') || resolved.startsWith(path.resolve('public') + path.sep)) {
    throw new DealAccessError('Document storage must be outside the public directory.', 503)
  }
  return resolved
}

export async function storeFile(file: File) {
  if (file.size < 1 || file.size > 10 * 1024 * 1024) throw new DealAccessError('Files must be between 1 byte and 10 MB.', 400)
  const buffer = Buffer.from(await file.arrayBuffer())
  const isPdf = file.type === 'application/pdf' && buffer.subarray(0, 5).toString() === '%PDF-'
  const isPng = file.type === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const isJpeg = (file.type === 'image/jpeg' || file.type === 'image/jpg') && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
  const isWebp = file.type === 'image/webp' && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP'
  
  if (!isPdf && !isPng && !isJpeg && !isWebp) throw new DealAccessError('Upload a valid PDF, PNG, JPEG or WebP.', 400)
  const key = `hot-deals/${randomUUID()}`

  if (s3Configured()) {
    try {
      await privateObject('PUT', key, buffer, file.type)
      return key
    } catch (s3Err) {
      console.warn('S3 storage failed or unreachable, falling back to persistent local storage:', s3Err)
    }
  }

  const targetDir = path.join(root(), 'hot-deals')
  await mkdir(targetDir, { recursive: true })
  await writeFile(path.join(root(), key), buffer, { flag: 'wx', mode: 0o600 })
  return key
}

function filePath(key: string) {
  if (!/^hot-deals\/[a-f0-9-]{36}$/.test(key)) throw new DealAccessError('Document not found.', 404)
  return path.join(root(), key)
}

function validateKey(key: string) {
  if (!/^hot-deals\/[a-f0-9-]{36}$/.test(key)) throw new DealAccessError('Document not found.', 404)
}

export async function readPrivateFile(key: string) {
  validateKey(key)
  if (s3Configured()) {
    try {
      const resp = await privateObject('GET', key)
      return Buffer.from(await resp.arrayBuffer())
    } catch {
      // If S3 fails or file was saved locally, try reading from local storage
    }
  }
  return readFile(filePath(key))
}

export async function removePrivateFile(key: string) {
  validateKey(key)
  if (s3Configured()) {
    try {
      await privateObject('DELETE', key)
      return
    } catch {}
  }
  try {
    await unlink(filePath(key))
  } catch {}
}
