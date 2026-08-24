'use client'

import React, { useState } from 'react'
import {
  Home,
  PlusCircle,
  Briefcase,
  Users,
  TrendingUp,
  Target,
  Award,
  Wallet,
  Megaphone,
  BarChart3,
  Building2,
  Shield,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ArrowRight,
  FileText,
  DollarSign,
  Download,
  AlertTriangle,
  Sparkles,
  ExternalLink,
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
import { BrandMark } from '@/components/shared/BrandMark'

interface BusinessDashboardViewProps {
  businessName?: string
  onCreateDeal?: () => void
  onExploreDeals?: () => void
}

const PERFORMANCE_DATA_7D = [
  { date: '16 May', value: 20 },
  { date: '17 May', value: 32 },
  { date: '18 May', value: 52 },
  { date: '19 May', value: 78 },
  { date: '20 May', value: 58 },
  { date: '21 May', value: 43 },
  { date: '22 May', value: 68 },
]

const PERFORMANCE_DATA_30D = [
  { date: 'W1', value: 140 },
  { date: 'W2', value: 210 },
  { date: 'W3', value: 310 },
  { date: 'W4', value: 450 },
]

const PERFORMANCE_DATA_6M = [
  { date: 'Mar', value: 520 },
  { date: 'Apr', value: 780 },
  { date: 'May', value: 1040 },
  { date: 'Jun', value: 1390 },
  { date: 'Jul', value: 1820 },
  { date: 'Aug', value: 2450 },
]

export function BusinessDashboardView({
  businessName = 'Kijani Solar Tech',
  onCreateDeal,
  onExploreDeals,
}: BusinessDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'my_deals' | 'partners' | 'performance' | 'conversions' | 'wallet' | 'campaigns' | 'profile' | 'settings' | 'help'>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '6M'>('7D')
  const [showFundModal, setShowFundModal] = useState(false)
  const [walletBalance, setWalletBalance] = useState(3250000)

  const chartData =
    timeRange === '7D'
      ? PERFORMANCE_DATA_7D
      : timeRange === '30D'
      ? PERFORMANCE_DATA_30D
      : PERFORMANCE_DATA_6M

  const mobileNavPills = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'create', label: '+ Create Opportunity', icon: PlusCircle, isAction: true },
    { id: 'my_deals', label: 'My Opportunities (4)', icon: Briefcase },
    { id: 'partners', label: 'Partners (142)', icon: Users },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'wallet', label: 'Rewards Wallet', icon: Wallet },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'profile', label: 'Profile', icon: Building2 },
  ] as const

  return (
    <div className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] min-h-[calc(100vh-80px)] text-[#0F172A] dark:text-slate-100 flex flex-col lg:flex-row gap-6 items-start pb-20 md:pb-16">
      {/* ========================================================================= */}
      {/* DESKTOP LEFT SIDEBAR (hidden on mobile, visible lg:block)                 */}
      {/* ========================================================================= */}
      <aside
        className={`hidden lg:block ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 shrink-0 shadow-xs transition-all duration-200 space-y-6 sticky top-24`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <BrandMark size={28} />
              <div>
                <div className="font-black text-lg text-[#0F172A] dark:text-white leading-none">
                  LUMO
                </div>
                <div className="text-[10px] text-[#64748B] dark:text-slate-400 font-medium">
                  Deals & Opportunities
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors mx-auto"
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Portal Pill */}
        {!sidebarCollapsed && (
          <div className="w-full py-2 px-3 bg-[#0B132B] dark:bg-[#070D1E] text-white text-center rounded-xl text-xs font-black tracking-wider uppercase shadow-xs">
            BUSINESS PORTAL
          </div>
        )}

        {/* Navigation Groups */}
        <div className="space-y-5 text-xs">
          {/* GROUP 1: WORKSPACE */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                WORKSPACE
              </div>
            )}
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] border-l-4 border-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Overview</span>}
              </div>
            </button>

            <button
              onClick={onCreateDeal}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-[#FF6A00] hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <PlusCircle className="w-4 h-4 shrink-0 text-[#FF6A00]" />
                {!sidebarCollapsed && <span>Create Opportunity</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('my_deals')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'my_deals'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>My Opportunities</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FF6A00] font-black text-[10px] flex items-center justify-center">
                  4
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('partners')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'partners'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Partners & Applications</span>}
              </div>
            </button>
          </div>

          {/* GROUP 2: PERFORMANCE */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                PERFORMANCE
              </div>
            )}
            <button
              onClick={() => setActiveTab('performance')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'performance'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Deal Performance</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('conversions')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'conversions'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Conversions & Results</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('conversions')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Rewards & Commissions</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'wallet'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Payments & Funding</span>}
              </div>
            </button>
          </div>

          {/* GROUP 3: GROW */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                GROW
              </div>
            )}
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'campaigns'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Megaphone className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Campaigns</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('partners')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Audience Insights</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('performance')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Reports & Exports</span>}
              </div>
            </button>
          </div>

          {/* GROUP 4: ACCOUNT */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                ACCOUNT
              </div>
            )}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'profile'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Business Profile</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Team & Access</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Settings & Security</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('help')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'help'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Help & Support</span>}
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Verified Business Card */}
        {!sidebarCollapsed && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Business</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-black flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              TIN & BRELA verified
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              className="w-full py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl transition-colors shadow-2xs text-center"
            >
              View Profile
            </button>
          </div>
        )}

        {/* User Profile Pill */}
        {!sidebarCollapsed && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0B132B] text-[#FF6A00] text-xs font-black flex items-center justify-center shadow-xs">
                KS
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                  {businessName}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Business Admin
                </div>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* ========================================================================= */}
      {/* MAIN DASHBOARD CONTENT AREA                                               */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full space-y-5 sm:space-y-6">
        {/* MOBILE HORIZONTAL PILLS SCROLLER (VISIBLE ONLY ON MOBILE <lg) */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          {mobileNavPills.map((pill) => {
            const Icon = pill.icon
            const isActive = activeTab === pill.id
            return (
              <button
                key={pill.id}
                onClick={() => {
                  if ('isAction' in pill && pill.isAction) {
                    onCreateDeal?.()
                  } else {
                    setActiveTab(pill.id as any)
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-2xs shrink-0 ${
                  'isAction' in pill && pill.isAction
                    ? 'bg-[#FF6A00] text-white shadow-xs'
                    : isActive
                    ? 'bg-[#0B132B] text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{pill.label}</span>
              </button>
            )
          })}
        </div>

        {/* Top Header Bar */}
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 flex items-center justify-between shadow-2xs">
          <h1 className="text-base sm:text-xl font-black text-[#0F172A] dark:text-white truncate">
            {activeTab === 'overview' && 'Business Overview'}
            {activeTab === 'my_deals' && 'Published Opportunities'}
            {activeTab === 'partners' && 'Partner Network & Review Queue'}
            {activeTab === 'performance' && 'Commercial Performance Analytics'}
            {activeTab === 'conversions' && 'Verified Conversions & Evidence'}
            {activeTab === 'wallet' && 'Rewards Escrow Wallet & Funding'}
            {activeTab === 'campaigns' && 'Promotional Growth Campaigns'}
            {activeTab === 'profile' && 'Corporate & Verification Profile'}
            {activeTab === 'settings' && 'Enterprise Access Settings'}
            {activeTab === 'help' && 'Business Support Desk'}
          </h1>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              onClick={() => onExploreDeals?.()}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('partners')}
              className="relative p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#FF6A00] text-white font-bold text-[9px] flex items-center justify-center">
                3
              </span>
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline-block">Verified Business</span>
              <span className="sm:hidden text-emerald-600">Verified</span>
            </div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW (Exact Screenshot Implementation) */}
        {activeTab === 'overview' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Welcome Greeting & Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
                  Welcome back, {businessName}
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-0.5">
                  Create opportunities, manage partners and track verified commercial results.
                </p>
              </div>

              <button
                type="button"
                onClick={onCreateDeal}
                className="py-3 px-5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 self-start sm:self-auto active:scale-[0.99]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Opportunity</span>
              </button>
            </div>

            {/* 4 Top KPI Metric Cards (2x2 Grid on Mobile, 4 Cols on XL Desktop) */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
              {/* CARD 1: Live Opportunities */}
              <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                      Live Opportunities
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                      4
                    </div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('my_deals')}
                  className="text-[11px] sm:text-xs font-bold text-[#FF6A00] hover:text-[#EA580C] flex items-center gap-1 text-left"
                >
                  <span>View all opportunities</span>
                  <span>→</span>
                </button>
              </div>

              {/* CARD 2: Active Partners */}
              <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                      Active Partners
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                      142
                    </div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('partners')}
                  className="text-[11px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 text-left"
                >
                  <span>View partners</span>
                  <span>→</span>
                </button>
              </div>

              {/* CARD 3: Verified Conversions */}
              <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                      Verified Conversions
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                      87
                    </div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('conversions')}
                  className="text-[11px] sm:text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-left"
                >
                  <span>View results</span>
                  <span>→</span>
                </button>
              </div>

              {/* CARD 4: Reward Budget */}
              <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4 col-span-2 sm:col-span-1">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                      Reward Budget
                    </span>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F172A] dark:text-white font-mono">
                      TZS 7.5M
                    </div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className="text-[11px] sm:text-xs font-bold text-[#FF6A00] hover:text-[#EA580C] flex items-center gap-1 text-left"
                >
                  <span>Manage budget</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Middle Section: Opportunity Performance & Rewards Wallet */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
              {/* Left Card: Opportunity Performance (8 Cols) */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex flex-row items-center justify-between gap-2 mb-4 sm:mb-6">
                    <h3 className="text-sm sm:text-lg font-extrabold text-[#0F172A] dark:text-white">
                      Opportunity Performance
                    </h3>

                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl text-[10px] sm:text-xs">
                      {(['7D', '30D', '6M'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setTimeRange(r)}
                          className={`px-2 sm:px-3 py-1 rounded-lg font-bold transition-colors ${
                            timeRange === r
                              ? 'bg-white dark:bg-slate-900 text-[#FF6A00] shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          {r === '7D' ? '7 Days' : r === '30D' ? '30 Days' : '6 Months'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line/Area Chart */}
                  <div className="h-48 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorBizPerf" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#FF6A00" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
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
                          type="monotone"
                          dataKey="value"
                          name="Verified Results"
                          stroke="#FF6A00"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorBizPerf)"
                          dot={{ r: 3, fill: '#FF6A00', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 5, fill: '#FF6A00' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00]" />
                  <span>Verified Results</span>
                </div>
              </div>

              {/* Right Card: Rewards Wallet (4 Cols) */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between text-center">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white text-left">
                    Rewards Wallet
                  </h3>

                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
                    <Wallet className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>

                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white font-mono">
                      TZS {walletBalance.toLocaleString()}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                      Available balance
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      TZS 810,000 committed
                    </div>
                  </div>
                </div>

                <div className="pt-4 sm:pt-6">
                  <button
                    onClick={() => setShowFundModal(true)}
                    className="w-full py-3 px-4 rounded-xl border border-orange-300 dark:border-orange-800 hover:border-[#FF6A00] text-[#FF6A00] font-extrabold text-xs transition-colors shadow-2xs hover:bg-orange-50/50"
                  >
                    Fund Wallet
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Section: Live Opportunities & Recent Partner Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
              {/* Left Column: Live Opportunities Table (8 Cols) */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] dark:text-white">
                    Live Opportunities
                  </h3>
                  <button
                    onClick={() => setActiveTab('my_deals')}
                    className="text-xs font-bold text-[#FF6A00] hover:text-[#EA580C] flex items-center gap-1"
                  >
                    <span>View all opportunities</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[550px]">
                    <thead className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="pb-3 font-extrabold">Opportunity</th>
                        <th className="pb-3 font-extrabold">Status</th>
                        <th className="pb-3 font-extrabold">Partners</th>
                        <th className="pb-3 font-extrabold">Conversions</th>
                        <th className="pb-3 font-extrabold">Reward per Result</th>
                        <th className="pb-3 font-extrabold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      <tr>
                        <td className="py-3.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <strong className="text-slate-900 dark:text-white font-bold">
                            Power the Next 1,000 Homes
                          </strong>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md font-bold text-[10px]">
                            Live
                          </span>
                        </td>
                        <td className="py-3.5 font-bold">42</td>
                        <td className="py-3.5 font-bold">18</td>
                        <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">TZS 45,000</td>
                        <td className="py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setActiveTab('my_deals')}
                              className="px-2.5 py-1 border rounded-lg text-slate-700 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-50"
                            >
                              Manage
                            </button>
                            <button className="text-slate-400 hover:text-slate-600">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-3.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <strong className="text-slate-900 dark:text-white font-bold">
                            Solar Installer Referral Program
                          </strong>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md font-bold text-[10px]">
                            Live
                          </span>
                        </td>
                        <td className="py-3.5 font-bold">67</td>
                        <td className="py-3.5 font-bold">51</td>
                        <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">TZS 25,000</td>
                        <td className="py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setActiveTab('my_deals')}
                              className="px-2.5 py-1 border rounded-lg text-slate-700 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-50"
                            >
                              Manage
                            </button>
                            <button className="text-slate-400 hover:text-slate-600">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-3.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <strong className="text-slate-900 dark:text-white font-bold">
                            Regional Distributor Search
                          </strong>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-md font-bold text-[10px]">
                            Review
                          </span>
                        </td>
                        <td className="py-3.5 font-bold">33</td>
                        <td className="py-3.5 font-bold">18</td>
                        <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">TZS 150,000</td>
                        <td className="py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setActiveTab('my_deals')}
                              className="px-2.5 py-1 border rounded-lg text-slate-700 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-50"
                            >
                              Manage
                            </button>
                            <button className="text-slate-400 hover:text-slate-600">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 text-[11px] text-slate-400">
                  Showing 1 to 3 of 3 opportunities
                </div>
              </div>

              {/* Right Column: Recent Partner Activity (4 Cols) */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white">
                  Recent Partner Activity
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white leading-tight">
                        <strong>Amina</strong> submitted a verified lead
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Power the Next 1,000 Homes
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">15 minutes ago</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white leading-tight">
                        <strong>Juma</strong> joined Solar Installer Program
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Solar Installer Referral Program
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">2 hours ago</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white leading-tight">
                        <strong>Reward milestone approved</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Kijani Energy Solutions · TZS 180,000
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">5 hours ago</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab('partners')}
                    className="text-xs font-bold text-[#FF6A00] hover:text-[#EA580C] flex items-center gap-1"
                  >
                    <span>View all activity</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY OPPORTUNITIES */}
        {activeTab === 'my_deals' && (
          <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Manage Commercial Opportunities (4)
              </h2>
              <button
                onClick={onCreateDeal}
                className="py-2 px-4 bg-[#FF6A00] text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New</span>
              </button>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Power the Next 1,000 Homes in Rural Tanzania', budget: 'TZS 4.5M', spent: 'TZS 1.24M', partners: 42, reward: 'TZS 45,000/install', status: 'Live' },
                { title: 'Solar Installer Referral Program', budget: 'TZS 2.0M', spent: 'TZS 750,000', partners: 67, reward: 'TZS 25,000/technician', status: 'Live' },
                { title: 'Regional Wholesale Distributor Search', budget: 'TZS 1.0M', spent: 'TZS 300,000', partners: 33, reward: 'TZS 150,000/distributor', status: 'In Review' },
              ].map((d, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-slate-900 dark:text-white text-sm">{d.title}</strong>
                    <div className="text-slate-500 mt-0.5">Budget: {d.budget} · Spent: {d.spent} · Reward: {d.reward}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{d.partners} Partners</span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">{d.status}</span>
                    <button className="py-1.5 px-3 border rounded-xl font-bold bg-white dark:bg-slate-900">Manage</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PARTNERS & APPLICATIONS */}
        {activeTab === 'partners' && (
          <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Partner Review & Approval Queue (142 Active)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[500px]">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Partner Name</th>
                    <th className="p-3">Deal</th>
                    <th className="p-3">Deliverable / Evidence</th>
                    <th className="p-3">Reward</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-3 font-bold">Alex Mushi</td>
                    <td className="p-3">Power the Next 1,000 Homes</td>
                    <td className="p-3 text-slate-500">Signed job card #881 & technician confirmation</td>
                    <td className="p-3 font-mono font-bold text-[#FF6A00]">TZS 45,000</td>
                    <td className="p-3 text-right">
                      <button className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold">Approve</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">Neema K.</td>
                    <td className="p-3">Solar Installer Referral Program</td>
                    <td className="p-3 text-slate-500">Arusha clinic installation photo & VFD receipt</td>
                    <td className="p-3 font-mono font-bold text-[#FF6A00]">TZS 25,000</td>
                    <td className="p-3 text-right">
                      <button className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold">Approve</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: WALLET & FUNDING */}
        {activeTab === 'wallet' && (
          <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Escrow Rewards Wallet & Settlement
            </h2>
            <div className="p-6 rounded-3xl bg-linear-to-br from-[#0B132B] to-slate-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-400 uppercase font-bold">Available Escrow Balance</div>
                <div className="text-3xl font-black font-mono mt-1 text-emerald-400">TZS {walletBalance.toLocaleString()}</div>
                <div className="text-xs text-slate-300 mt-1">Escrow held securely by LUMO Settlement Hub</div>
              </div>
              <button
                onClick={() => setShowFundModal(true)}
                className="py-3 px-6 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                + Fund Wallet via M-Pesa / Bank
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: BUSINESS PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6 text-xs">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Verified Enterprise Profile
            </h2>
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Company Trading Name</label>
                <input type="text" defaultValue="Kijani Solar Tech Ltd" className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">TIN Number</label>
                <input type="text" defaultValue="114-882-901" className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 font-mono" />
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="text-emerald-900 dark:text-emerald-300">BRELA Certificate of Incorporation Verified</strong>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400">Reg #148892-TZ · Verified on 14 Jan 2026.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FUND WALLET MODAL */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowFundModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Fund Escrow Wallet</h3>
            <p className="text-xs text-slate-500">Fund your verified commercial deals to automate instant partner payouts upon milestone approvals.</p>
            <div>
              <label className="block text-xs font-bold mb-1">Amount (TZS)</label>
              <input type="number" defaultValue={1000000} className="w-full p-2.5 text-sm border rounded-xl font-mono" />
            </div>
            <button
              onClick={() => {
                setWalletBalance((prev) => prev + 1000000)
                setShowFundModal(false)
              }}
              className="w-full py-3 bg-[#FF6A00] text-white font-bold rounded-xl text-xs"
            >
              Deposit TZS 1,000,000
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
