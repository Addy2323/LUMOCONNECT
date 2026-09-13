'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Phone,
  FileText,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Users,
  Search,
  Filter,
  Check,
  X,
  Play,
  Pause,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { useAdminToast } from '../AdminToast'
import { calculateSmsSegments, SYSTEM_SMS_TEMPLATES } from '@/modules/sms/templates'

export function AdminSmsCenterTab() {
  const { showToast } = useAdminToast()

  // State
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'campaigns' | 'templates' | 'sender_ids' | 'funding'>('logs')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Live Stats
  const [statsData, setStatsData] = useState<{
    config?: {
      isConfigured: boolean
      dryRun: boolean
      enabled: boolean
      senderId: string
      isSenderIdApproved: boolean
    }
    providerStats?: {
      balance?: number
      total_sms_sent?: number
    } | null
    senderIds?: Array<{ name: string; status: string; category?: string }>
    localStore?: {
      totalJobs: number
      submitted: number
      pending: number
      uncertain: number
      failed: number
      cancelled: number
      totalBatches: number
      activeCampaigns: number
    }
  }>({})

  // Logs & Jobs
  const [jobs, setJobs] = useState<any[]>([])
  const [jobFilterStatus, setJobFilterStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Sender ID Modal
  const [showSenderIdModal, setShowSenderIdModal] = useState(false)
  const [newSenderId, setNewSenderId] = useState({ name: '', sampleMessage: '', category: 'TRANSACTIONAL' })
  const [submittingSenderId, setSubmittingSenderId] = useState(false)

  // Segment Calculator
  const [calcText, setCalcText] = useState('LUMO: Malipo yako ya TZS 150,000 yamethibitishwa. Asante kwa kutumia LUMO.')
  const [calcMetrics, setCalcMetrics] = useState(calculateSmsSegments(calcText))

  // Campaign State
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    messageText: 'LUMO Update: Jiunge na semina yetu ya wauzaji Alhamisi hii. Jisajili sasa!',
    rawRecipients: '0712345678\n0754123456\n0789654321',
    consentConfirmed: false,
  })
  const [campaignEstimate, setCampaignEstimate] = useState<any>(null)
  const [dispatchingCampaign, setDispatchingCampaign] = useState(false)

  // Funding State
  const [fundingAmount, setFundingAmount] = useState('20000')
  const [fundingMethod, setFundingMethod] = useState<'USSD' | 'ZENOPAY'>('USSD')
  const [fundingPhone, setFundingPhone] = useState('0712345678')
  const [fundingProvider, setFundingProvider] = useState('M-PESA')
  const [fundingHistory, setFundingHistory] = useState<any[]>([])
  const [fundingLoading, setFundingLoading] = useState(false)

  // Fetch Stats & Health
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sms/stats')
      if (res.ok) {
        const data = await res.json()
        setStatsData(data)
      }
    } catch {
      // Fallback in dev/offline
    }
  }, [])

  // Fetch Jobs
  const loadJobs = useCallback(async () => {
    try {
      const url = jobFilterStatus !== 'ALL'
        ? `/api/admin/sms/jobs?status=${jobFilterStatus}`
        : '/api/admin/sms/jobs'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
      }
    } catch {
      // Fallback
    }
  }, [jobFilterStatus])

  // Fetch Campaigns
  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sms/campaigns')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      }
    } catch {}
  }, [])

  // Fetch Funding History
  const loadFunding = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sms/funding')
      if (res.ok) {
        const data = await res.json()
        setFundingHistory(data.history || [])
      }
    } catch {}
  }, [])

  const refreshAll = async () => {
    setRefreshing(true)
    await Promise.all([loadStats(), loadJobs(), loadCampaigns(), loadFunding()])
    setRefreshing(false)
  }

  useEffect(() => {
    refreshAll()
  }, [loadJobs, loadStats, loadCampaigns, loadFunding])

  // Update calculator when text changes
  const handleCalcTextChange = (text: string) => {
    setCalcText(text)
    setCalcMetrics(calculateSmsSegments(text))
  }

  // Handle Retry Job
  const handleRetryJob = async (jobId: string) => {
    try {
      const res = await fetch('/api/admin/sms/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RETRY', jobId }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('success', 'Job Retried', 'SMS job re-queued for dispatch.')
        loadJobs()
        loadStats()
      } else {
        showToast('error', 'Retry Failed', data.error || 'Could not retry job.')
      }
    } catch {
      showToast('error', 'Network Error', 'Failed to connect to server.')
    }
  }

  // Handle Cancel Job
  const handleCancelJob = async (jobId: string) => {
    try {
      const res = await fetch('/api/admin/sms/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL', jobId }),
      })
      if (res.ok) {
        showToast('info', 'Job Cancelled', 'SMS dispatch has been cancelled.')
        loadJobs()
        loadStats()
      }
    } catch {}
  }

  // Request Sender ID
  const handleRequestSenderId = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingSenderId(true)
    try {
      const res = await fetch('/api/admin/sms/sender-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSenderId),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('success', 'Sender ID Submitted', 'Your request has been submitted for TCRA regulatory review.')
        setShowSenderIdModal(false)
        setNewSenderId({ name: '', sampleMessage: '', category: 'TRANSACTIONAL' })
        loadStats()
      } else {
        showToast('error', 'Submission Error', data.error || 'Failed to submit Sender ID.')
      }
    } catch {
      showToast('error', 'Network Error', 'Connection failure.')
    } finally {
      setSubmittingSenderId(false)
    }
  }

  // Estimate Campaign
  const handleEstimateCampaign = async () => {
    const list = campaignForm.rawRecipients.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
    try {
      const res = await fetch('/api/admin/sms/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ESTIMATE',
          messageText: campaignForm.messageText,
          recipients: list,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCampaignEstimate(data)
      }
    } catch {}
  }

  // Dispatch Campaign
  const handleDispatchCampaign = async () => {
    if (!campaignForm.consentConfirmed) {
      showToast('error', 'Consent Required', 'You must verify opt-in consent before dispatching broadcasts.')
      return
    }

    const list = campaignForm.rawRecipients.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
    setDispatchingCampaign(true)
    try {
      const res = await fetch('/api/admin/sms/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISPATCH',
          name: campaignForm.name,
          messageText: campaignForm.messageText,
          recipients: list,
          audienceConsentConfirmed: true,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('success', 'Campaign Dispatched', `Submitted to ${data.recipientsCount} recipients.`)
        setShowCampaignModal(false)
        loadCampaigns()
        loadJobs()
        loadStats()
      } else {
        showToast('error', 'Dispatch Failed', data.error || 'Could not send campaign.')
      }
    } catch {
      showToast('error', 'Network Error', 'Connection failed.')
    } finally {
      setDispatchingCampaign(false)
    }
  }

  // Initiate Funding Top-Up
  const handleInitiateFunding = async (e: React.FormEvent) => {
    e.preventDefault()
    setFundingLoading(true)
    try {
      const res = await fetch('/api/admin/sms/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: fundingMethod,
          amount: fundingAmount,
          phone: fundingPhone,
          provider: fundingProvider,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        if (fundingMethod === 'ZENOPAY' && data.paymentUrl) {
          window.open(data.paymentUrl, '_blank')
          showToast('info', 'ZenoPay Gateway', 'Opened payment page in new window.')
        } else {
          showToast('success', 'USSD Push Sent', 'Please approve the PIN prompt on your phone.')
        }
        loadFunding()
        loadStats()
      } else {
        showToast('error', 'Funding Error', data.error || 'Failed to initiate credit top-up.')
      }
    } catch {
      showToast('error', 'Network Error', 'Connection failure.')
    } finally {
      setFundingLoading(false)
    }
  }

  // Filtered jobs
  const filteredJobs = jobs.filter((j) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      j.recipientPhone?.toLowerCase().includes(q) ||
      j.templateCode?.toLowerCase().includes(q) ||
      j.batchId?.toLowerCase().includes(q) ||
      j.operator?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* 1. TOP STATUS & GATEWAY HEADER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#FF6A00] flex items-center justify-center font-black">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Meseji SMS Operations Centre
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Tanzania Telco Gateway
                </span>
                {statsData.config?.dryRun && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    DRY RUN ACTIVE
                  </span>
                )}
                {!statsData.config?.enabled && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                    LIVE SENDING DISABLED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Direct SMS gateway for Vodacom M-Pesa, Airtel Money, Tigo, Halotel & TTCL.
                Aggregate delivery reconciliation mode enabled.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={refreshAll}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setActiveSubTab('funding')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#FF6A00] hover:bg-[#e55f00] text-white shadow-sm transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Top Up SMS Credits
            </button>
          </div>
        </div>

        {/* Operational Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Configured Sender ID
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
              <span>{statsData.config?.senderId || 'Lumo'}</span>
              {statsData.config?.isSenderIdApproved ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                  <Clock className="w-3 h-3" /> PENDING TCRA
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Provider SMS Balance
            </div>
            <div className="mt-1 text-base font-black text-slate-900 dark:text-white">
              {statsData.providerStats?.balance !== undefined
                ? `${statsData.providerStats.balance.toLocaleString()} SMS`
                : '10,000 SMS (Dry Run)'}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Local Jobs Processed
            </div>
            <div className="mt-1 text-base font-black text-slate-900 dark:text-white">
              {(statsData.localStore?.totalJobs || 0).toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Failed / Uncertain Queue
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`text-base font-black ${(statsData.localStore?.failed || 0) + (statsData.localStore?.uncertain || 0) > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                {(statsData.localStore?.failed || 0) + (statsData.localStore?.uncertain || 0)}
              </span>
              {(statsData.localStore?.uncertain || 0) > 0 && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                  {statsData.localStore?.uncertain} Uncertain
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Regulatory & Reconciliation Banner */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300">Delivery Status Transparency: </span>
            Meseji provides aggregate batch delivery counts via telco endpoints. In adherence with telco privacy regulations, individual recipient delivery receipts are not returned. All individual recipient records are presented as <em>&quot;Recipient delivery unavailable (Batch aggregate stats only)&quot;</em>.
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'logs', label: 'Dispatch Logs & Batches', icon: FileText },
          { id: 'campaigns', label: 'Bulk Campaigns', icon: Users },
          { id: 'templates', label: 'Templates & Segment Math', icon: Sparkles },
          { id: 'sender_ids', label: 'Sender IDs & TCRA', icon: ShieldCheck },
          { id: 'funding', label: 'SMS Credit Top-Up', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 3. SUB-TAB CONTENT */}

      {/* TAB: DISPATCH LOGS */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by phone, template, batch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FF6A00] w-64"
                />
              </div>

              <select
                value={jobFilterStatus}
                onChange={(e) => setJobFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="PENDING">PENDING</option>
                <option value="UNCERTAIN">UNCERTAIN</option>
                <option value="FAILED">FAILED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Showing {filteredJobs.length} dispatch logs (OTPs automatically redacted)
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Recipient</th>
                    <th className="p-3.5">Operator</th>
                    <th className="p-3.5">Channel / Template</th>
                    <th className="p-3.5">Segments</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Delivery Reconciliation</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No SMS logs matching the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-white font-mono">
                            {job.recipientPhone}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(job.createdAt).toLocaleTimeString()} · {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {job.operator || 'TANZANIA'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {job.channel || 'TRANSACTIONAL'}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">
                            {job.templateCode || 'CUSTOM_MESSAGE'}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono">
                          {job.segments || 1} ({job.isGsm7 ? 'GSM-7' : 'UCS-2'})
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              job.status === 'SUBMITTED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : job.status === 'UNCERTAIN'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : job.status === 'FAILED'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="text-[11px] text-slate-500 italic">
                            Recipient delivery unavailable
                          </div>
                          {job.batchId && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Batch: {job.batchId}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {(job.status === 'FAILED' || job.status === 'UNCERTAIN') && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleRetryJob(job.id)}
                                className="px-2 py-1 text-[10px] font-bold rounded bg-orange-50 text-[#FF6A00] hover:bg-orange-100 transition-colors"
                              >
                                Retry
                              </button>
                              {job.status === 'UNCERTAIN' && (
                                <button
                                  onClick={() => handleCancelJob(job.id)}
                                  className="px-2 py-1 text-[10px] font-bold rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
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

      {/* TAB: BULK CAMPAIGNS */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Controlled Broadcast Campaigns
              </h3>
              <p className="text-xs text-slate-500">
                Audience opt-in consent verification, duplicate phone suppression, and segment cost estimation.
              </p>
            </div>
            <button
              onClick={() => setShowCampaignModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#FF6A00] text-white shadow-sm hover:bg-[#e55f00] transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              New Broadcast Campaign
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No bulk campaigns created yet. Click &quot;New Broadcast Campaign&quot; to launch one.
              </div>
            ) : (
              campaigns.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : c.status === 'ACTIVE'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-[11px]">
                    &quot;{c.messageText}&quot;
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      Recipients: <span className="font-bold text-slate-800 dark:text-white">{c.totalRecipients}</span>
                    </div>
                    <div>
                      Est. Cost: <span className="font-bold text-slate-800 dark:text-white">TZS {(c.costEstimateTzs || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: TEMPLATES & SEGMENT CALCULATOR */}
      {activeSubTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interactive Calculator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF6A00]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Live SMS Segment & Cost Calculator
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Telco standards calculate 160 characters (GSM-7) or 70 characters (UCS-2 Unicode) per single SMS. Concatenated multipart SMS uses 153 or 67 characters per segment.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Test Message Text
              </label>
              <textarea
                rows={4}
                value={calcText}
                onChange={(e) => handleCalcTextChange(e.target.value)}
                className="w-full p-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Characters</div>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  {calcMetrics.characterCount}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Encoding</div>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  {calcMetrics.isGsm7 ? 'GSM-7' : 'UCS-2'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Segments</div>
                <div className="text-base font-black text-[#FF6A00]">
                  {calcMetrics.segmentCount}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Max / Part</div>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  {calcMetrics.maxCharsPerSegment}
                </div>
              </div>
            </div>
          </div>

          {/* Standard Transactional Templates Preview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 max-h-[600px] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              System Templates ({Object.keys(SYSTEM_SMS_TEMPLATES).length})
            </h3>
            <p className="text-xs text-slate-500">
              Approved system templates with bilingual English & Swahili variable interpolations.
            </p>

            <div className="space-y-3">
              {Object.values(SYSTEM_SMS_TEMPLATES).map((tmpl) => (
                <div
                  key={tmpl.code}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {tmpl.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {tmpl.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 mb-0.5">EN:</div>
                    {tmpl.templateEn}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 mb-0.5">SW:</div>
                    {tmpl.templateSw}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: SENDER IDS & TCRA */}
      {activeSubTab === 'sender_ids' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                TCRA Approved Sender IDs
              </h3>
              <p className="text-xs text-slate-500">
                Regulatory compliance requires all Tanzanian commercial SMS to utilize TCRA-vetted Alphanumeric Sender IDs (1-11 characters).
              </p>
            </div>
            <button
              onClick={() => setShowSenderIdModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#FF6A00] text-white shadow-sm hover:bg-[#e55f00] transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Request New Sender ID
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(statsData.senderIds || [
              { name: 'Lumo', status: 'APPROVED', category: 'TRANSACTIONAL' },
              { name: 'LUMOALERT', status: 'PENDING', category: 'NOTIFICATIONS' },
            ]).map((sid, idx) => (
              <div key={idx} className="py-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-sm font-mono">{sid.name}</span>
                    <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {sid.category || 'TRANSACTIONAL'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {sid.name === (statsData.config?.senderId || 'Lumo') ? 'Primary configured sender ID in .env' : 'Secondary brand sender ID'}
                  </div>
                </div>
                <div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      sid.status === 'APPROVED' || sid.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {sid.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SMS CREDIT TOP-UP */}
      {activeSubTab === 'funding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Purchase SMS Credits
            </h3>
            <p className="text-xs text-slate-500">
              Direct mobile money push or ZenoPay online payment gateway. Minimum TZS 1,000.
            </p>

            <form onSubmit={handleInitiateFunding} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFundingMethod('USSD')}
                    className={`p-2.5 text-xs font-bold rounded-xl border transition-all ${
                      fundingMethod === 'USSD'
                        ? 'border-[#FF6A00] bg-orange-50/40 text-[#FF6A00]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    USSD Push
                  </button>
                  <button
                    type="button"
                    onClick={() => setFundingMethod('ZENOPAY')}
                    className={`p-2.5 text-xs font-bold rounded-xl border transition-all ${
                      fundingMethod === 'ZENOPAY'
                        ? 'border-[#FF6A00] bg-orange-50/40 text-[#FF6A00]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ZenoPay Web
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (TZS)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              {fundingMethod === 'USSD' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Network
                    </label>
                    <select
                      value={fundingProvider}
                      onChange={(e) => setFundingProvider(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="M-PESA">Vodacom M-Pesa</option>
                      <option value="AIRTEL">Airtel Money</option>
                      <option value="TIGO">Tigo Pesa</option>
                      <option value="HALOTEL">Halotel HaloPesa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payer Mobile Phone
                    </label>
                    <input
                      type="text"
                      value={fundingPhone}
                      onChange={(e) => setFundingPhone(e.target.value)}
                      placeholder="07XXXXXXXX"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={fundingLoading}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-[#FF6A00] text-white shadow-sm hover:bg-[#e55f00] transition-colors disabled:opacity-50"
              >
                {fundingLoading ? 'Processing...' : `Authorize TZS ${Number(fundingAmount).toLocaleString()}`}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Funding & Top-up History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/70 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fundingHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        No credit funding records found.
                      </td>
                    </tr>
                  ) : (
                    fundingHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                          {item.reference}
                        </td>
                        <td className="p-3">{item.method}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          TZS {item.amountTzs.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()}
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

      {/* MODAL: SENDER ID REQUEST */}
      {showSenderIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowSenderIdModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#FF6A00]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Request Alphanumeric Sender ID
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              TCRA mandates that Sender IDs must be 1 to 11 alphanumeric characters and accompanied by an approved sample message of at least 10 words.
            </p>

            <form onSubmit={handleRequestSenderId} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sender ID Name (1-11 characters)
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={newSenderId.name}
                  onChange={(e) => setNewSenderId({ ...newSenderId, name: e.target.value.toUpperCase() })}
                  placeholder="e.g. LUMO"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sample Message for TCRA Review (min 10 words)
                </label>
                <textarea
                  rows={3}
                  value={newSenderId.sampleMessage}
                  onChange={(e) => setNewSenderId({ ...newSenderId, sampleMessage: e.target.value })}
                  placeholder="e.g. Malipo yako ya TZS 50,000 kwa agizo namba ORD-102 yamethibitishwa kikamilifu kupitia LUMO."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
                <div className="text-[10px] text-slate-400 mt-1">
                  Word count: {newSenderId.sampleMessage.trim() ? newSenderId.sampleMessage.trim().split(/\s+/).length : 0} / 10 words required
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingSenderId}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-[#FF6A00] text-white shadow-sm hover:bg-[#e55f00] transition-colors disabled:opacity-50"
              >
                {submittingSenderId ? 'Submitting to TCRA...' : 'Submit Sender ID for Regulatory Approval'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW BULK CAMPAIGN */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCampaignModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF6A00]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Launch Controlled SMS Campaign
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campaign Title
                </label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="e.g. Q3 Merchant Webinar Announcement"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Broadcast Message
                </label>
                <textarea
                  rows={3}
                  value={campaignForm.messageText}
                  onChange={(e) => setCampaignForm({ ...campaignForm, messageText: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Numbers (one per line or comma-separated)
                </label>
                <textarea
                  rows={4}
                  value={campaignForm.rawRecipients}
                  onChange={(e) => setCampaignForm({ ...campaignForm, rawRecipients: e.target.value })}
                  placeholder="0712345678&#10;0789123456"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEstimateCampaign}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Calculate Cost Estimate
                </button>
                {campaignEstimate && (
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold">{campaignEstimate.uniqueValidRecipients}</span> recipients ·{' '}
                    <span className="font-bold">{campaignEstimate.totalBillableSegments}</span> segments (~TZS{' '}
                    {campaignEstimate.estimatedCostTzs?.toLocaleString()})
                  </div>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                <label className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={campaignForm.consentConfirmed}
                    onChange={(e) => setCampaignForm({ ...campaignForm, consentConfirmed: e.target.checked })}
                    className="mt-0.5 rounded border-amber-300 text-[#FF6A00] focus:ring-[#FF6A00]"
                  />
                  <span>
                    <strong>TCRA Opt-in Compliance Confirmation:</strong> I confirm that all recipient numbers in this list have explicitly opted in to receive commercial notifications from LUMO, and adhere to TCRA anti-spam policies.
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleDispatchCampaign}
                disabled={dispatchingCampaign || !campaignForm.consentConfirmed || !campaignForm.name}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-[#FF6A00] text-white shadow-sm hover:bg-[#e55f00] transition-colors disabled:opacity-50"
              >
                {dispatchingCampaign ? 'Broadcasting Batch...' : 'Confirm and Dispatch Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
