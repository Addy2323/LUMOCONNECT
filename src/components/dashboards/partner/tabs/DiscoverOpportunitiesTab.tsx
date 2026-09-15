'use client'

import React, { useState } from 'react'
import {
  Search,
  Bookmark,
  ShieldCheck,
  Lock,
  Sparkles,
  Film,
  Play,
  CheckCircle2,
  X,
  ExternalLink,
  Image as ImageIcon,
  SlidersHorizontal,
  LayoutGrid,
  House,
  CarFront,
  Package,
  Sprout,
  BriefcaseBusiness,
  Wrench,
  MapPin,
  Tag,
  Coins,
} from 'lucide-react'
import {
  PartnerOpportunitySummary,
  PartnerSubscriptionPlan,
  PartnerSidebarSection,
} from '../types'
import { usePartnerToast } from '../PartnerToast'
import { getVideoEmbedInfo } from '@/modules/deals/service'
import { DealMediaViewer } from '@/components/common/DealMediaViewer'
import {
  TANZANIA_REGIONS,
  matchesOpportunityCategory,
  formatCategoryBadgeLabel,
} from '@/modules/deals/taxonomy'

interface DiscoverOpportunitiesTabProps {
  opportunities: PartnerOpportunitySummary[]
  setOpportunities: React.Dispatch<React.SetStateAction<PartnerOpportunitySummary[]>>
  subscription: PartnerSubscriptionPlan
  onJoinOpportunity: (opp: PartnerOpportunitySummary) => void
  onNavigateTab: (tab: PartnerSidebarSection) => void
  onNavigateToSubscriptions?: () => void
}

const SIDEBAR_CATEGORIES = [
  { id: 'All Categories', label: 'All Categories', icon: LayoutGrid },
  { id: 'Property', label: 'Property', icon: House },
  { id: 'Vehicles', label: 'Vehicles', icon: CarFront },
  { id: 'Products', label: 'Products', icon: Package },
  { id: 'Agriculture & Commodities', label: 'Agriculture & Commodities', icon: Sprout },
  { id: 'Business', label: 'Business', icon: BriefcaseBusiness },
  { id: 'Services', label: 'Services', icon: Wrench },
]

export function DiscoverOpportunitiesTab({
  opportunities,
  setOpportunities,
  subscription,
  onJoinOpportunity,
  onNavigateTab,
  onNavigateToSubscriptions,
}: DiscoverOpportunitiesTabProps) {
  const { showToast } = usePartnerToast()

  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories')
  const [selectedRegion, setSelectedRegion] = useState<string>('All Tanzania')
  const [selectedOppType, setSelectedOppType] = useState<string>('All Types')
  const [minReward, setMinReward] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recommended' | 'price_high_to_low' | 'price_low_to_high'>('recommended')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const [selectedOpp, setSelectedOpp] = useState<PartnerOpportunitySummary | null>(null)
  const [showSubscriptionGateModal, setShowSubscriptionGateModal] = useState(false)
  const [mediaViewMode, setMediaViewMode] = useState<'PHOTO' | 'VIDEO'>('PHOTO')
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)

  const isSubscribed = subscription?.status === 'ACTIVE'

  const redirectToSubscription = () => {
    showToast(
      'warning',
      'Subscription Required',
      'Active Partner Pass is required to unlock commercial deal terms and participation.'
    )
    if (onNavigateToSubscriptions) {
      onNavigateToSubscriptions()
    } else {
      onNavigateTab('subscription')
    }
  }

  const filtered = opportunities
    .filter((opp) => {
      // 1. Search Query
      const matchesSearch =
        searchQuery === '' ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.region.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      // 2. Category Filter using Taxonomy Matcher
      if (selectedCategory !== 'All Categories') {
        if (!matchesOpportunityCategory(opp.category, selectedCategory, opp.subcategory)) {
          return false
        }
      }

      // 3. Region Filter
      if (selectedRegion !== 'All Tanzania') {
        if (opp.region.toLowerCase() !== selectedRegion.toLowerCase()) {
          return false
        }
      }

      // 4. Opportunity Type Filter
      if (selectedOppType !== 'All Types') {
        if (opp.type !== selectedOppType) {
          return false
        }
      }

      // 5. Minimum Reward Filter
      if (minReward !== 'ALL') {
        const val = opp.rewardValueTZS || 0
        if (val < Number(minReward)) return false
      }

      return true
    })
    .sort((a, b) => {
      if (sortBy === 'price_high_to_low') {
        return (b.rewardValueTZS || 0) - (a.rewardValueTZS || 0)
      }
      if (sortBy === 'price_low_to_high') {
        return (a.rewardValueTZS || 0) - (b.rewardValueTZS || 0)
      }
      return 0
    })

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    let isNowSaved = false
    setOpportunities((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          isNowSaved = !o.isSaved
          return { ...o, isSaved: isNowSaved }
        }
        return o
      })
    )

    if (typeof window !== 'undefined') {
      try {
        const savedIds: string[] = JSON.parse(localStorage.getItem('lumo_saved_deals') || '[]')
        let updated: string[]
        if (savedIds.includes(id)) {
          updated = savedIds.filter((dealId) => dealId !== id)
        } else {
          updated = [...savedIds, id]
        }
        localStorage.setItem('lumo_saved_deals', JSON.stringify(updated))
        window.dispatchEvent(new Event('lumo:saved-deals-updated'))
      } catch (e) {
        console.warn('Could not update saved deals', e)
      }
    }

    showToast(
      'info',
      isNowSaved ? 'Opportunity Bookmarked' : 'Removed from Bookmarks',
      isNowSaved ? `Saved to your Saved Opportunities tab.` : undefined
    )
  }

  const handleOpenDeal = (opp: PartnerOpportunitySummary) => {
    if (!isSubscribed) {
      redirectToSubscription()
      return
    }
    setSelectedOpp(opp)
  }

  const handleJoinClick = (opp: PartnerOpportunitySummary) => {
    if (!isSubscribed) {
      redirectToSubscription()
      return
    }

    onJoinOpportunity(opp)
    setSelectedOpp(null)
    showToast(
      'success',
      'Deal Joined Successfully',
      `You are now enrolled in "${opp.title}". Your personalized tracking link and promo code are generated in My Deals.`
    )
  }

  const hasActiveFilters =
    selectedCategory !== 'All Categories' ||
    selectedRegion !== 'All Tanzania' ||
    selectedOppType !== 'All Types' ||
    minReward !== 'ALL'

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Discover Commercial Opportunities</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-2 py-0.5 rounded-full">
              Read + Join Workflow
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search verified deals across Tanzania. Filter by category, region, type, and minimum reward.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-xs text-slate-500 font-bold">
            Showing <strong>{filtered.length}</strong> of {opportunities.length} deals
          </div>
          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Categories & Filters</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />}
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT SIDEBAR: Categories & Filters Panel (Matching requested UI) */}
        <div className={`lg:block ${mobileFiltersOpen ? 'block' : 'hidden'} lg:col-span-1 space-y-4`}>
          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-4 space-y-4 shadow-2xs">
            {/* Header: Categories */}
            <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-slate-700 pb-3">
              <SlidersHorizontal className="w-4 h-4 text-[#FF6A00]" />
              <span>Categories</span>
            </div>

            {/* Vertical Category Options */}
            <div className="space-y-1">
              {SIDEBAR_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon
                const isActive = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id)
                      setMobileFiltersOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-orange-50/90 dark:bg-orange-950/50 text-[#FF6A00] font-black border border-orange-200/80 dark:border-orange-900/60 shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FF6A00]' : 'text-slate-400'}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                )
              })}
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* REGION Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>Region</span>
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
              >
                {TANZANIA_REGIONS.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            {/* OPPORTUNITY TYPE Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Opportunity Type</span>
              </label>
              <select
                value={selectedOppType}
                onChange={(e) => setSelectedOppType(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
              >
                <option value="All Types">All Types</option>
                <option value="ADVERTISING_CAMPAIGN">Advertising & Creators</option>
                <option value="CUSTOMER_ACQUISITION">Field Sales & Acquisition</option>
                <option value="LEAD_GENERATION">Lead Generation</option>
                <option value="B2B_INTRODUCTION">B2B Opportunities</option>
              </select>
            </div>

            {/* MINIMUM REWARD Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Coins className="w-3 h-3 text-slate-400" />
                <span>Minimum Reward</span>
              </label>
              <select
                value={minReward}
                onChange={(e) => setMinReward(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Rewards</option>
                <option value="20000">Min TZS 20,000</option>
                <option value="50000">Min TZS 50,000</option>
                <option value="100000">Min TZS 100,000</option>
                <option value="250000">Min TZS 250,000</option>
                <option value="500000">Min TZS 500,000</option>
              </select>
            </div>

            {/* Reset All Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All Categories')
                  setSelectedRegion('All Tanzania')
                  setSelectedOppType('All Types')
                  setMinReward('ALL')
                  setSearchQuery('')
                }}
                className="w-full py-2 text-center text-xs font-bold text-[#FF6A00] hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* RIGHT CONTENT AREA: Search Bar & Opportunities Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search opportunities by title, brand, industry, or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
              >
                <option value="recommended">Recommended</option>
                <option value="price_high_to_low">Reward: Highest to Lowest</option>
                <option value="price_low_to_high">Reward: Lowest to Highest</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 font-bold text-[11px]">Active Filters:</span>
              {selectedCategory !== 'All Categories' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-bold text-[11px]">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('All Categories')} className="hover:text-orange-800 cursor-pointer">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
              {selectedRegion !== 'All Tanzania' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                  Region: {selectedRegion}
                  <button onClick={() => setSelectedRegion('All Tanzania')} className="hover:text-black cursor-pointer">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
              {selectedOppType !== 'All Types' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                  Type: {selectedOppType}
                  <button onClick={() => setSelectedOppType('All Types')} className="hover:text-black cursor-pointer">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
              {minReward !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                  Min Reward: TZS {Number(minReward).toLocaleString()}
                  <button onClick={() => setMinReward('ALL')} className="hover:text-emerald-950 cursor-pointer">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Opportunities Cards Grid */}
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                No opportunities match your current filter
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing category filters, selecting "All Tanzania", or searching a different term.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All Categories')
                  setSelectedRegion('All Tanzania')
                  setSelectedOppType('All Types')
                  setMinReward('ALL')
                  setSearchQuery('')
                }}
                className="py-2 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => handleOpenDeal(opp)}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden flex flex-col justify-between group hover:border-orange-300 transition-all shadow-xs cursor-pointer"
                >
                  <div>
                    {/* Media Banner */}
                    {opp.promoVideoUrl ? (
                      <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                        <DealMediaViewer
                          mediaUrl={opp.promoVideoUrl}
                          posterUrl={opp.coverImageUrl}
                          altTitle={opp.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="text-[10px] bg-[#FF6A00] text-white font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                            {formatCategoryBadgeLabel(opp.category, opp.subcategory)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => toggleSave(opp.id, e)}
                          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-black/50 backdrop-blur-xs text-white hover:bg-black/80 transition-colors cursor-pointer"
                          title={opp.isSaved ? 'Remove Bookmark' : 'Save Opportunity'}
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${opp.isSaved ? 'fill-[#FF6A00] text-[#FF6A00]' : 'text-white'}`}
                          />
                        </button>
                      </div>
                    ) : opp.coverImageUrl ? (
                      <div className="relative h-40 w-full bg-slate-900 overflow-hidden">
                        <img
                          src={opp.coverImageUrl}
                          alt={opp.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                        <div className="absolute top-2.5 left-2.5">
                          <span className="text-[10px] bg-[#FF6A00] text-white font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                            {formatCategoryBadgeLabel(opp.category, opp.subcategory)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => toggleSave(opp.id, e)}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/50 backdrop-blur-xs text-white hover:bg-black/80 transition-colors cursor-pointer"
                          title={opp.isSaved ? 'Remove Bookmark' : 'Save Opportunity'}
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${opp.isSaved ? 'fill-[#FF6A00] text-[#FF6A00]' : 'text-white'}`}
                          />
                        </button>

                        <div className="absolute bottom-2.5 left-2.5 text-white">
                          <span className="text-xs font-mono font-black bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs">
                            {opp.rewardDisplay}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-28 w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-[#FF6A00] text-white font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                            {formatCategoryBadgeLabel(opp.category, opp.subcategory)}
                          </span>
                          <button
                            onClick={(e) => toggleSave(opp.id, e)}
                            className="p-1.5 rounded-full bg-black/50 backdrop-blur-xs text-white hover:bg-black/80 transition-colors cursor-pointer"
                            title={opp.isSaved ? 'Remove Bookmark' : 'Save Opportunity'}
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${opp.isSaved ? 'fill-[#FF6A00] text-[#FF6A00]' : 'text-white'}`}
                            />
                          </button>
                        </div>
                        <div className="text-white font-mono font-black text-xs">
                          {opp.rewardDisplay}
                        </div>
                      </div>
                    )}

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">Lumo Dealers</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="text-[10px]">{opp.region}</span>
                      </div>

                      <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {opp.title}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-2">
                        {opp.publicSummary}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span>{opp.activePartnersCount} active partners</span>
                        <span>Closes: {opp.closingDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenDeal(opp)
                      }}
                      className="w-full py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white group-hover:bg-[#FF6A00] group-hover:text-white group-hover:border-transparent font-extrabold text-xs rounded-xl transition-all text-center cursor-pointer"
                    >
                      View Deal & Terms
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OPPORTUNITY DETAIL & SUBSCRIPTION GATED MODAL */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-orange-100 text-[#FF6A00] rounded-full">
                  {selectedOpp.category}
                </span>
                <span className="text-slate-400 text-xs">· {selectedOpp.region}</span>
              </div>
              <button onClick={() => setSelectedOpp(null)} className="p-1 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Tabs & Interactive Viewer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setMediaViewMode('PHOTO'); setIsPlayingVideo(false); }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      mediaViewMode === 'PHOTO'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Product Images</span>
                  </button>
                  {selectedOpp.promoVideoUrl && (
                    <button
                      type="button"
                      onClick={() => { setMediaViewMode('VIDEO'); setIsPlayingVideo(true); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        mediaViewMode === 'VIDEO'
                          ? 'bg-[#FF6A00] text-white shadow-xs'
                          : 'text-slate-500 hover:text-[#FF6A00]'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Video Pitch</span>
                    </button>
                  )}
                </div>

                {selectedOpp.coverImageUrl && (
                  <a
                    href={selectedOpp.coverImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-[#FF6A00] hover:underline flex items-center gap-1"
                  >
                    <span>Download Media</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {mediaViewMode === 'VIDEO' && selectedOpp.promoVideoUrl ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800 shadow-md">
                  {(() => {
                    const vInfo = getVideoEmbedInfo(selectedOpp.promoVideoUrl)
                    if (vInfo.isIframe) {
                      return (
                        <iframe
                          src={vInfo.embedUrl}
                          title={selectedOpp.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      )
                    }
                    return (
                      <video
                        controls
                        autoPlay
                        muted
                        loop
                        playsInline
                        src={vInfo.embedUrl}
                        className="w-full h-full object-contain"
                        poster={selectedOpp.coverImageUrl}
                      >
                        Your browser does not support HTML5 video streaming.
                      </video>
                    )
                  })()}
                </div>
              ) : selectedOpp.coverImageUrl ? (
                <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs group">
                  <img
                    src={selectedOpp.coverImageUrl}
                    alt={selectedOpp.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  {selectedOpp.promoVideoUrl && (
                    <button
                      type="button"
                      onClick={() => { setMediaViewMode('VIDEO'); setIsPlayingVideo(true); }}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-slate-900 ml-0.5 text-slate-900" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-32 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-400 font-bold text-xs">
                  No media uploaded by merchant
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Lumo Dealers</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>

              <h3 className="font-black text-lg text-slate-900 dark:text-white leading-snug">
                {selectedOpp.title}
              </h3>

              <div className="p-3.5 bg-orange-50/60 dark:bg-slate-800 rounded-2xl border border-orange-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">Verified Partner Compensation</span>
                  <span className="text-[10px] text-slate-400">Direct M-Pesa / TZS Bank Settlement</span>
                </div>
                <span className="font-mono font-black text-lg text-[#FF6A00]">
                  {selectedOpp.rewardDisplay}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Commercial Summary & Product Overview:</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                  {selectedOpp.publicSummary}
                </p>
              </div>

              {/* Confidential Commercial Terms (Subscriber Gated) */}
              {isSubscribed && selectedOpp.confidentialTerms ? (
                <div className="p-4 rounded-2xl bg-orange-50/40 dark:bg-slate-800/80 border border-orange-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confidential Commercial Guidelines (Subscription Active)</span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-xs">
                    {selectedOpp.confidentialTerms.subscriberDescription}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border">
                      <span className="text-slate-400 block text-[10px]">Attribution Window:</span>
                      <span className="font-bold">{selectedOpp.confidentialTerms.attributionWindowDays} Days</span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border">
                      <span className="text-slate-400 block text-[10px]">Evidence Required:</span>
                      <span className="font-bold">{selectedOpp.confidentialTerms.evidenceRequired}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-center space-y-2">
                  <Lock className="w-6 h-6 text-slate-400 mx-auto" />
                  <div className="font-bold text-slate-900 dark:text-white">
                    Confidential Commercial Terms & Tracking Gated
                  </div>
                  <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                    Full sales guidelines, marketing brochures, and tracking links require an active Partner Subscription.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedOpp(null)
                      redirectToSubscription()
                    }}
                    className="py-1.5 px-4 bg-[#FF6A00] text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Activate Access Pass
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={() => handleJoinClick(selectedOpp)}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                Join Deal & Get Tracking Links
              </button>
              <button onClick={() => setSelectedOpp(null)} className="py-2.5 px-4 border rounded-xl font-bold cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION GATEWAY MODAL */}
      {showSubscriptionGateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Partner Subscription Required
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                To join new commercial deals, access confidential sales kits, and generate tracking URLs, please activate your Partner Access Pass.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-left text-xs space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white">With your pass you get:</div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Unlimited Deal Joining & Direct Tracking Links</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Downloadable Marketing Assets & Video Kits</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Direct B2B Deal Room Negotiations</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  setShowSubscriptionGateModal(false)
                  onNavigateTab('subscription')
                }}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
              >
                Choose Subscription Plan
              </button>
              <button
                onClick={() => setShowSubscriptionGateModal(false)}
                className="py-2.5 px-4 border rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
