'use client'

import React, { useState } from 'react'
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  MessageCircle,
  Sparkles,
  Square,
  Smartphone,
  Monitor,
  Globe,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import {
  PromotionalCardCanvas,
  AspectRatioType,
} from '@/components/promotional-toolkit/PromotionalCardCanvas'
import { getTemplateForCategory } from '@/modules/promotional-toolkit/templates'
import { recordPromoInteraction } from '@/modules/promotional-toolkit/analytics'
import { buildPublicDealUrl } from '@/modules/promotional-toolkit/links'

interface PromotionalToolkitModalProps {
  dealTitle: string
  companyName: string
  trackingCode: string
  dealIdentifier?: string
  rewardDisplay?: string
  category?: string
  region?: string
  priceDisplay?: string
  summary?: string
  imageUrl?: string
  opportunityType?: string
  onClose: () => void
}

export function PromotionalToolkitModal({
  dealTitle,
  companyName,
  trackingCode,
  dealIdentifier,
  category = 'Products',
  region = 'Tanzania',
  priceDisplay = '',
  summary = 'Verified commercial opportunity coordinated directly via Lumo Dealers.',
  imageUrl,
  opportunityType = 'PRODUCT_SALES',
  onClose,
}: PromotionalToolkitModalProps) {
  const { locale } = useLanguage()
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<'SW' | 'EN'>(locale === 'sw' ? 'SW' : 'EN')
  const [selectedAspect, setSelectedAspect] = useState<AspectRatioType>('SQUARE_1_1')
  const [renderedCardDataUrl, setRenderedCardDataUrl] = useState<string>('')

  const activeTemplate = getTemplateForCategory(category)
  const referralUrl = buildPublicDealUrl(dealIdentifier || trackingCode, dealIdentifier ? trackingCode : '', selectedLanguage === 'SW' ? 'sw' : 'en')

  const swahiliCaption = `Habari! Kama unahitaji "${dealTitle}", fursa hii imethibitishwa na kuratibiwa kupitia Lumo Dealers.\n\nTazama maelezo kamili na ungana nasi hapa:\nLink: ${referralUrl}\n\nUratibu wa moja kwa moja na fursa halisi Tanzania nzima.`

  const englishCaption = `Hello! Interested in "${dealTitle}"? This verified opportunity is published and coordinated via Lumo Dealers.\n\nView full details and connect here:\nLink: ${referralUrl}\n\nCoordinated directly across Tanzania.`

  const activeCaption = selectedLanguage === 'SW' ? swahiliCaption : englishCaption

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopiedLink(true)
    recordPromoInteraction(trackingCode, 'CONTACT_CLICK', typeof navigator !== 'undefined' ? navigator.userAgent : undefined)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(activeCaption)
    setCopiedCaption(true)
    recordPromoInteraction(trackingCode, 'CONTACT_CLICK', typeof navigator !== 'undefined' ? navigator.userAgent : undefined)
    setTimeout(() => setCopiedCaption(false), 2000)
  }

  const handleWhatsAppShare = () => {
    const encodedText = encodeURIComponent(activeCaption)
    recordPromoInteraction(trackingCode, 'CONTACT_CLICK', typeof navigator !== 'undefined' ? navigator.userAgent : undefined)
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank')
  }

  const handleDownloadCard = () => {
    if (!renderedCardDataUrl) return
    const link = document.createElement('a')
    link.href = renderedCardDataUrl
    link.download = `LUMO_PROMO_${trackingCode}_${selectedAspect}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    recordPromoInteraction(trackingCode, 'CONTACT_CLICK', typeof navigator !== 'undefined' ? navigator.userAgent : undefined)
  }

  const handleNativeShareCard = async () => {
    if (!renderedCardDataUrl || typeof navigator === 'undefined' || !navigator.share) {
      handleDownloadCard()
      return
    }

    try {
      // Convert Data URL to Blob/File for Web Share API
      const res = await fetch(renderedCardDataUrl)
      const blob = await res.blob()
      const file = new File([blob], `LUMO_PROMO_${trackingCode}.png`, { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: dealTitle,
          text: activeCaption,
          url: referralUrl,
          files: [file],
        })
        recordPromoInteraction(trackingCode, 'CONTACT_CLICK', navigator.userAgent)
      } else {
        await navigator.share({
          title: dealTitle,
          text: activeCaption,
          url: referralUrl,
        })
      }
    } catch (err) {
      // Fallback to direct WhatsApp share or download if cancelled or unsupported
      console.warn('Native share fallback triggered', err)
      handleDownloadCard()
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[92vh] overflow-y-auto space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close promotional toolkit"
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-[#FF6A00]">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
              Partner Promotional Toolkit
            </h3>
            <p className="text-xs text-slate-500">
              Visual card generator & verified attribution links for {companyName}
            </p>
          </div>
        </div>

        {/* Controls Bar: Language & Aspect Ratio Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
          {/* Format Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Card Format:
            </span>
            <button
              type="button"
              onClick={() => { setRenderedCardDataUrl(''); setSelectedAspect('SQUARE_1_1') }}
              disabled={selectedAspect === 'SQUARE_1_1'}
              className={`px-2.5 py-1 rounded-xl font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedAspect === 'SQUARE_1_1'
                  ? 'bg-white dark:bg-slate-900 text-[#FF6A00] shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Square (1:1)</span>
            </button>
            <button
              type="button"
              onClick={() => { setRenderedCardDataUrl(''); setSelectedAspect('PORTRAIT_9_16') }}
              disabled={selectedAspect === 'PORTRAIT_9_16'}
              className={`px-2.5 py-1 rounded-xl font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedAspect === 'PORTRAIT_9_16'
                  ? 'bg-white dark:bg-slate-900 text-[#FF6A00] shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Status (9:16)</span>
            </button>
            <button
              type="button"
              onClick={() => { setRenderedCardDataUrl(''); setSelectedAspect('LANDSCAPE_16_9') }}
              disabled={selectedAspect === 'LANDSCAPE_16_9'}
              className={`px-2.5 py-1 rounded-xl font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedAspect === 'LANDSCAPE_16_9'
                  ? 'bg-white dark:bg-slate-900 text-[#FF6A00] shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Preview (16:9)</span>
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-2 sm:pt-0 sm:pl-2">
            <Globe className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <button
              type="button"
              onClick={() => { setRenderedCardDataUrl(''); setSelectedLanguage('SW') }}
              disabled={selectedLanguage === 'SW'}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                selectedLanguage === 'SW'
                  ? 'bg-[#FF6A00] text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Kiswahili
            </button>
            <button
              type="button"
              onClick={() => { setRenderedCardDataUrl(''); setSelectedLanguage('EN') }}
              disabled={selectedLanguage === 'EN'}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                selectedLanguage === 'EN'
                  ? 'bg-[#FF6A00] text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Live Visual Card Canvas Preview */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center p-4 sm:p-6">
          <PromotionalCardCanvas
            dealTitle={dealTitle}
            dealCategory={category}
            dealRegion={region}
            dealPriceDisplay={priceDisplay}
            dealSummary={summary}
            dealImageUrl={imageUrl}
            opportunityType={opportunityType}
            trackingCode={trackingCode}
            referralUrl={referralUrl}
            aspectRatio={selectedAspect}
            selectedLanguage={selectedLanguage}
            template={activeTemplate}
            onRendered={setRenderedCardDataUrl}
          />
        </div>

        {/* Unique Referral Link */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Your Unique Referral Link (Public Product View)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Pre-Crafted Social Caption */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>Pre-Crafted Social Caption ({selectedLanguage === 'SW' ? 'Kiswahili' : 'English'})</span>
            </label>
          </div>

          <div className="relative">
            <textarea
              readOnly
              rows={3}
              value={activeCaption}
              className="w-full bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none resize-none font-medium"
            />
            <button
              type="button"
              onClick={handleCopyCaption}
              className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs cursor-pointer flex items-center gap-1"
            >
              {copiedCaption ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCaption ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Sharing Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* Share Card (Native device sheet) */}
          <button
            onClick={handleNativeShareCard}
            disabled={!renderedCardDataUrl}
            className="py-2.5 px-3 rounded-xl bg-[#FF6A00] hover:bg-[#EA580C] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            title="Share generated image via device apps"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Card</span>
          </button>

          {/* Share Link on WhatsApp */}
          <button
            onClick={handleWhatsAppShare}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          {/* Download Card */}
          <button
            onClick={handleDownloadCard}
            disabled={!renderedCardDataUrl}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-wait"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>

          {/* Copy Partner Link */}
          <button
            onClick={handleCopyLink}
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
