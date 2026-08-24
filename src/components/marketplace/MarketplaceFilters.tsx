'use client'

import React, { useState } from 'react'
import { Search, SlidersHorizontal, X, ChevronDown, ArrowUpDown } from 'lucide-react'

interface MarketplaceFiltersProps {
  query: string
  onQueryChange: (q: string) => void
  selectedCategory: string
  onCategoryChange: (cat: string) => void
  selectedType: string
  onTypeChange: (type: string) => void
  selectedRegion: string
  onRegionChange: (reg: string) => void
  sortBy: string
  onSortChange: (sort: any) => void
  onClearFilters: () => void
  activeFilterCount: number
  totalResults: number
}

export const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'Renewable Energy', label: 'Renewable Energy' },
  { value: 'Fintech & Payments', label: 'Fintech & Payments' },
  { value: 'Travel & Hospitality', label: 'Travel & Hospitality' },
  { value: 'Agriculture & FMCG', label: 'Agriculture & FMCG' },
  { value: 'Technology & Enterprise', label: 'Technology & Enterprise' },
  { value: 'Food & Beverage', label: 'Food & Beverage' },
  { value: 'Education & EdTech', label: 'Education & EdTech' },
  { value: 'Construction & Sourcing', label: 'Construction & Sourcing' },
]

export const OPPORTUNITY_TYPES = [
  { value: 'ALL', label: 'All Types' },
  { value: 'CUSTOMER_ACQUISITION', label: 'Customer Acquisition' },
  { value: 'QUALIFIED_LEADS', label: 'Qualified Leads' },
  { value: 'CONTENT_CREATION', label: 'Content & Influence' },
  { value: 'DISTRIBUTOR_SEARCH', label: 'Distributor Search' },
  { value: 'B2B_INTRODUCTION', label: 'B2B Commercial Leads' },
  { value: 'PRODUCT_SALES', label: 'Product Sales / Affiliate' },
  { value: 'SUBSCRIPTION_PROMOTION', label: 'Subscription Promotions' },
  { value: 'REVERSE_SOURCING', label: 'Reverse-Sourcing Bounties' },
]

export const REGIONS = [
  { value: 'ALL', label: 'All Regions' },
  { value: 'Dar es Salaam', label: 'Dar es Salaam' },
  { value: 'Arusha', label: 'Arusha' },
  { value: 'Mwanza', label: 'Mwanza' },
  { value: 'Dodoma', label: 'Dodoma' },
  { value: 'Mbeya', label: 'Mbeya' },
  { value: 'Morogoro', label: 'Morogoro' },
  { value: 'Zanzibar', label: 'Zanzibar' },
  { value: 'Kilimanjaro', label: 'Kilimanjaro' },
]

export function MarketplaceFilters({
  query,
  onQueryChange,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  selectedRegion,
  onRegionChange,
  sortBy,
  onSortChange,
  onClearFilters,
  activeFilterCount,
  totalResults,
}: MarketplaceFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="bg-transparent sm:bg-white dark:sm:bg-slate-900 sm:border sm:border-[#E2E8F0] dark:sm:border-slate-800 rounded-2xl p-0 sm:p-4 mb-6 shadow-none sm:shadow-2xs">
      {/* Mobile Layout (Strictly matches the mobile screenshot) */}
      <div className="space-y-3 lg:hidden">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search deals, businesses or products"
            className="w-full pl-9 pr-8 py-3 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white shadow-2xs focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00]"
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2 Equal Control Buttons: Filters & Sort */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="py-2.5 px-4 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-[#0F172A] dark:text-white flex items-center justify-center gap-2 shadow-2xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FF6A00] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="w-full appearance-none py-2.5 pl-8 pr-7 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-bold text-[#0F172A] dark:text-white shadow-2xs focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00]"
            >
              <option value="newest">Sort: Newest</option>
              <option value="recommended">Sort: Recommended</option>
              <option value="highest_reward">Sort: Highest Reward</option>
            </select>
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Desktop Layout (5-column elevated filter controls) */}
      <div className="hidden lg:grid grid-cols-12 gap-3 items-end">
        {/* Search */}
        <div className="col-span-4">
          <label className="block text-[11px] font-semibold text-[#64748B] dark:text-slate-400 mb-1.5">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search deals, businesses or products"
              className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white text-[#0F172A] dark:text-white focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00]"
            />
            {query && (
              <button
                onClick={() => onQueryChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold text-[#64748B] dark:text-slate-400 mb-1.5">
            Category
          </label>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full appearance-none py-2.5 pl-3.5 pr-8 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 text-[#0F172A] dark:text-white font-medium focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Opportunity Type */}
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold text-[#64748B] dark:text-slate-400 mb-1.5">
            Opportunity Type
          </label>
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full appearance-none py-2.5 pl-3.5 pr-8 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 text-[#0F172A] dark:text-white font-medium focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00]"
            >
              {OPPORTUNITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Region */}
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold text-[#64748B] dark:text-slate-400 mb-1.5">
            Region
          </label>
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="w-full appearance-none py-2.5 pl-3.5 pr-8 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 text-[#0F172A] dark:text-white font-medium focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00]"
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Filters Button */}
        <div className="col-span-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-2.5 px-4 rounded-xl border border-[#E2E8F0] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-[#0F172A] dark:text-white flex items-center justify-center gap-2 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#FF6A00] text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filter Drawer (Categories & Regions drawer on mobile when clicking Filters) */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#64748B] mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full py-2 px-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#64748B] mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => onTypeChange(e.target.value)}
                className="w-full py-2 px-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                {OPPORTUNITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#64748B] mb-1">Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => onRegionChange(e.target.value)}
                className="w-full py-2 px-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 text-xs">
          <span className="text-[#64748B] font-semibold mr-1">Active:</span>

          {query && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-[11px]">
              <span>&quot;{query}&quot;</span>
              <button onClick={() => onQueryChange('')} className="hover:text-[#FF6A00]">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCategory !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-[11px]">
              <span>{selectedCategory}</span>
              <button onClick={() => onCategoryChange('ALL')} className="hover:text-[#FF6A00]">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={onClearFilters}
            className="text-[#FF6A00] hover:text-[#EA580C] font-semibold ml-auto text-[11px]"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
