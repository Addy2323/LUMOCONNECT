import { redirect } from 'next/navigation'

// Preserve previously shared deal links, including their referral attribution.
export default async function LegacyDealPage({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ref?: string; partner?: string; lang?: string }>
}) {
  const { slug } = await params
  const query = await searchParams
  const search = new URLSearchParams()
  if (query.ref || query.partner) search.set('ref', query.ref || query.partner!)
  if (query.lang) search.set('lang', query.lang === 'sw' ? 'sw' : 'en')
  redirect(`/p/${encodeURIComponent(slug)}${search.size ? `?${search}` : ''}`)
}
