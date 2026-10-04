import { NextResponse } from 'next/server'

interface RateLimitRecord {
  count: number
  resetAt: number
}

const inMemoryRateLimitStore = new Map<string, RateLimitRecord>()

/**
 * Extract client IP address safely behind trusted reverse proxies
 */
export function getClientIp(req: Request): string {
  // If behind HAProxy / Nginx, take the last IP appended by the trusted proxy, or first from right
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim())
    // Use last IP if multiple hops, or first
    return ips[ips.length - 1] || ips[0] || '127.0.0.1'
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return '127.0.0.1'
}

export interface RateLimitOptions {
  keyPrefix: string
  identifier: string
  maxRequests: number
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetSeconds: number
}

/**
 * Redis-backed Sliding Window Rate Limiter (with in-memory fallback for offline dev/test)
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { keyPrefix, identifier, maxRequests, windowSeconds } = options
  const key = `ratelimit:${keyPrefix}:${identifier.toLowerCase()}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  // 1. Redis Rest API check (e.g. Upstash or REST Proxy if REDIS_URL/UPSTASH_REDIS_REST_URL is configured)
  const redisRestUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL
  const redisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN

  if (redisRestUrl && redisRestToken) {
    try {
      // Execute INCR and EXPIRE pipeline via REST
      const res = await fetch(`${redisRestUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisRestToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSeconds, 'NX'],
          ['TTL', key],
        ]),
        cache: 'no-store',
      })

      if (res.ok) {
        const data = await res.json()
        const currentCount = Number(data[0]?.result || 1)
        const ttlSeconds = Number(data[2]?.result || windowSeconds)

        if (currentCount > maxRequests) {
          return {
            success: false,
            remaining: 0,
            resetSeconds: ttlSeconds > 0 ? ttlSeconds : windowSeconds,
          }
        }

        return {
          success: true,
          remaining: Math.max(0, maxRequests - currentCount),
          resetSeconds: ttlSeconds > 0 ? ttlSeconds : windowSeconds,
        }
      }
    } catch (err) {
      console.warn('[RATE LIMITER] Redis REST connection failed, using in-memory fallback:', err)
    }
  }

  // 2. In-Memory Fallback
  const record = inMemoryRateLimitStore.get(key)
  if (!record || now > record.resetAt) {
    inMemoryRateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return {
      success: true,
      remaining: maxRequests - 1,
      resetSeconds: windowSeconds,
    }
  }

  record.count += 1
  const resetSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000))

  if (record.count > maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetSeconds,
    }
  }

  return {
    success: true,
    remaining: maxRequests - record.count,
    resetSeconds,
  }
}

/**
 * Returns HTTP 429 Too Many Requests response with standard Retry-After header
 */
export function rateLimitResponse(resetSeconds: number, message = 'Too many requests. Please try again later.'): NextResponse {
  const response = NextResponse.json(
    {
      error: 'TOO_MANY_REQUESTS',
      message,
      retryAfterSeconds: resetSeconds,
    },
    { status: 429 }
  )
  response.headers.set('Retry-After', String(resetSeconds))
  return response
}
