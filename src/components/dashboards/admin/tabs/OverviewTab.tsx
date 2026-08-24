'use client'

import React, { useState } from 'react'
import {
  Users,
  ShieldCheck,
  Briefcase,
  Wallet,
  Layers,
  ChevronRight,
  Flag,
  Award,
  Cloud,
  Database,
  Bell,
  MoreVertical,
  Download,
  Filter,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

import { useAdminToast } from '../AdminToast'

interface OverviewTabProps {
  adminName: string
  onOpenReviewQueue: (filter?: 'ALL' | 'VERIFICATIONS' | 'DEALS' | 'REWARDS' | 'FLAGGED') => void
  onNavigateTab: (tab: any) => void
}

const PERFORMANCE_30D = [
  { date: '23 Apr', txValue: 28, activeUsers: 2.4 },
  { date: '28 Apr', txValue: 38, activeUsers: 3.6 },
  { date: '3 May', txValue: 54, activeUsers: 4.8 },
  { date: '8 May', txValue: 68, activeUsers: 5.9 },
  { date: '13 May', txValue: 88, activeUsers: 7.8 },
  { date: '18 May', txValue: 82, activeUsers: 6.9 },
  { date: '23 May', txValue: 92, activeUsers: 8.2 },
]

const PERFORMANCE_6M = [
  { date: 'Mar', txValue: 35, activeUsers: 3.8 },
  { date: 'Apr', txValue: 52, activeUsers: 5.1 },
  { date: 'May', txValue: 74, activeUsers: 6.9 },
  { date: 'Jun', txValue: 88, activeUsers: 8.4 },
  { date: 'Jul', txValue: 110, activeUsers: 10.2 },
  { date: 'Aug', txValue: 128, activeUsers: 12.8 },
]

const PERFORMANCE_12M = [
  { date: 'Q1', txValue: 90, activeUsers: 4.2 },
  { date: 'Q2', txValue: 180, activeUsers: 7.6 },
  { date: 'Q3', txValue: 290, activeUsers: 10.5 },
  { date: 'Q4', txValue: 420, activeUsers: 12.8 },
]

export function OverviewTab({ adminName, onOpenReviewQueue, onNavigateTab }: OverviewTabProps) {
  const { showToast } = useAdminToast()
  const [timeRange, setTimeRange] = useState<'30D' | '6M' | '12M'>('30D')
  const [regionFilter, setRegionFilter] = useState('ALL')
  const [opportunityTypeFilter, setOpportunityTypeFilter] = useState('ALL')

  const chartData =
    timeRange === '30D'
      ? PERFORMANCE_30D
      : timeRange === '6M'
      ? PERFORMANCE_6M
      : PERFORMANCE_12M

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Greeting & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
            Good morning, {adminName}
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-0.5">
            Executive monitoring · Read-only operational oversight of LUMO performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              showToast(
                'success',
                'Platform Report Exported',
                'Executive summary (PDF/CSV) with 30-day KPIs and metrics generated.'
              )
            }
            className="py-2 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl shadow-2xs hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenReviewQueue('ALL')}
            className="py-2 px-4 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-[#FF6A00]" />
            <span>Open Review Queue (43)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Period:</span>
          </div>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="ALL">All Regions (Tanzania & East Africa)</option>
            <option value="DAR">Dar es Salaam / Coastal</option>
            <option value="ARU">Arusha & Kilimanjaro</option>
            <option value="MWZ">Mwanza & Lake Zone</option>
            <option value="DOD">Dodoma & Central</option>
          </select>

          <select
            value={opportunityTypeFilter}
            onChange={(e) => setOpportunityTypeFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="ALL">All Opportunity Types</option>
            <option value="CUSTOMER_ACQUISITION">Customer Acquisition</option>
            <option value="QUALIFIED_LEADS">Qualified Leads</option>
            <option value="DISTRIBUTOR_SEARCH">Distributor Search</option>
            <option value="BOUNTIES">Reverse-Sourcing Bounties</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-400">
          Last sync: Real-time PostgreSQL Read Replica
        </div>
      </div>

      {/* 4 Top KPI Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
        {/* CARD 1: Total Users */}
        <div
          onClick={() => onNavigateTab('users')}
          className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer hover:border-blue-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                Total Users
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                12,846
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>↑ 8.2%</span>
            <span className="text-slate-400 font-normal">vs last 30 days</span>
          </div>
        </div>

        {/* CARD 2: Verified Businesses */}
        <div
          onClick={() => onNavigateTab('verifications')}
          className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                Verified Businesses
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                326
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>↑ 5.6%</span>
            <span className="text-slate-400 font-normal">vs last 30 days</span>
          </div>
        </div>

        {/* CARD 3: Live Opportunities */}
        <div
          onClick={() => onNavigateTab('deals')}
          className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer hover:border-orange-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                Live Opportunities
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                184
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>↑ 12.4%</span>
            <span className="text-slate-400 font-normal">vs last 30 days</span>
          </div>
        </div>

        {/* CARD 4: Platform Revenue */}
        <div
          onClick={() => onNavigateTab('payments')}
          className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 col-span-2 sm:col-span-1 cursor-pointer hover:border-purple-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                Platform Revenue
              </span>
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F172A] dark:text-white font-mono">
                TZS 128.4M
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>↑ 14.7%</span>
            <span className="text-slate-400 font-normal">vs last 30 days</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart & Review Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left Card: Marketplace Performance Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-row items-center justify-between gap-2 mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white">
                Marketplace Transaction Volume & Active Users
              </h3>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl text-[10px] sm:text-xs">
                {(['30D', '6M', '12M'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      timeRange === r
                        ? 'bg-white dark:bg-slate-900 text-[#FF6A00] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {r === '30D' ? '30 Days' : r === '6M' ? '6 Months' : '12 Months'}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FF6A00" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `TZS ${v}M`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="txValue"
                    name="Transaction Value (TZS M)"
                    stroke="#FF6A00"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTx)"
                    dot={{ r: 3, fill: '#FF6A00', strokeWidth: 2, stroke: '#fff' }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="activeUsers"
                    name="Active Users (K)"
                    stroke="#0B132B"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#0B132B', strokeWidth: 2, stroke: '#fff' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00]" />
              <span>Gross Transaction Value (TZS)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B132B] dark:bg-slate-400" />
              <span>Active Monthly Users</span>
            </div>
          </div>
        </div>

        {/* Right Card: Review Queue Summary (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white">
                Review Queue Summary
              </h3>
              <span className="text-[10px] bg-orange-100 text-[#FF6A00] font-black px-2 py-0.5 rounded-full">
                43 Items
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onOpenReviewQueue('VERIFICATIONS')}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Business KYB Verifications
                    </div>
                    <div className="text-[10px] text-slate-400">BRELA, TIN & Directors</div>
                  </div>
                </div>
                <span className="font-black text-xs text-slate-800 dark:text-slate-200">18</span>
              </button>

              <button
                onClick={() => onOpenReviewQueue('DEALS')}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6A00] flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Deals Awaiting Checker Review
                    </div>
                    <div className="text-[10px] text-slate-400">Commercial & Escrow terms</div>
                  </div>
                </div>
                <span className="font-black text-xs text-slate-800 dark:text-slate-200">12</span>
              </button>

              <button
                onClick={() => onOpenReviewQueue('REWARDS')}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Payout Batch Approvals
                    </div>
                    <div className="text-[10px] text-slate-400">TRA 5% Withholding ready</div>
                  </div>
                </div>
                <span className="font-black text-xs text-slate-800 dark:text-slate-200">9</span>
              </button>

              <button
                onClick={() => onOpenReviewQueue('FLAGGED')}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Flag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Flagged Fraud Risk Cases
                    </div>
                    <div className="text-[10px] text-slate-400">Suspicious clicks & loops</div>
                  </div>
                </div>
                <span className="font-black text-xs text-red-600">4</span>
              </button>
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={() => onOpenReviewQueue('ALL')}
              className="w-full py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors text-center"
            >
              Process All Review Queues
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
