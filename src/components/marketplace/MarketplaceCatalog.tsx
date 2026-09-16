'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { OpportunityItem } from '@/modules/deals/types'
import { getUserEnrolledDealIds } from '@/modules/deals/service'
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
  Handshake,
  Lock,
  ShieldCheck,
  Zap,
  PhoneCall,
  Sparkles,
} from 'lucide-react'
import { TANZANIA_OPPORTUNITY_CATEGORIES, TANZANIA_REGIONS, getLocalizedCategoryLabel } from '@/modules/deals/taxonomy'
import { OPPORTUNITY_TYPES } from './MarketplaceFilters'
import { useLanguage, getOpportunitiesCountLabel } from '@/lib/i18n'

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
  onUpgradeToVip,
  footer,
}: MarketplaceCatalogProps) {
  const { t, locale } = useLanguage()
  const categoryIcons = [House, CarFront, Package, Sprout, BriefcaseBusiness, Wrench]
  const [vipTab, setVipTab] = useState<'ALL' | 'VIP' | 'STANDARD'>('ALL')
  const resultsRef = useRef<HTMLDivElement>(null)
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(() => getUserEnrolledDealIds(currentUserId))

  useEffect(() => {
    resultsRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [query, selectedCategory, selectedType, selectedRegion, sortBy, minReward, vipTab])

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

  const vipCount = opportunities.filter((item) => Boolean(item.isGoldenVip)).length
  const standardCount = opportunities.filter((item) => !item.isGoldenVip).length

  const canSeeVipProducts = Boolean(isGoldenVipUser || currentUserRole === 'ADMIN')

  const displayedOpportunities = opportunities.filter((item) => {
    // If deal is a Golden VIP Exclusive deal and user has not paid / subscribed:
    // HIDE the product card completely from the grid!
    if (item.isGoldenVip && !canSeeVipProducts) {
      return false
    }

    if (vipTab === 'VIP') return Boolean(item.isGoldenVip)
    if (vipTab === 'STANDARD') return !item.isGoldenVip
    return true
  })

  return (
    <section id="marketplace" aria-labelledby="marketplace-title" className="marketplace-workspace scroll-mt-24">
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

      <div className="marketplace-columns items-start gap-6 lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside aria-label={locale === 'sw' ? 'Vichujio vya soko' : 'Marketplace filters'} className="marketplace-sidebar hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
              <SlidersHorizontal className="h-4 w-4 text-orange-500" /> {t('Categories')}
            </h3>
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={() => onCategoryChange('ALL')}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${selectedCategory === 'ALL' ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
            >
              <Grid3X3 className="h-4 w-4" /> {locale === 'sw' ? 'Makundi Yote' : 'All Categories'}
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
                  <Icon className="h-4 w-4" /> {getLocalizedCategoryLabel(category.value, locale)}
                </button>
              )
            })}
          </div>

          <div className="space-y-4 border-t border-slate-200 p-5 dark:border-slate-800">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <MapPin className="h-3.5 w-3.5" /> {t('Region')}
              </span>
              <select value={selectedRegion} onChange={(event) => onRegionChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="ALL">{t('All Regions')}</option>
                {TANZANIA_REGIONS.filter((region) => region !== 'All Tanzania').map((region) => <option key={region} value={region}>{t(region)}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('Opportunity Type')}</span>
              <select value={selectedType} onChange={(event) => onTypeChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                {OPPORTUNITY_TYPES.map((type) => <option key={type.value} value={type.value}>{t(type.label)}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('Minimum Reward')}</span>
              <select value={minReward} onChange={(event) => onMinRewardChange(Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value={0}>{t('Any Reward')}</option>
                <option value={50000}>TZS 50,000+</option>
                <option value={100000}>TZS 100,000+</option>
                <option value={250000}>TZS 250,000+</option>
                <option value={500000}>TZS 500,000+</option>
              </select>
            </label>

            {activeFilterCount > 0 && <button type="button" onClick={onClearFilters} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:text-slate-300"><X className="h-3.5 w-3.5" /> {t('Clear filters')}</button>}
          </div>
        </aside>

        <div ref={resultsRef} role="region" aria-label={locale === 'sw' ? 'Orodha ya fursa' : 'Marketplace results'} tabIndex={0} className="marketplace-results min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/30 sm:p-5">
          {/* Golden VIP 24h Early Access Promo Banner */}
          <div className="mb-4 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 p-4 dark:border-amber-700/60 dark:bg-amber-950/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Crown className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span>{locale === 'sw' ? 'Dirisha la Kipekee la Saa 24 kwa Golden VIP' : 'Golden VIP 24-Hour Exclusivity Window'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
                      {locale === 'sw' ? 'Mwezi 1 wa VIP Bure na Usajili wa Mwaka' : '1 Month VIP Free with Annual'}
                    </span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {locale === 'sw'
                      ? 'Wanachama wa VIP na wa Kila Mwaka wanapata ufikiaji wa mapema katika saa 24 za kwanza za fursa moto. Fursa hufunguliwa kwa washirika wote baada ya saa 24.'
                      : 'VIP & Annual subscribers get first-look early access during the first 24 hours of hot deals. Regular partners see deals unlock after 24 hours.'}
                  </p>
                </div>
              </div>
              {onUpgradeToVip && (
                <button
                  type="button"
                  onClick={onUpgradeToVip}
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-sm hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer"
                >
                  {locale === 'sw' ? 'Pata ya Mwaka (Mwezi 1 wa VIP Bure) →' : 'Get Annual (1 Mo VIP Free) →'}
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
              {t('All Deals')} ({opportunities.length})
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
              <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>{t('VIP Early Access')} ({vipCount})</span>
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
              <Handshake className="h-3.5 w-3.5 shrink-0" />
              <span>{t('Standard Partner Deals')} ({standardCount})</span>
            </button>
          </div>

          <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-900 dark:text-white">
                {vipTab === 'VIP'
                  ? (locale === 'sw' ? 'Fursa za Kipaumbele za Golden VIP' : 'Golden VIP Priority Opportunities')
                  : vipTab === 'STANDARD'
                    ? t('Standard Partner Deals')
                    : (locale === 'sw' ? 'Fursa Zote za Soko' : 'All Marketplace Opportunities')}
              </p>
              <p className="mt-1 text-xs text-slate-500">{getOpportunitiesCountLabel(displayedOpportunities.length, locale)}</p>
            </div>
            <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2 sm:max-w-xl sm:justify-end">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={locale === 'sw' ? 'Tafuta fursa...' : 'Search marketplace...'} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900" />
              </div>
              <div className="relative">
                <select value={sortBy} onChange={(event) => onSortChange(event.target.value as MarketplaceSort)} aria-label={locale === 'sw' ? 'Panga fursa' : 'Sort marketplace deals'} className="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-xs font-bold outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900">
                  <option value="recommended">{t('Recommended')}</option>
                  <option value="newest">{t('Newest')}</option>
                  <option value="highest_reward">{t('Highest Reward')}</option>
                  <option value="ending_soon">{t('Ending Soon')}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Golden VIP Private Access Paywall Card for Unsubscribed Users */}
          {vipTab === 'VIP' && !isGoldenVipUser && currentUserRole !== 'ADMIN' ? (
            <div className="mb-6 overflow-hidden rounded-3xl border border-amber-300 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-slate-900/5 p-6 shadow-xl dark:border-amber-700/60 dark:from-amber-950/40 dark:to-slate-950/50">
              <div className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto py-4">
                <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Crown className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" /> Golden VIP Private Access Section
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Unlock Private Commercial Deals & 24h Early Access
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    This private section contains high-margin commercial opportunities reserved exclusively for active <strong>Golden VIP</strong> and <strong>Annual</strong> subscribers. Subscribe now to access products and start earning.
                  </p>
                </div>

                {/* 4 Feature Value Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-2">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 space-y-1">
                    <div className="flex items-center gap-2 font-black text-xs text-amber-600 dark:text-amber-400">
                      <Crown className="w-4 h-4" />
                      <span>24-Hour Exclusivity Window</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Claim top high-margin opportunities 24 hours before standard marketplace release.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 space-y-1">
                    <div className="flex items-center gap-2 font-black text-xs text-amber-600 dark:text-amber-400">
                      <PhoneCall className="w-4 h-4" />
                      <span>Direct Merchant Contact</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Direct phone & WhatsApp matchmaker tickets to verified seller desk contacts.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 space-y-1">
                    <div className="flex items-center gap-2 font-black text-xs text-amber-600 dark:text-amber-400">
                      <Zap className="w-4 h-4" />
                      <span>Fast-Track Commission Payouts</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Zero-queue compliance review with instant M-Pesa / Tigo Pesa payout disbursement.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 space-y-1">
                    <div className="flex items-center gap-2 font-black text-xs text-amber-600 dark:text-amber-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Priority Lumo Protection</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Priority 48-hour delivery inspection coverage and guaranteed dispute resolution.</p>
                  </div>
                </div>

                {/* Upgrade Call to Action Button */}
                {onUpgradeToVip && (
                  <div className="pt-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onUpgradeToVip}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Crown className="w-4 h-4 fill-slate-950" />
                      <span>Unlock Golden VIP Access — Upgrade Plan Now</span>
                    </button>
                    <p className="text-[11px] text-slate-400 mt-2">Includes 1 Month VIP Free with Annual Plan • Cancel Anytime</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

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
          ) : vipTab === 'VIP' && !canSeeVipProducts ? null : (
            <MarketplaceEmptyState onReset={onClearFilters} />
          )}
          {footer}
        </div>
      </div>
    </section>
  )
}
