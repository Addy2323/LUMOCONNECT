'use client'

import React, { useState } from 'react'
import {
  Award,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Download,
  Wallet,
  Building,
  Clock,
  RotateCcw,
  Receipt,
  FileSpreadsheet,
  X,
  FileText,
} from 'lucide-react'
import { MOCK_REWARD_BATCHES } from '../mockData'
import { RewardPayoutBatch } from '../types'
import { useAdminToast } from '../AdminToast'

export function RewardsPayoutsTab() {
  const { showToast } = useAdminToast()

  const [batches, setBatches] = useState<RewardPayoutBatch[]>(MOCK_REWARD_BATCHES)
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false)
  const [statementViewerModal, setStatementViewerModal] = useState<RewardPayoutBatch | null>(null)

  const [newBatchForm, setNewBatchForm] = useState({
    partnerCount: 48,
    grossTZS: 8600000,
  })

  const handleDisburseBatch = (id: string) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'COMPLETED',
              disbursedAt: 'Just now via Vodacom M-Pesa B2C Bulk API',
            }
          : b
      )
    )
    showToast('success', 'Mobile Money Payouts Dispatched', 'Batch disbursement successfully processed via Telco B2C Bulk Gateway.')
  }

  const handleCreateBatch = () => {
    const gross = Number(newBatchForm.grossTZS)
    const tax = gross * 0.05 // 5% TRA Withholding
    const net = gross - tax

    const newBatch: RewardPayoutBatch = {
      id: `batch_${Date.now()}`,
      batchNumber: `LUMO-DISB-2026-W09`,
      totalPartners: Number(newBatchForm.partnerCount),
      grossPayoutTZS: gross,
      withholdingTaxTZS: tax,
      netPayoutTZS: net,
      status: 'PENDING_MAKER',
      createdAt: 'Today, Just now',
      makerName: 'Finance Officer (Asha)',
    }

    setBatches([newBatch, ...batches])
    setShowCreateBatchModal(false)
    showToast('success', 'Payout Batch Created', `Batch ${newBatch.batchNumber} submitted for Compliance Checker dual-control authorization.`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Rewards, Payout Batches & Disbursements</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-2 py-0.5 rounded-full">
              Financial Workflow
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorize Partner reward disbursements, calculate 5% TRA withholding tax, and trigger automated mobile money payouts.
          </p>
        </div>

        <button
          onClick={() => setShowCreateBatchModal(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Create Payout Batch</span>
        </button>
      </div>

      {/* 5% Tax Rule Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2.5">
          <Receipt className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>TRA Withholding Standard:</strong> 5% statutory withholding tax is automatically computed and deducted from gross Partner commission prior to mobile money dispatch.
          </span>
        </div>
      </div>

      {/* Batches Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">Batch Number</th>
              <th className="p-3">Beneficiaries</th>
              <th className="p-3">Gross Rewards</th>
              <th className="p-3">TRA Withholding (5%)</th>
              <th className="p-3">Net Disbursement</th>
              <th className="p-3">Maker / Checker</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {batches.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3">
                  <div className="font-extrabold text-slate-900 dark:text-white font-mono">{b.batchNumber}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{b.createdAt}</div>
                </td>

                <td className="p-3">
                  <span className="font-bold text-slate-900 dark:text-white">{b.totalPartners}</span>
                  <span className="text-slate-400 text-[11px]"> verified partners</span>
                </td>

                <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                  TZS {b.grossPayoutTZS.toLocaleString()}
                </td>

                <td className="p-3 font-mono text-emerald-600 font-bold">
                  - TZS {b.withholdingTaxTZS.toLocaleString()}
                </td>

                <td className="p-3 font-mono font-black text-[#FF6A00] text-sm">
                  TZS {b.netPayoutTZS.toLocaleString()}
                </td>

                <td className="p-3 text-[11px] text-slate-500">
                  <div>Maker: {b.makerName}</div>
                  {b.checkerName && <div className="text-purple-600 font-bold">Checker: {b.checkerName}</div>}
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      b.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : b.status === 'APPROVED_CHECKER'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {b.status.replace('_', ' ')}
                  </span>
                </td>

                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {b.status === 'APPROVED_CHECKER' && (
                      <button
                        onClick={() => handleDisburseBatch(b.id)}
                        className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs"
                      >
                        Release Payouts
                      </button>
                    )}

                    <button
                      onClick={() => setStatementViewerModal(b)}
                      className="py-1 px-2.5 border rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1"
                      title="View Payout Statement"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Statement</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* STATEMENT VIEWER MODAL */}
      {statementViewerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Official Disbursement Statement
                </h3>
                <div className="text-xs text-slate-500 font-mono">{statementViewerModal.batchNumber}</div>
              </div>
              <button onClick={() => setStatementViewerModal(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Beneficiaries:</span>
                <span className="font-bold text-slate-900 dark:text-white">{statementViewerModal.totalPartners} Partners</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Commission:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  TZS {statementViewerModal.grossPayoutTZS.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>TRA Statutory 5% Withholding:</span>
                <span className="font-mono font-bold">
                  - TZS {statementViewerModal.withholdingTaxTZS.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[#FF6A00] font-black text-sm pt-1 border-t">
                <span>Net Mobile Money Disbursement:</span>
                <span className="font-mono">
                  TZS {statementViewerModal.netPayoutTZS.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setStatementViewerModal(null)
                  showToast('success', 'Statement Downloaded', `PDF statement for ${statementViewerModal.batchNumber} downloaded.`)
                }}
                className="py-2 px-4 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Statement</span>
              </button>
              <button onClick={() => setStatementViewerModal(null)} className="py-2 px-4 border rounded-xl text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE BATCH MODAL */}
      {showCreateBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FF6A00]" />
              <span>Generate New Partner Payout Batch</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Eligible Partners Count</label>
                <input
                  type="number"
                  value={newBatchForm.partnerCount}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, partnerCount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Gross Approved Commission (TZS)</label>
                <input
                  type="number"
                  value={newBatchForm.grossTZS}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, grossTZS: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Total:</span>
                  <span className="font-mono font-bold">TZS {newBatchForm.grossTZS.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>TRA Withholding (5%):</span>
                  <span className="font-mono font-bold">
                    - TZS {(newBatchForm.grossTZS * 0.05).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-black text-[#FF6A00] pt-1 border-t">
                  <span>Net Mobile Money Disbursement:</span>
                  <span className="font-mono">
                    TZS {(newBatchForm.grossTZS * 0.95).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateBatch}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs"
              >
                Submit Batch for Dual Control
              </button>
              <button
                onClick={() => setShowCreateBatchModal(false)}
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
