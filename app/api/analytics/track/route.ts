import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { NO_STORE_HEADERS } from '@/lib/cache/policies'

function determineReferrerSource(referrer?: string | null, utmSource?: string | null): string {
  if (utmSource) {
    const src = utmSource.toLowerCase()
    if (src.includes('google')) return 'Google'
    if (src.includes('facebook') || src.includes('fb')) return 'Facebook'
    if (src.includes('instagram') || src.includes('ig')) return 'Instagram'
    if (src.includes('whatsapp') || src.includes('wa')) return 'WhatsApp'
    if (src.includes('twitter') || src.includes('x.com')) return 'X/Twitter'
    if (src.includes('linkedin')) return 'LinkedIn'
    if (src.includes('tiktok')) return 'TikTok'
    return utmSource.charAt(0).toUpperCase() + utmSource.slice(1)
  }

  if (!referrer) return 'Direct'
  const ref = referrer.toLowerCase()
  if (ref.includes('google.')) return 'Google'
  if (ref.includes('facebook.com') || ref.includes('fb.com')) return 'Facebook'
  if (ref.includes('instagram.com')) return 'Instagram'
  if (ref.includes('whatsapp.com') || ref.includes('wa.me')) return 'WhatsApp'
  if (ref.includes('twitter.com') || ref.includes('x.com') || ref.includes('t.co')) return 'X/Twitter'
  if (ref.includes('linkedin.com')) return 'LinkedIn'
  if (ref.includes('tiktok.com')) return 'TikTok'
  if (ref.includes('bing.com') || ref.includes('yahoo.com') || ref.includes('duckduckgo.com')) return 'Search Engine'
  
  return 'Other'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      visitorId,
      page = '/',
      pageTitle,
      referrer,
      deviceType = 'Desktop',
      browser,
      operatingSystem,
      country = 'Tanzania',
      city,
      utmSource,
      utmMedium,
      utmCampaign,
      userId,
      action = 'pageview',
    } = body || {}

    if (!visitorId || typeof visitorId !== 'string') {
      return NextResponse.json(
        { error: 'visitorId is required' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const now = new Date()
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000)

    // 1. Find or Upsert VisitorLog
    let visitor = await db.visitorLog.findUnique({
      where: { visitorId },
    })

    if (!visitor) {
      visitor = await db.visitorLog.create({
        data: {
          visitorId,
          userId: userId || null,
          firstSeenAt: now,
          lastSeenAt: now,
          visitCount: 1,
          country: country || 'Tanzania',
          city: city || null,
          deviceType: deviceType || 'Desktop',
          browser: browser || null,
          operatingSystem: operatingSystem || null,
        },
      })
    } else {
      visitor = await db.visitorLog.update({
        where: { visitorId },
        data: {
          lastSeenAt: now,
          userId: userId || visitor.userId,
          deviceType: deviceType || visitor.deviceType,
          browser: browser || visitor.browser,
          operatingSystem: operatingSystem || visitor.operatingSystem,
          country: country || visitor.country,
          city: city || visitor.city,
          ...(action === 'pageview' ? { visitCount: { increment: 1 } } : {}),
        },
      })
    }

    // 2. Find Active Session (last pinged within 30 minutes)
    let activeSession = await db.visitorSession.findFirst({
      where: {
        visitorLogId: visitor.id,
        lastPingAt: { gte: thirtyMinsAgo },
      },
      orderBy: { startedAt: 'desc' },
    })

    const referrerSource = determineReferrerSource(referrer, utmSource)

    if (!activeSession) {
      activeSession = await db.visitorSession.create({
        data: {
          visitorLogId: visitor.id,
          visitorId,
          startedAt: now,
          lastPingAt: now,
          entryPage: page,
          exitPage: page,
          referrer: referrer || null,
          referrerSource,
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          durationSeconds: 0,
        },
      })
    } else {
      const durationSeconds = Math.max(
        0,
        Math.round((now.getTime() - new Date(activeSession.startedAt).getTime()) / 1000)
      )
      activeSession = await db.visitorSession.update({
        where: { id: activeSession.id },
        data: {
          lastPingAt: now,
          exitPage: page,
          durationSeconds,
        },
      })
    }

    // 3. Log PageView if action === 'pageview'
    if (action === 'pageview') {
      await db.visitorPageView.create({
        data: {
          visitorLogId: visitor.id,
          sessionId: activeSession.id,
          visitorId,
          page,
          pageTitle: pageTitle || null,
          referrer: referrer || null,
          viewedAt: now,
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        visitorId,
        sessionId: activeSession.id,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error: any) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Tracking failed' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}

