import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi } from 'vitest'
import { ReferralsCoordinationTab, LIFECYCLE_STAGES } from '@/components/dashboards/admin/tabs/ReferralsCoordinationTab'
import { AdminToastProvider } from '@/components/dashboards/admin/AdminToast'

// Mock fetch to return sample connections
global.fetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes('/api/referrals/tickets')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tickets: [
            {
              id: 'ticket-1',
              ticketReference: 'LUMO-CON-EI5W3B',
              partnerName: 'Global Logistics Partner',
              customerFirstName: 'David',
              customerLastName: 'Miller',
              dealTitle: 'Supply of Advanced Medical Equipment',
              stage: 'SUBMITTED',
              customerEmail: 'david.miller@medequip.ch',
              relationshipWithCustomer: 'Direct Corporate Buyer',
              customerInterestLevel: 'High Priority Procurement',
              createdAt: '2026-09-17T13:28:52.000Z',
            },
            {
              id: 'ticket-2',
              ticketReference: 'LUMO CON 000542',
              partnerName: 'Alpine Traders',
              companyName: 'Zurich Medical Center',
              dealTitle: 'Supply of Advanced Medical Equipment',
              stage: 'SUCCESSFUL',
              createdAt: '2026-09-17T13:00:00.000Z',
            },
          ],
        }),
    })
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
})

describe('Admin Partner Connection Review 13-Stage Pipeline', () => {
  it('renders table, header, and all 13 pipeline stages', () => {
    const html = renderToStaticMarkup(
      <AdminToastProvider>
        <ReferralsCoordinationTab />
      </AdminToastProvider>
    )

    // Title and Subtitle
    expect(html).toContain('Partner Connection Review')
    expect(html).toContain('Qualification &amp; Introduction Control')

    // Table Column Headers
    expect(html).toContain('ID')
    expect(html).toContain('PARTNER')
    expect(html).toContain('CUSTOMER')
    expect(html).toContain('DEAL')
    expect(html).toContain('STATUS')
    expect(html).toContain('ACTIONS')

    // Verify all 13 pipeline stages are in LIFECYCLE_STAGES and rendered in the filter
    expect(LIFECYCLE_STAGES).toHaveLength(13)
    expect(html).toContain('1. Submitted')
    expect(html).toContain('2. Under Review')
    expect(html).toContain('3. Qualified')
    expect(html).toContain('4. Contacted')
    expect(html).toContain('5. Customer Interested')
    expect(html).toContain('6. Introduction Scheduled')
    expect(html).toContain('7. Introduced')
    expect(html).toContain('8. Negotiating')
    expect(html).toContain('9. Successful')
    expect(html).toContain('10. Reward Pending')
    expect(html).toContain('11. Reward Approved')
    expect(html).toContain('12. Reward Paid')
    expect(html).toContain('13. Closed')
  })
})
