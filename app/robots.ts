import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block private/app areas. Do NOT list /signin or /signup here:
        // if robots.txt blocks them, Google can never see their noindex tag.
        disallow: ['/api/', '/dashboard/', '/admin/'],
      },
    ],
    sitemap: 'https://lumo.co.tz/sitemap.xml',
  }
}

