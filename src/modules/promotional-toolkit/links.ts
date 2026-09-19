export function buildPublicDealUrl(dealId: string, referralCode: string, language: 'en' | 'sw' = 'en') {
  const url = new URL(`/p/${encodeURIComponent(dealId)}`, 'https://lumo.co.tz')
  if (referralCode) url.searchParams.set('ref', referralCode)
  url.searchParams.set('lang', language)
  return url.toString()
}
