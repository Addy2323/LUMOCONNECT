import { describe, it, expect } from 'vitest'
import {
  computeTermsHash,
  generateDefaultAgreementTerms,
  recordTermsAcceptance,
  getTermsAcceptance,
} from '@/modules/deals/agreements'

describe('Reward Funding Gate & Electronic Terms Acceptance', () => {
  it('generates canonical SHA-256 terms hash and records electronic acceptance', () => {
    const terms = generateDefaultAgreementTerms({
      opportunityId: 'opp_gate_test_01',
      versionNumber: 1,
      title: 'Solar Water Heaters Expansion',
      customerPriceDisplay: 'TZS 1,200,000',
      rewardAmountDisplay: 'TZS 120,000',
    })

    const hash = computeTermsHash(terms)
    expect(hash).toBeDefined()
    expect(hash.length).toBe(64) // SHA-256 hex string

    const record = recordTermsAcceptance({
      opportunityId: 'opp_gate_test_01',
      versionNumber: 1,
      userId: 'partner_alex',
      userRole: 'PARTNER',
      termsHash: hash,
      ipAddress: '197.250.12.8',
    })

    expect(record.id).toBeDefined()
    expect(record.termsHash).toBe(hash)

    const fetched = getTermsAcceptance('opp_gate_test_01', 'partner_alex', 1)
    expect(fetched?.ipAddress).toBe('197.250.12.8')
  })
})
