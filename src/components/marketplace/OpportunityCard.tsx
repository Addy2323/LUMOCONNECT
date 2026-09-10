'use client'

import React from 'react'
import {
  CheckCircle,
  MapPin,
  Bookmark,
  Check,
  Lock,
  Clock3,
} from 'lucide-react'
import type { OpportunityItem } from '@/modules/deals/types'

interface OpportunityCardProps {
  item: OpportunityItem
  isSaved?: boolean
  isSubscribed?: boolean
  isGoldenVipUser?: boolean
  onToggleSave?: () => void
  onApply?: () => void
  onViewDetails?: () => void
  onConnectWhatsApp?: () => void
}

export function OpportunityCard({
  item,
  isSaved = false,
  isSubscribed = false,
  isGoldenVipUser = false,
  onToggleSave,
  onApply,
  onViewDetails,
  onConnectWhatsApp,
}: OpportunityCardProps) {
  const expiry = item.expiryDate ? new Date(item.expiryDate) : null
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  const daysRemaining = expiry
    ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / millisecondsPerDay))
    : null
  const expiryLabel = daysRemaining === null
    ? 'No expiry date'
    : expiry!.getTime() <= Date.now()
      ? 'Expired'
      : daysRemaining === 1
        ? '1 day remaining'
        : `${daysRemaining} days remaining`
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
          {item.featuredImageUrl ? (
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
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-slate-500 font-bold text-xs">
              LUMO Deal
            </div>
          )}

          {/* Golden VIP 24h Priority Badge */}
          {isVipDeal && (
            <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm flex items-center gap-1 ${
                isWithin24hVipWindow
                  ? 'bg-amber-500 text-slate-950 border border-amber-300'
                  : 'bg-emerald-600/90 text-white'
              }`}>
                <span>👑</span>
                <span>
                  {isWithin24hVipWindow
                    ? `VIP 24h Priority: ${hoursRemainingVip}h ${minsRemainingVip}m`
                    : 'Partner Released'}
                </span>
              </span>
            </div>
          )}

          {!isVipDeal && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs ${getCategoryPill(
                  item.category
                )}`}
              >
                {item.subcategory || item.category}
              </span>
            </div>
          )}

          <div className="absolute top-2.5 right-2.5 z-10">
            <button
              onClick={onToggleSave}
              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-xs ${
                isSaved
                  ? 'bg-white text-[#FF6A00]'
                  : 'bg-black/40 hover:bg-black/60 text-white'
              }`}
              aria-label={isSaved ? 'Unsave opportunity' : 'Save opportunity'}
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-[#FF6A00]" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quality Score overlay badge */}
          {item.qualityScore && (
            <div className="absolute bottom-2.5 right-2.5 z-10">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-900/80 text-emerald-400 backdrop-blur-md border border-slate-700/50 flex items-center gap-1">
                <span>✓</span> {item.qualityScore}% Quality
              </span>
            </div>
          )}
        </div>

        <h3 className="mb-2 line-clamp-2 min-h-11 text-center text-sm font-black leading-snug text-[#0F172A] transition-colors group-hover:text-[#FF6A00] dark:text-white sm:text-base">
          {item.title}
        </h3>

        <p className="mb-3 line-clamp-2 min-h-10 text-xs leading-5 text-slate-600 dark:text-slate-400">
          {item.summary}
        </p>

        {/* VIP Exclusivity Notice for non-VIPs during 24h window */}
        {isVipLockedForUser && (
          <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50/80 p-2 text-center text-[11px] font-bold text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300">
            <span>🔒 Golden VIP Early Access window active. Opens to all partners in {hoursRemainingVip}h {minsRemainingVip}m.</span>
          </div>
        )}

        <dl className="mb-3 space-y-2 border-t border-slate-100 pt-3 text-[11px] dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-slate-500">Category</dt>
            <dd className="max-w-[65%] truncate text-right font-bold text-slate-800 dark:text-slate-200">{item.subcategory || item.category}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-slate-500">Posted by</dt>
            <dd className="flex max-w-[65%] items-center gap-1 truncate text-right font-bold text-blue-600">
              <span className="truncate">{item.companyName}</span>
              {item.isVerified && <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500" />}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-800/70">
            <dt className="font-bold text-slate-600 dark:text-slate-300">Principal price</dt>
            <dd className="max-w-[68%] text-right font-black text-[#0F172A] dark:text-white">
              {item.principalPriceDisplay || 'Price on request'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-slate-500">Partner reward</dt>
            <dd className="text-right font-black text-orange-600">{item.rewardDisplay}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-slate-500">Time left</dt>
            <dd className={`flex items-center justify-end gap-1 text-right font-bold ${
              expiryLabel === 'Expired' ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'
            }`} title={expiry ? `Expires ${expiry.toLocaleDateString()}` : undefined}>
              <Clock3 className="h-3.5 w-3.5 shrink-0" />
              <span>{expiryLabel}</span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-slate-500">Location</dt>
            <dd className="flex max-w-[65%] items-center gap-1 truncate text-right font-bold text-slate-700 dark:text-slate-300"><MapPin className="h-3 w-3 shrink-0 text-orange-500" /><span className="truncate">{item.region}</span></dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-slate-100 pt-3 dark:border-slate-800 space-y-2">
        {/* WhatsApp Escrow Direct Action */}
        <button
          type="button"
          onClick={onConnectWhatsApp}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#15803d] dark:text-[#25D366] border border-[#25D366]/30 py-2 px-3 text-center text-xs font-black transition-colors cursor-pointer"
        >
          <span>💬</span>
          <span>Connect via WhatsApp (Lumo Escrow)</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onViewDetails}
            className="flex w-full items-center justify-center gap-1 rounded-xl border border-[#E2E8F0] bg-white px-2 py-2.5 text-center text-[11px] sm:text-xs font-extrabold text-[#0F172A] shadow-2xs transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            {isVipLockedForUser ? (
              <>
                <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">VIP Preview</span>
              </>
            ) : !isSubscribed ? (
              <>
                <Lock className="w-3 h-3 text-[#FF6A00] shrink-0" />
                <span className="truncate">View Full Deal</span>
              </>
            ) : (
              <span className="truncate">View Details</span>
            )}
          </button>

          <button
            type="button"
            onClick={onApply}
            disabled={isExpired}
            className={`flex w-full items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center text-[11px] sm:text-xs font-extrabold text-white shadow-xs transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700 cursor-pointer ${
              isVipLockedForUser
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-[#FF6A00] hover:bg-[#EA580C]'
            }`}
          >
            {isExpired ? (
              <span className="truncate">Deal Expired</span>
            ) : isVipLockedForUser ? (
              <>
                <span>👑</span>
                <span className="truncate">Unlock with VIP</span>
              </>
            ) : isSubscribed ? (
              <span className="truncate">Join Deal</span>
            ) : (
              <>
                <Lock className="w-3 h-3 text-white/90 shrink-0" />
                <span className="truncate">Subscribe to Join</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
