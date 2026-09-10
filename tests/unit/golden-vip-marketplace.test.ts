import { describe, it, expect } from 'vitest'
import {
  createSubscriptionCheckout,
  getUserSubscription,
} from '@/modules/subscriptions/service'
import { listOpportunities } from '@/modules/deals/service'

describe('Golden VIP 24-Hour Marketplace & Escrow Engine', () => {
  it('1. Annual subscription grants 1-month FREE Golden VIP access', async () => {
    const userId = 'partner_annual_vip_test'
    const checkout = await createSubscriptionCheckout({
      userId,
      userRole: 'PARTNER',
      planCode: 'ANNUAL',
      amountTZS: 180000,
      paymentMethod: 'MPESA',
      phoneNumber: '+255712345678',
    })

    expect(checkout.success).toBe(true)
    expect(checkout.status).toBe('ACTIVE')

    const sub = getUserSubscription(userId)
    expect(sub).toBeDefined()
    expect(sub?.planCode).toBe('ANNUAL')
    expect(sub?.isActive).toBe(true)
    expect(sub?.isGoldenVip).toBe(true)
    expect(sub?.hasGoldenVipAccess).toBe(true)
    expect(sub?.freeVipMonthsBonus).toBe(1)
  })

  it('2. Direct Golden VIP subscription activates VIP access immediately', async () => {
    const userId = 'partner_direct_vip_test'
    const checkout = await createSubscriptionCheckout({
      userId,
      userRole: 'PARTNER',
      planCode: 'GOLDEN_VIP',
      amountTZS: 65000,
      paymentMethod: 'MPESA',
      phoneNumber: '+255712345678',
    })

    expect(checkout.success).toBe(true)
    expect(checkout.status).toBe('ACTIVE')

    const sub = getUserSubscription(userId)
    expect(sub?.planCode).toBe('GOLDEN_VIP')
    expect(sub?.isGoldenVip).toBe(true)
    expect(sub?.hasGoldenVipAccess).toBe(true)
  })

  it('3. Standard Monthly subscription does NOT have Golden VIP priority access', async () => {
    const userId = 'partner_monthly_test'
    const checkout = await createSubscriptionCheckout({
      userId,
      userRole: 'PARTNER',
      planCode: 'MONTHLY',
      amountTZS: 25000,
      paymentMethod: 'MPESA',
      phoneNumber: '+255712345678',
    })

    expect(checkout.success).toBe(true)
    expect(checkout.status).toBe('ACTIVE')

    const sub = getUserSubscription(userId)
    expect(sub?.isActive).toBe(true)
    expect(sub?.hasGoldenVipAccess).toBe(false)
    expect(sub?.isGoldenVip).toBe(false)
  })

  it('4. Golden VIP opportunities specify 24h exclusivity windows and quality scores', () => {
    const opportunities = listOpportunities()
    const vipOpportunities = opportunities.filter((o) => o.isGoldenVip)

    expect(vipOpportunities.length).toBeGreaterThanOrEqual(2)

    for (const opp of vipOpportunities) {
      expect(opp.isGoldenVip).toBe(true)
      expect(opp.vipAccessStartAt).toBeDefined()
      expect(opp.vipReleaseAt).toBeDefined()

      // Exclusivity window calculation
      const startMs = new Date(opp.vipAccessStartAt!).getTime()
      const endMs = new Date(opp.vipReleaseAt!).getTime()
      const windowHours = (endMs - startMs) / (1000 * 60 * 60)
      expect(windowHours).toBeCloseTo(24, 0.1)

      // Quality specs & escrow parameters
      expect(opp.qualityScore).toBeGreaterThanOrEqual(90)
      expect(opp.inspectionWindowHours).toBe(48)
      expect(opp.productCondition).toBeDefined()
      expect(opp.sellerPhone).toBeDefined()
    }
  })

  it('5. Marketplace filters support VIP filter parameter', () => {
    const all = listOpportunities()
    const vipOnly = listOpportunities({ vipFilter: 'VIP_ONLY' })
    const standardOnly = listOpportunities({ vipFilter: 'PARTNER_ONLY' })

    expect(vipOnly.every((o) => o.isGoldenVip)).toBe(true)
    expect(standardOnly.every((o) => !o.isGoldenVip)).toBe(true)
    expect(vipOnly.length + standardOnly.length).toBe(all.length)
  })
})
