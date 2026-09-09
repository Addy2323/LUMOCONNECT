import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { accessDecision } from '@/modules/hot-deals/policy'
import { entitlements } from '@/modules/hot-deals/service'
export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params
  if (!/^[a-f0-9]{48}$/.test(code)) return new NextResponse('Referral not found.', { status: 404 })
  try {
    const asset = await db.trackingAsset.findUnique({ where: { code }, include: { participation: { include: { opportunity: { include: { hotDeal: true } } } } } })
    const deal = asset?.participation.opportunity.hotDeal
    if (!asset || !deal || asset.status !== 'ACTIVE' || asset.participation.status !== 'ACTIVE' || asset.participation.opportunity.deletedAt) return new NextResponse('Referral unavailable.', { status: 404 })
    const codes = await entitlements(db, asset.participation.partnerUserId)
    if (accessDecision(deal, codes, new Date(), true)) return new NextResponse('Referral unavailable.', { status: 403 })
    await db.trackingAsset.update({ where: { id: asset.id }, data: { clickCount: { increment: 1 } } })
    // Destination is always the access-controlled deal page. No confidential data or open redirects.
    const response = NextResponse.redirect(new URL(`/hot-deals/${deal.id}`, request.url))
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  } catch { return new NextResponse('Referral temporarily unavailable.', { status: 503 }) }
}
