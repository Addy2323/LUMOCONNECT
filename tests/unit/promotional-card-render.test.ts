import { afterEach, describe, expect, it, vi } from 'vitest'
import QRCode from 'qrcode'
import { drawReferralQr, renderPromotionalCard, type PromotionalCardOptions } from '@/modules/promotional-toolkit/render-card'
import { DEFAULT_PROMOTIONAL_TEMPLATE } from '@/modules/promotional-toolkit/templates'

function mockCanvas() {
  const ctx = {
    fillStyle: '', font: '', textAlign: 'left',
    fillRect: vi.fn(), beginPath: vi.fn(), roundRect: vi.fn(), fill: vi.fn(),
    fillText: vi.fn(), save: vi.fn(), restore: vi.fn(), clip: vi.fn(), drawImage: vi.fn(),
    measureText: (text: string) => ({ width: text.length * 15 }),
  }
  const canvas = { width: 0, height: 0, getContext: () => ctx }
  return { ctx, canvas: canvas as unknown as HTMLCanvasElement }
}

const options: PromotionalCardOptions = {
  dealTitle: 'Toyota Hiace 2018–2022 for Tour Fleet', dealCategory: 'Vehicles',
  dealRegion: 'Dar es Salaam', dealPriceDisplay: 'TZS 45,000,000',
  dealSummary: 'Explore this opportunity and contact Lumo for the full details.',
  opportunityType: 'PRODUCT_SALES', trackingCode: 'LUMO-A529-TOYOTA',
  referralUrl: 'https://lumo.co.tz/p/LUMO-A529-TOYOTA?lang=en',
  aspectRatio: 'SQUARE_1_1', selectedLanguage: 'EN', template: DEFAULT_PROMOTIONAL_TEMPLATE,
}

afterEach(() => vi.unstubAllGlobals())

describe('Promotional card export', () => {
  it.each(['en', 'sw'])('embeds the exact referral QR with a four-module quiet zone (%s)', (language) => {
    const { ctx } = mockCanvas()
    const url = options.referralUrl.replace('lang=en', `lang=${language}`)
    drawReferralQr(ctx as unknown as CanvasRenderingContext2D, url, 12, 20, 208)
    const { modules } = QRCode.create(url, { errorCorrectionLevel: 'M' })
    const [background, ...pixels] = ctx.fillRect.mock.calls as number[][]
    const [x, y, size] = background
    const cell = size / (modules.size + 8)
    const reconstructed = new Uint8Array(modules.size * modules.size)
    for (const [px, py, width, height] of pixels) {
      expect(width).toBe(cell)
      expect(height).toBe(cell)
      expect(Number.isInteger(px)).toBe(true)
      expect(px).toBeGreaterThanOrEqual(x + 4 * cell)
      expect(py).toBeGreaterThanOrEqual(y + 4 * cell)
      expect(px + width).toBeLessThanOrEqual(x + size - 4 * cell)
      expect(py + height).toBeLessThanOrEqual(y + size - 4 * cell)
      const row = (py - y) / cell - 4
      const col = (px - x) / cell - 4
      reconstructed[row * modules.size + col] = 1
    }
    expect(reconstructed).toEqual(new Uint8Array(modules.data))
  })

  it.each([
    ['SQUARE_1_1', 1080, 1080], ['PORTRAIT_9_16', 1080, 1920], ['LANDSCAPE_16_9', 1200, 675],
  ] as const)('keeps QR and footer inside %s even if the photo fails', async (aspectRatio, width, height) => {
    vi.stubGlobal('document', { fonts: { ready: Promise.resolve() } })
    vi.stubGlobal('Image', class {
      onerror?: () => void
      set src(_url: string) { this.onerror?.() }
    })
    const { ctx, canvas } = mockCanvas()
    await renderPromotionalCard(canvas, { ...options, aspectRatio, dealImageUrl: 'https://invalid.test/photo.jpg' })
    expect([canvas.width, canvas.height]).toEqual([width, height])
    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(100)
    for (const [x, y, w, h] of ctx.fillRect.mock.calls as number[][]) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(x + w).toBeLessThanOrEqual(width)
      expect(y + h).toBeLessThanOrEqual(height)
    }
    for (const [, , y] of ctx.fillText.mock.calls) expect(y).toBeLessThan(height)
  })

  it('honors the template option to hide the QR code', async () => {
    vi.stubGlobal('document', {})
    const { ctx, canvas } = mockCanvas()
    await renderPromotionalCard(canvas, { ...options, template: {
      ...options.template, publicFieldToggles: { ...options.template.publicFieldToggles, showQrCode: false },
    } })
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })
})
