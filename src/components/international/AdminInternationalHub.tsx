'use client'

import React, { useState, useEffect } from 'react'
import {
  Globe,
  TrendingUp,
  UserCheck,
  Folder,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Mail,
  Search,
  Filter,
  ArrowRight,
  Eye,
  RefreshCw,
  Sparkles,
  Building2,
  FileText,
} from 'lucide-react'
import { formatCurrencyValue, ISO_COUNTRIES } from '@/modules/international/countries'

export function AdminInternationalHub() {
  const [activeTab, setActiveTab] = useState<'SUBMISSIONS' | 'MATCHING' | 'INTRODUCTIONS' | 'DATA_ROOMS' | 'SUBSCRIPTIONS' | 'COMMS'>('SUBMISSIONS')
  
  // Submissions state
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  // Introductions state
  const [introductions, setIntroductions] = useState<any[]>([])
  const [loadingIntroductions, setLoadingIntroductions] = useState(false)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  async function fetchData() {
    if (activeTab === 'SUBMISSIONS') {
      setLoadingSubmissions(true)
      try {
        const res = await fetch('/api/international/submit')
        const data = await res.json()
        if (data.success) setSubmissions(data.submissions || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingSubmissions(false)
      }
    } else if (activeTab === 'INTRODUCTIONS') {
      setLoadingIntroductions(true)
      try {
        const res = await fetch('/api/international/introductions')
        const data = await res.json()
        if (data.success) setIntroductions(data.introductions || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingIntroductions(false)
      }
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-[#FF6A00] text-xs font-black uppercase tracking-wider mb-2 border border-orange-500/30">
            <Globe className="w-3.5 h-3.5" />
            LUMO International Admin Desk
          </div>
          <h1 className="text-2xl font-black">Global Deal Coordination & Matching Hub</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Vet international submissions, manage 11-stage investor introduction pipelines, supervise data room permissions, and control independent subscriptions.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('SUBMISSIONS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'SUBMISSIONS'
              ? 'bg-[#FF6A00] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Incoming Submissions
        </button>
        <button
          onClick={() => setActiveTab('MATCHING')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'MATCHING'
              ? 'bg-[#FF6A00] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Matching Engine
        </button>
        <button
          onClick={() => setActiveTab('INTRODUCTIONS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'INTRODUCTIONS'
              ? 'bg-[#FF6A00] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          11-Stage Pipeline
        </button>
        <button
          onClick={() => setActiveTab('DATA_ROOMS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'DATA_ROOMS'
              ? 'bg-[#FF6A00] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Data Rooms & NDAs
        </button>
        <button
          onClick={() => setActiveTab('SUBSCRIPTIONS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'SUBSCRIPTIONS'
              ? 'bg-[#FF6A00] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Access Memberships
        </button>
      </div>

      {/* Tab: Submissions */}
      {activeTab === 'SUBMISSIONS' && (
        <div className="bg-white dark:bg-[#0B1220] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#FF6A00]" />
              Pending International Submissions Vetting Desk
            </h2>
            <span className="text-xs text-slate-500">{submissions.length} total submissions</span>
          </div>

          {loadingSubmissions ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading incoming submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No submissions currently pending desk review.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {submissions.map((sub) => (
                <div key={sub.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#FF6A00]">{sub.referenceNumber}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-orange-100 dark:bg-orange-950/40 text-[#FF6A00]">
                        {sub.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {ISO_COUNTRIES.find((c) => c.code === sub.countryCode)?.flag} {sub.countryCode}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{sub.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{sub.shortDescription}</p>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Submitted by: <strong>{sub.fullName}</strong> ({sub.businessName || 'N/A'}) • {sub.emailAddress} • {sub.whatsAppNumber}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve & Publish
                    </button>
                    <button className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer">
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Introductions Pipeline */}
      {activeTab === 'INTRODUCTIONS' && (
        <div className="bg-white dark:bg-[#0B1220] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#FF6A00]" />
              11-Stage Canonical Investor Introduction Lifecycle
            </h2>
            <span className="text-xs font-semibold text-slate-500">{introductions.length} active pipelines</span>
          </div>

          {loadingIntroductions ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading introduction pipeline...</div>
          ) : introductions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No active investor introductions registered yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {introductions.map((intro) => (
                <div key={intro.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#FF6A00]">{intro.introductionNumber}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600">
                        {intro.stage}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      Capacity: {formatCurrencyValue(intro.estimatedCapacityMinor || 0, intro.currency || 'USD')}
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{intro.investorLeadName}</h3>
                  <div className="text-xs text-slate-500">
                    Location: {intro.investorCountry} • Category: {intro.investorType || 'Family Office'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
