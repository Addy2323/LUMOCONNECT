'use client'

import React, { useState } from 'react'
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Download,
  MessageCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react'

interface PromotionalToolkitModalProps {
  dealTitle: string
  companyName: string
  trackingCode: string
  rewardDisplay: string
  onClose: () => void
}

export function PromotionalToolkitModal({
  dealTitle,
  companyName,
  trackingCode,
  rewardDisplay,
  onClose,
}: PromotionalToolkitModalProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<'SW' | 'EN'>('SW')

  const referralUrl = `https://lumo.co.tz/p/${trackingCode}`

  const swahiliCaption = `Habari! 🔥 Kama unahitaji ${dealTitle} kutoka kwa ${companyName}, tumia link hii maalum upate ofa ya kipekee na usalama wa ununuzi kupitia LUMO Escrow:\n\n👉 ${referralUrl}\n\nUhakika wa bidhaa na huduma bora Tanzania nzima!`

  const englishCaption = `Hello! 🔥 Looking for ${dealTitle} by ${companyName}? Use this exclusive link to order securely with verified LUMO escrow buyer protection:\n\n👉 ${referralUrl}\n\nFast delivery & verified quality across Tanzania!`

  const activeCaption = selectedLanguage === 'SW' ? swahiliCaption : englishCaption

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(activeCaption)
    setCopiedCaption(true)
    setTimeout(() => setCopiedCaption(false), 2000)
  }

  const handleWhatsAppShare = () => {
    const encodedText = encodeURIComponent(activeCaption)
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Partner Promotional Toolkit</h3>
            <p className="text-xs text-slate-500">Ready-to-share promotional assets for {companyName}</p>
          </div>
        </div>

        {/* Unique Referral Link */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-5">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Your Unique Referral Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="w-full bg-white px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-medium text-slate-800 focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 1-Click WhatsApp & Social Sharing */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Pre-Crafted Social Caption</span>
            </label>
            <div className="flex items-center gap-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setSelectedLanguage('SW')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  selectedLanguage === 'SW' ? 'bg-orange-100 text-orange-800' : 'text-slate-500'
                }`}
              >
                Kiswahili
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage('EN')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  selectedLanguage === 'EN' ? 'bg-orange-100 text-orange-800' : 'text-slate-500'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              readOnly
              rows={4}
              value={activeCaption}
              className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none resize-none"
            />
            <button
              type="button"
              onClick={handleCopyCaption}
              className="absolute top-2 right-2 px-2 py-1 rounded bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 hover:text-slate-900 shadow-2xs cursor-pointer flex items-center gap-1"
            >
              {copiedCaption ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCaption ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleWhatsAppShare}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </button>

          <button
            onClick={() => alert(`Downloading high-resolution marketing media banner for ${companyName}...`)}
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Promo Banner</span>
          </button>
        </div>
      </div>
    </div>
  )
}
