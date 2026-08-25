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

  const whatsappPitch = `Habari! Kama unatafuta ofa maalum kutoka ${selectedDeal?.businessName || 'LUMO Partner'}, tumia link hii kupata usajili wa haraka: ${selectedDeal?.trackingLink || 'https://lumo.co.tz'}`

  const instagramCaption = `💡 Pata huduma na bidhaa bora kutoka ${selectedDeal?.businessName || 'LUMO Partner'}! Tumia promo code: ${selectedDeal?.promoCode || 'LUMOPROMO'} kupata ofa maalum. Link ipo kwenye bio! #LUMOTanzania`

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    showToast('success', 'Copied to Clipboard', `${label} copied. Ready to share.`)
  }

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappPitch)}`
    window.open(url, '_blank')
  }

  if (joinedDeals.length === 0 || !selectedDeal) {
    return (
      <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Sales & Marketing Promotional Toolkit</span>
              <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-2 py-0.5 rounded-full">
                Promotion Tools
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Approved creative assets, WhatsApp sharing generators, and marketing materials for your enrolled deals.
            </p>
          </div>
        </div>

        <div className="text-center py-16 px-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 max-w-lg mx-auto my-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No Deals Joined Yet
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto mb-6">
            Join a commercial opportunity from the marketplace to automatically unlock dedicated WhatsApp templates, social media captions, banners, and promotional toolkits.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Sales & Marketing Promotional Toolkit</span>
            <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-2 py-0.5 rounded-full">
              Promotion Tools
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

      {/* Creative Assets & Media Kit */}
      {selectedDeal && (
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-[#FF6A00]" />
              <span>Deal Promotional Creatives & Video Pitch</span>
            </h3>
            {selectedDeal.coverImageUrl && (
              <a
                href={selectedDeal.coverImageUrl}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 bg-[#FF6A00] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Media Pack</span>
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Promo Banner Preview */}
            {selectedDeal.coverImageUrl ? (
              <div className="h-44 rounded-2xl overflow-hidden bg-slate-900 border relative group">
                <img
                  src={selectedDeal.coverImageUrl}
                  alt={selectedDeal.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  Official High-Res Flyer
                </div>
              </div>
            ) : (
              <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold">
                No flyer uploaded
              </div>
            )}

            {/* Video Pitch Player or Information */}
            {selectedDeal.promoVideoUrl ? (
              <div className="h-44 rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                {selectedDeal.promoVideoUrl.includes('youtube.com') || selectedDeal.promoVideoUrl.includes('youtu.be') ? (
                  <iframe
                    src={
                      selectedDeal.promoVideoUrl.includes('watch?v=')
                        ? selectedDeal.promoVideoUrl.replace('watch?v=', 'embed/')
                        : selectedDeal.promoVideoUrl.includes('youtu.be/')
                        ? selectedDeal.promoVideoUrl.replace('youtu.be/', 'www.youtube.com/embed/')
                        : selectedDeal.promoVideoUrl
                    }
                    title={selectedDeal.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    controls
                    src={selectedDeal.promoVideoUrl}
                    className="w-full h-full object-contain"
                    poster={selectedDeal.coverImageUrl}
                  >
                    Your browser does not support video streaming.
                  </video>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col justify-center space-y-2">
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Merchant Pitch Summary
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-3">
                  {selectedDeal.deliverablesSummary || 'Promote this opportunity across your channels to earn verified commissions on every qualified transaction.'}
                </p>
                <div className="text-[10px] font-mono font-black text-[#FF6A00]">
                  Reward: {selectedDeal.rewardDisplay}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1-Click WhatsApp Sharing Generator */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>1-Click WhatsApp Referral Message</span>
          </h3>
          <button
            onClick={handleShareWhatsApp}
            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <span>Open WhatsApp</span>
          </button>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          {whatsappPitch}
        </div>

        <button
          onClick={() => handleCopy(whatsappPitch, 'WhatsApp Pitch')}
          className="py-1.5 px-3 border rounded-xl font-bold text-xs hover:bg-white dark:hover:bg-slate-900 flex items-center gap-1 cursor-pointer"
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

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
          {instagramCaption}
        </div>

        <button
          onClick={() => handleCopy(instagramCaption, 'Instagram Caption')}
          className="py-1.5 px-3 border rounded-xl font-bold text-xs hover:bg-white dark:hover:bg-slate-900 flex items-center gap-1 cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copy Caption</span>
        </button>
      </div>
    </div>
  )
}
