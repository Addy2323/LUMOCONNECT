'use client'

import React from 'react'
import { BadgeCheck, MapPinned, PlusCircle, Store } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

interface MarketplaceSectionHeaderProps {
  onPostOpportunity: () => void
  currentUserRole?: string
  sortBy: 'recommended' | 'highest_reward' | 'newest' | 'ending_soon'
  onSortChange: (sort: 'recommended' | 'highest_reward' | 'newest' | 'ending_soon') => void
  totalCount: number
}

export function MarketplaceSectionHeader({
  onPostOpportunity,
  currentUserRole = 'GUEST',
  sortBy,
  onSortChange,
  totalCount,
}: MarketplaceSectionHeaderProps) {
  const { t, locale } = useLanguage()
  const isBusinessOrAdmin = currentUserRole === 'BUSINESS' || currentUserRole === 'ADMIN'

  return (
    <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange-600">
            <Store className="h-4 w-4" /> {locale === 'sw' ? 'Soko la LUMO' : 'LUMO Marketplace'}
          </div>
          <h2 id="marketplace-title" className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
            {locale === 'sw' ? 'Fursa na Dili Zote' : 'All Deals & Opportunities'}
          </h2>
          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400 sm:text-sm">
            {locale === 'sw'
              ? 'Vinjari kila fursa iliyothibitishwa inayopatikana nchini Tanzania mahali pamoja.'
              : 'Browse every verified deal available across Tanzania in one place.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" /> {locale === 'sw' ? `Fursa ${totalCount} zilizothibitishwa` : `${totalCount} verified deals`}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
              <MapPinned className="h-3.5 w-3.5 text-orange-500" /> {locale === 'sw' ? 'Mikoa yote ya Tanzania' : 'All Tanzania regions'}
            </span>
          </div>
        </div>

        {isBusinessOrAdmin && (
          <button
            onClick={onPostOpportunity}
            className="hidden items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-slate-800 dark:bg-slate-800 sm:inline-flex"
          >
            <PlusCircle className="h-4 w-4 text-[#FF6A00]" />
            <span>{locale === 'sw' ? 'Weka Fursa Mpya' : 'Post an Opportunity'}</span>
          </button>
        )}
      </div>
    </div>
  )
}
