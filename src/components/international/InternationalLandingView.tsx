'use client'

import React, { useState, useEffect } from 'react'
import {
  Globe,
  Search,
  Filter,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Send,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react'
import { ISO_COUNTRIES, formatCurrencyValue } from '@/modules/international/countries'
import { InternationalOpportunity } from '@/modules/international/types'
import { InternationalSubmissionModal } from './InternationalSubmissionModal'
import { InternationalSubscriptionModal } from './InternationalSubscriptionModal'

interface InternationalLandingViewProps {
  currentUserId?: string
  currentUserEmail?: string
  currentUserName?: string
  onNavigateHome?: () => void
}

export function InternationalLandingView({
  currentUserId,
  currentUserEmail,
  currentUserName,
  onNavigateHome,
}: InternationalLandingViewProps) {
  // Modal states
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false)
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<InternationalOpportunity | null>(null)

  // Inquiry state inside modal
  const [inquiryType, setInquiryType] = useState<'INTERESTED' | 'HAVE_CONNECTION'>('INTERESTED')
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [inquirySubmitting, setInquirySubmitting] = useState(false)
  const [inquirySuccess, setInquirySuccess] = useState(false)
  const [inquiryError, setInquiryError] = useState<string | null>(null)

  // Data states
  const [opportunities, setOpportunities] = useState<InternationalOpportunity[]>([])
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    activeCountriesCount: number
    opportunitiesCount: number
    membersCount: number
    totalEquivalentTZS: number
    countryDistribution: { code: string; name: string; flag: string; count: number }[]
  }>({
    activeCountriesCount: 0,
    opportunitiesCount: 0,
    membersCount: 0,
    totalEquivalentTZS: 0,
    countryDistribution: [],
  })

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('')

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (currentUserId) params.set('userId', currentUserId)
      if (selectedCountry) params.set('country', selectedCountry)
      if (selectedCategory) params.set('category', selectedCategory)
      if (selectedCurrency) params.set('currency', selectedCurrency)
      if (searchQuery) params.set('q', searchQuery)

      const res = await fetch(`/api/international/opportunities?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setOpportunities(data.opportunities || [])
        setIsMember(Boolean(data.isMember))
      }
    } catch (err) {
      console.error('Error fetching opportunities:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/international/stats')
      const data = await res.json()
      if (data.success && data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchOpportunities()
  }, [selectedCountry, selectedCategory, selectedCurrency, searchQuery, currentUserId])

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOpportunity || !currentUserId || !currentUserEmail) return
    setInquiryError(null)
    setInquirySubmitting(true)

    try {
      const res = await fetch('/api/international/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: selectedOpportunity.id,
          memberId: currentUserId,
          memberName: currentUserName || currentUserEmail.split('@')[0],
          memberEmail: currentUserEmail,
          inquiryType,
          message: inquiryMessage,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit inquiry')
      }

      setInquirySuccess(true)
    } catch (err: any) {
      setInquiryError(err.message || 'Error submitting inquiry')
    } finally {
      setInquirySubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070D18] text-slate-900 dark:text-white">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white via-slate-50 to-orange-50/20 dark:from-[#0B1220] dark:via-[#070D18] dark:to-orange-950/10 py-16 sm:py-24">
        <div className="absolute top-0 right-1/4 -mt-12 w-96 h-96 rounded-full bg-gradient-to-br from-orange-400/10 to-transparent blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/40 text-[#FF6A00] text-xs font-bold mb-6">
            <Globe className="w-3.5 h-3.5" />
            LUMO INTERNATIONAL
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight">
            Opportunities <span className="text-[#FF6A00]">Without Borders</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Discover verified commercial opportunities, buyer requirements, supplier contracts, and cross-border partnerships from around the world.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => {
                const el = document.getElementById('marketplace-catalog')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              className="w-full sm:w-auto px-7 py-3 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-sm font-extrabold rounded-2xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              Explore International Opportunities
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSubmissionModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-bold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#FF6A00]" />
              Submit an International Opportunity
            </button>
          </div>

          {/* Live Dynamic Stats (Calculated from real records) */}
          <div className="mt-14 pt-8 border-t border-slate-200/60 dark:border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/50 dark:border-slate-800/50">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.activeCountriesCount}
              </div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
                Countries Represented
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/50 dark:border-slate-800/50">
              <div className="text-2xl font-black text-[#FF6A00]">
                {stats.totalEquivalentTZS > 0
                  ? `TZS ${(stats.totalEquivalentTZS / 1_000_000).toFixed(1)}M+`
                  : 'Multi-Currency'}
              </div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
                Opportunity Value
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/50 dark:border-slate-800/50">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.opportunitiesCount}
              </div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
                Active Opportunities
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/50 dark:border-slate-800/50">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.membersCount}
              </div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
                Private Members
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COUNTRY EXPLORER SECTION */}
      <section className="py-8 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#FF6A00]" />
            Explore by Country
          </h2>
          {selectedCountry && (
            <button
              onClick={() => setSelectedCountry('')}
              className="text-xs text-[#FF6A00] font-bold hover:underline"
            >
              Clear Filter (Show All)
            </button>
          )}
        </div>

        {stats.countryDistribution.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {stats.countryDistribution.map((item) => {
              const isSelected = selectedCountry === item.code
              return (
                <button
                  key={item.code}
                  onClick={() => setSelectedCountry(isSelected ? '' : item.code)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#FF6A00] bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">{item.flag}</span>
                  <span>{item.name}</span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-500">
                    {item.count}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic py-2">
            No published international opportunities yet. Opportunities will appear here as soon as they are submitted and approved.
          </div>
        )}
      </section>

      {/* SEARCH & FILTER TOOLBAR */}
      <section id="marketplace-catalog" className="py-4 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search global opportunities, keywords, references..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Country Selector */}
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">All Countries</option>
              {ISO_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>

            {/* Currency Selector */}
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">All Currencies</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED</option>
              <option value="KES">KES</option>
              <option value="TZS">TZS</option>
              <option value="ZAR">ZAR</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchOpportunities}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Refresh Opportunities"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
        </div>
      </section>

      {/* OPPORTUNITIES CATALOG GRID */}
      <section className="py-6 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {opportunities.length} Approved International Opportunities
          </div>
          {!isMember && (
            <button
              onClick={() => setSubscriptionModalOpen(true)}
              className="text-xs font-bold text-[#FF6A00] hover:underline flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              Unlock Full Details with International Private Access
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#FF6A00]" />
            Loading international opportunities...
          </div>
        ) : opportunities.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-[#FF6A00] flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No International Opportunities Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                No live opportunities currently match your search criteria. Be the first to submit a cross-border opportunity to LUMO!
              </p>
            </div>
            <button
              onClick={() => setSubmissionModalOpen(true)}
              className="px-5 py-2.5 bg-[#FF6A00] text-white text-xs font-bold rounded-xl hover:bg-[#EA580C] transition-all cursor-pointer shadow-xs"
            >
              Submit an International Opportunity
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="text-sm">{opp.countryFlag}</span>
                      <span>{opp.countryName}</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-[#FF6A00] uppercase tracking-wider mb-1">
                    {opp.category.replace(/_/g, ' ')}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#FF6A00] transition-colors">
                    {opp.title}
                  </h3>

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {opp.summary}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Opportunity Value
                      </div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrencyValue(opp.opportunityValue, opp.currency)}
                      </div>
                    </div>

                    {opp.rewardAmount && opp.rewardAmount > 0 && (
                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Reward / Fee
                        </div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrencyValue(opp.rewardAmount, opp.rewardCurrency || opp.currency)}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedOpportunity(opp)}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-[#FF6A00] hover:text-white dark:hover:bg-[#FF6A00] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    View Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* OPPORTUNITY DETAIL & INQUIRY MODAL */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0B1220] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedOpportunity.countryFlag}</span>
                <div>
                  <div className="text-xs font-bold text-slate-500">
                    {selectedOpportunity.countryName} • Ref: {selectedOpportunity.reference}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedOpportunity.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedOpportunity(null)
                  setInquirySuccess(false)
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Financial terms card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Opportunity Value</div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {formatCurrencyValue(selectedOpportunity.opportunityValue, selectedOpportunity.currency)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    ~TZS {(selectedOpportunity.estimatedValueTZS / 1_000_000).toFixed(2)}M equivalent
                  </div>
                </div>

                {selectedOpportunity.rewardAmount && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Target Commission</div>
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrencyValue(selectedOpportunity.rewardAmount, selectedOpportunity.rewardCurrency || selectedOpportunity.currency)}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified by LUMO
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Opportunity Summary
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedOpportunity.summary}
                </p>
              </div>

              {/* Gated Commercial Terms Section */}
              {isMember ? (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl space-y-2">
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Unlocked International Private Dossier
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedOpportunity.fullDescription}
                    </p>
                    {selectedOpportunity.commercialTerms && (
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        {selectedOpportunity.commercialTerms}
                      </div>
                    )}
                  </div>

                  {/* Inquiry form for member */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
                      Submit Inquiry / Connection to LUMO Desk
                    </h4>

                    {inquirySuccess ? (
                      <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Inquiry submitted successfully! A LUMO Desk coordinator will contact you.
                      </div>
                    ) : (
                      <form onSubmit={handleInquirySubmit} className="space-y-3">
                        {inquiryError && (
                          <div className="text-xs text-red-600">{inquiryError}</div>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setInquiryType('INTERESTED')}
                            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                              inquiryType === 'INTERESTED'
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            I am Interested
                          </button>
                          <button
                            type="button"
                            onClick={() => setInquiryType('HAVE_CONNECTION')}
                            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                              inquiryType === 'HAVE_CONNECTION'
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            I Have a Connection
                          </button>
                        </div>

                        <textarea
                          rows={3}
                          placeholder="Provide details about your capacity or your prospective partner connection..."
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          required
                        />

                        <button
                          type="submit"
                          disabled={inquirySubmitting}
                          className="w-full py-2 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {inquirySubmitting ? 'Sending to Desk...' : 'Send Inquiry to LUMO Desk'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ) : (
                /* Gated prompt for non-members */
                <div className="p-5 bg-gradient-to-br from-orange-50 to-slate-50 dark:from-orange-950/30 dark:to-slate-900 rounded-2xl border border-orange-200 dark:border-orange-900/40 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 text-[#FF6A00] flex items-center justify-center mx-auto">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Commercial Terms & Contact Dossier Locked
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      International Private Members get unredacted commercial agreements, verified supplier capacity, and direct facilitated intros.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOpportunity(null)
                      setSubscriptionModalOpen(true)
                    }}
                    className="px-6 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-extrabold rounded-xl transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Get International Private Access
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION MODAL */}
      <InternationalSubmissionModal
        isOpen={submissionModalOpen}
        onClose={() => setSubmissionModalOpen(false)}
        onSuccess={() => {
          fetchStats()
          fetchOpportunities()
        }}
      />

      {/* SUBSCRIPTION MODAL */}
      <InternationalSubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        currentUserId={currentUserId}
        currentUserEmail={currentUserEmail}
        currentUserName={currentUserName}
        onSubscriptionSuccess={() => {
          setIsMember(true)
          fetchStats()
          fetchOpportunities()
        }}
      />
    </div>
  )
}
