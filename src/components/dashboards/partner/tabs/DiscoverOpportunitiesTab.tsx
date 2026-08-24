'use client'

import React, { useState } from 'react'
import {
  Search,
  Filter,
  Bookmark,
  ShieldCheck,
  Calendar,
  Lock,
  Sparkles,
  Film,
  Play,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  CreditCard,
} from 'lucide-react'
import {
  PartnerOpportunitySummary,
  PartnerSubscriptionPlan,
  PartnerSidebarSection,
} from '../types'
import { usePartnerToast } from '../PartnerToast'

interface DiscoverOpportunitiesTabProps {
  opportunities: PartnerOpportunitySummary[]
  setOpportunities: React.Dispatch<React.SetStateAction<PartnerOpportunitySummary[]>>
  subscription: PartnerSubscriptionPlan
  onJoinOpportunity: (opp: PartnerOpportunitySummary) => void
  onNavigateTab: (tab: PartnerSidebarSection) => void
}

const FILTER_TAGS = [
  'All Deals',
  'Recommended',
  'Highest Paying',
  'New Listings',
  'Ending Soon',
  'Near Me',
  'Advertising & Creators',
  'Field Sales',
  'Lead Generation',
  'B2B Opportunities',
  'Renewable Energy',
  'FinTech & Payments',
  'Travel & Safari',
  'AgriBusiness',
  'Technology & SaaS',
  'Automotive & Transport',
  'Health & FMCG',
]

export function DiscoverOpportunitiesTab({
  opportunities,
  setOpportunities,
  subscription,
  onJoinOpportunity,
  onNavigateTab,
}: DiscoverOpportunitiesTabProps) {
  const { showToast } = usePartnerToast()

  const [activeFilter, setActiveFilter] = useState('All Deals')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOpp, setSelectedOpp] = useState<PartnerOpportunitySummary | null>(null)
  const [showSubscriptionGateModal, setShowSubscriptionGateModal] = useState(false)

  // Price Range State
  const [priceRange, setPriceRange] = useState<
    'ALL' | 'UNDER_50K' | '50K_150K' | '150K_500K' | 'ABOVE_500K' | 'CUSTOM'
  >('ALL')
  const [customMinPrice, setCustomMinPrice] = useState<number | ''>('')
  const [customMaxPrice, setCustomMaxPrice] = useState<number | ''>('')
  const [sortBy, setSortBy] = useState<'recommended' | 'price_high_to_low' | 'price_low_to_high' | 'closing_soon'>('recommended')

  const isSubscribed = subscription.status === 'ACTIVE'

  const filtered = opportunities
    .filter((opp) => {
      const matchesSearch =
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.region.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      // Category / Tag filter
      if (activeFilter === 'Highest Paying') {
        if (opp.rewardValueTZS < 100000) return false
      } else if (activeFilter === 'Advertising & Creators') {
        if (opp.type !== 'ADVERTISING_CAMPAIGN') return false
      } else if (activeFilter === 'Field Sales') {
        if (opp.type !== 'CUSTOMER_ACQUISITION') return false
      } else if (activeFilter === 'Lead Generation') {
        if (opp.type !== 'LEAD_GENERATION') return false
      } else if (activeFilter === 'B2B Opportunities') {
        if (opp.type !== 'B2B_INTRODUCTION') return false
      } else if (activeFilter !== 'All Deals' && activeFilter !== 'Recommended') {
        if (!opp.category.toLowerCase().includes(activeFilter.toLowerCase())) return false
      }

      // Price / Reward Range Filter
      const val = opp.rewardValueTZS || 0
      if (priceRange === 'UNDER_50K') {
        if (val >= 50000) return false
      } else if (priceRange === '50K_150K') {
        if (val < 50000 || val > 150000) return false
      } else if (priceRange === '150K_500K') {
        if (val < 150000 || val > 500000) return false
      } else if (priceRange === 'ABOVE_500K') {
        if (val < 500000) return false
      } else if (priceRange === 'CUSTOM') {
        if (customMinPrice !== '' && val < Number(customMinPrice)) return false
        if (customMaxPrice !== '' && val > Number(customMaxPrice)) return false
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
    setOpportunities((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const nextSaved = !o.isSaved
          showToast(
            'info',
            nextSaved ? 'Opportunity Bookmarked' : 'Removed from Bookmarks',
            nextSaved ? `"${o.title}" saved to your Saved Opportunities tab.` : undefined
          )
          return { ...o, isSaved: nextSaved }
        }
        return o
      })
    )
  }

  const handleOpenDeal = (opp: PartnerOpportunitySummary) => {
    setSelectedOpp(opp)
  }

  const handleJoinClick = (opp: PartnerOpportunitySummary) => {
    if (!isSubscribed) {
      setShowSubscriptionGateModal(true)
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

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
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
            Search verified deals across Tanzania. Filter by industry, region, and compensation price range.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-bold self-start sm:self-auto">
          Showing <strong>{filtered.length}</strong> of {opportunities.length} deals
        </div>
      </div>

      {/* 17 Interactive Filter Tags Scroller */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveFilter(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeFilter === tag
                ? 'bg-[#0B132B] text-white shadow-2xs font-extrabold'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* DEDICATED PRICE / REWARD RANGE FILTER BAR */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Reward / Price Range:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="recommended">Recommended</option>
              <option value="price_high_to_low">Reward: Highest to Lowest</option>
              <option value="price_low_to_high">Reward: Lowest to Highest</option>
            </select>
          </div>
        </div>

        {/* Price Range Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'ALL', label: 'All Rewards' },
            { id: 'UNDER_50K', label: '< TZS 50,000' },
            { id: '50K_150K', label: 'TZS 50,000 – 150,000' },
            { id: '150K_500K', label: 'TZS 150,000 – 500,000' },
            { id: 'ABOVE_500K', label: 'TZS 500,000+' },
            { id: 'CUSTOM', label: 'Custom Price Range' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setPriceRange(pill.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                priceRange === pill.id
                  ? 'bg-[#FF6A00] text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Custom Min / Max Price Inputs */}
        {priceRange === 'CUSTOM' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                Minimum Reward (TZS)
              </label>
              <input
                type="number"
                placeholder="e.g. 20000"
                value={customMinPrice}
                onChange={(e) => setCustomMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                Maximum Reward (TZS)
              </label>
              <input
                type="number"
                placeholder="e.g. 500000"
                value={customMaxPrice}
                onChange={(e) => setCustomMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 font-mono font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search opportunities by title, brand, industry, or region..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        />
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((opp) => (
          <div
            key={opp.id}
            onClick={() => handleOpenDeal(opp)}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden flex flex-col justify-between group hover:border-orange-300 transition-all shadow-xs cursor-pointer"
          >
            <div>
              {/* Media Banner */}
              {opp.coverImageUrl && (
                <div className="relative h-40 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={opp.coverImageUrl}
                    alt={opp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] bg-[#FF6A00] text-white font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                      {opp.category}
                    </span>
                  </div>

                  <button
                    onClick={(e) => toggleSave(opp.id, e)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/50 backdrop-blur-xs text-white hover:bg-black/80 transition-colors"
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${opp.isSaved ? 'fill-[#FF6A00] text-[#FF6A00]' : 'text-white'}`}
                    />
                  </button>

                  {opp.promoVideoUrl && (
                    <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Film className="w-3 h-3 text-[#FF6A00]" />
                      <span>Video Pitch</span>
                    </div>
                  )}

                  <div className="absolute bottom-2.5 left-2.5 text-white">
                    <span className="text-xs font-mono font-black bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {opp.rewardDisplay}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{opp.businessName}</span>
                    {opp.isBusinessVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
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
                className="w-full py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white group-hover:bg-[#FF6A00] group-hover:text-white group-hover:border-transparent font-extrabold text-xs rounded-xl transition-all text-center"
              >
                View Deal & Terms
              </button>
            </div>
          </div>
        ))}
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
              <button onClick={() => setSelectedOpp(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Cover */}
            {selectedOpp.coverImageUrl && (
              <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900">
                <img
                  src={selectedOpp.coverImageUrl}
                  alt={selectedOpp.title}
                  className="w-full h-full object-cover"
                />
                {selectedOpp.promoVideoUrl && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-slate-900 ml-0.5 text-slate-900" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{selectedOpp.businessName}</span>
                {selectedOpp.isBusinessVerified && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
              </div>

              <h3 className="font-black text-lg text-slate-900 dark:text-white leading-snug">
                {selectedOpp.title}
              </h3>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border flex items-center justify-between">
                <span className="text-slate-500 font-bold">Partner Compensation:</span>
                <span className="font-mono font-black text-base text-[#FF6A00]">
                  {selectedOpp.rewardDisplay}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Public Summary:</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
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

                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-[11px]">
                    {selectedOpp.confidentialTerms.subscriberDescription}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border">
                      <span className="text-slate-400 block">Attribution Window:</span>
                      <span className="font-bold">{selectedOpp.confidentialTerms.attributionWindowDays} Days</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border">
                      <span className="text-slate-400 block">Evidence Required:</span>
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
                      setShowSubscriptionGateModal(true)
                    }}
                    className="py-1.5 px-4 bg-[#FF6A00] text-white font-bold rounded-xl text-xs"
                  >
                    Activate Access Pass
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={() => handleJoinClick(selectedOpp)}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Join Deal & Get Tracking Links
              </button>
              <button onClick={() => setSelectedOpp(null)} className="py-2.5 px-4 border rounded-xl font-bold">
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
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl shadow-xs"
              >
                Choose Subscription Plan
              </button>
              <button
                onClick={() => setShowSubscriptionGateModal(false)}
                className="py-2.5 px-4 border rounded-xl font-bold"
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
