'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  Search,
  FileCheck,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Building,
  UserCheck,
} from 'lucide-react'
import { MOCK_VERIFICATIONS } from '../mockData'
import { BusinessVerificationItem } from '../types'
import { useAdminToast } from '../AdminToast'

export function BusinessVerificationTab() {
  const { showToast } = useAdminToast()
  const [verifications, setVerifications] = useState<BusinessVerificationItem[]>(MOCK_VERIFICATIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedItem, setSelectedItem] = useState<BusinessVerificationItem | null>(null)
  const [decisionModal, setDecisionModal] = useState<{
    type: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'SUSPEND' | 'REQUIRE_REVERIFY'
    item: BusinessVerificationItem
  } | null>(null)
  const [decisionReason, setDecisionReason] = useState('')

  const filteredItems = verifications.filter((v) => {
    const matchesSearch =
      v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tinNumber.includes(searchQuery) ||
      v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleExecuteDecision = () => {
    if (!decisionModal || !decisionReason.trim()) {
      showToast('error', 'Validation Error', 'A formal compliance decision reason is mandatory.')
      return
    }
    const { type, item } = decisionModal

    setVerifications((prev) =>
      prev.map((v) => {
        if (v.id === item.id) {
          let newStatus: BusinessVerificationItem['status'] = v.status
          if (type === 'APPROVE') newStatus = 'APPROVED'
          if (type === 'REJECT') newStatus = 'REJECTED'
          if (type === 'REQUEST_INFO') newStatus = 'MORE_INFO_REQUIRED'
          if (type === 'SUSPEND') newStatus = 'SUSPENDED'
          if (type === 'REQUIRE_REVERIFY') newStatus = 'UNDER_REVIEW'

          return {
            ...v,
            status: newStatus,
            decisionReason,
          }
        }
        return v
      })
    )

    showToast('success', `KYB Decision: ${type}`, `Compliance decision recorded for ${item.businessName}. Reason: "${decisionReason}".`)
    setDecisionModal(null)
    setDecisionReason('')
    if (selectedItem?.id === item.id) {
      setSelectedItem(null)
    }
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Business KYB Verification & Compliance</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
              Review Workflow
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review BRELA incorporation certificates, TRA TIN documents, beneficial owners, and assign compliance decisions.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>Pending Decisions: {verifications.filter((v) => v.status === 'SUBMITTED' || v.status === 'UNDER_REVIEW').length}</span>
        </div>
      </div>

      {/* Lifecycle Flow Banner */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
        <span className="font-bold text-slate-900 dark:text-white">Workflow State:</span>
        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 rounded font-bold">1. Submitted</span>
        <span>→</span>
        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded font-bold">2. Under Review</span>
        <span>→</span>
        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 rounded font-bold">3. More Info Required</span>
        <span>→</span>
        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded font-bold">4. Approved / Rejected</span>
        <span>→</span>
        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 rounded font-bold">5. Suspended / Expired</span>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search business by company name, TIN, or BRELA number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Verification States</option>
            <option value="SUBMITTED">Submitted (New)</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="MORE_INFO_REQUIRED">More Info Required</option>
            <option value="APPROVED">Approved (Verified)</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Grid of Verification Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
              selectedItem?.id === item.id
                ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/10 dark:bg-slate-800'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                      {item.businessName}
                    </h3>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {item.registrationNumber} · TIN: {item.tinNumber}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    item.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : item.status === 'SUBMITTED'
                      ? 'bg-blue-100 text-blue-700'
                      : item.status === 'UNDER_REVIEW'
                      ? 'bg-amber-100 text-amber-700'
                      : item.status === 'MORE_INFO_REQUIRED'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.status.replace('_', ' ')}
                </span>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Industry:</span>
                  <span className="font-bold">{item.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact:</span>
                  <span className="font-bold">{item.contactPerson} ({item.phone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Submitted:</span>
                  <span>{item.submittedAt}</span>
                </div>
              </div>

              {/* Documents preview list */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">KYB Documents ({item.documents.length})</div>
                {item.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="truncate max-w-[170px] text-slate-700 dark:text-slate-300 font-medium">{doc.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>

              {item.decisionReason && (
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                  <strong>Logged Reason:</strong> {item.decisionReason}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                onClick={() => setDecisionModal({ type: 'APPROVE', item })}
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>

              <button
                onClick={() => setDecisionModal({ type: 'REQUEST_INFO', item })}
                className="py-1.5 px-2.5 border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold rounded-xl text-xs"
                title="Request More Information"
              >
                Need Info
              </button>

              <button
                onClick={() => setDecisionModal({ type: 'REJECT', item })}
                className="py-1.5 px-2.5 border border-red-200 dark:border-red-800 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50"
                title="Reject"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DECISION MODAL WITH MANDATORY REASON */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#FF6A00]" />
              <span>Record KYB Decision: {decisionModal.type}</span>
            </h3>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Target Company: <strong>{decisionModal.item.businessName}</strong> (TIN: {decisionModal.item.tinNumber})
            </div>

            <div className="text-xs space-y-1">
              <label className="font-bold block text-slate-800 dark:text-slate-200">
                Compliance Decision Reason <span className="text-red-500">* (Mandatory)</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. BRELA incorporation and 2026 TRA tax clearance verified against government registry..."
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExecuteDecision}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs"
              >
                Sign & Submit Decision
              </button>
              <button
                onClick={() => setDecisionModal(null)}
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
