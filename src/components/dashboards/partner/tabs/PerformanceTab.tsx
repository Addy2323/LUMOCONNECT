'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  Sparkles,
  CheckCircle2,
  BarChart3,
  ArrowUpRight,
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
import { generateDateBuckets, TimeSeriesPoint } from '@/lib/dynamicDateRange'

interface PerformanceTabProps {
  performance: PartnerPerformanceMetrics
  joinedDeals: JoinedDealItem[]
  profileCompletion: number
}

type PeriodType = '7D' | '30D' | '6M' | '12M'
type ChartMetricType = 'earnings' | 'clicks' | 'leads' | 'conversions'

export function PerformanceTab({ performance, joinedDeals, profileCompletion }: PerformanceTabProps) {
  const { showToast } = usePartnerToast()
  const [period, setPeriod] = useState<PeriodType>('7D')
  const [metricType, setMetricType] = useState<ChartMetricType>('earnings')

  const [chartData, setChartData] = useState<TimeSeriesPoint[]>(() => generateDateBuckets('7D'))
  const [periodTotals, setPeriodTotals] = useState({ earnings: 0, clicks: 0, leads: 0, conversions: 0 })
  const [apiConversionRate, setApiConversionRate] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/partner/performance?period=${period}&metric=${metricType}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.series) && data.series.length > 0) {
          setChartData(data.series)
          if (data.periodTotals) {
            setPeriodTotals(data.periodTotals)
          }
          if (data.summary?.conversionRate !== undefined) {
            setApiConversionRate(data.summary.conversionRate)
          }
        } else {
          setChartData(generateDateBuckets(period))
        }
      })
      .catch(() => {
        setChartData(generateDateBuckets(period))
      })
  }, [period, metricType])

  // Real totals calculated directly from performance prop & enrolled deals
  const totalClicksCount = performance?.verifiedClicks || 0

  const totalLeadsCount = useMemo(() => {
    if (performance?.qualifiedLeads && performance.qualifiedLeads > 0) return performance.qualifiedLeads
    return joinedDeals.reduce((sum, d) => sum + (d.activeLeadsCount || 0), 0)
  }, [performance, joinedDeals])

  const totalConversionsCount = useMemo(() => {
    if (performance?.verifiedConversions && performance.verifiedConversions > 0) return performance.verifiedConversions
    return joinedDeals.reduce((sum, d) => sum + (d.verifiedConversionsCount || 0), 0)
  }, [performance, joinedDeals])

  const totalRewardsTZS = useMemo(() => {
    if (performance?.approvedRewardsTZS && performance.approvedRewardsTZS > 0) return performance.approvedRewardsTZS
    return joinedDeals.reduce((sum, d) => sum + (d.earningsEarnedTZS || 0), 0)
  }, [performance, joinedDeals])

  const calculatedConversionRate =
    apiConversionRate !== null
      ? apiConversionRate
      : totalClicksCount > 0
      ? Math.round((totalConversionsCount / totalClicksCount) * 100)
      : totalLeadsCount > 0
      ? Math.round((totalConversionsCount / totalLeadsCount) * 100)
      : 0

  // Real CSV File Export
  const handleExport = () => {
    try {
      const startDate = chartData[0]?.date || 'start'
      const endDate = chartData[chartData.length - 1]?.date || 'end'
      const fileName = `lumo-partner-performance-${period.toLowerCase()}-${startDate}-to-${endDate}.csv`

      const csvRows = [
        ['LUMO DEALERS - COMMERCIAL PERFORMANCE & OUTCOME ANALYTICS'],
        [`Generated On: ${new Date().toLocaleString()}`],
        [`Timeframe: ${period}`],
        [''],
        ['DATE', 'LABEL', 'VERIFIED CLICKS', 'QUALIFIED LEADS', 'CONVERSIONS', 'EARNINGS (TZS)'],
        ...chartData.map((d) => [d.date, d.label, d.clicks, d.leads, d.conversions, d.earnings]),
        [''],
        ['PERIOD TOTALS'],
        ['Period Clicks', periodTotals.clicks],
        ['Period Qualified Leads', periodTotals.leads],
        ['Period Conversions', periodTotals.conversions],
        ['Period Earnings (TZS)', periodTotals.earnings],
        [''],
        ['LIFETIME TOTALS'],
        ['Total Verified Clicks', totalClicksCount],
        ['Total Qualified Leads', totalLeadsCount],
        ['Total Conversions', totalConversionsCount],
        ['Total Approved Rewards (TZS)', totalRewardsTZS],
        [''],
        ['ACTIVE DEAL BREAKDOWN'],
        ['DEAL TITLE', 'PUBLISHER', 'LEADS SUBMITTED', 'VERIFIED CONVERSIONS', 'TOTAL EARNED (TZS)'],
        ...(joinedDeals.length > 0
          ? joinedDeals.map((d) => [
              `"${d.title}"`,
              '"Lumo Dealers"',
              d.activeLeadsCount || 0,
              d.verifiedConversionsCount || 0,
              d.earningsEarnedTZS || 0,
            ])
          : [['"No active deals enrolled"', '"Lumo Dealers"', 0, 0, 0]]),
      ]

      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showToast('success', 'Performance Analytics Exported', `CSV statement downloaded: ${fileName}`)
    } catch (err) {
      showToast('error', 'Export Failed', 'Unable to generate CSV export.')
    }
  }

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Commercial Performance & Outcome Analytics</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-black px-2.5 py-0.5 rounded-full">
              LIVE / VERIFIED
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified performance metrics calculated directly from immutable transaction and screening records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer text-slate-700 dark:text-slate-200"
          >
            <Download className="w-4 h-4 text-[#FF6A00]" />
            <span>Export Analytics (CSV)</span>
          </button>
        </div>
      </div>

      {/* 6 Key Commercial Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Verified Clicks</span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {totalClicksCount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">Unique visitors</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 space-y-1">
          <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Qualified Leads</span>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {totalLeadsCount}
          </div>
          <span className="text-[10px] text-blue-500 font-bold">Passed screening</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Conversions</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {totalConversionsCount}
          </div>
          <span className="text-[10px] text-emerald-500 font-bold">Verified Sales</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Conversion Rate</span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {calculatedConversionRate}%
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">Visitor-to-sale</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50 space-y-1">
          <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Approved Rewards</span>
          <div className="text-xl font-black text-purple-600 dark:text-purple-300 font-mono">
            TZS {totalRewardsTZS.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Funds secured</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/50 space-y-1">
          <span className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">Profile Completed</span>
          <div className="text-xl font-black text-[#FF6A00] font-mono">
            {profileCompletion}%
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">KYC progress</span>
        </div>
      </div>

      {/* Main Velocity Area Chart Section */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF6A00]" />
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Commercial Velocity Trend ({period})
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Daily earnings accrued from verified customer conversions and milestone referral rewards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Metric Selector Toggler */}
            <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setMetricType('earnings')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricType === 'earnings'
                    ? 'bg-[#FF6A00] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Earnings (TZS)
              </button>
              <button
                onClick={() => setMetricType('clicks')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricType === 'clicks'
                    ? 'bg-[#FF6A00] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Clicks
              </button>
              <button
                onClick={() => setMetricType('leads')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricType === 'leads'
                    ? 'bg-[#FF6A00] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Leads
              </button>
            </div>

            {/* Timeframe Period Filter */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              {(['7D', '30D', '6M', '12M'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    period === p
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Period Summary Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Period Total Earnings</div>
            <div className="font-mono font-black text-[#FF6A00] text-sm mt-0.5">
              TZS {periodTotals.earnings.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Period Clicks</div>
            <div className="font-mono font-black text-slate-900 dark:text-white text-sm mt-0.5">
              {periodTotals.clicks.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Period Qualified Leads</div>
            <div className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm mt-0.5">
              {periodTotals.leads}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Period Conversions</div>
            <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
              {periodTotals.conversions}
            </div>
          </div>
        </div>

        {/* Recharts Area Chart Rendering */}
        {(() => {
          const maxVal = Math.max(0, ...(chartData.map((d: any) => Number(d[metricType]) || 0)))
          const hasActivity = maxVal > 0
          return (
            <div className="relative h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="partnerRewardGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#FF6A00" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    domain={[0, maxVal > 0 ? 'auto' : 5]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      metricType === 'earnings'
                        ? val >= 1000000
                          ? `${(val / 1000000).toFixed(1)}M`
                          : val >= 1000
                          ? `${(val / 1000).toFixed(0)}k`
                          : `${val}`
                        : `${val}`
                    }
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-700 shadow-xl text-xs space-y-1.5 font-sans">
                            <div className="font-extrabold text-slate-400 border-b border-slate-800 pb-1">{label}</div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">Accrued Earnings:</span>
                              <span className="font-mono font-black text-[#FF6A00]">
                                TZS {data.earnings.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">Verified Clicks:</span>
                              <span className="font-mono font-bold">{data.clicks}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">Qualified Leads:</span>
                              <span className="font-mono font-bold text-blue-400">{data.leads}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">Conversions:</span>
                              <span className="font-mono font-bold text-emerald-400">{data.conversions}</span>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={metricType}
                    stroke="#FF6A00"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#partnerRewardGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              {!hasActivity && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] rounded-2xl pointer-events-none">
                  <div className="text-center p-3">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No activity recorded for this period</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Live analytics will populate as leads & conversions are logged.</p>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Breakdown by Active Deal */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#FF6A00]" />
            <span>Performance Breakdown by Active Deal</span>
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            {joinedDeals.length} Campaign(s) Tracked
          </span>
        </div>

        {joinedDeals.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
              No Enrolled Deals Tracked Yet
            </h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              You haven't joined any commercial deals yet. Browse Discover Opportunities and click &apos;Join & Promote&apos; to view real live performance metrics here.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE CARD VIEW (< 768px) */}
            <div className="space-y-3 block md:hidden">
              {joinedDeals.map((d: JoinedDealItem) => {
                const leadCount = d.activeLeadsCount || 0
                const conversionCount = d.verifiedConversionsCount || 0
                const rate = leadCount > 0 ? Math.round((conversionCount / leadCount) * 100) : 0

                return (
                  <div
                    key={d.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                          {d.title}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          Lumo Dealers
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shrink-0 ${
                          rate > 20
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {rate}% Conv.
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Reward Terms</span>
                      <span className="font-mono font-black text-[#FF6A00] text-xs">
                        {d.rewardDisplay || 'Active'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Leads</div>
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{leadCount}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Conversions</div>
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{conversionCount}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Total Earned</div>
                        <div className="font-mono font-black text-[#FF6A00]">
                          TZS {(d.earningsEarnedTZS || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* DESKTOP TABLE VIEW (>= 768px) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Deal Title</th>
                    <th className="p-3.5">Merchant / Publisher</th>
                    <th className="p-3.5 text-center">Leads Submitted</th>
                    <th className="p-3.5 text-center">Verified Conversions</th>
                    <th className="p-3.5 text-right">Total Earned</th>
                    <th className="p-3.5 text-center">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {joinedDeals.map((d: JoinedDealItem) => {
                    const leadCount = d.activeLeadsCount || 0
                    const conversionCount = d.verifiedConversionsCount || 0
                    const rate = leadCount > 0 ? Math.round((conversionCount / leadCount) * 100) : 0

                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-extrabold text-slate-900 dark:text-white max-w-xs">
                          <div className="space-y-1">
                            <div className="font-bold leading-tight">{d.title}</div>
                            {d.rewardDisplay && (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900/50 text-[#FF6A00] text-[10px] font-mono font-extrabold">
                                {d.rewardDisplay}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">Lumo Dealers</td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {leadCount}
                        </td>
                        <td className="p-3.5 text-center font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                          {conversionCount}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-[#FF6A00]">
                          TZS {(d.earningsEarnedTZS || 0).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[11px] ${
                              rate > 20
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
