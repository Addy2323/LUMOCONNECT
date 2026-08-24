'use client'

import React, { useState } from 'react'
import {
  Briefcase,
  Users,
  Target,
  Wallet,
  ArrowRight,
  TrendingUp,
  Award,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Lock,
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
import { BusinessOpportunityItem, RewardFundingBalance, BusinessPartnerItem } from '../types'
import { useBusinessToast } from '../BusinessToast'

interface OverviewTabProps {
  businessName: string
  fundingBalance: RewardFundingBalance
  opportunities: BusinessOpportunityItem[]
  partners: BusinessPartnerItem[]
  onOpenCreateWizard: () => void
  onNavigateTab: (tab: any) => void
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
  businessName,
  fundingBalance,
  opportunities,
  partners,
  onOpenCreateWizard,
  onNavigateTab,
}: OverviewTabProps) {
  const { showToast } = useBusinessToast()
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '6M'>('7D')

  const chartData =
    timeRange === '7D'
      ? PERFORMANCE_DATA_7D
      : timeRange === '30D'
      ? PERFORMANCE_DATA_30D
      : PERFORMANCE_DATA_6M

  const liveOpportunities = opportunities.filter((o) => o.status === 'PUBLISHED')
  const totalActivePartners = partners.filter((p) => p.status === 'ACTIVE').length
  const totalVerifiedConversions = opportunities.reduce((acc, o) => acc + o.totalConversions, 0)

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
              Welcome back, {businessName}
            </h2>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified Business</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Commercial Workspace · Create opportunities, coordinate partners, and monitor verified performance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenCreateWizard}
            className="py-2.5 px-5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Opportunity</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
        {/* CARD 1: Live Opportunities */}
        <div
          onClick={() => onNavigateTab('my_opportunities')}
          className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer hover:border-orange-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500">Live Opportunities</span>
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                {liveOpportunities.length}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-[#FF6A00] font-bold flex items-center gap-1">
            <span>Manage listings →</span>
          </div>
        </div>

        {/* CARD 2: Active Partners */}
        <div
          onClick={() => onNavigateTab('partners_applications')}
          className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer hover:border-blue-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500">Active Partners</span>
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                {totalActivePartners}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
            <span>View partner roster →</span>
          </div>
        </div>

        {/* CARD 3: Verified Conversions */}
        <div
          onClick={() => onNavigateTab('conversions_results')}
          className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500">Verified Conversions</span>
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                {totalVerifiedConversions}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <span>Inspect evidence trail →</span>
          </div>
        </div>

        {/* CARD 4: Reward Budget Committed */}
        <div
          onClick={() => onNavigateTab('payments_funding')}
          className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer hover:border-purple-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500">Committed Escrow Budget</span>
              <div className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white font-mono">
                TZS {(fundingBalance.committedToActiveDealsTZS / 1000000).toFixed(1)}M
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-purple-600 font-bold flex items-center gap-1">
            <span>Manage escrow funding →</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart + Safeguarded Reward Funding Balance Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Performance Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Commercial Outcome Velocity
              </h3>
              <p className="text-xs text-slate-500">
                Verified customer conversions, sales, and qualified inquiries delivered across active campaigns.
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
                  <linearGradient id="outcomeGradient" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#outcomeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Safeguarded Reward Funding Balance Widget (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Reward Funding Balance
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white font-mono">
                TZS {fundingBalance.availableBalanceTZS.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Available uncommitted funding balance
              </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Committed to Active Deals:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  TZS {fundingBalance.committedToActiveDealsTZS.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pending Validation:</span>
                <span className="font-mono font-bold text-amber-600">
                  TZS {fundingBalance.pendingConfirmationTZS.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Rewards Paid Out:</span>
                <span className="font-mono font-bold text-emerald-600">
                  TZS {fundingBalance.rewardsPaidTZS.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Safeguarding Legal Notice */}
            <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 text-[10px] text-emerald-900 dark:text-emerald-300 leading-snug flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Safeguarded Escrow:</strong> Reward funds are processed and safeguarded through LUMO’s licensed payment partner ({fundingBalance.safeguardingProvider}).
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('payments_funding')}
            className="w-full py-2.5 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors text-center"
          >
            Fund Balance & Review Escrow Ledger
          </button>
        </div>
      </div>

      {/* Live Opportunities Table Preview */}
      <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              Active Commercial Opportunities ({liveOpportunities.length})
            </h3>
            <p className="text-xs text-slate-500">
              Live listings actively engaged by Partners on the LUMO Marketplace.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('my_opportunities')}
            className="text-xs font-bold text-[#FF6A00] hover:underline flex items-center gap-1"
          >
            <span>View All Opportunities</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Opportunity Title</th>
                <th className="p-3">Status / Version</th>
                <th className="p-3">Active Partners</th>
                <th className="p-3">Conversions</th>
                <th className="p-3">Reward Rate</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {liveOpportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-extrabold text-slate-900 dark:text-white">{opp.title}</div>
                    <div className="text-[10px] text-slate-400">{opp.category} · {opp.region}</div>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                        {opp.status}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">v{opp.version}</span>
                    </div>
                  </td>

                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {opp.activePartners}
                  </td>

                  <td className="p-3 font-mono font-bold text-[#FF6A00]">
                    {opp.totalConversions}
                  </td>

                  <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                    TZS {opp.rewardValueTZS.toLocaleString()} / Result
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => onNavigateTab('my_opportunities')}
                      className="py-1 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
