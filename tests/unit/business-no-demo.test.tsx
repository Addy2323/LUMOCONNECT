import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { BusinessRecords } from '@/components/dashboards/business/BusinessRecords'
import { CATEGORY_REWARD_CONFIG } from '@/components/dashboards/business/tabs/CreateOpportunityWizardModal'
import { LandingPage } from '@/components/marketplace/LandingPage'

it('does not render fictional wallets or partner records while loading', () => {
  const html = renderToStaticMarkup(<BusinessRecords kind="payments" title="Payments" description="Your records" />)
  expect(html).toContain('Loading your business records')
  for (const text of ['22M', 'Latifa', 'Kassim', '2.8M', 'Settle all']) expect(html).not.toContain(text)
})
it('does not prefill category reward amounts or commercial examples', () => {
  for (const config of Object.values(CATEGORY_REWARD_CONFIG)) {
    expect(config.defaultBaselinePriceTZS).toBe(0)
    expect(config.defaultRewardValueTZS).toBe(0)
    expect(config.defaultRewardPercent).toBe(0)
    expect(config.detailedDealFlow).toBe('')
  }
})
it('does not show sample private deal cards when live data is empty', () => {
  const html = renderToStaticMarkup(<LandingPage onExplore={() => {}} onJoin={() => {}} onCategory={() => {}} />)
  expect(html).not.toContain('TZS 45,000,000')
  expect(html).not.toContain('18:42:10')
  expect(html).toContain('No private deals available')
})
