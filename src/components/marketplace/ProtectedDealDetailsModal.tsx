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
  Image as ImageIcon,
  MessageSquare,
  BadgeCheck,
  Clock,
} from 'lucide-react'
import type { ProtectedDealDetails } from '@/modules/deals/service'
import { DealMediaViewer } from '@/components/common/DealMediaViewer'
import { joinOpportunityDeal, getVideoEmbedInfo } from '@/modules/deals/service'
import { CustomerReferralModal } from '@/components/marketplace/CustomerReferralModal'
import { PromotionalToolkitModal } from '@/components/marketplace/PromotionalToolkitModal'
import { useLanguage } from '@/lib/i18n'
import { formatCategoryBadgeLabel } from '@/modules/deals/taxonomy'

interface ProtectedDealDetailsModalProps {
  deal: ProtectedDealDetails | null
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
  partnerName?: string
  partnerPhone?: string
  userRole?: string
  userOrgId?: string
  onDealJoined?: (code: string) => void
  onConnectWhatsApp?: () => void
}

export function ProtectedDealDetailsModal({
  deal,
  isOpen,
  onClose,
  currentUserId,
  partnerName = 'Alex Mwakasege',
  partnerPhone = '+255712345678',
  userRole = 'PARTNER',
  userOrgId,
  onDealJoined,
  onConnectWhatsApp,
}: ProtectedDealDetailsModalProps) {
  const { t, locale } = useLanguage()
  const [isJoining, setIsJoining] = useState(false)
  const [joinedCode, setJoinedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [mediaMode, setMediaMode] = useState<'PHOTO' | 'VIDEO'>('PHOTO')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [showPromoModal, setShowPromoModal] = useState(false)

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
    const userSuffix = currentUserId ? currentUserId.slice(-4).toUpperCase() : 'MEMBER'
    const code = joinedCode || `LUMO-${deal.companyLogo || 'TZ'}-${userSuffix}`
    navigator.clipboard.writeText(`https://lumo.co.tz/d/${deal.slug}?ref=${code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-4 pb-24 sm:p-7 sm:pb-7 shadow-2xl relative overflow-y-auto max-h-[calc(100dvh-1rem)] space-y-5 sm:space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{locale === 'sw' ? 'Fursa Kamili Imefunguliwa' : 'Full Opportunity Unlocked'}</span>
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {formatCategoryBadgeLabel(deal.category, undefined, locale)} · {t(deal.region)}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white leading-snug">
            {deal.title}
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            {locale === 'sw'
              ? <span>Imechapishwa na <strong>Lumo Dealers</strong> · Maswali na uratibu hushughulikiwa na Lumo</span>
              : <span>Published by <strong>Lumo Dealers</strong> · Enquiries and coordination handled by Lumo</span>}
          </p>
        </div>

        {/* Media & Video Pitch Explorer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMediaMode('PHOTO')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mediaMode === 'PHOTO'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>High-Res Image</span>
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
                  <span>Video Pitch</span>
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
              <DealMediaViewer
                mediaUrl={deal.promoVideoUrl}
                posterUrl={deal.featuredImageUrl}
                altTitle={deal.title}
                className="w-full h-full object-contain"
              />
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
            <div className="mb-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                PRINCIPAL PRICE / DEAL VALUE
              </div>
              <div className="mt-0.5 font-mono text-base font-black text-slate-900 dark:text-white">
                {deal.principalPriceDisplay || 'Price on request'}
              </div>
            </div>
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
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Lumo Coordination Desk</span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              Enquiries and customer introductions handled by Lumo.
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
              <span>Ref-based WhatsApp Coordination</span>
            </div>
          </div>
        </div>

        {/* Product Quality & Verified Inspection Standards */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-emerald-500" />
              <span>Product Quality & Inspection Guarantee</span>
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {deal.qualityScore || 96}% Verified Quality Grade
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Condition</p>
              <p className="font-black text-slate-900 dark:text-white mt-0.5">
                {deal.productCondition ? deal.productCondition.replace(/_/g, ' ') : 'Brand New'}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Warranty</p>
              <p className="font-black text-slate-900 dark:text-white mt-0.5">
                {deal.warrantyPeriod || '12M Warranty'}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Protection Window</p>
              <p className="font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {deal.inspectionWindowHours || 48}h Quality Hold
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Min Order Qty</p>
              <p className="font-black text-slate-900 dark:text-white mt-0.5">
                {deal.minOrderQuantity || 1} Unit(s)
              </p>
            </div>
          </div>

          {/* WhatsApp Coordination Trigger */}
          {onConnectWhatsApp && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onConnectWhatsApp}
                className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <MessageSquare className="w-4 h-4 fill-slate-950" />
                <span>{locale === 'sw' ? 'Wasiliana na Dawati la Uratibu la Lumo kupitia WhatsApp' : 'Connect with Lumo Coordination Desk via WhatsApp'}</span>
              </button>
            </div>
          )}
        </div>


        {/* Join / Active Tracking Action Area */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0F172A] to-[#0B132B] text-white border border-slate-800 shadow-xl space-y-4 my-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-black text-[#FF6A00]">
              <Sparkles className="w-4 h-4" />
              <span className="uppercase tracking-wider">
                {locale === 'sw' ? 'Utangazaji na Hatua za Rufaa za Mshirika' : 'Partner Promotion & Referral Actions'}
              </span>
            </div>
            {joinedCode || deal.isAlreadyJoined ? (
              <span className="text-[11px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{locale === 'sw' ? 'Umejiunga & Uko Tayari' : 'Enrolled & Ready'}</span>
              </span>
            ) : null}
          </div>

          {joinedCode || deal.isAlreadyJoined ? (
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 bg-slate-900/90 rounded-xl border border-slate-700/80">
                <div className="font-mono text-[11px] text-orange-400 truncate px-1 py-0.5 selection:bg-orange-500 selection:text-white">
                  https://lumo.co.tz/d/{deal.slug}?ref={joinedCode || `LUMO-TZ-${currentUserId ? currentUserId.slice(-4).toUpperCase() : 'MEMBER'}`}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2 px-3.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-black rounded-lg transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? (locale === 'sw' ? 'Imenakiliwa!' : 'Copied!') : (locale === 'sw' ? 'Nakili Kiungo' : 'Copy Link')}</span>
                </button>
              </div>

              {/* Two Primary Partner Action Buttons for Enrolled Partner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(true)}
                  className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl border border-slate-700/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                >
                  <Download className="w-4 h-4 text-[#FF6A00]" />
                  <span>{t('Get Promotional Materials')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReferralModal(true)}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#FF6A00] to-orange-500 hover:from-[#EA580C] hover:to-orange-600 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#FF6A00]/25 active:scale-98"
                >
                  <span>{t('I Have a Customer')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-slate-900/90 p-3.5 text-xs text-slate-200 border border-slate-800">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#FF6A00] rounded"
                />
                <span className="leading-snug">
                  {locale === 'sw'
                    ? 'Ninaelewa na kukubali masharti ya kibiashara yaliyochapishwa na malipo ya moja kwa moja kutoka kwa mfanyabiashara.'
                    : 'I understand and accept the published commercial terms and direct merchant settlement.'}
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={isJoining || !termsAccepted}
                  className="w-full py-3.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isJoining ? (locale === 'sw' ? 'Inajiunga...' : 'Joining Deal...') : t('Join & Promote')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReferralModal(true)}
                  className="w-full py-3.5 px-4 bg-white text-slate-950 hover:bg-slate-100 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('I Have a Customer')}</span>
                  <ArrowRight className="w-4 h-4 text-[#FF6A00]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <CustomerReferralModal
          deal={deal}
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          currentUserId={currentUserId}
          partnerName={partnerName}
          partnerPhone={partnerPhone}
          userRole={userRole}
          userOrgId={userOrgId}
          onReferralSubmitted={() => {
            onDealJoined?.(joinedCode || deal.slug)
          }}
        />

        {showPromoModal && (
          <PromotionalToolkitModal
            dealTitle={deal.title}
            companyName="Lumo Dealers"
            trackingCode={joinedCode || `LUMO-TZ-${currentUserId ? currentUserId.slice(-4).toUpperCase() : 'MEMBER'}`}
            rewardDisplay={deal.rewardDisplay}
            onClose={() => setShowPromoModal(false)}
          />
        )}
      </div>
    </div>
  )
}
