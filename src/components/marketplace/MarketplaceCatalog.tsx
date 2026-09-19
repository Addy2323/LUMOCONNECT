'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import type { OpportunityItem } from '@/modules/deals/types'
import { getUserEnrolledDealIds } from '@/modules/deals/service'
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
  Store,
  CheckCircle2,
  Layers,
  Users,
  ArrowUpDown,
  Coins,
  ShieldCheck,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import {
  TANZANIA_OPPORTUNITY_CATEGORIES,
  TANZANIA_REGIONS,
  getLocalizedCategoryLabel,
  matchesOpportunityCategory,
} from '@/modules/deals/taxonomy'
import { OPPORTUNITY_TYPES } from './MarketplaceFilters'
import { useLanguage } from '@/lib/i18n'

type MarketplaceSort = 'recommended' | 'highest_reward' | 'newest' | 'ending_soon'

interface MarketplaceCatalogProps {
  opportunities: OpportunityItem[]
  allOpportunities?: OpportunityItem[]
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
  currentUserId?: string
  hasActiveSubscription: boolean
  isGoldenVipUser?: boolean
  savedDeals: string[]
  onToggleSave: (dealId: string) => void
  onDealAction: (opportunity: OpportunityItem, intent: 'view' | 'join') => void
  onPostOpportunity: () => void
  onConnectWhatsApp?: (opportunity: OpportunityItem) => void
  onUpgradeToVip?: () => void
  footer?: React.ReactNode
}

export function MarketplaceCatalog({
  opportunities,
  allOpportunities,
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
  currentUserId,
  hasActiveSubscription,
  isGoldenVipUser = false,
  savedDeals,
  onToggleSave,
  onDealAction,
  onPostOpportunity,
  onConnectWhatsApp,
  footer,
}: MarketplaceCatalogProps) {
  const { t, locale } = useLanguage()
  const categoryIcons = [House, CarFront, Package, Sprout, BriefcaseBusiness, Wrench]
  const resultsRef = useRef<HTMLDivElement>(null)
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(() => getUserEnrolledDealIds(currentUserId))

  useEffect(() => {
    resultsRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [query, selectedCategory, selectedType, selectedRegion, sortBy, minReward])

  useEffect(() => {
    const syncEnrolled = () => {
      setEnrolledIds(getUserEnrolledDealIds(currentUserId))
    }
    syncEnrolled()

    window.addEventListener('lumo:joined-deals-updated', syncEnrolled)
    window.addEventListener('lumo:deals-updated', syncEnrolled)
    window.addEventListener('storage', syncEnrolled)

    return () => {
      window.removeEventListener('lumo:joined-deals-updated', syncEnrolled)
      window.removeEventListener('lumo:deals-updated', syncEnrolled)
      window.removeEventListener('storage', syncEnrolled)
    }
  }, [currentUserId])

  const totalPool = allOpportunities && allOpportunities.length > 0 ? allOpportunities : opportunities
  const verifiedDealsCount = totalPool.filter((item) => item.isVerified).length || totalPool.length

  const getCategoryCount = (categoryValue: string) => {
    if (categoryValue === 'ALL') return totalPool.length
    return totalPool.filter((item) =>
      matchesOpportunityCategory(item.category, categoryValue, item.subcategory)
    ).length
  }

  const canSeeVipProducts = Boolean(isGoldenVipUser || currentUserRole === 'ADMIN')
  const displayedOpportunities = useMemo(() => {
    const seenIds = new Set<string>()
    return opportunities.filter((item) => {
      if (!item || !item.id || seenIds.has(item.id)) return false
      seenIds.add(item.id)
      if (item.isGoldenVip && !canSeeVipProducts) {
        return false
      }
      return true
    })
  }, [opportunities, canSeeVipProducts])

  return (
    <section id="marketplace" aria-labelledby="marketplace-title" className="marketplace-workspace scroll-mt-24 pb-12">
      {/* 1. TOP HERO BANNER (Dar es Salaam Skyline + Slogan) */}
      <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#071124] shadow-xl">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-luminosity"
          style={{ backgroundImage: `url('/images/dar_skyline_banner.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060D1E]/95 via-[#081329]/85 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-5 sm:p-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-orange-500">
              <Store className="h-4 w-4" />
              <span>LUMO MARKETPLACE</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">
              All Deals & Opportunities
            </h1>
            <p className="text-xs text-slate-300 sm:text-sm">
              Browse every verified deal and business opportunity across Tanzania in one place.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1.5 sm:pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{verifiedDealsCount} verified deals</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                <MapPin className="h-3.5 w-3.5 text-slate-300" />
                <span>All Tanzania regions</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                <Layers className="h-3.5 w-3.5 text-slate-300" />
                <span>Real opportunities</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                <Users className="h-3.5 w-3.5 text-slate-300" />
                <span>Grow together</span>
              </span>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-end justify-center pr-4 pt-2">
            <div className="font-script text-3xl font-semibold italic text-white/95 text-right leading-tight drop-shadow-md">
              Opportunities<br />
              Build a Brighter<br />
              Tanzania
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden mb-4">
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

      {/* 2. TWO-COLUMN LAYOUT: SIDEBAR + PRODUCT GRID */}
      <div className="marketplace-columns items-start gap-6 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Left Sidebar */}
        <aside
          aria-label={locale === 'sw' ? 'Vichujio vya soko' : 'Marketplace filters'}
          className="marketplace-sidebar hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
              <SlidersHorizontal className="h-4 w-4 text-orange-500" /> {t('Filters')}
            </h3>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
              >
                {locale === 'sw' ? 'Futa yote' : 'Clear all'}
              </button>
            ) : null}
          </div>

          <div className="p-2 space-y-1">
            <button
              type="button"
              onClick={() => onCategoryChange('ALL')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold transition cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-3">
                <Grid3X3 className="h-4 w-4" />
                <span>{locale === 'sw' ? 'Makundi Yote' : 'All Categories'}</span>
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  selectedCategory === 'ALL'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {getCategoryCount('ALL')}
              </span>
            </button>

            {TANZANIA_OPPORTUNITY_CATEGORIES.map((category, index) => {
              const Icon = categoryIcons[index]
              const selected = selectedCategory === category.value || category.subcategories.includes(selectedCategory)
              const count = getCategoryCount(category.value)
              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => onCategoryChange(category.value)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold transition cursor-pointer ${
                    selected
                      ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3 truncate">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{getLocalizedCategoryLabel(category.value, locale)}</span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold shrink-0 ${
                      selected
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="space-y-4 border-t border-slate-200 p-5 dark:border-slate-800">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-orange-500" /> {t('Region')}
              </span>
              <select
                value={selectedRegion}
                onChange={(event) => onRegionChange(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white cursor-pointer"
              >
                <option value="ALL">{t('All Regions')}</option>
                {TANZANIA_REGIONS.filter((region) => region !== 'All Tanzania').map((region) => (
                  <option key={region} value={region}>
                    {t(region)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <Layers className="h-3.5 w-3.5 text-orange-500" /> {t('Opportunity Type')}
              </span>
              <select
                value={selectedType}
                onChange={(event) => onTypeChange(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white cursor-pointer"
              >
                {OPPORTUNITY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {t(type.label)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <Coins className="h-3.5 w-3.5 text-orange-500" /> {t('Minimum Reward')}
              </span>
              <select
                value={minReward}
                onChange={(event) => onMinRewardChange(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white cursor-pointer"
              >
                <option value={0}>{t('Any Reward')}</option>
                <option value={50000}>TZS 50,000+</option>
                <option value={100000}>TZS 100,000+</option>
                <option value={250000}>TZS 250,000+</option>
                <option value={500000}>TZS 500,000+</option>
              </select>
            </label>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onClearFilters}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" /> {t('Clear filters')}
              </button>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div
          ref={resultsRef}
          role="region"
          aria-label={locale === 'sw' ? 'Orodha ya fursa' : 'Marketplace results'}
          tabIndex={0}
          className="marketplace-results min-w-0"
        >
          {/* Main Content Subheader */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                {locale === 'sw'
                  ? `Inaonyesha ${displayedOpportunities.length} kati ya ${opportunities.length} fursa`
                  : `Showing ${displayedOpportunities.length} of ${opportunities.length} opportunities`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder={locale === 'sw' ? 'Tafuta fursa...' : 'Search marketplace...'}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <span>{locale === 'sw' ? 'Panga' : 'Sort by'}</span>
                </span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(event) => onSortChange(event.target.value as MarketplaceSort)}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="newest">{locale === 'sw' ? 'Mpya Zaidi' : 'Most Recent'}</option>
                    <option value="recommended">{locale === 'sw' ? 'Iliyopendekezwa' : 'Recommended'}</option>
                    <option value="highest_reward">{locale === 'sw' ? 'Tuzo ya Juu' : 'Highest Reward'}</option>
                    <option value="ending_soon">{locale === 'sw' ? 'Inaisha Hivi Karibuni' : 'Ending Soon'}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {(currentUserRole === 'BUSINESS_OWNER' || currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') && (
                <button
                  type="button"
                  onClick={onPostOpportunity}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:from-orange-600 hover:to-amber-600 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{locale === 'sw' ? '+ Chapisha Fursa' : '+ Post Opportunity'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Product Cards Grid */}
          {displayedOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 pb-4 md:grid-cols-2 xl:grid-cols-3">
              {displayedOpportunities.map((item) => {
                const isOwner = Boolean(currentUserOrgId && currentUserOrgId === item.organizationId)
                const isAdmin = currentUserRole === 'ADMIN'
                const isAuthorizedForThisDeal = hasActiveSubscription || isOwner || isAdmin
                const isEnrolled = enrolledIds.has(item.id) || (item.slug ? enrolledIds.has(item.slug) : false)

                return (
                  <OpportunityCard
                    key={item.id}
                    item={item}
                    isSubscribed={isAuthorizedForThisDeal}
                    isGoldenVipUser={isGoldenVipUser}
                    isSaved={savedDeals.includes(item.id)}
                    isEnrolled={isEnrolled}
                    onToggleSave={() => onToggleSave(item.id)}
                    onApply={() => onDealAction(item, 'join')}
                    onViewDetails={() => onDealAction(item, 'view')}
                    onOpenEnrolled={() => onDealAction(item, 'view')}
                    onConnectWhatsApp={() => onConnectWhatsApp?.(item)}
                  />
                )
              })}
            </div>
          ) : (
            <MarketplaceEmptyState onReset={onClearFilters} />
          )}

          {/* 3. BOTTOM TRUST BANNER (4 Pillars + Script Calligraphy) */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full lg:w-auto flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Verified Opportunities</h4>
                    <p className="text-[11px] text-slate-500">All deals are verified for authenticity</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Trusted Network</h4>
                    <p className="text-[11px] text-slate-500">Join a growing community of partners</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <BarChart3 className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Real Impact</h4>
                    <p className="text-[11px] text-slate-500">Unlock business growth across Tanzania</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <MapPin className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Nationwide Access</h4>
                    <p className="text-[11px] text-slate-500">Opportunities in all regions</p>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block shrink-0 pl-6 border-l border-slate-200 dark:border-slate-800">
                <div className="font-script text-2xl font-semibold italic text-slate-700 dark:text-slate-300 text-center leading-tight">
                  Together for<br />
                  a Greater Tanzania
                </div>
              </div>
            </div>
          </div>

          {footer}
        </div>
      </div>
    </section>
  )
}
