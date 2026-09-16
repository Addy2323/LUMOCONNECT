'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Eye,
  Film,
  Video,
  Image as ImageIcon,
  Maximize2,
  X,
  FileText,
  UserCheck,
  Coins,
  Calendar,
  ExternalLink,
  MessageSquare,
  Building,
  Check,
} from 'lucide-react'
import { DealMediaViewer } from '@/components/common/DealMediaViewer'
import { useAdminToast } from '../AdminToast'

interface ApprovalItem {
  id: string
  approvalRequestId: string
  title: string
  companyName: string
  organizationId: string
  type: string
  category: string
  status: string
  approvalStatus: string
  submittedAt: string
  reviewedAt: string | null
  makerUser: { id: string; name: string; email: string } | null
  checkerUser: { id: string; name: string; email: string } | null
  reviewerComments: string | null
  currency: string
  totalBudgetMinor: string
  budgetTZS: number
  originalCurrency: string
  originalDealValueMinor: string | null
  referenceCurrency: string
  referenceValueMinor: string | null
  exchangeRateUsed: number | null
  rewardDisplay: string
  commissionModel: string
  payoutStructure: string
  rewardRule: {
    ruleType: string
    fixedAmountMinor: string | null
    percentageBasisPoints: number | null
    currency: string
  } | null
  termsHash: string | null
  attributionWindowDays: number
  description?: string
  shortDescription?: string
  bannerUrl?: string
  mediaUrls?: string[]
  requirements?: string[]
  targetAudience?: string[]
  deliverables?: string[]
  contactPersonName?: string
  contactEmail?: string
  contactPhone?: string
  visibility?: string
  featured?: boolean
  createdAt: string
}

type TabKey = 'pending' | 'approved' | 'changes_requested' | 'rejected' | 'all'

export function DealApprovalsTab() {
  const { showToast } = useAdminToast()
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    changes_requested: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null)
  const [mediaLightbox, setMediaLightbox] = useState<string | null>(null)
  const [approvalModal, setApprovalModal] = useState<{
    action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'
    approval: ApprovalItem
  } | null>(null)
  const [checkerNotes, setCheckerNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Maker-Checker checklist state
  const [checks, setChecks] = useState({
    businessVerified: true,
    rewardTermsFair: true,
    evidenceCriteriaClear: true,
    commercialTermsAccepted: true,
    prohibitedContentClear: true,
  })

  const allChecksPassed = Object.values(checks).every(Boolean)

  const fetchApprovals = useCallback(async (tab: TabKey) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/approvals?status=${tab}`)
      if (!res.ok) throw new Error('Failed to load approvals')
      const data = await res.json()
      setApprovals(data.approvals || [])
      if (data.counts) setCounts(data.counts)
      if (data.approvals?.length > 0) {
        setSelectedApproval((prev) => {
          if (!prev) return data.approvals[0]
          const existing = data.approvals.find((a: ApprovalItem) => a.id === prev.id)
          return existing || data.approvals[0]
        })
      } else {
        setSelectedApproval(null)
      }
    } catch (err: any) {
      showToast('error', 'Fetch Error', err.message || 'Unable to load approval queue.')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchApprovals(activeTab)
  }, [activeTab, fetchApprovals])

  const handleExecuteDecision = async () => {
    if (!approvalModal) return
    if (!checkerNotes.trim()) {
      showToast('error', 'Validation Error', 'A checker audit note is mandatory for Maker-Checker dual control.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: approvalModal.approval.id,
          approvalRequestId: approvalModal.approval.approvalRequestId,
          action: approvalModal.action,
          notes: checkerNotes.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403 && data.code === 'MAKER_CHECKER_VIOLATION') {
          showToast('error', 'Maker-Checker Policy Violation', data.message)
          return
        }
        throw new Error(data.message || 'Decision failed.')
      }

      showToast(
        'success',
        `Decision Rendered: ${approvalModal.action}`,
        `Signed by compliance checker for "${approvalModal.approval.title}". Status updated to ${data.opportunity?.status || data.approvalStatus}.`
      )

      setApprovalModal(null)
      setCheckerNotes('')
      fetchApprovals(activeTab)
    } catch (err: any) {
      showToast('error', 'Execution Failed', err.message || 'Could not record compliance decision.')
    } finally {
      setSubmitting(false)
    }
  }

  const tabLabels: { key: TabKey; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending Checker', count: counts.pending },
    { key: 'approved', label: 'Approved & Live', count: counts.approved },
    { key: 'changes_requested', label: 'Changes Requested', count: counts.changes_requested },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
    { key: 'all', label: 'All Records', count: counts.all },
  ]

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Media Lightbox */}
      {mediaLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setMediaLightbox(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={mediaLightbox}
              alt="Full Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Deal Approvals & Maker-Checker Queue</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-2 py-0.5 rounded-full">
              PostgreSQL Dual-Control
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict Dual-Control: Validate merchant identity, reward terms, media assets, direct settlement terms, and advertising compliance.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <button
            onClick={() => fetchApprovals(activeTab)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 text-xs cursor-pointer"
            title="Refresh"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] px-3 py-1.5 rounded-xl border border-orange-200/60 dark:border-orange-800/60 font-black">
            <Clock className="w-4 h-4" />
            <span>Pending Review: {counts.pending}</span>
          </div>
        </div>
      </div>

      {/* Segregation Rule Notice */}
      <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <strong>Maker-Checker Dual Control Rule:</strong> The internal operator or business user who drafted and submitted the deal (Maker) cannot approve the deal for public publishing. Approval must be performed by an independent Compliance Checker.
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        {tabLabels.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === t.key
                ? 'bg-[#FF6A00] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === t.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <Clock className="w-8 h-8 animate-spin text-[#FF6A00] mx-auto mb-2 opacity-80" />
          <div>Loading database approval requests...</div>
        </div>
      ) : approvals.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
          <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">No items in this tab</div>
          <div className="text-slate-400 mt-1">There are no deals matching the "{activeTab.replace('_', ' ')}" criteria.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Deal Queue List (5 Cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              {activeTab === 'pending' ? 'Awaiting Checker Approval' : 'Deals Registry'} ({approvals.length})
            </h3>

            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {approvals.map((d) => {
                const isSelected = selectedApproval?.id === d.id
                return (
                  <button
                    key={d.approvalRequestId || d.id}
                    onClick={() => setSelectedApproval(d)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all space-y-2 cursor-pointer ${
                      isSelected
                        ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/30 dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                        {d.title}
                      </div>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 uppercase ${
                          d.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : d.approvalStatus === 'CHANGES_REQUESTED'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                            : d.approvalStatus === 'REJECTED'
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {d.approvalStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="truncate max-w-[160px] font-medium">{d.companyName}</span>
                      <span className="font-mono font-bold text-[#FF6A00] shrink-0">
                        {d.rewardDisplay}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Maker: {d.makerUser?.name || 'Business'}</span>
                      <span>Submitted: {d.submittedAt.slice(0, 10)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column: Checker Verification Inspection & Checklist (7 Cols) */}
          {selectedApproval && (
            <div className="lg:col-span-7 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4 max-h-[850px] overflow-y-auto">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {selectedApproval.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Merchant: <strong>{selectedApproval.companyName}</strong> · Category: {selectedApproval.category}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      selectedApproval.approvalStatus === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedApproval.approvalStatus === 'CHANGES_REQUESTED'
                        ? 'bg-purple-100 text-purple-800'
                        : selectedApproval.approvalStatus === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedApproval.approvalStatus.replace('_', ' ')}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    ID: {selectedApproval.id.slice(0, 8)}...
                  </div>
                </div>
              </div>

              {/* Maker vs Checker Badges */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Maker (Creator)</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedApproval.makerUser?.name || 'Business User'}
                  </div>
                  <div className="text-[10px] text-slate-400">{selectedApproval.makerUser?.email || 'N/A'}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Checker (Compliance)</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedApproval.checkerUser?.name || 'Pending Review'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {selectedApproval.reviewedAt ? `Decided: ${selectedApproval.reviewedAt.slice(0, 10)}` : 'Awaiting sign-off'}
                  </div>
                </div>
              </div>

              {/* Reviewer Comments (if any) */}
              {selectedApproval.reviewerComments && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Checker Review Comments:</span>
                  </div>
                  <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                    {selectedApproval.reviewerComments}
                  </p>
                </div>
              )}

              {/* Economic & Multi-Currency Summary */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Partner Unit Reward</div>
                  <div className="text-sm font-black text-[#FF6A00] font-mono mt-0.5">
                    {selectedApproval.rewardDisplay}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Model: {selectedApproval.commissionModel} ({selectedApproval.payoutStructure})
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Budget (Authoritative)</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    {selectedApproval.currency} {selectedApproval.budgetTZS.toLocaleString()}
                  </div>
                  {selectedApproval.originalCurrency !== selectedApproval.currency && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Orig: {selectedApproval.originalCurrency} · Rate: {selectedApproval.exchangeRateUsed}
                    </div>
                  )}
                </div>
              </div>

              {/* Media Review Section */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#FF6A00]" />
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Uploaded Media & Promotional Assets Review
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF6A00] dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/60">
                    Content Verification
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Video Player */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-purple-600" />
                      <span>Promotional Video Pitch</span>
                    </div>

                    {selectedApproval.bannerUrl?.includes('mp4') || selectedApproval.bannerUrl?.includes('webm') ? (
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video relative group">
                        <DealMediaViewer
                          mediaUrl={selectedApproval.bannerUrl}
                          altTitle={selectedApproval.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 text-center text-xs text-slate-400 aspect-video flex flex-col items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800/40">
                        <Video className="w-6 h-6 opacity-30 text-slate-400" />
                        <span className="font-semibold">No Video Attached</span>
                        <span className="text-[10px] text-slate-400">Deal relies on banner graphics</span>
                      </div>
                    )}
                  </div>

                  {/* Banner Preview */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cover Banner Asset</span>
                    </div>

                    {selectedApproval.bannerUrl ? (
                      <div
                        onClick={() => setMediaLightbox(selectedApproval.bannerUrl!)}
                        className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-video relative group cursor-pointer"
                        title="Click to inspect full image"
                      >
                        <img
                          src={selectedApproval.bannerUrl}
                          alt={selectedApproval.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                          <Maximize2 className="w-4 h-4" />
                          <span>Inspect Full Banner</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 text-center text-xs text-slate-400 aspect-video flex flex-col items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800/40">
                        <ImageIcon className="w-6 h-6 opacity-30 text-slate-400" />
                        <span className="font-semibold">Default Banner</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Media Assets */}
                {selectedApproval.mediaUrls && selectedApproval.mediaUrls.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Additional Media ({selectedApproval.mediaUrls.length})
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedApproval.mediaUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Asset ${i + 1}`}
                          onClick={() => setMediaLightbox(url)}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {(selectedApproval.description || selectedApproval.shortDescription) && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#FF6A00]" />
                      <span>Opportunity Description & Scope:</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {selectedApproval.description || selectedApproval.shortDescription}
                    </p>
                  </div>
                )}
              </div>

              {/* Requirements & Target Audience */}
              {((selectedApproval.requirements && selectedApproval.requirements.length > 0) ||
                (selectedApproval.targetAudience && selectedApproval.targetAudience.length > 0)) && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  {selectedApproval.requirements && selectedApproval.requirements.length > 0 && (
                    <div>
                      <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">Partner Requirements:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApproval.requirements.map((req, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] text-slate-600 dark:text-slate-400">
                            ✓ {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApproval.targetAudience && selectedApproval.targetAudience.length > 0 && (
                    <div className="pt-1">
                      <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">Target Audience:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApproval.targetAudience.map((aud, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-md text-[10px]">
                            {aud}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dual-Control Checker Checklist (Shown for Pending) */}
              {selectedApproval.approvalStatus === 'PENDING_CHECKER' && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Dual-Control Checker Checklist (All Required for Approval)
                  </h4>

                  {[
                    {
                      key: 'businessVerified',
                      label: 'Business Identity Verified (BRELA & Tax Clearance confirmed)',
                    },
                    {
                      key: 'rewardTermsFair',
                      label: 'Commercial terms comply with fair-trade and margin safeguards',
                    },
                    {
                      key: 'evidenceCriteriaClear',
                      label: 'Evidence requirements defined & verifiable (GPS/Invoice/QR scan)',
                    },
                    {
                      key: 'commercialTermsAccepted',
                      label: 'Commercial terms accepted & direct settlement model confirmed',
                    },
                    {
                      key: 'prohibitedContentClear',
                      label: 'Zero prohibited substances, deceptive advertising, or MLM schemes',
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(checks as any)[item.key]}
                        onChange={(e) =>
                          setChecks({ ...checks, [item.key]: e.target.checked })
                        }
                        className="w-4 h-4 text-[#FF6A00] rounded focus:ring-0 cursor-pointer"
                      />
                      <span className="text-slate-800 dark:text-slate-200">{item.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {selectedApproval.approvalStatus === 'PENDING_CHECKER' ? (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                  <button
                    disabled={!allChecksPassed}
                    onClick={() => setApprovalModal({ action: 'APPROVE', approval: selectedApproval })}
                    className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                      allChecksPassed
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Checker Approve & Publish</span>
                  </button>

                  <button
                    onClick={() => setApprovalModal({ action: 'REQUEST_CHANGES', approval: selectedApproval })}
                    className="py-2.5 px-3 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold rounded-xl text-xs hover:bg-purple-200 cursor-pointer"
                  >
                    Request Changes (Return)
                  </button>

                  <button
                    onClick={() => setApprovalModal({ action: 'REJECT', approval: selectedApproval })}
                    className="py-2.5 px-3 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 cursor-pointer"
                  >
                    Reject Deal
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                  <span>This opportunity has already been finalized ({selectedApproval.approvalStatus}).</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* APPROVAL / REJECTION / RETURN DIALOG */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#FF6A00]" />
              <span>Compliance Checker Audit Sign-Off</span>
            </h3>

            <p className="text-xs text-slate-500">
              You are rendering a formal Maker-Checker compliance decision on{' '}
              <strong>"{approvalModal.approval.title}"</strong>.
            </p>

            <div className="text-xs bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-slate-600 dark:text-slate-300">
              Maker: <strong>{approvalModal.approval.makerUser?.name || 'Business'}</strong>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Audit Reason & Checker Notes (Mandatory)
              </label>
              <textarea
                required
                value={checkerNotes}
                onChange={(e) => setCheckerNotes(e.target.value)}
                placeholder={
                  approvalModal.action === 'APPROVE'
                    ? 'e.g. Media verified, fair-trade pricing confirmed, terms hash verified, approved for marketplace publishing.'
                    : approvalModal.action === 'REQUEST_CHANGES'
                    ? 'e.g. Please clarify the customer verification proof and update banner image resolution.'
                    : 'e.g. Deal violates advertising policies or non-compliant commission structure.'
                }
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-[#FF6A00] outline-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={submitting}
                onClick={() => setApprovalModal(null)}
                className="py-2 px-3.5 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={submitting || !checkerNotes.trim()}
                onClick={handleExecuteDecision}
                className={`py-2 px-4 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  approvalModal.action === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : approvalModal.action === 'REQUEST_CHANGES'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting ? 'Executing...' : `Sign & Execute ${approvalModal.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
