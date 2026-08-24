'use client'

import React, { useState } from 'react'
import {
  UserCheck,
  Search,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Lock,
  RotateCcw,
} from 'lucide-react'
import { MOCK_USERS } from '../mockData'
import { UserAccount } from '../types'
import { useAdminToast } from '../AdminToast'

export function KycComplianceTab() {
  const { showToast } = useAdminToast()
  const [users, setUsers] = useState<UserAccount[]>(MOCK_USERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [kycFilter, setKycFilter] = useState('ALL')
  const [actionModal, setActionModal] = useState<{
    user: UserAccount
    action: 'APPROVE_KYC' | 'REJECT_KYC' | 'COMPLIANCE_HOLD' | 'REOPEN'
  } | null>(null)
  const [reason, setReason] = useState('')

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
    const matchesKyc = kycFilter === 'ALL' || u.kycStatus === kycFilter
    return matchesSearch && matchesKyc
  })

  const handleExecuteKycAction = () => {
    if (!actionModal || !reason.trim()) {
      showToast('error', 'Validation Error', 'A compliance reason is mandatory.')
      return
    }
    const { user, action } = actionModal

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === user.id) {
          if (action === 'APPROVE_KYC') return { ...u, kycStatus: 'VERIFIED' }
          if (action === 'REJECT_KYC') return { ...u, kycStatus: 'REJECTED' }
          if (action === 'COMPLIANCE_HOLD') return { ...u, status: 'SUSPENDED' }
          if (action === 'REOPEN') return { ...u, kycStatus: 'UNDER_REVIEW' }
        }
        return u
      })
    )

    showToast('success', `KYC Action: ${action}`, `Compliance action executed for ${user.name}. Reason: "${reason}".`)
    setActionModal(null)
    setReason('')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>KYC & Identity Compliance Registry</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
              Review Workflow
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify National NIDA IDs, passports, business authorized representatives, assign risk levels and manage compliance holds.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>Under Review: {users.filter((u) => u.kycStatus === 'UNDER_REVIEW').length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or telephone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All KYC Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="REJECTED">Rejected</option>
            <option value="NOT_SUBMITTED">Not Submitted</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[700px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">User & Contact</th>
              <th className="p-3">Role</th>
              <th className="p-3">KYC Verification</th>
              <th className="p-3">Account Status</th>
              <th className="p-3 text-right">Compliance Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3">
                  <div className="font-extrabold text-slate-900 dark:text-white">{u.name}</div>
                  <div className="text-[11px] text-slate-500">{u.email} · {u.phone}</div>
                </td>

                <td className="p-3">
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 dark:bg-slate-800">
                    {u.role}
                  </span>
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      u.kycStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : u.kycStatus === 'UNDER_REVIEW'
                        ? 'bg-amber-100 text-amber-700'
                        : u.kycStatus === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {u.kycStatus}
                  </span>
                </td>

                <td className="p-3">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{u.status}</span>
                </td>

                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {u.kycStatus !== 'VERIFIED' && (
                      <button
                        onClick={() => setActionModal({ user: u, action: 'APPROVE_KYC' })}
                        className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        Verify
                      </button>
                    )}

                    {u.kycStatus !== 'REJECTED' && (
                      <button
                        onClick={() => setActionModal({ user: u, action: 'REJECT_KYC' })}
                        className="py-1 px-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50"
                      >
                        Reject
                      </button>
                    )}

                    <button
                      onClick={() => setActionModal({ user: u, action: 'COMPLIANCE_HOLD' })}
                      className="py-1 px-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100"
                      title="Apply Compliance Hold"
                    >
                      Hold
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* COMPLIANCE ACTION MODAL */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#FF6A00]" />
              <span>Record KYC Action: {actionModal.action}</span>
            </h3>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              User: <strong>{actionModal.user.name}</strong> ({actionModal.user.email})
            </div>

            <div className="text-xs space-y-1">
              <label className="font-bold block">
                Compliance Reason for Audit Log <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. NIDA biometric matching successful. Government database verified..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExecuteKycAction}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs"
              >
                Submit Decision
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
