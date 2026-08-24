'use client'

import React, { useState } from 'react'
import {
  CreditCard,
  CheckCircle2,
  Calendar,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  Download,
  Lock,
} from 'lucide-react'
import { PartnerSubscriptionPlan } from '../types'
import { usePartnerToast } from '../PartnerToast'

interface SubscriptionTabProps {
  subscription: PartnerSubscriptionPlan
  setSubscription: React.Dispatch<React.SetStateAction<PartnerSubscriptionPlan>>
}

export function SubscriptionTab({
  subscription,
  setSubscription,
}: SubscriptionTabProps) {
  const { showToast } = usePartnerToast()

  const [autoRenew, setAutoRenew] = useState(subscription.autoRenew)

  const handleToggleAutoRenew = () => {
    const next = !autoRenew
    setAutoRenew(next)
    setSubscription((prev) => ({ ...prev, autoRenew: next }))
    showToast(
      'info',
      next ? 'Auto-Renewal Enabled' : 'Auto-Renewal Paused',
      next ? 'Your pass will renew automatically upon expiry.' : 'Auto-renewal is paused. You will retain full access until expiry.'
    )
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Partner Access Pass & Subscription</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
              Payment Workflow
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your verified subscription pass unlocks full commercial deal terms, sales collateral kits, and deal joining access.
          </p>
        </div>
      </div>

      {/* Plan Hero Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0B132B] to-[#1C2541] text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] bg-[#FF6A00] font-black uppercase px-2.5 py-0.5 rounded-full">
              {subscription.cycle} Pass
            </span>
            <h3 className="text-xl sm:text-2xl font-black mt-2">
              {subscription.planName}
            </h3>
            <p className="text-xs text-slate-300">
              Expires: {subscription.expiryDate} ({subscription.daysRemaining} days remaining)
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black font-mono text-[#FF6A00]">
              TZS {subscription.priceTZS.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">✓ Active & Good Standing</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-700 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Unlimited Deal Joining</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Marketing Video Kits</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Direct B2B Deal Rooms</span>
          </div>
        </div>
      </div>

      {/* Subscription Settings */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3 text-xs">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Access Pass Settings & Renewal
        </h3>

        <label className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-2xl border cursor-pointer">
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">Automatic Pass Renewal</span>
            <span className="text-[10px] text-slate-400">
              Automatically renew access via Vodacom M-Pesa or saved payment method on {subscription.expiryDate}
            </span>
          </div>
          <input
            type="checkbox"
            checked={autoRenew}
            onChange={handleToggleAutoRenew}
            className="w-4 h-4 text-[#FF6A00] rounded"
          />
        </label>
      </div>
    </div>
  )
}
