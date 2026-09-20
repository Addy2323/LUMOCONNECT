'use client'

import React, { useState } from 'react'
import {
  Globe,
  TrendingUp,
  Folder,
  ShieldCheck,
  FileText,
  Search,
  Building2,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { formatCurrencyValue } from '@/modules/international/countries'

interface InternationalInvestorDashboardProps {
  currentUserId?: string
  isMember?: boolean
  onOpenMandateModal?: () => void
  onOpenDataRoom?: (opportunityId: string) => void
}

export function InternationalInvestorDashboard({
  currentUserId,
  isMember = false,
  onOpenMandateModal,
  onOpenDataRoom,
}: InternationalInvestorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'MATCHED_DEALS' | 'MY_MANDATES' | 'NDAS' | 'DATA_ROOMS'>('MATCHED_DEALS')

  return (
    <div className="w-full space-y-6">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white shadow-xl border border-emerald-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-500/30">
            <TrendingUp className="w-3.5 h-3.5" />
            LUMO International Investor Hub
          </div>
          <h1 className="text-2xl font-black">Investment Portfolio & Deal Room</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Access algorithmic project matches, request confidential data room access, execute NDAs, and evaluate pre-vetted investment opportunities across Africa & globally.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenMandateModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Add Investment Mandate
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('MATCHED_DEALS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'MATCHED_DEALS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Matched Opportunities
        </button>
        <button
          onClick={() => setActiveTab('MY_MANDATES')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'MY_MANDATES'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          My Mandates
        </button>
        <button
          onClick={() => setActiveTab('NDAS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'NDAS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Executed NDAs
        </button>
        <button
          onClick={() => setActiveTab('DATA_ROOMS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'DATA_ROOMS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Authorized Data Rooms
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'MATCHED_DEALS' && (
        <div className="bg-white dark:bg-[#0B1220] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Pre-Vetted Projects Matched to Your Ticket & Sector Mandates
            </h2>
            <span className="text-xs font-semibold text-emerald-600">Weighted Scoring Engine Active</span>
          </div>

          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Serengeti Solar Hybrid Expansion • 94% Match Score
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Location: Tanzania (TZ) • Sector: Energy & Renewables • Capital Sought: $5,000,000
              </div>
            </div>
            <button
              onClick={() => onOpenDataRoom && onOpenDataRoom('deal-1')}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5" />
              Open Data Room
            </button>
          </div>
        </div>
      )}

      {activeTab === 'MY_MANDATES' && (
        <div className="bg-white dark:bg-[#0B1220] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
          <div className="text-sm font-bold text-slate-900 dark:text-white">Your Active Investor Mandate</div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <div><strong>Entity:</strong> Global Energy Transition Fund</div>
            <div><strong>Ticket Range:</strong> $1,000,000 – $10,000,000</div>
            <div><strong>Sectors:</strong> Energy, Infrastructure, Agriculture</div>
            <div><strong>Target Countries:</strong> TZ, KE, AE, ZA</div>
          </div>
        </div>
      )}

      {activeTab === 'NDAS' && (
        <div className="bg-white dark:bg-[#0B1220] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
          <div className="text-sm font-bold text-slate-900 dark:text-white">Executed Non-Disclosure Agreements</div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>NDA Reference: <strong className="font-mono text-[#FF6A00]">LUMO-NDA-2026-00042</strong></span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Executed 2026-09-19</span>
          </div>
        </div>
      )}

      {activeTab === 'DATA_ROOMS' && (
        <div className="bg-white dark:bg-[#0B1220] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
          <div className="text-sm font-bold text-slate-900 dark:text-white">Authorized Investment Data Rooms</div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Serengeti Solar Data Room</div>
                <div className="text-[10px] text-slate-400">9 Structured folders • Access Granted</div>
              </div>
            </div>
            <button
              onClick={() => onOpenDataRoom && onOpenDataRoom('deal-1')}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
            >
              Enter Data Room
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
