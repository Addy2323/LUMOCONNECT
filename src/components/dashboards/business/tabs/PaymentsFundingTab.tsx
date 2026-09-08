'use client'

import React, { useState, useEffect } from 'react'
import {
  Wallet,
  Search,
  Plus,
  Lock,
  Download,
  Building,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  RotateCcw,
  X,
  CreditCard,
  ShieldCheck,
  ArrowUpRight,
  Send,
  Phone,
  Check,
  Layers,
  ChevronRight,
  TrendingUp,
  FileText,
} from 'lucide-react'
import { RewardFundingBalance } from '../types'
import { useBusinessToast } from '../BusinessToast'
import { usePlatformConfig } from '@/lib/platformConfig'

interface PaymentsFundingTabProps {
  fundingBalance: RewardFundingBalance
  setFundingBalance: React.Dispatch<React.SetStateAction<RewardFundingBalance>>
}

interface OutstandingPartnerReward {
  id: string
  partnerName: string
  partnerPhone: string
  partnerAvatar?: string
  rewardsCount: number
  grossAmountTZS: number
  opportunityTitle: string
  payoutMethod: string
}

interface PayoutHistoryRecord {
  id: string
  reference: string
  date: string
  partnerName: string
  rewardsCount: number
  grossAmountTZS: number
  platformFeeTZS: number
  netPaidTZS: number
  channel: string
  status: 'COMPLETED' | 'PROCESSING'
}

const DEFAULT_OUTSTANDING_PARTNERS: OutstandingPartnerReward[] = [
  {
    id: 'out_1',
    partnerName: 'Latifa Ngowi',
    partnerPhone: '+255 754 990 123',
    rewardsCount: 7,
    grossAmountTZS: 517000,
    opportunityTitle: 'SaaS SME Lead Generation & Customer Referral',
    payoutMethod: 'Vodacom M-Pesa (+255 754 990 123)',
  },
  {
    id: 'out_2',
    partnerName: 'Kassim Auto Brokers',
    partnerPhone: '+255 754 889 120',
    rewardsCount: 1,
    grossAmountTZS: 2000000,
    opportunityTitle: 'Toyota Land Cruiser V8 High-Ticket Acquisition',
    payoutMethod: 'CRDB Bank Wire (A/C: 0150992817400)',
  },
  {
    id: 'out_3',
    partnerName: 'Sarah K. Tech Media',
    partnerPhone: '+255 719 334 556',
    rewardsCount: 4,
    grossAmountTZS: 280000,
    opportunityTitle: 'Gadget Unboxing & Performance Affiliate',
    payoutMethod: 'Tigo Pesa (+255 719 334 556)',
  },
]

export function PaymentsFundingTab({
  fundingBalance,
  setFundingBalance,
}: PaymentsFundingTabProps) {
  const { showToast } = useBusinessToast()
  const [platformConfig] = usePlatformConfig()
  const feeRate = (platformConfig.platformFeePercent || 3) / 100

  // State
  const [walletBalanceTZS, setWalletBalanceTZS] = useState<number>(() => {
    if (fundingBalance.availableBalanceTZS > 0) return fundingBalance.availableBalanceTZS
    return 22000000 // Default TZS 22M matching screenshot
  })

  const [outstandingPartners, setOutstandingPartners] = useState<OutstandingPartnerReward[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lumo_outstanding_rewards')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      } catch (e) {
        console.warn('Failed to load outstanding rewards', e)
      }
    }
    return DEFAULT_OUTSTANDING_PARTNERS
  })

  const [payoutHistory, setPayoutHistory] = useState<PayoutHistoryRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lumo_payout_history')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      } catch (e) {
        console.warn('Failed to load payout history', e)
      }
    }
    return []
  })

  const [settleModalPartner, setSettleModalPartner] = useState<OutstandingPartnerReward | null>(null)
  const [isBulkSettleOpen, setIsBulkSettleOpen] = useState(false)
  const [showTopUpModal, setShowTopUpModal] = useState(false)

  // Top Up Form State
  const [topUpAmount, setTopUpAmount] = useState(5000000)
  const [topUpMethod, setTopUpMethod] = useState<'VODACOM_MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'CRDB_BANK'>('VODACOM_MPESA')
  const [payerPhone, setPayerPhone] = useState('+255 754 000 111')

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lumo_outstanding_rewards', JSON.stringify(outstandingPartners))
        localStorage.setItem('lumo_payout_history', JSON.stringify(payoutHistory))
      } catch (e) {
        console.warn('Failed to save payment state', e)
      }
    }
  }, [outstandingPartners, payoutHistory])

  // Computed Totals
  const totalApprovedObligationsTZS = outstandingPartners.reduce((acc, p) => acc + p.grossAmountTZS, 0)
  const totalApprovedRewardsCount = outstandingPartners.reduce((acc, p) => acc + p.rewardsCount, 0)
  const totalSettledToDateTZS = payoutHistory.reduce((acc, p) => acc + p.grossAmountTZS, 0)
  const totalPayoutRunsCount = payoutHistory.length

  // Settle single partner
  const handleExecuteSingleSettle = (partner: OutstandingPartnerReward) => {
    if (walletBalanceTZS < partner.grossAmountTZS) {
      showToast('error', 'Insufficient Wallet Balance', `Your wallet balance (TZS ${walletBalanceTZS.toLocaleString()}) is insufficient to settle TZS ${partner.grossAmountTZS.toLocaleString()}. Please top up your wallet first.`)
      return
    }

    const platformFee = Math.round(partner.grossAmountTZS * feeRate)
    const netPaid = partner.grossAmountTZS - platformFee
    const newBalance = walletBalanceTZS - partner.grossAmountTZS

    setWalletBalanceTZS(newBalance)
    setFundingBalance((prev) => ({
      ...prev,
      availableBalanceTZS: newBalance,
      rewardsPaidTZS: prev.rewardsPaidTZS + partner.grossAmountTZS,
    }))

    // Add to Payout History
    const record: PayoutHistoryRecord = {
      id: `po_${Date.now()}`,
      reference: `LUMO-PO-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      partnerName: partner.partnerName,
      rewardsCount: partner.rewardsCount,
      grossAmountTZS: partner.grossAmountTZS,
      platformFeeTZS: platformFee,
      netPaidTZS: netPaid,
      channel: partner.payoutMethod,
      status: 'COMPLETED',
    }

    setPayoutHistory((prev) => [record, ...prev])
    setOutstandingPartners((prev) => prev.filter((p) => p.id !== partner.id))
    setSettleModalPartner(null)

    showToast('success', 'Reward Payout Disbursed', `Settled TZS ${partner.grossAmountTZS.toLocaleString()} (Net TZS ${netPaid.toLocaleString()}) to ${partner.partnerName} via ${partner.payoutMethod}.`)
  }

  // Bulk Settle All
  const handleExecuteBulkSettle = () => {
    if (outstandingPartners.length === 0) return
    if (walletBalanceTZS < totalApprovedObligationsTZS) {
      showToast('error', 'Insufficient Wallet Balance', `Total obligations of TZS ${totalApprovedObligationsTZS.toLocaleString()} exceed your available wallet balance. Please top up your wallet.`)
      return
    }

    const nowStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const newRecords: PayoutHistoryRecord[] = outstandingPartners.map((partner, idx) => {
      const fee = Math.round(partner.grossAmountTZS * feeRate)
      return {
        id: `po_${Date.now()}_${idx}`,
        reference: `LUMO-BATCH-${Date.now().toString().slice(-5)}-${idx + 1}`,
        date: nowStr,
        partnerName: partner.partnerName,
        rewardsCount: partner.rewardsCount,
        grossAmountTZS: partner.grossAmountTZS,
        platformFeeTZS: fee,
        netPaidTZS: partner.grossAmountTZS - fee,
        channel: partner.payoutMethod,
        status: 'COMPLETED',
      }
    })

    const newBalance = walletBalanceTZS - totalApprovedObligationsTZS
    setWalletBalanceTZS(newBalance)
    setFundingBalance((prev) => ({
      ...prev,
      availableBalanceTZS: newBalance,
      rewardsPaidTZS: prev.rewardsPaidTZS + totalApprovedObligationsTZS,
    }))

    setPayoutHistory((prev) => [...newRecords, ...prev])
    setOutstandingPartners([])
    setIsBulkSettleOpen(false)

    showToast('success', 'Batch Settlement Completed', `All ${totalApprovedRewardsCount} approved rewards totaling TZS ${totalApprovedObligationsTZS.toLocaleString()} have been disbursed.`)
  }

  // Execute Top Up
  const handleExecuteTopUp = () => {
    const added = Number(topUpAmount)
    const newBalance = walletBalanceTZS + added

    setWalletBalanceTZS(newBalance)
    setFundingBalance((prev) => ({
      ...prev,
      availableBalanceTZS: newBalance,
    }))

    showToast('success', 'Wallet Top-Up Completed', `Deposit of TZS ${added.toLocaleString()} received via ${topUpMethod.replace(/_/g, ' ')}. Funds are secured and ready for rewards.`)
    setShowTopUpModal(false)
  }

  // Format currency helpers for compact cards
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
        {/* CARD 1: WALLET BALANCE (Dark Forest Green / Slate Theme matching screenshot) */}
        <div className="p-5 rounded-3xl bg-[#0f231e] text-white shadow-md flex flex-col justify-between min-h-[120px] border border-emerald-950/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400/80 uppercase">
            WALLET BALANCE
          </span>
          <div className="my-1">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {formatCompactTZS(walletBalanceTZS)}
            </div>
            <p className="text-[11px] text-emerald-300/70 font-medium">
              available to settle rewards
            </p>
          </div>
        </div>

        {/* CARD 2: APPROVED OBLIGATIONS */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[120px]">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            APPROVED OBLIGATIONS
          </span>
          <div className="my-1">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {formatCompactTZS(totalApprovedObligationsTZS)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {totalApprovedRewardsCount} rewards
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
              {formatCompactTZS(totalSettledToDateTZS)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {totalPayoutRunsCount} payout runs
            </p>
          </div>
        </div>

        {/* CARD 4: PLATFORM FEE RATE */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[120px]">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            PLATFORM FEE RATE
          </span>
          <div className="my-1">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {platformConfig.platformFeePercent}%
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              on verified rewards
            </p>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS BAR MATCHING SCREENSHOT */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => setShowTopUpModal(true)}
          className="py-2.5 px-6 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-full shadow-xs transition-all active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Top up wallet</span>
        </button>

        <button
          type="button"
          onClick={() => setIsBulkSettleOpen(true)}
          disabled={outstandingPartners.length === 0}
          className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-full border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
        >
          Settle all approved rewards
        </button>
      </div>

      {/* SECTION 1: OUTSTANDING REWARDS BY PARTNER MATCHING SCREENSHOT */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Outstanding rewards by partner
          </h3>
        </div>

        {outstandingPartners.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-slate-800 dark:text-white">All Approved Obligations Settled</div>
            <p>There are no pending partner reward payouts at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[600px]">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-[10px] text-slate-400 font-mono uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-5 font-bold">PARTNER</th>
                  <th className="py-3 px-5 font-bold text-center">REWARDS</th>
                  <th className="py-3 px-5 font-bold text-right">GROSS</th>
                  <th className="py-3 px-5 font-bold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {outstandingPartners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {p.partnerName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.payoutMethod}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {p.rewardsCount}
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-black text-slate-900 dark:text-white">
                      TZS {p.grossAmountTZS.toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => setSettleModalPartner(p)}
                        className="py-1.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-full shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Settle</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: PAYOUT HISTORY MATCHING SCREENSHOT */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Payout history
          </h3>
          {payoutHistory.length > 0 && (
            <span className="text-[11px] text-slate-400 font-mono">{payoutHistory.length} completed payouts</span>
          )}
        </div>

        {payoutHistory.length === 0 ? (
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
                  <th className="py-3 px-5 font-bold">PARTNER</th>
                  <th className="py-3 px-5 font-bold text-center">REWARDS</th>
                  <th className="py-3 px-5 font-bold text-right">GROSS</th>
                  <th className="py-3 px-5 font-bold text-right">3% LUMO FEE</th>
                  <th className="py-3 px-5 font-bold text-right">NET PAID</th>
                  <th className="py-3 px-5 font-bold text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payoutHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-white">
                      {item.reference}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                      {item.date}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.partnerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">{item.channel}</div>
                    </td>
                    <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                      {item.rewardsCount}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      TZS {item.grossAmountTZS.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-400">
                      -TZS {item.platformFeeTZS.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-black text-emerald-600">
                      TZS {item.netPaidTZS.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
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

      {/* MODAL 1: TOP-UP WALLET */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Top Up Wallet
                  </h3>
                  <p className="text-xs text-slate-500">Deposit funds to settle partner rewards — all funds are secured.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method / Channel
                </label>
                <select
                  value={topUpMethod}
                  onChange={(e) => setTopUpMethod(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value="VODACOM_MPESA">Vodacom M-Pesa (Instant STK Push)</option>
                  <option value="TIGO_PESA">Tigo Pesa</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="CRDB_BANK">CRDB Bank Wire / Secure Transfer</option>
                </select>
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Deposit Amount (TZS)
                </label>
                <input
                  type="number"
                  min={50000}
                  step={50000}
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-black text-slate-900 dark:text-white text-sm"
                />

                {/* Quick Amount Pills */}
                <div className="flex gap-1.5 mt-2 overflow-x-auto">
                  {[1000000, 5000000, 10000000, 22000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                        topUpAmount === amt
                          ? 'bg-[#FF6A00] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {formatCompactTZS(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Business Mobile Number (for STK Prompt)
                </label>
                <input
                  type="text"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteTopUp}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Confirm Top-Up (TZS {topUpAmount.toLocaleString()})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SETTLE INDIVIDUAL PARTNER REWARD */}
      {settleModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Confirm Reward Settlement
                  </h3>
                  <p className="text-xs text-slate-500">Disburse approved funds to partner.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettleModalPartner(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Partner:</span>
                <strong className="text-slate-900 dark:text-white">{settleModalPartner.partnerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approved Rewards:</span>
                <span className="font-mono font-bold">{settleModalPartner.rewardsCount} verified completions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payout Destination:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{settleModalPartner.payoutMethod}</span>
              </div>
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Gross Reward:</span>
                  <span className="font-mono font-bold">TZS {settleModalPartner.grossAmountTZS.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>{platformConfig.platformFeePercent}% LUMO Platform Fee:</span>
                  <span className="font-mono">-TZS {Math.round(settleModalPartner.grossAmountTZS * feeRate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t text-sm font-black text-emerald-600 font-mono">
                  <span>Net Partner Disbursement:</span>
                  <span>TZS {(settleModalPartner.grossAmountTZS - Math.round(settleModalPartner.grossAmountTZS * feeRate)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSettleModalPartner(null)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteSingleSettle(settleModalPartner)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                <span>Authorize & Pay Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BULK SETTLE ALL APPROVED REWARDS */}
      {isBulkSettleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Settle All Approved Rewards
                  </h3>
                  <p className="text-xs text-slate-500">Disburse payments to all {outstandingPartners.length} partners.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkSettleOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Partners:</span>
                <strong className="text-slate-900 dark:text-white">{outstandingPartners.length} recipients</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Approved Rewards:</span>
                <span className="font-mono font-bold">{totalApprovedRewardsCount} completions</span>
              </div>
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Gross Obligations:</span>
                  <span className="font-mono font-bold">TZS {totalApprovedObligationsTZS.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Total {platformConfig.platformFeePercent}% Platform Fee:</span>
                  <span className="font-mono">-TZS {Math.round(totalApprovedObligationsTZS * feeRate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t text-sm font-black text-emerald-600 font-mono">
                  <span>Net Disbursed:</span>
                  <span>TZS {(totalApprovedObligationsTZS - Math.round(totalApprovedObligationsTZS * feeRate)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsBulkSettleOpen(false)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkSettle}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                <span>Authorize Batch Run</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
