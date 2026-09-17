'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  Lock,
  X,
  MessageSquare,
  ExternalLink,
  Receipt,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronRight,
  Eye,
  Building2,
  ArrowRight,
  ShieldCheck,
  Award,
  Wallet,
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

// 14-Step Happy-Path Lifecycle Stages (LUMO 60-Step Specification)
const LIFECYCLE_STAGES = [
  { key: 'SUBMITTED', label: '1. Submitted' },
  { key: 'UNDER_REVIEW', label: '2. Under Review' },
  { key: 'QUALIFIED', label: '3. Qualified' },
  { key: 'CONTACTED', label: '4. Contacted' },
  { key: 'CUSTOMER_INTERESTED', label: '5. Customer Interested' },
  { key: 'INTRODUCTION_SCHEDULED', label: '6. Introduction Scheduled' },
  { key: 'INTRODUCED', label: '7. Introduced' },
  { key: 'NEGOTIATING', label: '8. Negotiating' },
  { key: 'SUCCESSFUL', label: '9. Successful' },
  { key: 'REWARD_PENDING', label: '10. Reward Pending' },
  { key: 'REWARD_APPROVED', label: '11. Reward Approved' },
  { key: 'REWARD_PAID', label: '12. Reward Paid' },
  { key: 'CLOSED', label: '13. Closed' },
]

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
  const [loading, setLoading] = useState(true)
  const [selectedCaseForDispute, setSelectedCaseForDispute] = useState<ReferralCase | null>(null)
  const [selectedCaseForProgress, setSelectedCaseForProgress] = useState<ReferralCase | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [showDealSelectorModal, setShowDealSelectorModal] = useState(false)
  const [selectedDealForReferral, setSelectedDealForReferral] = useState<JoinedDealItem | null>(null)

  // Resubmission State for More Info Required
  const [selectedCaseForResubmit, setSelectedCaseForResubmit] = useState<ReferralCase | null>(null)
  const [resubmitNotes, setResubmitNotes] = useState('')
  const [resubmitEmail, setResubmitEmail] = useState('')
  const [resubmitPhone, setResubmitPhone] = useState('')
  const [resubmitRelationship, setResubmitRelationship] = useState('')
  const [isResubmitting, setIsResubmitting] = useState(false)

  // Deal Payout Request State
  const [selectedCaseForPayout, setSelectedCaseForPayout] = useState<ReferralCase | null>(null)
  const [payoutChannel, setPayoutChannel] = useState<'VODACOM_MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'HALOPESA' | 'CRDB_BANK' | 'NMB_BANK'>('VODACOM_MPESA')
  const [payoutPhone, setPayoutPhone] = useState('')
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false)

  const handleExecutePayout = async () => {
    if (!selectedCaseForPayout) return
    if (!payoutPhone.trim()) {
      showToast('error', 'Account Required', 'Please enter your mobile money number or bank account.')
      return
    }

    setIsSubmittingPayout(true)
    try {
      const res = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticketId: selectedCaseForPayout.id,
          ticketReference: selectedCaseForPayout.reference,
          amountTZS: selectedCaseForPayout.rewardAmountTZS,
          payoutChannel,
          accountNumber: payoutPhone.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit payout request')
      }

      showToast(
        'success',
        'Payout Request Submitted',
        `Your payout request for ${selectedCaseForPayout.reference} has been submitted to LUMO Finance.`
      )

      setSelectedCaseForPayout(null)
      reloadCases()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('lumo:payouts-updated'))
      }
    } catch (err: any) {
      showToast('error', 'Request Failed', err.message || 'Could not process payout request.')
    } finally {
      setIsSubmittingPayout(false)
    }
  }

  const reloadCases = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/referrals/tickets', {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.tickets)) {
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
          entityType: t.entityType,
          customerRole: t.customerRole,
          companyName: t.companyName,
          contactPerson: t.contactPerson,
          customerEmail: t.customerEmail,
          customerCountry: t.customerCountry,
          customerRegion: t.customerRegion,
          customerCity: t.customerCity,
          relationshipWithCustomer: t.relationshipWithCustomer,
          spokenToCustomer: t.spokenToCustomer,
          customerInterestLevel: t.customerInterestLevel,
          lumoMayContact: t.lumoMayContact,
          customerSuitability: t.customerSuitability,
          relevantCapabilities: t.relevantCapabilities,
          isDuplicatePotential: t.isDuplicatePotential,
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
          closureReason: t.closureReason || undefined,
          requestedInfoNotes:
            t.requestedInfoNotes ||
            (t.partnerVisibleUpdate?.startsWith('Information Required by LUMO: ')
              ? t.partnerVisibleUpdate.replace('Information Required by LUMO: ', '').trim()
              : undefined),
          rejectionReasonNotes:
            t.rejectionReasonNotes ||
            (t.partnerVisibleUpdate?.startsWith('Connection rejected: ')
              ? t.partnerVisibleUpdate.replace('Connection rejected: ', '').trim()
              : undefined),
          rewardAmountTZS: t.rewardAmountTZS || 0,
          rewardDisplay: t.rewardDisplay || 'Commercial Reward Direct from Merchant',
          rewardStatus: (t.rewardStatus as DirectRewardStatus) || 'NOT_YET_EARNED',
          payoutReference: t.payoutReference || undefined,
          payoutId: t.payoutId || undefined,
          merchantPaymentReportedAt: t.merchantPaymentReportedAt || undefined,
          merchantPaymentReference: t.merchantPaymentReference || undefined,
          merchantPaymentNotes: t.merchantPaymentNotes || undefined,
          partnerReceiptConfirmedAt: t.partnerReceiptConfirmedAt || undefined,
          disputeReason: t.disputeReason || undefined,
          disputedAt: t.disputedAt || undefined,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }))
        setReferralCases(mappedCases)
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('Failed to fetch partner referral cases:', err)
    }

    try {
      setReferralCases(listPartnerReferralCases('all'))
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    reloadCases()
    const handleUpdate = () => reloadCases()
    window.addEventListener('lumo:referral-cases-updated', handleUpdate)
    return () => window.removeEventListener('lumo:referral-cases-updated', handleUpdate)
  }, [reloadCases])

  const filteredCases = referralCases.filter((c) => {
    const term = searchQuery.toLowerCase()
    const matchesSearch =
      c.reference.toLowerCase().includes(term) ||
      (c.companyName && c.companyName.toLowerCase().includes(term)) ||
      c.customerFirstName.toLowerCase().includes(term) ||
      c.customerLastName.toLowerCase().includes(term) ||
      c.dealTitle.toLowerCase().includes(term) ||
      c.customerPhoneMasked.includes(term)
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
        `You have confirmed receipt of ${caseItem.rewardDisplay} for connection ${caseItem.reference}.`
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
        `Dispute registered for connection ${selectedCaseForDispute.reference}. LUMO review desk will investigate.`
      )
      setSelectedCaseForDispute(null)
      setDisputeReason('')
    }
  }

  const handleExecuteResubmit = async () => {
    if (!selectedCaseForResubmit) return
    if (!resubmitNotes.trim()) {
      showToast('error', 'Missing Details', 'Please provide notes or explanations before resubmitting.')
      return
    }

    setIsResubmitting(true)
    try {
      const res = await fetch(`/api/referrals/tickets/${selectedCaseForResubmit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerResubmissionNotes: resubmitNotes.trim(),
          customerEmail: resubmitEmail.trim() || undefined,
          customerPhone: resubmitPhone.trim() || undefined,
          relationshipWithCustomer: resubmitRelationship.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit additional information')
      }

      showToast(
        'success',
        'Connection Resubmitted',
        'Your additional information was received and your connection is now back Under Review.'
      )
      setSelectedCaseForResubmit(null)
      setResubmitNotes('')
      reloadCases()
    } catch (err: any) {
      showToast('error', 'Resubmission Failed', err.message || 'Could not resubmit connection.')
    } finally {
      setIsResubmitting(false)
    }
  }

  const getStageBadge = (stage: ReferralCaseStage) => {
    switch (stage) {
      case 'SUBMITTED':
        return <span className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border border-slate-300 dark:border-slate-700">Submitted</span>
      case 'UNDER_REVIEW':
        return <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border border-blue-300 dark:border-blue-800">Under Review</span>
      case 'QUALIFIED':
        return <span className="bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border border-cyan-300 dark:border-cyan-800">Qualified</span>
      case 'CONTACTED':
        return <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border border-indigo-300 dark:border-indigo-800">Contacted</span>
      case 'CUSTOMER_INTERESTED':
        return <span className="bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border border-teal-300 dark:border-teal-800">Customer Interested</span>
      case 'INTRODUCTION_SCHEDULED':
        return <span className="bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border border-purple-300 dark:border-purple-800">Intro Scheduled</span>
      case 'INTRODUCED':
        return <span className="bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border border-fuchsia-300 dark:border-fuchsia-800">Introduced</span>
      case 'NEGOTIATING':
        return <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border border-amber-300 dark:border-amber-800">Negotiating</span>
      case 'SUCCESSFUL':
        return <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-black px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-400 dark:border-emerald-700">Successful</span>
      case 'REWARD_PENDING':
        return <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-black px-2.5 py-0.5 rounded-full text-[10px] border border-amber-300">Reward Pending</span>
      case 'REWARD_APPROVED':
        return <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-black px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-300">Reward Approved</span>
      case 'REWARD_PAID':
        return <span className="bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full text-[10px] shadow-xs">Reward Paid ✓</span>
      case 'DUPLICATE':
        return <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">Duplicate (Under Review)</span>
      case 'MORE_INFO_REQUIRED':
        return <span className="bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">Info Required</span>
      case 'REJECTED':
        return <span className="bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">Rejected</span>
      case 'AVAILABILITY_CONFIRMED':
        return <span className="bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">Availability Confirmed</span>
      case 'IN_PROGRESS':
        return <span className="bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">In Progress</span>
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">Completed</span>
      case 'CLOSED':
      default:
        return <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold px-2.5 py-0.5 rounded-full text-[10px]">Closed</span>
    }
  }

  const getRewardBadge = (status: DirectRewardStatus) => {
    switch (status) {
      case 'NOT_YET_EARNED':
        return <span className="text-slate-500 font-medium text-[11px]">Pending Result</span>
      case 'AWAITING_MERCHANT_PAYMENT':
        return <span className="text-amber-600 font-bold text-[11px]">Awaiting Settlement</span>
      case 'MERCHANT_REPORTS_PAID':
        return <span className="text-blue-600 font-black text-[11px] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Settlement Reported</span>
      case 'PARTNER_CONFIRMS_RECEIPT':
        return <span className="text-emerald-600 font-black text-[11px] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Reward Confirmed</span>
      case 'DISPUTED':
        return <span className="text-rose-600 font-black text-[11px] flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Disputed</span>
    }
  }

  const getStageIndex = (stage: string) => {
    const idx = LIFECYCLE_STAGES.findIndex((s) => s.key === stage)
    if (idx >= 0) return idx
    if (stage === 'AVAILABILITY_CONFIRMED' || stage === 'IN_PROGRESS') return 7
    if (stage === 'COMPLETED') return 8
    return 0
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header: Partner Dashboard -> My Connections (Step 25) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              My Connections
            </h2>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-black px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
              LUMO Partner Connection Process
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track your customer introductions, qualification progress, introduction to deal owners, and reward settlement.
          </p>
        </div>

        <button
          onClick={() => {
            if (selectedDealForLead) {
              setSelectedDealForReferral(selectedDealForLead)
              setShowReferralModal(true)
            } else {
              setShowDealSelectorModal(true)
            }
          }}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>I Can Connect This Deal</span>
        </button>
      </div>

      {/* Core Rule Callout (Step 59) */}
      <div className="rounded-2xl border border-orange-200 bg-orange-50/50 dark:border-orange-950 dark:bg-orange-950/20 p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#FF6A00] shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 dark:text-white font-black">Governing Operating Principle:</strong> The Partner&apos;s job is to bring the Customer to LUMO. LUMO controls connection verification, introduction, persistent attribution, commercial result verification, and reward processing.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search connections by ID (LUMO-CON-...), customer name, company, or deal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Connection Stages</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CUSTOMER_INTERESTED">Customer Interested</option>
            <option value="INTRODUCTION_SCHEDULED">Introduction Scheduled</option>
            <option value="INTRODUCED">Introduced</option>
            <option value="NEGOTIATING">Negotiating</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="REWARD_PENDING">Reward Pending</option>
            <option value="REWARD_APPROVED">Reward Approved</option>
            <option value="REWARD_PAID">Reward Paid</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="sm:col-span-1 flex items-center justify-end">
          <button
            onClick={() => reloadCases()}
            disabled={loading}
            title="Refresh connections"
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FF6A00]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Connections Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[850px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3">Connection ID &amp; Deal</th>
              <th className="p-3">Customer Entity / Contact</th>
              <th className="p-3">Connection Status</th>
              <th className="p-3">Next Action / Desk</th>
              <th className="p-3">Potential Reward</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF6A00]" />
                    <span>Loading your connections...</span>
                  </div>
                </td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-slate-400 opacity-60" />
                    <p className="font-bold text-slate-700 dark:text-slate-200">No customer connections found</p>
                    <p className="text-xs text-slate-400 max-w-sm text-center">
                      When you click &quot;I Can Connect This Deal&quot;, your submitted customer connection will appear here with permanent attribution, progress tracking, and reward verification.
                    </p>
                    <button
                      onClick={() => {
                        const firstDeal = joinedDeals.find((d) => d.status === 'ACTIVE') || joinedDeals[0]
                        setSelectedDealForReferral(firstDeal || null)
                        setShowReferralModal(true)
                      }}
                      className="mt-2 px-4 py-2 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>I Can Connect This Deal</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCases.map((caseItem) => {
                const waLink = getWhatsAppCoordinationUrl(caseItem.reference, caseItem.dealTitle)
                const displayName = caseItem.companyName || `${caseItem.customerFirstName} ${caseItem.customerLastName}`.trim() || 'Prospective Customer'

                return (
                  <tr key={caseItem.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="font-mono font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <span>{caseItem.reference}</span>
                        {caseItem.entityType && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                            {caseItem.entityType}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1 max-w-xs mt-0.5">
                        {caseItem.dealTitle}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Submitted: {new Date(caseItem.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        {caseItem.companyName && <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <span>{displayName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <span>{caseItem.customerPhoneMasked}</span>
                        {caseItem.customerRole && <span className="text-[10px] text-orange-600 dark:text-orange-400 font-sans font-bold">({caseItem.customerRole})</span>}
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
                        {caseItem.nextAction || 'Awaiting LUMO review desk'}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{caseItem.assignedCoordinator || 'LUMO Coordination Desk'}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-black text-slate-900 dark:text-white text-xs">
                        {caseItem.rewardDisplay}
                      </div>
                      <div className="mt-0.5">{getRewardBadge(caseItem.rewardStatus)}</div>
                    </td>

                    <td className="p-3 text-right space-y-1.5">
                      {/* Step 25: View Progress Button */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setSelectedCaseForProgress(caseItem)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 font-extrabold text-[11px] shadow-xs cursor-pointer transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#FF6A00]" />
                          <span>View Progress</span>
                        </button>
                      </div>

                      {/* Action Needed: Provide Info & Resubmit */}
                      {caseItem.stage === 'MORE_INFO_REQUIRED' && (
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCaseForResubmit(caseItem)
                              setResubmitNotes('')
                              setResubmitEmail(caseItem.customerEmail || '')
                              setResubmitPhone(caseItem.customerPhone || '')
                              setResubmitRelationship(caseItem.relationshipWithCustomer || '')
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] shadow-xs cursor-pointer transition-all animate-pulse"
                          >
                            <span>Provide Info & Resubmit</span>
                          </button>
                        </div>
                      )}

                      {/* Action: Request Payout for Successful / Reward Approved deals */}
                      {(caseItem.stage === 'SUCCESSFUL' || caseItem.stage === 'REWARD_APPROVED') && (
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCaseForPayout(caseItem)
                              setPayoutPhone(caseItem.partnerPhone || '')
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow-xs cursor-pointer transition-all"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Request Payout</span>
                          </button>
                        </div>
                      )}

                      {/* Payout In Review Badge */}
                      {caseItem.stage === 'REWARD_PENDING' && (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                            <Clock className="w-3 h-3" />
                            <span>Payout In Review</span>
                          </span>
                        </div>
                      )}

                      {/* WhatsApp Follow-up */}
                      <div>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#15803d] dark:text-[#25D366] font-bold text-[10px] transition-colors"
                        >
                          <MessageSquare className="w-3 h-3 text-[#25D366]" />
                          <span>WhatsApp Desk</span>
                        </a>
                      </div>

                      {/* Direct Confirmation or Dispute */}
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Step 25 & 56: CONNECTION PROGRESS MODAL (Full 14-Step Lifecycle Journey) */}
      {selectedCaseForProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative overflow-y-auto max-h-[calc(100dvh-2rem)] space-y-5">
            <button
              onClick={() => setSelectedCaseForProgress(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-black text-[#FF6A00] bg-orange-50 dark:bg-orange-950/50 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                  {selectedCaseForProgress.reference}
                </span>
                <span className="text-xs font-bold text-slate-400">Connection Journey Audit</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {selectedCaseForProgress.dealTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Connecting: <strong>{selectedCaseForProgress.companyName || `${selectedCaseForProgress.customerFirstName} ${selectedCaseForProgress.customerLastName}`}</strong> ({selectedCaseForProgress.customerRole || selectedCaseForProgress.entityType || 'Customer'})
              </p>
            </div>

            {/* More Info Required Action Card */}
            {selectedCaseForProgress.stage === 'MORE_INFO_REQUIRED' && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Action Required: LUMO Requested Additional Information</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-100 font-semibold leading-relaxed">
                  {selectedCaseForProgress.requestedInfoNotes ||
                    selectedCaseForProgress.partnerVisibleUpdate?.replace('Information Required by LUMO: ', '') ||
                    'Please provide the requested information to resume connection review.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedCaseForProgress
                    setSelectedCaseForProgress(null)
                    setSelectedCaseForResubmit(c)
                    setResubmitNotes('')
                    setResubmitEmail(c.customerEmail || '')
                    setResubmitPhone(c.customerPhone || '')
                    setResubmitRelationship(c.relationshipWithCustomer || '')
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-all"
                >
                  Provide Information & Resubmit Now
                </button>
              </div>
            )}

            {/* Rejection Notification Card */}
            {selectedCaseForProgress.stage === 'REJECTED' && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-700 space-y-2">
                <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-xs">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Connection Declined ({selectedCaseForProgress.closureReason || 'CRITERIA_NOT_MET'})</span>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  {selectedCaseForProgress.rejectionReasonNotes ||
                    selectedCaseForProgress.partnerVisibleUpdate?.replace('Connection rejected: ', '') ||
                    'This connection did not meet verification criteria.'}
                </p>
              </div>
            )}

            {/* Successful Deal Celebration & Payout Request Card */}
            {(selectedCaseForProgress.stage === 'SUCCESSFUL' || selectedCaseForProgress.stage === 'REWARD_APPROVED') && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-600 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>🎉 Deal Closed Successfully! Reward Available</span>
                  </div>
                  <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-xs">
                    TZS {selectedCaseForProgress.rewardAmountTZS.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-100 font-medium leading-relaxed">
                  Congratulations! This commercial introduction was successfully closed. Your reward has been approved and is available for payout withdrawal.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedCaseForProgress
                    setSelectedCaseForProgress(null)
                    setSelectedCaseForPayout(c)
                    setPayoutPhone(c.partnerPhone || '')
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-all inline-flex items-center gap-1.5"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Request Payout Now</span>
                </button>
              </div>
            )}

            {/* Payout Request Under Review Card */}
            {selectedCaseForProgress.stage === 'REWARD_PENDING' && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Payout Request Under Review</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Your payout request of <strong>TZS {selectedCaseForProgress.rewardAmountTZS.toLocaleString()}</strong> has been submitted to the LUMO Finance Desk and is queued for verification and disbursal.
                </p>
              </div>
            )}

            {/* Current Status Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Current Stage:</span>
                <div>{getStageBadge(selectedCaseForProgress.stage)}</div>
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                {selectedCaseForProgress.partnerVisibleUpdate || 'Your customer introduction is actively recorded under LUMO attribution.'}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Potential Reward: <strong className="text-[#FF6A00]">{selectedCaseForProgress.rewardDisplay}</strong></span>
                <span>Assigned Desk: {selectedCaseForProgress.assignedCoordinator || 'LUMO Coordination Desk'}</span>
              </div>
            </div>

            {/* Full 14-Step Progress Stepper (Step 56) */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Connection Progress Journey (Steps 1 – 13)
              </h4>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {LIFECYCLE_STAGES.map((st, index) => {
                  const currentIdx = getStageIndex(selectedCaseForProgress.stage)
                  const isCompleted = index < currentIdx
                  const isCurrent = index === currentIdx
                  const isFuture = index > currentIdx

                  return (
                    <div
                      key={st.key}
                      className={`flex items-center gap-3 p-2 rounded-xl text-xs transition-all ${
                        isCurrent
                          ? 'bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800 font-bold text-[#FF6A00]'
                          : isCompleted
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-semibold'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      <div className="shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : isCurrent ? (
                          <div className="w-4 h-4 rounded-full border-2 border-[#FF6A00] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-[#FF6A00] rounded-full animate-ping" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[9px]">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <span className="flex-1">{st.label}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-black uppercase bg-[#FF6A00] text-white px-2 py-0.5 rounded-full">
                          Active Stage
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Anti-Circumvention Protection Invariant */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              <strong>LUMO Attribution Guarantee:</strong> Your connection ID <code className="font-mono text-orange-600 dark:text-orange-400 font-bold">{selectedCaseForProgress.reference}</code> is permanently bound to this transaction. Even if the customer and merchant communicate directly, your attribution remains active until commercial verification.
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <a
                href={getWhatsAppCoordinationUrl(selectedCaseForProgress.reference, selectedCaseForProgress.dealTitle)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 fill-slate-950" />
                <span>Chat with LUMO Coordination Desk</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setSelectedCaseForProgress(null)}
                className="py-3 px-5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPUTE MODAL */}
      {selectedCaseForDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
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
                Connection: <strong>{selectedCaseForDispute.reference}</strong> ({selectedCaseForDispute.dealTitle})
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

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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

      {/* Opportunity Selection Modal */}
      {showDealSelectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Select Opportunity
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Which deal do you want to connect a customer to?
                </p>
              </div>
              <button
                onClick={() => setShowDealSelectorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {joinedDeals.filter((d) => d.status === 'ACTIVE').length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 space-y-2">
                <p className="font-bold">No Active Enrolled Deals Found</p>
                <p>Browse the marketplace or your saved opportunities to discover deals you can connect.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {joinedDeals
                  .filter((d) => d.status === 'ACTIVE')
                  .map((deal) => (
                    <button
                      key={deal.id}
                      onClick={() => {
                        setSelectedDealForReferral(deal)
                        setShowDealSelectorModal(false)
                        setShowReferralModal(true)
                      }}
                      className="w-full text-left p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-[#FF6A00] dark:hover:border-[#FF6A00] hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#FF6A00]">
                          {deal.title}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {deal.businessName} · Reward: {deal.rewardDisplay}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#FF6A00] shrink-0" />
                    </button>
                  ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDealSelectorModal(false)}
                className="py-2 px-4 text-xs font-bold border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Connection Modal */}
      {selectedDealForReferral && (
        <CustomerReferralModal
          deal={{
            id: selectedDealForReferral.opportunityId || selectedDealForReferral.id,
            title: selectedDealForReferral.title,
            slug: selectedDealForReferral.opportunityId || selectedDealForReferral.id,
            rewardDisplay: selectedDealForReferral.rewardDisplay,
            companyName: selectedDealForReferral.businessName,
          } as any}
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          onReferralSubmitted={() => {
            reloadCases()
            setShowReferralModal(false)
          }}
        />
      )}

      {/* PARTNER RESUBMIT MODAL (More Info Required) */}
      {selectedCaseForResubmit && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-sm">
                  !
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Provide Requested Information
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ref: <span className="font-mono font-bold text-orange-600">{selectedCaseForResubmit.reference}</span> · {selectedCaseForResubmit.dealTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseForResubmit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Admin Instructions Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 block">
                LUMO Desk Request:
              </span>
              <p className="text-xs text-amber-900 dark:text-amber-100 font-medium leading-relaxed">
                {selectedCaseForResubmit.requestedInfoNotes ||
                  selectedCaseForResubmit.partnerVisibleUpdate?.replace('Information Required by LUMO: ', '') ||
                  'Please provide additional details or verify customer information to proceed.'}
              </p>
            </div>

            {/* Partner Response Form */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Response / Additional Details *
                </label>
                <textarea
                  rows={4}
                  required
                  value={resubmitNotes}
                  onChange={(e) => setResubmitNotes(e.target.value)}
                  placeholder="Provide the requested details, explanation, or updates regarding this customer connection..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Optional Field Updates if Partner needs to correct Email/Phone/Relationship */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  Verify or Update Contact Details (Optional):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Customer Email
                    </label>
                    <input
                      type="email"
                      value={resubmitEmail}
                      onChange={(e) => setResubmitEmail(e.target.value)}
                      placeholder="e.g. buyer@company.tz"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Customer Phone
                    </label>
                    <input
                      type="tel"
                      value={resubmitPhone}
                      onChange={(e) => setResubmitPhone(e.target.value)}
                      placeholder="e.g. +255 754 510 059"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Your Relationship
                  </label>
                  <select
                    value={resubmitRelationship}
                    onChange={(e) => setResubmitRelationship(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">(Keep Current Relationship)</option>
                    <option value="Existing Business Contact">Existing Business Contact</option>
                    <option value="Direct Corporate Buyer">Direct Corporate Buyer</option>
                    <option value="Procurement Officer">Procurement Officer</option>
                    <option value="Personal Friend / Associate">Personal Friend / Associate</option>
                    <option value="New Commercial Lead">New Commercial Lead</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isResubmitting}
                onClick={() => setSelectedCaseForResubmit(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isResubmitting || !resubmitNotes.trim()}
                onClick={handleExecuteResubmit}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isResubmitting ? 'Submitting...' : 'Resubmit to LUMO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYOUT REQUEST MODAL (Direct from My Connections) */}
      {selectedCaseForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Request Deal Payout
                  </h3>
                  <p className="text-xs text-slate-500">Withdraw approved commercial reward.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseForPayout(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Deal Card */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Target Deal
                </span>
                <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                  {selectedCaseForPayout.reference}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {selectedCaseForPayout.dealTitle}
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Payout Channel / Mobile Provider
                </label>
                <select
                  value={payoutChannel}
                  onChange={(e) => setPayoutChannel(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                >
                  <option value="VODACOM_MPESA">Vodacom M-Pesa</option>
                  <option value="TIGO_PESA">Tigo Pesa</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="HALOPESA">Halopesa</option>
                  <option value="CRDB_BANK">CRDB Bank Account</option>
                  <option value="NMB_BANK">NMB Bank Account</option>
                </select>
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  {payoutChannel.includes('BANK') ? 'Bank Account Number' : 'Recipient Mobile Phone Number'}
                </label>
                <input
                  type="text"
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value)}
                  placeholder={payoutChannel.includes('BANK') ? 'e.g. 0150XXXXXXXX' : 'e.g. 07XXXXXXXX or +255XXXXXXXXX'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              {/* Deductions Breakdown */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Gross Reward:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    TZS {selectedCaseForPayout.rewardAmountTZS.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>3% LUMO Platform Fee:</span>
                  <span className="font-mono">
                    -TZS {Math.round(selectedCaseForPayout.rewardAmountTZS * 0.03).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>5% TRA Withholding Tax:</span>
                  <span className="font-mono">
                    -TZS {Math.round(selectedCaseForPayout.rewardAmountTZS * 0.05).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 text-sm font-black text-emerald-600 font-mono">
                  <span>Net Expected Disbursement:</span>
                  <span>
                    TZS {Math.max(0, Math.round(selectedCaseForPayout.rewardAmountTZS * 0.92)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                disabled={isSubmittingPayout}
                onClick={() => setSelectedCaseForPayout(null)}
                className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingPayout || !payoutPhone.trim()}
                onClick={handleExecutePayout}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <Wallet className="w-4 h-4" />
                <span>{isSubmittingPayout ? 'Submitting...' : 'Confirm & Request Payout'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
