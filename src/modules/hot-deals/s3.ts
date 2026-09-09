import { createHash, createHmac } from 'crypto'
import { DealAccessError } from './policy'

const hash = (data: string | Buffer) => createHash('sha256').update(data).digest('hex')
const mac = (key: string | Buffer, data: string) => createHmac('sha256', key).update(data).digest()
export const s3Configured = () => !!process.env.S3_ENDPOINT && !!process.env.S3_BUCKET

// AWS Signature V4, path-style S3/MinIO. All objects remain private; downloads are proxied after authorization.
export async function privateObject(method: 'GET' | 'PUT' | 'DELETE', key: string, body?: Buffer, contentType?: string) {
  const endpoint = process.env.S3_ENDPOINT
  const bucket = process.env.S3_BUCKET
  const accessKey = process.env.S3_ACCESS_KEY_ID
  const secret = process.env.S3_SECRET_ACCESS_KEY
  const region = process.env.S3_REGION || 'us-east-1'
  if (!endpoint || !bucket || !accessKey || !secret) throw new DealAccessError('Private object storage is not configured.', 503)
  const url = new URL(endpoint)
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', 'minio'].includes(url.hostname)) throw new DealAccessError('Object storage must use HTTPS.', 503)
  if (url.search || url.username || url.password) throw new DealAccessError('Invalid object storage endpoint.', 503)
  const encode = (segment: string) => encodeURIComponent(segment).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
  url.pathname = `${url.pathname.replace(/\/$/, '')}/${encode(bucket)}/${key.split('/').map(encode).join('/')}`
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  const date = timestamp.slice(0, 8)
  const digest = hash(body ?? '')
  const headers = `host:${url.host}\nx-amz-content-sha256:${digest}\nx-amz-date:${timestamp}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const canonical = [method, url.pathname, '', headers, signedHeaders, digest].join('\n')
  const scope = `${date}/${region}/s3/aws4_request`
  const signingKey = mac(mac(mac(mac(`AWS4${secret}`, date), region), 's3'), 'aws4_request')
  const signature = createHmac('sha256', signingKey).update(`AWS4-HMAC-SHA256\n${timestamp}\n${scope}\n${hash(canonical)}`).digest('hex')
  const response = await fetch(url, { method, headers: {
    'x-amz-date': timestamp, 'x-amz-content-sha256': digest,
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    ...(contentType ? { 'Content-Type': contentType } : {}),
  }, body: body ? new Uint8Array(body) : undefined, signal: AbortSignal.timeout(15000), redirect: 'error' })
  if (!response.ok) throw new DealAccessError(response.status === 404 ? 'Document not found.' : 'Private object storage is unavailable.', response.status === 404 ? 404 : 503)
  return response
}
