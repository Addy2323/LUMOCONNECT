'use client'

import React, { useState } from 'react'
import {
  Home,
  Search,
  Briefcase,
  Users,
  TrendingUp,
  Wallet,
  Bell,
  ShoppingBag,
  GraduationCap,
  CreditCard,
  Shield,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Calendar,
  ArrowRight,
  Sun,
  Smartphone,
  Package,
  CheckCircle2,
  Lock,
  Sparkles,
  ExternalLink,
  Target,
  Coins,
  DollarSign,
  Share2,
  FileText,
  BarChart3,
  Award,
  Menu,
  X,
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
import { AccountSubscriptionSection } from '@/components/subscriptions/AccountSubscriptionSection'

interface PartnerDashboardViewProps {
  partnerName?: string
  onOpenStatement?: () => void
  onExploreDeals?: () => void
  onNavigateToSubscriptions?: () => void
  onSelectOpportunity?: (dealId: string) => void
}

const PERFORMANCE_DATA_7D = [
  { date: '16 May', value: 20 },
  { date: '17 May', value: 32 },
  { date: '18 May', value: 51 },
  { date: '19 May', value: 78 },
  { date: '20 May', value: 58 },
  { date: '21 May', value: 43 },
  { date: '22 May', value: 68 },
]

const PERFORMANCE_DATA_30D = [
  { date: 'W1', value: 120 },
  { date: 'W2', value: 185 },
  { date: 'W3', value: 240 },
  { date: 'W4', value: 310 },
]

const PERFORMANCE_DATA_6M = [
  { date: 'Mar', value: 420 },
  { date: 'Apr', value: 590 },
  { date: 'May', value: 730 },
  { date: 'Jun', value: 890 },
  { date: 'Jul', value: 1120 },
  { date: 'Aug', value: 1350 },
]

export function PartnerDashboardView({
  partnerName = 'Amina',
  onOpenStatement,
  onExploreDeals,
  onNavigateToSubscriptions,
  onSelectOpportunity,
}: PartnerDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'discover' | 'my_deals' | 'leads' | 'performance' | 'earnings' | 'notifications' | 'toolkit' | 'training' | 'subscription' | 'settings' | 'help'>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '6M'>('7D')

  const chartData =
    timeRange === '7D'
      ? PERFORMANCE_DATA_7D
      : timeRange === '30D'
      ? PERFORMANCE_DATA_30D
      : PERFORMANCE_DATA_6M

  const mobileNavPills = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'my_deals', label: 'My Deals (3)', icon: Briefcase },
    { id: 'leads', label: 'Leads (18)', icon: Users },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'toolkit', label: 'Toolkit', icon: ShoppingBag },
    { id: 'training', label: 'Training', icon: GraduationCap },
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
            PARTNER PORTAL
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
              onClick={() => {
                setActiveTab('discover')
                onExploreDeals?.()
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'discover'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Discover Opportunities</span>}
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
                {!sidebarCollapsed && <span>My Deals</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FF6A00] font-black text-[10px] flex items-center justify-center">
                  3
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'leads'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Leads & Referrals</span>}
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
                {!sidebarCollapsed && <span>Performance</span>}
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('earnings')
                onOpenStatement?.()
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'earnings'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Earnings & Payouts</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Notifications</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FF6A00] font-black text-[10px] flex items-center justify-center">
                  2
                </span>
              )}
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
              onClick={() => setActiveTab('toolkit')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'toolkit'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Sales Toolkit</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('training')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'training'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Training Center</span>}
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
              onClick={() => setActiveTab('subscription')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'subscription'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Subscription</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'settings'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 shrink-0" />
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

        {/* Bottom Subscription Card */}
        {!sidebarCollapsed && (
          <div className="p-3.5 rounded-2xl bg-orange-50/50 dark:bg-slate-800/60 border border-orange-200/60 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                Semi-Annual Plan
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              124 days remaining
            </div>
            <button
              onClick={() => {
                setActiveTab('subscription')
                onNavigateToSubscriptions?.()
              }}
              className="w-full py-1.5 bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-900/60 hover:border-[#FF6A00] text-[#FF6A00] text-xs font-bold rounded-xl transition-colors shadow-2xs text-center"
            >
              Manage Plan
            </button>
          </div>
        )}

        {/* User Profile Pill */}
        {!sidebarCollapsed && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0B132B] text-white text-xs font-black flex items-center justify-center shadow-xs">
                AM
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                  {partnerName} M.
                </div>
                <div className="text-[10px] text-emerald-600 font-bold">
                  Verified Partner
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
                  if (pill.id === 'overview' || pill.id === 'my_deals' || pill.id === 'leads' || pill.id === 'performance' || pill.id === 'earnings' || pill.id === 'subscription' || pill.id === 'toolkit' || pill.id === 'training') {
                    setActiveTab(pill.id)
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-2xs shrink-0 ${
                  isActive
                    ? 'bg-[#FF6A00] text-white shadow-xs'
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
            {activeTab === 'overview' && 'Partner Overview'}
            {activeTab === 'my_deals' && 'My Enrolled Deals'}
            {activeTab === 'leads' && 'Leads & Referral Tracking'}
            {activeTab === 'performance' && 'Performance Analytics'}
            {activeTab === 'earnings' && 'Earnings & Direct Payouts'}
            {activeTab === 'notifications' && 'Partner Notifications'}
            {activeTab === 'toolkit' && 'Sales & Marketing Toolkit'}
            {activeTab === 'training' && 'LUMO Partner Academy'}
            {activeTab === 'subscription' && 'Subscription & Deal Access'}
            {activeTab === 'settings' && 'Account & Security Settings'}
            {activeTab === 'help' && 'Partner Help & Support'}
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
              onClick={() => setActiveTab('notifications')}
              className="relative p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#FF6A00] text-white font-bold text-[9px] flex items-center justify-center">
                2
              </span>
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline-block">Active Member</span>
              <span className="sm:hidden text-emerald-600">Active</span>
            </div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Welcome Greeting */}
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
                Welcome back, {partnerName}
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-0.5">
                Track your opportunities, performance and earnings.
              </p>
            </div>

            {/* 4 Top KPI Metric Cards (2x2 Grid on Mobile, 4 Cols on XL Desktop) */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
              {/* CARD 1: Active Deals */}
              <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                      Active Deals
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                      3
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
                  <span>View all deals</span>
                  <span>→</span>
                </button>
              </div>

              {/* CARD 2: Qualified Leads */}
              <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                      Qualified Leads
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                      18
                    </div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('leads')}
                  className="text-[11px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 text-left"
                >
                  <span>View leads</span>
                  <span>→</span>
                </button>
              </div>

              {/* CARD 3: Conversions */}
              <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                      Conversions
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                      7
                    </div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('performance')}
                  className="text-[11px] sm:text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-left"
                >
                  <span>View conversions</span>
                  <span>→</span>
                </button>
              </div>

              {/* CARD 4: Available Earnings */}
              <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4 col-span-2 sm:col-span-1">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                      Available Earnings
                    </span>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F172A] dark:text-white font-mono">
                      TZS 485,000
                    </div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('earnings')
                    onOpenStatement?.()
                  }}
                  className="text-[11px] sm:text-xs font-bold text-[#FF6A00] hover:text-[#EA580C] flex items-center gap-1 text-left"
                >
                  <span>View earnings</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Middle Section: Performance Overview & Next Payout Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
              {/* Left Card: Performance Overview (8 Cols) */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex flex-row items-center justify-between gap-2 mb-4 sm:mb-6">
                    <h3 className="text-sm sm:text-lg font-extrabold text-[#0F172A] dark:text-white">
                      Performance Overview
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
                          <linearGradient id="colorPerfMobile" x1="0" y1="0" x2="0" y2="1">
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
                          name="Opportunities Engaged"
                          stroke="#FF6A00"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorPerfMobile)"
                          dot={{ r: 3, fill: '#FF6A00', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 5, fill: '#FF6A00' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00]" />
                  <span>Opportunities Engaged</span>
                </div>
              </div>

              {/* Right Card: Next Payout (4 Cols) */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between text-center">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white text-left">
                    Next Payout
                  </h3>

                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
                    <Calendar className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>

                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white font-mono">
                      TZS 285,000
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                      28 Aug 2026
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Estimated payout date
                    </div>
                  </div>
                </div>

                <div className="pt-4 sm:pt-6">
                  <button
                    onClick={() => {
                      setActiveTab('earnings')
                      onOpenStatement?.()
                    }}
                    className="w-full py-3 px-4 rounded-xl border border-orange-300 dark:border-orange-800 hover:border-[#FF6A00] text-[#FF6A00] font-extrabold text-xs transition-colors shadow-2xs hover:bg-orange-50/50"
                  >
                    View Payouts
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Section: Recommended Opportunities */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
                  Recommended Opportunities
                </h3>
                <button
                  onClick={() => onExploreDeals?.()}
                  className="text-xs font-bold text-[#FF6A00] hover:text-[#EA580C] flex items-center gap-1"
                >
                  <span>View all opportunities</span>
                  <span>→</span>
                </button>
              </div>

              {/* 3 Recommended Opportunity Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {/* 1. Kijani Solar Tech */}
                <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-[#0F172A] dark:text-white">
                          Kijani Solar Tech
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Renewable Energy
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Solar installation solutions for homes and businesses.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        Reward
                      </div>
                      <div className="text-xs sm:text-sm font-black text-emerald-600 font-mono">
                        TZS 150,000
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectOpportunity?.('opp_kijani_solar')}
                      className="py-1.5 px-3 rounded-xl border border-orange-300 dark:border-orange-800 text-[#FF6A00] hover:bg-orange-50 font-bold text-xs transition-colors"
                    >
                      View Deal
                    </button>
                  </div>
                </div>

                {/* 2. MobiPay Africa */}
                <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-[#0F172A] dark:text-white">
                          MobiPay Africa
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Fintech
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Mobile payment and collections platform for SMEs.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        Reward
                      </div>
                      <div className="text-xs sm:text-sm font-black text-indigo-600 font-mono">
                        TZS 120,000
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectOpportunity?.('opp_mobipay_merchants')}
                      className="py-1.5 px-3 rounded-xl border border-orange-300 dark:border-orange-800 text-[#FF6A00] hover:bg-orange-50 font-bold text-xs transition-colors"
                    >
                      View Deal
                    </button>
                  </div>
                </div>

                {/* 3. SafariBox Serengeti */}
                <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-[#0F172A] dark:text-white">
                          SafariBox Serengeti
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          E-commerce
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Curated safari gear and travel essentials.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        Reward
                      </div>
                      <div className="text-xs sm:text-sm font-black text-amber-600 font-mono">
                        TZS 95,000
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectOpportunity?.('opp_safaribox_travel')}
                      className="py-1.5 px-3 rounded-xl border border-orange-300 dark:border-orange-800 text-[#FF6A00] hover:bg-orange-50 font-bold text-xs transition-colors"
                    >
                      View Deal
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Plan Status Card */}
            <div className="lg:hidden p-4 rounded-3xl bg-orange-50/60 dark:bg-slate-800/80 border border-orange-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">Semi-Annual Plan</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-md">Active</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">124 days remaining</div>
              </div>
              <button
                onClick={() => {
                  setActiveTab('subscription')
                  onNavigateToSubscriptions?.()
                }}
                className="py-1.5 px-3 bg-white dark:bg-slate-900 border border-orange-300 text-[#FF6A00] text-xs font-bold rounded-xl"
              >
                Manage
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MY DEALS */}
        {activeTab === 'my_deals' && (
          <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              My Active Deal Enrollments (3)
            </h2>
            <div className="space-y-3">
              {[
                { name: 'Kijani Solar Home Systems', code: 'LUMO-KS-AMINA', reward: 'TZS 45,000/install', leads: 8, status: 'Active' },
                { name: 'MobiPay SME Merchant Onboarding', code: 'LUMO-MP-AMINA', reward: 'TZS 25,000/merchant', leads: 12, status: 'Active' },
                { name: 'SafariBox Serengeti Campaign', code: 'LUMO-SB-AMINA', reward: 'TZS 450,000 + 8%', leads: 4, status: 'Active' },
              ].map((d, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-slate-900 dark:text-white text-sm">{d.name}</strong>
                    <div className="text-slate-500 font-mono mt-0.5 truncate max-w-xs sm:max-w-md">Tracking Link: https://lumo.co.tz/d/ref?c={d.code}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-[#FF6A00]">{d.reward}</span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LEADS & REFERRALS */}
        {activeTab === 'leads' && (
          <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Qualified Leads & Referrals (18)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[500px]">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Customer / Business</th>
                    <th className="p-3">Deal</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Reward Value</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-3 font-bold">Kassim Hardware Store</td>
                    <td className="p-3">MobiPay Africa</td>
                    <td className="p-3"><span className="text-emerald-600 font-bold">✓ Verified</span></td>
                    <td className="p-3 font-mono font-bold text-[#FF6A00]">TZS 25,000</td>
                    <td className="p-3 text-slate-400">22 Aug 2026</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">Mussa Residential Solar</td>
                    <td className="p-3">Kijani Solar Tech</td>
                    <td className="p-3"><span className="text-blue-600 font-bold">⏳ Under Inspection</span></td>
                    <td className="p-3 font-mono font-bold text-[#FF6A00]">TZS 45,000</td>
                    <td className="p-3 text-slate-400">21 Aug 2026</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">Zanzibar Sunset Lodge Booking</td>
                    <td className="p-3">SafariBox Serengeti</td>
                    <td className="p-3"><span className="text-emerald-600 font-bold">✓ Completed</span></td>
                    <td className="p-3 font-mono font-bold text-[#FF6A00]">TZS 180,000</td>
                    <td className="p-3 text-slate-400">19 Aug 2026</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SUBSCRIPTION */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <AccountSubscriptionSection
              userId="alex_partner"
              onUpgrade={() => onNavigateToSubscriptions?.()}
              onRenew={() => onNavigateToSubscriptions?.()}
            />
          </div>
        )}

        {/* TAB 5: SALES TOOLKIT */}
        {activeTab === 'toolkit' && (
          <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Partner Sales & Marketing Toolkit
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Digital Media Packs</h4>
                <p className="text-xs text-slate-500">Download high-res brand logos, promo banners, and WhatsApp status videos.</p>
                <button className="py-2 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold">Download Assets (.ZIP)</button>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">QR Code & NFC Cards</h4>
                <p className="text-xs text-slate-500">Generate printable flyer QR codes for direct offline customer acquisition.</p>
                <button className="py-2 px-4 bg-[#FF6A00] text-white rounded-xl text-xs font-bold">Generate QR Codes</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: TRAINING CENTER */}
        {activeTab === 'training' && (
          <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              LUMO Partner Academy
            </h2>
            <div className="space-y-3">
              {[
                { title: 'Module 1: How to Pitch Solar Home Systems to Peri-Urban Cooperatives', time: '15 min read', status: 'Completed' },
                { title: 'Module 2: Merchant QR Onboarding & Transaction Validation', time: '20 min read', status: 'In Progress' },
                { title: 'Module 3: High-Converting Social Video Frameworks for Tourism Campaigns', time: '12 min video', status: 'Not Started' },
              ].map((m, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-slate-900 dark:text-white">{m.title}</strong>
                    <div className="text-slate-400 mt-0.5">{m.time}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-orange-100 text-[#FF6A00] font-bold">{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS & SECURITY */}
        {activeTab === 'settings' && (
          <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6 text-xs">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Settings & Security</h2>
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Partner Full Name</label>
                <input type="text" defaultValue="Amina Mushi" className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Registered Phone / M-Pesa Payout Number</label>
                <input type="text" defaultValue="+255 712 345 678" className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 font-mono" />
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="text-emerald-900 dark:text-emerald-300">Identity Verified</strong>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400">NIDA Verification #9842-1092-3841 approved.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: HELP & SUPPORT */}
        {activeTab === 'help' && (
          <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6 text-xs">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Partner Help & Support</h2>
            <p className="text-slate-600 dark:text-slate-300">Need help with tracking links, deal milestones, or mobile money payouts?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border rounded-2xl space-y-1">
                <strong className="text-slate-900 dark:text-white">WhatsApp Partner Desk</strong>
                <div className="text-slate-500">+255 655 000 111 (Mon-Sat, 8am-8pm)</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border rounded-2xl space-y-1">
                <strong className="text-slate-900 dark:text-white">Partner Support Email</strong>
                <div className="text-slate-500">partners@lumo.co.tz</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
