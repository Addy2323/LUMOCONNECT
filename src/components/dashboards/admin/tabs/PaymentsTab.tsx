'use client'

import React, { useState, useEffect } from 'react'
import {
  Wallet,
  Search,
  RefreshCw,
  RotateCcw,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Download,
  Building,
  X,
  FileSpreadsheet,
  Crown,
  Smartphone,
  Send,
  Loader2,
} from 'lucide-react'
import { useAdminResource } from '../useAdminResource'
import { ResourceStatus } from '../ResourceStatus'
import { downloadRecords } from '@/lib/download-records'
import { PaymentLedgerItem } from '../types'
import { useAdminToast } from '../AdminToast'

interface PaymentsTabProps {
  onNavigateToSubscriptions?: () => void
}

export function PaymentsTab({ onNavigateToSubscriptions }: PaymentsTabProps = {}) {
  const { showToast } = useAdminToast()

  const resource = useAdminResource<{ payments: PaymentLedgerItem[] }>('/api/admin/payments')
  const payments = resource.data?.payments ?? []
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [purposeFilter, setPurposeFilter] = useState('ALL')
  const [subTypeFilter, setSubTypeFilter] = useState<'ALL' | 'NORMAL' | 'GOLDEN_VIP_PRIVATE'>('ALL')
  const [snippeBalance, setSnippeBalance] = useState<{ available: number; balance: number; currency: string } | null>(null)

  useEffect(() => {
    fetch('/api/payments/balance')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setSnippeBalance(res.data)
        }
      })
      .catch((e) => console.warn('Snippe balance fetch:', e))
  }, [])

  const [refundModal, setRefundModal] = useState<PaymentLedgerItem | null>(null)
  const [refundReason, setRefundReason] = useState('DUPLICATE_PAYMENT')
  const [customReasonNote, setCustomReasonNote] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)

  // Direct Mobile Money Sending State
  const [showDirectSendModal, setShowDirectSendModal] = useState(false)
  const [directPhone, setDirectPhone] = useState('')
  const [directName, setDirectName] = useState('')
  const [directAmount, setDirectAmount] = useState('')
  const [directNarration, setDirectNarration] = useState('')
  const [isSendingDirect, setIsSendingDirect] = useState(false)

  const handleSendDirectMoney = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!directPhone.trim()) {
      showToast('error', 'Phone Required', 'Please enter a recipient phone number (e.g. 0711788830).')
      return
    }
    if (!directName.trim()) {
      showToast('error', 'Name Required', 'Please enter the recipient full name.')
      return
    }
    const amt = Number(directAmount)
    if (isNaN(amt) || amt < 5000) {
      showToast('error', 'Invalid Amount', 'Minimum transfer amount via Snippe is TZS 5,000.')
      return
    }
    if (snippeBalance && amt > snippeBalance.available) {
      showToast(
        'error',
        'Insufficient Gateway Balance',
        `Available balance is TZS ${snippeBalance.available.toLocaleString()}. Top up gateway balance or enter a lower amount.`
      )
      return
    }

    setIsSendingDirect(true)
    try {
      const res = await fetch('/api/admin/payments/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: directPhone.trim(),
          recipientName: directName.trim(),
          amountTZS: amt,
          narration: directNarration.trim() || 'Direct Mobile Money Disbursal via LUMO Admin',
        }),
      })
      const data = await res.json()
      if (data?.success) {
        showToast(
          'success',
          'Money Sent Successfully!',
          `TZS ${amt.toLocaleString()} sent directly to ${directPhone.trim()} via Snippe. Ref: ${data.reference}`
        )
        setShowDirectSendModal(false)
        setDirectPhone('')
        setDirectName('')
        setDirectAmount('')
        setDirectNarration('')
        resource.retry()
        // Refresh balance
        fetch('/api/payments/balance')
          .then((r) => r.json())
          .then((res) => {
            if (res.success && res.data) setSnippeBalance(res.data)
          })
          .catch(() => null)
      } else {
        showToast('error', 'Transfer Failed', data?.error || 'Failed to dispatch mobile money.')
      }
    } catch {
      showToast('error', 'Network Error', 'Check your connection and try again.')
    } finally {
      setIsSendingDirect(false)
    }
  }

  // Executive subscription metrics calculation
  const totalSubRevenue = payments
    .filter((p) => p.purpose === 'SUBSCRIPTION' && p.status === 'SUCCESSFUL' && p.currency === 'TZS')
    .reduce((acc, p) => acc + p.grossAmountTZS, 0)

  const totalSecuredDealFunds = payments
    .filter((p) => p.purpose === 'DEAL_ESCROW_FUNDING' && p.status === 'SUCCESSFUL' && p.currency === 'TZS')
    .reduce((acc, p) => acc + p.grossAmountTZS, 0)

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.payerName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesChannel = channelFilter === 'ALL' || p.channel === channelFilter
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    const matchesPurpose = purposeFilter === 'ALL' || p.purpose === purposeFilter
    const matchesSubType =
      subTypeFilter === 'ALL' ||
      (p.purpose === 'SUBSCRIPTION' && p.subscriptionType === subTypeFilter)
    return matchesSearch && matchesChannel && matchesStatus && matchesPurpose && matchesSubType
  })

  const handleRetryVerification = () => {
    resource.retry()
    showToast('info', 'Refreshing payment status', 'Only confirmed provider updates can change payment status.')
  }
  const handleExecuteRefund = () => {
    showToast('error', 'Refund unavailable', 'Provider refund processing is not connected. No payment has been changed.')
  }

  if (!resource.data) return <ResourceStatus {...resource} />

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      <ResourceStatus {...resource} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Incoming Payments & Settlement Ledger</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
              Payment Records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Recorded payment attempts and their current database status. Fees and settlement verification appear only when recorded.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setShowDirectSendModal(true)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-100" />
            <span>Send Direct Money</span>
          </button>

          {onNavigateToSubscriptions && (
            <button
              onClick={onNavigateToSubscriptions}
              className="py-2 px-3.5 bg-gradient-to-r from-amber-500 via-[#FF6A00] to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-100" />
              <span>Manual Upgrade User</span>
            </button>
          )}

          <button
            onClick={() => setShowExportModal(true)}
            className="py-2 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Ledger</span>
          </button>
        </div>
      </div>

      {/* Executive Subscription & Settlement Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300">
            <span>Golden VIP Subscriptions</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            Unavailable
          </div>
          <p className="text-[10px] text-amber-800 dark:text-amber-400">Payment-to-plan attribution is not recorded</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
            <span>Subscription Collections</span>
            <Wallet className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            TZS {totalSubRevenue.toLocaleString()}
          </div>
          <p className="text-[10px] text-blue-800 dark:text-blue-400">Successful subscription payments in TZS</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
            <span>Secured Deal Funding Pool</span>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            TZS {(totalSecuredDealFunds ?? 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-emerald-800 dark:text-emerald-400">Pre-funded merchant deposits</p>
        </div>

        <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 dark:bg-orange-950/30 dark:border-orange-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-orange-900 dark:text-orange-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Snippe Live Gateway
            </span>
            <Smartphone className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {snippeBalance ? `${snippeBalance.currency} ${snippeBalance.available.toLocaleString()}` : 'Unavailable'}
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <p className="text-[10px] text-orange-800 dark:text-orange-400">Mobile Money Balance</p>
            <button
              type="button"
              onClick={() => setShowDirectSendModal(true)}
              className="text-[10px] font-black text-[#FF6A00] hover:text-orange-700 underline flex items-center gap-0.5 cursor-pointer"
            >
              <Send className="w-2.5 h-2.5" />
              <span>Send Money</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Tier Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-500 mr-1">Subscription Category:</span>
        <button
          type="button"
          onClick={() => setSubTypeFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
            subTypeFilter === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          All Ledger Items ({payments.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTypeFilter('GOLDEN_VIP_PRIVATE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
            subTypeFilter === 'GOLDEN_VIP_PRIVATE'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-xs'
              : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Private Golden VIP Subscriptions ({payments.filter(p => p.subscriptionType === 'GOLDEN_VIP_PRIVATE').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTypeFilter('NORMAL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
            subTypeFilter === 'NORMAL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300'
          }`}
        >
          <Building className="w-3.5 h-3.5 shrink-0" />
          <span>Normal Subscriptions ({payments.filter(p => p.subscriptionType === 'NORMAL').length})</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search reference (LUMO-PAY-...) or payer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="ALL">All Payment Channels</option>
            <option value="VODACOM_MPESA">Vodacom M-Pesa</option>
            <option value="TIGO_PESA">Tigo Pesa</option>
            <option value="AIRTEL_MONEY">Airtel Money</option>
            <option value="HALOPESA">HaloPesa</option>
            <option value="CRDB_BANK">CRDB Bank</option>
            <option value="NMB_BANK">NMB Bank</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="ALL">All Purposes</option>
            <option value="SUBSCRIPTION">Subscriptions</option>
            <option value="DEAL_ESCROW_FUNDING">Direct Deal Reward Funding</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">Payment Reference</th>
              <th className="p-3">Payer & Purpose</th>
              <th className="p-3">Channel</th>
              <th className="p-3">Gross / Net Amount</th>
              <th className="p-3">Timestamp / Verified</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  {resource.loading ? 'Loading payment records?' : resource.error ? 'Payment records are unavailable.' : 'No payment transactions match these filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-extrabold text-slate-900 dark:text-white font-mono">{pay.reference}</div>
                  <div className="text-[10px] text-slate-400 font-mono">ID: {pay.id}</div>
                </td>

                <td className="p-3">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{pay.payerName}</span>
                    {pay.subscriptionType === 'GOLDEN_VIP_PRIVATE' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950">
                        <Crown className="w-3 h-3 text-slate-950 shrink-0" />
                        <span>Golden VIP Private</span>
                      </span>
                    )}
                    {pay.subscriptionType === 'NORMAL' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        Standard Sub
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {pay.payerType} · {pay.purpose.replace('_', ' ')} {pay.subscriptionTier ? `(${pay.subscriptionTier})` : ''}
                  </div>
                </td>

                <td className="p-3">
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold text-[10px]">
                    {pay.channel.replace('_', ' ')}
                  </span>
                </td>

                <td className="p-3 font-mono">
                  <div className="text-slate-900 dark:text-white font-bold">
                    {pay.currency} {(pay.grossAmountTZS ?? 0).toLocaleString()}
                  </div>
                  {(
                    <div className="text-[10px] text-slate-400">
                      Fee: {pay.processingFeeTZS == null ? 'Not recorded' : `TZS ${pay.processingFeeTZS.toLocaleString()}`}
                    </div>
                  )}
                </td>

                <td className="p-3 text-[11px] text-slate-500">
                  <div>{pay.createdAt}</div>
                  {pay.verifiedAt && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      <span>{pay.verifiedAt}</span>
                    </div>
                  )}
                  {pay.providerMessage && (
                    <div className="text-[10px] text-red-500">{pay.providerMessage}</div>
                  )}
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      pay.status === 'SUCCESSFUL'
                        ? 'bg-emerald-100 text-emerald-700'
                        : pay.status === 'FAILED'
                        ? 'bg-red-100 text-red-700'
                        : pay.status === 'REFUNDED'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {pay.status}
                  </span>
                </td>

                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {pay.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetryVerification()}
                        className="py-1 px-2 bg-orange-50 text-[#FF6A00] border border-orange-200 rounded-lg text-xs font-bold hover:bg-orange-100 flex items-center gap-1"
                        title="Retry Telco Verification"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}

                    {pay.status === 'SUCCESSFUL' && (
                      <button
                        onClick={() => setRefundModal(pay)}
                        className="py-1 px-2 border rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-bold"
                        title="Initiate Controlled Refund"
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>

      {/* CONTROLLED REFUND MODAL */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center font-black">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Initiate Controlled Refund
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">Ref: {refundModal.reference}</div>
                </div>
              </div>

              <button
                onClick={() => setRefundModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payer Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{refundModal.payerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Original Amount:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    TZS {refundModal.grossAmountTZS.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Gateway:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{refundModal.channel}</span>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Mandatory Regulatory Refund Reason</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="DUPLICATE_PAYMENT">Duplicate Telco STK Push Transaction</option>
                  <option value="INCORRECT_DEAL_ESCROW">Incorrect Deal Reward Deposit Amount</option>
                  <option value="SUBSCRIPTION_RESCISSION">Subscription Cancellation within Cooling Period</option>
                  <option value="DISPUTE_MEDIATION_FINDING">Dispute Mediation Finding in Favor of Payer</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Additional Compliance Notes</label>
                <textarea
                  rows={2}
                  placeholder="Record customer support reference or mobile money reversal authorization ID..."
                  value={customReasonNote}
                  onChange={(e) => setCustomReasonNote(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleExecuteRefund}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Sign & Dispatch Refund
              </button>
              <button
                onClick={() => setRefundModal(null)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT LEDGER MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Export Payment Records
                </h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500">
                Download the currently filtered database records as JSON.
              </p>

              <div>
                <label className="font-bold block mb-1">Export Format</label>
                <select className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800">
                  <option>JSON records</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={() => {
                  setShowExportModal(false)
                  downloadRecords('lumo-payments.json', filtered)
                }}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs"
              >
                Download Ledger
              </button>
              <button onClick={() => setShowExportModal(false)} className="py-2.5 px-4 border rounded-xl text-xs font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT MOBILE MONEY TRANSFER MODAL */}
      {showDirectSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Direct Mobile Money Disbursal</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
                      Snippe Live
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Send funds instantly to any Vodacom, Tigo, Airtel, or Halotel phone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectSendModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gateway Balance Indicator */}
            <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-orange-900 dark:text-orange-200">
                  Available Gateway Balance:
                </span>
              </div>
              <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                {snippeBalance
                  ? `${snippeBalance.currency} ${snippeBalance.available.toLocaleString()}`
                  : 'Checking balance...'}
              </span>
            </div>

            <form onSubmit={handleSendDirectMoney} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Recipient Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="0711788830 or 255711788830"
                    value={directPhone}
                    onChange={(e) => setDirectPhone(e.target.value)}
                    className="w-full pl-3 pr-24 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                    TZ (+255)
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports Vodacom M-Pesa, Mixx by Yas (Tigo), Airtel Money, and Halotel.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Recipient Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Given Mhema"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Amount to Send (TZS) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Min: TZS 5,000</span>
                </div>
                <input
                  type="number"
                  required
                  min={5000}
                  step={100}
                  placeholder="e.g. 20000"
                  value={directAmount}
                  onChange={(e) => setDirectAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black text-sm"
                />
                {/* Preset amount buttons */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[5000, 10000, 18400, 20000, 50000, 100000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDirectAmount(preset.toString())}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      TZS {preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Narration / Purpose (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Partner deal commission / Reward payout"
                  value={directNarration}
                  onChange={(e) => setDirectNarration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDirectSendModal(false)}
                  disabled={isSendingDirect}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingDirect || !directPhone.trim() || !directName.trim() || !directAmount}
                  className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSendingDirect ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Money via Snippe...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        Send {directAmount ? `TZS ${Number(directAmount).toLocaleString()}` : 'Money'} Now
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
