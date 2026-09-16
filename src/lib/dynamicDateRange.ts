/**
 * LUMO Dynamic Date Range & Time-Series Engine
 *
 * Provides rolling date bucket generation for 7D, 30D, 6M, and 12M periods.
 * Guarantees continuous zero-filled points with dynamic formatting based on current system time.
 * Eliminates all static/hardcoded date labels (such as '18 Aug') forever.
 */

export type AnalyticsPeriod = '7D' | '30D' | '6M' | '12M'

export interface TimeSeriesPoint {
  date: string // ISO date string (YYYY-MM-DD or YYYY-MM)
  label: string // e.g. "16 Sep" or "Sep 2026"
  shortLabel: string // e.g. "16" or "Sep"
  timestamp: number
  clicks: number
  leads: number
  conversions: number
  earnings: number
  txValue: number
  activeUsers: number
  pipelineRevenueTZS: number
  value: number
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Generates continuous rolling date buckets for the specified period.
 * All dates are dynamically computed relative to `referenceDate` (defaults to now).
 */
export function generateDateBuckets(
  period: AnalyticsPeriod,
  referenceDate: Date = new Date()
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = []
  const now = new Date(referenceDate.getTime())

  if (period === '7D') {
    // Past 6 days + today = 7 rolling daily points
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      d.setHours(0, 0, 0, 0)

      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`
      const label = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`

      points.push({
        date: dateKey,
        label,
        shortLabel: String(d.getDate()),
        timestamp: d.getTime(),
        clicks: 0,
        leads: 0,
        conversions: 0,
        earnings: 0,
        txValue: 0,
        activeUsers: 0,
        pipelineRevenueTZS: 0,
        value: 0,
      })
    }
  } else if (period === '30D') {
    // Past 29 days + today = 30 rolling daily points
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      d.setHours(0, 0, 0, 0)

      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`
      const label = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`

      points.push({
        date: dateKey,
        label,
        shortLabel: String(d.getDate()),
        timestamp: d.getTime(),
        clicks: 0,
        leads: 0,
        conversions: 0,
        earnings: 0,
        txValue: 0,
        activeUsers: 0,
        pipelineRevenueTZS: 0,
        value: 0,
      })
    }
  } else if (period === '6M') {
    // Past 5 calendar months + current month = 6 rolling monthly points
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const dateKey = `${year}-${month}`
      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
      const shortLabel = MONTH_NAMES[d.getMonth()]

      points.push({
        date: dateKey,
        label,
        shortLabel,
        timestamp: d.getTime(),
        clicks: 0,
        leads: 0,
        conversions: 0,
        earnings: 0,
        txValue: 0,
        activeUsers: 0,
        pipelineRevenueTZS: 0,
        value: 0,
      })
    }
  } else if (period === '12M') {
    // Past 11 calendar months + current month = 12 rolling monthly points
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const dateKey = `${year}-${month}`
      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
      const shortLabel = MONTH_NAMES[d.getMonth()]

      points.push({
        date: dateKey,
        label,
        shortLabel,
        timestamp: d.getTime(),
        clicks: 0,
        leads: 0,
        conversions: 0,
        earnings: 0,
        txValue: 0,
        activeUsers: 0,
        pipelineRevenueTZS: 0,
        value: 0,
      })
    }
  }

  return points
}

export interface RawEventItem {
  timestamp: string | Date | number
  type: 'CLICK' | 'LEAD' | 'CONVERSION' | 'REWARD' | 'TRANSACTION' | 'USER_SESSION'
  amountTZS?: number
  valueMinor?: bigint | number
  activeUsers?: number
}

/**
 * Merges raw timestamped event records into continuous rolling buckets.
 */
export function mergeEventSeries(
  buckets: TimeSeriesPoint[],
  events: RawEventItem[],
  period: AnalyticsPeriod
): TimeSeriesPoint[] {
  // Clone buckets
  const result: TimeSeriesPoint[] = buckets.map((b) => ({ ...b }))

  for (const ev of events) {
    if (!ev.timestamp) continue
    const dateObj = new Date(ev.timestamp)
    if (isNaN(dateObj.getTime())) continue

    let matchKey = ''
    if (period === '7D' || period === '30D') {
      const y = dateObj.getFullYear()
      const m = String(dateObj.getMonth() + 1).padStart(2, '0')
      const d = String(dateObj.getDate()).padStart(2, '0')
      matchKey = `${y}-${m}-${d}`
    } else {
      const y = dateObj.getFullYear()
      const m = String(dateObj.getMonth() + 1).padStart(2, '0')
      matchKey = `${y}-${m}`
    }

    const bucket = result.find((b) => b.date === matchKey)
    if (!bucket) continue

    const amount = Number(ev.amountTZS || 0)

    if (ev.type === 'CLICK') {
      bucket.clicks += 1
      bucket.value += 1
    } else if (ev.type === 'LEAD') {
      bucket.leads += 1
      bucket.value += 1
      if (amount > 0) {
        bucket.pipelineRevenueTZS += amount
      }
    } else if (ev.type === 'CONVERSION') {
      bucket.conversions += 1
      bucket.value += 1
      bucket.pipelineRevenueTZS += amount
    } else if (ev.type === 'REWARD') {
      bucket.earnings += amount
      bucket.pipelineRevenueTZS += amount
      bucket.value += amount
    } else if (ev.type === 'TRANSACTION') {
      bucket.txValue += amount
      bucket.pipelineRevenueTZS += amount
    } else if (ev.type === 'USER_SESSION') {
      bucket.activeUsers += Number(ev.activeUsers || 1)
    }
  }

  return result
}
