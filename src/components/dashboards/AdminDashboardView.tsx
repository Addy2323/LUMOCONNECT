'use client'

import React, { useState } from 'react'
import {
  Home,
  Users,
  ShieldCheck,
  Briefcase,
  CheckCircle,
  CreditCard,
  Wallet,
  Award,
  Calculator,
  UserCheck,
  AlertTriangle,
  MessageSquare,
  FileText,
  Bell,
  Megaphone,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  Layers,
  Cloud,
  Database,
  ArrowRight,
  Sparkles,
  Flag,
  Lock,
  X,
  ExternalLink,
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { BrandMark } from '@/components/shared/BrandMark'

interface AdminDashboardViewProps {
  adminName?: string
  onExploreDeals?: () => void
}

const MARKETPLACE_PERFORMANCE_30D = [
  { date: '23 Apr', txValue: 28, activeUsers: 2.4 },
  { date: '28 Apr', txValue: 38, activeUsers: 3.6 },
  { date: '3 May', txValue: 54, activeUsers: 4.8 },
  { date: '8 May', txValue: 68, activeUsers: 5.9 },
  { date: '13 May', txValue: 88, activeUsers: 7.8 },
  { date: '18 May', txValue: 82, activeUsers: 6.9 },
  { date: '23 May', txValue: 92, activeUsers: 8.2 },
]

const MARKETPLACE_PERFORMANCE_6M = [
  { date: 'Mar', txValue: 35, activeUsers: 3.8 },
  { date: 'Apr', txValue: 52, activeUsers: 5.1 },
  { date: 'May', txValue: 74, activeUsers: 6.9 },
  { date: 'Jun', txValue: 88, activeUsers: 8.4 },
  { date: 'Jul', txValue: 110, activeUsers: 10.2 },
  { date: 'Aug', txValue: 128, activeUsers: 12.8 },
]

const MARKETPLACE_PERFORMANCE_12M = [
  { date: 'Q1', txValue: 90, activeUsers: 4.2 },
  { date: 'Q2', txValue: 180, activeUsers: 7.6 },
  { date: 'Q3', txValue: 290, activeUsers: 10.5 },
  { date: 'Q4', txValue: 420, activeUsers: 12.8 },
]

export function AdminDashboardView({
  adminName = 'Given',
  onExploreDeals,
}: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'verifications' | 'deals' | 'approvals' | 'subscriptions' | 'payouts' | 'risk' | 'disputes' | 'logs' | 'system'>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [timeRange, setTimeRange] = useState<'30D' | '6M' | '12M'>('30D')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'VERIFICATIONS' | 'DEALS' | 'REWARDS' | 'FLAGGED'>('ALL')

  const chartData =
    timeRange === '30D'
      ? MARKETPLACE_PERFORMANCE_30D
      : timeRange === '6M'
      ? MARKETPLACE_PERFORMANCE_6M
      : MARKETPLACE_PERFORMANCE_12M

  const mobileNavPills = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'review', label: 'Review Queue (43)', icon: Layers, isAction: true },
    { id: 'verifications', label: 'Verifications (18)', icon: ShieldCheck },
    { id: 'deals', label: 'Deals (12)', icon: Briefcase },
    { id: 'payouts', label: 'Financials', icon: Wallet },
    { id: 'risk', label: 'Fraud & Risk (4)', icon: AlertTriangle },
    { id: 'system', label: 'System Health', icon: Activity },
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

        {/* Console Pill */}
        {!sidebarCollapsed && (
          <div className="w-full py-2 px-3 bg-[#0B132B] dark:bg-[#070D1E] text-white text-center rounded-xl text-xs font-black tracking-wider uppercase shadow-xs">
            ADMIN CONSOLE
          </div>
        )}

        {/* Navigation Groups */}
        <div className="space-y-5 text-xs">
          {/* GROUP 1: PLATFORM */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                PLATFORM
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
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Users & Access</span>}
              </div>
            </button>

            <button
              onClick={() => {
                setReviewFilter('VERIFICATIONS')
                setShowReviewModal(true)
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Business Verification</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FF6A00] font-black text-[10px] flex items-center justify-center">
                  18
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('deals')
                onExploreDeals?.()
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Deals & Opportunities</span>}
              </div>
            </button>

            <button
              onClick={() => {
                setReviewFilter('DEALS')
                setShowReviewModal(true)
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Deal Approvals</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FF6A00] font-black text-[10px] flex items-center justify-center">
                  12
                </span>
              )}
            </button>
          </div>

          {/* GROUP 2: FINANCIAL OPERATIONS */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                FINANCIAL OPERATIONS
              </div>
            )}
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'subscriptions'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Subscriptions</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('payouts')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'payouts'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Payments</span>}
              </div>
            </button>

            <button
              onClick={() => {
                setReviewFilter('REWARDS')
                setShowReviewModal(true)
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Rewards & Payouts</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('payouts')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Calculator className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Reconciliation</span>}
              </div>
            </button>
          </div>

          {/* GROUP 3: RISK & SUPPORT */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                RISK & SUPPORT
              </div>
            )}
            <button
              onClick={() => setActiveTab('risk')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <UserCheck className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>KYC & Compliance</span>}
              </div>
            </button>

            <button
              onClick={() => {
                setReviewFilter('FLAGGED')
                setShowReviewModal(true)
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                {!sidebarCollapsed && <span>Fraud & Risk</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 font-black text-[10px] flex items-center justify-center">
                  4
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('disputes')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 shrink-0 text-amber-500" />
                {!sidebarCollapsed && <span>Disputes & Complaints</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 font-black text-[10px] flex items-center justify-center">
                  7
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Audit Logs</span>}
              </div>
            </button>
          </div>

          {/* GROUP 4: SYSTEM */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                SYSTEM
              </div>
            )}
            <button
              onClick={() => setActiveTab('system')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Notifications</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Megaphone className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Content & Promotions</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <UserCog className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Roles & Permissions</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>System Settings</span>}
              </div>
            </button>
          </div>
        </div>

        {/* Bottom System Status Card */}
        {!sidebarCollapsed && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>System Status</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-black flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Operational
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              All services healthy
            </div>
            <button
              onClick={() => setActiveTab('system')}
              className="w-full py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl transition-colors shadow-2xs text-center"
            >
              View Status
            </button>
          </div>
        )}

        {/* User Profile Pill */}
        {!sidebarCollapsed && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0B132B] text-white text-xs font-black flex items-center justify-center shadow-xs">
                GM
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                  {adminName} M.
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Super Administrator
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
                    setShowReviewModal(true)
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
            {activeTab === 'overview' && 'Admin Overview'}
            {activeTab === 'users' && 'User Management & Authorization'}
            {activeTab === 'verifications' && 'Business KYB Document Approvals'}
            {activeTab === 'deals' && 'Marketplace Deals Registry'}
            {activeTab === 'approvals' && 'Pending Deal Reviews'}
            {activeTab === 'subscriptions' && 'Partner Subscriptions Ledger'}
            {activeTab === 'payouts' && 'Disbursements & Financial Settlement'}
            {activeTab === 'risk' && 'Automated Risk & Fraud Engine'}
            {activeTab === 'disputes' && 'Disputes & Support Escalations'}
            {activeTab === 'logs' && 'Immutable Audit Logs'}
            {activeTab === 'system' && 'Infrastructure & API Health'}
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
              onClick={() => setShowReviewModal(true)}
              className="relative p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#FF6A00] text-white font-bold text-[9px] flex items-center justify-center">
                8
              </span>
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline-block">Production</span>
              <span className="sm:hidden text-emerald-600">Prod</span>
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
                  Good morning, {adminName}
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-0.5">
                  Monitor marketplace activity, financial operations, compliance and platform health.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="py-3 px-5 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 self-start sm:self-auto active:scale-[0.99]"
              >
                <Layers className="w-4 h-4" />
                <span>Open Review Queue</span>
              </button>
            </div>

            {/* 4 Top KPI Metric Cards (2x2 Grid on Mobile, 4 Cols on XL Desktop) */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
              {/* CARD 1: Total Users */}
              <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4">
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
              <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4">
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
              <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4">
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
              <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4 col-span-2 sm:col-span-1">
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

            {/* Middle Section: Marketplace Performance & Review Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
              {/* Left Card: Marketplace Performance (8 Cols) */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex flex-row items-center justify-between gap-2 mb-4 sm:mb-6">
                    <h3 className="text-sm sm:text-lg font-extrabold text-[#0F172A] dark:text-white">
                      Marketplace Performance
                    </h3>

                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl text-[10px] sm:text-xs">
                      {(['30D', '6M', '12M'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setTimeRange(r)}
                          className={`px-2 sm:px-3 py-1 rounded-lg font-bold transition-colors ${
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

                  {/* Dual-Axis Line/Area Chart */}
                  <div className="h-48 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.2} />
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

                <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00]" />
                    <span>Transaction Value (TZS)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0B132B] dark:bg-slate-400" />
                    <span>Active Users</span>
                  </div>
                </div>
              </div>

              {/* Right Card: Review Queue (4 Cols) */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-3.5">
                  <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white">
                    Review Queue
                  </h3>

                  <div className="space-y-2.5">
                    {/* Item 1: Business Verifications */}
                    <button
                      onClick={() => {
                        setReviewFilter('VERIFICATIONS')
                        setShowReviewModal(true)
                      }}
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                            Business Verifications
                          </div>
                          <div className="text-[10px] text-slate-400">New submissions</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-black text-sm text-slate-800 dark:text-slate-200">
                        <span>18</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>

                    {/* Item 2: Deals Awaiting Review */}
                    <button
                      onClick={() => {
                        setReviewFilter('DEALS')
                        setShowReviewModal(true)
                      }}
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6A00] flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                            Deals Awaiting Review
                          </div>
                          <div className="text-[10px] text-slate-400">Pending approvals</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-black text-sm text-slate-800 dark:text-slate-200">
                        <span>12</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>

                    {/* Item 3: Reward Approvals */}
                    <button
                      onClick={() => {
                        setReviewFilter('REWARDS')
                        setShowReviewModal(true)
                      }}
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                            Reward Approvals
                          </div>
                          <div className="text-[10px] text-slate-400">Pending rewards</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-black text-sm text-slate-800 dark:text-slate-200">
                        <span>9</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>

                    {/* Item 4: Flagged Activities */}
                    <button
                      onClick={() => {
                        setReviewFilter('FLAGGED')
                        setShowReviewModal(true)
                      }}
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                          <Flag className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                            Flagged Activities
                          </div>
                          <div className="text-[10px] text-slate-400">Requires attention</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-black text-sm text-red-600">
                        <span>4</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      setReviewFilter('ALL')
                      setShowReviewModal(true)
                    }}
                    className="w-full py-3.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors text-center active:scale-[0.99]"
                  >
                    Review All Items
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Section: Recent Platform Activity & Platform Health */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
              {/* Left Column: Recent Platform Activity Table (8 Cols) */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] dark:text-white">
                    Recent Platform Activity
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[550px]">
                    <thead className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="pb-3 font-extrabold">Time</th>
                        <th className="pb-3 font-extrabold">Activity</th>
                        <th className="pb-3 font-extrabold">Actor</th>
                        <th className="pb-3 font-extrabold">Status</th>
                        <th className="pb-3 font-extrabold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      <tr>
                        <td className="py-3 text-slate-400 font-mono">10:42</td>
                        <td className="py-3 font-bold text-slate-900 dark:text-white">Business verification submitted</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">MobiPay Africa</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-md font-bold text-[10px]">
                            Pending
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setReviewFilter('VERIFICATIONS')
                                setShowReviewModal(true)
                              }}
                              className="px-2.5 py-1 border rounded-lg text-slate-700 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-50"
                            >
                              View
                            </button>
                            <button className="text-slate-400 hover:text-slate-600">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-3 text-slate-400 font-mono">10:18</td>
                        <td className="py-3 font-bold text-slate-900 dark:text-white">Deal approved</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">Asha K.</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md font-bold text-[10px]">
                            Completed
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setReviewFilter('DEALS')
                                setShowReviewModal(true)
                              }}
                              className="px-2.5 py-1 border rounded-lg text-slate-700 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-50"
                            >
                              View
                            </button>
                            <button className="text-slate-400 hover:text-slate-600">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-3 text-slate-400 font-mono">09:56</td>
                        <td className="py-3 font-bold text-slate-900 dark:text-white">Subscription payment received</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">Partner #2841</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md font-bold text-[10px]">
                            Successful
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setActiveTab('subscriptions')}
                              className="px-2.5 py-1 border rounded-lg text-slate-700 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-50"
                            >
                              View
                            </button>
                            <button className="text-slate-400 hover:text-slate-600">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-3 text-slate-400 font-mono">09:31</td>
                        <td className="py-3 font-bold text-slate-900 dark:text-white">Reward payout flagged</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">System Risk Engine</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 rounded-md font-bold text-[10px]">
                            Review
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setReviewFilter('FLAGGED')
                                setShowReviewModal(true)
                              }}
                              className="px-2.5 py-1 border rounded-lg text-slate-700 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-50"
                            >
                              View
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
                  Showing 1 to 4 of 4 activities
                </div>
              </div>

              {/* Right Column: Platform Health (4 Cols) */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white">
                  Platform Health
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2.5">
                      <Cloud className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-slate-900 dark:text-white">API Services</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Operational
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2.5">
                      <Wallet className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-slate-900 dark:text-white">Payments</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Operational
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-slate-900 dark:text-white">Notifications</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Operational
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-slate-900 dark:text-white">Database</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Operational
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">99.98% uptime</span>
                  <button
                    onClick={() => setActiveTab('system')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>View system status</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS & ACCESS */}
        {activeTab === 'users' && (
          <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              User Directory & Roles (12,846 Accounts)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[500px]">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Subscription</th>
                    <th className="p-3">KYC Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-3 font-bold">Alex Mushi (alex.mushi@lumo.co.tz)</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">PARTNER</span></td>
                    <td className="p-3"><span className="text-emerald-600 font-bold">✓ Semi-Annual (Active)</span></td>
                    <td className="p-3"><span className="text-emerald-600 font-bold">Verified</span></td>
                    <td className="p-3 text-right"><button className="px-2 py-1 border rounded text-xs font-bold">Manage</button></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">Kijani Solar Tech (contact@kijani.co.tz)</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-orange-100 text-[#FF6A00] rounded font-bold">BUSINESS</span></td>
                    <td className="p-3"><span className="text-slate-400">N/A (Publisher)</span></td>
                    <td className="p-3"><span className="text-emerald-600 font-bold">BRELA Verified</span></td>
                    <td className="p-3 text-right"><button className="px-2 py-1 border rounded text-xs font-bold">Manage</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SUBSCRIPTIONS */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Partner Subscriptions & Revenue Ledger
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200">
                <div className="text-xs text-orange-900 dark:text-orange-300 font-bold uppercase">Monthly Active Subs</div>
                <div className="text-2xl font-black text-[#FF6A00]">4,120</div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
                <div className="text-xs text-emerald-900 dark:text-emerald-300 font-bold uppercase">Semi-Annual Members</div>
                <div className="text-2xl font-black text-emerald-600">1,890</div>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200">
                <div className="text-xs text-purple-900 dark:text-purple-300 font-bold uppercase">Total MRR</div>
                <div className="text-2xl font-black text-purple-600 font-mono">TZS 128.4M</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* REVIEW QUEUE MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>

            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#FF6A00]" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Platform Review & Approval Queue ({reviewFilter})
              </h3>
            </div>

            <div className="flex gap-2 border-b pb-2 text-xs font-bold">
              {(['ALL', 'VERIFICATIONS', 'DEALS', 'REWARDS', 'FLAGGED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setReviewFilter(f)}
                  className={`px-3 py-1 rounded-lg ${
                    reviewFilter === f ? 'bg-[#FF6A00] text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border flex items-center justify-between text-xs">
                <div>
                  <strong className="text-slate-900 dark:text-white">MobiPay Africa (BRELA Incorporation #18492)</strong>
                  <div className="text-slate-500 mt-0.5">TIN: 148-291-002 · Submitted 10:42 AM today</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold">Approve</button>
                  <button className="px-3 py-1 border text-red-600 rounded-lg font-bold">Reject</button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border flex items-center justify-between text-xs">
                <div>
                  <strong className="text-slate-900 dark:text-white">Commercial Deal: &quot;Power the Next 1,000 Homes&quot;</strong>
                  <div className="text-slate-500 mt-0.5">Kijani Solar Tech · Budget: TZS 4.5M · Reward: TZS 45,000</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold">Approve</button>
                  <button className="px-3 py-1 border text-slate-600 rounded-lg font-bold">Edit</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
