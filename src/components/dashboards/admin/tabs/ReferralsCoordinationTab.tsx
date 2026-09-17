'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  XCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import type { ReferralTicketDTO, ReferralTicketStage } from '@/modules/deals/types'
import { useAdminToast } from '../AdminToast'

// 13-Step Standard Pipeline as requested
export interface LifecycleStageConfig {
  step: number
  key: ReferralTicketStage
  label: string
  shortLabel: string
  color: string
}

export const LIFECYCLE_STAGES: LifecycleStageConfig[] = [
  { step: 1, key: 'SUBMITTED', label: '1. Submitted', shortLabel: 'Submitted', color: 'bg-[#ffedd5] text-[#c2410c] border-orange-200 dark:bg-orange-950/50 dark:text-orange-400' },
  { step: 2, key: 'UNDER_REVIEW', label: '2. Under Review', shortLabel: 'Under Review', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' },
  { step: 3, key: 'QUALIFIED', label: '3. Qualified', shortLabel: 'Qualified', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' },
  { step: 4, key: 'CONTACTED', label: '4. Contacted', shortLabel: 'Contacted', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300' },
  { step: 5, key: 'CUSTOMER_INTERESTED', label: '5. Customer Interested', shortLabel: 'Customer Interested', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300' },
  { step: 6, key: 'INTRODUCTION_SCHEDULED', label: '6. Introduction Scheduled', shortLabel: 'Intro Scheduled', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' },
  { step: 7, key: 'INTRODUCED', label: '7. Introduced', shortLabel: 'Introduced', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300' },
  { step: 8, key: 'NEGOTIATING', label: '8. Negotiating', shortLabel: 'Negotiating', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300' },
  { step: 9, key: 'SUCCESSFUL', label: '9. Successful', shortLabel: 'Successful', color: 'bg-[#dcfce7] text-[#15803d] border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300' },
  { step: 10, key: 'REWARD_PENDING', label: '10. Reward Pending', shortLabel: 'Reward Pending', color: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300' },
  { step: 11, key: 'REWARD_APPROVED', label: '11. Reward Approved', shortLabel: 'Reward Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300' },
  { step: 12, key: 'REWARD_PAID', label: '12. Reward Paid', shortLabel: 'Reward Paid', color: 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500' },
  { step: 13, key: 'CLOSED', label: '13. Closed', shortLabel: 'Closed', color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300' },
]

export const EXCEPTION_STAGES: { key: ReferralTicketStage; label: string; color: string }[] = [
  { key: 'MORE_INFO_REQUIRED', label: 'More Info Required', color: 'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300' },
  { key: 'REJECTED', label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400' },
]

function getStageConfig(stage: string): { label: string; color: string; step?: number } {
  const matchPipeline = LIFECYCLE_STAGES.find((s) => s.key === stage)
  if (matchPipeline) return matchPipeline
  const matchException = EXCEPTION_STAGES.find((s) => s.key === stage)
  if (matchException) return matchException
  return { label: stage, color: 'bg-slate-100 text-slate-700 border-slate-200' }
}

function formatSubmittedDate(dateStr?: string | Date): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`
}

export function ReferralsCoordinationTab() {
  const { showToast } = useAdminToast()
  const [tickets, setTickets] = useState<ReferralTicketDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedTicket, setSelectedTicket] = useState<ReferralTicketDTO | null>(null)
  const [modalStage, setModalStage] = useState<ReferralTicketStage>('SUBMITTED')
  const [modalNotes, setModalNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/referrals/tickets', { credentials: 'include' })
      const data = await res.json()
      if (data.success && Array.isArray(data.tickets)) {
        setTickets(data.tickets)
      }
    } catch (err) {
      console.error('Failed to load referral tickets:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleUpdateStage = async (ticketId: string, newStage: ReferralTicketStage, notes?: string) => {
    setUpdating(true)
    try {
      const stageInfo = getStageConfig(newStage)
      const res = await fetch(`/api/referrals/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          coordinatorNotes: notes || `Admin updated stage to ${stageInfo.label}`,
          partnerVisibleUpdate: `Your connection review stage is now: ${stageInfo.label}.`,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update stage')

      showToast('success', 'Stage Updated', `Connection stage changed to ${stageInfo.label}.`)

      // Update state locally
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, stage: newStage, coordinatorNotes: notes || t.coordinatorNotes } : t))
      )
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, stage: newStage } : null))
        setModalStage(newStage)
      }
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Could not update stage.')
    } finally {
      setUpdating(false)
    }
  }

  const openViewModal = (ticket: ReferralTicketDTO) => {
    setSelectedTicket(ticket)
    setModalStage(ticket.stage)
    setModalNotes(ticket.coordinatorNotes || '')
  }

  const getNextStage = (currentStage: string): ReferralTicketStage | null => {
    const currentIndex = LIFECYCLE_STAGES.findIndex((s) => s.key === currentStage)
    if (currentIndex >= 0 && currentIndex < LIFECYCLE_STAGES.length - 1) {
      return LIFECYCLE_STAGES[currentIndex + 1].key
    }
    return null
  }

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'ALL') return true
    return t.stage === statusFilter
  })

  return (
    <div className="space-y-6">
      {/* Main Container matching Prototype Screenshot 1 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
        {/* Title Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Partner Connection Review</h2>
          <span className="text-xs text-[#7c3aed] dark:text-[#a78bfa] font-bold">
            Qualification &amp; Introduction Control
          </span>
        </div>

        {/* Status Filter Dropdown containing all 13 pipeline stages + exceptions */}
        <div className="w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
          >
            <option value="ALL">All statuses</option>
            <optgroup label="13-Stage Pipeline">
              {LIFECYCLE_STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Branch Stages">
              {EXCEPTION_STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Table matching Screenshot 1 */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-[11px] text-slate-400 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 px-3 font-bold tracking-wider w-44">ID</th>
                <th className="pb-3 px-3 font-bold tracking-wider w-40">PARTNER</th>
                <th className="pb-3 px-3 font-bold tracking-wider w-44">CUSTOMER</th>
                <th className="pb-3 px-3 font-bold tracking-wider">DEAL</th>
                <th className="pb-3 px-3 font-bold tracking-wider w-48">STATUS</th>
                <th className="pb-3 px-3 font-bold tracking-wider text-right w-72">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    {loading ? 'Loading partner connections...' : 'No connection records match the selected status.'}
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const customerDisplay =
                    ticket.companyName ||
                    (ticket.customerFirstName ? `${ticket.customerFirstName} ${ticket.customerLastName || ''}`.trim() : '-')
                  const stageConfig = getStageConfig(ticket.stage)
                  const nextStage = getNextStage(ticket.stage)

                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {ticket.ticketReference || ticket.id.slice(0, 16).toUpperCase()}
                      </td>

                      <td className="py-4 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {ticket.partnerName || '-'}
                      </td>

                      <td className="py-4 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {customerDisplay}
                      </td>

                      <td className="py-4 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {ticket.dealTitle}
                      </td>

                      <td className="py-4 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${stageConfig.color}`}
                        >
                          {stageConfig.label}
                        </span>
                      </td>

                      <td className="py-4 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => openViewModal(ticket)}
                            className="border border-slate-700 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            View
                          </button>

                          {/* Action Buttons for SUBMITTED / UNDER_REVIEW */}
                          {ticket.stage === 'SUBMITTED' && (
                            <>
                              <button
                                type="button"
                                disabled={updating}
                                onClick={() => handleUpdateStage(ticket.id, 'QUALIFIED')}
                                className="bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Qualify
                              </button>

                              <button
                                type="button"
                                disabled={updating}
                                onClick={() => handleUpdateStage(ticket.id, 'MORE_INFO_REQUIRED')}
                                className="border border-slate-700 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Request Info
                              </button>

                              <button
                                type="button"
                                disabled={updating}
                                onClick={() => handleUpdateStage(ticket.id, 'REJECTED')}
                                className="bg-[#801b2a] hover:bg-[#661521] text-white font-bold text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Quick progression to next stage */}
                          {nextStage && ticket.stage !== 'SUBMITTED' && (
                            <button
                              type="button"
                              disabled={updating}
                              onClick={() => handleUpdateStage(ticket.id, nextStage)}
                              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              <span>Next</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Connection View with 13-Stage Stepper Progression */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                  Connection {selectedTicket.ticketReference || selectedTicket.id.slice(0, 16).toUpperCase()}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs px-4 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Top Grid: 2 Cards (Customer and Status) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CARD 1: Customer */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900/40 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Customer</h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex">
                    <span className="w-24 text-slate-400 font-medium shrink-0">Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedTicket.companyName ||
                        (selectedTicket.customerFirstName
                          ? `${selectedTicket.customerFirstName} ${selectedTicket.customerLastName || ''}`.trim()
                          : '-')}
                    </span>
                  </div>

                  <div className="flex">
                    <span className="w-24 text-slate-400 font-medium shrink-0">Deal</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedTicket.dealTitle || '-'}
                    </span>
                  </div>

                  <div className="flex">
                    <span className="w-24 text-slate-400 font-medium shrink-0">Email</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">
                      {selectedTicket.customerEmail || '-'}
                    </span>
                  </div>

                  <div className="flex">
                    <span className="w-24 text-slate-400 font-medium shrink-0">Relationship</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedTicket.relationshipWithCustomer || '-'}
                    </span>
                  </div>

                  <div className="flex">
                    <span className="w-24 text-slate-400 font-medium shrink-0">Interest</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedTicket.customerInterestLevel || '-'}
                    </span>
                  </div>

                  {selectedTicket.customerPhone && (
                    <div className="flex">
                      <span className="w-24 text-slate-400 font-medium shrink-0">Phone</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        {selectedTicket.customerPhone}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 2: Status & Quick Controls */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Status</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Submitted {formatSubmittedDate(selectedTicket.createdAt)}
                  </span>
                </div>

                {/* Current Active Stage display matching user prompt */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Active Stage</span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      getStageConfig(selectedTicket.stage).color
                    }`}
                  >
                    {getStageConfig(selectedTicket.stage).label}
                  </span>
                </div>

                {/* Stage selector dropdown */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Select Stage to Update</label>
                    <select
                      value={modalStage}
                      onChange={(e) => setModalStage(e.target.value as ReferralTicketStage)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    >
                      <optgroup label="13 Pipeline Stages">
                        {LIFECYCLE_STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Branch Stages">
                        {EXCEPTION_STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Coordinator Notes</label>
                    <textarea
                      rows={2}
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                      placeholder="Add operational notes or reason for status update..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStage(selectedTicket.id, modalStage, modalNotes)}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs py-2 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {updating ? 'Updating...' : 'Save & Update Stage'}
                    </button>

                    {getNextStage(selectedTicket.stage) && (
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => handleUpdateStage(selectedTicket.id, getNextStage(selectedTicket.stage)!)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                        title="Advance to next stage immediately"
                      >
                        <span>Advance →</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: Complete 13-Stage Progression Pipeline */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>13-Stage Connection Progression</span>
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-[#7c3aed] font-bold px-2 py-0.5 rounded-full">
                      Click any step to set status
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select any numbered stage below to transition this connection directly.
                  </p>
                </div>
              </div>

              {/* Responsive 13-Stage Timeline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                {LIFECYCLE_STAGES.map((s) => {
                  const isActive = selectedTicket.stage === s.key
                  const currentActiveIndex = LIFECYCLE_STAGES.findIndex((x) => x.key === selectedTicket.stage)
                  const isCompleted = currentActiveIndex >= 0 && s.step < currentActiveIndex + 1

                  return (
                    <button
                      key={s.key}
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStage(selectedTicket.id, s.key, modalNotes)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex items-center gap-3 ${
                        isActive
                          ? 'border-[#7c3aed] bg-purple-50/80 dark:bg-purple-950/40 shadow-xs ring-2 ring-[#7c3aed]/20'
                          : isCompleted
                          ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {/* Step Number Badge */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isActive
                            ? 'bg-[#7c3aed] text-white'
                            : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
                      </div>

                      {/* Stage Name & Active Status */}
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs font-bold truncate ${
                            isActive
                              ? 'text-[#7c3aed] dark:text-purple-300'
                              : isCompleted
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {s.label}
                        </div>

                        {isActive && (
                          <div className="text-[10px] font-black text-[#7c3aed] dark:text-purple-400 mt-0.5 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-pulse" />
                            Active Stage
                          </div>
                        )}
                        {isCompleted && (
                          <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Passed
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Exception Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] font-medium">Exception Actions:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStage(selectedTicket.id, 'MORE_INFO_REQUIRED')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      selectedTicket.stage === 'MORE_INFO_REQUIRED'
                        ? 'bg-yellow-100 text-yellow-900 border-yellow-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Set More Info Required
                  </button>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStage(selectedTicket.id, 'REJECTED')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      selectedTicket.stage === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    Reject Connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
