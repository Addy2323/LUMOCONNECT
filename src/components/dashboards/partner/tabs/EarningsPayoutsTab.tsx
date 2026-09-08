'use client'

import React, { useState, useEffect } from 'react'
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
  Plus,
  X,
  Phone,
  Check,
  Send,
  CreditCard,
} from 'lucide-react'
import { usePartnerToast } from '../PartnerToast'
import { usePlatformConfig } from '@/lib/platformConfig'

interface PartnerRewardItem {
  id: string
  opportunityTitle: string
  merchantName: string
  category: string
  completionsCount: number
  grossAmountTZS: number
  status: 'PAYABLE' | 'PENDING'
}

interface PartnerPayoutRecord {
  id: string
  reference: string
  date: string
  payoutMethod: string
  accountNumberMasked: string
  grossAmountTZS: number
  platformFeeTZS: number
  taxWithheldTZS: number
  netPaidTZS: number
  status: 'COMPLETED' | 'PROCESSING'
}

const DEFAULT_PARTNER_REWARDS: PartnerRewardItem[] = [
  {
    id: 'pr_1',
    opportunityTitle: 'SaaS SME Lead Generation & Customer Referral',
    merchantName: 'Zanzi Solar Ltd',
    category: 'IT & Software Services',
    completionsCount: 7,
    grossAmountTZS: 517000,
    status: 'PAYABLE',
  },
  {
    id: 'pr_2',
    opportunityTitle: 'Toyota Land Cruiser V8 High-Ticket Acquisition',
    merchantName: 'Bingwa Wa Magari Co.',
    category: 'Automotive & Transportation',
    completionsCount: 1,
    grossAmountTZS: 2000000,
    status: 'PAYABLE',
  },
  {
    id: 'pr_3',
    opportunityTitle: 'Mwanza Regional Solar Distributors Match',
    merchantName: 'Lake Renewables Ltd',
    category: 'Sourcing & Supply Chain',
    completionsCount: 1,
    grossAmountTZS: 3000000,
    status: 'PENDING',
  },
]

const DEFAULT_PARTNER_PAYOUTS: PartnerPayoutRecord[] = [
  {
    id: 'po_prev_1',
    reference: 'LUMO-PAY-992140',
    date: '20 Aug 2026, 14:15',
    payoutMethod: 'Vodacom M-Pesa',
    accountNumberMasked: '+255 754 *** 123',
    grossAmountTZS: 1200000,
    platformFeeTZS: 36000,
    taxWithheldTZS: 60000,
    netPaidTZS: 1104000,
    status: 'COMPLETED',
  },
]

export function EarningsPayoutsTab() {
  const { showToast } = usePartnerToast()
  const [platformConfig] = usePlatformConfig()
  const feeRate = (platformConfig.platformFeePercent || 3) / 100
  const taxRate = (platformConfig.withholdingTaxPercent || 5) / 100

  const [rewards, setRewards] = useState<PartnerRewardItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lumo_partner_rewards_list')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      } catch (e) {
        console.warn('Failed to load partner rewards', e)
      }
    }
    return DEFAULT_PARTNER_REWARDS
  })

  const [payouts, setPayouts] = useState<PartnerPayoutRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lumo_partner_payout_history')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      } catch (e) {
        console.warn('Failed to load partner payouts', e)
      }
    }
    return DEFAULT_PARTNER_PAYOUTS
  })

  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestTargetReward, setRequestTargetReward] = useState<PartnerRewardItem | null>(null)

  // Modal Form State
  const [payoutChannel, setPayoutChannel] = useState<'VODACOM_MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'CRDB_BANK'>('VODACOM_MPESA')
  const [payoutPhone, setPayoutPhone] = useState('+255 754 990 123')
  const [requestAmount, setRequestAmount] = useState<number>(517000)

  // Sync to storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lumo_partner_rewards_list', JSON.stringify(rewards))
        localStorage.setItem('lumo_partner_payout_history', JSON.stringify(payouts))
      } catch (e) {
        console.warn('Failed to save partner payout state', e)
      }
    }
  }, [rewards, payouts])

  // Calculated totals
  const payableRewards = rewards.filter((r) => r.status === 'PAYABLE')
  const pendingRewards = rewards.filter((r) => r.status === 'PENDING')

  const availableBalanceTZS = payableRewards.reduce((acc, r) => acc + r.grossAmountTZS, 0)
  const pendingBalanceTZS = pendingRewards.reduce((acc, r) => acc + r.grossAmountTZS, 0)
  const settledToDateTZS = payouts.reduce((acc, p) => acc + p.netPaidTZS, 0)
  const payoutRunsCount = payouts.length

  // Open single reward payout request
  const handleOpenRewardRequest = (item: PartnerRewardItem) => {
    setRequestTargetReward(item)
    setRequestAmount(item.grossAmountTZS)
    setShowRequestModal(true)
  }

  // Open general payout request
  const handleOpenGeneralRequest = () => {
    setRequestTargetReward(null)
    setRequestAmount(availableBalanceTZS > 0 ? availableBalanceTZS : 50000)
    setShowRequestModal(true)
  }

  // Submit Payout Request
  const handleExecutePayoutRequest = () => {
    if (requestAmount <= 0) {
      showToast('error', 'Invalid Amount', 'Please enter a valid payout amount.')
      return
    }

    if (requestAmount > availableBalanceTZS && !requestTargetReward) {
      showToast('error', 'Exceeds Available Balance', `Requested amount exceeds your available balance of TZS ${availableBalanceTZS.toLocaleString()}.`)
      return
    }

    const platformFee = Math.round(requestAmount * feeRate)
    const taxWithheld = Math.round(requestAmount * taxRate)
    const net = requestAmount - platformFee - taxWithheld

    const newPayout: PartnerPayoutRecord = {
      id: `po_req_${Date.now()}`,
      reference: `LUMO-PAY-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      payoutMethod: payoutChannel.replace(/_/g, ' '),
      accountNumberMasked: payoutPhone,
      grossAmountTZS: requestAmount,
      platformFeeTZS: platformFee,
      taxWithheldTZS: taxWithheld,
      netPaidTZS: net,
      status: 'PROCESSING',
    }

    // Update rewards if specific or general
    if (requestTargetReward) {
      setRewards((prev) => prev.filter((r) => r.id !== requestTargetReward.id))
    } else {
      // Deduct from payable
      setRewards((prev) => prev.filter((r) => r.status !== 'PAYABLE'))
    }

    setPayouts((prev) => [newPayout, ...prev])
    setShowRequestModal(false)
    setRequestTargetReward(null)

    showToast(
      'success',
      'Payout Request Submitted',
      `Payout request for TZS ${requestAmount.toLocaleString()} (Net TZS ${net.toLocaleString()}) submitted. Queued for mobile money settlement.`
    )
  }

  const formatCompactTZS = (amount: number) => {
    if (amount >= 1000000) {
      const millions = amount / 1000000
      return `TZS ${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`
    }
    if (amount >= 1000) {
      const thousands = amount / 1000
      return `TZS ${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0)}K`
    }
    return `TZS ${amount.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Wallet & payouts
        </h1>
      </div>

      {/* TOP METRICS ROW - 4 CARDS MATCHING SCREENSHOT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: WALLET BALANCE / AVAILABLE TO WITHDRAW (Dark Forest Green / Slate Theme) */}
        <div className="p-5 rounded-3xl bg-[#0f231e] text-white shadow-md flex flex-col justify-between min-h-[120px] border border-emerald-950/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400/80 uppercase">
            AVAILABLE TO WITHDRAW
          </span>
          <div className="my-1">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {formatCompactTZS(availableBalanceTZS)}
            </div>
            <p className="text-[11px] text-emerald-300/70 font-medium">
              approved & ready for payout request
            </p>
          </div>
        </div>

        {/* CARD 2: PENDING VALIDATIONS */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[120px]">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            PENDING VALIDATIONS
          </span>
          <div className="my-1">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {formatCompactTZS(pendingBalanceTZS)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {pendingRewards.length} rewards in inspection
            </p>
          </div>
        </div>

        {/* CARD 3: SETTLED TO DATE */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[120px]">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            SETTLED TO DATE
          </span>
          <div className="my-1">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {formatCompactTZS(settledToDateTZS)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {payoutRunsCount} completed payouts
            </p>
          </div>
        </div>

        {/* CARD 4: PLATFORM FEE & TAX RATE (MANAGED BY ADMIN) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[120px]">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            PLATFORM FEE RATE
          </span>
          <div className="my-1">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {platformConfig.platformFeePercent}%
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              + {platformConfig.withholdingTaxPercent}% TRA tax (managed by Admin)
            </p>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS BAR */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleOpenGeneralRequest}
          disabled={availableBalanceTZS === 0}
          className="py-2.5 px-6 bg-[#FF6A00] hover:bg-[#EA580C] disabled:opacity-50 text-white font-extrabold text-xs rounded-full shadow-xs transition-all active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span>Request Payout</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (availableBalanceTZS > 0) {
              handleOpenGeneralRequest()
            }
          }}
          disabled={availableBalanceTZS === 0}
          className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-full border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
        >
          Request all available rewards
        </button>
      </div>

      {/* SECTION 1: APPROVED REWARDS AVAILABLE TO REQUEST */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Approved rewards ready for withdrawal
          </h3>
        </div>

        {payableRewards.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-slate-800 dark:text-white">No Unclaimed Rewards</div>
            <p>All your approved rewards have been requested or settled.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[600px]">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-[10px] text-slate-400 font-mono uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-5 font-bold">OPPORTUNITY / MERCHANT</th>
                  <th className="py-3 px-5 font-bold text-center">COMPLETIONS</th>
                  <th className="py-3 px-5 font-bold text-right">GROSS REWARD</th>
                  <th className="py-3 px-5 font-bold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payableRewards.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {p.opportunityTitle}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Merchant: {p.merchantName} · {p.category}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {p.completionsCount}
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-black text-slate-900 dark:text-white">
                      TZS {p.grossAmountTZS.toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenRewardRequest(p)}
                        className="py-1.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-full shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Request Payout</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: PAYOUT HISTORY & DISBURSEMENTS */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Payout history
          </h3>
          {payouts.length > 0 && (
            <span className="text-[11px] text-slate-400 font-mono">{payouts.length} disbursements</span>
          )}
        </div>

        {payouts.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-slate-400">
            No payouts yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-[10px] text-slate-400 font-mono uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-5 font-bold">REFERENCE</th>
                  <th className="py-3 px-5 font-bold">DATE</th>
                  <th className="py-3 px-5 font-bold">PAYOUT METHOD</th>
                  <th className="py-3 px-5 font-bold text-right">GROSS</th>
                  <th className="py-3 px-5 font-bold text-right">{platformConfig.platformFeePercent}% FEE</th>
                  <th className="py-3 px-5 font-bold text-right">{platformConfig.withholdingTaxPercent}% TRA TAX</th>
                  <th className="py-3 px-5 font-bold text-right">NET RECEIVED</th>
                  <th className="py-3 px-5 font-bold text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payouts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-white">
                      {item.reference}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                      {item.date}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.payoutMethod}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{item.accountNumberMasked}</div>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      TZS {item.grossAmountTZS.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-400">
                      -TZS {item.platformFeeTZS.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-400">
                      -TZS {item.taxWithheldTZS.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-black text-emerald-600">
                      TZS {item.netPaidTZS.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REQUEST PAYOUT MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] flex items-center justify-center font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Request Reward Payout
                  </h3>
                  <p className="text-xs text-slate-500">Withdraw approved earnings to Mobile Money or Bank.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Payout Channel / Destination
                </label>
                <select
                  value={payoutChannel}
                  onChange={(e) => setPayoutChannel(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value="VODACOM_MPESA">Vodacom M-Pesa</option>
                  <option value="TIGO_PESA">Tigo Pesa</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="CRDB_BANK">CRDB Bank Account</option>
                </select>
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  {payoutChannel === 'CRDB_BANK' ? 'Bank Account Number' : 'Recipient Mobile Phone Number'}
                </label>
                <input
                  type="text"
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Withdrawal Amount (TZS)
                </label>
                <input
                  type="number"
                  min={10000}
                  step={10000}
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-black text-slate-900 dark:text-white text-sm"
                />
              </div>

              {/* Deductions Breakdown */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Withdrawal:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    TZS {requestAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>{platformConfig.platformFeePercent}% LUMO Platform Fee:</span>
                  <span className="font-mono">
                    -TZS {Math.round(requestAmount * feeRate).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>{platformConfig.withholdingTaxPercent}% TRA Withholding Tax:</span>
                  <span className="font-mono">
                    -TZS {Math.round(requestAmount * taxRate).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t text-sm font-black text-emerald-600 font-mono">
                  <span>Net Expected Disbursement:</span>
                  <span>
                    TZS {(requestAmount - Math.round(requestAmount * feeRate) - Math.round(requestAmount * taxRate)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePayoutRequest}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
              >
                <Send className="w-4 h-4" />
                <span>Submit Payout Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
