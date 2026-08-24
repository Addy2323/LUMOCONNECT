'use client'

import React, { useState } from 'react'
import {
  Award,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Clock,
  RotateCcw,
  DollarSign,
  Plus,
  ShieldCheck,
  X,
  History,
} from 'lucide-react'
import { MOCK_BUSINESS_REWARDS } from '../mockData'
import { BusinessRewardObligation, RewardLifecycleStatus } from '../types'
import { useBusinessToast } from '../BusinessToast'

export function RewardsCommissionsTab() {
  const { showToast } = useBusinessToast()

  const [rewards, setRewards] = useState<BusinessRewardObligation[]>(MOCK_BUSINESS_REWARDS)
  const [searchQuery, setSearchQuery] = useState('')
  const [adjustmentModal, setAdjustmentModal] = useState<BusinessRewardObligation | null>(null)
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0)

  const filtered = rewards.filter((r) => {
    const matchesSearch =
      r.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.conversionRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.opportunityTitle.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleApplyAdjustment = () => {
    if (!adjustmentModal || !adjustmentReason.trim()) {
      showToast('error', 'Validation Error', 'An audited adjustment reason is mandatory.')
      return
    }

    setRewards((prev) =>
      prev.map((r) => {
        if (r.id === adjustmentModal.id) {
          const updatedGross = r.grossRewardTZS + Number(adjustmentAmount)
          return {
            ...r,
            grossRewardTZS: updatedGross,
            adjustmentHistory: [
              ...(r.adjustmentHistory || []),
              {
                date: 'Today',
                reason: adjustmentReason,
                adjustedBy: 'Alex Mushi (Owner)',
                deltaTZS: Number(adjustmentAmount),
              },
            ],
          }
        }
        return r
      })
    )

    showToast(
      'info',
      'Reward Adjustment Recorded',
      `Adjustment of TZS ${Number(adjustmentAmount).toLocaleString()} recorded in statutory audit ledger.`
    )
    setAdjustmentModal(null)
    setAdjustmentReason('')
    setAdjustmentAmount(0)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Rewards, Commissions & Partner Obligations</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-2 py-0.5 rounded-full">
              Financial Workflow
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor calculated partner compensation. Approved rewards are locked and safeguarded in escrow.
          </p>
        </div>
      </div>

      {/* Lock Guarantee Banner */}
      <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <strong>Earned Reward Immutability Policy:</strong> Lifecycle: <code>Tracked → Pending → Validating → Approved → Payable → Paid</code>. After a reward reaches Approved status, it cannot be arbitrarily reduced or deleted. Corrections require dedicated adjustment records with audit justifications.
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search reward obligations by partner or reference..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        />
      </div>

      {/* Rewards Obligations Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[750px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b">
            <tr>
              <th className="p-3">Conversion Reference</th>
              <th className="p-3">Partner Beneficiary</th>
              <th className="p-3">Opportunity</th>
              <th className="p-3">Gross Reward</th>
              <th className="p-3">Settlement Due Date</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Audit Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filtered.map((rew) => (
              <tr key={rew.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                  {rew.conversionRef}
                </td>

                <td className="p-3 font-bold text-slate-900 dark:text-white">
                  {rew.partnerName}
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-300">
                  {rew.opportunityTitle}
                </td>

                <td className="p-3 font-mono font-black text-[#FF6A00]">
                  TZS {rew.grossRewardTZS.toLocaleString()}
                </td>

                <td className="p-3 text-[11px] text-slate-500">
                  {rew.dueDate}
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      rew.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-700'
                        : rew.status === 'APPROVED'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {rew.status}
                  </span>
                </td>

                <td className="p-3 text-right">
                  {rew.status !== 'PAID' && (
                    <button
                      onClick={() => setAdjustmentModal(rew)}
                      className="py-1 px-2.5 border rounded-lg text-xs font-bold hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center gap-1 ml-auto"
                    >
                      <History className="w-3.5 h-3.5 text-purple-600" />
                      <span>Adjust</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADJUSTMENT MODAL */}
      {adjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2 text-purple-600 font-bold">
                <History className="w-4 h-4" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Audited Reward Adjustment
                </h3>
              </div>
              <button onClick={() => setAdjustmentModal(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Partner:</span>
                  <span className="font-bold">{adjustmentModal.partnerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Reward:</span>
                  <span className="font-mono font-bold text-[#FF6A00]">
                    TZS {adjustmentModal.grossRewardTZS.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Adjustment Delta Amount (TZS +/-)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000 for bonus or -5000 for partial adjustment"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Mandatory Audit Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Additional performance milestone bonus awarded by commercial director..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleApplyAdjustment}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs"
              >
                Sign & Record Adjustment
              </button>
              <button onClick={() => setAdjustmentModal(null)} className="py-2.5 px-4 border rounded-xl text-xs font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
