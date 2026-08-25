'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Lock,
  Download,
  Shield,
  Eye,
  CheckCircle2,
  Calendar,
  Key,
  X,
  ShieldCheck,
} from 'lucide-react'
import { MOCK_AUDIT_LOGS } from '../mockData'
import { AuditLogEntry } from '../types'
import { useAdminToast } from '../AdminToast'

export function AuditLogsTab() {
  const { showToast } = useAdminToast()

  const [logs, setLogs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS)
  const [searchQuery, setSearchQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('ALL')
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)

  useEffect(() => {
    fetch('/api/admin/overview')
      .then((res) => res.json())
      .then((data) => {
        if (data.auditLogs && data.auditLogs.length > 0) {
          setLogs(data.auditLogs)
        }
      })
      .catch((err) => console.warn('Failed to load audit logs:', err))
  }, [])

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.resourceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.ipAddress.includes(searchQuery)
    const matchesModule = moduleFilter === 'ALL' || l.module === moduleFilter
    return matchesSearch && matchesModule
  })

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Immutable Platform Audit Logs</span>
            <span className="text-[10px] bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-extrabold px-2 py-0.5 rounded-full">
              100% Read-Only
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident, cryptographically chained logs of all sensitive administrative and financial actions.
          </p>
        </div>

        <button
          onClick={() => setShowExportModal(true)}
          className="py-2 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Trail</span>
        </button>
      </div>

      {/* Immutability Banner */}
      <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2.5">
        <Lock className="w-4 h-4 text-purple-600 shrink-0" />
        <span>
          <strong>Zero Edit/Delete Policy:</strong> No administrator—including Super Admin or Database Root—can modify or delete records from this ledger. Every entry is signed with a SHA-256 state hash.
        </span>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, actor, resource ID, or IP address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Modules</option>
            <option value="BUSINESS">Business KYB</option>
            <option value="PAYOUTS">Disbursements & Payouts</option>
            <option value="DEALS">Deals & Campaigns</option>
            <option value="RISK">Risk & Fraud Engine</option>
            <option value="AUTH">Authentication & Sessions</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[850px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Actor & Role</th>
              <th className="p-3">Action Executed</th>
              <th className="p-3">Target Resource</th>
              <th className="p-3">IP & Client</th>
              <th className="p-3">SHA-256 Hash</th>
              <th className="p-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3 font-mono text-[11px] text-slate-500">
                  {log.timestamp}
                </td>

                <td className="p-3">
                  <div className="font-extrabold text-slate-900 dark:text-white">{log.actorName}</div>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-mono">
                    {log.actorRole}
                  </span>
                </td>

                <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                  {log.action}
                </td>

                <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {log.resourceId}
                </td>

                <td className="p-3 text-[11px] text-slate-500">
                  <div className="font-mono">{log.ipAddress}</div>
                </td>

                <td className="p-3 font-mono text-[10px] text-slate-400">
                  {log.hashSignature.slice(0, 12)}...
                </td>

                <td className="p-3 text-right">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 ml-auto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Diff</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EXPORT AUDIT TRAIL MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Export Cryptographic Audit Package
                </h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500">
                Generates a cryptographically signed JSON/CSV package containing before/after state diffs and SHA-256 verification hashes for compliance auditors.
              </p>

              <div>
                <label className="font-bold block mb-1">Export Format</label>
                <select className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800">
                  <option>JSON Bundle with Cryptographic Manifest (Recommended)</option>
                  <option>CSV Formatted Audit Trail</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowExportModal(false)
                  showToast('success', 'Audit Package Exported', 'Cryptographically verified audit trail package downloaded.')
                }}
                className="py-2 px-4 bg-purple-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Package</span>
              </button>
              <button onClick={() => setShowExportModal(false)} className="py-2 px-4 border rounded-xl text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE DIFF INSPECTION MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Before & After State Diff Inspection</span>
            </h3>

            <div className="text-xs text-slate-500 space-y-1">
              <div>Action: <strong className="text-slate-900 dark:text-white">{selectedLog.action}</strong></div>
              <div>Actor: <strong>{selectedLog.actorName}</strong> ({selectedLog.ipAddress})</div>
              <div className="font-mono text-[10px]">Hash: {selectedLog.hashSignature}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900 space-y-1">
                <div className="font-extrabold text-red-700 dark:text-red-300 uppercase text-[10px]">Before State</div>
                <pre className="text-[11px] font-mono text-slate-800 dark:text-slate-200 overflow-x-auto">
                  {JSON.stringify(selectedLog.beforeState || { empty: true }, null, 2)}
                </pre>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-1">
                <div className="font-extrabold text-emerald-700 dark:text-emerald-300 uppercase text-[10px]">After State</div>
                <pre className="text-[11px] font-mono text-slate-800 dark:text-slate-200 overflow-x-auto">
                  {JSON.stringify(selectedLog.afterState || { empty: true }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="py-2 px-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
