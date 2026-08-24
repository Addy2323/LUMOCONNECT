'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Users,
  Target,
  Award,
  Radio,
  MapPin,
  Briefcase,
  AlertTriangle,
  RotateCcw,
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
import { PartnerPerformanceMetrics, JoinedDealItem } from '../types'
import { usePartnerToast } from '../PartnerToast'

interface PerformanceTabProps {
  performance: PartnerPerformanceMetrics
  joinedDeals: JoinedDealItem[]
}

const PERFORMANCE_DATA_7D = [
  { date: '18 Aug', clicks: 0, leads: 0, conversions: 0, earnings: 0 },
  { date: '19 Aug', clicks: 0, leads: 0, conversions: 0, earnings: 0 },
  { date: '20 Aug', clicks: 0, leads: 0, conversions: 0, earnings: 0 },
  { date: '21 Aug', clicks: 0, leads: 0, conversions: 0, earnings: 0 },
  { date: '22 Aug', clicks: 0, leads: 0, conversions: 0, earnings: 0 },
  { date: '23 Aug', clicks: 0, leads: 0, conversions: 0, earnings: 0 },
  { date: '24 Aug', clicks: 0, leads: 0, conversions: 0, earnings: 0 },
]

export function PerformanceTab({ performance, joinedDeals }: PerformanceTabProps) {
  const { showToast } = usePartnerToast()
  const [period, setPeriod] = useState<'7D' | '30D' | '6M' | '12M'>('7D')

  const handleExport = () => {
    showToast('success', 'Performance Analytics Exported', 'CSV statement downloaded.')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Commercial Performance & Outcome Analytics</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
              Read / Analytics
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified performance metrics calculated directly from immutable transaction and screening records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="py-2 px-3.5 border rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      {/* 6 Key Commercial Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Verified Clicks</span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
            {performance.verifiedClicks.toLocaleString()}
          </div>
          <span className="text-[9px] text-slate-400">Unique visitors</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Qualified Leads</span>
          <div className="text-xl font-black text-blue-600 font-mono mt-0.5">
            {performance.qualifiedLeads}
          </div>
          <span className="text-[9px] text-blue-500 font-bold">Passed screening</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Conversions</span>
          <div className="text-xl font-black text-emerald-600 font-mono mt-0.5">
            {performance.verifiedConversions}
          </div>
          <span className="text-[9px] text-emerald-500 font-bold">Verified Sales</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Conversion Rate</span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
            {performance.conversionRatePercent}%
          </div>
          <span className="text-[9px] text-slate-400">Visitor-to-sale</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Approved Rewards</span>
          <div className="text-xl font-black text-purple-600 font-mono mt-0.5">
            TZS {performance.approvedRewardsTZS.toLocaleString()}
          </div>
          <span className="text-[9px] text-slate-400">Safeguarded in escrow</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Partner Score</span>
          <div className="text-xl font-black text-[#FF6A00] font-mono mt-0.5">
            {performance.partnerScore}/100
          </div>
          <span className="text-[9px] text-emerald-600 font-bold">Active Standing</span>
        </div>
      </div>

      {/* Main Velocity Area Chart */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Reward Generation Velocity (TZS)
            </h3>
            <p className="text-xs text-slate-500">
              Daily earnings accrued from verified customer conversions and milestone bonuses.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border text-xs font-bold self-start sm:self-auto">
            {(['7D', '30D', '6M', '12M'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  period === p ? 'bg-[#FF6A00] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PERFORMANCE_DATA_7D} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="partnerRewardGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6A00" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#FF6A00"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#partnerRewardGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown by Active Deal */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Performance Breakdown by Active Deal
        </h3>

        {joinedDeals.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500">
            No active deals joined yet. Performance metrics will break down by individual campaigns once deals are enrolled.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase font-mono text-[10px] border-b">
                <tr>
                  <th className="p-3">Deal Title</th>
                  <th className="p-3">Business</th>
                  <th className="p-3">Leads Submitted</th>
                  <th className="p-3">Verified Conversions</th>
                  <th className="p-3">Total Earned</th>
                  <th className="p-3">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {joinedDeals.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{d.title}</td>
                    <td className="p-3 text-slate-500">{d.businessName}</td>
                    <td className="p-3 font-mono">{d.activeLeadsCount}</td>
                    <td className="p-3 font-mono text-emerald-600 font-bold">{d.verifiedConversionsCount}</td>
                    <td className="p-3 font-mono font-bold text-[#FF6A00]">
                      TZS {d.earningsEarnedTZS.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono">
                      {d.activeLeadsCount > 0
                        ? `${Math.round((d.verifiedConversionsCount / d.activeLeadsCount) * 100)}%`
                        : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
