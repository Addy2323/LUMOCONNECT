import { describe, it, expect } from 'vitest'
import { evaluateAttribution } from '@/modules/attribution/service'
import type { TouchEvent } from '@/modules/tracking/service'

describe('Attribution Engine', () => {
  it('correctly attributes conversion using last-click model within attribution window', () => {
    const t1: TouchEvent = {
      trackingLinkId: 'trk_1',
      code: 'ALEX-PROMO-1',
      touchType: 'CLICK',
      visitorId: 'vis_101',
      timestamp: new Date('2026-08-10T10:00:00Z'),
    }
    const t2: TouchEvent = {
      trackingLinkId: 'trk_2',
      code: 'NEEMA-PROMO-2',
      touchType: 'CLICK',
      visitorId: 'vis_101',
      timestamp: new Date('2026-08-15T12:00:00Z'),
    }

    const decision = evaluateAttribution({
      conversionId: 'conv_test_1',
      touches: [t1, t2],
      model: 'LAST_CLICK',
      windowDays: 30,
    })

    expect(decision.winnerTrackingCode).toBe('NEEMA-PROMO-2')
    expect(decision.touchesEvaluated).toBe(2)
  })

  it('prioritizes promo code precedence when specified', () => {
    const t1: TouchEvent = {
      trackingLinkId: 'trk_1',
      code: 'ALEX-PROMO-1',
      touchType: 'CLICK',
      visitorId: 'vis_101',
      timestamp: new Date('2026-08-10T10:00:00Z'),
    }
    const t2: TouchEvent = {
      trackingLinkId: 'trk_2',
      code: 'NEEMA-PROMO-2',
      touchType: 'CLICK',
      visitorId: 'vis_101',
      timestamp: new Date('2026-08-15T12:00:00Z'),
    }

    const decision = evaluateAttribution({
      conversionId: 'conv_test_2',
      touches: [t1, t2],
      promoCodeUsed: 'ALEX-PROMO-1',
      model: 'PROMO_CODE_PRECEDENCE',
      windowDays: 30,
    })

    expect(decision.winnerTrackingCode).toBe('ALEX-PROMO-1')
  })
})
