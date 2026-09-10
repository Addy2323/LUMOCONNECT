'use client'

import React, { useState } from 'react'
import type { OpportunityItem } from '@/modules/deals/types'
import { MarketplaceSectionHeader } from './MarketplaceSectionHeader'
import { MarketplaceFilters } from './MarketplaceFilters'
import { MarketplaceEmptyState } from './MarketplaceStates'
import { OpportunityCard } from './OpportunityCard'
import {
  BriefcaseBusiness,
  CarFront,
  ChevronDown,
  Grid3X3,
  House,
  MapPin,
  Package,
  Search,
  SlidersHorizontal,
  Sprout,
  Wrench,
  X,
  Crown,
  Flame,
} from 'lucide-react'
import { TANZANIA_OPPORTUNITY_CATEGORIES, TANZANIA_REGIONS } from '@/modules/deals/taxonomy'
import { OPPORTUNITY_TYPES } from './MarketplaceFilters'

type MarketplaceSort = 'recommended' | 'highest_reward' | 'newest' | 'ending_soon'

interface MarketplaceCatalogProps {
  opportunities: OpportunityItem[]
  query: string
  onQueryChange: (query: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  selectedType: string
  onTypeChange: (type: string) => void
  selectedRegion: string
  onRegionChange: (region: string) => void
  sortBy: MarketplaceSort
  onSortChange: (sort: MarketplaceSort) => void
  onClearFilters: () => void
  activeFilterCount: number
  minReward: number
  onMinRewardChange: (value: number) => void
  currentUserRole: string
  currentUserOrgId?: string
  hasActiveSubscription: boolean
  isGoldenVipUser?: boolean
  savedDeals: string[]
  onToggleSave: (dealId: string) => void
  onDealAction: (opportunity: OpportunityItem, intent: 'view' | 'join') => void
  onPostOpportunity: () => void
  onConnectWhatsApp?: (opportunity: OpportunityItem) => void
  onUpgradeToVip?: () => void
}

export function MarketplaceCatalog({
  opportunities,
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
  minReward,
  onMinRewardChange,
  currentUserRole,
  currentUserOrgId,
  hasActiveSubscription,
  isGoldenVipUser = false,
  savedDeals,
  onToggleSave,
  onDealAction,
  onPostOpportunity,
  onConnectWhatsApp,
  onUpgradeToVip,
}: MarketplaceCatalogProps) {
  const categoryIcons = [House, CarFront, Package, Sprout, BriefcaseBusiness, Wrench]
  const [vipTab, setVipTab] = useState<'ALL' | 'VIP' | 'STANDARD'>('ALL')

  const vipCount = opportunities.filter((item) => Boolean(item.isGoldenVip)).length
  const standardCount = opportunities.filter((item) => !item.isGoldenVip).length

  const displayedOpportunities = opportunities.filter((item) => {
    if (vipTab === 'VIP') return Boolean(item.isGoldenVip)
    if (vipTab === 'STANDARD') return !item.isGoldenVip
    return true
  })

  return (
    <section id="marketplace" aria-labelledby="marketplace-title" className="scroll-mt-24">
      <div id="marketplace-filters-section" className="scroll-mt-24 pt-2">
        <MarketplaceSectionHeader
          onPostOpportunity={onPostOpportunity}
          currentUserRole={currentUserRole}
          sortBy={sortBy}
          onSortChange={onSortChange}
          totalCount={opportunities.length}
        />
      </div>

      <div className="lg:hidden">
        <MarketplaceFilters
          query={query}
          onQueryChange={onQueryChange}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          selectedType={selectedType}
          onTypeChange={onTypeChange}
          selectedRegion={selectedRegion}
          onRegionChange={onRegionChange}
          sortBy={sortBy}
          onSortChange={onSortChange}
          onClearFilters={onClearFilters}
          activeFilterCount={activeFilterCount}
          totalResults={opportunities.length}
        />
      </div>

      <div className="items-start gap-6 lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="sticky top-24 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
              <SlidersHorizontal className="h-4 w-4 text-orange-500" /> Categories
            </h3>
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={() => onCategoryChange('ALL')}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${selectedCategory === 'ALL' ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
            >
              <Grid3X3 className="h-4 w-4" /> All Categories
            </button>
            {TANZANIA_OPPORTUNITY_CATEGORIES.map((category, index) => {
              const Icon = categoryIcons[index]
              const selected = selectedCategory === category.value || category.subcategories.includes(selectedCategory)
              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => onCategoryChange(category.value)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${selected ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                >
                  <Icon className="h-4 w-4" /> {category.label}
                </button>
              )
            })}
          </div>

          <div className="space-y-4 border-t border-slate-200 p-5 dark:border-slate-800">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <MapPin className="h-3.5 w-3.5" /> Region
              </span>
              <select value={selectedRegion} onChange={(event) => onRegionChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="ALL">All Regions</option>
                {TANZANIA_REGIONS.filter((region) => region !== 'All Tanzania').map((region) => <option key={region} value={region}>{region}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Opportunity type</span>
              <select value={selectedType} onChange={(event) => onTypeChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                {OPPORTUNITY_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Minimum reward</span>
              <select value={minReward} onChange={(event) => onMinRewardChange(Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value={0}>Any reward</option>
                <option value={50000}>TZS 50,000+</option>
                <option value={100000}>TZS 100,000+</option>
                <option value={250000}>TZS 250,000+</option>
                <option value={500000}>TZS 500,000+</option>
              </select>
            </label>

            {activeFilterCount > 0 && <button type="button" onClick={onClearFilters} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:text-slate-300"><X className="h-3.5 w-3.5" /> Clear filters</button>}
          </div>
        </aside>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/30 sm:p-5">
          {/* Golden VIP 24h Early Access Promo Banner */}
          <div className="mb-4 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 p-4 dark:border-amber-700/60 dark:bg-amber-950/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">👑</span>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Golden VIP 24-Hour Exclusivity Window</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
                      1 Month VIP Free with Annual
                    </span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    VIP & Annual subscribers get first-look early access during the first 24 hours of hot deals. Regular partners see deals unlock after 24 hours.
                  </p>
                </div>
              </div>
              {onUpgradeToVip && (
                <button
                  type="button"
                  onClick={onUpgradeToVip}
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-sm hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer"
                >
                  Get Annual (1 Mo VIP Free) →
                </button>
              )}
            </div>
          </div>

          {/* Unified Marketplace Tabs: All, Golden VIP, Standard Deals */}
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setVipTab('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                vipTab === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              All Deals ({opportunities.length})
            </button>

            <button
              type="button"
              onClick={() => setVipTab('VIP')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                vipTab === 'VIP'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>👑</span>
              <span>Golden VIP Early Access ({vipCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setVipTab('STANDARD')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                vipTab === 'STANDARD'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>🤝</span>
              <span>Standard Partner Deals ({standardCount})</span>
            </button>
          </div>

          <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-900 dark:text-white">
                {vipTab === 'VIP' ? 'Golden VIP Priority Opportunities' : vipTab === 'STANDARD' ? 'Standard Partner Deals' : 'All Marketplace Opportunities'}
              </p>
              <p className="mt-1 text-xs text-slate-500">Showing {displayedOpportunities.length} opportunities</p>
            </div>
            <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2 sm:max-w-xl sm:justify-end">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search marketplace..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900" />
              </div>
              <div className="relative">
                <select value={sortBy} onChange={(event) => onSortChange(event.target.value as MarketplaceSort)} aria-label="Sort marketplace deals" className="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-xs font-bold outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900">
                  <option value="recommended">Recommended</option>
                  <option value="newest">Newest</option>
                  <option value="highest_reward">Highest reward</option>
                  <option value="ending_soon">Ending soon</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {displayedOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 pb-4 md:grid-cols-2 xl:grid-cols-3">
              {displayedOpportunities.map((item) => {
                const isOwner = Boolean(currentUserOrgId && currentUserOrgId === item.organizationId)
                const isAdmin = currentUserRole === 'ADMIN'
                const isAuthorizedForThisDeal = hasActiveSubscription || isOwner || isAdmin

                return (
                  <OpportunityCard
                    key={item.id}
                    item={item}
                    isSubscribed={isAuthorizedForThisDeal}
                    isGoldenVipUser={isGoldenVipUser}
                    isSaved={savedDeals.includes(item.id)}
                    onToggleSave={() => onToggleSave(item.id)}
                    onApply={() => onDealAction(item, 'join')}
                    onViewDetails={() => onDealAction(item, 'view')}
                    onConnectWhatsApp={() => onConnectWhatsApp?.(item)}
                  />
                )
              })}
            </div>
          ) : (
            <MarketplaceEmptyState onReset={onClearFilters} />
          )}
        </div>
      </div>
    </section>
  )
}
