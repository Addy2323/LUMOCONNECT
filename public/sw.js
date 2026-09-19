/**
 * Lumo Dealers - Safe Service Worker
 * Version: 1.0.1
 * 
 * Strict Zero-Risk Caching Policy:
 * - NEVER caches authenticated, administrative, referral, OTP or payment endpoints.
 * - Prevents stale cache bypass of subscriptions, VIP access, account status, or logout.
 * - Navigation falls back to bilingual /offline.html on network failure.
 */

const CACHE_VERSION = 'lumo-pwa-v1.0.2'
const STATIC_CACHE_NAME = `lumo-static-${CACHE_VERSION}`

// Core static assets to precache for offline shell
const PRECACHE_ASSETS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-192x192.png',
  '/icons/maskable-icon-512x512.png',
  '/icons/icon.svg',
]

// Paths that must NEVER be cached under any circumstances
const SENSITIVE_URL_PATTERNS = [
  /\/api\/identity\//i,
  /\/api\/auth\//i,
  /\/api\/otp\//i,
  /\/api\/subscriptions\//i,
  /\/api\/payments\//i,
  /\/api\/referrals\//i,
  /\/api\/deals\/protected/i,
  /\/api\/admin\//i,
  /\/api\/disputes\//i,
  /\/api\/payouts\//i,
  /\/api\/orders\//i,
  /\/api\/webhooks\//i,
  /\/verify/i,
  /\/p\//i,
  /\/partner\/opportunity\//i,
]

// Install event: Precache core assets
self.addEventListener('install', (event) => {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    self.skipWaiting()
    return
  }
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      // Precache critical shell assets
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[LUMO SW] Precache partial error (ignored):', err)
      })
    })
  )
})

// Activate event: Clean up obsolete caches
self.addEventListener('activate', (event) => {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => Promise.all(cacheNames.map((c) => caches.delete(c))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
        .then(() => self.clients.matchAll({ type: 'window' }))
        .then((clients) => {
          for (const client of clients) {
            client.navigate(client.url)
          }
        })
    )
    return
  }

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('lumo-') && cacheName !== STATIC_CACHE_NAME)
          .map((cacheName) => {
            console.log('[LUMO SW] Removing obsolete cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    }).then(() => self.clients.claim())
  )
})

// Listen for SKIP_WAITING message from update banner
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Check if request is sensitive and must not be cached
function isSensitiveRequest(request) {
  // Only GET requests are eligible for caching
  if (request.method !== 'GET') {
    return true
  }

  const url = request.url

  // Any API call is strictly network-only (never cached)
  if (url.includes('/api/')) {
    return true
  }

  // Any RSC (React Server Components) payload or Next.js server action/data request
  if (url.includes('_rsc=') || request.headers.get('RSC') === '1' || request.headers.get('Next-Router-State-Tree')) {
    return true
  }

  // Development, HMR, and Turbopack chunks must never be cached to prevent stale module factory mismatches
  if (
    url.includes('turbopack') ||
    url.includes('hot-update') ||
    url.includes('/_next/static/development/') ||
    url.includes('/_next/static/webpack/')
  ) {
    return true
  }

  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    if (url.includes('/_next/static/')) {
      return true
    }
  }

  // Check explicit sensitive patterns
  for (const pattern of SENSITIVE_URL_PATTERNS) {
    if (pattern.test(url)) {
      return true
    }
  }

  return false
}

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin or static CDN assets
  if (url.origin !== self.location.origin) {
    return
  }

  // 1. Sensitive endpoints and API mutations: STRICT NETWORK-ONLY (Never intercepted or cached)
  if (isSensitiveRequest(request)) {
    // Return early without calling event.respondWith() so the browser handles it natively
    return
  }

  // 2. Navigation requests (Page loading): Network-First, with bilingual offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If network is completely unavailable, show bilingual offline screen
          return caches.match('/offline.html').then((offlineResponse) => {
            return offlineResponse || new Response('Offline - Reconnect to continue', {
              headers: { 'Content-Type': 'text/plain' },
              status: 503,
            })
          })
        })
    )
    return
  }

  // 3. Static Next.js assets, icons, fonts, images: Cache-First with Network fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone()
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return networkResponse
        }).catch(() => {
          // Non-critical static asset fetch failed
          return new Response('', { status: 408 })
        })
      })
    )
    return
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request)
      if (cached) return cached
      return new Response('Offline or Network Error', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' },
      })
    })
  )
})
