import { describe, it, expect } from 'vitest'
import {
  verifyPayoutMethodSafety,
  authorizePayoutBatch,
  LARGE_PAYOUT_THRESHOLD_MINOR,
} from '@/modules/payouts/service'

describe('Payout Controls, Cooling-Off & Safety Constraints', () => {
  it('enforces 24-hour cooling-off period on newly modified payout accounts', () => {
    const freshMethodDate = new Date(Date.now() - 2 * 3600 * 1000) // Added 2 hours ago

    const check = verifyPayoutMethodSafety({
      methodCreatedAt: freshMethodDate,
      registeredName: 'Alex Mushi',
      accountHolderName: 'Alex Mushi',
      totalAmountMinor: 50000000n, // TZS 500k
    })

    expect(check.isSafe).toBe(false)
    expect(check.isCoolingOff).toBe(true)
    expect(check.error).toContain('held for 24 hours')
  })

  it('rejects payout when account holder name mismatches registered profile', () => {
    const matureMethodDate = new Date(Date.now() - 48 * 3600 * 1000) // Added 48 hours ago

    const check = verifyPayoutMethodSafety({
      methodCreatedAt: matureMethodDate,
      registeredName: 'Alex Mushi',
      accountHolderName: 'John Doe Unknown',
      totalAmountMinor: 50000000n,
    })

    expect(check.isSafe).toBe(false)
    expect(check.nameMatches).toBe(false)
    expect(check.error).toContain('NAME_MISMATCH')
  })

  it('allows safe payout when cooling-off passed and names match', () => {
    const matureMethodDate = new Date(Date.now() - 72 * 3600 * 1000)

    const check = verifyPayoutMethodSafety({
      methodCreatedAt: matureMethodDate,
      registeredName: 'Alex Mushi',
      accountHolderName: 'Alex Mushi',
      totalAmountMinor: 50000000n,
    })

    expect(check.isSafe).toBe(true)
    expect(check.isCoolingOff).toBe(false)
    expect(check.nameMatches).toBe(true)
  })
})
