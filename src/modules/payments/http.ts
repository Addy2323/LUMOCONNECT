import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'

export class PaymentError extends Error {
  constructor(message: string, public status = 400, public code = 'INVALID_PAYMENT') { super(message) }
}

import { isValidRequestOrigin } from '@/lib/origin'

export async function paymentSession(request: NextRequest) {
  const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
  if (!session) throw new PaymentError('Sign in to continue with payment.', 401, 'UNAUTHENTICATED')
  if (request.method !== 'GET') {
    if (request.headers.get('sec-fetch-site') === 'cross-site' || !isValidRequestOrigin(request)) {
      throw new PaymentError('Cross-origin payment request denied.', 403)
    }
  }
  return session
}

export function paymentErrorResponse(error: unknown) {
  const known = error instanceof PaymentError
  return NextResponse.json({ success: false, error: known ? error.message : 'Payment service unavailable. Please check the existing payment status before retrying.', code: known ? error.code : 'PAYMENT_UNAVAILABLE' }, { status: known ? error.status : 503, headers: { 'Cache-Control': 'private, no-store', ...(known && error.status === 429 ? { 'Retry-After': '600' } : {}) } })
}
