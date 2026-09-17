export interface ISOCountry {
  code: string
  name: string
  flag: string
  currency: string
  dialCode: string
}

export const ISO_COUNTRIES: ISOCountry[] = [
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', currency: 'TZS', dialCode: '+255' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', dialCode: '+254' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', currency: 'UGX', dialCode: '+256' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', currency: 'RWF', dialCode: '+250' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮', currency: 'BIF', dialCode: '+257' },
  { code: 'CD', name: 'DR Congo', flag: '🇨🇩', currency: 'USD', dialCode: '+243' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', dialCode: '+971' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', dialCode: '+27' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', dialCode: '+234' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS', dialCode: '+233' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', dialCode: '+44' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', dialCode: '+1' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', dialCode: '+86' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', dialCode: '+91' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', dialCode: '+33' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR', dialCode: '+39' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR', dialCode: '+31' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', currency: 'USD', dialCode: '+90' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP', dialCode: '+20' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', dialCode: '+966' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', currency: 'QAR', dialCode: '+974' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', currency: 'OMR', dialCode: '+968' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', dialCode: '+65' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW', dialCode: '+82' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', dialCode: '+61' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', dialCode: '+1' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', dialCode: '+55' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', currency: 'ZMW', dialCode: '+260' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', currency: 'MWK', dialCode: '+265' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', currency: 'MZN', dialCode: '+258' },
]

export interface CurrencyMeta {
  code: string
  symbol: string
  name: string
  approxRateToTZS: number // Reference baseline rate
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyMeta> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', approxRateToTZS: 2600 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', approxRateToTZS: 2850 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', approxRateToTZS: 3350 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', approxRateToTZS: 708 },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', approxRateToTZS: 20 },
  UGX: { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', approxRateToTZS: 0.7 },
  RWF: { code: 'RWF', symbol: 'RF', name: 'Rwandan Franc', approxRateToTZS: 1.9 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', approxRateToTZS: 145 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', approxRateToTZS: 365 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', approxRateToTZS: 31 },
  TZS: { code: 'TZS', symbol: 'TZS', name: 'Tanzanian Shilling', approxRateToTZS: 1 },
}

export function getCountryByCode(code: string): ISOCountry | undefined {
  return ISO_COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase())
}

export function searchCountries(query: string): ISOCountry[] {
  const q = query.toLowerCase().trim()
  if (!q) return ISO_COUNTRIES
  return ISO_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.currency.toLowerCase().includes(q)
  )
}

export function convertToEstimatedTZS(amount: number, currency: string): number {
  const meta = SUPPORTED_CURRENCIES[currency.toUpperCase()]
  const rate = meta ? meta.approxRateToTZS : 2600 // fallback to USD rate
  return Math.round(amount * rate)
}

export function formatCurrencyValue(amount: number, currency: string): string {
  const curr = currency.toUpperCase()
  const meta = SUPPORTED_CURRENCIES[curr]
  const symbol = meta ? meta.symbol : curr

  if (curr === 'TZS' || curr === 'UGX' || curr === 'RWF') {
    return `${symbol} ${Math.round(amount).toLocaleString()}`
  }
  return `${symbol} ${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}
