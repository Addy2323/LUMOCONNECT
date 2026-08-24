'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  Scale,
  CheckCircle2,
  Clock,
  Send,
  FileText,
  Shield,
  ArrowRight,
  Filter,
  Search,
} from 'lucide-react'
import { MOCK_DISPUTES } from '../mockData'
import { DisputeItem } from '../types'
import { useAdminToast } from '../AdminToast'

export function DisputesComplaintsTab() {
  const { showToast } = useAdminToast()

  const [disputes, setDisputes] = useState<DisputeItem[]>(MOCK_DISPUTES)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(disputes[0] || null)
  const [resolutionModal, setResolutionModal] = useState<{
    dsp: DisputeItem
    action: 'RESOLVE_IN_FAVOR_OF_BUSINESS' | 'RESOLVE_IN_FAVOR_OF_PARTNER' | 'SPLIT' | 'CLOSE'
  } | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')

  const filtered = disputes.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.complainant.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleExecuteResolution = () => {
    if (!resolutionModal || !resolutionNotes.trim()) {
      showToast('error', 'Validation Error', 'A resolution finding must be documented.')
      return
    }
    const { dsp, action } = resolutionModal

    setDisputes((prev) =>
      prev.map((item) =>
        item.id === dsp.id ? { ...item, status: 'RESOLVED' } : item
      )
    )

    showToast('success', 'Dispute Resolved', `Dispute ${dsp.ticketNumber} resolved via decision "${action}". Escrow unfrozen.`)
    setResolutionModal(null)
    setResolutionNotes('')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Disputes, Complaints & Mediation</span>
            <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-full">
              Mediation & Escrow
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Resolve disagreements between Businesses and Partners. Disputed rewards are frozen in escrow until formal case resolution.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Active Cases: {disputes.filter((d) => d.status !== 'CLOSED').length}</span>
        </div>
      </div>

      {/* Lifecycle Banner */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] flex flex-wrap items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
        <span className="font-bold text-slate-900 dark:text-white">Dispute Lifecycle:</span>
        <span>Open</span> → <span>Assigned</span> → <span>Investigating</span> → <span>Awaiting Evidence</span> → <span className="text-emerald-600 font-bold">Resolved</span> → <span>Closed</span> → <span>Appealed</span>
      </div>

      {filtered.length === 0 || !selectedDispute ? (
        <div className="py-16 text-center text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 my-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
          <div className="font-bold text-sm text-slate-700 dark:text-slate-300">All Mediation Queues Clear</div>
          <div className="mt-1">No active commercial dispute tickets or frozen escrow claims.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left column list */}
          <div className="lg:col-span-5 space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Registered Dispute Cases ({filtered.length})
            </h3>

            {filtered.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDispute(d)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all space-y-2 ${
                  selectedDispute?.id === d.id
                    ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/20 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {d.ticketNumber}
                    </span>
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                      {d.title}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded shrink-0">
                    {d.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{d.complainant}</span>
                  <span className="font-mono font-bold text-[#FF6A00]">
                    TZS {d.disputedAmountTZS.toLocaleString()}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400">
                  Ref: {d.dealRef} · Assigned: {d.assignedTo}
                </div>
              </button>
            ))}
          </div>

          {/* Right column detail & actions */}
          <div className="lg:col-span-7 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {selectedDispute.ticketNumber} · Priority: {selectedDispute.priority}
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  {selectedDispute.title}
                </h3>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 font-bold uppercase">Frozen Reward</div>
                <div className="text-base font-black text-[#FF6A00] font-mono">
                  TZS {selectedDispute.disputedAmountTZS.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Complainant:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedDispute.complainant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Respondent:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedDispute.respondent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deal Reference:</span>
                <span className="font-mono text-blue-600 font-bold">{selectedDispute.dealRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Case Officer:</span>
                <span className="font-bold">{selectedDispute.assignedTo}</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setResolutionModal({ dsp: selectedDispute, action: 'RESOLVE_IN_FAVOR_OF_BUSINESS' })}
                className="py-2 px-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Refund Business (Revert)
              </button>

              <button
                onClick={() => setResolutionModal({ dsp: selectedDispute, action: 'RESOLVE_IN_FAVOR_OF_PARTNER' })}
                className="py-2 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Release to Partner
              </button>

              <button
                onClick={() => setResolutionModal({ dsp: selectedDispute, action: 'SPLIT' })}
                className="py-2 px-3 border border-purple-300 text-purple-700 rounded-xl text-xs font-bold hover:bg-purple-50 cursor-pointer"
              >
                Mediate 50/50 Split
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL */}
      {resolutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#FF6A00]" />
              <span>Issue Formal Dispute Decision</span>
            </h3>

            <div className="text-xs space-y-1">
              <label className="font-bold block text-slate-800 dark:text-slate-200">
                Decision Finding & Legal Grounds <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Document evidence findings, call recordings or transaction logs reviewed..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExecuteResolution}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs cursor-pointer"
              >
                Execute Decision & Unfreeze Escrow
              </button>
              <button
                onClick={() => setResolutionModal(null)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold cursor-pointer"
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
