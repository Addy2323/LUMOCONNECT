import { getMarketplaceStats } from '@/modules/deals/marketplace-stats'

export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    // No persistent cache: polling always observes publication, edits, expiry and removal.
    return Response.json(await getMarketplaceStats(), { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'Marketplace statistics unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
