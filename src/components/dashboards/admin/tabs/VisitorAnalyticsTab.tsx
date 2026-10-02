'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Eye,
  Clock,
  Activity,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Compass,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Search,
  X,
  Layers,
  CheckCircle2,
  ChevronRight,
  Filter,
  ExternalLink,
  Shield,
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useAdminToast } from '../AdminToast'

export function VisitorAnalyticsTab() {
  const { showToast } = useAdminToast()
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | '6months' | '1year'>('30days')
  const [chartMetric, setChartMetric] = useState<'visitors' | 'pageViews' | 'sessions' | 'newVsReturning'>('visitors')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null)
  const [visitorDetails, setVisitorDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics/visitors?period=${timeRange}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        showToast('error', 'Error', 'Failed to load visitor analytics.')
      }
    } catch {
      showToast('error', 'Error', 'Network error fetching analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 15000)
    return () => clearInterval(interval)
  }, [timeRange])

  const handleOpenVisitorDetails = async (visitorId: string) => {
    setSelectedVisitorId(visitorId)
    setLoadingDetails(true)
    try {
      const res = await fetch(`/api/admin/analytics/visitors?visitorId=${visitorId}`)
      if (res.ok) {
        const json = await res.json()
        setVisitorDetails(json)
      } else {
        showToast('error', 'Error', 'Could not fetch visitor details.')
      }
    } catch {
      showToast('error', 'Error', 'Network error loading visitor details.')
    } finally {
      setLoadingDetails(false)
    }
  }

  const overview = data?.overview || {
    totalVisitors: 0,
    uniqueVisitors: 0,
    returningVisitors: 0,
    visitorsToday: 0,
    visitorsThisWeek: 0,
    visitorsThisMonth: 0,
    currentlyOnline: 0,
    totalPageViews: 0,
    avgSessionDurationLabel: '0s',
  }

  const liveVisitors = data?.liveVisitors || []
  const trafficChart = data?.trafficChart || []
  const mostVisitedPages = data?.mostVisitedPages || []
  const trafficSources = data?.trafficSources || []
  const deviceDist = data?.deviceDistribution || []
  const osDist = data?.osDistribution || []
  const browserDist = data?.browserDistribution || []
  const locationDist = data?.locationDistribution || []

  const filteredLiveVisitors = liveVisitors.filter((v: any) =>
    searchQuery === ''
      ? true
      : v.visitorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.page.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
              Visitor &amp; Traffic Analytics
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-0.5">
            Internal, privacy-first PostgreSQL traffic monitoring &amp; real-time session tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="py-2 px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl shadow-2xs hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW STATS GRID (9 KPI CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-9 gap-3">
        {/* Card 1: Total Visitors */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Visitors</span>
            <Users className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
            {overview.totalVisitors.toLocaleString()}
          </div>
        </div>

        {/* Card 2: Unique Visitors */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Unique</span>
            <Compass className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
            {overview.uniqueVisitors.toLocaleString()}
          </div>
        </div>

        {/* Card 3: Returning Visitors */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Returning</span>
            <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
            {overview.returningVisitors.toLocaleString()}
          </div>
        </div>

        {/* Card 4: Visitors Today */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Today</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
            {overview.visitorsToday.toLocaleString()}
          </div>
        </div>

        {/* Card 5: Visitors This Week */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">This Week</span>
            <Activity className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
            {overview.visitorsThisWeek.toLocaleString()}
          </div>
        </div>

        {/* Card 6: Visitors This Month */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">This Month</span>
            <Globe className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
            {overview.visitorsThisMonth.toLocaleString()}
          </div>
        </div>

        {/* Card 7: Currently Online */}
        <div className="xl:col-span-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
            <span className="text-[10px] font-black uppercase tracking-wider">Currently Online</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-900 dark:text-emerald-200">
            {overview.currentlyOnline}
          </div>
        </div>

        {/* Card 8: Total Page Views */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Page Views</span>
            <Eye className="w-3.5 h-3.5 text-[#FF6A00]" />
          </div>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
            {overview.totalPageViews.toLocaleString()}
          </div>
        </div>

        {/* Card 9: Avg Session Duration */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Avg Session</span>
            <Clock className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="text-base font-black font-mono text-slate-900 dark:text-white truncate">
            {overview.avgSessionDurationLabel}
          </div>
        </div>
      </div>

      {/* 3. TRAFFIC CHART WITH PERIOD FILTERS & METRIC SELECTORS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Traffic Trends &amp; Session Analytics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Time series breakdown of visitor growth, page views, and new vs. returning sessions
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Metric Selector Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              {(['visitors', 'pageViews', 'sessions', 'newVsReturning'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setChartMetric(m)}
                  className={`px-3 py-1 rounded-lg transition-colors capitalize ${
                    chartMetric === m
                      ? 'bg-white dark:bg-slate-900 text-[#FF6A00] font-black shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {m === 'newVsReturning' ? 'New vs Returning' : m}
                </button>
              ))}
            </div>

            {/* Time Period Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              {(['today', '7days', '30days', '6months', '1year'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setTimeRange(p)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    timeRange === p
                      ? 'bg-[#0B132B] text-white font-black shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p === 'today'
                    ? 'Today'
                    : p === '7days'
                    ? '7 Days'
                    : p === '30days'
                    ? '30 Days'
                    : p === '6months'
                    ? '6 Months'
                    : '1 Year'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Spline Area Chart */}
        <div className="relative h-64 sm:h-72 w-full pt-2">
          {trafficChart.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 z-10 rounded-2xl">
              <p className="text-xs font-bold text-slate-500">No traffic data recorded in this period.</p>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trafficChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF6A00" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B132B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0B132B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B132B',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              {chartMetric === 'visitors' && (
                <Area
                  type="monotone"
                  dataKey="visitors"
                  name="Visitors"
                  stroke="#FF6A00"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMain)"
                  dot={{ r: 3, fill: '#FF6A00', strokeWidth: 2, stroke: '#fff' }}
                />
              )}
              {chartMetric === 'pageViews' && (
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  name="Page Views"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSec)"
                  dot={{ r: 3, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                />
              )}
              {chartMetric === 'sessions' && (
                <Line
                  type="monotone"
                  dataKey="sessions"
                  name="Sessions"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                />
              )}
              {chartMetric === 'newVsReturning' && (
                <>
                  <Bar dataKey="newVisitors" name="New Visitors" fill="#FF6A00" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returningVisitors" name="Returning Visitors" fill="#0B132B" radius={[4, 4, 0, 0]} />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. LIVE VISITORS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Live Active Visitors</span>
              <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                {liveVisitors.length} Active (10m)
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any visitor row to inspect full anonymous journey, sessions, and device telemetry
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Visitor ID or page..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Visitor ID</th>
                <th className="py-3 px-3">Active Page</th>
                <th className="py-3 px-3">Device &amp; Browser</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredLiveVisitors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active visitors matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLiveVisitors.map((v: any) => (
                  <tr
                    key={v.visitorId}
                    onClick={() => handleOpenVisitorDetails(v.visitorId)}
                    className="hover:bg-orange-50/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 font-mono font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="text-[#FF6A00]">{v.visitorId}</span>
                      {v.userId && (
                        <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold px-1.5 py-0.2 rounded">
                          AUTH
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 max-w-[200px] truncate text-slate-700 dark:text-slate-300 font-mono">
                      {v.page}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        {v.deviceType === 'Mobile' ? (
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        ) : v.deviceType === 'Tablet' ? (
                          <Tablet className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <Monitor className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{v.deviceType}</span>
                        <span className="text-slate-400">· {v.browser}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {v.location}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {v.lastSeenAgo}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-extrabold text-[11px] text-emerald-600 dark:text-emerald-400">
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenVisitorDetails(v.visitorId)
                        }}
                        className="py-1 px-2.5 bg-slate-100 hover:bg-[#FF6A00] hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-[11px] transition-all cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MOST VISITED PAGES & 6. TRAFFIC SOURCES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Most Visited Pages (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Most Visited Pages &amp; Paths
          </h3>

          <div className="space-y-2">
            {mostVisitedPages.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No page view data available yet.</p>
            ) : (
              mostVisitedPages.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1 pr-3 space-y-0.5">
                    <div className="font-mono font-bold text-slate-900 dark:text-white truncate">
                      {item.page}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{item.title}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-slate-900 dark:text-white">
                      {item.views.toLocaleString()} views
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.uniqueVisitors} unique visitors
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Traffic Sources Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Traffic Acquisition &amp; Sources
          </h3>

          <div className="space-y-3">
            {trafficSources.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No acquisition source data available.</p>
            ) : (
              trafficSources.map((src: any) => (
                <div key={src.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-slate-800 dark:text-slate-200">{src.source}</span>
                    <span className="font-mono text-slate-500">
                      {src.count} ({src.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#FF6A00] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, src.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 7. DEVICE, OS, BROWSER & GEOGRAPHIC BREAKDOWN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Devices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>Devices</span>
            <Smartphone className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="space-y-2">
            {deviceDist.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                <span className="font-mono text-slate-500">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Operating Systems */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>Operating Systems</span>
            <Monitor className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="space-y-2">
            {osDist.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                <span className="font-mono text-slate-500">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Browsers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>Browsers</span>
            <Globe className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="space-y-2">
            {browserDist.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                <span className="font-mono text-slate-500">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Locations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>Locations</span>
            <Compass className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="space-y-2">
            {locationDist.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{item.name}</span>
                <span className="font-mono text-slate-500 shrink-0">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. VISITOR DETAILS DRAWER/MODAL */}
      {selectedVisitorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-xl h-full p-6 shadow-2xl overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#FF6A00] flex items-center justify-center font-black">
                  VIS
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
                    <span>{selectedVisitorId}</span>
                  </h3>
                  <p className="text-xs text-slate-400">Anonymous Visitor Journey &amp; Telemetry</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedVisitorId(null)
                  setVisitorDetails(null)
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetails || !visitorDetails ? (
              <div className="py-20 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FF6A00]" />
                <p>Loading visitor telemetry...</p>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Visitor Details Overview Grid */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">First Visit</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {new Date(visitorDetails.visitor.firstSeenAt).toLocaleString('en-GB')}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Last Visit</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {new Date(visitorDetails.visitor.lastSeenAt).toLocaleString('en-GB')}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Total Visits</span>
                    <div className="font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                      {visitorDetails.visitor.visitCount} visits
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Total Duration</span>
                    <div className="font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                      {visitorDetails.visitor.totalDurationLabel}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Device Type</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {visitorDetails.visitor.deviceType}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Browser / OS</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {visitorDetails.visitor.browser} / {visitorDetails.visitor.operatingSystem}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Location</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {visitorDetails.visitor.city
                        ? `${visitorDetails.visitor.country} (${visitorDetails.visitor.city})`
                        : visitorDetails.visitor.country}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Referrer Source</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {visitorDetails.visitor.referrerSource}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Entry Page</span>
                    <div className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {visitorDetails.visitor.entryPage}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Exit Page</span>
                    <div className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {visitorDetails.visitor.exitPage}
                    </div>
                  </div>
                </div>

                {/* UTM Campaign Information (if present) */}
                {(visitorDetails.visitor.utmSource || visitorDetails.visitor.utmCampaign) && (
                  <div className="p-3.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black uppercase text-[#FF6A00] tracking-wider">
                      UTM Campaign Attribution
                    </span>
                    <div className="flex gap-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>Source: {visitorDetails.visitor.utmSource || 'N/A'}</span>
                      <span>Medium: {visitorDetails.visitor.utmMedium || 'N/A'}</span>
                      <span>Campaign: {visitorDetails.visitor.utmCampaign || 'N/A'}</span>
                    </div>
                  </div>
                )}

                {/* Session Timeline */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    Recent Sessions ({visitorDetails.sessions.length})
                  </h4>

                  <div className="space-y-3">
                    {visitorDetails.sessions.map((sess: any, idx: number) => (
                      <div
                        key={sess.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-800 dark:text-slate-200 font-mono">
                            Session #{visitorDetails.sessions.length - idx}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Duration: {sess.durationLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Started: {new Date(sess.startedAt).toLocaleString('en-GB')}
                        </div>

                        {/* Pages Viewed inside session */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1">
                          <div className="text-[10px] font-extrabold uppercase text-slate-400">
                            Pages Viewed ({sess.pagesViewed.length})
                          </div>
                          {sess.pagesViewed.map((pv: any, pidx: number) => (
                            <div
                              key={pidx}
                              className="flex items-center justify-between text-[11px] font-mono text-slate-700 dark:text-slate-300"
                            >
                              <span className="truncate">{pv.page}</span>
                              <span className="text-slate-400 shrink-0 text-[10px]">
                                {new Date(pv.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
