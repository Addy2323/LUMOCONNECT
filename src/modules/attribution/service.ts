import type { TouchEvent } from '../tracking/service'

export interface AttributionDecision {
  conversionId: string
  winnerPartnerId: string
  winnerTrackingCode: string
  attributionModel: 'FIRST_CLICK' | 'LAST_CLICK' | 'PROMO_CODE_PRECEDENCE'
  weight: number
  explanation: string
  touchesEvaluated: number
  calculatedAt: Date
}

export function evaluateAttribution({
  conversionId,
  touches,
  promoCodeUsed,
  model = 'LAST_CLICK',
  windowDays = 30,
}: {
  conversionId: string
  touches: TouchEvent[]
  promoCodeUsed?: string
  model?: 'FIRST_CLICK' | 'LAST_CLICK' | 'PROMO_CODE_PRECEDENCE'
  windowDays?: number
}): AttributionDecision {
  const now = new Date()
  const cutoffTime = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)

  // Filter touches within the attribution window
  const validTouches = touches
    .filter((t) => t.timestamp >= cutoffTime)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  if (validTouches.length === 0 && !promoCodeUsed) {
    return {
      conversionId,
      winnerPartnerId: 'DIRECT_ORGANIC',
      winnerTrackingCode: 'DIRECT',
      attributionModel: model,
      weight: 1.0,
      explanation: 'No touchpoints recorded within attribution window. Direct organic sale.',
      touchesEvaluated: 0,
      calculatedAt: now,
    }
  }

  // 1. Promo code precedence rule
  if (model === 'PROMO_CODE_PRECEDENCE' && promoCodeUsed) {
    const promoTouch = validTouches.find((t) => t.code.toLowerCase() === promoCodeUsed.toLowerCase())
    if (promoTouch) {
      return {
        conversionId,
        winnerPartnerId: promoTouch.code,
        winnerTrackingCode: promoTouch.code,
        attributionModel: 'PROMO_CODE_PRECEDENCE',
        weight: 1.0,
        explanation: `Attributed to promo code ${promoCodeUsed} with highest priority.`,
        touchesEvaluated: validTouches.length,
        calculatedAt: now,
      }
    }
  }

  // 2. First Click
  if (model === 'FIRST_CLICK' && validTouches.length > 0) {
    const first = validTouches[0]
    return {
      conversionId,
      winnerPartnerId: first.code,
      winnerTrackingCode: first.code,
      attributionModel: 'FIRST_CLICK',
      weight: 1.0,
      explanation: `First touch on ${first.timestamp.toISOString()} via ${first.touchType} (total ${validTouches.length} touches).`,
      touchesEvaluated: validTouches.length,
      calculatedAt: now,
    }
  }

  // 3. Default: Last Click
  const last = validTouches[validTouches.length - 1]
  return {
    conversionId,
    winnerPartnerId: last ? last.code : (promoCodeUsed || 'DIRECT'),
    winnerTrackingCode: last ? last.code : (promoCodeUsed || 'DIRECT'),
    attributionModel: 'LAST_CLICK',
    weight: 1.0,
    explanation: last
      ? `Last touch on ${last.timestamp.toISOString()} via ${last.touchType} (total ${validTouches.length} touches evaluated).`
      : `Attributed via explicit referral code ${promoCodeUsed}.`,
    touchesEvaluated: validTouches.length,
    calculatedAt: now,
  }
}
