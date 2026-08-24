import { describe, it, expect } from 'vitest'
import { calculateDealEconomics } from '@/modules/deals/economics'

describe('Deal Economics & Settlement Preview Calculator', () => {
  it('calculates settlement preview for prepaid escrow model with percentage reward', () => {
    const result = calculateDealEconomics({
      customerPriceTZS: 30000000, // TZS 30,000,000
      rewardType: 'PERCENTAGE_COMMISSION',
      rewardValue: 16.666667, // ~TZS 5,000,000
      availableRewardCount: 5,
      fundingModel: 'PREPAID_ESCROW',
      lumoFeeBps: 500, // 5%
      providerFeeBps: 100, // 1%
      taxRateBps: 500, // 5% TRA withholding
    })

    expect(result.customerPriceMinor).toBe(3000000000n) // TZS 30m in minor units
    expect(result.fundingModel).toBe('PREPAID_ESCROW')
    expect(result.requiredEscrowPreFundMinor).toBeGreaterThan(0n)
    expect(result.displays.customerPrice).toContain('30,000,000')
  })

  it('calculates settlement preview for deducted-from-sale model with fixed reward', () => {
    const result = calculateDealEconomics({
      customerPriceTZS: 450000, // TZS 450,000
      rewardType: 'FIXED_COMMISSION',
      rewardValue: 45000, // TZS 45,000
      availableRewardCount: 10,
      fundingModel: 'DEDUCTED_FROM_SALE',
    })

    expect(result.requiredEscrowPreFundMinor).toBe(0n) // No pre-funding needed
    expect(result.grossRewardPerUnitMinor).toBe(4500000n) // TZS 45,000

    // Partner net = Gross (45k) - 5% tax (2,250) - 5% LUMO fee (2,250) = 40,500
    expect(result.partnerNetPayoutPerUnitMinor).toBe(4050000n)

    // Merchant net = 450,000 - 45,000 - 1.5% gateway fee (6,750) = 398,250
    expect(result.merchantEstimatedNetPerUnitMinor).toBe(39825000n)
  })
})
