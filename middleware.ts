import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DATABASE_SESSION_COOKIE } from '@/lib/database-session'

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/otp/send',
  '/api/auth/otp/verify',
  '/api/auth/password/reset',
  '/api/health',
  '/international',
  '/grow',
  '/privacy',
  '/terms',
]

const PROTECTED_PREFIXES = ['/admin', '/business', '/partner', '/merchant', '/api/admin', '/api/business', '/api/partner']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // 1. Configure Security Headers (Phase 5)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:;"
  )

  // Skip static assets and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return response
  }

  const sessionToken = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isProtected && !sessionToken) {
    if (pathname.startsWith('/api/')) {
      const errorResp = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication session required.' },
        { status: 401 }
      )
      errorResp.headers.set('X-Content-Type-Options', 'nosniff')
      return errorResp
    }

    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('reason', 'expired')
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
