'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  Search,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Eye,
  Bot,
  Zap,
  Clock,
  UserX,
} from 'lucide-react'
import { MOCK_FRAUD_ALERTS } from '../mockData'
import { FraudAlertCase } from '../types'

import { useAdminToast } from '../AdminToast'

export function FraudRiskTab() {
  const { showToast } = useAdminToast()
  const [cases, setCases] = useState<FraudAlertCase[]>(MOCK_FRAUD_ALERTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [actionModal, setActionModal] = useState<{
    c: FraudAlertCase
    action: 'HOLD_REWARDS' | 'RELEASE_LEGITIMATE' | 'BLOCK_DEVICE' | 'CLOSE_FRAUD'
  } | null>(null)
  const [reason, setReason] = useState('')

  const filtered = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.suspectEntity.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSeverity = severityFilter === 'ALL' || c.severity === severityFilter
    return matchesSearch && matchesSeverity
  })

  const handleExecuteCaseAction = () => {
    if (!actionModal || !reason.trim()) {
      showToast('error', 'Validation Error', 'A risk investigation reason is mandatory to close or apply holds.')
      return
    }
    const { c, action } = actionModal

    setCases((prev) =>
      prev.map((item) => {
        if (item.id === c.id) {
          let newStatus = item.status
          if (action === 'HOLD_REWARDS') newStatus = 'HOLD_APPLIED'
          if (action === 'RELEASE_LEGITIMATE') newStatus = 'DISMISSED_LEGITIMATE'
          if (action === 'CLOSE_FRAUD' || action === 'BLOCK_DEVICE') newStatus = 'CONFIRMED_FRAUD_CLOSED'

          return {
            ...item,
            status: newStatus,
            decisionReason: reason,
          }
        }
        return item
      })
    )

    showToast('warning', `Risk Action: ${action}`, `Action executed for case ${c.caseNumber}. Reason: "${reason}".`)
    setActionModal(null)
    setReason('')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Fraud Engine & Risk Case Management</span>
            <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-extrabold px-2 py-0.5 rounded-full">
              Case Management
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated anomaly detection: bot click floods, duplicate conversions, self-referral loops, and reward holds.
          </p>
        </div>

        <div className="text-xs font-bold text-red-600 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          <span>Active Risk Alerts: {cases.filter((c) => c.status === 'OPEN' || c.status === 'INVESTIGATING' || c.status === 'HOLD_APPLIED').length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search risk cases by title, entity, or case number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Risk Severities</option>
            <option value="CRITICAL">Critical (Score 90+)</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Case Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-dashed text-xs text-slate-500 space-y-2">
          <ShieldAlert className="w-10 h-10 mx-auto text-emerald-500 opacity-80" />
          <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Active Fraud Risk Alerts</div>
          <div className="max-w-md mx-auto">
            The platform fraud engine continuously monitors bot click loops, rapid conversion velocity, and abnormal geo-IP clusters in real time.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
          <div
            key={c.id}
            className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs ${
                    c.severity === 'HIGH' || c.severity === 'CRITICAL'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {c.caseNumber} · {c.type.replace('_', ' ')}
                    </span>
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                      {c.title}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-red-600 font-mono">
                    Score: {c.riskScore}/100
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-red-100 text-red-700 rounded">
                    {c.severity}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Suspect Entity:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{c.suspectEntity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Flagged Amount:</span>
                  <span className="font-mono font-bold text-[#FF6A00]">
                    TZS {c.flaggedAmountTZS.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{c.status.replace('_', ' ')}</span>
                </div>
              </div>

              {c.decisionReason && (
                <div className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                  <strong>Decision Reason:</strong> {c.decisionReason}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
              <button
                onClick={() => setActionModal({ c, action: 'HOLD_REWARDS' })}
                className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-2xs"
              >
                Hold Rewards
              </button>

              <button
                onClick={() => setActionModal({ c, action: 'RELEASE_LEGITIMATE' })}
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Dismiss / Legitimate
              </button>

              <button
                onClick={() => setActionModal({ c, action: 'BLOCK_DEVICE' })}
                className="py-1.5 px-3 border border-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100"
              >
                Block Device / IP
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* RISK ACTION MODAL */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Record Risk Case Action: {actionModal.action}</span>
            </h3>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Case: <strong>{actionModal.c.caseNumber}</strong> ({actionModal.c.title})
            </div>

            <div className="text-xs space-y-1">
              <label className="font-bold block text-slate-800 dark:text-slate-200">
                Investigation Findings / Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Automated bot signature verified by cloudflare challenge. Rewards frozen in escrow..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExecuteCaseAction}
                className="flex-1 py-2.5 bg-red-600 text-white font-extrabold rounded-xl text-xs"
              >
                Apply & Close Case
              </button>
              <button
                onClick={() => setActionModal(null)}
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
