import QRCode from 'qrcode'
import { nanoid } from 'nanoid'

export interface TrackingLinkItem {
  id: string
  code: string
  opportunityId: string
  dealId: string
  partnerId: string
  campaignName: string
  destinationUrl: string
  qrCodeDataUrl: string
  clickCount: number
  uniqueClicks: number
  conversionCount: number
  totalEarnedTZS: bigint
  isActive: boolean
  createdAt: Date
}

export interface TouchEvent {
  trackingLinkId: string
  code: string
  touchType: 'CLICK' | 'QR_SCAN' | 'PROMO_CODE' | 'DIRECT'
  visitorId: string
  ipAddress?: string
  userAgent?: string
  referer?: string
  timestamp: Date
}

const trackingLinksStore: TrackingLinkItem[] = [
  {
    id: 'trk_ks_alex',
    code: 'ALEX-KSOLAR-2026',
    opportunityId: 'opp_kijani_solar',
    dealId: 'deal_ks_01',
    partnerId: 'partner_alex',
    campaignName: 'Social Bio & WhatsApp Status',
    destinationUrl: 'https://kijanisolar.co.tz/order?ref=ALEX-KSOLAR-2026',
    qrCodeDataUrl: '',
    clickCount: 142,
    uniqueClicks: 118,
    conversionCount: 6,
    totalEarnedTZS: BigInt(27000000), // 270,000.00 TZS
    isActive: true,
    createdAt: new Date('2026-08-05'),
  },
  {
    id: 'trk_mp_alex',
    code: 'ALEX-MOBIPAY',
    opportunityId: 'opp_mobipay_merchants',
    dealId: 'deal_mp_01',
    partnerId: 'partner_alex',
    campaignName: 'Kariakoo Merchant Outreach',
    destinationUrl: 'https://mobipay.africa/merchant/signup?ref=ALEX-MOBIPAY',
    qrCodeDataUrl: '',
    clickCount: 89,
    uniqueClicks: 74,
    conversionCount: 12,
    totalEarnedTZS: BigInt(30000000), // 300,000.00 TZS
    isActive: true,
    createdAt: new Date('2026-08-10'),
  },
]

const touchEventsStore: TouchEvent[] = []

export async function createTrackingLink({
  opportunityId,
  dealId,
  partnerId,
  campaignName,
  destinationUrl,
  customCode,
}: {
  opportunityId: string
  dealId: string
  partnerId: string
  campaignName: string
  destinationUrl: string
  customCode?: string
}): Promise<TrackingLinkItem> {
  const code = customCode ? customCode.toUpperCase().replace(/[^A-Z0-9_-]/g, '') : `LUMO-${nanoid(8).toUpperCase()}`
  const fullTarget = destinationUrl.includes('?') ? `${destinationUrl}&lumo_ref=${code}` : `${destinationUrl}?lumo_ref=${code}`

  // Generate QR Code data URL
  const qrCodeDataUrl = await QRCode.toDataURL(fullTarget, {
    margin: 2,
    width: 320,
    color: {
      dark: '#111827',
      light: '#FFFFFF',
    },
  })

  const link: TrackingLinkItem = {
    id: `trk_${Date.now()}`,
    code,
    opportunityId,
    dealId,
    partnerId,
    campaignName: campaignName || 'Default Campaign',
    destinationUrl: fullTarget,
    qrCodeDataUrl,
    clickCount: 0,
    uniqueClicks: 0,
    conversionCount: 0,
    totalEarnedTZS: BigInt(0),
    isActive: true,
    createdAt: new Date(),
  }

  trackingLinksStore.unshift(link)
  return link
}

export function recordTouch(event: Omit<TouchEvent, 'timestamp'>): TouchEvent {
  const touch: TouchEvent = {
    ...event,
    timestamp: new Date(),
  }
  touchEventsStore.push(touch)

  const link = trackingLinksStore.find((l) => l.code === event.code || l.id === event.trackingLinkId)
  if (link) {
    link.clickCount += 1
  }

  return touch
}

export function getPartnerTrackingLinks(partnerId: string): TrackingLinkItem[] {
  return trackingLinksStore.filter((l) => l.partnerId === partnerId)
}

export function getTrackingLinkByCode(code: string): TrackingLinkItem | undefined {
  return trackingLinksStore.find((l) => l.code.toLowerCase() === code.toLowerCase())
}
