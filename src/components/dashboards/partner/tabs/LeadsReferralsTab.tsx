'use client'

import React, { useState } from 'react'
import {
  Users,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  FileText,
  Upload,
  ShieldCheck,
  Lock,
  X,
  RotateCcw,
} from 'lucide-react'
import { PartnerLeadItem, JoinedDealItem, LeadLifecycleStatus } from '../types'
import { usePartnerToast } from '../PartnerToast'

interface LeadsReferralsTabProps {
  leads: PartnerLeadItem[]
  setLeads: React.Dispatch<React.SetStateAction<PartnerLeadItem[]>>
  joinedDeals: JoinedDealItem[]
  showNewLeadModal: boolean
  setShowNewLeadModal: (show: boolean) => void
  selectedDealForLead?: JoinedDealItem | null
}

export function LeadsReferralsTab({
  leads,
  setLeads,
  joinedDeals,
  showNewLeadModal,
  setShowNewLeadModal,
  selectedDealForLead,
}: LeadsReferralsTabProps) {
  const { showToast } = usePartnerToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [appealModalLead, setAppealModalLead] = useState<PartnerLeadItem | null>(null)
  const [appealReason, setAppealReason] = useState('')

  // New Lead Form State
  const [leadForm, setLeadForm] = useState({
    dealId: selectedDealForLead?.id || joinedDeals[0]?.id || '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    productInterested: 'Solar Home Kit 200W',
    estimatedValueTZS: 380000,
    consentConfirmed: false,
    notes: '',
  })

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.dealTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.customerPhoneMasked.includes(searchQuery)
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSubmitNewLead = () => {
    if (!leadForm.customerName.trim() || !leadForm.customerPhone.trim()) {
      showToast('error', 'Validation Error', 'Customer name and phone number are mandatory.')
      return
    }

    if (!leadForm.consentConfirmed) {
      showToast('error', 'Consent Required', 'You must declare that the customer gave explicit consent.')
      return
    }

    const targetDeal = joinedDeals.find((d) => d.id === leadForm.dealId) || joinedDeals[0]
    if (!targetDeal) {
      showToast('error', 'No Enrolled Deal', 'You must join an active deal before submitting referral leads.')
      return
    }

    const newLead: PartnerLeadItem = {
      id: `lead_${Date.now()}`,
      dealId: targetDeal.id,
      dealTitle: targetDeal.title,
      businessName: targetDeal.businessName,
      customerName: leadForm.customerName,
      customerPhoneMasked: `+255 ${leadForm.customerPhone.slice(0, 3)} *** ${leadForm.customerPhone.slice(-3)}`,
      customerEmail: leadForm.customerEmail || undefined,
      productInterested: leadForm.productInterested,
      referralDate: 'Today, Just now',
      estimatedValueTZS: Number(leadForm.estimatedValueTZS),
      status: 'SUBMITTED',
      consentConfirmed: true,
      notes: leadForm.notes,
      updatedAt: 'Today, Just now',
    }

    setLeads([newLead, ...leads])
    setShowNewLeadModal(false)
    setLeadForm({
      dealId: joinedDeals[0]?.id || '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      productInterested: 'Solar Home Kit 200W',
      estimatedValueTZS: 380000,
      consentConfirmed: false,
      notes: '',
    })

    showToast(
      'success',
      'Lead Submitted for Validation',
      `Customer lead for "${newLead.customerName}" submitted to ${targetDeal.businessName}. You will be notified upon verification.`
    )
  }

  const handleExecuteAppeal = () => {
    if (!appealModalLead || !appealReason.trim()) return

    setLeads((prev) =>
      prev.map((l) =>
        l.id === appealModalLead.id
          ? {
              ...l,
              status: 'VALIDATING',
              appealStatus: 'APPEALED',
              notes: `${l.notes || ''} [Partner Appeal: "${appealReason}"]`,
            }
          : l
      )
    )

    showToast(
      'info',
      'Appeal Submitted',
      `Appeal submitted for customer lead "${appealModalLead.customerName}". Assigned to LUMO mediation reviewer.`
    )
    setAppealModalLead(null)
    setAppealReason('')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Customer Leads & Commercial Referrals</span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded-full">
              Draft CRUD + Controlled Submission
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit customer inquiries and track qualification status. Submitted records are immutable for audit integrity.
          </p>
        </div>

        <button
          onClick={() => setShowNewLeadModal(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Customer Lead</span>
        </button>
      </div>

      {/* Audit Safeguard Notice */}
      <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong>Lead Lifecycle & Non-Deletion Rule:</strong> Lifecycle: <code>Draft → Submitted → Validating → Qualified/Rejected → Converted/Expired</code>. Once submitted, leads cannot be deleted. If a lead is rejected unfairly, you may trigger an <strong>Official Appeal</strong> with evidence.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by customer name, phone, or deal title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Lead Statuses</option>
            <option value="QUALIFIED">Qualified / Verified</option>
            <option value="VALIDATING">Validating by Business</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="CONVERTED">Converted & Reward Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[750px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b">
            <tr>
              <th className="p-3">Customer & Deal</th>
              <th className="p-3">Contact Masked</th>
              <th className="p-3">Product / Estimated Value</th>
              <th className="p-3">Status</th>
              <th className="p-3">Reward Earned</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3">
                  <div className="font-extrabold text-slate-900 dark:text-white">{lead.customerName}</div>
                  <div className="text-[10px] text-slate-400">{lead.dealTitle} ({lead.businessName})</div>
                </td>

                <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                  {lead.customerPhoneMasked}
                </td>

                <td className="p-3">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{lead.productInterested}</div>
                  <div className="text-[10px] text-slate-400 font-mono">TZS {lead.estimatedValueTZS.toLocaleString()}</div>
                </td>

                <td className="p-3">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      lead.status === 'CONVERTED' || lead.status === 'QUALIFIED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : lead.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {lead.status}
                  </span>
                  {lead.rejectionReason && (
                    <div className="text-[10px] text-red-600 font-normal mt-0.5 max-w-xs">
                      Reason: {lead.rejectionReason}
                    </div>
                  )}
                </td>

                <td className="p-3 font-mono font-bold text-[#FF6A00]">
                  {lead.earnedRewardTZS ? `TZS ${lead.earnedRewardTZS.toLocaleString()}` : '—'}
                </td>

                <td className="p-3 text-right">
                  {lead.status === 'REJECTED' && lead.appealStatus !== 'APPEALED' && (
                    <button
                      onClick={() => setAppealModalLead(lead)}
                      className="py-1 px-2.5 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50"
                    >
                      Appeal Rejection
                    </button>
                  )}
                  {lead.appealStatus === 'APPEALED' && (
                    <span className="text-[10px] text-purple-600 font-bold">Appeal in Review</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SUBMIT LEAD MODAL */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Submit Customer Lead / Referral
                </h3>
              </div>
              <button onClick={() => setShowNewLeadModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Select Enrolled Deal</label>
                <select
                  value={leadForm.dealId}
                  onChange={(e) => setLeadForm({ ...leadForm, dealId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  {joinedDeals.filter(d => d.status === 'ACTIVE').map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.businessName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Customer Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Amina Selemani"
                  value={leadForm.customerName}
                  onChange={(e) => setLeadForm({ ...leadForm, customerName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Customer Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  placeholder="e.g. 0754 123 456"
                  value={leadForm.customerPhone}
                  onChange={(e) => setLeadForm({ ...leadForm, customerPhone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Product / Commercial Package</label>
                <input
                  type="text"
                  value={leadForm.productInterested}
                  onChange={(e) => setLeadForm({ ...leadForm, productInterested: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Referral Context & Meeting Notes</label>
                <textarea
                  rows={2}
                  placeholder="Describe customer location, specific equipment required, or scheduled demo..."
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="pt-2 border-t">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={leadForm.consentConfirmed}
                    onChange={(e) => setLeadForm({ ...leadForm, consentConfirmed: e.target.checked })}
                    className="w-4 h-4 text-[#FF6A00] rounded mt-0.5"
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-300">
                    I confirm that the customer has provided explicit consent to be contacted regarding this commercial deal.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleSubmitNewLead}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl shadow-xs"
              >
                Submit Customer Referral
              </button>
              <button onClick={() => setShowNewLeadModal(false)} className="py-2.5 px-4 border rounded-xl font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPEAL MODAL */}
      {appealModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2 text-red-600 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Appeal Lead Rejection
                </h3>
              </div>
              <button onClick={() => setAppealModalLead(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-800 dark:text-red-300">
                Rejection Reason: <strong>{appealModalLead.rejectionReason}</strong>
              </div>

              <div>
                <label className="font-bold block mb-1">Appeal Justification & Additional Proof</label>
                <textarea
                  rows={3}
                  placeholder="Explain why this lead is valid (e.g. attached proof of communication, physical store receipt, or verified NIDA)..."
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleExecuteAppeal}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl"
              >
                Submit Official Appeal
              </button>
              <button onClick={() => setAppealModalLead(null)} className="py-2.5 px-4 border rounded-xl font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
