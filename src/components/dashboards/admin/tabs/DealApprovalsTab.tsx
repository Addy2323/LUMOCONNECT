'use client'

import React, { useState, useEffect } from 'react'
import {
  CheckCircle,
  Search,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileCheck,
  Eye,
  Building,
  Wallet,
  Clock,
  Sparkles,
  Video,
  Image as ImageIcon,
  Film,
  Play,
  Maximize2,
  X,
  FileText,
} from 'lucide-react'
import { listAdminDeals, updateDealStatus } from '@/modules/deals/service'
import { AdminDealItem } from '../types'
import { useAdminToast } from '../AdminToast'

export function DealApprovalsTab() {
  const { showToast } = useAdminToast()
  const [deals, setDeals] = useState<AdminDealItem[]>([])
  const [selectedDeal, setSelectedDeal] = useState<AdminDealItem | null>(null)
  const [mediaLightbox, setMediaLightbox] = useState<string | null>(null)
  const [approvalModal, setApprovalModal] = useState<{
    type: 'APPROVE' | 'REJECT' | 'RETURN_FOR_CORRECTION'
    deal: AdminDealItem
  } | null>(null)
  const [checkerNotes, setCheckerNotes] = useState('')

  const loadDeals = () => {
    const all = listAdminDeals() as AdminDealItem[]
    const pending = all.filter((d) => d.status === 'UNDER_REVIEW' || d.status === 'SUBMITTED')
    setDeals(pending)
    if (pending.length > 0) {
      setSelectedDeal(pending[0])
    }
  }

  useEffect(() => {
    loadDeals()
  }, [])

  // Maker-Checker checklist state
  const [checks, setChecks] = useState({
    businessVerified: true,
    rewardTermsFair: true,
    evidenceCriteriaClear: true,
    escrowFunded: true,
    prohibitedContentClear: true,
  })

  const allChecksPassed = Object.values(checks).every(Boolean)

  const handleExecuteApproval = () => {
    if (!approvalModal || !checkerNotes.trim()) {
      showToast('error', 'Validation Error', 'A checker audit note is mandatory for Maker-Checker segregation.')
      return
    }
    const { type, deal } = approvalModal

    const newStatus = type === 'APPROVE' ? 'PUBLISHED' : type === 'REJECT' ? 'REJECTED' : 'PAUSED'
    updateDealStatus(deal.id, newStatus, checkerNotes)
    setDeals((prev) => prev.filter((d) => d.id !== deal.id))

    showToast(
      'success',
      `Maker-Checker Decision: ${type}`,
      `Signed by Super Admin/Checker for "${deal.title}". Opportunity marked as ${newStatus}.`
    )
    setApprovalModal(null)
    setCheckerNotes('')
    setSelectedDeal(null)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Lightbox Modal */}
      {mediaLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setMediaLightbox(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
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
              Approval Workflow
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict Dual-Control: Validate business KYB, reward economics, media claims, escrow funding, and advertising compliance.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>Pending Checker Reviews: {deals.length}</span>
        </div>
      </div>

      {/* Segregation Rule Notice */}
      <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <strong>Maker-Checker Dual Control Rule:</strong> The internal operator who drafted the deal (Maker) cannot approve the deal for public publishing. Approval must be performed by an independent Compliance Checker.
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
          <div className="font-bold text-slate-700 dark:text-slate-300">All Submitted Deals Have Been Reviewed</div>
          <div>No pending deals in the Maker-Checker queue.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Deal Queue List (5 Cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Submitted Deals Awaiting Approval ({deals.length})
            </h3>

            {deals.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDeal(d)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all space-y-2 cursor-pointer ${
                  selectedDeal?.id === d.id
                    ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/20 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                    {d.title}
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded shrink-0">
                    {d.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{d.businessName}</span>
                  <span className="font-mono font-bold text-[#FF6A00]">
                    TZS {d.rewardValueTZS.toLocaleString()}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400">
                  Escrow: TZS {d.budgetTZS.toLocaleString()} · {d.category}
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Checker Verification Inspection & Checklist (7 Cols) */}
          {selectedDeal && (
            <div className="lg:col-span-7 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {selectedDeal.title}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Published by: <strong>{selectedDeal.businessName}</strong> · Category: <strong>{selectedDeal.category}</strong>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  v{selectedDeal.version}
                </span>
              </div>

              {/* Commercial Terms Summary Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Partner Commission</div>
                  <div className="text-base font-black text-[#FF6A00] font-mono mt-0.5">
                    TZS {selectedDeal.rewardValueTZS.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Escrow Budget Deposit</div>
                  <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    TZS {selectedDeal.budgetTZS.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* UPLOADED MEDIA & VIDEO REVIEW SECTION                     */}
              {/* ========================================================= */}
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

                {/* Media Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Promotional Video Player */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-purple-600" />
                      <span>Promotional Video Pitch</span>
                    </div>

                    {selectedDeal.promoVideoUrl ? (
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video relative group">
                        <video
                          src={selectedDeal.promoVideoUrl}
                          controls
                          className="w-full h-full object-contain"
                          poster={selectedDeal.featuredImageUrl}
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

                  {/* Cover / Banner Image Preview */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cover Banner & Media Assets</span>
                    </div>

                    {selectedDeal.featuredImageUrl ? (
                      <div
                        onClick={() => setMediaLightbox(selectedDeal.featuredImageUrl!)}
                        className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-video relative group cursor-pointer"
                        title="Click to inspect full image"
                      >
                        <img
                          src={selectedDeal.featuredImageUrl}
                          alt={selectedDeal.title}
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

                {/* Public Commercial Summary */}
                {(selectedDeal.summary || selectedDeal.description) && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#FF6A00]" />
                      <span>Public Commercial Summary:</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {selectedDeal.summary || selectedDeal.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Dual-Control Checker Checklist */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Dual-Control Checker Checklist (All Required)
                </h4>

                {[
                  {
                    key: 'businessVerified',
                    label: 'Business Identity Verified (BRELA & 2026 TRA Tax Clearance confirmed)',
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
                    key: 'escrowFunded',
                    label: 'Escrow funding confirmed in CRDB/M-Pesa settlement ledger',
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
                      className="w-4 h-4 text-[#FF6A00] rounded focus:ring-0"
                    />
                    <span className="text-slate-800 dark:text-slate-200">{item.label}</span>
                  </label>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                <button
                  disabled={!allChecksPassed}
                  onClick={() => setApprovalModal({ type: 'APPROVE', deal: selectedDeal })}
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
                  onClick={() => setApprovalModal({ type: 'RETURN_FOR_CORRECTION', deal: selectedDeal })}
                  className="py-2.5 px-3 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold rounded-xl text-xs hover:bg-purple-200 cursor-pointer"
                >
                  Return to Maker
                </button>

                <button
                  onClick={() => setApprovalModal({ type: 'REJECT', deal: selectedDeal })}
                  className="py-2.5 px-3 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* APPROVAL / REJECTION DIALOG */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#FF6A00]" />
              <span>Compliance Checker Audit Sign-Off</span>
            </h3>

            <p className="text-xs text-slate-500">
              You are rendering a formal Maker-Checker compliance decision on{' '}
              <strong>"{approvalModal.deal.title}"</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Audit Log Reason / Checker Notes (Required)
              </label>
              <textarea
                required
                value={checkerNotes}
                onChange={(e) => setCheckerNotes(e.target.value)}
                placeholder="e.g. Media assets verified, pricing compliant with Tanzania advertising standards, escrow deposit confirmed."
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setApprovalModal(null)}
                className="py-2 px-3.5 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                onClick={handleExecuteApproval}
                className={`py-2 px-4 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer ${
                  approvalModal.type === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : approvalModal.type === 'RETURN_FOR_CORRECTION'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Sign & Execute {approvalModal.type}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
