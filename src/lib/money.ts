/**
 * LUMO Decimal-Safe Financial Computation Engine
 *
 * Core rule: Money follows genuine and independently verifiable economic activity.
 * All monetary amounts are handled in integer minor units (or exact integer representation)
 * to strictly prevent JavaScript floating-point errors.
 */

export const SUPPORTED_CURRENCIES = ['TZS', 'USD', 'KES', 'UGX', 'RWF'] as const
export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]

/**
 * Converts a human-readable decimal amount (e.g. 45000.50 or 45000) to minor units (bigint).
 * For TZS, 1 TZS = 100 minor units (cents) or 1 unit depending on precision. We use 100 minor units per standard currency unit.
 */
export function toMinorUnits(amount: number | string, decimals: number = 2): bigint {
  const str = typeof amount === 'number' ? amount.toFixed(decimals) : amount.trim()
  const [whole, frac = ''] = str.split('.')
  const paddedFrac = frac.padEnd(decimals, '0').slice(0, decimals)
  const sign = whole.startsWith('-') ? BigInt(-1) : BigInt(1)
  const cleanWhole = whole.replace('-', '')
  return sign * BigInt(`${cleanWhole}${paddedFrac}`)
}

/**
 * Converts minor units (bigint) back to a standard number for presentation/charting.
 */
export function fromMinorUnits(minorUnits: bigint | number | string, decimals: number = 2): number {
  const bigVal = typeof minorUnits === 'bigint' ? minorUnits : BigInt(minorUnits)
  const divisor = Math.pow(10, decimals)
  return Number(bigVal) / divisor
}

/**
 * Formats a minor-unit integer or bigint value into a clean, localized currency string.
 * Example: BigInt(4500000) (representing TZS 45,000.00) -> "TZS 45,000"
 */
export function formatMoney(
  minorUnits: bigint | number | string,
  currency: string = 'TZS',
  locale: string = 'en-TZ'
): string {
  const numericVal = fromMinorUnits(minorUnits, 2)
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: currency === 'TZS' ? 0 : 2,
    minimumFractionDigits: 0,
  })

  // Format with standard Intl or fallback nicely
  try {
    return formatter.format(numericVal)
  } catch {
    return `${currency} ${numericVal.toLocaleString(locale)}`
  }
}

/**
 * Formats whole currency units without decimals for quick dashboard badges.
 */
export function formatCompactMoney(
  minorUnits: bigint | number | string,
  currency: string = 'TZS'
): string {
  const val = fromMinorUnits(minorUnits, 2)
  if (val >= 1_000_000) {
    return `${currency} ${(val / 1_000_000).toFixed(1)}m`
  }
  if (val >= 1_000) {
    return `${currency} ${(val / 1_000).toFixed(0)}k`
  }
  return `${currency} ${val.toLocaleString()}`
}

/**
 * Computes commission from transaction gross value using integer arithmetic.
 * basisPoints (bps): 100 bps = 1.00%, 1000 bps = 10.00%
 */
export function calculateCommission({
  grossMinorUnits,
  rewardType,
  percentageBps,
  fixedAmountMinorUnits,
}: {
  grossMinorUnits: bigint
  rewardType: 'PERCENTAGE_COMMISSION' | 'FIXED_COMMISSION' | 'COST_PER_LEAD' | 'COST_PER_ACQUISITION' | 'FIXED_CAMPAIGN_FEE' | 'TIERED_COMMISSION' | 'MILESTONE_BONUS' | 'HYBRID'
  percentageBps?: number
  fixedAmountMinorUnits?: bigint
}): bigint {
  if (rewardType === 'FIXED_COMMISSION' || rewardType === 'COST_PER_LEAD' || rewardType === 'COST_PER_ACQUISITION' || rewardType === 'FIXED_CAMPAIGN_FEE') {
    return fixedAmountMinorUnits ?? BigInt(0)
  }

  if (rewardType === 'PERCENTAGE_COMMISSION' && percentageBps) {
    // Exact integer division: (gross * bps) / 10,000
    return (grossMinorUnits * BigInt(percentageBps)) / BigInt(10000)
  }

  if (rewardType === 'HYBRID') {
    const fixed = fixedAmountMinorUnits ?? BigInt(0)
    const variable = percentageBps ? (grossMinorUnits * BigInt(percentageBps)) / BigInt(10000) : BigInt(0)
    return fixed + variable
  }

  return fixedAmountMinorUnits ?? BigInt(0)
}

/**
 * Computes Withholding Tax according to Tanzania Revenue Authority (TRA) / East Africa rules.
 * e.g. 500 bps = 5% for resident individual advertising/commission.
 */
export function calculateWithholdingTax(grossCommissionMinorUnits: bigint, withholdingRateBps: number): bigint {
  if (withholdingRateBps <= 0) return BigInt(0)
  return (grossCommissionMinorUnits * BigInt(withholdingRateBps)) / BigInt(10000)
}

/**
 * Computes Platform Service Fee.
 * Standard default is 5% (500 bps) or agreed partner fee.
 */
export function calculatePlatformFee(grossCommissionMinorUnits: bigint, platformFeeBps: number = 500): bigint {
  if (platformFeeBps <= 0) return BigInt(0)
  return (grossCommissionMinorUnits * BigInt(platformFeeBps)) / BigInt(10000)
}

/**
 * Computes Net Payable Amount: Gross - Tax Withheld - Platform Fee
 */
export function calculateNetPayable({
  grossCommission,
  taxWithheld,
  platformFee,
}: {
  grossCommission: bigint
  taxWithheld: bigint
  platformFee: bigint
}): bigint {
  const net = grossCommission - taxWithheld - platformFee
  return net > BigInt(0) ? net : BigInt(0)
}
