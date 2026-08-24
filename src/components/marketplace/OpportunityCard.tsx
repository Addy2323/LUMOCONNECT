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

  const getCompanyAvatarBg = (logo: string) => {
    switch (logo) {
      case 'KS':
        return 'bg-[#0B1220] text-[#FF6A00]'
      case 'MP':
        return 'bg-[#0B1220] text-blue-400'
      case 'SB':
        return 'bg-[#0B1220] text-purple-400'
      case 'KF':
        return 'bg-[#042f2e] text-emerald-400'
      case 'BT':
        return 'bg-[#0B1220] text-cyan-400'
      case 'TC':
        return 'bg-[#451a03] text-amber-400'
      default:
        return 'bg-[#0B1220] text-orange-400'
    }
  }

  return (
    <article className="group bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden">
      <div>
        {/* Sample Image Container with Floating Category & Bookmark Badges */}
        <div className="relative h-44 sm:h-48 w-full rounded-2xl overflow-hidden mb-3.5 bg-slate-100 dark:bg-slate-800">
          {item.featuredImageUrl ? (
            <img
              src={item.featuredImageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-slate-800 to-slate-950 flex items-center justify-center text-slate-500 font-bold text-xs">
              LUMO Deal
            </div>
          )}

          {/* Floating Category Pill on Top-Left */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span
              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs ${getCategoryPill(
                item.category
              )}`}
            >
              {item.category}
            </span>
          </div>

          {/* Floating Bookmark Button on Top-Right */}
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

          {/* Company Avatar Floating on Bottom-Left */}
          <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 border border-white/40 dark:border-slate-700/60 shadow-md ${getCompanyAvatarBg(
                item.companyLogo || item.companyName.slice(0, 2)
              )}`}
            >
              {item.companyLogo || item.companyName.slice(0, 2).toUpperCase()}
            </div>
            <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1">
              <span className="text-[11px] font-bold text-white truncate max-w-[140px]">{item.companyName}</span>
              {item.isVerified && (
                <CheckCircle className="w-3 h-3 text-emerald-400 fill-emerald-400/20 shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Region & Location Indicator */}
        <div className="flex items-center gap-1 text-[11px] font-medium text-[#64748B] dark:text-slate-400 mb-1.5 truncate">
          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
          <span className="truncate">{item.region}</span>
        </div>

        {/* Deal Title */}
        <h3 className="font-extrabold text-[#0F172A] dark:text-white text-sm sm:text-base leading-snug mb-3 line-clamp-2 group-hover:text-[#FF6A00] transition-colors">
          {item.title}
        </h3>
      </div>

      {/* Bottom Section: Reward Stats & Action Buttons */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Reward & Partners Row */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              POTENTIAL REWARD
            </div>
            <div className="text-base sm:text-lg font-black text-[#FF6A00] font-mono mt-0.5">
              {item.rewardDisplay}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              PARTNERS
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {item.activePartnerCount}+ active
            </div>
          </div>
        </div>

        {/* 2 Equal Action Buttons: Details & Join Deal */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onViewDetails}
            className="w-full py-2.5 px-2.5 text-xs font-extrabold text-[#0F172A] dark:text-slate-200 border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-center shadow-2xs flex items-center justify-center gap-1.5"
          >
            {!isSubscribed && <Lock className="w-3 h-3 text-[#FF6A00]" />}
            <span>{isSubscribed ? 'View Details' : 'View Full Deal'}</span>
          </button>

          <button
            type="button"
            onClick={onApply}
            className="w-full py-2.5 px-2.5 text-xs font-extrabold text-white bg-[#FF6A00] hover:bg-[#EA580C] rounded-xl shadow-xs transition-colors text-center active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            {!isSubscribed && <Lock className="w-3 h-3 text-white/90" />}
            <span>{isSubscribed ? 'Join Deal' : 'Subscribe to Join'}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
