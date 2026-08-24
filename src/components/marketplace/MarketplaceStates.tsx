'use client'

import React from 'react'
import { Search, AlertCircle, RefreshCw } from 'lucide-react'

export function OpportunityCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-6 animate-pulse space-y-4 min-h-[360px] flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="space-y-1.5 flex-1">
            <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="w-full h-5 bg-slate-200 dark:bg-slate-800 rounded mt-4" />
        <div className="w-4/5 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>

      <div className="space-y-3">
        <div className="w-full h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        <div className="flex items-center justify-between pt-2">
          <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="flex gap-2">
            <div className="w-16 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="w-20 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function MarketplaceEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-2xs max-w-xl mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#F97316] flex items-center justify-center mx-auto mb-4">
        <Search className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">
        No active commercial opportunities published yet
      </h3>
      <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
        The marketplace is clean and ready. Businesses can create and pre-fund new opportunities to start partnering with top creators across Tanzania.
      </p>
      <button
        onClick={onReset}
        className="py-2.5 px-5 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
      >
        Reset Search / Clear Filters
      </button>
    </div>
  )
}

export function MarketplaceErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 max-w-xl mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">
        Unable to load opportunities
      </h3>
      <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
        An error occurred while fetching real commercial opportunities. Please verify your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="py-2.5 px-5 border border-[#E2E8F0] dark:border-slate-700 text-[#0F172A] dark:text-white font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 mx-auto"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry Loading Deals</span>
      </button>
    </div>
  )
}
