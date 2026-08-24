'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import { MOCK_ADMIN_DEALS } from '../mockData'
import { AdminDealItem } from '../types'
import { useAdminToast } from '../AdminToast'

export function DealApprovalsTab() {
  const { showToast } = useAdminToast()
  const [deals, setDeals] = useState<AdminDealItem[]>(
    MOCK_ADMIN_DEALS.filter((d) => d.status === 'UNDER_REVIEW' || d.status === 'SUBMITTED')
  )
  const [selectedDeal, setSelectedDeal] = useState<AdminDealItem | null>(deals[0] || null)
  const [approvalModal, setApprovalModal] = useState<{
    type: 'APPROVE' | 'REJECT' | 'RETURN_FOR_CORRECTION'
    deal: AdminDealItem
  } | null>(null)
  const [checkerNotes, setCheckerNotes] = useState('')

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

    setDeals((prev) => prev.filter((d) => d.id !== deal.id))
    showToast(
      'success',
      `Maker-Checker decision ${type}`,
      `Signed by Super Admin/Checker for "${deal.title}". Notes logged in audit ledger.`
    )
    setApprovalModal(null)
    setCheckerNotes('')
    setSelectedDeal(null)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
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
            Strict Dual-Control: Validate business KYB, reward economics, conversion criteria, escrow funding, and compliance.
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
                className={`w-full p-3.5 rounded-2xl border text-left transition-all space-y-2 ${
                  selectedDeal?.id === d.id
                    ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/20 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                    {d.title}
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded shrink-0">
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
                    Published by: <strong>{selectedDeal.businessName}</strong>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2 py-1 bg-white dark:bg-slate-900 rounded-lg border">
                  v{selectedDeal.version}
                </span>
              </div>

              {/* Commercial Terms Summary Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Partner Commission</div>
                  <div className="text-base font-black text-[#FF6A00] font-mono mt-0.5">
                    TZS {selectedDeal.rewardValueTZS.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Escrow Budget Deposit</div>
                  <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    TZS {selectedDeal.budgetTZS.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Dual-Control Checker Checklist */}
              <div className="space-y-2 pt-2">
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
                  className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                    allChecksPassed
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Checker Approve & Publish</span>
                </button>

                <button
                  onClick={() => setApprovalModal({ type: 'RETURN_FOR_CORRECTION', deal: selectedDeal })}
                  className="py-2.5 px-3 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold rounded-xl text-xs hover:bg-purple-200"
                >
                  Return to Maker
                </button>

                <button
                  onClick={() => setApprovalModal({ type: 'REJECT', deal: selectedDeal })}
                  className="py-2.5 px-3 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* APPROVAL DECISION MODAL */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Record Maker-Checker Action: {approvalModal.type}</span>
            </h3>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Deal: <strong>{approvalModal.deal.title}</strong>
            </div>

            <div className="text-xs space-y-1">
              <label className="font-bold block text-slate-800 dark:text-slate-200">
                Checker Approval Notes / Reasons <span className="text-red-500">* (Mandatory)</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Escrow deposit verified at CRDB Bank. Evidence requirements confirmed with operations team..."
                value={checkerNotes}
                onChange={(e) => setCheckerNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExecuteApproval}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs"
              >
                Sign & Authorize Deal
              </button>
              <button
                onClick={() => setApprovalModal(null)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
