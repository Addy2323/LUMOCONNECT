import { NextRequest } from 'next/server'

/**
 * Validates whether an incoming HTTP request originated from an authorized origin or referer.
 * Reliably handles reverse proxies (Nginx, Traefik, Cloudflare) where request.nextUrl.origin
 * may differ in scheme (http vs https) or internal port from the client-facing origin.
 */
export function isValidRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // If neither origin nor referer is provided (e.g. direct server-to-server or non-browser client),
  // we allow the request to proceed; CSRF typically targets browser sessions where headers exist.
  if (!origin && !referer) {
    return true
  }

  const source = origin || referer
  if (!source) return true

  try {
    const sourceUrl = new URL(source)
    const sourceHostname = sourceUrl.hostname.toLowerCase()

    // 1. Direct match with Next.js resolved hostname
    if (sourceHostname === request.nextUrl.hostname.toLowerCase()) {
      return true
    }

    // 2. Check standard proxy headers (X-Forwarded-Host, Host)
    const forwardedHost = request.headers.get('x-forwarded-host')
    if (forwardedHost) {
      const forwardedHostname = forwardedHost.split(':')[0].trim().toLowerCase()
      if (sourceHostname === forwardedHostname) {
        return true
      }
    }

    const hostHeader = request.headers.get('host')
    if (hostHeader) {
      const hostHostname = hostHeader.split(':')[0].trim().toLowerCase()
      if (sourceHostname === hostHostname) {
        return true
      }
    }

    // 3. Match against configured environment URLs
    const envUrls = [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.BETTER_AUTH_URL,
      process.env.APP_URL,
    ].filter(Boolean) as string[]

    for (const envUrl of envUrls) {
      try {
        const u = new URL(envUrl)
        if (sourceHostname === u.hostname.toLowerCase()) {
          return true
        }
      } catch {
        // Ignore malformed env strings
      }
    }

    // 4. Platform allowed hosts and subdomains
    const trustedHosts = [
      'lumo.co.tz',
      'www.lumo.co.tz',
      'localhost',
      '127.0.0.1',
    ]
    if (trustedHosts.includes(sourceHostname)) {
      return true
    }

    if (sourceHostname.endsWith('.lumo.co.tz')) {
      return true
    }

    return false
  } catch {
    return false
  }
}
