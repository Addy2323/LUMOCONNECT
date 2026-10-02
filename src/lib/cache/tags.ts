/**
 * LUMO Centralized Cache Tags
 *
 * Provides tag key generators for tag-based revalidation (revalidateTag).
 */

export const CACHE_TAGS = {
  homepage: 'homepage',
  categories: 'categories',
  deals: 'deals',
  deal: (id: string) => `deal:${id}`,
  dealSlug: (slug: string) => `deal:slug:${slug}`,
  opportunities: 'opportunities',
  opportunity: (id: string) => `opportunity:${id}`,
  products: 'products',
  product: (id: string) => `product:${id}`,
  businesses: 'businesses',
  business: (id: string) => `business:${id}`,
  partners: 'partners',
  partner: (id: string) => `partner:${id}`,
  campaigns: 'campaigns',
  campaign: (id: string) => `campaign:${id}`,
  search: (hash: string) => `search:${hash}`,
} as const
