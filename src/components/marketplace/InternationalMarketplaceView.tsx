'use client'

import React, { useState, useEffect } from 'react'
import {
  Globe,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Award,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Building2,
  Lock,
} from 'lucide-react'
import { AdminInternationalDealItem } from '@/src/modules/international/types'
import { InternationalDealDetailModal } from './modals/InternationalDealDetailModal'
import { ISO_COUNTRIES } from '@/src/modules/international/countries'

interface InternationalMarketplaceViewProps {
  isMember?: boolean
  onRequireSubscription?: () => void
}

export function InternationalMarketplaceView({
  isMember = false,
  onRequireSubscription,
}: InternationalMarketplaceViewProps) {
  const [deals, setDeals] = useState<AdminInternationalDealItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDealType, setSelectedDealType] = useState<string>('all')
  const [selectedOriginCountry, setSelectedOriginCountry] = useState<string>('all')
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all')

  // Selected Deal Detail Modal
  const [activeDeal, setActiveDeal] = useState<AdminInternationalDealItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/international/deals')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setDeals(data.deals || [])
        }
      }
    } catch (err) {
      console.error('Error loading international deals for marketplace:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeals()
  }, [])

  // Filter deals based on selection
  const filteredDeals = deals.filter((d) => {
    if (selectedDealType !== 'all' && d.dealType !== selectedDealType) return false
    if (selectedOriginCountry !== 'all' && d.originCountryCode !== selectedOriginCountry) return false
    if (selectedCurrency !== 'all' && d.rewardStructure.currency !== selectedCurrency) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        d.title.toLowerCase().includes(q) ||
        d.shortDescription.toLowerCase().includes(q) ||
        d.originCountryName.toLowerCase().includes(q) ||
        d.targetCountryName.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Quick stats counters
  const totalUSDVolume = deals.reduce((acc, d) => acc + (d.totalRevenueGeneratedUSD || 0), 0)
  const totalRewardsPaid = deals.reduce((acc, d) => acc + (d.totalRewardsPaidUSD || 0), 0)
  const activePartnersCount = deals.reduce((acc, d) => acc + (d.activePartnerCount || 0), 0)

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/60 p-6 md:p-10 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wide">
            <Globe className="w-4 h-4 animate-spin-slow" />
            <span>LUMO CROSS-BORDER DEALS ENGINE</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            International Commercial Deals & Opportunities
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-3xl">
            Verified international commercial activities published and controlled by LUMO Admin. Perform remotely or locally in Tanzania, promote global brands, and earn in <strong className="text-cyan-400">USD, TZS, KES & global currencies</strong>.
          </p>

          {/* Quick Platform Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 pt-4">
            <div className="bg-slate-900/80 backdrop-blur p-3 sm:p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block">Published Deals</span>
              <span className="text-sm sm:text-xl font-bold text-white font-mono">{deals.length} Active</span>
            </div>
            <div className="bg-slate-900/80 backdrop-blur p-3 sm:p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block">Active Partners</span>
              <span className="text-sm sm:text-xl font-bold text-cyan-400 font-mono">+{activePartnersCount}</span>
            </div>
            <div className="bg-slate-900/80 backdrop-blur p-3 sm:p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block">Rewards Distributed</span>
              <span className="text-sm sm:text-xl font-bold text-emerald-400 font-mono truncate block">
                USD ${totalRewardsPaid.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-900/80 backdrop-blur p-3 sm:p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block">Admin Verification</span>
              <span className="text-[11px] sm:text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" /> 100% Guaranteed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900/90 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search international deals, countries, or products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Deal Type Dropdown */}
          <select
            value={selectedDealType}
            onChange={(e) => setSelectedDealType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 outline-none"
          >
            <option value="all">All Deal Types</option>
            <option value="Sales Deal">Sales Deals</option>
            <option value="Distributor Opportunity">Distributor Opportunities</option>
            <option value="Franchise Expansion">Franchise Expansion</option>
            <option value="Joint Venture">Joint Ventures</option>
            <option value="Travel Opportunity">Travel Opportunities</option>
          </select>

          {/* Origin Country Dropdown */}
          <select
            value={selectedOriginCountry}
            onChange={(e) => setSelectedOriginCountry(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 outline-none"
          >
            <option value="all">All Origin Countries</option>
            <option value="CN">🇨🇳 China</option>
            <option value="KR">🇰🇷 South Korea</option>
            <option value="GB">🇬🇧 United Kingdom</option>
            <option value="AE">🇦🇪 UAE</option>
            <option value="US">🇺🇸 United States</option>
            <option value="ZA">🇿🇦 South Africa</option>
          </select>

          {/* Settlement Currency */}
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 outline-none"
          >
            <option value="all">All Currencies</option>
            <option value="USD">USD ($)</option>
            <option value="TZS">TZS (Tsh)</option>
            <option value="KES">KES (KSh)</option>
          </select>

          <button
            onClick={fetchDeals}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Deals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
          <Globe className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No International Deals Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No active deals match your current search filters. Try resetting your country or deal type filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal) => (
            <div
              key={deal.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              {/* Cover Image Banner */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                {deal.imageUrl ? (
                  <img
                    src={deal.imageUrl}
                    alt={deal.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950 flex items-center justify-center">
                    <Globe className="w-12 h-12 text-slate-700" />
                  </div>
                )}
                {/* Dark Gradient Overlay for Badges & Title Visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                {/* Floating Top Badges Overlay - Mobile Responsive Wrapping */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap items-center justify-between gap-1.5 z-10">
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur border border-cyan-500/40 text-cyan-300 text-[10px] sm:text-[11px] font-bold font-mono shadow-md max-w-full">
                    <span>{deal.originCountryFlag}</span>
                    <span className="hidden sm:inline">{deal.originCountryName}</span>
                    <span className="sm:hidden font-mono">{deal.originCountryCode}</span>
                    <span className="text-cyan-400 font-sans">➔</span>
                    <span>{deal.targetCountryFlag}</span>
                    <span>{deal.targetRegion}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {deal.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/90 text-slate-950 text-[9px] sm:text-[10px] font-extrabold shadow-md">
                        ⭐ Featured
                      </span>
                    )}
                    <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/85 text-slate-200 border border-slate-700 backdrop-blur">
                      {deal.dealType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ambient Glow */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

              <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3 relative z-10">
                  {/* Deal Title & Short Teaser */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                      {deal.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {deal.shortDescription}
                    </p>
                  </div>

                  {/* Publisher Trust & Outcome Row */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Publisher:</span>
                      <span className="font-bold text-white">LUMO Admin Desk</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>

                    <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Required Outcome:
                      </span>
                      <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{deal.requiredOutcome}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Reward Section & Action Button */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3 relative z-10">
                  <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Reward Payout</span>
                      <span className="text-sm font-extrabold text-emerald-400 font-mono">
                        {deal.rewardStructure.displayLabel || `${deal.rewardStructure.commissionRate}% Commission`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Settlement</span>
                      <span className="text-xs font-bold text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                        {deal.rewardStructure.currency}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isMember && onRequireSubscription) {
                        onRequireSubscription()
                        return
                      }
                      setActiveDeal(deal)
                      setModalOpen(true)
                    }}
                    className="w-full py-3 px-4 bg-cyan-500/10 hover:bg-cyan-400 hover:text-slate-950 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-2 group/btn cursor-pointer shadow-md"
                  >
                    <span>View Opportunity & Apply</span>
                    <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Partner Detail & Application Modal */}
      <InternationalDealDetailModal
        deal={activeDeal}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setActiveDeal(null)
        }}
        onApplied={() => fetchDeals()}
      />
    </div>
  )
}
