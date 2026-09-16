import React from 'react'
import type { Metadata } from 'next'
import { resolvePromoCodeAsync } from '@/modules/promotional-toolkit/public-allowlist'
import { PublicLandingClientView } from './PublicLandingClientView'

interface PublicProductPageProps {
  params: Promise<{ code: string }>
  searchParams: Promise<{ lang?: string; ref?: string; partner?: string }>
}

export async function generateMetadata({ params, searchParams }: PublicProductPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const code = resolvedParams.code
  const lang = resolvedSearchParams.lang === 'sw' ? 'sw' : 'en'

  const resolution = await resolvePromoCodeAsync(code, resolvedSearchParams.ref || resolvedSearchParams.partner)

  if (!resolution.isValid || !resolution.dealData) {
    return {
      title: 'Opportunity Not Found | Lumo Dealers',
      description: 'The requested opportunity is no longer available on Lumo Dealers.',
    }
  }

  const deal = resolution.dealData
  const title = lang === 'sw' && deal.titleSw ? deal.titleSw : deal.title
  const description = lang === 'sw' && deal.summarySw ? deal.summarySw : deal.summary
  const ogImage = deal.featuredImageUrl || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&h=630&q=90'

  return {
    title: `${title} | Lumo Dealers`,
    description: `${description} • Coordinated via Lumo Dealers Tanzania.`,
    openGraph: {
      title: `${title} | Lumo Dealers`,
      description,
      url: `https://lumo.co.tz/p/${code}`,
      siteName: 'Lumo Dealers Tanzania',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: lang === 'sw' ? 'sw_TZ' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function PublicProductPage({ params, searchParams }: PublicProductPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  const code = resolvedParams.code
  const initialLang = resolvedSearchParams.lang === 'sw' ? 'SW' : 'EN'
  const resolution = await resolvePromoCodeAsync(code, resolvedSearchParams.ref || resolvedSearchParams.partner)

  return (
    <PublicLandingClientView
      code={resolution.promoCode || code}
      initialLang={initialLang}
      resolution={resolution}
    />
  )
}
