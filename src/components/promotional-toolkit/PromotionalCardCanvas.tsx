'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Sparkles, QrCode, ShieldCheck, MapPin, Tag } from 'lucide-react'
import type { PromotionalTemplate } from '@/modules/promotional-toolkit/templates'
import { DEFAULT_PROMOTIONAL_TEMPLATE } from '@/modules/promotional-toolkit/templates'

export type AspectRatioType = 'SQUARE_1_1' | 'PORTRAIT_9_16' | 'LANDSCAPE_16_9'

interface PromotionalCardCanvasProps {
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
  template?: PromotionalTemplate
  onRendered?: (dataUrl: string) => void
}

export function PromotionalCardCanvas({
  dealTitle,
  dealCategory,
  dealRegion,
  dealPriceDisplay,
  dealSummary,
  dealImageUrl,
  opportunityType,
  trackingCode,
  referralUrl,
  aspectRatio,
  selectedLanguage,
  template = DEFAULT_PROMOTIONAL_TEMPLATE,
  onRendered,
}: PromotionalCardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [renderedDataUrl, setRenderedDataUrl] = useState<string>('')

  const ctaText = selectedLanguage === 'SW' ? template.ctaTextSw : template.ctaTextEn

  // Canvas dimensions based on aspect ratio
  const dimensions =
    aspectRatio === 'PORTRAIT_9_16'
      ? { width: 1080, height: 1920 }
      : aspectRatio === 'LANDSCAPE_16_9'
      ? { width: 1200, height: 675 }
      : { width: 1080, height: 1080 }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensions
    canvas.width = width
    canvas.height = height

    // 1. Background Gradient (Dark Navy #0B132B to #1C2541)
    const bgGradient = ctx.createLinearGradient(0, 0, width, height)
    bgGradient.addColorStop(0, '#0B132B')
    bgGradient.addColorStop(1, '#1C2541')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // 2. Top Header Brand Bar (Lumo Orange #FF6A00)
    ctx.fillStyle = '#FF6A00'
    ctx.fillRect(0, 0, width, Math.round(height * 0.08))

    // Header Text
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 36px Inter, sans-serif'
    ctx.fillText('LUMO DEALERS', 40, Math.round(height * 0.052))

    ctx.font = 'bold 24px Inter, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('VERIFIED OPPORTUNITY', width - 40, Math.round(height * 0.052))
    ctx.textAlign = 'left'

    // 3. Main Content Area Calculation
    const headerH = height * 0.08
    const footerH = height * 0.18
    const contentH = height - headerH - footerH
    const contentTop = headerH + 20

    // Load Image
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const defaultImage =
      dealImageUrl ||
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&h=800&q=90'
    img.src = defaultImage

    img.onload = () => {
      // Draw image container
      const imgHeight = aspectRatio === 'PORTRAIT_9_16' ? contentH * 0.45 : contentH * 0.48
      const imgWidth = width - 80
      const imgX = 40
      const imgY = contentTop + 20

      // Rounded rectangle for image
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(imgX, imgY, imgWidth, imgHeight, 24)
      ctx.clip()

      // Draw cover image
      const hRatio = imgWidth / img.width
      const vRatio = imgHeight / img.height
      const ratio = Math.max(hRatio, vRatio)
      const centerShiftX = (imgWidth - img.width * ratio) / 2
      const centerShiftY = (imgHeight - img.height * ratio) / 2

      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        imgX + centerShiftX,
        imgY + centerShiftY,
        img.width * ratio,
        img.height * ratio
      )
      ctx.restore()

      // Category & Type Badge on Image
      ctx.fillStyle = 'rgba(11, 19, 43, 0.85)'
      ctx.beginPath()
      ctx.roundRect(imgX + 20, imgY + 20, 320, 50, 12)
      ctx.fill()

      ctx.fillStyle = '#FF6A00'
      ctx.font = 'extrabold 22px Inter, sans-serif'
      const typeDisplay = opportunityType === 'REVERSE_SOURCING' ? 'WANTED' : 'FOR SALE'
      ctx.fillText(`${typeDisplay} • ${dealCategory.toUpperCase()}`, imgX + 35, imgY + 53)

      // Text Section below image
      let textY = imgY + imgHeight + 50

      // Title
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 38px Inter, sans-serif'

      // Truncate title if needed
      const maxTLength = template.imageSettings.maxTitleLength || 75
      const cleanTitle = dealTitle.length > maxTLength ? dealTitle.slice(0, maxTLength) + '...' : dealTitle

      // Multi-line text wrapper
      const words = cleanTitle.split(' ')
      let line = ''
      const maxWidth = width - 100

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, 50, textY)
          line = words[n] + ' '
          textY += 46
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, 50, textY)
      textY += 40

      // Region & Price
      if (template.publicFieldToggles.showLocation || template.publicFieldToggles.showPrice) {
        ctx.fillStyle = '#94A3B8'
        ctx.font = 'bold 24px Inter, sans-serif'
        const metaInfo = [
          template.publicFieldToggles.showLocation ? `📍 ${dealRegion}` : null,
          template.publicFieldToggles.showPrice && dealPriceDisplay ? `💰 ${dealPriceDisplay}` : null,
        ]
          .filter(Boolean)
          .join('   |   ')

        ctx.fillText(metaInfo, 50, textY)
        textY += 45
      }

      // Short Summary
      ctx.fillStyle = '#CBD5E1'
      ctx.font = '22px Inter, sans-serif'
      const maxSLength = template.imageSettings.maxDescriptionLength || 140
      const summaryText = dealSummary.length > maxSLength ? dealSummary.slice(0, maxSLength) + '...' : dealSummary
      ctx.fillText(summaryText, 50, textY, maxWidth)

      // 4. Footer Section (CTA Button, Ref Code, and QR Code)
      const footerY = height - footerH
      ctx.fillStyle = '#0F172A'
      ctx.fillRect(0, footerY, width, footerH)

      // CTA Box
      ctx.fillStyle = '#FF6A00'
      ctx.beginPath()
      ctx.roundRect(40, footerY + 25, width - 280, 80, 16)
      ctx.fill()

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 28px Inter, sans-serif'
      ctx.fillText(ctaText, 70, footerY + 75)

      // Ref code under CTA
      if (template.publicFieldToggles.showRefCode) {
        ctx.fillStyle = '#94A3B8'
        ctx.font = 'bold 18px Inter, sans-serif'
        ctx.fillText(`PROMO REF: ${trackingCode}`, 70, footerY + 125)
      }

      // Draw high-resolution sharp QR Code image
      const qrImg = new Image()
      qrImg.crossOrigin = 'anonymous'
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&ecc=H&margin=1&data=${encodeURIComponent(referralUrl)}`

      qrImg.onload = () => {
        if (template.publicFieldToggles.showQrCode) {
          ctx.save()
          ctx.imageSmoothingEnabled = false
          ctx.fillStyle = '#FFFFFF'
          ctx.beginPath()
          ctx.roundRect(width - 200, footerY + 15, 150, 150, 12)
          ctx.fill()
          ctx.drawImage(qrImg, width - 195, footerY + 20, 140, 140)
          ctx.restore()
        }

        const dataUrl = canvas.toDataURL('image/png')
        setRenderedDataUrl(dataUrl)
        if (onRendered) onRendered(dataUrl)
      }

      qrImg.onerror = () => {
        // Fallback QR code box
        if (template.publicFieldToggles.showQrCode) {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(width - 200, footerY + 15, 140, 140)
          ctx.fillStyle = '#0B132B'
          ctx.font = 'bold 16px Inter, sans-serif'
          ctx.fillText('QR CODE', width - 180, footerY + 90)
        }
        const dataUrl = canvas.toDataURL('image/png')
        setRenderedDataUrl(dataUrl)
        if (onRendered) onRendered(dataUrl)
      }
    }
  }, [
    dealTitle,
    dealCategory,
    dealRegion,
    dealPriceDisplay,
    dealSummary,
    dealImageUrl,
    opportunityType,
    trackingCode,
    referralUrl,
    aspectRatio,
    selectedLanguage,
    template,
  ])

  return (
    <div className="space-y-3">
      {/* Hidden HTML5 Canvas element used for PNG rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Visual Component Preview */}
      <div
        className={`relative mx-auto rounded-2xl overflow-hidden border border-slate-700 shadow-xl bg-gradient-to-br from-[#0B132B] to-[#1C2541] text-white flex flex-col justify-between transition-all duration-300 ${
          aspectRatio === 'PORTRAIT_9_16'
            ? 'w-[260px] h-[460px]'
            : aspectRatio === 'LANDSCAPE_16_9'
            ? 'w-[360px] h-[200px]'
            : 'w-[300px] h-[300px]'
        }`}
      >
        {/* Top Header */}
        <div className="bg-[#FF6A00] px-3 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>LUMO DEALERS</span>
          </div>
          <span className="text-[9px] opacity-90">VERIFIED OPPORTUNITY</span>
        </div>

        {/* Content Body */}
        <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
          <div className="relative rounded-xl overflow-hidden h-28 sm:h-32 bg-slate-900 border border-slate-700/60">
            <img
              src={
                dealImageUrl ||
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&h=800&q=90'
              }
              alt={dealTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#0B132B]/90 backdrop-blur-xs text-[#FF6A00] text-[9px] font-black flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              <span>{opportunityType === 'REVERSE_SOURCING' ? 'WANTED' : 'FOR SALE'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-extrabold text-xs text-white line-clamp-2 leading-tight">{dealTitle}</h4>
            <div className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
              {template.publicFieldToggles.showLocation && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5 text-[#FF6A00]" />
                  {dealRegion}
                </span>
              )}
              {template.publicFieldToggles.showPrice && dealPriceDisplay && (
                <span className="font-mono text-emerald-400 font-bold">{dealPriceDisplay}</span>
              )}
            </div>
            <p className="text-[9px] text-slate-400 line-clamp-2 leading-snug">{dealSummary}</p>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="bg-[#0F172A] p-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 rounded-lg bg-[#FF6A00] text-white font-black text-[9px] inline-flex items-center gap-1 shadow-2xs">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{ctaText}</span>
            </div>
            {template.publicFieldToggles.showRefCode && (
              <div className="text-[8px] font-mono text-slate-400 font-semibold px-0.5">REF: {trackingCode}</div>
            )}
          </div>

          {template.publicFieldToggles.showQrCode && (
            <div className="w-9 h-9 p-0.5 bg-white rounded-md shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=H&margin=1&data=${encodeURIComponent(referralUrl)}`}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
