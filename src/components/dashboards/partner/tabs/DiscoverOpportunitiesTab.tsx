'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  Lock,
  X,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Handshake,
  ArrowLeft,
} from 'lucide-react'
import {
  PartnerOpportunitySummary,
  PartnerSubscriptionPlan,
  PartnerSidebarSection,
} from '../types'
import { usePartnerToast } from '../PartnerToast'
import { CustomerReferralModal } from '@/components/marketplace/CustomerReferralModal'
import type { OpportunityItem } from '@/modules/deals/types'

interface DiscoverOpportunitiesTabProps {
  opportunities: PartnerOpportunitySummary[]
  setOpportunities: React.Dispatch<React.SetStateAction<PartnerOpportunitySummary[]>>
  subscription: PartnerSubscriptionPlan
  onJoinOpportunity: (opp: PartnerOpportunitySummary) => void
  onNavigateTab: (tab: PartnerSidebarSection) => void
  onNavigateToSubscriptions?: () => void
  selectedOpp?: PartnerOpportunitySummary | null
  onSelectOpp?: (opp: PartnerOpportunitySummary | null) => void
}

export function DiscoverOpportunitiesTab({
  opportunities,
  setOpportunities,
  subscription,
  onJoinOpportunity,
  onNavigateTab,
  onNavigateToSubscriptions,
  selectedOpp: controlledSelectedOpp,
  onSelectOpp,
}: DiscoverOpportunitiesTabProps) {
  const { showToast } = usePartnerToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [internalSelectedOpp, setInternalSelectedOpp] = useState<PartnerOpportunitySummary | null>(null)
  const [connectingOpp, setConnectingOpp] = useState<OpportunityItem | null>(null)

  const selectedOpp = controlledSelectedOpp !== undefined ? controlledSelectedOpp : internalSelectedOpp

  const setSelectedOpp = (opp: PartnerOpportunitySummary | null) => {
    setInternalSelectedOpp(opp)
    onSelectOpp?.(opp)
  }

  const isSubscribed = subscription?.status === 'ACTIVE'

  // Extract distinct categories from opportunities
  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    opportunities.forEach((o) => {
      if (o.category) set.add(o.category)
    })
    const list = Array.from(set)
    return list.length > 0
      ? list
      : [
        'Logistics & Trade',
        'Technology',
        'Agriculture & Commodities',
        'Property',
        'Vehicles',
        'Business',
        'Services',
      ]
  }, [opportunities])

  // Filter opportunities based on search and category
  const filtered = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchesCat =
        selectedCategory === 'All Categories' ||
        opp.category.toLowerCase().includes(selectedCategory.toLowerCase())

      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        opp.title.toLowerCase().includes(query) ||
        opp.category.toLowerCase().includes(query) ||
        (opp.region && opp.region.toLowerCase().includes(query)) ||
        (opp.publicSummary && opp.publicSummary.toLowerCase().includes(query))

      return matchesCat && matchesSearch
    })
  }, [opportunities, selectedCategory, searchQuery])

  const handleOpenDeal = (opp: PartnerOpportunitySummary) => {
    setSelectedOpp(opp)
  }

  const handleConnectClick = (opp: PartnerOpportunitySummary) => {
    // Map PartnerOpportunitySummary to OpportunityItem for CustomerReferralModal
    const dealItem: OpportunityItem = {
      id: opp.id,
      organizationId: 'org_deal',
      slug: opp.slug,
      title: opp.title,
      companyName: opp.businessName,
      category: opp.category,
      subcategory: opp.subcategory,
      region: opp.region,
      countryCode: 'TZ',
      currency: 'TZS',
      summary: opp.publicSummary,
      description: opp.publicSummary,
      rewardType: 'PERCENTAGE_COMMISSION',
      rewardDisplay: opp.rewardDisplay,
      rewardDetail: opp.rewardDisplay,
      principalPriceDisplay:
        (opp as any).principalPriceDisplay ||
        (opp as any).commercialValue ||
        (opp.rewardValueTZS ? `TZS ${opp.rewardValueTZS.toLocaleString()}` : 'USD 2,500,000'),
      isVerified: opp.isBusinessVerified,
      type: 'B2B_INTRODUCTION',
      spentBudgetTZS: BigInt(0),
      activePartnerCount: opp.activePartnersCount,
      isFeatured: false,
      status: 'PUBLISHED',
      createdAt: new Date(),
    }
    // Do NOT set selectedOpp to null so Deal Details remains active underneath modal
    setConnectingOpp(dealItem)
  }

  // =========================================================================
  // VIEW 1: DEAL DETAILS VIEW (MATCHING USER'S PROTOTYPE SCREENSHOT 1 EXACTLY)
  // =========================================================================
  if (selectedOpp) {
    const commercialValue =
      (selectedOpp as any).principalPriceDisplay ||
      (selectedOpp as any).commercialValue ||
      (selectedOpp.rewardValueTZS
        ? `TZS ${selectedOpp.rewardValueTZS.toLocaleString()}`
        : 'USD 2,500,000')

    const closingDate = selectedOpp.closingDate || '2026-12-31'
    const targetCustomer =
      selectedOpp.subcategory || (selectedOpp as any).targetCustomer || 'Hospitals & Clinics'
    const location = selectedOpp.region || 'Switzerland'

    return (
      <div className="space-y-6">
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedOpp(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Find Deals</span>
          </button>
        </div>

        {/* Page Title & Status Badge matching Screenshot 1 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {selectedOpp.title}
          </h1>
          <span className="self-start sm:self-auto text-[10px] sm:text-xs font-extrabold uppercase px-3 py-1 rounded bg-[#dcfce7] text-[#166534] dark:bg-emerald-950/70 dark:text-emerald-300 tracking-wider">
            PUBLISHED
          </span>
        </div>

        {/* 2-Column Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Banner, Overview, 3 Stat Cards */}
          <div className="lg:col-span-8 space-y-6">
            {/* Category Banner Container */}
            <div className="h-64 sm:h-72 rounded-2xl bg-[#bfdbfe]/60 dark:bg-slate-800/80 border border-blue-200/50 dark:border-slate-700 flex items-center justify-center p-6 text-center">
              <span className="text-xl sm:text-2xl font-black text-[#1e3a8a] dark:text-white tracking-tight">
                {selectedOpp.category}
              </span>
            </div>

            {/* Opportunity Overview */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Opportunity Overview
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {selectedOpp.publicSummary}
              </p>
              {selectedOpp.confidentialTerms?.subscriberDescription ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {selectedOpp.confidentialTerms.subscriberDescription}
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  MRI, ultrasound and related systems with installation, training and support.
                </p>
              )}
            </div>

            {/* 3 Summary Stat Cards in a row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* DEAL VALUE */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  DEAL VALUE
                </div>
                <div className="mt-1.5 text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                  {commercialValue}
                </div>
              </div>

              {/* PARTNER REWARD */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  PARTNER REWARD
                </div>
                <div className="mt-1.5 text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {selectedOpp.rewardDisplay}
                </div>
              </div>

              {/* CLOSING */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  CLOSING
                </div>
                <div className="mt-1.5 text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {closingDate}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Commercial Requirements Card + Connect Button */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Commercial Requirements
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 font-medium shrink-0">Target Customer</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right">
                    {targetCustomer}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 font-medium shrink-0">Location</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right">
                    {location}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 font-medium shrink-0">Result Type</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right">
                    COMPLETED_SALE
                  </span>
                </div>

                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 font-medium shrink-0">Reward Trigger</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right">
                    Signed contract and initial payment verified
                  </span>
                </div>

                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 font-medium shrink-0">Visibility</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right">
                    PUBLIC
                  </span>
                </div>
              </div>

              {/* Action Button: I Can Connect This Deal */}
              <button
                type="button"
                onClick={() => handleConnectClick(selectedOpp)}
                className="w-full py-3.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-bold text-sm rounded-xl shadow-xs transition-all text-center cursor-pointer mt-4"
              >
                I Can Connect This Deal
              </button>
            </div>
          </div>
        </div>

        {/* CUSTOMER REFERRAL MODAL (OPENS OVER THE DEAL DETAILS SCREEN) */}
        {connectingOpp && (
          <CustomerReferralModal
            deal={connectingOpp}
            isOpen={Boolean(connectingOpp)}
            onClose={() => setConnectingOpp(null)}
            onReferralSubmitted={(ref) => {
              showToast(
                'success',
                'Connection Submitted',
                `Customer Connection ${ref} recorded and under review.`
              )
            }}
            onViewProgress={() => {
              onNavigateTab('leads_referrals')
            }}
          />
        )}
      </div>
    )
  }

  // =========================================================================
  // VIEW 2: FIND DEALS LIST VIEW
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Header matching prototype */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Find Deals
        </h2>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
          Published Opportunities
        </span>
      </div>

      {/* Horizontal Search & Category Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search published deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none shadow-2xs"
          />
        </div>

        <div className="sm:w-56">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none shadow-2xs cursor-pointer font-medium"
          >
            <option value="All Categories">All categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column Responsive Cards Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No published deals found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or selecting &quot;All categories&quot;.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('All Categories')
            }}
            className="py-2 px-4 bg-[#FF6A00] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#EA580C] transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((opp) => {
            const commercialValue =
              (opp as any).principalPriceDisplay ||
              (opp as any).commercialValue ||
              (opp.rewardValueTZS ? `TZS ${opp.rewardValueTZS.toLocaleString()}` : 'USD 2,500,000')

            return (
              <div
                key={opp.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col bg-white dark:bg-slate-900"
              >
                {/* Card Header: Soft Blue Banner with Centered Category Title */}
                <div className="relative h-44 sm:h-48 bg-[#bfdbfe]/60 dark:bg-slate-800/70 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 tracking-wider">
                      PUBLIC
                    </span>
                  </div>

                  <div className="my-auto text-center px-4">
                    <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      {opp.category}
                    </h4>
                  </div>

                  <div />
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {opp.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      {opp.region ? `${opp.region} • ` : ''}{opp.category}
                    </p>

                    <div className="mt-3.5">
                      <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                        {commercialValue}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Potential Reward: {opp.rewardDisplay}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDeal(opp)}
                    className="w-full py-3 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs text-center mt-5 cursor-pointer"
                  >
                    View Deal
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Fallback modal if connecting without opening deal */}
      {connectingOpp && (
        <CustomerReferralModal
          deal={connectingOpp}
          isOpen={Boolean(connectingOpp)}
          onClose={() => setConnectingOpp(null)}
          onReferralSubmitted={(ref) => {
            showToast(
              'success',
              'Connection Submitted',
              `Customer Connection ${ref} recorded and under review.`
            )
          }}
          onViewProgress={() => {
            onNavigateTab('leads_referrals')
          }}
        />
      )}
    </div>
  )
}
