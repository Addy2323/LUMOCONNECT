export interface Country {
  countryCode: string;
  countryName: string;
  region: string;
  currencyCode: string;
  dialCode: string;
  flagCode: string;
  active: boolean;
}

export const COUNTRIES: Country[] = [
  { countryCode: "TZ", countryName: "Tanzania", region: "Africa", currencyCode: "TZS", dialCode: "+255", flagCode: "🇹🇿", active: true },
  { countryCode: "KE", countryName: "Kenya", region: "Africa", currencyCode: "KES", dialCode: "+254", flagCode: "🇰🇪", active: true },
  { countryCode: "UG", countryName: "Uganda", region: "Africa", currencyCode: "UGX", dialCode: "+256", flagCode: "🇺🇬", active: true },
  { countryCode: "RW", countryName: "Rwanda", region: "Africa", currencyCode: "RWF", dialCode: "+250", flagCode: "🇷🇼", active: true },
  { countryCode: "ZA", countryName: "South Africa", region: "Africa", currencyCode: "ZAR", dialCode: "+27", flagCode: "🇿🇦", active: true },
  { countryCode: "NG", countryName: "Nigeria", region: "Africa", currencyCode: "NGN", dialCode: "+234", flagCode: "🇳🇬", active: true },
  { countryCode: "GH", countryName: "Ghana", region: "Africa", currencyCode: "GHS", dialCode: "+233", flagCode: "🇬🇭", active: true },
  { countryCode: "EG", countryName: "Egypt", region: "Africa", currencyCode: "EGP", dialCode: "+20", flagCode: "🇪🇬", active: true },
  { countryCode: "ET", countryName: "Ethiopia", region: "Africa", currencyCode: "ETB", dialCode: "+251", flagCode: "🇪🇹", active: true },
  { countryCode: "AE", countryName: "United Arab Emirates", region: "Middle East", currencyCode: "AED", dialCode: "+971", flagCode: "🇦🇪", active: true },
  { countryCode: "SA", countryName: "Saudi Arabia", region: "Middle East", currencyCode: "SAR", dialCode: "+966", flagCode: "🇸🇦", active: true },
  { countryCode: "QA", countryName: "Qatar", region: "Middle East", currencyCode: "QAR", dialCode: "+974", flagCode: "🇶🇦", active: true },
  { countryCode: "GB", countryName: "United Kingdom", region: "Europe", currencyCode: "GBP", dialCode: "+44", flagCode: "🇬🇧", active: true },
  { countryCode: "US", countryName: "United States", region: "North America", currencyCode: "USD", dialCode: "+1", flagCode: "🇺🇸", active: true },
  { countryCode: "CA", countryName: "Canada", region: "North America", currencyCode: "CAD", dialCode: "+1", flagCode: "🇨🇦", active: true },
  { countryCode: "DE", countryName: "Germany", region: "Europe", currencyCode: "EUR", dialCode: "+49", flagCode: "🇩🇪", active: true },
  { countryCode: "FR", countryName: "France", region: "Europe", currencyCode: "EUR", dialCode: "+33", flagCode: "🇫🇷", active: true },
  { countryCode: "CH", countryName: "Switzerland", region: "Europe", currencyCode: "CHF", dialCode: "+41", flagCode: "🇨🇭", active: true },
  { countryCode: "CN", countryName: "China", region: "Asia Pacific", currencyCode: "CNY", dialCode: "+86", flagCode: "🇨🇳", active: true },
  { countryCode: "IN", countryName: "India", region: "Asia Pacific", currencyCode: "INR", dialCode: "+91", flagCode: "🇮🇳", active: true },
  { countryCode: "SG", countryName: "Singapore", region: "Asia Pacific", currencyCode: "SGD", dialCode: "+65", flagCode: "🇸🇬", active: true },
  { countryCode: "JP", countryName: "Japan", region: "Asia Pacific", currencyCode: "JPY", dialCode: "+81", flagCode: "🇯🇵", active: true },
  { countryCode: "AU", countryName: "Australia", region: "Asia Pacific", currencyCode: "AUD", dialCode: "+61", flagCode: "🇦🇺", active: true },
  { countryCode: "BR", countryName: "Brazil", region: "Latin America", currencyCode: "BRL", dialCode: "+55", flagCode: "🇧🇷", active: true },
];

export function getAllCountries(): Country[] {
  return COUNTRIES;
}

export function getCountryByCode(code: string): Country | undefined {
  if (!code) return undefined;
  return COUNTRIES.find((c) => c.countryCode.toUpperCase() === code.toUpperCase());
}

export function searchCountries(query: string): Country[] {
  if (!query) return COUNTRIES;
  const q = query.toLowerCase();
  return COUNTRIES.filter(
    (c) =>
      c.countryName.toLowerCase().includes(q) ||
      c.countryCode.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q)
  );
}
