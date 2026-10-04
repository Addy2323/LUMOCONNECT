'use client'

import React, { useState, useEffect } from 'react'
import {
  Globe,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  UserCheck,
  CreditCard,
  Building2,
  Send,
  X,
  Plus,
  RefreshCw,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Download,
  FileCheck,
  Briefcase,
  Users,
  Handshake,
  Sparkles,
} from 'lucide-react'
import {
  InternationalSubmission,
  InternationalOpportunity,
  InternationalMembership,
  InternationalInquiry,
  InternationalCommunication,
  InternationalSubmissionStatus,
} from '@/modules/international/types'
import { formatCurrencyValue, ISO_COUNTRIES } from '@/modules/international/countries'
import { AdminInternationalDealWizardModal } from '../modals/AdminInternationalDealWizardModal'

type InternationalSubTab =
  | 'overview'
  | 'submissions'
  | 'business_sales'
  | 'investor_mandates'
  | 'jv_requests'
  | 'introductions_ndas'
  | 'verification'
  | 'published'
  | 'members'
  | 'subscriptions'
  | 'countries'
  | 'communications'
  | 'reports'

export function AdminInternationalDeskTab() {
  const [activeSubTab, setActiveSubTab] = useState<InternationalSubTab>('overview')
  const [loading, setLoading] = useState(true)

  // Data from backend
  const [submissions, setSubmissions] = useState<InternationalSubmission[]>([])
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [published, setPublished] = useState<InternationalOpportunity[]>([])
  const [memberships, setMemberships] = useState<InternationalMembership[]>([])
  const [inquiries, setInquiries] = useState<InternationalInquiry[]>([])
  const [businessSales, setBusinessSales] = useState<any[]>([])
  const [investorProfiles, setInvestorProfiles] = useState<any[]>([])
  const [ndas, setNdas] = useState<any[]>([])
  const [introductions, setIntroductions] = useState<any[]>([])
  const [jvRequests, setJvRequests] = useState<any[]>([])
  const [stats, setStats] = useState<{
    activeCountriesCount: number
    opportunitiesCount: number
    membersCount: number
    totalValueByCurrency: Record<string, number>
    totalEquivalentTZS: number
    countryDistribution: { code: string; name: string; flag: string; count: number }[]
  }>({
    activeCountriesCount: 0,
    opportunitiesCount: 0,
    membersCount: 0,
    totalValueByCurrency: {},
    totalEquivalentTZS: 0,
    countryDistribution: [],
  })

  // Review Drawer state
  const [reviewCase, setReviewCase] = useState<InternationalSubmission | null>(null)
  const [caseCommunications, setCaseCommunications] = useState<InternationalCommunication[]>([])
  const [caseWhatsApp, setCaseWhatsApp] = useState<{ text: string; url: string } | null>(null)
  const [adminNoteText, setAdminNoteText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Subscription management state
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [grantEmail, setGrantEmail] = useState('')
  const [grantName, setGrantName] = useState('')
  const [grantPlan, setGrantPlan] = useState<'INT_MONTHLY' | 'INT_SEMI_ANNUAL' | 'INT_ANNUAL'>('INT_MONTHLY')
  const [grantCurrency, setGrantCurrency] = useState('USD')
  const [grantAmount, setGrantAmount] = useState('49')
  const [grantNotes, setGrantNotes] = useState('')

  // Admin deal wizard state
  const [dealWizardOpen, setDealWizardOpen] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/international')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSubmissions(data.submissions || [])
          setStatusCounts(data.statusCounts || {})
          setPublished(data.published || [])
          setMemberships(data.memberships || [])
          setInquiries(data.inquiries || [])
          setBusinessSales(data.businessSales || [])
          setInvestorProfiles(data.investorProfiles || [])
          setNdas(data.ndas || [])
          setIntroductions(data.introductions || [])
          setJvRequests(data.jvRequests || [])
          if (data.stats) setStats(data.stats)
        }
      }
    } catch (err) {
      console.error('Error loading admin international desk:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Open Review Case
  const handleOpenReview = async (sub: InternationalSubmission) => {
    setReviewCase(sub)
    setAdminNoteText('')
    try {
      const res = await fetch('/api/admin/international/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GET_COMMUNICATIONS',
          submissionId: sub.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setCaseCommunications(data.communications || [])
        setCaseWhatsApp(data.whatsApp || null)
      }
    } catch (err) {
      console.error('Failed to load case communications:', err)
    }
  }

  // Action status transition
  const handleTransitionStatus = async (status: InternationalSubmissionStatus) => {
    if (!reviewCase) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/international/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          submissionId: reviewCase.id,
          status,
          adminNotes: adminNoteText || undefined,
        }),
      })
      const data = await res.json()
      if (data.success && data.submission) {
        setReviewCase(data.submission)
        fetchData()
        handleOpenReview(data.submission)
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Publish Opportunity
  const handlePublishCase = async () => {
    if (!reviewCase) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/international/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PUBLISH',
          submissionId: reviewCase.id,
          overrides: {
            commercialTerms: `Declared Value: ${reviewCase.currency} ${reviewCase.declaredValue.toLocaleString()}. Verification: Origin confirmed in ${reviewCase.countryName}. Facilitated introductions exclusively via LUMO Intermediary Desk.`,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
        setReviewCase(null)
      }
    } catch (err) {
      console.error('Failed to publish opportunity:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Log custom communication note
  const handleAddNote = async () => {
    if (!reviewCase || !adminNoteText.trim()) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/international/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOG_COMMUNICATION',
          submissionId: reviewCase.id,
          commInput: {
            channel: 'INTERNAL_NOTE',
            direction: 'OUTBOUND',
            subject: 'Admin Desk Note',
            messageBody: adminNoteText.trim(),
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAdminNoteText('')
        handleOpenReview(reviewCase)
      }
    } catch (err) {
      console.error('Failed to add note:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Manage Subscription Actions (Extend, Cancel, etc.)
  const handleSubscriptionAction = async (id: string, action: 'EXTEND' | 'CANCEL' | 'ACTIVATE') => {
    try {
      const res = await fetch('/api/admin/international/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      console.error('Error updating membership:', err)
    }
  }

  // Grant Manual Membership
  const handleGrantMembership = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!grantEmail.trim()) return
    try {
      const res = await fetch('/api/admin/international/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GRANT',
          grantData: {
            userId: `usr_manual_${Date.now()}`,
            userName: grantName || grantEmail.split('@')[0],
            userEmail: grantEmail,
            planCode: grantPlan,
            currency: grantCurrency,
            amountPaid: parseFloat(grantAmount) || 0,
            notes: grantNotes,
          },
        }),
      })
      if (res.ok) {
        setGrantModalOpen(false)
        setGrantEmail('')
        setGrantName('')
        setGrantNotes('')
        fetchData()
      }
    } catch (err) {
      console.error('Failed to grant membership:', err)
    }
  }

  const SUB_TABS: { id: InternationalSubTab; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'submissions', label: 'Opportunity Submissions', badge: submissions.length || undefined },
    { id: 'business_sales', label: 'Businesses for Sale', badge: businessSales.length || undefined },
    { id: 'investor_mandates', label: 'Investor Mandates', badge: investorProfiles.length || undefined },
    { id: 'jv_requests', label: 'JV Requests', badge: jvRequests.length || undefined },
    { id: 'introductions_ndas', label: 'Introductions & NDAs', badge: (introductions.length || 0) + (ndas.length || 0) || undefined },
    { id: 'verification', label: 'Verification Queue', badge: (statusCounts.under_review || 0) + (statusCounts.info_required || 0) || undefined },
    { id: 'published', label: 'Published Opportunities', badge: published.length || undefined },
    { id: 'members', label: 'Private Members', badge: memberships.length || undefined },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'countries', label: 'Countries' },
    { id: 'communications', label: 'Communications' },
    { id: 'reports', label: 'Reports' },
  ]

  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        s.title.toLowerCase().includes(q) ||
        s.reference.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        s.countryName.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              LUMO International Desk
              <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                Live Engine
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review submissions, verify global dealmakers, publish to private members, and manage multi-currency subscriptions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Desk
          </button>
          <button
            onClick={() => setGrantModalOpen(true)}
            className="px-4 py-2 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Grant Private Access
          </button>
          <button
            onClick={() => setDealWizardOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Post International Deal
          </button>
        </div>
      </div>

      {/* Sub-Tabs Nav */}
      <div className="flex overflow-x-auto gap-1 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 scrollbar-none">
        {SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-[#FF6A00] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00]'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 1. OVERVIEW SUBTAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submissions</div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {submissions.length}
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                {statusCounts.submitted || 0} awaiting review
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Queue</div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {(statusCounts.under_review || 0) + (statusCounts.info_required || 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Active due diligence cases
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Published Live</div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {published.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Available to private members
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Private Members</div>
              <div className="text-3xl font-black text-[#FF6A00] mt-1">
                {memberships.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Subscribed global accounts
              </div>
            </div>
          </div>

          {/* Quick Submissions Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Submissions Feed
              </h3>
              <button
                onClick={() => setActiveSubTab('submissions')}
                className="text-xs text-[#FF6A00] font-bold hover:underline flex items-center gap-1"
              >
                View all ({submissions.length})
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No international opportunities submitted yet. Submissions from around the world will appear here live.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {submissions.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#FF6A00]">{sub.reference}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{sub.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {sub.countryName} • {sub.category.replace(/_/g, ' ')} • {sub.fullName}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrencyValue(sub.declaredValue, sub.currency)}
                      </span>
                      <button
                        onClick={() => handleOpenReview(sub)}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[#FF6A00] hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SUBMISSIONS SUBTAB */}
      {activeSubTab === 'submissions' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reference, title, country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              {['all', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'PUBLISHED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-[#FF6A00] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
              <a
                href="/api/admin/international/export?format=csv"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </a>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Ref</th>
                    <th className="py-3.5 px-4">Submitter</th>
                    <th className="py-3.5 px-4">Country</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Opportunity</th>
                    <th className="py-3.5 px-4 text-right">Declared Value</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No submissions match the active filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const { url: waUrl } = { url: `https://wa.me/${sub.whatsapp.replace(/[^0-9]/g, '')}` }
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#FF6A00]">{sub.reference}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{sub.fullName}</div>
                            <div className="text-[10px] text-slate-400">{sub.organization || sub.submitterType}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-medium">
                              <span>{sub.countryName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                              {sub.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-medium text-slate-900 dark:text-white truncate">{sub.title}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                            {formatCurrencyValue(sub.declaredValue, sub.currency)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                sub.status === 'PUBLISHED'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : sub.status === 'UNDER_REVIEW'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                  : sub.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              }`}
                            >
                              {sub.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                                title="Contact via WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleOpenReview(sub)}
                                className="px-3 py-1 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Review Case
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2B. BUSINESSES FOR SALE SUBTAB */}
      {activeSubTab === 'business_sales' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Submitted Businesses for Sale ({businessSales.length})
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4">Business / Teaser Title</th>
                    <th className="py-3 px-4">Submitter Contact</th>
                    <th className="py-3 px-4">Country & Sector</th>
                    <th className="py-3 px-4">Asking Valuation</th>
                    <th className="py-3 px-4">Revenue / EBITDA</th>
                    <th className="py-3 px-4">Reason for Sale</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {businessSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No business sale listings submitted yet.
                      </td>
                    </tr>
                  ) : (
                    businessSales.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {b.businessName}
                          {b.isConfidential && (
                            <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Confidential
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {b.reasonForSale?.includes('[Seller:')
                              ? b.reasonForSale.split('\n')[0].replace('[Seller:', '').replace(']', '')
                              : 'Seller Contact'}
                          </div>
                          {b.reasonForSale?.includes('Phone:') && (
                            <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                              <a
                                href={`https://wa.me/${b.reasonForSale.match(/Phone:\s*([^\s|]+)/)?.[1]?.replace(/[^0-9]/g, '') || ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                {b.reasonForSale.match(/Phone:\s*([^\s|]+)/)?.[1] || 'WhatsApp'}
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold">{b.countryCode}</span> &bull; {b.sector}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#FF6A00]">
                          {formatCurrencyValue(b.indicativeValuationMinor, b.currency)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          Rev: {b.annualRevenueMinor ? formatCurrencyValue(b.annualRevenueMinor, b.currency) : 'N/A'} | EBITDA: {b.ebitdaMinor ? formatCurrencyValue(b.ebitdaMinor, b.currency) : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {b.reasonForSale?.includes('\n') ? b.reasonForSale.split('\n').slice(1).join(' ') : b.reasonForSale || 'Not specified'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2C. INVESTOR MANDATES SUBTAB */}
      {activeSubTab === 'investor_mandates' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Registered Investor Mandates & Profiles ({investorProfiles.length})
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4">Entity / Project Name</th>
                    <th className="py-3 px-4">Submitter Contact</th>
                    <th className="py-3 px-4">Investor Type</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Ticket Range (Min - Max)</th>
                    <th className="py-3 px-4">Preferred Sectors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {investorProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No investor mandates registered yet.
                      </td>
                    </tr>
                  ) : (
                    investorProfiles.map((ip) => (
                      <tr key={ip.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {ip.entityName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {ip.requirements?.includes('Contact:')
                              ? ip.requirements.split('\n')[0].replace('Contact:', '')
                              : 'Investor Contact'}
                          </div>
                          {ip.requirements?.includes('Phone:') && (
                            <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                              <a
                                href={`https://wa.me/${ip.requirements.match(/Phone:\s*([^\s|]+)/)?.[1]?.replace(/[^0-9]/g, '') || ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                {ip.requirements.match(/Phone:\s*([^\s|]+)/)?.[1] || 'WhatsApp'}
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          {ip.investorType}
                        </td>
                        <td className="py-3 px-4 font-bold">{ip.countryCode}</td>
                        <td className="py-3 px-4 font-bold text-[#FF6A00]">
                          {formatCurrencyValue(ip.minTicketMinor, ip.currency)} - {formatCurrencyValue(ip.maxTicketMinor, ip.currency)}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {Array.isArray(ip.preferredSectors) ? ip.preferredSectors.join(', ') : 'All Sectors'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2D. JV REQUESTS SUBTAB */}
      {activeSubTab === 'jv_requests' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Submitted Joint Venture (JV) Opportunities ({jvRequests.length})
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">Submitter Contact</th>
                    <th className="py-3 px-4">Origin Country & Sector</th>
                    <th className="py-3 px-4">Capital Committed</th>
                    <th className="py-3 px-4">Target Project / Mandate</th>
                    <th className="py-3 px-4">Partner Type Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {jvRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No JV requests submitted yet.
                      </td>
                    </tr>
                  ) : (
                    jvRequests.map((jv) => (
                      <tr key={jv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {jv.companyName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {jv.targetProject?.includes('[Contact:')
                              ? jv.targetProject.split('\n')[0].replace('[Contact:', '').replace(']', '')
                              : 'JV Partner Contact'}
                          </div>
                          {jv.targetProject?.includes('Phone:') && (
                            <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                              <a
                                href={`https://wa.me/${jv.targetProject.match(/Phone:\s*([^\s|]+)/)?.[1]?.replace(/[^0-9]/g, '') || ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                {jv.targetProject.match(/Phone:\s*([^\s|]+)/)?.[1] || 'WhatsApp'}
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold">{jv.countryCode}</span> &bull; {jv.sector}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#FF6A00]">
                          {formatCurrencyValue(jv.capitalAvailableMinor, jv.currency)}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {jv.targetProject?.includes('\n') ? jv.targetProject.split('\n').slice(1).join(' ') : jv.targetProject}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {jv.partnerType} ({jv.partnerCountryRequired})
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2E. INTRODUCTIONS & NDAS SUBTAB */}
      {activeSubTab === 'introductions_ndas' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Introduction Referrals ({introductions.length})
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4">Ref Number</th>
                    <th className="py-3 px-4">Investor Lead Name</th>
                    <th className="py-3 px-4">Partner Contact Details</th>
                    <th className="py-3 px-4">Country & Type</th>
                    <th className="py-3 px-4">Estimated Budget</th>
                    <th className="py-3 px-4">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {introductions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No introduction referrals recorded yet.
                      </td>
                    </tr>
                  ) : (
                    introductions.map((intro) => (
                      <tr key={intro.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-mono font-bold text-[#FF6A00]">
                          {intro.introductionNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {intro.investorLeadName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {intro.contactPerson || 'Partner Lead'}
                          </div>
                          <div className="flex flex-col gap-0.5 mt-0.5 text-[11px]">
                            {intro.whatsAppNumber && (
                              <a
                                href={`https://wa.me/${intro.whatsAppNumber.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                {intro.whatsAppNumber}
                              </a>
                            )}
                            {intro.emailAddress && (
                              <a
                                href={`mailto:${intro.emailAddress}`}
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Mail className="w-3 h-3" />
                                {intro.emailAddress}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {intro.investorCountry} &bull; {intro.investorType}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-600">
                          {formatCurrencyValue(intro.estimatedCapacityMinor, intro.currency)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-600">
                          {intro.stage}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Executed Non-Disclosure Agreements (NDAs) ({ndas.length})
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4">Signer Name</th>
                    <th className="py-3 px-4">Signer Email</th>
                    <th className="py-3 px-4">Executed Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {ndas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No NDAs executed yet.
                      </td>
                    </tr>
                  ) : (
                    ndas.map((nda) => (
                      <tr key={nda.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {nda.buyerUser?.name || 'Registered User'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {nda.buyerUser?.email || nda.buyerUserId}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(nda.signedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {nda.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. VERIFICATION QUEUE SUBTAB */}
      {activeSubTab === 'verification' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Submissions Requiring Due Diligence & Communication
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions
              .filter((s) => ['SUBMITTED', 'UNDER_REVIEW', 'INFORMATION_REQUIRED'].includes(s.status))
              .map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-[#FF6A00]">{sub.reference}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sub.title}</h4>

                  <div className="text-xs text-slate-500 line-clamp-2">{sub.description}</div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Submitter</div>
                      <div className="font-bold">{sub.fullName} ({sub.countryName})</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Value</div>
                      <div className="font-bold text-[#FF6A00]">
                        {formatCurrencyValue(sub.declaredValue, sub.currency)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <a
                      href={`https://wa.me/${sub.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-600 flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp: {sub.whatsapp}
                    </a>

                    <button
                      onClick={() => handleOpenReview(sub)}
                      className="px-3.5 py-1.5 bg-[#FF6A00] text-white text-xs font-bold rounded-xl hover:bg-[#EA580C] transition-colors"
                    >
                      Open Review
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 4. PUBLISHED OPPORTUNITIES SUBTAB */}
      {activeSubTab === 'published' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active International Marketplace Listings ({published.length})
            </div>
            <button
              onClick={() => setDealWizardOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Post International Deal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {published.map((opp) => (
              <div
                key={opp.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base">{opp.countryFlag} {opp.countryName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      LIVE
                    </span>
                  </div>

                  <div className="text-xs font-mono text-[#FF6A00] font-bold mt-2">{opp.reference}</div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{opp.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{opp.summary}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Value</span>
                    <span className="font-bold">{formatCurrencyValue(opp.opportunityValue, opp.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Inquiries Received</span>
                    <span className="font-bold text-emerald-600">{opp.inquiryCount || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5 & 6. MEMBERS & SUBSCRIPTIONS SUBTAB */}
      {(activeSubTab === 'members' || activeSubTab === 'subscriptions') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              International Private Access Membership Ledger ({memberships.length})
            </div>
            <button
              onClick={() => setGrantModalOpen(true)}
              className="px-3 py-1.5 bg-[#FF6A00] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Member
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Billed Amount</th>
                  <th className="py-3 px-4">Expires At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {memberships.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No international private members subscribed yet.
                    </td>
                  </tr>
                ) : (
                  memberships.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{m.userName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{m.userEmail}</td>
                      <td className="py-3 px-4 font-semibold">{m.planName}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrencyValue(m.amountPaid, m.currency)}
                      </td>
                      <td className="py-3 px-4">{new Date(m.expiresAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSubscriptionAction(m.id, 'EXTEND')}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg"
                            title="Extend access by 30 days"
                          >
                            +30 Days
                          </button>
                          <button
                            onClick={() => handleSubscriptionAction(m.id, 'CANCEL')}
                            className="px-2 py-1 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded-lg"
                            title="Cancel membership"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. COUNTRIES SUBTAB */}
      {activeSubTab === 'countries' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            International Footprint & Opportunity Distribution
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {stats.countryDistribution.map((c) => (
              <div
                key={c.code}
                className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1"
              >
                <div className="text-3xl">{c.flag}</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.name}</div>
                <div className="text-xs font-black text-[#FF6A00]">{c.count} Opportunities</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. COMMUNICATIONS SUBTAB */}
      {activeSubTab === 'communications' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Global Desk Communication Ledger
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 divide-y divide-slate-100 dark:divide-slate-800">
            {submissions.map((sub) => (
              <div key={sub.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="font-mono text-[#FF6A00]">{sub.reference}</span>
                    <span>{sub.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Contact: {sub.fullName} ({sub.whatsapp} • {sub.email})
                  </div>
                </div>

                <button
                  onClick={() => handleOpenReview(sub)}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[#FF6A00] hover:text-white text-xs font-bold rounded-lg transition-colors"
                >
                  View Timeline
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. REPORTS SUBTAB */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pipeline Value by Currency
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.totalValueByCurrency).map(([curr, val]) => (
                  <div key={curr} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold">{curr}</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {formatCurrencyValue(val, curr)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Approx. TZS Equivalent
              </h3>
              <div className="text-3xl font-black text-[#FF6A00]">
                TZS {stats.totalEquivalentTZS.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500">
                Derived from real live published international opportunities based on baseline standard conversions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW CASE DRAWER / MODAL */}
      {reviewCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-[#0B1220] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-xs font-mono font-bold text-[#FF6A00] flex items-center gap-2">
                  <span>{reviewCase.reference}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                    {reviewCase.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {reviewCase.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/admin/international/export?format=html&id=${reviewCase.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF Dossier
                </a>
                <button
                  onClick={() => setReviewCase(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Dossier info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Submitter</div>
                  <div className="font-bold">{reviewCase.fullName}</div>
                  <div className="text-[10px] text-slate-500">{reviewCase.organization || reviewCase.submitterType}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Country / City</div>
                  <div className="font-bold">{reviewCase.countryName}</div>
                  <div className="text-[10px] text-slate-500">{reviewCase.city || 'Not specified'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Declared Value</div>
                  <div className="font-bold text-[#FF6A00]">
                    {formatCurrencyValue(reviewCase.declaredValue, reviewCase.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Category</div>
                  <div className="font-bold">{reviewCase.category.replace(/_/g, ' ')}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Opportunity Description
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                  {reviewCase.description}
                </div>
              </div>

              {/* What Needed from LUMO */}
              {reviewCase.whatNeededFromLumo && (
                <div>
                  <div className="text-xs font-bold text-[#FF6A00] mb-1">
                    What is Needed From LUMO Intermediary Desk
                  </div>
                  <div className="p-3 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                    {reviewCase.whatNeededFromLumo}
                  </div>
                </div>
              )}

              {/* Website link if provided */}
              {reviewCase.website && (
                <div className="text-xs">
                  <span className="text-slate-400">Official Website: </span>
                  <a
                    href={reviewCase.website.startsWith('http') ? reviewCase.website : `https://${reviewCase.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#FF6A00] underline"
                  >
                    {reviewCase.website}
                  </a>
                </div>
              )}

              {/* Attached Files & Documents */}
              {reviewCase.documents && reviewCase.documents.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Attached Submission Files ({reviewCase.documents.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {reviewCase.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:border-[#FF6A00] transition-colors group"
                      >
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                          Document #{idx + 1} ({doc.split('/').pop()})
                        </span>
                        <Download className="w-4 h-4 text-slate-400 group-hover:text-[#FF6A00]" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Actions */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    Submitter Contacts
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    WhatsApp: {reviewCase.whatsapp} • Email: {reviewCase.email}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {caseWhatsApp?.url && (
                    <a
                      href={caseWhatsApp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Contact via WhatsApp
                    </a>
                  )}
                  <a
                    href={`mailto:${reviewCase.email}?subject=${encodeURIComponent(`LUMO International Opportunity [${reviewCase.reference}]`)}`}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Mail className="w-4 h-4" />
                    Send Email
                  </a>
                </div>
              </div>

              {/* Status Controls */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Workflow State Controls
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleTransitionStatus('UNDER_REVIEW')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded-xl text-xs font-bold"
                  >
                    Mark Under Review
                  </button>
                  <button
                    onClick={() => handleTransitionStatus('INFORMATION_REQUIRED')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-xl text-xs font-bold"
                  >
                    Request Information
                  </button>
                  <button
                    onClick={() => handleTransitionStatus('VERIFIED')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900 rounded-xl text-xs font-bold"
                  >
                    Verify Opportunity
                  </button>
                  <button
                    onClick={handlePublishCase}
                    disabled={actionLoading}
                    className="px-4 py-1.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                  >
                    Approve & Publish to Marketplace
                  </button>
                  <button
                    onClick={() => handleTransitionStatus('REJECTED')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl text-xs font-bold"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Add Note & Communication History */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Add Communication or Internal Note
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Log outreach, phone call outcome, document verification notes..."
                    value={adminNoteText}
                    onChange={(e) => setAdminNoteText(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={actionLoading || !adminNoteText.trim()}
                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl disabled:opacity-50"
                  >
                    Post Note
                  </button>
                </div>

                {/* Timeline */}
                <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
                  {caseCommunications.map((comm) => (
                    <div key={comm.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{comm.subject}</span>
                        <span>{new Date(comm.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300">{comm.messageBody}</div>
                      <div className="text-[10px] text-slate-400 italic">By {comm.actorName}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRANT MEMBERSHIP MODAL */}
      {grantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0B1220] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF6A00]" />
                Grant International Private Access
              </h3>
              <button onClick={() => setGrantModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantMembership} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">User Email *</label>
                <input
                  type="email"
                  placeholder="member@domain.com"
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">User Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={grantName}
                  onChange={(e) => setGrantName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Plan</label>
                  <select
                    value={grantPlan}
                    onChange={(e) => setGrantPlan(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="INT_MONTHLY">Monthly</option>
                    <option value="INT_SEMI_ANNUAL">Semi-Annual</option>
                    <option value="INT_ANNUAL">Annual VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                  <select
                    value={grantCurrency}
                    onChange={(e) => setGrantCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AED">AED</option>
                    <option value="KES">KES</option>
                    <option value="TZS">TZS</option>
                    <option value="ZAR">ZAR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amount Recorded</label>
                <input
                  type="number"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Administrative Notes</label>
                <input
                  type="text"
                  placeholder="e.g. VIP partner courtesy grant"
                  value={grantNotes}
                  onChange={(e) => setGrantNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGrantModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl"
                >
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin International Deal Creation Wizard Modal */}
      <AdminInternationalDealWizardModal
        isOpen={dealWizardOpen}
        onClose={() => setDealWizardOpen(false)}
        onSuccess={() => {
          fetchData()
        }}
      />
    </div>
  )
}
