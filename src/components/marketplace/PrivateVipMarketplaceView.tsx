'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Crown,
  Sparkles,
  Flame,
  Clock3,
  BadgeCheck,
  LockKeyhole,
  ShieldCheck,
  ArrowRight,
  Filter,
  CheckCircle2,
  Lock,
  Zap,
  TrendingUp,
  MapPin,
  ChevronRight,
  Award,
  AlertCircle,
} from 'lucide-react'
import { listOpportunities } from '@/modules/deals/service'
import type { OpportunityItem as Opportunity } from '@/modules/deals/types'
import { ProtectedDealDetailsModal } from '@/components/marketplace/ProtectedDealDetailsModal'
import {
  getUserSubscription,
  createSubscriptionCheckout,
  listSubscriptionPlans,
} from '@/modules/subscriptions/service'
import { useLanguage } from '@/lib/i18n'
import { formatCategoryBadgeLabel } from '@/modules/deals/taxonomy'

export function PrivateVipMarketplaceView() {
  const { t, locale } = useLanguage()

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'EARLY_ACCESS' | 'HIGH_REWARD' | 'VERIFIED'>('ALL')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [currentUserId, setCurrentUserId] = useState<string>('partner_demo_user')
  const [userSub, setUserSub] = useState<any | null>(null)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null)
  const [showUpgradeDrawer, setShowUpgradeDrawer] = useState(false)

  // Load user session & subscription state
  const refreshUserSubscription = (uid: string) => {
    const sub = getUserSubscription(uid)
    setUserSub(sub)
  }

  useEffect(() => {
    let uid = 'partner_demo_user'
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lumo_user_session')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.id) uid = parsed.id
        }
      } catch {}
    }
    setCurrentUserId(uid)
    refreshUserSubscription(uid)

    const handleSubChange = () => refreshUserSubscription(uid)
    if (typeof window !== 'undefined') {
      window.addEventListener('lumo:subscription-updated', handleSubChange)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('lumo:subscription-updated', handleSubChange)
      }
    }
  }, [])

  // Load VIP Opportunities
  useEffect(() => {
    const allOpps = listOpportunities()
    setOpportunities(allOpps)
  }, [])

  const categories = Array.from(new Set(opportunities.map((o) => o.category)))

  const filteredOpportunities = opportunities.filter((opp) => {
    // Category filter
    if (selectedCategory !== 'ALL' && opp.category !== selectedCategory) return false

    // VIP Filter
    if (selectedFilter === 'EARLY_ACCESS') return opp.isGoldenVip
    if (selectedFilter === 'HIGH_REWARD') return opp.rewardDisplay.includes('150') || opp.rewardDisplay.includes('250') || opp.rewardDisplay.includes('VIP')
    if (selectedFilter === 'VERIFIED') return opp.isVerified && (opp.qualityScore ? opp.qualityScore >= 90 : true)

    return true
  })

  // Quick Golden VIP subscription activation helper
  const handleSubscribeVip = async (planCode: 'GOLDEN_VIP' | 'ANNUAL' = 'GOLDEN_VIP') => {
    setIsSubscribing(true)
    setCheckoutNotice(null)
    try {
      const res = await createSubscriptionCheckout({
        userId: currentUserId,
        userRole: 'PARTNER',
        planCode,
        amountTZS: planCode === 'GOLDEN_VIP' ? 65000 : 180000,
        paymentMethod: 'MPESA',
        phoneNumber: '+255712345678',
      })

      if (res.success) {
        refreshUserSubscription(currentUserId)
        setCheckoutNotice(
          locale === 'sw'
            ? `Uanachama wa Golden VIP umewezeshwa kwa mafanikio!`
            : `Golden VIP Membership activated successfully!`
        )
        setShowUpgradeDrawer(false)
      } else {
        setCheckoutNotice(res.error || 'Failed to activate subscription.')
      }
    } catch (e) {
      setCheckoutNotice(e instanceof Error ? e.message : 'Error processing checkout.')
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleOpenDeal = (opp: Opportunity) => {
    // Map Opportunity to ProtectedDealDetails shape
    const protectedDeal = {
      id: opp.id,
      title: opp.title,
      slug: opp.slug,
      summary: opp.summary,
      description: opp.description,
      category: opp.category,
      countryCode: opp.countryCode,
      region: opp.region,
      currency: opp.currency,
      rewardType: opp.rewardType,
      rewardDisplay: opp.rewardDisplay,
      commissionFormula: opp.rewardDetail || 'Payable upon verified outcome',
      principalPriceDisplay: opp.summary.match(/TZS [\d,]+/)?.[0] || 'Exclusive Commercial Deal',
      spentBudgetTZS: opp.spentBudgetTZS,
      activePartnerCount: opp.activePartnerCount,
      maxPartners: 10,
      deliverableChecklist: [
        'Verified customer introduction or commercial buyer contract',
        'Inspection window compliance & product quality guarantee',
        'Direct merchant settlement via M-Pesa / TZS Bank',
      ],
      eligibilityRequirements: [
        'Must be an active Golden VIP / Private Member subscriber',
        'Strict anti-fraud customer attribution policy',
        '48-hour quality inspection hold before payout release',
      ],
      salesAssetsUrl: '#',
      featuredImageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&auto=format&fit=crop&q=80',
      companyLogo: opp.companyName.slice(0, 2).toUpperCase(),
      qualityScore: opp.qualityScore || 95,
      inspectionWindowHours: opp.inspectionWindowHours || 48,
      productCondition: opp.productCondition || 'BRAND_NEW',
    }

    setSelectedDeal(protectedDeal)
    setIsModalOpen(true)
  }

  const hasVipAccess = userSub?.hasGoldenVipAccess || userSub?.isGoldenVip || userSub?.isActive

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Banner & Header */}
      <section className="relative overflow-hidden border-b border-amber-900/40 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-10 pb-16">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-amber-500/10 via-orange-500/20 to-amber-600/5 blur-3xl pointer-events-none" />

        <div className="lumo-container relative z-10 space-y-8">
          {/* Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold tracking-widest text-amber-400 backdrop-blur-md">
              <Crown className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>LUMO GOLDEN VIP MARKETPLACE</span>
            </div>

            {/* VIP Status Pill */}
            <div className="flex items-center gap-3">
              {hasVipAccess ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3.5 py-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>VIP Priority Unlocked ({userSub?.planName || 'Golden VIP'})</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUpgradeDrawer(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 px-4 py-1.5 text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Crown className="w-4 h-4" />
                  <span>Activate Golden VIP</span>
                </button>
              )}
            </div>
          </div>

          {/* Hero Content */}
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              First-look opportunities for <span className="bg-gradient-to-r from-amber-200 via-orange-400 to-amber-500 bg-clip-text text-transparent">Golden VIP Members.</span>
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-slate-400">
              Access high-margin, verified deals during the exclusive <strong>24-hour priority window</strong> before opportunities open to standard partner channels.
            </p>
          </div>

          {/* Value Props Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xs">
              <Clock3 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-bold text-white">24h Priority Early Window</h2>
                <p className="text-[11px] text-slate-400 mt-1">Claim high-reward slots before public release.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xs">
              <BadgeCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-bold text-white">Verified 90%+ Quality Score</h2>
                <p className="text-[11px] text-slate-400 mt-1">Inspected products with 48h escrow protection.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xs">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-bold text-white">Direct M-Pesa Settlement</h2>
                <p className="text-[11px] text-slate-400 mt-1">Confidential commission terms & direct payouts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Marketplace Area */}
      <main className="lumo-container mt-8 space-y-6">
        {/* Notice Banner if Subscription updated */}
        {checkoutNotice && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{checkoutNotice}</span>
            </div>
            <button
              onClick={() => setCheckoutNotice(null)}
              className="text-slate-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
          {/* Quick Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All VIP Deals ({opportunities.length})
            </button>

            <button
              onClick={() => setSelectedFilter('EARLY_ACCESS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedFilter === 'EARLY_ACCESS'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock3 className="w-3.5 h-3.5" />
              <span>24h Early Access Window</span>
            </button>

            <button
              onClick={() => setSelectedFilter('HIGH_REWARD')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedFilter === 'HIGH_REWARD'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>High Reward</span>
            </button>

            <button
              onClick={() => setSelectedFilter('VERIFIED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedFilter === 'VERIFIED'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Grade A Verified</span>
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 text-xs text-slate-200 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Opportunity Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opp) => (
            <article
              key={opp.id}
              className="group relative flex flex-col rounded-3xl border border-slate-800 bg-slate-900/90 hover:border-amber-500/50 transition-all duration-300 shadow-xl overflow-hidden"
            >
              {/* Header Badges */}
              <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-400">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>GOLDEN VIP</span>
                  </span>

                  {opp.isVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{opp.qualityScore || 95}% Grade</span>
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {opp.countryCode} · {opp.region}
                </span>
              </div>

              {/* Title & Description */}
              <div className="p-5 space-y-3 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  {formatCategoryBadgeLabel(opp.category, undefined, locale)}
                </p>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors leading-snug">
                  {opp.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {opp.summary}
                </p>
              </div>

              {/* Reward & Exclusivity Box */}
              <div className="mx-5 p-4 rounded-2xl bg-slate-950 border border-amber-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    CONFIDENTIAL REWARD
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase">
                    DIRECT SETTLEMENT
                  </span>
                </div>
                <div className="text-xl font-black text-amber-400 font-mono">
                  {opp.rewardDisplay}
                </div>
                <div className="text-[11px] text-slate-400">
                  {opp.rewardDetail || 'Payable upon verified commercial outcome'}
                </div>
              </div>

              {/* Countdown & Slot Reservation Progress Bar */}
              <div className="p-5 pt-4 space-y-3 border-t border-slate-800/80">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Clock3 className="w-3.5 h-3.5" />
                      <span>24h Early Access Window Active</span>
                    </div>
                    <span className="text-amber-400 font-bold font-mono">
                      {opp.activePartnerCount} / 10 slots
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(15, (opp.activePartnerCount / 10) * 100))}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenDeal(opp)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {hasVipAccess ? (
                    <>
                      <span>View & Activate VIP Deal Room</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock VIP Deal Room</span>
                    </>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Upgrade Banner for Non-VIP Users */}
        {!hasVipAccess && (
          <section className="rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-950/60 via-slate-900 to-orange-950/60 p-6 sm:p-10 text-white space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span>UPGRADE TO GOLDEN VIP ACCESS</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black">
                  Don't miss out on high-reward exclusive opportunities.
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Golden VIP Members get a 24-hour lead on all published commercial opportunities, direct phone transparency, and zero-queue compliance settlement.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <button
                  onClick={() => handleSubscribeVip('GOLDEN_VIP')}
                  disabled={isSubscribing}
                  className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all shadow-xl shadow-amber-500/20 text-center cursor-pointer"
                >
                  {isSubscribing ? 'Activating VIP...' : 'Activate Golden VIP (TZS 50,000/mo)'}
                </button>
                <button
                  onClick={() => handleSubscribeVip('ANNUAL')}
                  disabled={isSubscribing}
                  className="py-3.5 px-6 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all text-center cursor-pointer"
                >
                  Annual Elite (1 Mo VIP Free)
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* VIP Deal Room Modal Integration */}
      <ProtectedDealDetailsModal
        deal={selectedDeal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUserId={currentUserId}
        hasActiveSubscription={hasVipAccess}
        onRequireSubscription={() => {
          setIsModalOpen(false)
          setShowUpgradeDrawer(true)
        }}
      />

      {/* Upgrade Drawer */}
      {showUpgradeDrawer && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-white relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">Join Golden VIP Membership</h3>
              </div>
              <button
                onClick={() => setShowUpgradeDrawer(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Unlock immediate priority access to confidential commercial deals, 24-hour exclusivity windows, and direct merchant settlement.
            </p>

            <div className="space-y-3">
              <div
                onClick={() => handleSubscribeVip('GOLDEN_VIP')}
                className="p-4 rounded-2xl border border-amber-500/50 bg-slate-950 hover:border-amber-400 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-400">Golden VIP Monthly</span>
                  <span className="text-sm font-black font-mono text-white">TZS 50,000 / mo</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Full 24-hour early access window, direct WhatsApp concierge, priority payout hold.
                </p>
              </div>

              <div
                onClick={() => handleSubscribeVip('ANNUAL')}
                className="p-4 rounded-2xl border border-slate-700 bg-slate-950 hover:border-amber-400 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-400">Annual Elite (1 Mo VIP Free)</span>
                  <span className="text-sm font-black font-mono text-white">TZS 180,000 / yr</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Full 12-month membership + 1 Month Golden VIP access included free.
                </p>
              </div>
            </div>

            <div className="pt-2 text-center text-[11px] text-slate-400">
              Instant mobile payment integration via M-Pesa & TZS Bank.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
