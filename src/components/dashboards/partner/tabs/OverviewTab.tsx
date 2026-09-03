'use client'

import React, { useState } from 'react'
import {
  Briefcase,
  Users,
  Target,
  Wallet,
  ArrowRight,
  TrendingUp,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Lock,
  Play,
  Film,
  Bookmark,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  PartnerPerformanceMetrics,
  PartnerOpportunitySummary,
  JoinedDealItem,
  PartnerSidebarSection,
} from '../types'
import { usePartnerToast } from '../PartnerToast'

interface OverviewTabProps {
  partnerName: string
  performance: PartnerPerformanceMetrics
  opportunities: PartnerOpportunitySummary[]
  joinedDeals: JoinedDealItem[]
  profileCompletion: number
  onNavigateTab: (tab: PartnerSidebarSection) => void
  onOpenOpportunityDetail: (opp: PartnerOpportunitySummary) => void
  onOpenPayoutRequest: () => void
}

const PERFORMANCE_DATA_7D = [
  { date: '18 Aug', value: 0 },
  { date: '19 Aug', value: 0 },
  { date: '20 Aug', value: 0 },
  { date: '21 Aug', value: 0 },
  { date: '22 Aug', value: 0 },
  { date: '23 Aug', value: 0 },
  { date: '24 Aug', value: 0 },
]

const PERFORMANCE_DATA_30D = [
  { date: 'W1', value: 0 },
  { date: 'W2', value: 0 },
  { date: 'W3', value: 0 },
  { date: 'W4', value: 0 },
]

const PERFORMANCE_DATA_6M = [
  { date: 'Mar', value: 0 },
  { date: 'Apr', value: 0 },
  { date: 'May', value: 0 },
  { date: 'Jun', value: 0 },
  { date: 'Jul', value: 0 },
  { date: 'Aug', value: 0 },
]

export function OverviewTab({
  partnerName,
  performance,
  opportunities,
  joinedDeals,
  profileCompletion,
  onNavigateTab,
  onOpenOpportunityDetail,
  onOpenPayoutRequest,
}: OverviewTabProps) {
  const { showToast } = usePartnerToast()
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '6M'>('7D')

  const chartData =
    timeRange === '7D'
      ? PERFORMANCE_DATA_7D
      : timeRange === '30D'
      ? PERFORMANCE_DATA_30D
      : PERFORMANCE_DATA_6M

  const activeDeals = joinedDeals.filter((d) => d.status === 'ACTIVE')

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="dashboard-welcome flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
              Welcome back, {partnerName}
            </h2>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Profile completed: {profileCompletion}%</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Partner Workspace · Discover verified commercial deals, track referrals, and receive safeguarded earnings.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('discover')}
            className="py-2.5 px-5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Discover Opportunities</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
        {/* Active Deals */}
        <div
          onClick={() => onNavigateTab('my_deals')}
          className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer hover:border-orange-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500">Active Deals</span>
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                {activeDeals.length}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-[#FF6A00] font-bold flex items-center gap-1">
            <span>View joined deals →</span>
          </div>
        </div>

        {/* Qualified Leads */}
        <div
          onClick={() => onNavigateTab('leads_referrals')}
          className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer hover:border-blue-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500">Qualified Leads</span>
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                {performance.qualifiedLeads}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
            <span>View lead roster →</span>
          </div>
        </div>

        {/* Verified Conversions */}
        <div
          onClick={() => onNavigateTab('performance')}
          className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500">Verified Conversions</span>
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                {performance.verifiedConversions}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <span>Inspect conversion history →</span>
          </div>
        </div>

        {/* Available Approved Earnings */}
        <div
          onClick={() => onNavigateTab('earnings_payouts')}
          className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer hover:border-purple-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500">Available Earnings</span>
              <div className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white font-mono">
                TZS {performance.approvedRewardsTZS.toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-purple-600 font-bold flex items-center gap-1">
            <span>Request payout →</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Performance Chart + Next Payout Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Commercial Outcome Velocity (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Partner Commercial Performance Velocity
              </h3>
              <p className="text-xs text-slate-500">
                Verified customer conversions, sales, and qualified leads delivered across your active deals.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
              {(['7D', '30D', '6M'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    timeRange === r
                      ? 'bg-white dark:bg-slate-900 text-[#FF6A00] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="partnerVelocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF6A00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  formatter={(value: any) => [`${value} Verified Outcomes`, 'Conversions']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#FF6A00"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#partnerVelocityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Next Scheduled Payout Card (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Next Payout Batch
              </span>
              <span className={`w-2 h-2 rounded-full ${performance.approvedRewardsTZS > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            </div>

            <div className={`p-4 rounded-2xl border text-center space-y-1 ${performance.approvedRewardsTZS > 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'}`}>
              <Calendar className={`w-6 h-6 mx-auto ${performance.approvedRewardsTZS > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono pt-1">
                TZS {Math.max(0, Math.round(performance.approvedRewardsTZS * 0.95)).toLocaleString()}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                {performance.approvedRewardsTZS > 0 ? 'Next Batch Scheduled on Approval' : 'No Scheduled Payouts'}
              </div>
              <div className="text-[10px] text-slate-500">
                {performance.approvedRewardsTZS > 0 ? 'M-Pesa / Bank account routing' : 'Join deals & earn commissions to schedule payouts'}
              </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Payable:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">TZS {performance.approvedRewardsTZS.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TRA Withholding Tax (5%):</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">- TZS {Math.round(performance.approvedRewardsTZS * 0.05).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LUMO Platform Fee:</span>
                <span className="font-mono font-bold text-emerald-600">FREE (0%)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('earnings_payouts')}
            className="w-full py-2.5 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors text-center"
          >
            View Payout History & Statements
          </button>
        </div>
      </div>

      {/* Active Enrolled Deals Section */}
      {activeDeals.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  My Active Enrolled Deals
                </h3>
                <span className="text-[10px] bg-orange-100 dark:bg-orange-950 text-[#FF6A00] font-black px-2 py-0.5 rounded-full">
                  {activeDeals.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Your live commercial campaigns, unique tracking links, and marketing collateral.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('my_deals')}
              className="text-xs font-bold text-[#FF6A00] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage All My Deals</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDeals.map((deal) => (
              <div
                key={deal.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {deal.businessName} · {deal.category}
                    </span>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white leading-snug mt-0.5">
                      {deal.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-black text-[#FF6A00] bg-orange-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-orange-200 dark:border-slate-700 shrink-0">
                    {deal.rewardDisplay}
                  </span>
                </div>

                {/* Tracking Link & Copy */}
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    {deal.trackingLink}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(deal.trackingLink)
                      showToast('success', 'Link Copied', 'Your referral link is copied to clipboard.')
                    }}
                    className="py-1 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-[#FF6A00] hover:text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    Copy Link
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onNavigateTab('leads_referrals')}
                    className="w-full py-1.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl text-center transition-colors cursor-pointer"
                  >
                    + Submit Lead
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Opportunities List with Images & Video Badges */}
      <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              Recommended Commercial Opportunities
            </h3>
            <p className="text-xs text-slate-500">
              Verified partner campaigns tailored to your distribution channels and region.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('discover')}
            className="text-xs font-bold text-[#FF6A00] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Opportunities</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              onClick={() => onOpenOpportunityDetail(opp)}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden flex flex-col justify-between group hover:border-orange-300 transition-all shadow-xs cursor-pointer"
            >
              <div>
                {/* Cover Image & Video Badge */}
                {opp.coverImageUrl && (
                  <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={opp.coverImageUrl}
                      alt={opp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] bg-[#FF6A00] text-white font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                        {opp.category}
                      </span>
                    </div>

                    {opp.promoVideoUrl && (
                      <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Film className="w-3 h-3 text-[#FF6A00]" />
                        <span>Video Pitch</span>
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white">
                      <span className="text-xs font-mono font-black">
                        {opp.rewardDisplay}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{opp.businessName}</span>
                    {opp.isBusinessVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>

                  <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {opp.title}
                  </h4>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {opp.publicSummary}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => onOpenOpportunityDetail(opp)}
                  className="w-full py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-orange-50 hover:text-[#FF6A00] hover:border-orange-300 font-extrabold text-xs rounded-xl transition-colors text-center"
                >
                  View Details & Join Deal
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
