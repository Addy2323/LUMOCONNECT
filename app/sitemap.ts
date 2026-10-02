import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://lumoconnect.com'
  const currentDate = new Date()

  // Core public business routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/hot-deals`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/international`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/subscriptions`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/choose-path`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Dynamic published commercial opportunity deals from database
  let dynamicDealRoutes: MetadataRoute.Sitemap = []
  try {
    const deals = await db.opportunity.findMany({
      where: {
        status: { in: ['PUBLISHED', 'APPROVED'] },
        deletedAt: null,
      },
      select: {
        slug: true,
        updatedAt: true,
        createdAt: true,
      },
      take: 1000,
    })

    dynamicDealRoutes = deals.map((deal) => ({
      url: `${baseUrl}/p/${deal.slug}`,
      lastModified: deal.updatedAt || deal.createdAt || currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    }))
  } catch (error) {
    console.error('Error fetching dynamic deals for sitemap:', error)
  }

  return [...staticRoutes, ...dynamicDealRoutes]
}
