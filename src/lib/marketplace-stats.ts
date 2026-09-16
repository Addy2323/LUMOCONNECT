import { z } from 'zod'

// Blank means unknown; never infer commercial value from commission or funding.
export const commercialValueSchema = z.preprocess(value => value === '' || value === undefined ? null : value,
  z.union([z.string().regex(/^\d{1,13}(\.\d{1,2})?$/), z.number().finite().nonnegative().max(9999999999999).refine(value => /^\d+(\.\d{1,2})?$/.test(String(value)), 'Use at most two decimal places')])
    .nullable().transform(value => {
      if (value === null) return null
      const [whole, fraction = ''] = String(value).split('.')
      return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
    }))

export type MarketplaceStats = { totalOpportunityValue: string; currency: 'TZS'; activeDeals: number; activePartners: number; verifiedResults: number; updatedAt: string }

export function compactOpportunityValue(value: string) {
  const whole = BigInt(value.split('.')[0])
  for (const [scale, suffix] of [[1000000000000n, 'T'], [1000000000n, 'B'], [1000000n, 'M']] as const) {
    if (whole >= scale) {
      const hundredths = whole * 100n / scale
      const decimal = String(hundredths % 100n).padStart(2, '0').replace(/0+$/, '')
      return `${hundredths / 100n}${decimal ? `.${decimal}` : ''}${suffix}${whole % scale ? '+' : ''}`
    }
  }
  return Number(value).toLocaleString('en-TZ', { maximumFractionDigits: 2 })
}
