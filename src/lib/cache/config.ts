/**
 * LUMO Centralized Cache Configuration & TTL Policies
 *
 * Defines standard TTL lifetimes across the platform to avoid scattered magic numbers.
 */

export const CACHE_TTL = {
  /** 24 Hours: Static content, terms, company info */
  STATIC: 86400,
  /** 1 Hour: Public categories, taxonomy */
  PUBLIC_LONG: 3600,
  /** 10 Minutes: Products, public business profiles, partner profiles */
  PUBLIC_MEDIUM: 600,
  /** 5 Minutes: Homepage data, active published deals & opportunities */
  PUBLIC_SHORT: 300,
  /** 0 Seconds: Authenticated, transactional, financial, admin endpoints */
  NO_CACHE: 0,
} as const

export type CachePolicyType = keyof typeof CACHE_TTL
