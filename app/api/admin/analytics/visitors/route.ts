import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function formatAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} d ago`
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  if (mins < 60) return `${mins}m ${secs}s`
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  return `${hrs}h ${remMins}m`
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30days'
    const specificVisitorId = searchParams.get('visitorId')

    const now = new Date()
    let startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    let isHourly = false

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      isHourly = true
    } else if (period === '7days') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === '30days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (period === '6months') {
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
    } else if (period === '1year') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    }

    // 1. Specific Visitor Detailed Lookup (if requested by Admin)
    if (specificVisitorId) {
      const visitor = await db.visitorLog.findUnique({
        where: { visitorId: specificVisitorId },
        include: {
          sessions: {
            orderBy: { startedAt: 'desc' },
            take: 20,
            include: {
              pageViews: {
                orderBy: { viewedAt: 'asc' },
              },
            },
          },
          pageViews: {
            orderBy: { viewedAt: 'desc' },
            take: 50,
          },
        },
      })

      if (!visitor) {
        return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
      }

      const firstVisit = visitor.sessions[visitor.sessions.length - 1]
      const lastVisit = visitor.sessions[0]
      const entryPage = firstVisit?.entryPage || '/'
      const exitPage = lastVisit?.exitPage || '/'
      const totalDuration = visitor.sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0)

      return NextResponse.json({
        visitor: {
          visitorId: visitor.visitorId,
          userId: visitor.userId,
          firstSeenAt: visitor.firstSeenAt,
          lastSeenAt: visitor.lastSeenAt,
          visitCount: visitor.visitCount,
          country: visitor.country,
          region: visitor.region,
          city: visitor.city,
          deviceType: visitor.deviceType,
          browser: visitor.browser,
          operatingSystem: visitor.operatingSystem,
          ipHash: visitor.ipHash,
          totalDurationSeconds: totalDuration,
          totalDurationLabel: formatDuration(totalDuration),
          entryPage,
          exitPage,
          referrer: lastVisit?.referrer || 'Direct',
          referrerSource: lastVisit?.referrerSource || 'Direct',
          utmSource: lastVisit?.utmSource || null,
          utmMedium: lastVisit?.utmMedium || null,
          utmCampaign: lastVisit?.utmCampaign || null,
        },
        sessions: visitor.sessions.map((s) => ({
          id: s.id,
          startedAt: s.startedAt,
          endedAt: s.lastPingAt,
          durationSeconds: s.durationSeconds,
          durationLabel: formatDuration(s.durationSeconds),
          entryPage: s.entryPage,
          exitPage: s.exitPage,
          referrer: s.referrer,
          referrerSource: s.referrerSource,
          utmSource: s.utmSource,
          utmMedium: s.utmMedium,
          utmCampaign: s.utmCampaign,
          pageViewsCount: s.pageViews.length,
          pagesViewed: s.pageViews.map((pv) => ({
            page: pv.page,
            pageTitle: pv.pageTitle,
            viewedAt: pv.viewedAt,
          })),
        })),
        pageViews: visitor.pageViews.map((pv) => ({
          id: pv.id,
          page: pv.page,
          pageTitle: pv.pageTitle,
          viewedAt: pv.viewedAt,
        })),
      })
    }

    // 2. Compute Overview Stats
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalVisitors,
      uniqueVisitorsInPeriod,
      returningVisitorsCount,
      visitorsToday,
      visitorsThisWeek,
      visitorsThisMonth,
      currentlyOnlineCount,
      totalPageViewsCount,
      sessionAggregate,
    ] = await Promise.all([
      db.visitorLog.count(),
      db.visitorLog.count({ where: { lastSeenAt: { gte: startDate } } }),
      db.visitorLog.count({
        where: {
          lastSeenAt: { gte: startDate },
          visitCount: { gt: 1 },
        },
      }),
      db.visitorLog.count({ where: { lastSeenAt: { gte: todayStart } } }),
      db.visitorLog.count({ where: { lastSeenAt: { gte: weekStart } } }),
      db.visitorLog.count({ where: { lastSeenAt: { gte: monthStart } } }),
      db.visitorLog.count({ where: { lastSeenAt: { gte: fiveMinsAgo } } }),
      db.visitorPageView.count({ where: { viewedAt: { gte: startDate } } }),
      db.visitorSession.aggregate({
        where: { startedAt: { gte: startDate } },
        _avg: { durationSeconds: true },
      }),
    ])

    const avgSessionSeconds = Math.round(sessionAggregate._avg.durationSeconds || 0)

    // 3. Live Active Visitors (last seen within 10 minutes)
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000)
    const liveVisitors = await db.visitorLog.findMany({
      where: { lastSeenAt: { gte: tenMinsAgo } },
      orderBy: { lastSeenAt: 'desc' },
      take: 20,
      include: {
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    })

    const formattedLiveVisitors = liveVisitors.map((v) => {
      const latestSession = v.sessions[0]
      const isOnline = v.lastSeenAt >= fiveMinsAgo
      return {
        visitorId: v.visitorId,
        userId: v.userId,
        page: latestSession?.exitPage || latestSession?.entryPage || '/',
        deviceType: v.deviceType || 'Desktop',
        browser: v.browser || 'Browser',
        location: v.city ? `${v.country} (${v.city})` : v.country || 'Tanzania',
        lastSeenAt: v.lastSeenAt,
        lastSeenAgo: formatAgo(v.lastSeenAt),
        status: isOnline ? '🟢 Online' : '🟡 Away',
      }
    })

    // 4. Traffic Chart Time Series Data
    const pageViewsInPeriod = await db.visitorPageView.findMany({
      where: { viewedAt: { gte: startDate } },
      select: { viewedAt: true, visitorId: true },
    })

    const sessionsInPeriod = await db.visitorSession.findMany({
      where: { startedAt: { gte: startDate } },
      select: { startedAt: true, visitorId: true, visitorLogId: true },
    })

    const visitorsCreatedInPeriod = await db.visitorLog.findMany({
      where: { firstSeenAt: { gte: startDate } },
      select: { firstSeenAt: true, visitorId: true },
    })

    const timeSeriesMap = new Map<string, {
      label: string
      visitors: Set<string>
      pageViews: number
      sessions: number
      newVisitors: Set<string>
    }>()

    if (isHourly) {
      for (let h = 0; h < 24; h++) {
        const key = `${h.toString().padStart(2, '0')}:00`
        timeSeriesMap.set(key, {
          label: `${h}:00`,
          visitors: new Set(),
          pageViews: 0,
          sessions: 0,
          newVisitors: new Set(),
        })
      }
      sessionsInPeriod.forEach((s) => {
        const h = new Date(s.startedAt).getHours()
        const key = `${h.toString().padStart(2, '0')}:00`
        const bucket = timeSeriesMap.get(key)
        if (bucket) {
          bucket.sessions++
          bucket.visitors.add(s.visitorId)
        }
      })
      pageViewsInPeriod.forEach((pv) => {
        const h = new Date(pv.viewedAt).getHours()
        const key = `${h.toString().padStart(2, '0')}:00`
        const bucket = timeSeriesMap.get(key)
        if (bucket) {
          bucket.pageViews++
          bucket.visitors.add(pv.visitorId)
        }
      })
      visitorsCreatedInPeriod.forEach((v) => {
        const h = new Date(v.firstSeenAt).getHours()
        const key = `${h.toString().padStart(2, '0')}:00`
        const bucket = timeSeriesMap.get(key)
        if (bucket) {
          bucket.newVisitors.add(v.visitorId)
        }
      })
    } else {
      const dayCount = period === '7days' ? 7 : period === '30days' ? 30 : period === '6months' ? 180 : 365
      for (let i = dayCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const key = d.toISOString().split('T')[0]
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        timeSeriesMap.set(key, {
          label,
          visitors: new Set(),
          pageViews: 0,
          sessions: 0,
          newVisitors: new Set(),
        })
      }

      sessionsInPeriod.forEach((s) => {
        const key = new Date(s.startedAt).toISOString().split('T')[0]
        const bucket = timeSeriesMap.get(key)
        if (bucket) {
          bucket.sessions++
          bucket.visitors.add(s.visitorId)
        }
      })
      pageViewsInPeriod.forEach((pv) => {
        const key = new Date(pv.viewedAt).toISOString().split('T')[0]
        const bucket = timeSeriesMap.get(key)
        if (bucket) {
          bucket.pageViews++
          bucket.visitors.add(pv.visitorId)
        }
      })
      visitorsCreatedInPeriod.forEach((v) => {
        const key = new Date(v.firstSeenAt).toISOString().split('T')[0]
        const bucket = timeSeriesMap.get(key)
        if (bucket) {
          bucket.newVisitors.add(v.visitorId)
        }
      })
    }

    const trafficChart = Array.from(timeSeriesMap.entries()).map(([_, data]) => {
      const totalVis = data.visitors.size
      const newVis = data.newVisitors.size
      const returningVis = Math.max(0, totalVis - newVis)
      return {
        label: data.label,
        visitors: totalVis,
        pageViews: data.pageViews,
        sessions: data.sessions,
        newVisitors: newVis,
        returningVisitors: returningVis,
      }
    })

    // 5. Most Visited Pages
    const rawPageViews = await db.visitorPageView.findMany({
      where: { viewedAt: { gte: startDate } },
      select: { page: true, pageTitle: true, visitorId: true },
    })

    const pageStatsMap = new Map<string, { title: string; views: number; visitors: Set<string> }>()
    rawPageViews.forEach((pv) => {
      const cleanPath = pv.page ? pv.page.split('?')[0] : '/'
      const existing = pageStatsMap.get(cleanPath)
      if (existing) {
        existing.views++
        existing.visitors.add(pv.visitorId)
        if (pv.pageTitle && (!existing.title || existing.title === '')) {
          existing.title = pv.pageTitle
        }
      } else {
        pageStatsMap.set(cleanPath, {
          title: pv.pageTitle || cleanPath,
          views: 1,
          visitors: new Set([pv.visitorId]),
        })
      }
    })

    const mostVisitedPages = Array.from(pageStatsMap.entries())
      .map(([page, data]) => ({
        page,
        title: data.title,
        views: data.views,
        uniqueVisitors: data.visitors.size,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // 6. Traffic Sources
    const rawSessions = await db.visitorSession.findMany({
      where: { startedAt: { gte: startDate } },
      select: { referrerSource: true },
    })

    const sourceCounts: Record<string, number> = {}
    let totalSessionsInSources = 0
    rawSessions.forEach((s) => {
      const src = s.referrerSource || 'Direct'
      sourceCounts[src] = (sourceCounts[src] || 0) + 1
      totalSessionsInSources++
    })

    const trafficSources = Object.entries(sourceCounts)
      .map(([source, count]) => ({
        source,
        count,
        percentage: totalSessionsInSources > 0 ? parseFloat(((count / totalSessionsInSources) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // 7. Device, OS & Browser Distribution
    const activeVisitorsInPeriod = await db.visitorLog.findMany({
      where: { lastSeenAt: { gte: startDate } },
      select: { deviceType: true, browser: true, operatingSystem: true, country: true, city: true },
    })

    const deviceCounts: Record<string, number> = {}
    const osCounts: Record<string, number> = {}
    const browserCounts: Record<string, number> = {}
    const locationCounts: Record<string, number> = {}
    const totalVisCount = activeVisitorsInPeriod.length || 1

    activeVisitorsInPeriod.forEach((v) => {
      const dev = v.deviceType || 'Desktop'
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1

      const os = v.operatingSystem || 'Other OS'
      osCounts[os] = (osCounts[os] || 0) + 1

      const br = v.browser || 'Other Browser'
      browserCounts[br] = (browserCounts[br] || 0) + 1

      const loc = v.city ? `${v.country} (${v.city})` : v.country || 'Tanzania'
      locationCounts[loc] = (locationCounts[loc] || 0) + 1
    })

    const formatDistribution = (counts: Record<string, number>) =>
      Object.entries(counts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: parseFloat(((count / totalVisCount) * 100).toFixed(1)),
        }))
        .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      overview: {
        totalVisitors,
        uniqueVisitors: uniqueVisitorsInPeriod,
        returningVisitors: returningVisitorsCount,
        visitorsToday,
        visitorsThisWeek,
        visitorsThisMonth,
        currentlyOnline: currentlyOnlineCount,
        totalPageViews: totalPageViewsCount,
        avgSessionDurationSeconds: avgSessionSeconds,
        avgSessionDurationLabel: formatDuration(avgSessionSeconds),
      },
      liveVisitors: formattedLiveVisitors,
      trafficChart,
      mostVisitedPages,
      trafficSources,
      deviceDistribution: formatDistribution(deviceCounts),
      osDistribution: formatDistribution(osCounts),
      browserDistribution: formatDistribution(browserCounts),
      locationDistribution: formatDistribution(locationCounts),
    })
  } catch (error: any) {
    console.error('Visitor analytics fetch error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch visitor analytics' },
      { status: 500 }
    )
  }
}
