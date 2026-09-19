'use client'

import React from 'react'
import {
  CheckCircle,
  MapPin,
  Bookmark,
  Check,
  Lock,
  Clock3,
  Crown,
  Users,
  Eye,
  Star,
  CheckCircle2,
  House,
  CarFront,
  Package,
  Sprout,
  BriefcaseBusiness,
  Wrench,
  Building2,
  CreditCard,
  Coins,
} from 'lucide-react'
import type { OpportunityItem } from '@/modules/deals/types'
import { DealMediaViewer } from '@/components/common/DealMediaViewer'
import { formatCategoryBadgeLabel } from '@/modules/deals/taxonomy'
import { useLanguage, getDaysRemainingLabel } from '@/lib/i18n'

interface OpportunityCardProps {
  item: OpportunityItem
  isSaved?: boolean
  isSubscribed?: boolean
  isGoldenVipUser?: boolean
  isEnrolled?: boolean
  onToggleSave?: () => void
  onApply?: () => void
  onViewDetails?: () => void
  onOpenEnrolled?: () => void
  onConnectWhatsApp?: () => void
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'Property':
    case 'Real Estate':
      return House
    case 'Vehicles':
    case 'Automotive & Transport':
      return CarFront
    case 'Products':
    case 'Building materials':
      return Package
    case 'Agriculture & Commodities':
    case 'Agriculture & FMCG':
      return Sprout
    case 'Business':
    case 'Technology & Enterprise':
    case 'Fintech & Payments':
      return BriefcaseBusiness
    case 'Services':
    case 'Construction & Sourcing':
      return Wrench
    default:
      return Package
  }
}

export function OpportunityCard({
  item,
  isSaved = false,
  isSubscribed = false,
  isGoldenVipUser = false,
  isEnrolled = false,
  onToggleSave,
  onApply,
  onViewDetails,
  onOpenEnrolled,
}: OpportunityCardProps) {
  const { t, locale } = useLanguage()
  const expiry = item.expiryDate ? new Date(item.expiryDate) : null
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  const daysRemaining = expiry
    ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / millisecondsPerDay))
    : null
  const expiryLabel = daysRemaining === null
    ? (locale === 'sw' ? 'Hakuna tarehe ya mwisho' : 'No expiry date')
    : expiry!.getTime() <= Date.now()
      ? (locale === 'sw' ? 'Imeisha muda' : 'Expired')
      : getDaysRemainingLabel(daysRemaining, locale)
  const isExpired = Boolean(expiry && expiry.getTime() <= Date.now())

  // Golden VIP 24-hour window computation
  const isVipDeal = Boolean(item.isGoldenVip)
  const now = Date.now()
  const vipReleaseTime = item.vipReleaseAt ? new Date(item.vipReleaseAt).getTime() : 0
  const isWithin24hVipWindow = isVipDeal && vipReleaseTime > now
  const msRemainingVip = isWithin24hVipWindow ? vipReleaseTime - now : 0
  const hoursRemainingVip = Math.floor(msRemainingVip / (1000 * 60 * 60))
  const minsRemainingVip = Math.floor((msRemainingVip % (1000 * 60 * 60)) / (1000 * 60))

  // A deal in its 24h window is locked for normal non-VIP partners
  const isVipLockedForUser = isWithin24hVipWindow && !isGoldenVipUser

  // Completed deal detection & disappear countdown
  const isCompleted = item.status === 'COMPLETED'
  const completedTime = isCompleted
    ? (item.completedAt ? new Date(item.completedAt).getTime() : item.createdAt.getTime())
    : 0
  const msUntilDisappear = isCompleted ? Math.max(0, (completedTime + 2 * 60 * 60 * 1000) - now) : 0
  const minsUntilDisappear = Math.ceil(msUntilDisappear / (1000 * 60))
  const disappearLabel = minsUntilDisappear >= 60
    ? `${Math.floor(minsUntilDisappear / 60)}h ${minsUntilDisappear % 60}m`
    : `${minsUntilDisappear}m`

  const CategoryIcon = getCategoryIcon(item.category)

  return (
    <article className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 ${
      isCompleted
        ? 'border-emerald-300 dark:border-emerald-700/60 opacity-75'
        : isVipDeal
        ? 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/20'
        : 'border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-900/50'
    }`}>
      {/* Completed deal ribbon */}
      {isCompleted && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-emerald-600 text-white text-center py-1.5 px-2 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{locale === 'sw' ? 'Imekamilika' : 'Deal Completed'}</span>
          <span className="ml-1 px-1.5 py-0.5 bg-emerald-800/60 rounded text-[9px]">
            {locale === 'sw' ? `Itatoweka ${disappearLabel}` : `Disappears in ${disappearLabel}`}
          </span>
        </div>
      )}

      <div className={isCompleted ? 'pt-6' : ''}>
        {/* Deal Media / Image */}
        <div className="relative mb-1 h-52 sm:h-56 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
          {item.promoVideoUrl ? (
            <DealMediaViewer
              mediaUrl={item.promoVideoUrl}
              posterUrl={item.featuredImageUrl}
              altTitle={item.title}
              className="w-full h-full object-cover"
            />
          ) : item.featuredImageUrl ? (
            <img
              src={item.featuredImageUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = '/placeholder.jpg'
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-slate-400 font-bold text-xs gap-1.5 p-4 text-center">
              <span className="text-2xl font-black text-[#FF6A00] tracking-wider">LUMO</span>
              <span className="text-[11px] font-semibold text-slate-300">{item.subcategory || item.category} Opportunity</span>
            </div>
          )}

          {/* Top-Left Badges: Verified Deal or Enrolled */}
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
            {isEnrolled ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase shadow-md border border-emerald-400/40 backdrop-blur-md">
                <Check className="w-3 h-3 text-white" />
                <span>{t('Enrolled')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-md backdrop-blur-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>{locale === 'sw' ? 'Fursa Iliyothibitishwa' : 'Verified Deal'}</span>
              </span>
            )}
            {isVipDeal && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black shadow-md backdrop-blur-md">
                <Crown className="w-3 h-3 text-slate-950" />
                <span>VIP</span>
              </span>
            )}
          </div>

          {/* Top-Right Badges: Featured and Bookmark */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
            {(item.isFeatured || item.isGoldenVip) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-slate-900 dark:bg-slate-900/95 dark:text-white text-[11px] font-bold shadow-sm backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{locale === 'sw' ? 'Imeangaziwa' : 'Featured'}</span>
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleSave?.()
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                isSaved
                  ? 'bg-white text-[#FF6A00]'
                  : 'bg-black/40 hover:bg-black/60 text-white'
              }`}
              aria-label={isSaved ? (locale === 'sw' ? 'Ondoa fursa' : 'Unsave opportunity') : (locale === 'sw' ? 'Hifadhi fursa' : 'Save opportunity')}
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-[#FF6A00]" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Category Pill and Region Row (under image) */}
        <div className="flex items-center justify-between gap-2 mt-3 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <CategoryIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{formatCategoryBadgeLabel(item.category, item.subcategory, locale)}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{t(item.region)}</span>
          </span>
        </div>

        {/* Deal Title */}
        <h3 className="line-clamp-2 text-base font-black text-slate-900 dark:text-white group-hover:text-[#FF6A00] transition-colors leading-snug">
          {(locale === 'sw' && item.titleSw) ? item.titleSw : item.title}
        </h3>

        {/* Deal Summary Description */}
        <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-3.5 leading-relaxed min-h-[34px]">
          {(locale === 'sw' && item.summarySw) ? item.summarySw : item.summary}
        </p>

        {/* VIP Exclusivity Notice for non-VIPs during 24h window */}
        {isVipLockedForUser && (
          <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50/80 p-2 text-center text-[11px] font-bold text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300">
            <span className="inline-flex items-center justify-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              {locale === 'sw'
                ? `Dirisha la VIP litaanza kwa washirika wote baada ya saa ${hoursRemainingVip} na dakika ${minsRemainingVip}.`
                : `Golden VIP Early Access window active. Opens to all in ${hoursRemainingVip}h ${minsRemainingVip}m.`}
            </span>
          </div>
        )}

        {/* 5 Specifications Rows */}
        <dl className="space-y-2.5 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs mb-4">
          {/* Row 1: Publisher */}
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{t('Publisher')}</span>
            </dt>
            <dd className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 truncate text-right">
              <span className="truncate">{item.companyName || 'Lumo Dealers'}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            </dd>
          </div>

          {/* Row 2: Price */}
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{t('Price')}</span>
            </dt>
            <dd className="font-bold text-slate-900 dark:text-slate-100 text-right">
              {item.principalPriceDisplay || t('Price on request')}
            </dd>
          </div>

          {/* Row 3: Partner Reward */}
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Coins className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{t('Partner Reward')}</span>
            </dt>
            <dd className="font-black text-[#FF6A00] text-xs sm:text-sm text-right">
              {item.rewardDisplay}
            </dd>
          </div>

          {/* Row 4: Time Left */}
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Clock3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{t('Time Left')}</span>
            </dt>
            <dd className={`flex items-center gap-1 font-bold text-right ${
              expiryLabel === 'Expired' || expiryLabel === 'Imeisha muda'
                ? 'text-rose-600'
                : daysRemaining === null
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-orange-600 dark:text-orange-400'
            }`}>
              <Clock3 className="w-3.5 h-3.5 shrink-0" />
              <span>{expiryLabel}</span>
            </dd>
          </div>

          {/* Row 5: Partners Enrolled */}
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{locale === 'sw' ? 'Washirika' : 'Partners Enrolled'}</span>
            </dt>
            <dd className="font-bold text-slate-900 dark:text-slate-100 text-right">
              {item.activePartnerCount || 0}{item.maxPartners ? ` / ${item.maxPartners}` : ''}
            </dd>
          </div>
        </dl>
      </div>

      {/* 2 Bottom Action Buttons (50/50 split) */}
      <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onViewDetails}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{t('View Full Deal')}</span>
        </button>

        <button
          type="button"
          onClick={isEnrolled ? (onOpenEnrolled || onViewDetails) : onApply}
          disabled={isExpired}
          className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold text-white shadow-xs active:scale-[0.98] transition cursor-pointer ${
            isExpired
              ? 'bg-slate-400 cursor-not-allowed'
              : isEnrolled
              ? 'bg-emerald-600 hover:bg-emerald-700 ring-1 ring-emerald-400/40 shadow-emerald-500/20 shadow-sm'
              : isVipLockedForUser
              ? 'bg-amber-600 hover:bg-amber-500'
              : 'bg-[#FF6A00] hover:bg-[#EA580C]'
          }`}
        >
          {isExpired ? (
            <span className="truncate">{t('Deal Expired')}</span>
          ) : isEnrolled ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="truncate">{t('Enrolled ✓')}</span>
            </>
          ) : isVipLockedForUser ? (
            <>
              <Crown className="w-3.5 h-3.5 text-white/90 shrink-0" />
              <span className="truncate">{t('Unlock with VIP')}</span>
            </>
          ) : isSubscribed ? (
            <>
              <Users className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="truncate">{t('Join & Promote')}</span>
            </>
          ) : (
            <>
              <Users className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="truncate">{t('Subscribe to Join')}</span>
            </>
          )}
        </button>
      </div>
    </article>
  )
}
