'use client'

import React, { useState } from 'react'
import {
  Calculator,
  Search,
  Plus,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Download,
  FileCheck,
  RefreshCw,
  Clock,
  X,
  FileText,
} from 'lucide-react'
import { MOCK_RECONCILIATION } from '../mockData'
import { ReconciliationRun } from '../types'
import { useAdminToast } from '../AdminToast'

export function ReconciliationTab() {
  const { showToast } = useAdminToast()

  const [runs, setRuns] = useState<ReconciliationRun[]>(MOCK_RECONCILIATION)
  const [showNewRunModal, setShowNewRunModal] = useState(false)
  const [reportModal, setReportModal] = useState<ReconciliationRun | null>(null)

  const [newRunForm, setNewRunForm] = useState({
    period: 'February 2026 (Week 4)',
    provider: 'Vodacom M-Pesa B2C Gateway',
    systemTotalTZS: 18450000,
    providerTotalTZS: 18450000,
  })

  const handleClosePeriod = (id: string) => {
    setRuns((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'CLOSED',
              closedAt: 'Today',
              closedBy: 'Given M. (Super Admin)',
            }
          : r
      )
    )
    showToast('success', 'Reconciliation Period Closed', 'Period sealed permanently for statutory accounting. No further modifications permitted.')
  }

  const handleCreateRun = () => {
    const sys = Number(newRunForm.systemTotalTZS)
    const prov = Number(newRunForm.providerTotalTZS)
    const variance = Math.abs(sys - prov)

    const newRun: ReconciliationRun = {
      id: `rec_${Date.now()}`,
      period: newRunForm.period,
      provider: newRunForm.provider,
      systemTotalTZS: sys,
      providerTotalTZS: prov,
      varianceTZS: variance,
      matchedCount: 142,
      unmatchedCount: variance === 0 ? 0 : 1,
      status: variance === 0 ? 'RECONCILED' : 'ADJUSTMENT_REQUIRED',
      createdAt: 'Today, Just now',
    }

    setRuns([newRun, ...runs])
    setShowNewRunModal(false)
    showToast('success', 'Reconciliation Run Completed', `142 transactions matched for ${newRun.provider}.`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Payment Provider Reconciliation & Matching</span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded-full">
              C/R/U Workflow
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare LUMO internal ledgers against Vodacom, Tigo, Airtel, HaloPesa, and CRDB bank settlement statements.
          </p>
        </div>

        <button
          onClick={() => setShowNewRunModal(true)}
          className="py-2.5 px-4 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto active:scale-[0.99]"
        >
          <Plus className="w-4 h-4 text-[#FF6A00]" />
          <span>New Reconciliation Run</span>
        </button>
      </div>

      {/* Closed Period Immutability Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-purple-600 shrink-0" />
          <span>
            <strong>Audit Sealing Rule:</strong> Once a reconciliation run is investigated and closed, its records are permanently sealed for statutory accounting. Closed periods cannot be deleted.
          </span>
        </div>
      </div>

      {/* Runs Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">Period & Provider</th>
              <th className="p-3">LUMO System Ledger</th>
              <th className="p-3">Provider Statement</th>
              <th className="p-3">Variance</th>
              <th className="p-3">Matched / Exceptions</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No automated reconciliation runs executed yet.
                </td>
              </tr>
            ) : (
              runs.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-extrabold text-slate-900 dark:text-white">{r.period}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{r.provider}</div>
                </td>

                <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                  TZS {r.systemTotalTZS.toLocaleString()}
                </td>

                <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                  TZS {r.providerTotalTZS.toLocaleString()}
                </td>

                <td className="p-3 font-mono">
                  {r.varianceTZS === 0 ? (
                    <span className="text-emerald-600 font-bold">✓ TZS 0.00 (Balanced)</span>
                  ) : (
                    <span className="text-red-600 font-bold">
                      - TZS {r.varianceTZS.toLocaleString()}
                    </span>
                  )}
                </td>

                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">{r.matchedCount} matched</span>
                    {r.unmatchedCount > 0 && (
                      <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded text-[10px]">
                        {r.unmatchedCount} exception
                      </span>
                    )}
                  </div>
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      r.status === 'CLOSED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : r.status === 'RECONCILED'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {r.status.replace('_', ' ')}
                  </span>
                </td>

                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {r.status !== 'CLOSED' && (
                      <button
                        onClick={() => handleClosePeriod(r.id)}
                        className="py-1 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs"
                      >
                        Close Period
                      </button>
                    )}

                    <button
                      onClick={() => setReportModal(r)}
                      className="py-1 px-2.5 border rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1"
                      title="View Reconciliation Comparison"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Comparison</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>

      {/* RECONCILIATION COMPARISON REPORT MODAL */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Reconciliation Match Comparison
                </h3>
                <div className="text-xs text-slate-500">{reportModal.period} · {reportModal.provider}</div>
              </div>
              <button onClick={() => setReportModal(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">LUMO System Record</span>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                  TZS {reportModal.systemTotalTZS.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Telco Statement</span>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                  TZS {reportModal.providerTotalTZS.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-xs flex items-center justify-between">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">Total Matched Transactions:</span>
              <span className="font-mono font-black text-emerald-700 text-sm">{reportModal.matchedCount} txs (99.4%)</span>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setReportModal(null)
                  showToast('success', 'Report Downloaded', `Reconciliation audit sheet downloaded.`)
                }}
                className="py-2 px-4 bg-[#0B132B] text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Reconciliation PDF</span>
              </button>
              <button onClick={() => setReportModal(null)} className="py-2 px-4 border rounded-xl text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW RUN MODAL */}
      {showNewRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#FF6A00]" />
              <span>Initiate Reconciliation Run</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Reconciliation Period</label>
                <input
                  type="text"
                  value={newRunForm.period}
                  onChange={(e) => setNewRunForm({ ...newRunForm, period: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Payment Provider</label>
                <select
                  value={newRunForm.provider}
                  onChange={(e) => setNewRunForm({ ...newRunForm, provider: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="Vodacom M-Pesa B2C Gateway">Vodacom M-Pesa B2C Gateway</option>
                  <option value="Tigo Pesa Merchant Collections">Tigo Pesa Merchant Collections</option>
                  <option value="Airtel Money Aggregator">Airtel Money Aggregator</option>
                  <option value="CRDB Bank Host-to-Host">CRDB Bank Host-to-Host</option>
                </select>
              </div>

              <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-1">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="font-bold text-slate-700 dark:text-slate-300">Upload Provider Statement (CSV / XML)</div>
                <div className="text-[10px] text-slate-400">Automated transaction matching engine</div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateRun}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs"
              >
                Run Automated Matching
              </button>
              <button
                onClick={() => setShowNewRunModal(false)}
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
