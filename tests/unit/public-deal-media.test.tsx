import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import { PublicLandingClientView } from '../../app/p/[code]/PublicLandingClientView'
import type { PromoCodeResolution } from '@/modules/promotional-toolkit/public-allowlist'

const resolution: PromoCodeResolution = {
  isValid: true, promoCode: 'LUMO-PARTNER-HIACE', dealId: 'hiace', dealSlug: 'hiace', partnerUserId: 'PARTNER', partnerName: 'Partner',
  dealData: {
    id: 'hiace', slug: 'hiace', title: 'Toyota Hiace', summary: 'Vehicle overview', description: 'Service history and interior photos are included.',
    category: 'Vehicles', region: 'Arusha', countryCode: 'TZ', currency: 'TZS', opportunityType: 'PRODUCT_SALES',
    status: 'PUBLISHED', availabilityStatus: 'AVAILABLE', publisherName: 'Lumo Dealers', coordinationNote: '',
    featuredImageUrl: 'https://example.com/hiace.jpg', galleryImageUrls: ['https://example.com/hiace.jpg', 'https://example.com/interior.jpg'],
    promoVideoUrl: 'https://example.com/hiace.mp4',
  },
}

describe('Public deal media', () => {
  it('renders the supplied images, video, and full description', () => {
    const html = renderToStaticMarkup(<PublicLandingClientView code={resolution.promoCode} initialLang="EN" resolution={resolution} />)
    expect(html).toContain('https://example.com/interior.jpg')
    expect(html).toContain('<video')
    expect(html).toContain('https://example.com/hiace.mp4')
    expect(html).toContain('Service history and interior photos are included.')
  })

  it('does not show a video player when no video was provided', () => {
    const html = renderToStaticMarkup(<PublicLandingClientView code={resolution.promoCode} initialLang="EN" resolution={{ ...resolution, dealData: { ...resolution.dealData!, promoVideoUrl: undefined } }} />)
    expect(html).not.toContain('<video')
    expect(html).not.toContain('<iframe')
  })
})
