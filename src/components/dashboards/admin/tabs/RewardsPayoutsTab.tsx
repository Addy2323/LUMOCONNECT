'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  Wallet,
  ArrowUpRight,
  Send,
  Loader2,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  Smartphone,
} from 'lucide-react'
import { useAdminToast } from '../AdminToast'
import {
  updateReferralCaseStage,
  getWhatsAppCoordinationUrl,
} from '@/modules/deals/referral-cases'
import type { ReferralCase } from '@/modules/deals/types'
import type { PayoutRequestItem } from '@/modules/payouts/payout-store'

export function RewardsPayoutsTab() {
  const { showToast } = useAdminToast()

  // Sub-Tab Navigation: 'payouts' (Mobile money / bank batches) or 'settlements' (Direct merchant deals)
  const [activeSubTab, setActiveSubTab] = useState<'payouts' | 'settlements'>('payouts')

  // ==========================================
  // STATE: PARTNER PAYOUT REQUESTS
  // ==========================================
  const [payouts, setPayouts] = useState<PayoutRequestItem[]>([])
  const [payoutsLoading, setPayoutsLoading] = useState(true)
  const [payoutSearch, setPayoutSearch] = useState('')
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('ALL')

  // Disbursal / Reject Action Modals
  const [selectedPayoutForDisburse, setSelectedPayoutForDisburse] = useState<PayoutRequestItem | null>(null)
  const [disbursalRefInput, setDisbursalRefInput] = useState('')
  const [selectedPayoutForReject, setSelectedPayoutForReject] = useState<PayoutRequestItem | null>(null)
  const [rejectReasonInput, setRejectReasonInput] = useState('')
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  const [snippeBalance, setSnippeBalance] = useState<{ available: number; balance: number; currency: string } | null>(null)
  const [isSendingViaSnippe, setIsSendingViaSnippe] = useState(false)

  // ==========================================
  // STATE: REFERRAL SETTLEMENTS DESK
  // ==========================================
  const [cases, setCases] = useState<ReferralCase[]>([])
  const [casesLoading, setCasesLoading] = useState(true)
  const [caseSearch, setCaseSearch] = useState('')
  const [caseStatusFilter, setCaseStatusFilter] = useState('ALL')
  const [selectedCaseForReview, setSelectedCaseForReview] = useState<ReferralCase | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  // ==========================================
  // LOAD DATA FROM LIVE API
  // ==========================================
  const reloadPayouts = useCallback(async () => {
    setPayoutsLoading(true)
    try {
      const res = await fetch('/api/admin/payouts', { credentials: 'include' })
      const data = await res.json()
      if (data?.success && Array.isArray(data.payouts)) {
        const seenRefs = new Set<string>()
        const deduped: PayoutRequestItem[] = []
        for (const p of data.payouts) {
          const key = p.reference?.trim() || p.id
          if (!seenRefs.has(key)) {
            seenRefs.add(key)
            deduped.push(p)
          }
        }
        setPayouts(deduped)
      }
    } catch (err) {
      console.warn('Failed to load payouts:', err)
    } finally {
      setPayoutsLoading(false)
    }
  }, [])

  const reloadCases = useCallback(async () => {
    setCasesLoading(true)
    try {
      const res = await fetch('/api/referrals/tickets', {
        credentials: 'include',
        headers: {
          'X-User-Role': 'ADMIN',
        },
      })
      const data = await res.json()
      if (data?.success && Array.isArray(data.tickets)) {
        const mappedCases: ReferralCase[] = data.tickets.map((t: any) => ({
          id: t.id,
          reference: t.ticketReference,
          dealId: t.dealId,
          dealTitle: t.dealTitle,
          dealSlug: t.dealSlug,
          partnerUserId: t.partnerUserId,
          partnerName: t.partnerName,
          partnerPhone: t.partnerPhone || '',
          partnerPhoneMasked: t.partnerPhoneMasked || t.partnerPhone,
          customerFirstName: t.customerFirstName || '',
          customerLastName: t.customerLastName || '',
          customerPhone: t.customerPhone || '',
          customerPhoneMasked: t.customerPhoneMasked || t.customerPhone,
          contactPermissionConfirmed: Boolean(t.contactPermissionConfirmed),
          additionalNotes: t.additionalNotes || undefined,
          assignedCoordinator: t.assignedCoordinator || undefined,
          stage: t.stage,
          stageUpdatedAt: t.stageUpdatedAt,
          nextAction: t.nextAction || undefined,
          nextActionDueDate: t.nextActionDueDate || undefined,
          partnerVisibleUpdate: t.partnerVisibleUpdate || undefined,
          rewardAmountTZS: t.rewardAmountTZS || 0,
          rewardDisplay: t.rewardDisplay || 'Commercial Reward Direct from Merchant',
          rewardStatus: t.rewardStatus || 'NOT_YET_EARNED',
          merchantPaymentReportedAt: t.merchantPaymentReportedAt || undefined,
          merchantPaymentReference: t.merchantPaymentReference || undefined,
          merchantPaymentNotes: t.merchantPaymentNotes || undefined,
          partnerReceiptConfirmedAt: t.partnerReceiptConfirmedAt || undefined,
          disputeReason: t.disputeReason || undefined,
          disputedAt: t.disputedAt || undefined,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }))
        setCases(mappedCases)
      }
    } catch (err) {
      console.warn('Failed to load referral cases:', err)
    } finally {
      setCasesLoading(false)
    }
  }, [])

  useEffect(() => {
    reloadPayouts()
    reloadCases()

    fetch('/api/payments/balance')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) setSnippeBalance(res.data)
      })
      .catch((e) => console.warn('Snippe balance fetch in Rewards:', e))

    const handlePayoutUpdate = () => reloadPayouts()
    const handleCaseUpdate = () => reloadCases()

    window.addEventListener('lumo:payouts-updated', handlePayoutUpdate)
    window.addEventListener('lumo:referral-cases-updated', handleCaseUpdate)

    return () => {
      window.removeEventListener('lumo:payouts-updated', handlePayoutUpdate)
      window.removeEventListener('lumo:referral-cases-updated', handleCaseUpdate)
    }
  }, [reloadPayouts, reloadCases])

  // Direct Mobile Money Disbursal via Snippe
  const handleDirectSnippeDisbursal = async () => {
    if (!selectedPayoutForDisburse) return
    const phone = selectedPayoutForDisburse.accountNumber || selectedPayoutForDisburse.partnerPhone
    const name = selectedPayoutForDisburse.accountName || selectedPayoutForDisburse.partnerName
    const amount = selectedPayoutForDisburse.netAmountTZS

    if (snippeBalance && amount > snippeBalance.available) {
      showToast(
        'error',
        'Insufficient Snippe Balance',
        `Available gateway balance is TZS ${snippeBalance.available.toLocaleString()}, but net payout is TZS ${amount.toLocaleString()}. Top up gateway or enter manual reference.`
      )
      return
    }

    setIsSendingViaSnippe(true)
    try {
      const res = await fetch('/api/admin/payments/send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId: selectedPayoutForDisburse.id,
          recipientPhone: phone,
          recipientName: name,
          amountTZS: amount,
          narration: `Reward Payout ${selectedPayoutForDisburse.reference} for ${name}`,
        }),
      })
      const data = await res.json()
      if (data?.success) {
        showToast(
          'success',
          'Money Sent Direct to Phone!',
          `TZS ${amount.toLocaleString()} dispatched to ${phone} via Snippe Mobile Money. Ref: ${data.reference}`
        )
        setSelectedPayoutForDisburse(null)
        setDisbursalRefInput('')
        reloadPayouts()
        fetch('/api/payments/balance')
          .then((r) => r.json())
          .then((b) => b.success && b.data && setSnippeBalance(b.data))
          .catch(() => null)
      } else {
        showToast('error', 'Disbursal Failed', data?.error || 'Failed to dispatch mobile money via Snippe.')
      }
    } catch {
      showToast('error', 'Network Error', 'Check your connection and try again.')
    } finally {
      setIsSendingViaSnippe(false)
    }
  }

  // ==========================================
  // PAYOUT ACTIONS (Authorize / Disburse / Reject)
  // ==========================================
  const handleAuthorizePayout = async (payout: PayoutRequestItem) => {
    setIsProcessingAction(true)
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId: payout.id,
          action: 'AUTHORIZE',
        }),
      })
      const data = await res.json()
      if (data?.success) {
        showToast('success', 'Payout Authorized', `Batch ${payout.reference} authorized for Mobile Money queue.`)
        reloadPayouts()
      } else {
        showToast('error', 'Failed to Authorize', data?.error || 'Action could not be completed.')
      }
    } catch (err) {
      showToast('error', 'Network Error', 'Check your connection and try again.')
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleConfirmDisbursal = async () => {
    if (!selectedPayoutForDisburse) return
    if (!disbursalRefInput.trim()) {
      showToast('error', 'Reference Required', 'Please provide a Mobile Money or Bank Transaction Reference.')
      return
    }

    setIsProcessingAction(true)
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId: selectedPayoutForDisburse.id,
          action: 'DISBURSE',
          disbursalReference: disbursalRefInput.trim(),
        }),
      })
      const data = await res.json()
      if (data?.success) {
        showToast('success', 'Payout Disbursed', `Settlement reference ${disbursalRefInput.trim()} recorded. Status marked as PAID.`)
        setSelectedPayoutForDisburse(null)
        setDisbursalRefInput('')
        reloadPayouts()
      } else {
        showToast('error', 'Disbursal Failed', data?.error || 'Could not record disbursal.')
      }
    } catch (err) {
      showToast('error', 'Network Error', 'Check your connection and try again.')
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleConfirmReject = async () => {
    if (!selectedPayoutForReject) return
    if (!rejectReasonInput.trim()) {
      showToast('error', 'Reason Required', 'Please enter a reason for rejecting this payout request.')
      return
    }

    setIsProcessingAction(true)
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId: selectedPayoutForReject.id,
          action: 'REJECT',
          rejectionReason: rejectReasonInput.trim(),
        }),
      })
      const data = await res.json()
      if (data?.success) {
        showToast('info', 'Payout Rejected', `Payout ${selectedPayoutForReject.reference} marked as rejected.`)
        setSelectedPayoutForReject(null)
        setRejectReasonInput('')
        reloadPayouts()
      } else {
        showToast('error', 'Rejection Failed', data?.error || 'Could not reject payout.')
      }
    } catch (err) {
      showToast('error', 'Network Error', 'Check your connection and try again.')
    } finally {
      setIsProcessingAction(false)
    }
  }

  // ==========================================
  // DISPUTE / CASE RESOLUTION
  // ==========================================
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

  // ==========================================
  // FILTERED LISTS
  // ==========================================
  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch =
      p.reference.toLowerCase().includes(payoutSearch.toLowerCase()) ||
      p.partnerName.toLowerCase().includes(payoutSearch.toLowerCase()) ||
      p.partnerPhone.toLowerCase().includes(payoutSearch.toLowerCase()) ||
      p.accountNumber.toLowerCase().includes(payoutSearch.toLowerCase())
    const matchesStatus = payoutStatusFilter === 'ALL' || p.status === payoutStatusFilter
    return matchesSearch && matchesStatus
  })

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.reference.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.partnerName.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.dealTitle.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.customerFirstName.toLowerCase().includes(caseSearch.toLowerCase())
    const matchesStatus = caseStatusFilter === 'ALL' || c.rewardStatus === caseStatusFilter
    return matchesSearch && matchesStatus
  })

  // ==========================================
  // AGGREGATE METRICS
  // ==========================================
  const pendingPayouts = payouts.filter((p) => p.status === 'PENDING_APPROVAL')
  const pendingPayoutsAmount = pendingPayouts.reduce((sum, p) => sum + p.netAmountTZS, 0)
  const authorizedPayouts = payouts.filter((p) => p.status === 'AUTHORIZED')
  const authorizedPayoutsAmount = authorizedPayouts.reduce((sum, p) => sum + p.netAmountTZS, 0)
  const paidPayouts = payouts.filter((p) => p.status === 'PAID')
  const paidPayoutsAmount = paidPayouts.reduce((sum, p) => sum + p.netAmountTZS, 0)

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

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Award className="w-6 h-6 text-[#FF6A00]" />
            <span>Rewards & Partner Payout Batches</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review partner payout withdrawal requests, authorize mobile money disbursals, and audit merchant commission settlements.
          </p>
        </div>

        {/* Sub-Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveSubTab('payouts')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'payouts'
                ? 'bg-white dark:bg-slate-900 text-[#FF6A00] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Partner Payout Requests</span>
            {pendingPayouts.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#FF6A00] text-white text-[10px] font-black">
                {pendingPayouts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('settlements')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'settlements'
                ? 'bg-white dark:bg-slate-900 text-[#FF6A00] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Deal Commission Settlements</span>
            {cases.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                {cases.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: PARTNER PAYOUT REQUESTS & MOBILE MONEY BATCHES                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'payouts' && (
        <div className="space-y-5">
          {/* Payout Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-amber-500/10 dark:bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Pending Approval
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-1">
                TZS {pendingPayoutsAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-amber-600/80 mt-0.5 block">
                {pendingPayouts.length} request{pendingPayouts.length === 1 ? '' : 's'} awaiting review
              </span>
            </div>

            <div className="bg-blue-500/10 dark:bg-blue-500/5 p-4 rounded-2xl border border-blue-500/20">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                Authorized for Disbursal
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-600 font-mono mt-1">
                TZS {authorizedPayoutsAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-blue-600/80 mt-0.5 block">
                {authorizedPayouts.length} ready for mobile money batch
              </span>
            </div>

            <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Disbursed to Date
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-1">
                TZS {paidPayoutsAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-600/80 mt-0.5 block">
                {paidPayouts.length} successful settlement{paidPayouts.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Requests
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200 font-mono mt-1">
                {payouts.length}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">All-time partner payout runs</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search payout requests by reference, partner name, phone, or account..."
                value={payoutSearch}
                onChange={(e) => setPayoutSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6A00]"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={payoutStatusFilter}
                onChange={(e) => setPayoutStatusFilter(e.target.value)}
                className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
              >
                <option value="ALL">All Payout Statuses</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="AUTHORIZED">Authorized</option>
                <option value="PAID">Paid / Disbursed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Payouts Table */}
          {payoutsLoading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF6A00]" />
              <span className="text-xs">Loading partner payout requests...</span>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
              <Wallet className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Payout Requests Found
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {payoutSearch || payoutStatusFilter !== 'ALL'
                  ? 'No payout requests match your search or status filter.'
                  : 'When partners request reward payouts from their portal, their requests will appear here dynamically for review and mobile money disbursal.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-xs text-left min-w-[900px]">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Reference & Date</th>
                    <th className="p-3">Partner Details</th>
                    <th className="p-3">Payout Channel & Account</th>
                    <th className="p-3">Gross / Net TZS</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredPayouts.map((p) => {
                    const isPending = p.status === 'PENDING_APPROVAL'
                    const isAuthorized = p.status === 'AUTHORIZED'
                    const isPaid = p.status === 'PAID'
                    const isRejected = p.status === 'REJECTED'

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          <div className="font-mono font-black text-blue-600 dark:text-blue-400">
                            {p.reference}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(p.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{p.partnerName}</div>
                          <div className="font-mono text-[10px] text-slate-400">{p.partnerPhone}</div>
                        </td>

                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <Smartphone className="w-3 h-3 text-[#FF6A00]" />
                            {p.payoutChannel.replace(/_/g, ' ')}
                          </span>
                          <div className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1">
                            {p.accountNumber}
                          </div>
                          {p.accountName && p.accountName !== p.partnerName && (
                            <div className="text-[10px] text-slate-400">{p.accountName}</div>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="font-mono font-black text-emerald-600 text-sm">
                            TZS {p.netAmountTZS.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Gross TZS {p.grossAmountTZS.toLocaleString()} (Fee: {p.platformFeeTZS.toLocaleString()}, TRA: {p.taxWithheldTZS.toLocaleString()})
                          </div>
                        </td>

                        <td className="p-3">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                              <Clock className="w-3 h-3" /> Pending Review
                            </span>
                          )}
                          {isAuthorized && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                              <Check className="w-3 h-3" /> Authorized for Disbursal
                            </span>
                          )}
                          {isPaid && (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Disbursed (Paid)
                              </span>
                              {p.disbursalReference && (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Ref: {p.disbursalReference}
                                </div>
                              )}
                            </div>
                          )}
                          {isRejected && (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                                <X className="w-3 h-3" /> Rejected
                              </span>
                              {p.rejectionReason && (
                                <div className="text-[10px] text-rose-500 mt-0.5 line-clamp-1 max-w-xs">
                                  {p.rejectionReason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAuthorizePayout(p)}
                                  disabled={isProcessingAction}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs transition-colors cursor-pointer"
                                >
                                  Authorize
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPayoutForReject(p)
                                    setRejectReasonInput('')
                                  }}
                                  disabled={isProcessingAction}
                                  className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-400 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {isAuthorized && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPayoutForDisburse(p)
                                    setDisbursalRefInput(`MM-${Date.now().toString().slice(-8)}`)
                                  }}
                                  disabled={isProcessingAction}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Disburse</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPayoutForReject(p)
                                    setRejectReasonInput('')
                                  }}
                                  disabled={isProcessingAction}
                                  className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-400 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {isPaid && (
                              <span className="text-[10px] text-emerald-600 font-bold">
                                Settled
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: DIRECT DEAL COMMISSION SETTLEMENTS                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'settlements' && (
        <div className="space-y-5">
          {/* Official Platform Disclaimer */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Platform Settlement Notice:</strong> Customers pay merchants directly, and merchants pay agreed referral rewards directly to partners upon purchase completion. Lumo coordinates and tracks direct settlements.
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
                value={caseSearch}
                onChange={(e) => setCaseSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6A00]"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={caseStatusFilter}
                onChange={(e) => setCaseStatusFilter(e.target.value)}
                className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
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
          {casesLoading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF6A00]" />
              <span className="text-xs">Loading referral settlements...</span>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
              <Receipt className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Commission Settlements Found
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {caseSearch || caseStatusFilter !== 'ALL'
                  ? 'No settlements match your search criteria.'
                  : 'Active customer referrals and closed deals will appear here dynamically to monitor merchant commission settlements.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-xs text-left min-w-[850px]">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
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
                      <tr key={caseItem.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
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
                                <div className="text-[10px] text-rose-600 mt-0.5 line-clamp-1 max-w-xs">
                                  {caseItem.disputeReason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {caseItem.rewardStatus === 'DISPUTED' && (
                              <button
                                type="button"
                                onClick={() => setSelectedCaseForReview(caseItem)}
                                className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black hover:bg-rose-700 transition-colors cursor-pointer"
                              >
                                Resolve
                              </button>
                            )}

                            {waLink !== '#' && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg text-[10px] font-bold transition-colors"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DISBURSE PAYOUT                                                    */}
      {/* ========================================================================= */}
      {selectedPayoutForDisburse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedPayoutForDisburse(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Confirm Payout Disbursal
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedPayoutForDisburse.reference} · {selectedPayoutForDisburse.partnerName}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Channel:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedPayoutForDisburse.payoutChannel.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination Account / Phone:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedPayoutForDisburse.accountNumber}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-slate-500">Net Amount to Disburse:</span>
                <span className="font-mono font-black text-emerald-600 text-sm">
                  TZS {selectedPayoutForDisburse.netAmountTZS.toLocaleString()}
                </span>
              </div>
            </div>

            {/* DIRECT SNIPPE DISBURSAL ACTION */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 dark:text-emerald-200">
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Direct Mobile Money Disbursal</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">
                  Balance: {snippeBalance ? `${snippeBalance.currency} ${snippeBalance.available.toLocaleString()}` : 'Live'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Dispatch <strong>TZS {selectedPayoutForDisburse.netAmountTZS.toLocaleString()}</strong> straight to <strong>{selectedPayoutForDisburse.accountNumber}</strong> ({selectedPayoutForDisburse.partnerName}) using Snippe Gateway.
              </p>
              <button
                type="button"
                onClick={handleDirectSnippeDisbursal}
                disabled={isSendingViaSnippe || isProcessingAction}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isSendingViaSnippe ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Money to Phone via Snippe...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>⚡ Send TZS {selectedPayoutForDisburse.netAmountTZS.toLocaleString()} Direct to Phone</span>
                  </>
                )}
              </button>
            </div>

            {/* OR MANUAL REFERENCE */}
            <div className="flex items-center gap-2 my-1 text-[10px] font-bold text-slate-400">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span>OR RECORD MANUAL REFERENCE</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Transaction / Disbursal Reference
              </label>
              <input
                type="text"
                placeholder="e.g. MPESA-QJ84920482 or CRDB-REF-99201"
                value={disbursalRefInput}
                onChange={(e) => setDisbursalRefInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              <p className="text-[10px] text-slate-400">
                If paid outside LUMO (USSD/Bank portal), enter the transaction reference here.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPayoutForDisburse(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisbursal}
                disabled={isProcessingAction || isSendingViaSnippe}
                className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Record Manual Disbursal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECT PAYOUT                                                      */}
      {/* ========================================================================= */}
      {selectedPayoutForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedPayoutForReject(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Reject Payout Request
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedPayoutForReject.reference} · {selectedPayoutForReject.partnerName}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Explain why this request is being rejected (e.g. mismatched KYC name, unverified phone, compliance hold)..."
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPayoutForReject(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessingAction}
                className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESOLVE DISPUTE                                                    */}
      {/* ========================================================================= */}
      {selectedCaseForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedCaseForReview(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Resolve Settlement Dispute
            </h3>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-xs">
              <div className="font-mono text-blue-600 font-bold">{selectedCaseForReview.reference}</div>
              <div className="font-extrabold">{selectedCaseForReview.dealTitle}</div>
              <div className="text-slate-500">Partner: {selectedCaseForReview.partnerName}</div>
              <div className="text-slate-500">Customer: {selectedCaseForReview.customerFirstName} {selectedCaseForReview.customerLastName}</div>
              <div className="text-rose-600 font-bold pt-1">Reason: {selectedCaseForReview.disputeReason}</div>
            </div>

            <textarea
              rows={3}
              placeholder="Admin resolution notes (shared with partner)..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => handleResolveDispute(selectedCaseForReview, 'REMIND_MERCHANT')}
                className="px-3 py-2 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600"
              >
                Remind Merchant
              </button>
              <button
                type="button"
                onClick={() => handleResolveDispute(selectedCaseForReview, 'CONFIRM')}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
              >
                Mark Verified & Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
