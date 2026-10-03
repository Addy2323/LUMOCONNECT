'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Building2,
  MapPin,
  Globe,
  Share2,
  Send,
  Sparkles,
  UserCheck,
  ChevronRight,
  X,
  MessageSquare,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  XCircle,
} from 'lucide-react'

export interface BusinessInterestLead {
  id: string
  submittingAs?: string | null
  businessName: string
  contactName: string
  phone: string
  email: string
  category: string
  interests: string[]
  description?: string | null
  website?: string | null
  location?: string | null
  socialMedia?: string | null
  status:
    | 'NEW'
    | 'CONTACTED'
    | 'QUALIFIED'
    | 'ONBOARDING'
    | 'VERIFIED'
    | 'CONVERTED'
    | 'NOT_INTERESTED'
  adminNotes?: string | null
  createdAt: string
  updatedAt: string
}

function getSubmittingAs(lead: BusinessInterestLead): string {
  if (lead.submittingAs) return lead.submittingAs
  if (lead.description) {
    const match = lead.description.match(/\[Submitting As: (.*?)\]/)
    if (match && match[1]) return match[1]
  }
  return 'Business'
}

export function BusinessInterestsTab() {
  const [leads, setLeads] = useState<BusinessInterestLead[]>([])
  const [counts, setCounts] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    onboarding: 0,
    verified: 0,
    converted: 0,
    not_interested: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Selected lead modal
  const [selectedLead, setSelectedLead] = useState<BusinessInterestLead | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editStatus, setEditStatus] = useState<string>('NEW')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateFeedback, setUpdateFeedback] = useState('')

  // Rejection modal state
  const [rejectingLead, setRejectingLead] = useState<BusinessInterestLead | null>(null)
  const [rejectionPreset, setRejectionPreset] = useState<string>('Invalid / Unreachable Phone Number')
  const [rejectionReason, setRejectionReason] = useState('')

  const handleOpenRejectModal = (lead: BusinessInterestLead) => {
    setRejectingLead(lead)
    setRejectionPreset('Invalid / Unreachable Phone Number')
    setRejectionReason('')
  }

  const handleConfirmReject = async () => {
    if (!rejectingLead) return
    const noteText =
      rejectionPreset === 'Custom Reason'
        ? rejectionReason.trim() || 'Rejected by admin'
        : `${rejectionPreset}${rejectionReason.trim() ? ` — ${rejectionReason.trim()}` : ''}`

    await handleUpdateLeadStatus(
      rejectingLead.id,
      'NOT_INTERESTED',
      `Rejected by admin — Reason: ${noteText}`
    )
    setRejectingLead(null)
  }

  const fetchLeads = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const q = new URLSearchParams()
      if (statusFilter !== 'ALL') q.set('status', statusFilter)
      if (categoryFilter !== 'ALL') q.set('category', categoryFilter)
      if (searchQuery.trim()) q.set('search', searchQuery.trim())

      const res = await fetch(`/api/admin/business-interests?${q.toString()}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch business interest leads')
      }

      setLeads(data.leads || [])
      if (data.counts) {
        setCounts(data.counts)
      }
    } catch (err: any) {
      setError(err.message || 'Error loading business interest leads')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, categoryFilter, searchQuery])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const handleOpenLeadModal = (lead: BusinessInterestLead) => {
    setSelectedLead(lead)
    setEditStatus(lead.status)
    setEditNotes(lead.adminNotes || '')
    setUpdateFeedback('')
  }

  const handleUpdateLeadStatus = async (
    targetId: string,
    newStatus: string,
    notes?: string
  ) => {
    setIsUpdating(true)
    setUpdateFeedback('')
    try {
      const res = await fetch('/api/admin/business-interests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetId,
          status: newStatus,
          adminNotes: notes !== undefined ? notes : editNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update lead status')
      }

      setUpdateFeedback(data.message || 'Status updated successfully')
      fetchLeads()

      if (selectedLead && selectedLead.id === targetId) {
        setSelectedLead(data.lead)
      }
    } catch (err: any) {
      setUpdateFeedback(`Error: ${err.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] border border-orange-300 dark:border-orange-800 flex items-center gap-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] animate-pulse" />
            NEW LEAD
          </span>
        )
      case 'CONTACTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 w-fit">
            CONTACTED
          </span>
        )
      case 'QUALIFIED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 w-fit">
            QUALIFIED
          </span>
        )
      case 'ONBOARDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1 w-fit">
            <Sparkles className="w-3 h-3" />
            ONBOARDING
          </span>
        )
      case 'VERIFIED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 w-fit">
            <ShieldCheck className="w-3 h-3" />
            VERIFIED
          </span>
        )
      case 'CONVERTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-800 w-fit">
            CONVERTED
          </span>
        )
      case 'NOT_INTERESTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700 w-fit">
            NOT INTERESTED
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-mono text-[10px] font-black uppercase">
              LEAD GEN PORTAL
            </span>
            <span className="text-xs text-slate-500 font-bold">Admin Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Business Interest Leads
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Review expressions of interest from business owners, track engagement status, and send automated onboarding SMS invites to guided onboarding.
          </p>
        </div>

        <button
          onClick={fetchLeads}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Leads</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{counts.total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/60 shadow-xs space-y-1">
          <div className="text-[10px] font-extrabold uppercase text-orange-600 dark:text-orange-400 flex items-center justify-between">
            <span>New Leads</span>
            <span className="w-2 h-2 rounded-full bg-[#FF6A00] animate-pulse" />
          </div>
          <div className="text-2xl font-black text-[#FF6A00]">{counts.new}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-1">
          <div className="text-[10px] font-extrabold uppercase text-blue-600 dark:text-blue-400">
            Contacted
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{counts.contacted}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 shadow-xs space-y-1">
          <div className="text-[10px] font-extrabold uppercase text-purple-600 dark:text-purple-400">
            Onboarding
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{counts.onboarding}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
            Converted / Verified
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {counts.converted + counts.verified}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 sm:pb-0 text-xs font-bold">
            {[
              { id: 'ALL', label: `All (${counts.total})` },
              { id: 'NEW', label: `New (${counts.new})` },
              { id: 'CONTACTED', label: `Contacted (${counts.contacted})` },
              { id: 'QUALIFIED', label: `Qualified (${counts.qualified})` },
              { id: 'ONBOARDING', label: `Onboarding (${counts.onboarding})` },
              { id: 'VERIFIED', label: `Verified (${counts.verified})` },
              { id: 'CONVERTED', label: `Converted (${counts.converted})` },
              { id: 'NOT_INTERESTED', label: `Not Interested (${counts.not_interested})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-[#FF6A00] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search business or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 font-bold space-y-2">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>Loading business interest leads...</div>
          </div>
        ) : error ? (
          <div className="py-12 px-4 text-center text-xs text-red-500 font-bold space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <div>{error}</div>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 px-4 text-center text-xs text-slate-400 space-y-2">
            <Briefcase className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <div className="font-bold text-slate-700 dark:text-slate-300">No Business Interest Leads Found</div>
            <div>No submissions match your selected status or search filter.</div>
          </div>
        ) : (
          <div>
            {/* Mobile Card View (shown on screens < md) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {lead.businessName}
                      </h4>
                      <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">
                        {lead.category}
                      </span>
                    </div>
                    {getStatusBadge(lead.status)}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Contact: {lead.contactName}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{lead.phone}</span>
                      </a>
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex items-center gap-1 hover:underline"
                      >
                        <Mail className="w-3 h-3" />
                        <span>{lead.email}</span>
                      </a>
                    </div>
                  </div>

                  {lead.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {lead.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-400"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(lead.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>

                    <div className="flex items-center gap-2">
                      {lead.status !== 'ONBOARDING' && lead.status !== 'VERIFIED' && (
                        <button
                          onClick={() =>
                            handleUpdateLeadStatus(
                              lead.id,
                              'ONBOARDING',
                              'Approved by admin — Auto onboarding SMS sent to https://lumo.co.tz/choose-path'
                            )
                          }
                          disabled={isUpdating}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs"
                          title="Approve lead & trigger onboarding SMS"
                        >
                          <Send className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}

                      {lead.status !== 'NOT_INTERESTED' && (
                        <button
                          onClick={() => handleOpenRejectModal(lead)}
                          disabled={isUpdating}
                          className="px-2.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 font-bold text-[10px] flex items-center gap-1 transition-colors"
                          title="Reject lead with reason"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenLeadModal(lead)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (hidden on screens < md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Business &amp; Category</th>
                    <th className="py-3.5 px-4">Contact Person</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Interests</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                          <span>{lead.businessName}</span>
                          <span className="px-1.5 py-0.5 rounded bg-orange-100/80 dark:bg-orange-950/60 text-[#FF6A00] font-mono text-[9px] font-black uppercase">
                            {getSubmittingAs(lead)}
                          </span>
                        </div>
                        <div className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold mt-0.5">
                          {lead.category}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-200">{lead.contactName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {lead.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {lead.email}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {lead.location || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {lead.interests.map((interest) => (
                            <span
                              key={interest}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-700 dark:text-slate-300"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(lead.status)}</td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">
                        {new Date(lead.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.status !== 'ONBOARDING' && lead.status !== 'VERIFIED' && (
                            <button
                              onClick={() =>
                                handleUpdateLeadStatus(
                                  lead.id,
                                  'ONBOARDING',
                                  'Approved by admin — Auto onboarding SMS sent to https://lumo.co.tz/choose-path'
                                )
                              }
                              disabled={isUpdating}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-all flex items-center gap-1 shadow-xs"
                              title="Approve lead & trigger onboarding SMS"
                            >
                              <Send className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}

                          {lead.status !== 'NOT_INTERESTED' && (
                            <button
                              onClick={() => handleOpenRejectModal(lead)}
                              disabled={isUpdating}
                              className="px-2.5 py-1 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 font-bold text-[10px] transition-colors flex items-center gap-1"
                              title="Reject lead with reason"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenLeadModal(lead)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail & Status Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-[#FF6A00] flex items-center justify-center font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedLead.businessName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    {selectedLead.category}
                  </span>
                  <span>•</span>
                  <span>Submitted {new Date(selectedLead.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {updateFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold ${
                  updateFeedback.startsWith('Error')
                    ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {updateFeedback}
              </div>
            )}

            {/* Details Grid */}
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-[#FF6A00]/10 border border-[#FF6A00]/20 space-y-1 sm:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6A00]">Submitting As (Role / Submitter Type)</span>
                <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{getSubmittingAs(selectedLead)}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Contact Person</span>
                <div className="font-bold text-slate-900 dark:text-white">{selectedLead.contactName}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Phone Number</span>
                <div className="font-bold text-orange-600 dark:text-orange-400">{selectedLead.phone}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Email Address</span>
                <div className="font-bold text-slate-900 dark:text-white">{selectedLead.email}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Location / City</span>
                <div className="font-bold text-slate-900 dark:text-white">{selectedLead.location || '—'}</div>
              </div>
            </div>

            {/* Interests & Description */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Areas of Interest</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedLead.interests.map((i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold text-xs flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                      <span>{i}</span>
                    </span>
                  ))}
                </div>
              </div>

              {selectedLead.description && (
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Business Description</span>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs leading-relaxed mt-1">
                    {selectedLead.description}
                  </div>
                </div>
              )}

              {(selectedLead.website || selectedLead.socialMedia) && (
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  {selectedLead.website && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Website</span>
                      <div>
                        <a
                          href={selectedLead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-600 underline font-bold"
                        >
                          {selectedLead.website}
                        </a>
                      </div>
                    </div>
                  )}
                  {selectedLead.socialMedia && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Social Media</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedLead.socialMedia}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Update Form */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center justify-between">
                <span>Update Lead Status &amp; Admin Notes</span>
                {selectedLead.adminNotes && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    Has existing notes
                  </span>
                )}
              </h4>

              {selectedLead.adminNotes && (
                <div className={`p-3 rounded-2xl text-xs font-medium border ${
                  selectedLead.status === 'NOT_INTERESTED'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}>
                  <div className="text-[10px] font-black uppercase tracking-wider mb-0.5 opacity-70">
                    Current Admin Notes / Rejection Reason:
                  </div>
                  <div>{selectedLead.adminNotes}</div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Select Lead Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-xs text-slate-900 dark:text-white font-bold"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="ONBOARDING">ONBOARDING (Triggers SMS)</option>
                    <option value="VERIFIED">VERIFIED (Triggers SMS)</option>
                    <option value="CONVERTED">CONVERTED</option>
                    <option value="NOT_INTERESTED">NOT INTERESTED (Rejected)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Admin Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Add internal notes..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateLeadStatus(
                        selectedLead.id,
                        'ONBOARDING',
                        'Approved by admin — Auto onboarding SMS sent to https://lumo.co.tz/choose-path'
                      )
                    }
                    disabled={isUpdating}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve &amp; Send SMS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const leadToReject = selectedLead
                      setSelectedLead(null)
                      handleOpenRejectModal(leadToReject)
                    }}
                    disabled={isUpdating}
                    className="px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-red-500/20"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Lead</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLead(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateLeadStatus(selectedLead.id, editStatus, editNotes)
                    }
                    disabled={isUpdating}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-black hover:opacity-90 transition-opacity"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setRejectingLead(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Reject Business Lead
                </h3>
                <p className="text-xs text-slate-500">
                  {rejectingLead.businessName} ({rejectingLead.contactName})
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Select Rejection Reason
                </label>
                <select
                  value={rejectionPreset}
                  onChange={(e) => setRejectionPreset(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-red-500"
                >
                  <option value="Invalid / Unreachable Phone Number">Invalid / Unreachable Phone Number</option>
                  <option value="Duplicate Submission">Duplicate Submission</option>
                  <option value="Outside Business Scope / Non-Commercial">Outside Business Scope / Non-Commercial</option>
                  <option value="Incomplete / Spam Details">Incomplete / Spam Details</option>
                  <option value="User Requested Cancellation">User Requested Cancellation</option>
                  <option value="Custom Reason">Custom Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Type any specific rejection details or instructions..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingLead(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isUpdating}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-colors flex items-center gap-1.5 shadow-md shadow-red-500/20"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
