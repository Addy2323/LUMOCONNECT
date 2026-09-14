'use client'

import React, { useState, useEffect } from 'react'
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
  ShieldCheck,
  Lock,
  X,
  MessageSquare,
  ExternalLink,
  Receipt,
  AlertCircle,
} from 'lucide-react'
import { PartnerLeadItem, JoinedDealItem } from '../types'
import { usePartnerToast } from '../PartnerToast'
import {
  listPartnerReferralCases,
  confirmPartnerRewardReceipt,
  disputeReferralReward,
  getWhatsAppCoordinationUrl,
} from '@/modules/deals/referral-cases'
import type { ReferralCase, ReferralCaseStage, DirectRewardStatus } from '@/modules/deals/types'
import { CustomerReferralModal } from '@/components/marketplace/CustomerReferralModal'

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
  const [stageFilter, setStageFilter] = useState('ALL')
  const [referralCases, setReferralCases] = useState<ReferralCase[]>([])
  const [selectedCaseForDispute, setSelectedCaseForDispute] = useState<ReferralCase | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [selectedDealForReferral, setSelectedDealForReferral] = useState<JoinedDealItem | null>(null)

  const reloadCases = () => {
    setReferralCases(listPartnerReferralCases('alex'))
  }

  useEffect(() => {
    reloadCases()
    const handleUpdate = () => reloadCases()
    window.addEventListener('lumo:referral-cases-updated', handleUpdate)
    return () => window.removeEventListener('lumo:referral-cases-updated', handleUpdate)
  }, [])

  const filteredCases = referralCases.filter((c) => {
    const matchesSearch =
      c.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerFirstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerLastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dealTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerPhoneMasked.includes(searchQuery)
    const matchesStage = stageFilter === 'ALL' || c.stage === stageFilter
    return matchesSearch && matchesStage
  })

  const handleConfirmReceipt = (caseItem: ReferralCase) => {
    const success = confirmPartnerRewardReceipt(caseItem.id, 'alex')
    if (success) {
      reloadCases()
      showToast(
        'success',
        'Reward Receipt Confirmed',
        `You have confirmed receipt of ${caseItem.rewardDisplay} for referral ${caseItem.reference}.`
      )
    }
  }

  const handleExecuteDispute = () => {
    if (!selectedCaseForDispute || !disputeReason.trim()) return
    const success = disputeReferralReward(selectedCaseForDispute.id, disputeReason.trim())
    if (success) {
      reloadCases()
      showToast(
        'info',
        'Dispute Logged',
        `Dispute registered for referral ${selectedCaseForDispute.reference}. Lumo review desk will investigate.`
      )
      setSelectedCaseForDispute(null)
      setDisputeReason('')
    }
  }

  const getStageBadge = (stage: ReferralCaseStage) => {
    switch (stage) {
      case 'SUBMITTED':
        return <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full text-[10px]">Submitted</span>
      case 'UNDER_REVIEW':
        return <span className="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full text-[10px]">Under Review</span>
      case 'AVAILABILITY_CONFIRMED':
        return <span className="bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-bold px-2 py-0.5 rounded-full text-[10px]">Availability Confirmed</span>
      case 'IN_PROGRESS':
        return <span className="bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 font-bold px-2 py-0.5 rounded-full text-[10px]">In Progress</span>
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px]">Completed</span>
      case 'CLOSED':
        return <span className="bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 font-bold px-2 py-0.5 rounded-full text-[10px]">Closed</span>
    }
  }

  const getRewardBadge = (status: DirectRewardStatus) => {
    switch (status) {
      case 'NOT_YET_EARNED':
        return <span className="text-slate-500 font-medium text-[11px]">Not Yet Earned</span>
      case 'AWAITING_MERCHANT_PAYMENT':
        return <span className="text-amber-600 font-bold text-[11px]">Awaiting Merchant Payment</span>
      case 'MERCHANT_REPORTS_PAID':
        return <span className="text-blue-600 font-black text-[11px] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Merchant Reports Paid</span>
      case 'PARTNER_CONFIRMS_RECEIPT':
        return <span className="text-emerald-600 font-black text-[11px] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Partner Confirmed</span>
      case 'DISPUTED':
        return <span className="text-rose-600 font-black text-[11px] flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Disputed</span>
    }
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Referral Case Desk & WhatsApp Follow-up</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full">
              Lumo Dealers Operating Model
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track submitted customer cases, follow coordination progress with Lumo, and confirm direct reward settlement from merchants.
          </p>
        </div>

        <button
          onClick={() => {
            const firstDeal = joinedDeals.find((d) => d.status === 'ACTIVE') || joinedDeals[0]
            setSelectedDealForReferral(firstDeal || null)
            setShowReferralModal(true)
          }}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>I Have a Customer</span>
        </button>
      </div>

      {/* Lumo Dealers Operating Model Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Commercial Settlement Notice:</strong> Lumo Dealers charges subscription fees for access to opportunities and provides referral coordination. Customers pay merchants directly, and merchants pay agreed referral rewards directly to partners. Lumo does not collect, hold or disburse these transaction payments or rewards.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search referral cases by reference (LUMO-REF-...), customer, or deal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Case Stages</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="AVAILABILITY_CONFIRMED">Availability Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[850px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b">
            <tr>
              <th className="p-3">Reference & Deal</th>
              <th className="p-3">Customer Contact</th>
              <th className="p-3">Case Stage</th>
              <th className="p-3">Next Action / Coordinator</th>
              <th className="p-3">Direct Reward Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filteredCases.map((caseItem) => {
              const waLink = getWhatsAppCoordinationUrl(caseItem.reference, caseItem.dealTitle)

              return (
                <tr key={caseItem.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-mono font-black text-blue-600 dark:text-blue-400">
                      {caseItem.reference}
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1 max-w-xs">
                      {caseItem.dealTitle}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Reward: <strong>{caseItem.rewardDisplay}</strong>
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {caseItem.customerFirstName} {caseItem.customerLastName}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {caseItem.customerPhoneMasked}
                    </div>
                  </td>

                  <td className="p-3">
                    {getStageBadge(caseItem.stage)}
                    {caseItem.partnerVisibleUpdate && (
                      <div className="text-[10px] text-slate-500 mt-1 max-w-xs leading-snug">
                        {caseItem.partnerVisibleUpdate}
                      </div>
                    )}
                  </td>

                  <td className="p-3">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {caseItem.nextAction || 'Awaiting coordinator follow-up'}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{caseItem.assignedCoordinator || 'Sarah (Lumo Coordination Desk)'}</span>
                    </div>
                  </td>

                  <td className="p-3">
                    <div>{getRewardBadge(caseItem.rewardStatus)}</div>
                    {caseItem.merchantPaymentReference && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Ref: {caseItem.merchantPaymentReference}
                      </div>
                    )}
                  </td>

                  <td className="p-3 text-right space-y-1">
                    {/* WhatsApp Coordination Link */}
                    <div>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#15803d] dark:text-[#25D366] font-bold text-[11px] transition-colors"
                      >
                        <MessageSquare className="w-3 h-3 text-[#25D366]" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    </div>

                    {/* Direct Payment Confirmation Actions */}
                    {caseItem.rewardStatus === 'MERCHANT_REPORTS_PAID' && (
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          onClick={() => handleConfirmReceipt(caseItem)}
                          className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                        >
                          Confirm Receipt
                        </button>
                        <button
                          onClick={() => setSelectedCaseForDispute(caseItem)}
                          className="py-1 px-2 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-bold border border-rose-200 cursor-pointer"
                        >
                          Dispute
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* DISPUTE MODAL */}
      {selectedCaseForDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Raise Reward Settlement Dispute
                </h3>
              </div>
              <button onClick={() => setSelectedCaseForDispute(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-800 dark:text-rose-300">
                Referral: <strong>{selectedCaseForDispute.reference}</strong> ({selectedCaseForDispute.dealTitle})
              </div>

              <div>
                <label className="font-bold block mb-1">Dispute Reason / Details</label>
                <textarea
                  rows={3}
                  placeholder="Explain the discrepancy (e.g. merchant reported paid but funds not received in M-Pesa, or amount differs from agreed reward)..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleExecuteDispute}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl cursor-pointer"
              >
                Submit Dispute
              </button>
              <button
                onClick={() => setSelectedCaseForDispute(null)}
                className="py-2.5 px-4 border rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      {selectedDealForReferral && (
        <CustomerReferralModal
          deal={{
            id: selectedDealForReferral.opportunityId || selectedDealForReferral.id,
            title: selectedDealForReferral.title,
            slug: selectedDealForReferral.opportunityId || selectedDealForReferral.id,
            rewardDisplay: selectedDealForReferral.rewardDisplay,
          } as any}
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          onReferralSubmitted={() => {
            reloadCases()
            setShowReferralModal(false)
          }}
        />
      )}
    </div>
  )
}
