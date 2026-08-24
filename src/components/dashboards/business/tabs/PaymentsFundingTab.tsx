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

  const [ledgerEntries, setLedgerEntries] = useState<
    {
      id: string
      date: string
      type: string
      provider: string
      reference: string
      amountTZS: number
      status: string
    }[]
  >([])

  const handleExecuteDeposit = () => {
    const added = Number(depositAmount)
    setFundingBalance((prev) => ({
      ...prev,
      availableBalanceTZS: prev.availableBalanceTZS + added,
    }))

    const newTx = {
      id: `tx_fund_${Date.now()}`,
      date: 'Today, Just now',
      type: 'ESCROW_TOPUP',
      provider: `${paymentMethod.replace(/_/g, ' ')} Escrow Deposit`,
      reference: `LUMO-DEP-${Date.now().toString().slice(-6)}`,
      amountTZS: added,
      status: 'SETTLED',
    }

    setLedgerEntries([newTx, ...ledgerEntries])

    showToast(
      'success',
      'Escrow Top-Up Completed',
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFundModal(true)}
            className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Fund Escrow Balance</span>
          </button>
        </div>
      </div>

      {/* Escrow Safeguarding Guarantee */}
      <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <strong>Regulatory Escrow Safeguarding:</strong> Partner reward funds are held separately in a statutory trust escrow account. Unspent funds remain your property and can be refunded to your business account upon request.
        </div>
      </div>

      {/* 4 Balances Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Available Escrow Balance</span>
          <div className="text-xl sm:text-2xl font-black text-[#FF6A00] font-mono mt-1">
            TZS {fundingBalance.availableBalanceTZS.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Safeguarded & Ready to Commit</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Committed to Active Deals</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            TZS {fundingBalance.committedToActiveDealsTZS.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Locked for active partners</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Validations</span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-1">
            TZS {fundingBalance.pendingConfirmationTZS.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Under 7-day inspection period</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Rewards Paid Out</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-1">
            TZS {fundingBalance.rewardsPaidTZS.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Disbursed to partners</span>
        </div>
      </div>

      {/* Escrow Transaction Ledger */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Escrow Funding & Disbursement Ledger
        </h3>

        {ledgerEntries.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500">
            No funding transactions recorded yet. Click &quot;Fund Escrow Balance&quot; above to deposit reward budgets for your deals.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b">
                <tr>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Transaction Type</th>
                  <th className="p-3">Channel / Provider</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {ledgerEntries.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{tx.reference}</td>
                    <td className="p-3 text-slate-500">{tx.date}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 font-mono text-[10px] rounded">
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{tx.provider}</td>
                    <td
                      className={`p-3 font-mono font-bold ${
                        tx.amountTZS > 0 ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tx.amountTZS > 0 ? '+' : ''}TZS {tx.amountTZS.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fund Modal */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#FF6A00]" />
              <span>Top-Up Reward Escrow Balance</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="VODACOM_MPESA">Vodacom M-Pesa (Instant STK Push)</option>
                  <option value="TIGO_PESA">Tigo Pesa</option>
                  <option value="CRDB_BANK">CRDB Bank Wire / Escrow Transfer</option>
                </select>
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Deposit Amount (TZS)
                </label>
                <input
                  type="number"
                  min={100000}
                  step={50000}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Payer Mobile Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExecuteDeposit}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs cursor-pointer"
              >
                Initiate Escrow Top-Up
              </button>
              <button
                onClick={() => setShowFundModal(false)}
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
