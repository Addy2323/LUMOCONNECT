'use client'

import React, { useState, useEffect } from 'react'
import {
  Globe,
  TrendingUp,
  UserCheck,
  Clock,
  CheckCircle2,
  DollarSign,
  PlusCircle,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react'
import { formatCurrencyValue } from '@/modules/international/countries'

interface InternationalPartnerDashboardProps {
  currentUserId?: string
  onOpenReferralModal?: () => void
  onOpenSubmissionModal?: () => void
}

export function InternationalPartnerDashboard({
  currentUserId,
  onOpenReferralModal,
  onOpenSubmissionModal,
}: InternationalPartnerDashboardProps) {
  const [introductions, setIntroductions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMyDeals() {
      try {
        const res = await fetch(`/api/international/introductions?partnerUserId=${currentUserId || ''}`)
        const data = await res.json()
        if (data.success) {
          setIntroductions(data.introductions || [])
        }
      } catch (err) {
        console.error('Failed to load partner introductions:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMyDeals()
  }, [currentUserId])

  return (
    <div className="w-full space-y-6">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-[#FF6A00] text-xs font-black uppercase tracking-wider mb-2 border border-orange-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            LUMO International Partner Desk
          </div>
          <h1 className="text-2xl font-black">My International Deals & Referral Pipeline</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Track cross-border opportunities, originate investor introductions, and monitor commission attribution across all 11 deal stages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onOpenReferralModal}
            className="px-5 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-extrabold rounded-2xl transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            I Have an Investor
          </button>
          <button
            onClick={onOpenSubmissionModal}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#FF6A00]" />
            Submit Deal
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-2xl font-black text-slate-900 dark:text-white">{introductions.length}</div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
            Active Introductions
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-2xl font-black text-[#FF6A00]">
            {formatCurrencyValue(
              introductions.reduce((sum, item) => sum + (item.estimatedCapacityMinor || 0), 0),
              'USD'
            )}
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
            Pipeline Volume
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {introductions.filter((i) => i.stage === 'DEAL_CLOSED' || i.stage === 'INVESTMENT_CLOSED').length}
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
            Closed Deals
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">100%</div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
            Attribution Protection
          </div>
        </div>
      </div>

      {/* Introductions Pipeline List */}
      <div className="bg-white dark:bg-[#0B1220] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#FF6A00]" />
            Your Investor Introductions & Mandates
          </h2>
          <span className="text-xs font-semibold text-slate-500">{introductions.length} recorded</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading your referral pipeline...</div>
        ) : introductions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <UserCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Active Investor Referrals Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Introduce local or global investors to active LUMO opportunities to lock in your partner referral rights.
            </p>
            <button
              onClick={onOpenReferralModal}
              className="px-5 py-2.5 bg-[#FF6A00] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Register an Investor Introduction
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {introductions.map((intro) => (
              <div key={intro.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#FF6A00]">
                      {intro.introductionNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {intro.stage}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {intro.investorLeadName}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Location: {intro.investorCountry} • Capacity: {formatCurrencyValue(intro.estimatedCapacityMinor || 0, intro.currency || 'USD')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(intro.createdAt).toLocaleDateString()}
                  </span>
                  <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#FF6A00] transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
