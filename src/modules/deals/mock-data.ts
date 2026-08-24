import type { OpportunityItem } from './types'

/**
 * Production Initial Opportunities Repository:
 * Starts completely clean for production.
 * Live opportunities are dynamically created by verified businesses and saved to PostgreSQL.
 */
export const INITIAL_OPPORTUNITIES: OpportunityItem[] = []
