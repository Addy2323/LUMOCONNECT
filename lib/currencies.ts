export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  estimatedRateToUSD: number; // For indicative estimations
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", estimatedRateToUSD: 1.0 },
  TZS: { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", estimatedRateToUSD: 0.00038 },
  KES: { code: "KES", symbol: "KSh", name: "Kenyan Shilling", estimatedRateToUSD: 0.0077 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", estimatedRateToUSD: 1.09 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", estimatedRateToUSD: 1.30 },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham", estimatedRateToUSD: 0.27 },
  SAR: { code: "SAR", symbol: "SAR", name: "Saudi Riyal", estimatedRateToUSD: 0.27 },
  ZAR: { code: "ZAR", symbol: "R", name: "South African Rand", estimatedRateToUSD: 0.056 },
};

export function formatCurrency(
  amount: number | bigint | string | null | undefined,
  currencyCode = "USD"
): string {
  if (amount === null || amount === undefined) return "N/A";
  const num = typeof amount === "bigint" ? Number(amount) : Number(amount);
  if (isNaN(num)) return "N/A";

  const config = CURRENCIES[currencyCode.toUpperCase()] || {
    code: currencyCode,
    symbol: currencyCode,
    name: currencyCode,
  };

  const formattedNum = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(num);

  return `${config.code} ${formattedNum}`;
}

export function getEstimatedTZSEquivalent(
  amount: number | bigint | string,
  currencyCode = "USD"
): string {
  const num = typeof amount === "bigint" ? Number(amount) : Number(amount);
  if (isNaN(num) || num <= 0) return "";
  if (currencyCode.toUpperCase() === "TZS") return "";

  const config = CURRENCIES[currencyCode.toUpperCase()];
  if (!config) return "";

  // Convert to USD then to TZS
  const usdVal = num * config.estimatedRateToUSD;
  const tzsVal = usdVal / CURRENCIES["TZS"].estimatedRateToUSD;

  const formattedTZS = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(tzsVal);

  return `Approx. TZS ${formattedTZS}`;
}
