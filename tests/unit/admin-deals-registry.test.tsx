import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi } from 'vitest'
import { DealsRegistryTab } from '@/components/dashboards/admin/tabs/DealsRegistryTab'
import { AdminToastProvider } from '@/components/dashboards/admin/AdminToast'

const mockDeal = {
  id: '12345678-1234-1234-1234-123456789abc',
  slug: 'independent-cargo-inspection-partner',
  title: 'Independent Cargo Inspection Partner – Tanzania to Switzerland',
  businessName: 'Jimmy B2B Introduction',
  contactPersonName: 'Jimmy B2B Introduction',
  category: 'Logistics & Trade',
  subcategory: 'Cargo Inspection',
  region: 'Tanzania -> Switzerland',
  type: 'B2B Contract',
  status: 'PUBLISHED',
  visibility: 'PUBLIC',
  originalCurrency: 'USD',
  originalDealValue: 2250000,
  targetAudience: 'Inspection / Verification Company',
  commercialResultType: 'SIGNED_B2B_CONTRACT',
  rewardDisplay: '5%',
  rewardPercentage: 5,
  rewardTrigger: 'Verified signed contract + first paid commercial activity',
  summary: 'Connect a qualified independent cargo-inspection company to a Tanzanian exporter for a 30-month international trade inspection framework.',
  description: 'Scope includes quantity verification, quality inspection, sampling, laboratory coordination, packing verification, loading supervision and inspection certificates.',
}

vi.mock('@/components/dashboards/admin/useAdminResource', () => ({
  useAdminResource: () => ({
    data: {
      deals: [mockDeal],
    },
    error: null,
    loading: false,
    retry: vi.fn(),
  }),
}))

describe('Admin Deals Registry Tab Layout', () => {
  it('renders Deals & Opportunities Repository with exact Master Repository header and table columns', () => {
    const html = renderToStaticMarkup(
      <AdminToastProvider>
        <DealsRegistryTab />
      </AdminToastProvider>
    )

    // Heading and subtitle
    expect(html).toContain('Deals &amp; Opportunities Repository')
    expect(html).toContain('Master Repository')

    // Filter controls
    expect(html).toContain('placeholder="Search deals..."')
    expect(html).toContain('All statuses')

    // Table column headers matching screenshot
    expect(html).toContain('DEAL')
    expect(html).toContain('STATUS')
    expect(html).toContain('ACTIONS')

    // Deal row data
    expect(html).toContain('Independent Cargo Inspection Partner – Tanzania to Switzerland')
    expect(html).toContain('PUBLISHED')
    expect(html).toContain('Full Review')
    expect(html).toContain('Close')
  })
})
