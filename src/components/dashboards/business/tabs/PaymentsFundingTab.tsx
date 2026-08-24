'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import { RewardFundingBalance } from '../types'
import { useBusinessToast } from '../BusinessToast'

interface PaymentsFundingTabProps {
  fundingBalance: RewardFundingBalance
  setFundingBalance: React.Dispatch<React.SetStateAction<RewardFundingBalance>>
}

export function PaymentsFundingTab({
  fundingBalance,
  setFundingBalance,
}: PaymentsFundingTabProps) {
  const { showToast } = useBusinessToast()

  const [showFundModal, setShowFundModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState(1000000)
  const [paymentMethod, setPaymentMethod] = useState<'VODACOM_MPESA' | 'TIGO_PESA' | 'CRDB_BANK'>('VODACOM_MPESA')
  const [phoneNumber, setPhoneNumber] = useState('+255 754 000 111')

  const [ledgerEntries] = useState([
    {
      id: 'tx_fund_1',
      date: '20 Aug 2026',
      type: 'ESCROW_TOPUP',
      provider: 'Vodacom M-Pesa B2C Partner Gateway',
      reference: 'VOD-STK-99210042',
      amountTZS: 5000000,
      status: 'SETTLED',
    },
    {
      id: 'tx_fund_2',
      date: '15 Aug 2026',
      type: 'PARTNER_DISBURSEMENT',
      provider: 'LUMO Bulk Payout Settlement',
      reference: 'LUMO-DISB-2026-W07',
      amountTZS: -2450000,
      status: 'SETTLED',
    },
    {
      id: 'tx_fund_3',
      date: '01 Aug 2026',
      type: 'ESCROW_TOPUP',
      provider: 'CRDB Bank Wire Transfer',
      reference: 'CRDB-TX-88129001',
      amountTZS: 10000000,
      status: 'SETTLED',
    },
  ])

  const handleExecuteDeposit = () => {
    const added = Number(depositAmount)
    setFundingBalance((prev) => ({
      ...prev,
      availableBalanceTZS: prev.availableBalanceTZS + added,
    }))

    showToast(
      'success',
      'Escrow Top-Up Initiated',
      `Deposit of TZS ${added.toLocaleString()} received via ${paymentMethod.replace(/_/g, ' ')}. Funds safeguarded in escrow.`
    )
    setShowFundModal(false)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Reward Funding Balance & Escrow Ledger</span>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded-full">
              Ledger / Safeguarded Escrow
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deposit and fund commercial reward commitments. Escrow funds are safeguarded through licensed banking partners.
          </p>
        </div>

        <button
          onClick={() => setShowFundModal(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Fund Reward Escrow</span>
        </button>
      </div>

      {/* Safeguarding Legal Notice */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Statutory Escrow Safeguarding Guarantee:</strong> Reward funds are processed and safeguarded through LUMO’s licensed payment partner (<strong>{fundingBalance.safeguardingProvider}</strong>). Financial records are immutable double-entry ledger entries.
        </div>
      </div>

      {/* Reward Funding Balance Breakdown Grid (6 Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Available Balance</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            TZS {fundingBalance.availableBalanceTZS.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Uncommitted & Ready</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Committed to Active Deals</span>
          <div className="text-xl sm:text-2xl font-black text-purple-600 font-mono mt-1">
            TZS {fundingBalance.committedToActiveDealsTZS.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Reserved for live campaigns</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Confirmation</span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-1">
            TZS {fundingBalance.pendingConfirmationTZS.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Conversions under validation</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Rewards Payable (Due)</span>
          <div className="text-xl sm:text-2xl font-black text-[#FF6A00] font-mono mt-1">
            TZS {fundingBalance.rewardsPayableTZS.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Queued for Friday payout batch</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Rewards Paid Out</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-1">
            TZS {fundingBalance.rewardsPaidTZS.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Disbursed via Mobile Money</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Refundable Balance</span>
          <div className="text-xl sm:text-2xl font-black text-blue-600 font-mono mt-1">
            TZS {fundingBalance.refundableBalanceTZS.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Eligible for business withdrawal</span>
        </div>
      </div>

      {/* Financial Ledger Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Immutable Escrow Funding Ledger
          </h3>
          <span className="text-[10px] text-slate-400">
            Last reconciliation: {fundingBalance.lastReconciliationDate}
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Transaction Type</th>
                <th className="p-3">Provider Reference</th>
                <th className="p-3">Funding Provider</th>
                <th className="p-3">Amount</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {ledgerEntries.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3 text-slate-500 font-mono">{tx.date}</td>

                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {tx.type.replace(/_/g, ' ')}
                  </td>

                  <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {tx.reference}
                  </td>

                  <td className="p-3 text-slate-700 dark:text-slate-300">
                    {tx.provider}
                  </td>

                  <td className="p-3 font-mono font-bold">
                    <span className={tx.amountTZS > 0 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}>
                      {tx.amountTZS > 0 ? '+' : ''}TZS {Math.abs(tx.amountTZS).toLocaleString()}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FUND ESCROW MODAL */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#FF6A00]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Fund Reward Escrow Balance
                </h3>
              </div>
              <button onClick={() => setShowFundModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Deposit Amount (TZS)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Licensed Payment Partner Gateway</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value="VODACOM_MPESA">Vodacom M-Pesa STK Push</option>
                  <option value="TIGO_PESA">Tigo Pesa Merchant STK</option>
                  <option value="CRDB_BANK">CRDB Bank Host-to-Host Wire</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Mobile Money Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleExecuteDeposit}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Trigger STK Payment (TZS {depositAmount.toLocaleString()})
              </button>
              <button onClick={() => setShowFundModal(false)} className="py-2.5 px-4 border rounded-xl text-xs font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
