import { describe, it, expect } from 'vitest'
import {
  openDispute,
  addDisputeMessage,
  resolveDispute,
  listDisputes,
  getDisputeById,
} from '@/modules/disputes/service'

describe('Dispute Resolution & Escrow Claim Lifecycle', () => {
  it('opens a new dispute and sets status to OPENED', () => {
    const dispute = openDispute({
      organizationId: 'org_test_solar',
      dealTitle: 'Kijani Solar Installations',
      partnerName: 'Alex Mushi',
      title: 'Missing commission for installation #992',
      reason: 'Work order signed and customer paid down payment on Aug 19.',
      amountTZS: 'TZS 45,000',
      initialEvidence: 'https://storage.lumo.co.tz/evidence/card_992.pdf',
      openedBy: 'Alex Mushi (Partner)',
    })

    expect(dispute.id).toBeDefined()
    expect(dispute.disputeNumber).toContain('LUMO-DISP-')
    expect(dispute.status).toBe('OPENED')
    expect(dispute.messages.length).toBe(2) // Initial message + system explanation
  })

  it('adds messages to dispute thread and transitions status to UNDER_REVIEW', () => {
    const dispute = openDispute({
      organizationId: 'org_test_solar',
      dealTitle: 'Kijani Solar Installations',
      partnerName: 'Alex Mushi',
      title: 'Under Review Test',
      reason: 'Test reason',
      amountTZS: 'TZS 45,000',
      openedBy: 'Alex Mushi',
    })

    const updated = addDisputeMessage({
      disputeId: dispute.id,
      sender: 'Kijani Solar Support',
      text: 'Checking field dispatch log with Morogoro technician.',
    })

    expect(updated.status).toBe('UNDER_REVIEW')
    expect(updated.messages.length).toBe(3)
  })

  it('resolves dispute in partner favor with arbitration notes', () => {
    const dispute = openDispute({
      organizationId: 'org_test_solar',
      dealTitle: 'Kijani Solar Installations',
      partnerName: 'Alex Mushi',
      title: 'Arbitration Test',
      reason: 'Test reason',
      amountTZS: 'TZS 45,000',
      openedBy: 'Alex Mushi',
    })

    const resolved = resolveDispute({
      disputeId: dispute.id,
      decision: 'RESOLVED_PARTNER_FAVOR',
      resolutionNotes: 'Technician verified installation in GPS audit logs.',
      resolverId: 'admin_compliance_01',
    })

    expect(resolved.status).toBe('RESOLVED_PARTNER_FAVOR')
    const fetched = getDisputeById(dispute.id)
    expect(fetched?.status).toBe('RESOLVED_PARTNER_FAVOR')
  })

  it('lists active disputes', () => {
    const all = listDisputes()
    expect(all.length).toBeGreaterThan(0)
  })
})
