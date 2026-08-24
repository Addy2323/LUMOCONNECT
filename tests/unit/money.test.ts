import { describe, it, expect } from 'vitest'
import {
  toMinorUnits,
  fromMinorUnits,
  calculateCommission,
  calculateWithholdingTax,
  calculatePlatformFee,
  calculateNetPayable,
  formatMoney,
} from '@/lib/money'

describe('Decimal-Safe Money Engine', () => {
  it('converts decimal amounts to integer minor units without floating-point errors', () => {
    expect(toMinorUnits(45000)).toBe(BigInt(4500000))
    expect(toMinorUnits('45000.50')).toBe(BigInt(4500050))
    expect(toMinorUnits('100.05')).toBe(BigInt(10005))
  })

  it('converts minor units back to decimal number', () => {
    expect(fromMinorUnits(BigInt(4500000))).toBe(45000)
    expect(fromMinorUnits(BigInt(10005))).toBe(100.05)
  })

  it('computes percentage commissions accurately', () => {
    // 15% on TZS 100,000.00 (10,000,000 minor units) = 1,500,000 minor units (TZS 15,000)
    const gross = BigInt(10000000)
    const comm = calculateCommission({
      grossMinorUnits: gross,
      rewardType: 'PERCENTAGE_COMMISSION',
      percentageBps: 1500, // 15.00%
    })
    expect(comm).toBe(BigInt(1500000))
  })

  it('calculates statutory TRA withholding tax (5%)', () => {
    const grossCommission = BigInt(2500000) // TZS 25,000
    const tax = calculateWithholdingTax(grossCommission, 500) // 5%
    expect(tax).toBe(BigInt(125000)) // TZS 1,250
  })

  it('calculates net payable amount after tax and platform fee', () => {
    const gross = BigInt(10000000) // TZS 100,000
    const tax = calculateWithholdingTax(gross, 500) // 5% = 500,000 (TZS 5,000)
    const fee = calculatePlatformFee(gross, 500) // 5% = 500,000 (TZS 5,000)
    const net = calculateNetPayable({ grossCommission: gross, taxWithheld: tax, platformFee: fee })
    expect(net).toBe(BigInt(9000000)) // TZS 90,000 (90%)
  })

  it('formats currency correctly for TZS', () => {
    const formatted = formatMoney(BigInt(4500000), 'TZS')
    expect(formatted).toContain('45,000')
  })
})
