export type PromoEventType =
  | 'PAGE_VISIT'
  | 'CONTACT_CLICK'
  | 'SUBMITTED_ENQUIRY'
  | 'VERIFIED_REFERRAL'
  | 'COMPLETED_OUTCOME'

export interface PromoInteractionRecord {
  id: string
  promoCode: string
  eventType: PromoEventType
  isBotPreview: boolean
  userAgent?: string
  referrer?: string
  timestamp: string
}

export interface PromoAnalyticsSummary {
  promoCode: string
  pageVisitsCount: number
  botPreviewsCount: number
  contactClicksCount: number
  submittedEnquiriesCount: number
  verifiedReferralsCount: number
  completedOutcomesCount: number
  conversionRatePercent: number
  lastActivityAt?: string
}

const KNOWN_BOT_USER_AGENTS = [
  'whatsapp',
  'facebookexternalhit',
  'twitterbot',
  'googlebot',
  'linkedinbot',
  'telegrambot',
  'slackbot',
  'discordbot',
  'applebot',
  'bingbot',
  'crawler',
  'spider',
  'bot',
]

export function isCrawlerBot(userAgent?: string): boolean {
  if (!userAgent || typeof userAgent !== 'string') return false
  const ua = userAgent.toLowerCase()
  return KNOWN_BOT_USER_AGENTS.some((bot) => ua.includes(bot))
}

let inMemoryInteractions: PromoInteractionRecord[] = []

function loadInteractionsFromStorage() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('lumo_promo_analytics')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          inMemoryInteractions = parsed
        }
      }
    } catch (e) {
      console.warn('Could not load promo analytics from storage', e)
    }
  }
}

function syncInteractionsToStorage() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('lumo_promo_analytics', JSON.stringify(inMemoryInteractions))
    } catch (e) {
      console.warn('Could not sync promo analytics to storage', e)
    }
  }
}

// Initial load
loadInteractionsFromStorage()

export function recordPromoInteraction(
  promoCode: string,
  eventType: PromoEventType,
  userAgent?: string,
  referrer?: string
): PromoInteractionRecord {
  loadInteractionsFromStorage()

  const isBot = isCrawlerBot(userAgent)
  const record: PromoInteractionRecord = {
    id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    promoCode: promoCode.trim(),
    eventType,
    isBotPreview: isBot,
    userAgent,
    referrer,
    timestamp: new Date().toISOString(),
  }

  inMemoryInteractions.unshift(record)
  syncInteractionsToStorage()
  return record
}

export function getPromoAnalyticsSummary(promoCode: string): PromoAnalyticsSummary {
  loadInteractionsFromStorage()

  const targetCode = promoCode.trim().toLowerCase()
  const records = inMemoryInteractions.filter((r) => r.promoCode.toLowerCase() === targetCode)

  const botPreviewsCount = records.filter((r) => r.isBotPreview).length
  const humanVisits = records.filter((r) => !r.isBotPreview && r.eventType === 'PAGE_VISIT').length
  const contactClicksCount = records.filter((r) => r.eventType === 'CONTACT_CLICK').length
  const submittedEnquiriesCount = records.filter((r) => r.eventType === 'SUBMITTED_ENQUIRY').length
  const verifiedReferralsCount = records.filter((r) => r.eventType === 'VERIFIED_REFERRAL').length
  const completedOutcomesCount = records.filter((r) => r.eventType === 'COMPLETED_OUTCOME').length

  const totalEngagements = submittedEnquiriesCount + verifiedReferralsCount
  const conversionRatePercent = humanVisits > 0 ? Math.round((totalEngagements / humanVisits) * 100) : 0

  const lastActivityAt = records[0]?.timestamp

  return {
    promoCode,
    pageVisitsCount: humanVisits,
    botPreviewsCount,
    contactClicksCount,
    submittedEnquiriesCount,
    verifiedReferralsCount,
    completedOutcomesCount,
    conversionRatePercent,
    lastActivityAt,
  }
}
