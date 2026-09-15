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
  onConnectWhatsApp,
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

  const getCategoryPill = (category: string) => {
    switch (category) {
      case 'Renewable Energy':
        return 'bg-emerald-600/90 text-white'
      case 'Fintech & Payments':
        return 'bg-blue-600/90 text-white'
      case 'Travel & Hospitality':
        return 'bg-purple-600/90 text-white'
      case 'Agriculture & FMCG':
        return 'bg-teal-600/90 text-white'
      case 'Technology & Enterprise':
        return 'bg-indigo-600/90 text-white'
      case 'Food & Beverage':
        return 'bg-amber-600/90 text-white'
      default:
        return 'bg-slate-800/90 text-white'
    }
  }

  return (
    <article className={`group flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl dark:bg-slate-900 ${
      isVipDeal
        ? 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/20'
        : 'border-[#E2E8F0] dark:border-slate-800 hover:border-orange-200'
    }`}>
      <div>
        <div className="relative mb-3.5 h-56 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 sm:h-60">
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
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
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

          {/* Badges container top-left */}
          <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap items-center gap-1.5 max-w-[calc(100%-3rem)]">
            {isEnrolled && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase shadow-md border border-emerald-400/40 backdrop-blur-md">
                <Check className="w-3 h-3 text-white" />
                <span>{t('Enrolled')}</span>
              </span>
            )}

            {isVipDeal && (
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm flex items-center gap-1 ${
                isWithin24hVipWindow
                  ? 'bg-amber-500 text-slate-950 border border-amber-300'
                  : 'bg-emerald-600/90 text-white'
              }`}>
                <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                <span>
                  {isWithin24hVipWindow
                    ? `${locale === 'sw' ? 'Kipaumbele cha VIP' : 'VIP 24h Priority'}: ${hoursRemainingVip}h ${minsRemainingVip}m`
                    : (locale === 'sw' ? 'Imetolewa kwa Washirika' : 'Partner Released')}
                </span>
              </span>
            )}

            {!isVipDeal && !isEnrolled && (
              <span
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs ${getCategoryPill(
                  item.category
                )}`}
              >
                {formatCategoryBadgeLabel(item.category, item.subcategory, locale)}
              </span>
            )}
          </div>

          <div className="absolute top-2.5 right-2.5 z-10">
            <button
              onClick={onToggleSave}
              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-xs ${
                isSaved
                  ? 'bg-white text-[#FF6A00]'
                  : 'bg-black/40 hover:bg-black/60 text-white'
              }`}
              aria-label={isSaved ? (locale === 'sw' ? 'Ondoa fursa' : 'Unsave opportunity') : (locale === 'sw' ? 'Hifadhi fursa' : 'Save opportunity')}
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-[#FF6A00]" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quality Score overlay badge */}
          {item.qualityScore && (
            <div className="absolute bottom-2.5 right-2.5 z-10">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-900/80 text-emerald-400 backdrop-blur-md border border-slate-700/50 flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-400 shrink-0" /> {item.qualityScore}% {locale === 'sw' ? 'Ubora' : 'Quality'}
              </span>
            </div>
          )}
        </div>

        <h3 className="mb-2 line-clamp-2 min-h-11 text-center text-sm font-black leading-snug text-[#0F172A] transition-colors group-hover:text-[#FF6A00] dark:text-white sm:text-base">
          {(locale === 'sw' && item.titleSw) ? item.titleSw : item.title}
        </h3>

        <p className="mb-3 line-clamp-2 min-h-10 text-xs leading-5 text-slate-600 dark:text-slate-400">
          {(locale === 'sw' && item.summarySw) ? item.summarySw : item.summary}
        </p>

        {/* VIP Exclusivity Notice for non-VIPs during 24h window */}
        {isVipLockedForUser && (
          <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50/80 p-2 text-center text-[11px] font-bold text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300">
            <span className="inline-flex items-center justify-center gap-1.5"><Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" /> {locale === 'sw' ? `Dirisha la Ufikiaji wa Mapema kwa VIP linatumika. Litaanza kwa washirika wote baada ya saa ${hoursRemainingVip} na dakika ${minsRemainingVip}.` : `Golden VIP Early Access window active. Opens to all partners in ${hoursRemainingVip}h ${minsRemainingVip}m.`}</span>
          </div>
        )}

        <dl className="mb-3 space-y-2 border-t border-slate-100 pt-3 text-[11px] dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-slate-500">{t('Category')}</dt>
            <dd className="max-w-[65%] truncate text-right font-bold text-slate-800 dark:text-slate-200">{formatCategoryBadgeLabel(item.category, item.subcategory, locale)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-slate-500">{t('Publisher')}</dt>
            <dd className="flex max-w-[65%] items-center gap-1 truncate text-right font-bold text-slate-800 dark:text-slate-200">
              <span className="truncate">Lumo Dealers</span>
              <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500" />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-800/70">
            <dt className="font-bold text-slate-600 dark:text-slate-300">{t('Price')}</dt>
            <dd className="max-w-[68%] text-right font-black text-[#0F172A] dark:text-white">
              {item.principalPriceDisplay || t('Price on request')}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-slate-500">{t('Partner Reward')}</dt>
            <dd className="text-right font-black text-orange-600">{item.rewardDisplay}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-slate-500">{t('Time Left')}</dt>
            <dd className={`flex items-center justify-end gap-1 text-right font-bold ${
              expiryLabel === 'Expired' || expiryLabel === 'Imeisha muda' ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'
            }`} title={expiry ? `Expires ${expiry.toLocaleDateString()}` : undefined}>
              <Clock3 className="h-3.5 w-3.5 shrink-0" />
              <span>{expiryLabel}</span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-slate-500">{t('Location')}</dt>
            <dd className="flex max-w-[65%] items-center gap-1 truncate text-right font-bold text-slate-700 dark:text-slate-300"><MapPin className="h-3 w-3 shrink-0 text-orange-500" /><span className="truncate">{t(item.region)}</span></dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onViewDetails}
            className="flex w-full items-center justify-center gap-1 rounded-xl border border-[#E2E8F0] bg-white px-2 py-2.5 text-center text-[11px] sm:text-xs font-extrabold text-[#0F172A] shadow-2xs transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            {isVipLockedForUser ? (
              <span key="vip-preview" className="inline-flex items-center justify-center gap-1 truncate">
                <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">{t('VIP Preview')}</span>
              </span>
            ) : !isSubscribed ? (
              <span key="full-deal" className="inline-flex items-center justify-center gap-1 truncate">
                <Lock className="w-3 h-3 text-[#FF6A00] shrink-0" />
                <span className="truncate">{t('View Full Deal')}</span>
              </span>
            ) : (
              <span key="view-details" className="inline-flex items-center justify-center gap-1 truncate">
                <span className="truncate">{t('View Details')}</span>
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={isEnrolled ? (onOpenEnrolled || onViewDetails) : onApply}
            disabled={isExpired}
            className={`flex w-full items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center text-[11px] sm:text-xs font-extrabold text-white shadow-xs transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700 cursor-pointer ${
              isExpired
                ? 'bg-slate-400'
                : isEnrolled
                ? 'bg-emerald-600 hover:bg-emerald-700 ring-1 ring-emerald-400/40 shadow-emerald-500/20 shadow-sm'
                : isVipLockedForUser
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-[#FF6A00] hover:bg-[#EA580C]'
            }`}
          >
            {isExpired ? (
              <span key="expired" className="inline-flex items-center justify-center gap-1 truncate">
                <span className="truncate">{t('Deal Expired')}</span>
              </span>
            ) : isEnrolled ? (
              <span key="enrolled" className="inline-flex items-center justify-center gap-1 truncate">
                <CheckCircle className="h-3.5 w-3.5 text-white shrink-0" />
                <span className="truncate">{t('Enrolled ✓')}</span>
              </span>
            ) : isVipLockedForUser ? (
              <span key="unlock-vip" className="inline-flex items-center justify-center gap-1 truncate">
                <Crown className="h-3.5 w-3.5 text-white/90 shrink-0" />
                <span className="truncate">{t('Unlock with VIP')}</span>
              </span>
            ) : isSubscribed ? (
              <span key="join-deal" className="inline-flex items-center justify-center gap-1 truncate">
                <span className="truncate">{t('Join & Promote')}</span>
              </span>
            ) : (
              <span key="sub-join" className="inline-flex items-center justify-center gap-1 truncate">
                <Lock className="w-3 h-3 text-white/90 shrink-0" />
                <span className="truncate">{t('Subscribe to Join')}</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
