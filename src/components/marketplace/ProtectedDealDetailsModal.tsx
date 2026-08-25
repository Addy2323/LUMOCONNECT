'use client'

import React, { useState } from 'react'
import {
  X,
  CheckCircle2,
  Lock,
  Download,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Check,
  QrCode,
  Share2,
  Sparkles,
  Film,
  Play,
  ExternalLink,
} from 'lucide-react'
import type { ProtectedDealDetails } from '@/modules/deals/service'
import { joinOpportunityDeal } from '@/modules/deals/service'

interface ProtectedDealDetailsModalProps {
  deal: ProtectedDealDetails | null
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
  userRole?: string
  userOrgId?: string
  onDealJoined?: (code: string) => void
}

export function ProtectedDealDetailsModal({
  deal,
  isOpen,
  onClose,
  currentUserId = 'alex_partner',
  userRole = 'PARTNER',
  userOrgId,
  onDealJoined,
}: ProtectedDealDetailsModalProps) {
  const [isJoining, setIsJoining] = useState(false)
  const [joinedCode, setJoinedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [mediaMode, setMediaMode] = useState<'PHOTO' | 'VIDEO'>('PHOTO')

  if (!isOpen || !deal) return null

  const handleJoin = () => {
    setIsJoining(true)
    const res = joinOpportunityDeal(deal.id, {
      userId: currentUserId,
      userRole,
      userOrgId,
    })
    setIsJoining(false)
    if (res.success && res.trackingCode) {
      setJoinedCode(res.trackingCode)
      onDealJoined?.(res.trackingCode)
    }
  }

  const handleCopyLink = () => {
    const code = joinedCode || `LUMO-${deal.companyLogo || 'TZ'}-${currentUserId.slice(-4).toUpperCase()}`
    navigator.clipboard.writeText(`https://lumo.co.tz/d/${deal.slug}?ref=${code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-y-auto max-h-[90vh] space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full Opportunity Unlocked</span>
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {deal.category} · {deal.region}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white leading-snug">
            {deal.title}
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Published by <strong>{deal.companyName}</strong> (Verified Tanzanian Enterprise)
          </p>
        </div>

        {/* Media & Video Pitch Explorer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMediaMode('PHOTO')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mediaMode === 'PHOTO'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🖼️ High-Res Image
              </button>
              {deal.promoVideoUrl && (
                <button
                  type="button"
                  onClick={() => setMediaMode('VIDEO')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    mediaMode === 'VIDEO'
                      ? 'bg-[#FF6A00] text-white shadow-xs'
                      : 'text-slate-500 hover:text-[#FF6A00]'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>🎬 Video Pitch</span>
                </button>
              )}
            </div>

            {deal.featuredImageUrl && (
              <a
                href={deal.featuredImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-[#FF6A00] hover:underline flex items-center gap-1"
              >
                <span>Full Resolution</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {mediaMode === 'VIDEO' && deal.promoVideoUrl ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800 shadow-md">
              {deal.promoVideoUrl.includes('youtube.com') || deal.promoVideoUrl.includes('youtu.be') ? (
                <iframe
                  src={
                    deal.promoVideoUrl.includes('watch?v=')
                      ? deal.promoVideoUrl.replace('watch?v=', 'embed/')
                      : deal.promoVideoUrl.includes('youtu.be/')
                      ? deal.promoVideoUrl.replace('youtu.be/', 'www.youtube.com/embed/')
                      : deal.promoVideoUrl
                  }
                  title={deal.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  controls
                  autoPlay
                  src={deal.promoVideoUrl}
                  className="w-full h-full object-contain"
                  poster={deal.featuredImageUrl}
                >
                  Your browser does not support HTML5 video streaming.
                </video>
              )}
            </div>
          ) : deal.featuredImageUrl ? (
            <div className="h-44 sm:h-52 w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800 relative group bg-slate-900">
              <img src={deal.featuredImageUrl} alt={deal.title} className="w-full h-full object-cover" />
              {deal.promoVideoUrl && (
                <button
                  type="button"
                  onClick={() => setMediaMode('VIDEO')}
                  className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-slate-900 ml-0.5 text-slate-900" />
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* Reward & Payout Box */}
        <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-orange-900 dark:text-orange-300">
              CONFIDENTIAL REWARD TERMS
            </div>
            <div className="text-2xl font-black text-[#FF6A00] font-mono mt-0.5">
              {deal.rewardDisplay}
            </div>
            <div className="text-xs text-orange-950 dark:text-orange-200 mt-0.5">
              Formula: <em>{deal.commissionFormula}</em>
            </div>
          </div>

          <div className="text-right sm:text-right w-full sm:w-auto">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              SETTLEMENT
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              Direct M-Pesa / TZS Bank
            </div>
          </div>
        </div>

        {/* Deliverables & Full Description */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Deliverable Specifications
            </h4>
            <div className="space-y-2">
              {deal.deliverableChecklist.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#0F172A] dark:text-slate-200">
                  <Check className="w-4 h-4 text-[#FF6A00] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Eligibility & Risk Rules
            </h4>
            <div className="space-y-2">
              {deal.eligibilityRequirements.map((req, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sales Materials & Direct Contact Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
              <Download className="w-4 h-4 text-[#FF6A00]" />
              <span>Promotional Sales Kit</span>
            </div>
            <p className="text-[11px] text-slate-500">
              High-res product flyers, WhatsApp banners, and pitch decks.
            </p>
            <a
              href={deal.salesAssetsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6A00] hover:text-[#EA580C]"
            >
              <span>Download Media Pack</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
              <Mail className="w-4 h-4 text-blue-500" />
              <span>Direct Business Contact</span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
              {deal.businessContactEmail}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{deal.businessContactPhone}</span>
            </div>
          </div>
        </div>

        {/* Join / Active Tracking Action Area */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FF6A00]">
              <Sparkles className="w-4 h-4" />
              <span>Performance Tracking Link</span>
            </div>
            {joinedCode || deal.isAlreadyJoined ? (
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enrolled & Ready</span>
              </span>
            ) : null}
          </div>

          {joinedCode || deal.isAlreadyJoined ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                <span className="font-mono text-xs text-orange-400 truncate">
                  https://lumo.co.tz/d/{deal.slug}?ref={joinedCode || `LUMO-${deal.companyLogo || 'TZ'}-${currentUserId.slice(-4).toUpperCase()}`}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-1 px-3 bg-[#FF6A00] text-white text-xs font-bold rounded-lg hover:bg-[#EA580C] shrink-0 ml-2"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-300">
                Start promoting this opportunity to generate verifiable sales and earn rewards.
              </p>
              <button
                type="button"
                onClick={handleJoin}
                disabled={isJoining}
                className="py-3 px-6 bg-[#FF6A00] hover:bg-[#EA580C] disabled:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
              >
                {isJoining ? 'Joining Deal...' : 'Join Deal & Generate Link'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
