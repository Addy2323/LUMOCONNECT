/**
 * LUMO HTTP Cache Policy Utilities
 *
 * Generates standardized Cache-Control headers for HTTP responses.
 */

import { CACHE_TTL, CachePolicyType } from './config'

export interface CacheHeaderOptions {
  policy: CachePolicyType
  swr?: number // stale-while-revalidate seconds
  isPrivate?: boolean
}

/**
 * Returns HTTP headers for Cache-Control.
 */
export function getCacheHeaders(options: CacheHeaderOptions): Record<string, string> {
  const { policy, swr = 60, isPrivate = false } = options

  if (policy === 'NO_CACHE' || isPrivate) {
    return {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    }
  }

  const ttlSeconds = CACHE_TTL[policy]
  return {
    'Cache-Control': `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}, stale-while-revalidate=${swr}`,
  }
}

/**
 * Convenience helper for non-cacheable / private responses.
 */
export const NO_STORE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}
