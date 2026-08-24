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
  { date: '18 Aug', clicks: 140, leads: 3, conversions: 1, earnings: 45000 },
  { date: '19 Aug', clicks: 210, leads: 5, conversions: 2, earnings: 90000 },
  { date: '20 Aug', clicks: 190, leads: 2, conversions: 1, earnings: 45000 },
  { date: '21 Aug', clicks: 310, leads: 8, conversions: 3, earnings: 165000 },
  { date: '22 Aug', clicks: 240, leads: 4, conversions: 1, earnings: 45000 },
  { date: '23 Aug', clicks: 180, leads: 3, conversions: 0, earnings: 0 },
  { date: '24 Aug', clicks: 290, leads: 6, conversions: 2, earnings: 95000 },
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
            className="py-2 px-3.5 border rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
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
          <div className="text-xl font-black text-[#FF6A00] font-mono mt-0.5">
            {performance.conversionRatePercent}%
          </div>
          <span className="text-[9px] text-slate-400">Visitor-to-sale</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Approved Rewards</span>
          <div className="text-xl font-black text-purple-600 font-mono mt-0.5">
            TZS {(performance.approvedRewardsTZS / 1000).toFixed(0)}k
          </div>
          <span className="text-[9px] text-purple-500 font-bold">Safeguarded in escrow</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Partner Score</span>
          <div className="text-xl font-black text-emerald-600 font-mono mt-0.5">
            {performance.partnerScore}/100
          </div>
          <span className="text-[9px] text-emerald-500 font-bold">Top 5% Tier</span>
        </div>
      </div>

      {/* Chart: Earnings & Conversions Velocity */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Reward Generation Velocity (TZS)
            </h3>
            <p className="text-xs text-slate-500">
              Daily earnings accrued from verified customer conversions and milestone bonuses.
            </p>
          </div>

          <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border text-xs font-bold">
            {(['7D', '30D', '6M', '12M'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg ${period === p ? 'bg-[#FF6A00] text-white' : 'text-slate-500'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PERFORMANCE_DATA_7D} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(value: any) => [`TZS ${Number(value).toLocaleString()}`, 'Accrued Earnings']}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#FF6A00"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#earningsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown by Deal */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Performance Breakdown by Active Deal
        </h3>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b">
              <tr>
                <th className="p-3">Deal Title</th>
                <th className="p-3">Business</th>
                <th className="p-3">Leads Submitted</th>
                <th className="p-3">Verified Conversions</th>
                <th className="p-3">Total Earned</th>
                <th className="p-3 text-right">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {joinedDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-extrabold text-slate-900 dark:text-white">{deal.title}</td>
                  <td className="p-3 text-slate-500">{deal.businessName}</td>
                  <td className="p-3 font-mono font-bold">{deal.activeLeadsCount}</td>
                  <td className="p-3 font-mono font-bold text-emerald-600">{deal.verifiedConversionsCount}</td>
                  <td className="p-3 font-mono font-black text-[#FF6A00]">
                    TZS {deal.earningsEarnedTZS.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                    {deal.activeLeadsCount > 0
                      ? `${((deal.verifiedConversionsCount / deal.activeLeadsCount) * 100).toFixed(1)}%`
                      : '0%'}
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
