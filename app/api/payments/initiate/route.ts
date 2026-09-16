import { NextRequest, NextResponse } from 'next/server'
import { initiateCheckout, paymentInput, paymentView } from '@/modules/payments/checkout'
import { paymentSession, PaymentError, paymentErrorResponse } from '@/modules/payments/http'

export async function POST(request: NextRequest) {
  try {
    const session = await paymentSession(request)
    const parsed = paymentInput.safeParse(await request.json().catch(() => null))
    if (!parsed.success) throw new PaymentError('Select a saved order or plan, provide a valid phone and confirm Pay Now.')
    // Forwarded IP is used only for rate limits; trusted proxy configuration is required.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const attempt = await initiateCheckout(parsed.data, { id: session.userId, name: session.user.name, email: session.user.email, roles: session.user.roleAssignments.map(a => a.role.code) }, ip)
    return NextResponse.json({ success: true, data: paymentView(attempt) }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return paymentErrorResponse(error) }
}
