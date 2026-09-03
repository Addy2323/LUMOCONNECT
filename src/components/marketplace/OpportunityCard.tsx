'use client'

import React from 'react'
import {
  CheckCircle,
  MapPin,
  Bookmark,
  Check,
  Lock,
} from 'lucide-react'
import type { OpportunityItem } from '@/modules/deals/types'

interface OpportunityCardProps {
  item: OpportunityItem
  isSaved?: boolean
  isSubscribed?: boolean
  onToggleSave?: () => void
  onApply?: () => void
  onViewDetails?: () => void
}

export function OpportunityCard({
  item,
  isSaved = false,
  isSubscribed = false,
  onToggleSave,
  onApply,
  onViewDetails,
}: OpportunityCardProps) {
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
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="relative mb-4 h-56 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 sm:h-60">
          {item.featuredImageUrl ? (
            <img
              src={item.featuredImageUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-slate-800 to-slate-950 flex items-center justify-center text-slate-500 font-bold text-xs">
              LUMO Deal
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 z-10">
            <span
              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs ${getCategoryPill(
                item.category
              )}`}
            >
              {item.subcategory || item.category}
            </span>
          </div>

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

        </div>

        <h3 className="mb-4 line-clamp-2 min-h-11 text-center text-sm font-black leading-snug text-[#0F172A] transition-colors group-hover:text-[#FF6A00] dark:text-white sm:text-base">
          {item.title}
        </h3>

        <p className="mb-4 line-clamp-3 min-h-15 text-xs leading-5 text-slate-600 dark:text-slate-400">
          {item.summary}
        </p>

        <dl className="mb-4 space-y-2.5 border-t border-slate-100 pt-3 text-[11px] dark:border-slate-800">
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
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-slate-500">Reward</dt>
            <dd className="text-right font-black text-orange-600">{item.rewardDisplay}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-slate-500">Location</dt>
            <dd className="flex max-w-[65%] items-center gap-1 truncate text-right font-bold text-slate-700 dark:text-slate-300"><MapPin className="h-3 w-3 shrink-0 text-orange-500" /><span className="truncate">{item.region}</span></dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onViewDetails}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-2.5 py-2.5 text-center text-xs font-extrabold text-[#0F172A] shadow-2xs transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {!isSubscribed && <Lock className="w-3 h-3 text-[#FF6A00]" />}
            <span>{isSubscribed ? 'View Details' : 'View Full Deal'}</span>
          </button>

          <button
            type="button"
            onClick={onApply}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#FF6A00] px-2.5 py-2.5 text-center text-xs font-extrabold text-white shadow-xs transition-colors hover:bg-[#EA580C] active:scale-[0.98]"
          >
            {!isSubscribed && <Lock className="w-3 h-3 text-white/90" />}
            <span>{isSubscribed ? 'Join Deal' : 'Subscribe to Join'}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
