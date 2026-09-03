'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import { MOCK_PAYMENTS } from '../mockData'
import { PaymentLedgerItem } from '../types'
import { useAdminToast } from '../AdminToast'

export function PaymentsTab() {
  const { showToast } = useAdminToast()

  const [payments, setPayments] = useState<PaymentLedgerItem[]>(MOCK_PAYMENTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [purposeFilter, setPurposeFilter] = useState('ALL')

  const [refundModal, setRefundModal] = useState<PaymentLedgerItem | null>(null)
  const [refundReason, setRefundReason] = useState('DUPLICATE_PAYMENT')
  const [customReasonNote, setCustomReasonNote] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.payerName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesChannel = channelFilter === 'ALL' || p.channel === channelFilter
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    const matchesPurpose = purposeFilter === 'ALL' || p.purpose === purposeFilter
    return matchesSearch && matchesChannel && matchesStatus && matchesPurpose
  })

  const handleRetryVerification = (ref: string) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.reference === ref
          ? {
              ...p,
              status: 'SUCCESSFUL',
              verifiedAt: 'Just now (Gateway callback matched)',
            }
          : p
      )
    )
    showToast('success', 'Telco Payment Verified', `Verification callback confirmed for ${ref}. Amount credited.`)
  }

  const handleExecuteRefund = () => {
    if (!refundModal) return
    setPayments((prev) =>
      prev.map((p) => (p.reference === refundModal.reference ? { ...p, status: 'REFUNDED' } : p))
    )

    showToast(
      'info',
      'Refund Dispatched',
      `Controlled reversal initiated for ${refundModal.reference} (TZS ${refundModal.grossAmountTZS.toLocaleString()}).`
    )
    setRefundModal(null)
    setCustomReasonNote('')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Incoming Payments & Settlement Ledger</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
              Immutable Ledger
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade double-entry record of all incoming subscription payments, deal escrow deposits, and mobile money collections.
          </p>
        </div>

        <button
          onClick={() => setShowExportModal(true)}
          className="py-2 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Ledger</span>
        </button>
      </div>

      {/* Immutability Callout */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Financial Immutability Guarantee:</strong> Successful payments are permanent ledger entries and cannot be altered or deleted. Adjustments must follow strict reversal/refund accounting trails.
        </div>
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
            <option value="DEAL_ESCROW_FUNDING">Deal Escrow</option>
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
                  No payment transactions recorded in the payment ledger yet.
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
                  <div className="font-bold text-slate-900 dark:text-white">{pay.payerName}</div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {pay.payerType} · {pay.purpose.replace('_', ' ')}
                  </div>
                </td>

                <td className="p-3">
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold text-[10px]">
                    {pay.channel.replace('_', ' ')}
                  </span>
                </td>

                <td className="p-3 font-mono">
                  <div className="text-slate-900 dark:text-white font-bold">
                    TZS {pay.grossAmountTZS.toLocaleString()}
                  </div>
                  {pay.processingFeeTZS > 0 && (
                    <div className="text-[10px] text-slate-400">
                      Fee: TZS {pay.processingFeeTZS.toLocaleString()}
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
                        onClick={() => handleRetryVerification(pay.reference)}
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
                  <option value="INCORRECT_DEAL_ESCROW">Incorrect Deal Escrow Deposit Amount</option>
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
                  Export Encrypted Payment Ledger
                </h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500">
                Export complete statutory audit ledger formatted for Tanzania Revenue Authority (TRA) electronic fiscal filing.
              </p>

              <div>
                <label className="font-bold block mb-1">Export Format</label>
                <select className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800">
                  <option>CSV (Excel & Spreadsheet Compatible)</option>
                  <option>JSON (Tamper-evident cryptographically signed)</option>
                  <option>PDF (Formatted Official Ledger Statement)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={() => {
                  setShowExportModal(false)
                  showToast('success', 'Ledger Exported', 'Statutory payment ledger downloaded.')
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
    </div>
  )
}
