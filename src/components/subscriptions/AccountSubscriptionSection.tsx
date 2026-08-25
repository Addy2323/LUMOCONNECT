'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Download,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { getUserSubscription, cancelSubscriptionRenewal } from '@/modules/subscriptions/service'
import type { UserSubscriptionItem } from '@/modules/subscriptions/types'

interface AccountSubscriptionSectionProps {
  userId: string
  onUpgrade: () => void
  onRenew: () => void
}

export function AccountSubscriptionSection({
  userId,
  onUpgrade,
  onRenew,
}: AccountSubscriptionSectionProps) {
  const [subscription, setSubscription] = useState<UserSubscriptionItem | null>(() =>
    getUserSubscription(userId)
  )
  const [cancelMessage, setCancelMessage] = useState<string | null>(null)

  const handleCancelAutoRenew = () => {
    const res = cancelSubscriptionRenewal(userId)
    if (res.success) {
      setSubscription(getUserSubscription(userId))
      setCancelMessage(res.message)
    }
  }

  const handleDownloadReceipt = () => {
    window.print()
  }

  if (!subscription || !subscription.isActive) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>MEMBERSHIP & ACCESS</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              No Active Subscription
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Subscribe to unlock full deal deliverables, confidential reward terms, and partner earning links.
            </p>
          </div>

          <button
            onClick={onRenew}
            className="py-3 px-5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <span>Explore Plans & Subscribe</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Top Banner with Active Member Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active Member</span>
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              {subscription.planName} Plan
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white">
            LUMO Opportunity Membership
          </h3>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
            Unlimited access to all verified commercial deals and performance tracking tools.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onUpgrade}
            className="py-2.5 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Upgrade / Change</span>
          </button>

          <button
            onClick={onRenew}
            className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Renew Plan</span>
          </button>
        </div>
      </div>

      {/* Subscription Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>DAYS REMAINING</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white font-mono">
            {subscription.daysRemaining} days
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Valid until {subscription.expiresAt.toLocaleDateString()}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>BILLING PERIOD</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
            {subscription.planCode === 'MONTHLY' ? 'Every 30 Days' : 'Every 6 Months'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Started on {subscription.startsAt.toLocaleDateString()}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
            <span>AUTO-RENEWAL</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
            {subscription.autoRenew ? (
              <span className="text-emerald-600 dark:text-emerald-400">Enabled</span>
            ) : (
              <span className="text-slate-400">Cancelled</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Mobile Money Auto-Deduct
          </p>
        </div>
      </div>

      {/* Cancellation Notice if Triggered */}
      {cancelMessage && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{cancelMessage}</span>
        </div>
      )}

      {/* Payment & Invoices History Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
            Billing History & Receipts
          </h4>
          <button
            onClick={handleDownloadReceipt}
            className="text-xs font-bold text-[#FF6A00] hover:text-[#EA580C] flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Receipts</span>
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
          <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-800/80 p-3 font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
            <div className="col-span-4">Description</div>
            <div className="col-span-3">Date</div>
            <div className="col-span-3">Amount</div>
            <div className="col-span-2 text-right">Receipt</div>
          </div>

          <div className="grid grid-cols-12 p-3 items-center text-slate-800 dark:text-slate-200">
            <div className="col-span-4 font-semibold truncate">
              {subscription.planName} Plan ({subscription.planCode})
            </div>
            <div className="col-span-3 text-slate-500">
              {subscription.startsAt.toLocaleDateString()}
            </div>
            <div className="col-span-3 font-mono font-bold">
              TZS {(subscription.amountPaidTZS || 100000).toLocaleString()}
            </div>
            <div className="col-span-2 text-right">
              <button
                onClick={handleDownloadReceipt}
                className="p-1 rounded-md text-[#FF6A00] hover:bg-orange-50 dark:hover:bg-orange-950/40"
                title="Download Receipt"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Settings Actions */}
      {subscription.autoRenew && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleCancelAutoRenew}
            className="text-xs text-slate-400 hover:text-rose-600 font-semibold transition-colors"
          >
            Cancel Subscription Auto-Renewal
          </button>
        </div>
      )}
    </div>
  )
}
