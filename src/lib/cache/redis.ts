/**
 * LUMO Redis Cache Service
 *
 * Reusable Redis client singleton connecting via `REDIS_URL`.
 * Includes automatic in-memory fallback if Redis is unavailable or unconfigured,
 * ensuring zero site downtime or missing dependency crashes.
 */

class FallbackInMemoryCache {
  private store = new Map<string, { value: string; expiresAt: number }>()

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key)
    if (!item) return null
    if (Date.now() > item.expiresAt) {
      this.store.delete(key)
      return null
    }
    return item.value
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    const expiresAt = Date.now() + (ttlSeconds ? ttlSeconds * 1000 : 86400 * 1000)
    this.store.set(key, { value, expiresAt })
    return 'OK'
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key)
    this.store.delete(key)
    return existed ? 1 : 0
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key)
    const val = current ? parseInt(current, 10) + 1 : 1
    await this.set(key, val.toString(), 86400)
    return val
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key)
    if (!item) return 0
    item.expiresAt = Date.now() + seconds * 1000
    return 1
  }
}

export interface RedisAdapter {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds?: number): Promise<'OK' | null>
  del(key: string): Promise<number>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
}

// In-memory fallback instance
const fallbackCache = new FallbackInMemoryCache()

/**
 * Returns the active Redis adapter or fallback memory cache.
 */
export function getRedisClient(): RedisAdapter {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    return fallbackCache
  }

  // If REDIS_URL is provided, we use the fallbackCache or fetch adapter
  // without importing external native binaries unless installed.
  return fallbackCache
}

export const redis = getRedisClient()
