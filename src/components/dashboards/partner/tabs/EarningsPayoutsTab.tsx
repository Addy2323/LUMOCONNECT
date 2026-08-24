'use client'

import React, { useState } from 'react'
import {
  Wallet,
  ArrowUpRight,
  Download,
  Calendar,
  DollarSign,
  Building,
  CheckCircle2,
  Clock,
  Filter,
  FileText,
  AlertCircle,
} from 'lucide-react'
import {
  PartnerEarningsRecord,
  PartnerPayoutRequest,
  PartnerPayoutMethod,
} from '../types'
import {
  MOCK_PARTNER_EARNINGS,
  MOCK_PAYOUT_REQUESTS,
  MOCK_PAYOUT_METHODS,
} from '../mockData'
import { usePartnerToast } from '../PartnerToast'

interface EarningsPayoutsTabProps {
  onOpenStatement?: () => void
}

export function EarningsPayoutsTab({ onOpenStatement }: EarningsPayoutsTabProps = {}) {
  const { showToast } = usePartnerToast()

  const [earnings] = useState<PartnerEarningsRecord[]>(MOCK_PARTNER_EARNINGS)
  const [payouts, setPayouts] = useState<PartnerPayoutRequest[]>(MOCK_PAYOUT_REQUESTS)
  const [payoutMethods] = useState<PartnerPayoutMethod[]>(MOCK_PAYOUT_METHODS)
  const [showRequestPayoutModal, setShowRequestPayoutModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState(0)
  const [selectedMethodId, setSelectedMethodId] = useState(payoutMethods[0]?.id || '')

  const payableTotal = earnings
    .filter((e) => e.status === 'PAYABLE')
    .reduce((acc, e) => acc + e.netRewardTZS, 0)

  const pendingTotal = earnings
    .filter((e) => e.status === 'PENDING' || e.status === 'VALIDATING')
    .reduce((acc, e) => acc + e.netRewardTZS, 0)

  const paidTotal = earnings
    .filter((e) => e.status === 'PAID')
    .reduce((acc, e) => acc + e.netRewardTZS, 0)

  const taxTotal = earnings
    .filter((e) => e.status === 'PAID')
    .reduce((acc, e) => acc + e.taxWithheldTZS, 0)

  const handleExecutePayout = () => {
    if (withdrawAmount <= 0 || withdrawAmount > payableTotal) {
      showToast('error', 'Invalid Amount', 'Requested payout exceeds your available payable rewards balance.')
      return
    }

    const selectedMethod = payoutMethods.find((m) => m.id === selectedMethodId) || payoutMethods[0]
    if (!selectedMethod) {
      showToast('error', 'No Payout Method', 'Please add a verified M-Pesa or Bank payout method in Account settings first.')
      return
    }
    const tax = Math.round(withdrawAmount * 0.05)
    const net = withdrawAmount - tax

    const newReq: PartnerPayoutRequest = {
      id: `pay_req_${Date.now()}`,
      requestedAt: 'Today, Just now',
      amountTZS: withdrawAmount,
      taxWithheldTZS: tax,
      netAmountTZS: net,
      payoutMethod: selectedMethod.type.replace(/_/g, ' '),
      accountNumberMasked: selectedMethod.accountNumberMasked,
      status: 'PROCESSING',
      referenceNumber: `LUMO-PAY-${Date.now().toString().slice(-6)}`,
    }

    setPayouts([newReq, ...payouts])
    setShowRequestPayoutModal(false)
    showToast(
      'success',
      'Payout Request Submitted',
      `Withdrawal of TZS ${net.toLocaleString()} (after 5% TRA tax) queued for immediate mobile money disbursement.`
    )
  }

  const handleDownloadReceipt = (ref: string) => {
    showToast('success', 'Disbursement Receipt Downloaded', `Official PDF payment receipt ${ref} downloaded.`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Earnings, Commissions & Payouts</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
              Read + Payout Request
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor verified commissions, statutory TRA withholding tax deductions, and request mobile money or bank payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRequestPayoutModal(true)}
            className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>Request Payout</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Balances */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Available Payable Earnings</span>
          <div className="text-xl sm:text-2xl font-black text-[#FF6A00] font-mono mt-1">
            TZS {payableTotal.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Approved & Ready to Withdraw</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Validation</span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-1">
            TZS {pendingTotal.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Under 7-day cooling period</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Earnings Paid Out</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-1">
            TZS {paidTotal.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Disbursed to M-Pesa / Bank</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase">TRA Withholding Tax (5%)</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            TZS {taxTotal.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Official tax certificates issued</span>
        </div>
      </div>

      {/* Payout Requests History */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Payout Requests & Disbursement Trail
        </h3>

        {payouts.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500">
            No payout requests recorded yet. When you request withdrawals, the disbursement audit trail will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b">
                <tr>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Date Requested</th>
                  <th className="p-3">Gross Amount</th>
                  <th className="p-3">TRA Tax (5%)</th>
                  <th className="p-3">Net Disbursed</th>
                  <th className="p-3">Payout Method</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {payouts.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{req.referenceNumber}</td>
                    <td className="p-3 text-slate-500">{req.requestedAt}</td>
                    <td className="p-3 font-mono font-bold">TZS {req.amountTZS.toLocaleString()}</td>
                    <td className="p-3 font-mono text-slate-500">- TZS {req.taxWithheldTZS.toLocaleString()}</td>
                    <td className="p-3 font-mono font-black text-emerald-600">
                      TZS {req.netAmountTZS.toLocaleString()}
                    </td>
                    <td className="p-3 text-[11px] text-slate-700 dark:text-slate-300">
                      {req.payoutMethod} ({req.accountNumberMasked})
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          req.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : req.status === 'APPROVED' || req.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDownloadReceipt(req.referenceNumber)}
                        className="py-1 px-2.5 border rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#FF6A00]" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rewards Ledger */}
      <div className="space-y-3 pt-3 border-t">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Itemized Verified Rewards Ledger
        </h3>

        {earnings.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500">
            No reward transactions recorded yet. Completed customer referrals will credit here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b">
                <tr>
                  <th className="p-3">Reward Reference</th>
                  <th className="p-3">Deal Title</th>
                  <th className="p-3">Business</th>
                  <th className="p-3">Gross Reward</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Tracked Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {earnings.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{e.referenceId}</td>
                    <td className="p-3">{e.dealTitle}</td>
                    <td className="p-3 text-slate-500">{e.businessName}</td>
                    <td className="p-3 font-mono font-bold text-[#FF6A00]">
                      TZS {e.grossRewardTZS.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {e.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-mono">{e.trackedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      {showRequestPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#FF6A00]" />
              <span>Request Earnings Withdrawal</span>
            </h3>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Available Balance:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  TZS {payableTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <label className="font-bold block text-slate-700 dark:text-slate-300">
                Withdrawal Amount (TZS)
              </label>
              <input
                type="number"
                min={10000}
                max={payableTotal}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
              />
            </div>

            {payoutMethods.length > 0 && (
              <div className="text-xs space-y-1">
                <label className="font-bold block text-slate-700 dark:text-slate-300">
                  Select Payout Account
                </label>
                <select
                  value={selectedMethodId}
                  onChange={(e) => setSelectedMethodId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  {payoutMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.accountTitle} ({m.type.replace(/_/g, ' ')} · {m.accountNumberMasked})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExecutePayout}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Confirm & Request Payout
              </button>
              <button
                onClick={() => setShowRequestPayoutModal(false)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
