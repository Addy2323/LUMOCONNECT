'use client'

import React, { useState, useEffect } from 'react'
import {
  Award,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Receipt,
  FileSpreadsheet,
  X,
  FileText,
  MessageSquare,
  Building,
  Check,
} from 'lucide-react'
import { useAdminToast } from '../AdminToast'
import {
  listAdminReferralCases,
  updateReferralCaseStage,
  getWhatsAppCoordinationUrl,
} from '@/modules/deals/referral-cases'
import type { ReferralCase } from '@/modules/deals/types'

export function RewardsPayoutsTab() {
  const { showToast } = useAdminToast()

  const [cases, setCases] = useState<ReferralCase[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedCaseForReview, setSelectedCaseForReview] = useState<ReferralCase | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  const reloadCases = () => {
    setCases(listAdminReferralCases())
  }

  useEffect(() => {
    reloadCases()
    const handleUpdate = () => reloadCases()
    window.addEventListener('lumo:referral-cases-updated', handleUpdate)
    return () => window.removeEventListener('lumo:referral-cases-updated', handleUpdate)
  }, [])

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dealTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerFirstName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || c.rewardStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  // Aggregate metrics
  const totalReportedPaid = cases
    .filter((c) => c.rewardStatus === 'MERCHANT_REPORTS_PAID' || c.rewardStatus === 'PARTNER_CONFIRMS_RECEIPT')
    .reduce((sum, c) => sum + c.rewardAmountTZS, 0)

  const totalConfirmed = cases
    .filter((c) => c.rewardStatus === 'PARTNER_CONFIRMS_RECEIPT')
    .reduce((sum, c) => sum + c.rewardAmountTZS, 0)

  const totalAwaiting = cases
    .filter((c) => c.rewardStatus === 'AWAITING_MERCHANT_PAYMENT')
    .reduce((sum, c) => sum + c.rewardAmountTZS, 0)

  const disputedCount = cases.filter((c) => c.rewardStatus === 'DISPUTED').length

  const handleResolveDispute = (caseItem: ReferralCase, resolution: 'CONFIRM' | 'REMIND_MERCHANT') => {
    if (resolution === 'CONFIRM') {
      updateReferralCaseStage(caseItem.id, caseItem.stage, {
        rewardStatus: 'PARTNER_CONFIRMS_RECEIPT',
        coordinatorNotes: `Dispute resolved by Admin: ${reviewNotes || 'Settlement verified with both parties.'}`,
      })
      reloadCases()
      showToast('success', 'Dispute Resolved', `Referral ${caseItem.reference} reward marked as confirmed.`)
    } else {
      updateReferralCaseStage(caseItem.id, caseItem.stage, {
        coordinatorNotes: `Admin follow-up: Merchant notified of overdue payment. Notes: ${reviewNotes}`,
      })
      reloadCases()
      showToast('info', 'Merchant Reminder Sent', `Merchant reminded regarding overdue reward settlement.`)
    }
    setSelectedCaseForReview(null)
    setReviewNotes('')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Direct Reward Tracking & Settlement Desk</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full">
              Lumo Dealers Operating Model
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit merchant-reported direct payments, verify partner receipt confirmations, track overdue cases, and resolve disputes.
          </p>
        </div>
      </div>

      {/* Official Platform Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Platform Settlement Notice:</strong> Lumo Dealers charges subscription fees for access to opportunities and provides referral coordination. Customers pay merchants directly, and merchants pay agreed referral rewards directly to partners. Lumo does not collect, hold or disburse these transaction payments or rewards.
        </div>
      </div>

      {/* 4 Settlement KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Merchant Reported Settlements
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-600 font-mono mt-1">
            TZS {totalReportedPaid.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Reported disbursed directly</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Partner Confirmed Receipts
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-1">
            TZS {totalConfirmed.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 block">Verified by partners</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Awaiting Merchant Payment
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-1">
            TZS {totalAwaiting.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Purchase complete, pending reward</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Disputes
          </span>
          <div className="text-xl sm:text-2xl font-black text-rose-600 font-mono mt-1">
            {disputedCount}
          </div>
          <span className="text-[10px] text-rose-600 mt-0.5 block">Requiring review</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search settlements by reference, partner, customer, or deal title..."
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
            <option value="ALL">All Reward Settlement Statuses</option>
            <option value="NOT_YET_EARNED">Not Yet Earned</option>
            <option value="AWAITING_MERCHANT_PAYMENT">Awaiting Merchant Payment</option>
            <option value="MERCHANT_REPORTS_PAID">Merchant Reports Paid</option>
            <option value="PARTNER_CONFIRMS_RECEIPT">Partner Confirms Receipt</option>
            <option value="DISPUTED">Disputed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[850px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b">
            <tr>
              <th className="p-3">Reference & Opportunity</th>
              <th className="p-3">Partner Details</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Agreed Reward</th>
              <th className="p-3">Settlement Status</th>
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
                    <div className="font-extrabold text-slate-900 dark:text-white line-clamp-1 max-w-xs">
                      {caseItem.dealTitle}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{caseItem.partnerName}</div>
                    <div className="font-mono text-[10px] text-slate-400">{caseItem.partnerPhone}</div>
                  </td>

                  <td className="p-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {caseItem.customerFirstName} {caseItem.customerLastName}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">{caseItem.customerPhoneMasked}</div>
                  </td>

                  <td className="p-3">
                    <div className="font-mono font-black text-emerald-600">
                      TZS {caseItem.rewardAmountTZS.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">{caseItem.rewardDisplay}</div>
                  </td>

                  <td className="p-3">
                    {caseItem.rewardStatus === 'PARTNER_CONFIRMS_RECEIPT' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed by Partner
                      </span>
                    )}
                    {caseItem.rewardStatus === 'MERCHANT_REPORTS_PAID' && (
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          Merchant Reports Paid
                        </span>
                        {caseItem.merchantPaymentReference && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Ref: {caseItem.merchantPaymentReference}
                          </div>
                        )}
                      </div>
                    )}
                    {caseItem.rewardStatus === 'AWAITING_MERCHANT_PAYMENT' && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Awaiting Payment
                      </span>
                    )}
                    {caseItem.rewardStatus === 'NOT_YET_EARNED' && (
                      <span className="text-[10px] text-slate-500">Not Yet Earned</span>
                    )}
                    {caseItem.rewardStatus === 'DISPUTED' && (
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Disputed
                        </span>
                        {caseItem.disputeReason && (
                          <div className="text-[10px] text-rose-600 mt-0.5 max-w-xs line-clamp-1">
                            {caseItem.disputeReason}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="p-3 text-right space-y-1">
                    <div>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#15803d] dark:text-[#25D366] font-bold text-[11px]"
                      >
                        <MessageSquare className="w-3 h-3 text-[#25D366]" />
                        <span>WhatsApp Handoff</span>
                      </a>
                    </div>

                    {caseItem.rewardStatus === 'DISPUTED' && (
                      <button
                        onClick={() => setSelectedCaseForReview(caseItem)}
                        className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                      >
                        Review Dispute
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* DISPUTE REVIEW MODAL */}
      {selectedCaseForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Resolve Settlement Dispute
                </h3>
              </div>
              <button onClick={() => setSelectedCaseForReview(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl space-y-1">
                <div className="font-bold text-rose-900 dark:text-rose-200">
                  Referral: {selectedCaseForReview.reference}
                </div>
                <div className="text-[11px] text-rose-800 dark:text-rose-300">
                  Dispute: {selectedCaseForReview.disputeReason}
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Admin Investigation Notes / Action</label>
                <textarea
                  rows={3}
                  placeholder="Record outcome of conversation with merchant and partner..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => handleResolveDispute(selectedCaseForReview, 'CONFIRM')}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl cursor-pointer"
              >
                Mark as Confirmed
              </button>
              <button
                onClick={() => handleResolveDispute(selectedCaseForReview, 'REMIND_MERCHANT')}
                className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Remind Merchant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
