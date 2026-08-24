import { describe, it, expect } from 'vitest'
import { evaluateTransactionRisk } from '@/modules/risk/service'

describe('Risk & Fraud Engine', () => {
  it('flags self-referrals when device or IP matches partner', () => {
    const res = evaluateTransactionRisk({
      partnerId: 'partner_alex',
      customerIp: '197.250.12.44',
      partnerIp: '197.250.12.44',
      transactionVelocityInLastHour: 1,
      orderValueTZS: 45000,
    })

    expect(res.riskLevel).toBe('CRITICAL')
    expect(res.flags).toContain('SUSPICIOUS_SELF_REFERRAL_MATCHING_DEVICE_OR_IP')
    expect(res.recommendedAction).toBe('SUSPEND_AND_BLOCK')
  })

  it('flags high-velocity burst traffic for review', () => {
    const res = evaluateTransactionRisk({
      partnerId: 'partner_alex',
      customerIp: '197.250.12.50',
      partnerIp: '197.250.12.80',
      transactionVelocityInLastHour: 25,
      orderValueTZS: 45000,
    })

    expect(res.riskLevel).toBe('HIGH')
    expect(res.flags).toContain('HIGH_VELOCITY_BURST_TRAFFIC')
    expect(res.recommendedAction).toBe('FLAG_FOR_MANUAL_REVIEW')
  })

  it('approves normal, clean transactions', () => {
    const res = evaluateTransactionRisk({
      partnerId: 'partner_alex',
      customerIp: '197.250.12.50',
      partnerIp: '197.250.12.80',
      transactionVelocityInLastHour: 2,
      orderValueTZS: 45000,
    })

    expect(res.riskLevel).toBe('LOW')
    expect(res.recommendedAction).toBe('AUTO_APPROVE')
  })
})
