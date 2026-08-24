'use client'

import React, { useState } from 'react'
import {
  Target,
  Search,
  Plus,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Lock,
  ExternalLink,
  RotateCcw,
  X,
  FileSpreadsheet,
} from 'lucide-react'
import { MOCK_BUSINESS_CONVERSIONS } from '../mockData'
import { BusinessConversionRecord, ConversionLifecycleStatus } from '../types'
import { useBusinessToast } from '../BusinessToast'

export function ConversionsResultsTab() {
  const { showToast } = useBusinessToast()

  const [conversions, setConversions] = useState<BusinessConversionRecord[]>(MOCK_BUSINESS_CONVERSIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [challengeModal, setChallengeModal] = useState<BusinessConversionRecord | null>(null)
  const [challengeReason, setChallengeReason] = useState('')
  const [showCsvModal, setShowCsvModal] = useState(false)

  const filtered = conversions.filter((c) => {
    const matchesSearch =
      c.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerRef.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleValidate = (id: string) => {
    setConversions((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'VERIFIED', verifiedAt: 'Today, Just now (Business Confirmed)' } : c
      )
    )
    showToast('success', 'Conversion Verified', 'Outcome verified and approved for escrow reward settlement.')
  }

  const handleExecuteChallenge = () => {
    if (!challengeModal || !challengeReason.trim()) {
      showToast('error', 'Validation Error', 'A specific evidence challenge reason is required.')
      return
    }

    setConversions((prev) =>
      prev.map((c) =>
        c.id === challengeModal.id
          ? {
              ...c,
              status: 'REJECTED',
              challengeReason,
              adjustmentNote: `Challenged by Business: "${challengeReason}"`,
            }
          : c
      )
    )

    showToast(
      'info',
      'Conversion Challenged',
      `Result ${challengeModal.referenceId} challenged. Escalated to LUMO compliance reviewer.`
    )
    setChallengeModal(null)
    setChallengeReason('')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Commercial Conversions & Evidence Outcomes</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
              Controlled Update & Evidence
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial outcomes submitted via dynamic QR codes, promo codes, tracking links, and API webhooks.
          </p>
        </div>

        <button
          onClick={() => setShowCsvModal(true)}
          className="py-2.5 px-4 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99]"
        >
          <Upload className="w-4 h-4 text-[#FF6A00]" />
          <span>Upload CSV Invoices</span>
        </button>
      </div>

      {/* Conversion Immutability Banner */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Conversion Lifecycle & Audit Integrity:</strong> Lifecycle: <code>Reported → Pending Validation → Verified/Rejected → Reversed</code>. Verified conversions cannot be deleted; corrections require documented adjustment records.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by conversion reference (CONV-2026-...), partner name, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Conversion Statuses</option>
            <option value="PENDING_VALIDATION">Pending Validation</option>
            <option value="VERIFIED">Verified & Approved</option>
            <option value="REJECTED">Challenged / Rejected</option>
            <option value="REVERSED">Reversed</option>
          </select>
        </div>
      </div>

      {/* Conversions Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b">
            <tr>
              <th className="p-3">Reference & Opportunity</th>
              <th className="p-3">Partner Name</th>
              <th className="p-3">Customer Reference</th>
              <th className="p-3">Sale / Reward Value</th>
              <th className="p-3">Tracking Method</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filtered.map((conv) => (
              <tr key={conv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3">
                  <div className="font-extrabold text-slate-900 dark:text-white font-mono">{conv.referenceId}</div>
                  <div className="text-[10px] text-slate-400">{conv.opportunityTitle}</div>
                </td>

                <td className="p-3 font-bold text-slate-900 dark:text-white">
                  {conv.partnerName}
                </td>

                <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                  {conv.customerRef}
                </td>

                <td className="p-3 font-mono">
                  <div className="text-slate-900 dark:text-white font-bold">
                    TZS {conv.amountTZS.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#FF6A00] font-bold">
                    Reward: TZS {conv.rewardEarnedTZS.toLocaleString()}
                  </div>
                </td>

                <td className="p-3">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    {conv.trackingMethod}
                  </span>
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      conv.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : conv.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {conv.status.replace(/_/g, ' ')}
                  </span>
                </td>

                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {conv.status === 'PENDING_VALIDATION' && (
                      <>
                        <button
                          onClick={() => handleValidate(conv.id)}
                          className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setChallengeModal(conv)}
                          className="py-1 px-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50"
                        >
                          Challenge
                        </button>
                      </>
                    )}

                    {conv.evidenceUrl && (
                      <a
                        href={conv.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 border rounded-lg text-slate-500 hover:text-slate-900"
                        title="View Evidence File"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CHALLENGE RESULT MODAL */}
      {challengeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2 text-red-600 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Challenge Conversion Result
                </h3>
              </div>
              <button onClick={() => setChallengeModal(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="text-slate-500">
                Reference: <strong>{challengeModal.referenceId}</strong> (Partner: {challengeModal.partnerName})
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Reason for Challenge / Invalidation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Customer cancelled order within 48 hours; phone screening revealed invalid contact..."
                  value={challengeReason}
                  onChange={(e) => setChallengeReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleExecuteChallenge}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs"
              >
                Submit Evidence Challenge
              </button>
              <button onClick={() => setChallengeModal(null)} className="py-2.5 px-4 border rounded-xl text-xs font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV BATCH INVOICE MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Upload Offline Batch Invoices
                </h3>
              </div>
              <button onClick={() => setShowCsvModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500">
                Upload batch retail receipts or POS invoices with customer phone numbers for automated voucher reconciliation.
              </p>

              <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-2">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-bold text-slate-700 dark:text-slate-300">Drop CSV file here</div>
                <div className="text-[10px] text-slate-400">Columns: invoice_id, partner_promo_code, amount, timestamp</div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  setShowCsvModal(false)
                  showToast('success', 'Batch Imported', 'Offline invoices matched and queued for reward validation.')
                }}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs"
              >
                Process CSV Invoices
              </button>
              <button onClick={() => setShowCsvModal(false)} className="py-2.5 px-4 border rounded-xl text-xs font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
