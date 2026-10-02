'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'VIS-ANONYMOUS'
  try {
    let vid = localStorage.getItem('lumo_visitor_id')
    if (!vid || !vid.startsWith('VIS-')) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      let code = ''
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      vid = `VIS-${code}`
      localStorage.setItem('lumo_visitor_id', vid)
    }
    return vid
  } catch {
    return 'VIS-DEFAULT'
  }
}

function detectDevice(): 'Mobile' | 'Tablet' | 'Desktop' {
  if (typeof window === 'undefined') return 'Desktop'
  const ua = navigator.userAgent || ''
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return 'Tablet'
  if (/Mobile|iPhone|Android/i.test(ua) || window.innerWidth < 768) return 'Mobile'
  return 'Desktop'
}

function detectBrowser(): string {
  if (typeof window === 'undefined') return 'Unknown Browser'
  const ua = navigator.userAgent
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  if (ua.includes('Safari/')) return 'Safari'
  if (ua.includes('Opera/') || ua.includes('OPR/')) return 'Opera'
  return 'Browser'
}

function detectOS(): string {
  if (typeof window === 'undefined') return 'Unknown OS'
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('Linux')) return 'Linux'
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
  return 'OS'
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    // Avoid duplicate tracks for identical route within 1s
    if (lastTrackedPath.current === fullPath) return
    lastTrackedPath.current = fullPath

    const visitorId = getOrCreateVisitorId()
    const deviceType = detectDevice()
    const browser = detectBrowser()
    const operatingSystem = detectOS()

    const utmSource = searchParams?.get('utm_source') || null
    const utmMedium = searchParams?.get('utm_medium') || null
    const utmCampaign = searchParams?.get('utm_campaign') || null

    const payload = {
      visitorId,
      page: fullPath || '/',
      pageTitle: typeof document !== 'undefined' ? document.title : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      deviceType,
      browser,
      operatingSystem,
      utmSource,
      utmMedium,
      utmCampaign,
      action: 'pageview',
    }

    // Fire tracking call
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})

    // Set up heartbeat ping every 30 seconds for live status
    const interval = setInterval(() => {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          page: fullPath || '/',
          deviceType,
          browser,
          operatingSystem,
          action: 'heartbeat',
        }),
      }).catch(() => {})
    }, 30000)

    return () => clearInterval(interval)
  }, [pathname, searchParams])

  return null
}
