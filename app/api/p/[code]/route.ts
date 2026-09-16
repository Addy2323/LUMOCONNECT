import { NextResponse } from 'next/server'
import { resolvePromoCodeAsync } from '@/modules/promotional-toolkit/public-allowlist'
import { recordPromoInteraction } from '@/modules/promotional-toolkit/analytics'

export async function GET(
  request: Request,
  props: { params: Promise<{ code: string }> }
) {
  const params = await props.params
  const code = params.code

  if (!code) {
    return NextResponse.json({ success: false, message: 'Code parameter is required.' }, { status: 400 })
  }

  const search = new URL(request.url).searchParams
  const resolution = await resolvePromoCodeAsync(code, search.get('ref') || search.get('partner') || undefined)

  if (!resolution.isValid || !resolution.dealData) {
    return NextResponse.json(
      {
        success: false,
        message: resolution.errorReason || 'Opportunity not found or no longer available.',
      },
      { status: 404 }
    )
  }

  // Record visit interaction with user-agent bot filtering
  const userAgent = request.headers.get('user-agent') || undefined
  const referrer = request.headers.get('referer') || undefined
  recordPromoInteraction(code, 'PAGE_VISIT', userAgent, referrer)

  return NextResponse.json({
    success: true,
    promoCode: resolution.promoCode,
    dealId: resolution.dealId,
    dealSlug: resolution.dealSlug,
    data: resolution.dealData,
  })
}
