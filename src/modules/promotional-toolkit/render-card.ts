import QRCode from 'qrcode'
import type { PromotionalTemplate } from './templates'

export type AspectRatioType = 'SQUARE_1_1' | 'PORTRAIT_9_16' | 'LANDSCAPE_16_9'
export interface PromotionalCardOptions {
  dealTitle: string
  dealCategory: string
  dealRegion: string
  dealPriceDisplay?: string
  dealSummary: string
  dealImageUrl?: string
  opportunityType: string
  trackingCode: string
  referralUrl: string
  aspectRatio: AspectRatioType
  selectedLanguage: 'EN' | 'SW'
  template: PromotionalTemplate
}

// Embed sharp, integer-sized modules and a four-module white quiet zone.
export function drawReferralQr(ctx: CanvasRenderingContext2D, url: string, x: number, y: number, maxSize: number) {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: 'M' })
  const cell = Math.floor(maxSize / (modules.size + 8))
  if (cell < 1) throw new Error('QR code does not fit')
  const size = (modules.size + 8) * cell
  x = Math.round(x + (maxSize - size) / 2)
  y = Math.round(y + (maxSize - size) / 2)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = '#000000'
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) ctx.fillRect(x + (col + 4) * cell, y + (row + 4) * cell, cell, cell)
    }
  }
}

function loadPhoto(url?: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null)
  return new Promise((resolve) => {
    const image = new Image()
    const timer = setTimeout(() => { image.onload = image.onerror = null; resolve(null) }, 10000)
    image.crossOrigin = 'anonymous'
    image.onload = () => { clearTimeout(timer); resolve(image) }
    image.onerror = () => { clearTimeout(timer); resolve(null) }
    image.src = url
  })
}

export async function renderPromotionalCard(canvas: HTMLCanvasElement, options: PromotionalCardOptions) {
  const { template, aspectRatio, selectedLanguage } = options
  const wide = aspectRatio === 'LANDSCAPE_16_9'
  const tall = aspectRatio === 'PORTRAIT_9_16'
  const w = wide ? 1200 : 1080
  const h = tall ? 1920 : wide ? 675 : 1080
  const sw = selectedLanguage === 'SW'
  const photo = await loadPhoto(options.dealImageUrl)
  await document.fonts?.ready
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  const { primary, darkNavy } = template.brandColors
  const font = template.fontFamily || 'Arial, sans-serif'
  const box = (x: number, y: number, width: number, height: number, color: string, radius = 0) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    ctx.fill()
  }
  const text = (value: string, x: number, y: number, size: number, color: string, weight = 400) => {
    ctx.font = `${weight} ${size}px ${font}`
    ctx.fillStyle = color
    ctx.fillText(value, x, y)
  }
  const lines = (value: string, x: number, y: number, width: number, size: number, count: number, color: string, weight = 400) => {
    ctx.font = `${weight} ${size}px ${font}`
    const words = value.trim().split(/\s+/)
    for (let row = 0; row < count && words.length; row++) {
      let line = words.shift()!
      while (words.length && ctx.measureText(`${line} ${words[0]}`).width <= width) line += ` ${words.shift()}`
      if (ctx.measureText(line).width > width || (row === count - 1 && words.length)) {
        while (line.length && ctx.measureText(`${line}…`).width > width) line = line.slice(0, -1)
        line += '…'
      }
      text(line, x, y + row * size * 1.22, size, color, weight)
    }
  }

  box(0, 0, w, h, darkNavy)
  box(0, 0, w, 10, primary)
  text('LUMO', 44, 67, 36, '#FFFFFF', 800)
  text('DEALERS', 166, 67, 22, '#CBD5E1', 600)
  ctx.textAlign = 'right'
  text(sw ? 'FURSA ILIYOTHIBITISHWA' : 'VERIFIED OPPORTUNITY', w - 44, 63, 18, '#CBD5E1', 600)
  ctx.textAlign = 'left'

  const imageX = 40, imageY = 100
  const imageW = wide ? 530 : w - 80
  const imageH = tall ? 920 : wide ? 330 : 400
  box(imageX, imageY, imageW, imageH, '#1C2541', 24)
  if (photo) {
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(imageX, imageY, imageW, imageH, 24)
    ctx.clip()
    const ratio = template.imageSettings.cropMode === 'contain'
      ? Math.min(imageW / photo.width, imageH / photo.height)
      : Math.max(imageW / photo.width, imageH / photo.height)
    ctx.drawImage(photo, imageX + (imageW - photo.width * ratio) / 2, imageY + (imageH - photo.height * ratio) / 2, photo.width * ratio, photo.height * ratio)
    ctx.restore()
  } else {
    text('LUMO', imageX + 40, imageY + imageH / 2, 64, '#FFFFFF', 800)
    text(sw ? 'Gundua fursa yako ijayo' : 'Discover your next opportunity', imageX + 40, imageY + imageH / 2 + 44, 24, '#CBD5E1')
  }
  const type = options.opportunityType === 'REVERSE_SOURCING' ? (sw ? 'INAHITAJIKA' : 'WANTED') : (sw ? 'INAUZWA' : 'FOR SALE')
  box(60, 120, 200, 48, primary, 12)
  text(type, 80, 152, 22, '#FFFFFF', 800)

  const tx = wide ? 610 : 44
  const ty = wide ? 128 : imageY + imageH + 42
  const tw = wide ? 546 : w - 88
  lines(options.dealCategory.toUpperCase(), tx, ty, tw, 20, 1, '#FDBA74', 700)
  lines(options.dealTitle.slice(0, template.imageSettings.maxTitleLength || 75), tx, ty + 52, tw, wide ? 34 : 44, 2, '#FFFFFF', 800)
  let metaY = ty + (wide ? 138 : 158)
  if (template.publicFieldToggles.showLocation) {
    lines(options.dealRegion, tx, metaY, tw, 24, 1, '#CBD5E1')
    metaY += 40
  }
  if (template.publicFieldToggles.showPrice && options.dealPriceDisplay) {
    lines(options.dealPriceDisplay, tx, metaY, tw, 32, 1, '#FFFFFF', 700)
    metaY += 46
  }
  if (!wide) lines(options.dealSummary.slice(0, template.imageSettings.maxDescriptionLength || 160), tx, metaY + 8, tw, 24, tall ? 4 : 2, '#94A3B8')

  const footerH = tall ? 330 : wide ? 215 : 240
  const fy = h - footerH
  box(0, fy, w, footerH, '#F8FAFC')
  const qrSize = wide ? 184 : 208
  const qrX = w - qrSize - 40
  const ctaW = template.publicFieldToggles.showQrCode ? qrX - 80 : w - 88
  text(sw ? 'UNAVUTIWA?' : 'INTERESTED?', 44, fy + 43, 18, '#64748B', 700)
  box(44, fy + 62, ctaW, 66, primary, 14)
  lines(sw ? template.ctaTextSw : template.ctaTextEn, 64, fy + 104, ctaW - 40, 25, 1, '#FFFFFF', 700)
  text('lumo.co.tz', 44, fy + 166, 24, darkNavy, 700)
  if (template.publicFieldToggles.showRefCode) lines(`REF: ${options.trackingCode}`, 44, fy + 196, ctaW, 17, 1, '#64748B')
  if (template.publicFieldToggles.showQrCode) {
    drawReferralQr(ctx, options.referralUrl, qrX, fy + 6, qrSize)
    ctx.textAlign = 'center'
    text(sw ? 'SKANI KWA MAELEZO' : 'SCAN FOR DETAILS', qrX + qrSize / 2, fy + qrSize + 20, 14, darkNavy, 700)
    ctx.textAlign = 'left'
  }
}
