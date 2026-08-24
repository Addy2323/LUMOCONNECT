'use client'

import React from 'react'
import { PlusCircle } from 'lucide-react'

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
  const isBusinessOrAdmin = currentUserRole === 'BUSINESS' || currentUserRole === 'ADMIN'

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
          Live Commercial Opportunities
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
          Verified business deals with measurable results across Tanzania and East Africa.
        </p>
      </div>

      {isBusinessOrAdmin && (
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={onPostOpportunity}
            className="hidden sm:inline-flex items-center gap-2 py-2 px-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
          >
            <PlusCircle className="w-4 h-4 text-[#FF6A00]" />
            <span>Post an Opportunity</span>
          </button>
        </div>
      )}
    </div>
  )
}
