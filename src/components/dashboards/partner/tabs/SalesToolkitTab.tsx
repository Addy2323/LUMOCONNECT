'use client'

import React, { useState } from 'react'
import {
  ShoppingBag,
  Download,
  Share2,
  Copy,
  MessageCircle,
  FileText,
  Film,
  Sparkles,
  Lock,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { JoinedDealItem } from '../types'
import { usePartnerToast } from '../PartnerToast'

interface SalesToolkitTabProps {
  joinedDeals: JoinedDealItem[]
}

export function SalesToolkitTab({ joinedDeals }: SalesToolkitTabProps) {
  const { showToast } = usePartnerToast()

  const [selectedDealId, setSelectedDealId] = useState(joinedDeals[0]?.id || '')
  const selectedDeal = joinedDeals.find((d) => d.id === selectedDealId) || joinedDeals[0]

  const whatsappPitch = `Habari! Kama unatafuta mfumo wa kisasa wa umeme wa jua (Solar Home Kit) kwa ajili ya nyumba au biashara yako, ${selectedDeal?.businessName || 'Kijani Solar Tech'} wanatoa ofa maalum. Tumia link hii kupata punguzo na usajili wa haraka: ${selectedDeal?.trackingLink || 'https://lumo.co.tz'}`

  const instagramCaption = `💡 Pata umeme wa jua wa kuaminika na ${selectedDeal?.businessName || 'Kijani Solar Tech'}! Tumia promo code: ${selectedDeal?.promoCode || 'ALEXSOLAR26'} kupata ofa maalum ya bure ya ufungaji. Link ipo kwenye bio! #SolarTanzania #KijaniSolar #LUMO`

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    showToast('success', 'Copied to Clipboard', `${label} copied. Ready to share.`)
  }

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappPitch)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Sales & Marketing Promotional Toolkit</span>
            <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-2 py-0.5 rounded-full">
              Read + Generation Tools
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Approved creative assets, WhatsApp sharing generators, and marketing materials for your enrolled deals.
          </p>
        </div>
      </div>

      {/* Brand Compliance Banner */}
      <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <strong>Brand Compliance Guideline:</strong> You may personalize customer messages and outreach scripts. You must not alter product pricing, commercial claims, legal disclaimers, or official business brand names.
        </div>
      </div>

      {/* Select Active Deal */}
      <div>
        <label className="font-bold text-xs block mb-1 text-slate-700 dark:text-slate-300">
          Select Enrolled Deal Toolkit
        </label>
        <select
          value={selectedDealId}
          onChange={(e) => setSelectedDealId(e.target.value)}
          className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-medium"
        >
          {joinedDeals.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title} ({d.businessName})
            </option>
          ))}
        </select>
      </div>

      {/* 1-Click WhatsApp Sharing Generator */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>1-Click WhatsApp Referral Message</span>
          </h3>
          <button
            onClick={handleShareWhatsApp}
            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
          >
            <span>Open WhatsApp</span>
          </button>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          {whatsappPitch}
        </div>

        <button
          onClick={() => handleCopy(whatsappPitch, 'WhatsApp Pitch')}
          className="py-1.5 px-3 border rounded-xl font-bold text-xs hover:bg-white dark:hover:bg-slate-900 flex items-center gap-1"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copy Message Text</span>
        </button>
      </div>

      {/* Social Media Caption Generator */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF6A00]" />
          <span>Social Media Caption & Promo Voucher</span>
        </h3>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {instagramCaption}
        </div>

        <button
          onClick={() => handleCopy(instagramCaption, 'Social Caption')}
          className="py-1.5 px-3 border rounded-xl font-bold text-xs hover:bg-white dark:hover:bg-slate-900 flex items-center gap-1"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copy Social Caption</span>
        </button>
      </div>

      {/* Downloadable Marketing Assets */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Approved Business Collateral & Downloads
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-red-500" />
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Product Spec Brochure 2026</div>
                <span className="text-[10px] text-slate-400">PDF · 2.4 MB</span>
              </div>
            </div>
            <button
              onClick={() => showToast('success', 'PDF Downloaded', 'Product brochure saved.')}
              className="p-2 border rounded-xl hover:bg-white"
            >
              <Download className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Film className="w-5 h-5 text-purple-500" />
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Product Demo Video Reel</div>
                <span className="text-[10px] text-slate-400">MP4 · 18.2 MB</span>
              </div>
            </div>
            <button
              onClick={() => showToast('success', 'Video Reel Downloaded', 'Video pitch clip saved.')}
              className="p-2 border rounded-xl hover:bg-white"
            >
              <Download className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
