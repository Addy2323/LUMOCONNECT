'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  Ticket,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  Loader2,
  User,
  Phone,
  MapPin,
  Package,
  FileText,
  Building2,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react'
import type { ReferralTicketDTO, ReferralTicketStage, ReferralSubmissionType, ReferralClosureReason } from '@/modules/deals/types'

const STAGE_LABELS: Record<ReferralTicketStage, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  AVAILABILITY_CONFIRMED: 'Availability Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
}

const STAGE_COLORS: Record<ReferralTicketStage, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  AVAILABILITY_CONFIRMED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  IN_PROGRESS: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  CLOSED: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

const CLOSURE_REASONS: { value: ReferralClosureReason; label: string }[] = [
  { value: 'UNAVAILABLE', label: 'Product/Service Unavailable' },
  { value: 'DUPLICATE', label: 'Duplicate Submission' },
  { value: 'CANCELLED', label: 'Cancelled by Partner' },
  { value: 'UNSUCCESSFUL', label: 'Unsuccessful Transaction' },
  { value: 'OTHER', label: 'Other Reason' },
]

export function ReferralsCoordinationTab() {
  const [tickets, setTickets] = useState<ReferralTicketDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState<ReferralTicketStage | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<ReferralSubmissionType | 'ALL'>('ALL')
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  // Edit state for expanded ticket
  const [editStage, setEditStage] = useState<ReferralTicketStage>('SUBMITTED')
  const [editCoordinator, setEditCoordinator] = useState('')
  const [editNextAction, setEditNextAction] = useState('')
  const [editNextActionDue, setEditNextActionDue] = useState('')
  const [editCoordinatorNotes, setEditCoordinatorNotes] = useState('')
  const [editPartnerUpdate, setEditPartnerUpdate] = useState('')
  const [editClosureReason, setEditClosureReason] = useState<ReferralClosureReason | ''>('')

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (stageFilter !== 'ALL') params.set('stage', stageFilter)
      if (typeFilter !== 'ALL') params.set('type', typeFilter)

      const res = await fetch(`/api/referrals/tickets?${params.toString()}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setTickets(data.tickets || [])
      }
    } catch (err) {
      console.error('Failed to load referral tickets:', err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, stageFilter, typeFilter])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleExpandTicket = (ticket: ReferralTicketDTO) => {
    if (expandedTicket === ticket.id) {
      setExpandedTicket(null)
      return
    }
    setExpandedTicket(ticket.id)
    setEditStage(ticket.stage)
    setEditCoordinator(ticket.assignedCoordinator || '')
    setEditNextAction(ticket.nextAction || '')
    setEditNextActionDue(ticket.nextActionDueDate || '')
    setEditCoordinatorNotes(ticket.coordinatorNotes || '')
    setEditPartnerUpdate(ticket.partnerVisibleUpdate || '')
    setEditClosureReason((ticket.closureReason as ReferralClosureReason) || '')
  }

  const handleUpdateTicket = async (ticketId: string) => {
    setUpdating(ticketId)
    try {
      await fetch(`/api/referrals/tickets/${ticketId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: editStage,
          assignedCoordinator: editCoordinator || undefined,
          nextAction: editNextAction || undefined,
          nextActionDueDate: editNextActionDue || undefined,
          coordinatorNotes: editCoordinatorNotes || undefined,
          partnerVisibleUpdate: editPartnerUpdate || undefined,
          closureReason: editStage === 'CLOSED' ? editClosureReason || 'OTHER' : undefined,
        }),
      })
      await fetchTickets()
      setExpandedTicket(null)
    } catch (err) {
      console.error('Failed to update ticket:', err)
    } finally {
      setUpdating(null)
    }
  }

  // Stats
  const totalTickets = tickets.length
  const submitted = tickets.filter((t) => t.stage === 'SUBMITTED').length
  const inProgress = tickets.filter((t) => ['UNDER_REVIEW', 'AVAILABILITY_CONFIRMED', 'IN_PROGRESS'].includes(t.stage)).length
  const completed = tickets.filter((t) => t.stage === 'COMPLETED').length
  const customerRefs = tickets.filter((t) => t.submissionType === 'CUSTOMER_REFERRAL').length
  const coordEnquiries = tickets.filter((t) => t.submissionType === 'COORDINATION_ENQUIRY').length

  return (
    <div className="space-y-6">
      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Tickets', value: totalTickets, icon: Ticket, color: 'text-slate-900 dark:text-white' },
          { label: 'New/Submitted', value: submitted, icon: AlertCircle, color: 'text-blue-600' },
          { label: 'Active/In Progress', value: inProgress, icon: Clock, color: 'text-orange-600' },
          { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Customer Referrals', value: customerRefs, icon: Users, color: 'text-purple-600' },
          { label: 'Coordination', value: coordEnquiries, icon: MessageSquare, color: 'text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-3">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-[10px] text-slate-500 uppercase font-bold truncate">{stat.label}</span>
            </div>
            <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket reference, promo code, deal title, or partner name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6A00]"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as any)}
          className="px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
        >
          <option value="ALL">All Stages</option>
          {Object.entries(STAGE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
        >
          <option value="ALL">All Types</option>
          <option value="CUSTOMER_REFERRAL">Customer Referral</option>
          <option value="COORDINATION_ENQUIRY">Coordination Enquiry</option>
        </select>

        <button
          onClick={fetchTickets}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Tickets Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-xs">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading referral tickets...</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          <Ticket className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="font-semibold">No referral tickets found</p>
          <p className="text-xs mt-1">Tickets will appear here as partners submit referrals and coordination requests.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 overflow-hidden">
              {/* Ticket Row */}
              <button
                onClick={() => handleExpandTicket(ticket)}
                className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                      {ticket.ticketReference}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STAGE_COLORS[ticket.stage]}`}>
                      {STAGE_LABELS[ticket.stage]}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      ticket.submissionType === 'CUSTOMER_REFERRAL'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                        : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                    }`}>
                      {ticket.submissionType === 'CUSTOMER_REFERRAL' ? 'Customer Referral' : 'Coordination'}
                    </span>
                    {ticket.promotionalCode && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-bold">
                        {ticket.promotionalCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                    {ticket.dealTitle}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Partner: <strong>{ticket.partnerName}</strong> · {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="hidden sm:flex flex-col items-end text-right shrink-0">
                  {ticket.rewardDisplay && (
                    <span className="text-[11px] font-bold text-orange-600">{ticket.rewardDisplay}</span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {ticket.assignedCoordinator || 'Unassigned'}
                  </span>
                </div>

                {expandedTicket === ticket.id ? (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {/* Expanded Detail & Edit Panel */}
              {expandedTicket === ticket.id && (
                <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30 animate-in fade-in duration-150">
                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                        <User className="w-3 h-3" /> Partner
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white">{ticket.partnerName}</p>
                      <p className="font-mono text-slate-600 dark:text-slate-300">{ticket.partnerPhoneMasked}</p>
                    </div>

                    {ticket.submissionType === 'CUSTOMER_REFERRAL' && ticket.customerFirstName && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                          <Users className="w-3 h-3" /> Customer
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {ticket.customerFirstName} {ticket.customerLastName}
                        </p>
                        <p className="font-mono text-slate-600 dark:text-slate-300">{ticket.customerPhoneMasked}</p>
                        <p className="text-[10px]">
                          Consent: {ticket.contactPermissionConfirmed
                            ? <span className="text-green-600 font-bold">Confirmed</span>
                            : <span className="text-red-600 font-bold">Not Confirmed</span>}
                        </p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                        <Package className="w-3 h-3" /> Requirements
                      </span>
                      <p className="text-slate-900 dark:text-white"><strong>{ticket.quantity}</strong> unit(s)</p>
                      {ticket.deliveryDestination && (
                        <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-orange-500" /> {ticket.deliveryDestination}
                        </p>
                      )}
                      {ticket.specifications && (
                        <p className="text-slate-500 text-[10px]">{ticket.specifications}</p>
                      )}
                    </div>

                    {/* Internal Merchant Info (Admin Only) */}
                    {ticket.merchantName && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> Internal Merchant
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white">{ticket.merchantName}</p>
                        {ticket.merchantOrgId && (
                          <p className="font-mono text-[10px] text-slate-400">{ticket.merchantOrgId}</p>
                        )}
                        <p className="text-[10px] text-rose-500 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Hidden from partner view
                        </p>
                      </div>
                    )}

                    {ticket.additionalNotes && (
                      <div className="space-y-1 sm:col-span-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Notes
                        </span>
                        <p className="text-slate-700 dark:text-slate-300">{ticket.additionalNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Admin Edit Form */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Update Ticket Status
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">Stage</label>
                        <select
                          value={editStage}
                          onChange={(e) => setEditStage(e.target.value as ReferralTicketStage)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                        >
                          {Object.entries(STAGE_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">Assigned Coordinator</label>
                        <input
                          type="text"
                          value={editCoordinator}
                          onChange={(e) => setEditCoordinator(e.target.value)}
                          placeholder="e.g. Sarah (Coordination Desk)"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">Next Action</label>
                        <input
                          type="text"
                          value={editNextAction}
                          onChange={(e) => setEditNextAction(e.target.value)}
                          placeholder="e.g. Confirm availability with merchant"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">Due By</label>
                        <input
                          type="text"
                          value={editNextActionDue}
                          onChange={(e) => setEditNextActionDue(e.target.value)}
                          placeholder="e.g. Tomorrow 10:00 AM"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Internal Coordinator Notes</label>
                      <textarea
                        rows={2}
                        value={editCoordinatorNotes}
                        onChange={(e) => setEditCoordinatorNotes(e.target.value)}
                        placeholder="Internal notes for coordination team..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Partner-Visible Update</label>
                      <textarea
                        rows={2}
                        value={editPartnerUpdate}
                        onChange={(e) => setEditPartnerUpdate(e.target.value)}
                        placeholder="What the partner will see as the latest status..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {editStage === 'CLOSED' && (
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">Closure Reason</label>
                        <select
                          value={editClosureReason}
                          onChange={(e) => setEditClosureReason(e.target.value as ReferralClosureReason)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                        >
                          <option value="">Select reason...</option>
                          {CLOSURE_REASONS.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleUpdateTicket(ticket.id)}
                        disabled={updating === ticket.id}
                        className="px-5 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {updating === ticket.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        {updating === ticket.id ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setExpandedTicket(null)}
                        className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
