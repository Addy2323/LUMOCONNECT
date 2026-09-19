import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import { DiscoverOpportunitiesTab } from '@/components/dashboards/partner/tabs/DiscoverOpportunitiesTab'
import type { PartnerOpportunitySummary, PartnerSubscriptionPlan } from '@/components/dashboards/partner/types'

import { PartnerToastProvider } from '@/components/dashboards/partner/PartnerToast'

const mockSubscription: PartnerSubscriptionPlan = {
  planName: 'Partner Pro',
  status: 'ACTIVE',
  daysRemaining: 30,
  priceTZS: 25000,
  cycle: 'MONTHLY',
  expiryDate: '2026-12-31',
  autoRenew: true,
}

const mockOpp: PartnerOpportunitySummary = {
  id: 'opp-med-equip',
  slug: 'supply-of-advanced-medical-equipment',
  title: 'Supply of Advanced Medical Equipment',
  businessName: 'Global MedTech Solutions',
  isBusinessVerified: true,
  category: 'Technology',
  subcategory: 'Hospitals & Clinics',
  region: 'Switzerland',
  type: 'B2B_INTRODUCTION',
  rewardDisplay: '5%',
  rewardValueTZS: 125000000,
  activePartnersCount: 3,
  closingDate: '2026-12-31',
  publicSummary: 'Supply advanced diagnostic and imaging equipment to hospitals and clinics.',
}

describe('Partner Deal Details View matching Prototype Screenshot 1', () => {
  it('renders full-page Deal Details view when a deal is selected', () => {
    const html = renderToStaticMarkup(
      <PartnerToastProvider>
        <DiscoverOpportunitiesTab
          opportunities={[mockOpp]}
          setOpportunities={() => {}}
          subscription={mockSubscription}
          onJoinOpportunity={() => {}}
          onNavigateTab={() => {}}
          selectedOpp={mockOpp}
        />
      </PartnerToastProvider>
    )

    // Verify Deal Title and PUBLISHED status badge
    expect(html).toContain('Supply of Advanced Medical Equipment')
    expect(html).toContain('PUBLISHED')

    // Verify Category banner
    expect(html).toContain('Technology')

    // Verify Opportunity Overview
    expect(html).toContain('Opportunity Overview')
    expect(html).toContain('Supply advanced diagnostic and imaging equipment to hospitals and clinics.')

    // Verify 3 stat cards
    expect(html).toContain('DEAL VALUE')
    expect(html).toContain('PARTNER REWARD')
    expect(html).toContain('5%')
    expect(html).toContain('CLOSING')
    expect(html).toContain('2026-12-31')

    // Verify Commercial Requirements card
    expect(html).toContain('Commercial Requirements')
    expect(html).toContain('Target Customer')
    expect(html).toContain('Hospitals &amp; Clinics')
    expect(html).toContain('Location')
    expect(html).toContain('Switzerland')
    expect(html).toContain('Result Type')
    expect(html).toContain('COMPLETED_SALE')
    expect(html).toContain('Reward Trigger')
    expect(html).toContain('Signed contract and initial payment verified')
    expect(html).toContain('Visibility')
    expect(html).toContain('PUBLIC')

    // Verify connect action button
    expect(html).toContain('I Can Connect This Deal')

    // Verify back navigation link
    expect(html).toContain('Back to Find Deals')
  })

  it('renders Find Deals cards grid when no deal is selected', () => {
    const html = renderToStaticMarkup(
      <PartnerToastProvider>
        <DiscoverOpportunitiesTab
          opportunities={[mockOpp]}
          setOpportunities={() => {}}
          subscription={mockSubscription}
          onJoinOpportunity={() => {}}
          onNavigateTab={() => {}}
          selectedOpp={null}
        />
      </PartnerToastProvider>
    )

    // Shows Find Deals catalog
    expect(html).toContain('Find Deals')
    expect(html).toContain('Search published deals...')
    expect(html).toContain('View Deal')
  })
})
