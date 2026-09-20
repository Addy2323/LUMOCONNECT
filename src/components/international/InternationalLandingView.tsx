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
  Compass,
  Coins,
} from 'lucide-react'
import { ISO_COUNTRIES, formatCurrencyValue } from '@/modules/international/countries'
import { InternationalOpportunity } from '@/modules/international/types'
import { InternationalSubmissionModal } from './InternationalSubmissionModal'
import { InternationalSubscriptionModal } from './InternationalSubscriptionModal'
import { FindInvestorsModal } from './FindInvestorsModal'
import { JvPartnersModal } from './JvPartnersModal'
import { BusinessSaleModal } from './BusinessSaleModal'
import { InvestorReferralModal } from './InvestorReferralModal'
import { NdaModal } from './NdaModal'
import { TrendingUp, Users, UserCheck } from 'lucide-react'

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
  const [findInvestorsModalOpen, setFindInvestorsModalOpen] = useState(false)
  const [jvPartnersModalOpen, setJvPartnersModalOpen] = useState(false)
  const [businessSaleModalOpen, setBusinessSaleModalOpen] = useState(false)
  const [investorReferralModalOpen, setInvestorReferralModalOpen] = useState(false)
  const [ndaModalOpen, setNdaModalOpen] = useState(false)
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
      {/* HERO SECTION WITH IMAGE BACKGROUND */}
      <section className="relative overflow-hidden bg-slate-950 pt-8 pb-14 sm:py-20">
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 scale-100 group-hover:scale-105 transform transition-transform duration-1000 ease-out"
          style={{
            backgroundImage: `url('/images/international-hero-bg.png')`,
          }}
        />
        {/* Dark Gradient Veil */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950 z-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-slate-950/90 z-0" />

        {/* Top Left Architectural Text Overlay */}
        <div className="absolute left-4 top-4 sm:left-8 sm:top-8 z-10 space-y-0.5 font-mono text-[9px] sm:text-[10px] tracking-widest text-slate-300/80 uppercase pointer-events-none text-left">
          <div className="font-bold text-white/90">PEOPLE.</div>
          <div>BUSINESS.</div>
          <div>OPPORTUNITIES.</div>
          <div className="text-slate-400">A BRIGHTER TOMORROW.</div>
        </div>

        {/* Top Right Handwritten Cursive Overlay Text */}
        <div className="absolute right-4 top-4 sm:right-10 sm:top-8 z-10 text-right pointer-events-none">
          <div className="font-serif italic text-sm sm:text-2xl font-bold text-slate-100 tracking-wide">
            Global Connections.
          </div>
          <div className="font-serif italic text-sm sm:text-2xl font-bold text-slate-100 tracking-wide relative inline-block">
            Greater Opportunities.
            <div className="absolute -bottom-1 left-0 w-full h-1 bg-[#FF6A00] rounded-full transform -rotate-1 opacity-90" />
          </div>
        </div>

        {/* Hero Content Center */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-left sm:text-center pt-14 sm:pt-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white dark:bg-slate-900 text-[#FF6A00] border border-orange-400/80 text-[11px] font-extrabold mb-4 shadow-md hover:scale-105 transition-all duration-300 cursor-pointer">
            <Globe className="w-3.5 h-3.5 text-[#FF6A00]" />
            LUMO INTERNATIONAL
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1] drop-shadow-md">
            Opportunities
            <span className="block text-[#FF6A00] mt-0.5">Without Borders</span>
          </h1>

          {/* Subtext */}
          <p className="mt-3 sm:mt-4 text-xs sm:text-base text-slate-200 dark:text-slate-300 max-w-2xl sm:mx-auto leading-relaxed font-medium">
            Discover verified commercial opportunities, buyer requirements, supplier contracts, and cross-border partnerships from around the world.
          </p>

          {/* Mobile-Optimized Action Buttons */}
          <div className="mt-6 sm:mt-8 max-w-lg mx-auto space-y-2.5">
            {/* Full Width Button 1: Explore Opportunities */}
            <button
              onClick={() => {
                const el = document.getElementById('marketplace-catalog')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              className="w-full py-3.5 px-5 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs sm:text-sm font-extrabold rounded-2xl transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Compass className="w-3.5 h-3.5 text-white group-hover:rotate-45 transition-transform duration-300" />
                </div>
                <span>Explore Opportunities</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>

            {/* Full Width Button 2: Submit Opportunity */}
            <button
              onClick={() => setSubmissionModalOpen(true)}
              className="w-full py-3.5 px-5 bg-white hover:bg-slate-100 text-slate-950 text-xs sm:text-sm font-extrabold rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
            >
              <PlusCircle className="w-4 h-4 text-[#FF6A00] group-hover:rotate-90 transition-transform duration-300" />
              <span>Submit Opportunity</span>
            </button>

            {/* 2-Column Grid for Secondary Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => setFindInvestorsModalOpen(true)}
                className="py-3 px-3 bg-[#D8F3E5] dark:bg-emerald-950/70 hover:bg-[#c3ecd4] text-emerald-950 dark:text-emerald-200 text-xs font-bold rounded-2xl border border-emerald-300/60 dark:border-emerald-800/60 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
                <span>Find Investors</span>
              </button>

              <button
                onClick={() => setJvPartnersModalOpen(true)}
                className="py-3 px-3 bg-[#DCEBFB] dark:bg-blue-950/70 hover:bg-[#c6dff9] text-blue-950 dark:text-blue-200 text-xs font-bold rounded-2xl border border-blue-300/60 dark:border-blue-800/60 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
                <span>Find JV Partners</span>
              </button>

              <button
                onClick={() => setBusinessSaleModalOpen(true)}
                className="py-3 px-3 bg-[#EBE2FB] dark:bg-purple-950/70 hover:bg-[#ded1f8] text-purple-950 dark:text-purple-200 text-xs font-bold rounded-2xl border border-purple-300/60 dark:border-purple-800/60 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
              >
                <div className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
                <span>Businesses for Sale</span>
              </button>

              <button
                onClick={() => setInvestorReferralModalOpen(true)}
                className="py-3 px-3 bg-[#FDF0E6] dark:bg-amber-950/70 hover:bg-[#fae1cf] text-amber-950 dark:text-amber-200 text-xs font-bold rounded-2xl border border-amber-300/60 dark:border-amber-800/60 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
              >
                <div className="w-6 h-6 rounded-lg bg-orange-600/20 text-[#FF6A00] flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
                <span>I Have an Investor</span>
              </button>
            </div>
          </div>

          {/* Floating Glassmorphism Metric Box (3 Columns matching reference design) */}
          <div className="mt-8 max-w-lg mx-auto p-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-xl grid grid-cols-3 divide-x divide-slate-700/60 text-center">
            <div className="px-2 py-1">
              <div className="w-7 h-7 rounded-lg bg-white/10 text-slate-200 mx-auto flex items-center justify-center mb-1">
                <Globe className="w-4 h-4 text-slate-200" />
              </div>
              <div className="text-base sm:text-xl font-black text-white">32+</div>
              <div className="text-[10px] font-medium text-slate-400">Countries</div>
            </div>

            <div className="px-2 py-1">
              <div className="w-7 h-7 rounded-lg bg-white/10 text-slate-200 mx-auto flex items-center justify-center mb-1">
                <Coins className="w-4 h-4 text-slate-200" />
              </div>
              <div className="text-base sm:text-xl font-black text-white">TZS 4.2B+</div>
              <div className="text-[10px] font-medium text-slate-400 leading-tight">Total Opportunity Value</div>
            </div>

            <div className="px-2 py-1">
              <div className="w-7 h-7 rounded-lg bg-white/10 text-slate-200 mx-auto flex items-center justify-center mb-1">
                <Users className="w-4 h-4 text-slate-200" />
              </div>
              <div className="text-base sm:text-xl font-black text-white">1,240+</div>
              <div className="text-[10px] font-medium text-slate-400 leading-tight">International Members</div>
            </div>
          </div>

          {/* 3 Guarantee / Assurance Badges */}
          <div className="mt-6 flex items-center justify-center gap-4 sm:gap-8 text-[11px] font-semibold text-slate-300 max-w-md mx-auto">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verified Opportunities</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Secure Introductions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Global Reach</span>
            </div>
          </div>
        </div>
      </section>

      {/* WHITE CURVED SHEET TRANSITION FOR CATEGORIES */}
      <section className="-mt-6 bg-slate-50 dark:bg-[#070D18] rounded-t-[36px] pt-6 pb-4 px-4 sm:px-6 relative z-20 border-t border-slate-200/50 dark:border-slate-800/80 shadow-2xl">
        <div className="w-12 h-1 bg-[#FF6A00] rounded-full mx-auto mb-4" />
        <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-center mb-4">
          EXPLORE BY CATEGORY
        </h2>

        {/* COUNTRY EXPLORER / CATEGORIES CONTENT */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#FF6A00]" />
              Explore by Country
            </h3>
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
        </div>
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full sm:max-w-2xl bg-white dark:bg-[#0B1220] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-start sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                <span className="text-xl sm:text-2xl shrink-0">{selectedOpportunity.countryFlag}</span>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs font-bold text-slate-500 truncate">
                    {selectedOpportunity.countryName} • Ref: {selectedOpportunity.reference}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2">
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

      {/* FIND INVESTORS MODAL */}
      <FindInvestorsModal
        isOpen={findInvestorsModalOpen}
        onClose={() => setFindInvestorsModalOpen(false)}
        onSuccess={() => fetchStats()}
      />

      {/* JV PARTNERS MODAL */}
      <JvPartnersModal
        isOpen={jvPartnersModalOpen}
        onClose={() => setJvPartnersModalOpen(false)}
        onSuccess={() => fetchStats()}
      />

      {/* BUSINESSES FOR SALE MODAL */}
      <BusinessSaleModal
        isOpen={businessSaleModalOpen}
        onClose={() => setBusinessSaleModalOpen(false)}
        onSuccess={() => fetchStats()}
      />

      {/* INVESTOR REFERRAL MODAL */}
      <InvestorReferralModal
        isOpen={investorReferralModalOpen}
        onClose={() => setInvestorReferralModalOpen(false)}
        currentUserId={currentUserId}
        onSuccess={() => fetchStats()}
      />

      {/* NDA MODAL */}
      <NdaModal
        isOpen={ndaModalOpen}
        onClose={() => setNdaModalOpen(false)}
        currentUserId={currentUserId}
        opportunityId={selectedOpportunity?.id}
        targetTitle={selectedOpportunity?.title}
      />
    </div>
  )
}
