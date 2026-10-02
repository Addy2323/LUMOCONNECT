import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://lumoconnect.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/catalog',
          '/hot-deals',
          '/international',
          '/subscriptions',
          '/choose-path',
          '/signin',
          '/signup',
          '/p/',
          '/d/',
        ],
        disallow: [
          '/admin/',
          '/partner/',
          '/business/',
          '/api/',
          '/dealroom/',
          '/statement/',
          '/checkout/',
          '/verify/',
          '/hot-deals/admin/',
          '/hot-deals/private-member/',
          '/hot-deals/account/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
