'use client'

import React, { useState, useEffect } from 'react'
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
  MessageCircle,
  PackageCheck,
  Building2,
  AlertCircle,
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
import { EscrowInquiry } from '@/components/marketplace/WhatsAppMiddlemanModal'

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

const DEFAULT_MOCK_INQUIRIES: EscrowInquiry[] = [
  {
    id: 'inq_vip_solar_01',
    ticketCode: 'LUMO-ESCROW-793412',
    dealId: 'opp_vip_solar_hybrid_08',
    dealTitle: 'VIP: 5kW Commercial Solar Hybrid Inverters (Container Lot)',
    dealSlug: '5kw-commercial-solar-hybrid-inverter',
    sellerCompany: 'Kilimanjaro Solar & Power Ltd',
    sellerPhone: '+255 784 112 233',
    sellerWhatsApp: '255784112233',
    buyerName: 'David Moshi',
    buyerPhone: '+255714902311',
    quantity: 10,
    deliveryLocation: 'Arusha Hub',
    notes: 'Requires TRA EFD fiscalised receipt and 48-hour inspection seal verification.',
    escrowStatus: 'DELIVERY_INSPECTION',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'inq_vip_macbook_02',
    ticketCode: 'LUMO-ESCROW-610482',
    dealId: 'opp_vip_macbook_fleet_09',
    dealTitle: 'VIP: M3 Pro 16" Enterprise Fleet Lot (Sealed Units)',
    dealSlug: 'm3-pro-16-inch-enterprise-fleet-sealed',
    sellerCompany: 'Silicon Zanzibar Hardware Supply',
    sellerPhone: '+255 768 990 011',
    sellerWhatsApp: '255768990011',
    buyerName: 'Amina Kassim',
    buyerPhone: '+255755123984',
    quantity: 5,
    deliveryLocation: 'Dar es Salaam (Posta)',
    notes: 'Golden VIP buyer requesting same-day Lumo Escrow courier pickup.',
    escrowStatus: 'FUNDS_HELD_IN_ESCROW',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
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
  const [escrowInquiries, setEscrowInquiries] = useState<EscrowInquiry[]>([])

  useEffect(() => {
    const loadInquiries = () => {
      try {
        const stored = localStorage.getItem('lumo_escrow_inquiries')
        if (stored) {
          const parsed: EscrowInquiry[] = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEscrowInquiries(parsed)
            return
          }
        }
      } catch (e) {
        console.error('Failed to load escrow inquiries', e)
      }
      setEscrowInquiries(DEFAULT_MOCK_INQUIRIES)
    }

    loadInquiries()
    const handleUpdate = () => loadInquiries()
    window.addEventListener('lumo:escrow-inquiries-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('lumo:escrow-inquiries-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

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
      <div className="dashboard-welcome flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              <span className="text-[11px] sm:text-xs font-bold text-slate-500">Secured Reward Budget</span>
              <div className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white font-mono">
                TZS {(fundingBalance.committedToActiveDealsTZS / 1000000).toFixed(1)}M
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-purple-600 font-bold flex items-center gap-1">
            <span>Manage wallet & payouts →</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart + Secured Wallet Balance Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Performance Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Revenue & Commercial Conversions Velocity
              </h3>
              <p className="text-xs text-slate-500">Weekly attributable deal pipeline and verified outcome volumes.</p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF6A00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `TZS ${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(val: any) => [`TZS ${Number(val).toLocaleString()}`, 'Pipeline Value']}
                  contentStyle={{
                    borderRadius: '12px',
                    backgroundColor: '#0F172A',
                    color: '#fff',
                    border: 'none',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pipelineRevenueTZS"
                  stroke="#FF6A00"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Widget (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#FF6A00]" />
                <span>Secured Wallet Balance</span>
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full">
                Funds Are Secured
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b dark:border-slate-800/60">
                <span className="text-slate-500">Available Wallet Balance:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">
                  TZS {fundingBalance.availableBalanceTZS.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-800/60">
                <span className="text-slate-500">Committed to Active Deals:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  TZS {fundingBalance.committedToActiveDealsTZS.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-800/60">
                <span className="text-slate-500">Pending Inspections:</span>
                <span className="font-mono font-bold text-amber-600">
                  TZS {fundingBalance.pendingConfirmationTZS.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1">
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
                <strong>Funds Are Secured:</strong> Reward funds are processed and protected through LUMO’s licensed payment partner ({fundingBalance.safeguardingProvider}).
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('payments_funding')}
            className="w-full py-2.5 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors text-center"
          >
            Manage Wallet & Review Payouts
          </button>
        </div>
      </div>

      {/* WhatsApp Escrow Inquiries & 48-Hour Inspection Holds */}
      <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <MessageCircle className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                WhatsApp Escrow Deals & 48h Inspection Holds ({escrowInquiries.length})
              </h3>
              <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Lumo Middleman Protected</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Direct partner inquiries bridged through Lumo's WhatsApp escrow desk with mandatory 48-hour post-delivery inspection guarantees.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            Escrow Desk: <span className="text-emerald-600 font-extrabold">+255 700 000 000</span>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left min-w-[750px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Ticket & Buyer</th>
                <th className="p-3">Target Deal</th>
                <th className="p-3">Quantity & Valuation</th>
                <th className="p-3">Escrow Status & Hold</th>
                <th className="p-3 text-right">Escrow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {escrowInquiries.map((inquiry) => {
                const statusConfig: Record<string, { label: string; bg: string }> = {
                  DELIVERY_INSPECTION: {
                    label: '48h Hold Placed',
                    bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200',
                  },
                  FUNDS_HELD_IN_ESCROW: {
                    label: 'Escrow Funded',
                    bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200',
                  },
                  WAITING_ESCROW_PAYMENT: {
                    label: 'Pending Match',
                    bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200',
                  },
                  RELEASED_TO_SELLER: {
                    label: 'Completed & Released',
                    bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
                  },
                }
                const currentStatus = statusConfig[inquiry.escrowStatus] || {
                  label: inquiry.escrowStatus,
                  bg: 'bg-slate-100 text-slate-800 border-slate-200',
                }

                return (
                  <tr key={inquiry.ticketCode} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-mono font-black text-xs text-[#0B132B] dark:text-slate-200">
                        {inquiry.ticketCode}
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                        {inquiry.buyerName}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                        <MessageCircle className="w-3 h-3" />
                        <span>{inquiry.buyerPhone}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-extrabold text-slate-900 dark:text-white line-clamp-1 max-w-xs">
                        {inquiry.dealTitle}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Dest: {inquiry.deliveryLocation} · {inquiry.sellerCompany}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-mono font-black text-slate-900 dark:text-white">
                        {inquiry.quantity.toLocaleString()} Units
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {inquiry.notes ? inquiry.notes.slice(0, 45) + '...' : 'Direct wholesale escrow'}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${currentStatus.bg}`}>
                        <ShieldCheck className="w-3 h-3" />
                        <span>{currentStatus.label}</span>
                      </span>
                      <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>48h inspection hold active</span>
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <a
                        href={`https://wa.me/255700000000?text=${encodeURIComponent(`Hello Lumo Escrow Desk. Regarding Ticket ${inquiry.ticketCode} for ${inquiry.dealTitle}:`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition-colors shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Desk</span>
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
