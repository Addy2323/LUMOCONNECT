/**
 * LUMO Cached Database Queries
 *
 * Uses Next.js unstable_cache with explicit tags and TTL policies to cache
 * public database queries, reducing PostgreSQL connection load.
 */

import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { CACHE_TAGS } from './tags'
import { CACHE_TTL } from './config'

/**
 * Cached fetch for public published opportunities.
 */
export async function getPublicOpportunitiesCached(filters?: {
  query?: string
  category?: string
  type?: string
  region?: string
  sortBy?: string
}) {
  const filterKey = JSON.stringify(filters || {})
  
  return unstable_cache(
    async () => {
      const where: any = {
        status: { in: ['PUBLISHED', 'APPROVED'] },
        deletedAt: null,
      }

      if (filters?.category && filters.category !== 'ALL' && filters.category !== 'All Categories') {
        where.OR = [
          { category: { name: { contains: filters.category, mode: 'insensitive' } } },
          { subcategory: { contains: filters.category, mode: 'insensitive' } },
        ]
      }

      if (filters?.type && filters.type !== 'ALL') {
        where.opportunityType = filters.type
      }

      if (filters?.region && !filters.region.startsWith('All')) {
        where.region = { contains: filters.region, mode: 'insensitive' }
      }

      if (filters?.query && filters.query.trim()) {
        const q = filters.query.trim()
        where.AND = [
          {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { summary: { contains: q, mode: 'insensitive' } },
            ],
          },
        ]
      }

      let orderBy: any = [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
      if (filters?.sortBy === 'newest') {
        orderBy = [{ createdAt: 'desc' }]
      } else if (filters?.sortBy === 'highest_reward') {
        orderBy = [{ fixedRewardAmountMinor: 'desc' }, { rewardPercentage: 'desc' }]
      }

      return db.opportunity.findMany({
        where,
        orderBy,
        take: 50,
        include: {
          organization: {
            select: {
              tradingName: true,
              legalName: true,
              logoUrl: true,
            },
          },
        },
      })
    },
    ['public-opportunities', filterKey],
    {
      revalidate: CACHE_TTL.PUBLIC_SHORT,
      tags: [CACHE_TAGS.opportunities],
    }
  )()
}

/**
 * Cached fetch for public opportunity by ID.
 */
export async function getPublicOpportunityByIdCached(id: string) {
  return unstable_cache(
    async () => {
      return db.opportunity.findFirst({
        where: {
          id,
          status: { in: ['PUBLISHED', 'APPROVED'] },
          deletedAt: null,
        },
        include: {
          organization: true,
        },
      })
    },
    ['public-opportunity-by-id', id],
    {
      revalidate: CACHE_TTL.PUBLIC_SHORT,
      tags: [CACHE_TAGS.opportunities, CACHE_TAGS.opportunity(id)],
    }
  )()
}

/**
 * Cached fetch for public categories list.
 */
export async function getPublicCategoriesCached() {
  return unstable_cache(
    async () => {
      const opportunities = await db.opportunity.findMany({
        where: { status: { in: ['PUBLISHED', 'APPROVED'] }, deletedAt: null },
        select: { subcategory: true, opportunityType: true },
        distinct: ['subcategory'],
      })
      const categoryNames = Array.from(
        new Set(opportunities.map((o) => o.subcategory).filter(Boolean))
      )
      return categoryNames.map((name, index) => ({
        id: `cat_${index + 1}`,
        name: name!,
        slug: name!.toLowerCase().replace(/\s+/g, '-'),
      }))
    },
    ['public-categories'],
    {
      revalidate: CACHE_TTL.PUBLIC_LONG,
      tags: [CACHE_TAGS.categories],
    }
  )()
}

/**
 * Cached fetch for homepage aggregate statistics & featured content.
 */
export async function getHomepageDataCached() {
  return unstable_cache(
    async () => {
      const [featuredCount, totalOpportunities] = await Promise.all([
        db.opportunity.count({
          where: { isFeatured: true, status: { in: ['PUBLISHED', 'APPROVED'] }, deletedAt: null },
        }),
        db.opportunity.count({
          where: { status: { in: ['PUBLISHED', 'APPROVED'] }, deletedAt: null },
        }),
      ])

      return {
        featuredCount,
        totalOpportunities,
        cachedAt: new Date().toISOString(),
      }
    },
    ['homepage-aggregated-data'],
    {
      revalidate: CACHE_TTL.PUBLIC_SHORT,
      tags: [CACHE_TAGS.homepage, CACHE_TAGS.opportunities],
    }
  )()
}
