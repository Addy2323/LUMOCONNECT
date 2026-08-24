'use client'

import React, { useState } from 'react'
import {
  Wallet,
  Download,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Building,
  ShieldCheck,
  FileText,
  X,
  CreditCard,
} from 'lucide-react'
import {
  MOCK_PARTNER_EARNINGS,
  MOCK_PAYOUT_REQUESTS,
  MOCK_PAYOUT_METHODS,
} from '../mockData'
import {
  PartnerEarningsRecord,
  PartnerPayoutRequest,
  PartnerPayoutMethod,
  RewardStatus,
} from '../types'
import { usePartnerToast } from '../PartnerToast'

interface EarningsPayoutsTabProps {
  onOpenStatement?: () => void
}

export function EarningsPayoutsTab({ onOpenStatement }: EarningsPayoutsTabProps) {
  const { showToast } = usePartnerToast()

  const [earnings] = useState<PartnerEarningsRecord[]>(MOCK_PARTNER_EARNINGS)
  const [payouts, setPayouts] = useState<PartnerPayoutRequest[]>(MOCK_PAYOUT_REQUESTS)
  const [payoutMethods] = useState<PartnerPayoutMethod[]>(MOCK_PAYOUT_METHODS)
  const [showRequestPayoutModal, setShowRequestPayoutModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState(200000)
  const [selectedMethodId, setSelectedMethodId] = useState(payoutMethods[0]?.id || '')

  const payableTotal = earnings
    .filter((e) => e.status === 'PAYABLE')
    .reduce((acc, e) => acc + e.netRewardTZS, 0)

  const paidTotal = earnings
    .filter((e) => e.status === 'PAID')
    .reduce((acc, e) => acc + e.netRewardTZS, 0)

  const handleExecutePayout = () => {
    if (withdrawAmount <= 0 || withdrawAmount > (payableTotal + 200000)) {
      showToast('error', 'Invalid Amount', 'Requested payout exceeds your available payable rewards balance.')
      return
    }

    const selectedMethod = payoutMethods.find((m) => m.id === selectedMethodId) || payoutMethods[0]
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
            className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-[0.99]"
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
            TZS 45,000
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
            TZS 8,250
          </div>
          <span className="text-[10px] text-slate-500">Official tax certificates issued</span>
        </div>
      </div>

      {/* Payout Requests History */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Payout Requests & Disbursement Trail
        </h3>

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
                      className="py-1 px-2.5 border rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1 ml-auto"
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
      </div>

      {/* Rewards Ledger */}
      <div className="space-y-3 pt-3 border-t">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Itemized Verified Rewards Ledger
        </h3>

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
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{e.dealTitle}</td>
                  <td className="p-3 text-slate-500">{e.businessName}</td>
                  <td className="p-3 font-mono font-black text-[#FF6A00]">
                    TZS {e.grossRewardTZS.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        e.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700'
                          : e.status === 'PAYABLE'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 font-mono">{e.trackedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REQUEST PAYOUT MODAL */}
      {showRequestPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#FF6A00]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Request Payout Disbursement
                </h3>
              </div>
              <button onClick={() => setShowRequestPayoutModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Gross Withdrawal Amount (TZS)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono font-bold text-base"
                />
                <span className="text-[10px] text-slate-400">
                  Maximum available payable: TZS {payableTotal.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="font-bold block mb-1">Disbursement Payout Destination</label>
                <select
                  value={selectedMethodId}
                  onChange={(e) => setSelectedMethodId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  {payoutMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.type.replace(/_/g, ' ')} ({pm.accountNumberMasked})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tax & Net Breakdown */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Amount:</span>
                  <span className="font-mono font-bold">TZS {withdrawAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TRA Statutory Withholding (5%):</span>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                    - TZS {Math.round(withdrawAmount * 0.05).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t font-black">
                  <span>Net Payout to Account:</span>
                  <span className="font-mono text-emerald-600 text-sm">
                    TZS {Math.round(withdrawAmount * 0.95).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleExecutePayout}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl shadow-xs"
              >
                Confirm & Disburse Funds
              </button>
              <button onClick={() => setShowRequestPayoutModal(false)} className="py-2.5 px-4 border rounded-xl font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
