import { mkdir, readFile, writeFile, unlink } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { DealAccessError } from './policy'
import { privateObject, s3Configured } from './s3'

function root() {
  const directory = process.env.HOT_DEALS_PRIVATE_STORAGE_DIR
  if (!directory || !path.isAbsolute(directory)) throw new DealAccessError('Private document storage is not configured.', 503)
  const resolved = path.resolve(directory)
  if (resolved === path.resolve('public') || resolved.startsWith(path.resolve('public') + path.sep)) throw new DealAccessError('Document storage must be outside the public directory.', 503)
  return resolved
}
export async function storeFile(file: File) {
  if (file.size < 1 || file.size > 5 * 1024 * 1024) throw new DealAccessError('Files must be between 1 byte and 5 MB.', 400)
  const buffer = Buffer.from(await file.arrayBuffer())
  const valid = file.type === 'application/pdf' ? buffer.subarray(0, 5).toString() === '%PDF-'
    : file.type === 'image/png' ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : file.type === 'image/jpeg' && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
  if (!valid) throw new DealAccessError('Upload a valid PDF, PNG or JPEG.', 400)
  const key = `hot-deals/${randomUUID()}`
  if (s3Configured()) { await privateObject('PUT', key, buffer, file.type); return key }
  await mkdir(path.join(root(), 'hot-deals'), { recursive: true })
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
  return s3Configured() ? Buffer.from(await (await privateObject('GET', key)).arrayBuffer()) : readFile(filePath(key))
}
export async function removePrivateFile(key: string) {
  validateKey(key)
  if (s3Configured()) { await privateObject('DELETE', key); return }
  await unlink(filePath(key))
}
