'use client'

import React, { useState, useEffect } from 'react'
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
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { PartnerSubscriptionPlan } from '../types'
import { usePartnerToast } from '../PartnerToast'

interface SubscriptionTabProps {
  subscription: PartnerSubscriptionPlan
  setSubscription: React.Dispatch<React.SetStateAction<PartnerSubscriptionPlan>>
  onNavigateToSubscriptions?: () => void
}

export function SubscriptionTab({
  subscription,
  setSubscription,
  onNavigateToSubscriptions,
}: SubscriptionTabProps) {
  const { showToast } = usePartnerToast()

  const [autoRenew, setAutoRenew] = useState(subscription.autoRenew)
  const isProActive = subscription.status === 'ACTIVE' && subscription.daysRemaining > 0

  // Dynamic live countdown calculations based on real expiration or active state
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>(() => {
    if (!isProActive) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }
    return {
      days: subscription.daysRemaining,
      hours: 23,
      minutes: 59,
      seconds: 59,
    }
  })

  useEffect(() => {
    if (!isProActive) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isProActive, subscription.daysRemaining])

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
    <div className="space-y-6 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Partner Access Pass & Subscription
            </h2>
            {isProActive ? (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black tracking-wider uppercase shadow-xs animate-pulse">
                <Sparkles className="w-3 h-3 fill-white" />
                <span>PRO ACTIVE ({subscription.cycle})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-black tracking-wider uppercase border border-slate-200 dark:border-slate-700">
                <Lock className="w-3 h-3" />
                <span>INACTIVE</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Your verified subscription pass unlocks full commercial deal terms, sales collateral kits, and deal joining access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-extrabold px-3 py-1 rounded-xl flex items-center gap-1.5 border ${
            isProActive
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isProActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isProActive ? 'Active & In Good Standing' : 'No Active Pass'}</span>
          </span>
        </div>
      </div>

      {/* Plan Hero Card with High-Impact Gradient */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0B132B] text-white shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#FF6A00] font-black uppercase text-[10px] tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProActive ? `${subscription.cycle} PRO PASS` : 'LOCKED ACCESS'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              {subscription.planName}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {isProActive ? (
                <>Active Coverage · Expiry Date: <strong className="text-white font-mono">{subscription.expiryDate}</strong></>
              ) : (
                <>No active billing period. Choose a package below to unlock all opportunities.</>
              )}
            </p>
          </div>

          <div className="text-left sm:text-right bg-white/5 sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-white/10 sm:border-transparent">
            <div className="text-2xl sm:text-3xl font-black font-mono text-[#FF6A00]">
              TZS {subscription.priceTZS.toLocaleString()}
            </div>
            <span className={`text-[11px] font-bold flex items-center sm:justify-end gap-1 mt-0.5 ${
              isProActive ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              {isProActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Unlimited Commercial Access</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Subscription Required</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* 4 DIGITAL COUNTERS LIVE COUNTDOWN TIMER */}
        <div className="pt-2 pb-2 relative z-10">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Time Remaining on Current Cycle</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-lg">
            {/* Days Box */}
            <div className="bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-3 sm:p-4 text-center shadow-inner">
              <div className="text-2xl sm:text-4xl font-black font-mono text-[#FF6A00]">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mt-1">
                Days
              </div>
            </div>

            {/* Hours Box */}
            <div className="bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-3 sm:p-4 text-center shadow-inner">
              <div className="text-2xl sm:text-4xl font-black font-mono text-white">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mt-1">
                Hours
              </div>
            </div>

            {/* Minutes Box */}
            <div className="bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-3 sm:p-4 text-center shadow-inner">
              <div className="text-2xl sm:text-4xl font-black font-mono text-white">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mt-1">
                Minutes
              </div>
            </div>

            {/* Seconds Box */}
            <div className="bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-3 sm:p-4 text-center shadow-inner">
              <div className={`text-2xl sm:text-4xl font-black font-mono ${isProActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mt-1">
                Seconds
              </div>
            </div>
          </div>
        </div>

        {/* Feature Check List */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-700/80 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Unlimited Deal Enrolment</span>
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

      {/* Package Selection Cards (For Unsubscribed or Upgrading Partners) */}
      {!isProActive ? (
        <div className="space-y-4 pt-2">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Choose a Membership Plan to Activate Your Pass
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant mobile money activation via M-Pesa, Airtel Money, or Tigo Pesa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Package 1: Monthly Starter */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-4 hover:border-orange-300 transition-all shadow-xs">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 inline-block">
                  MONTHLY STARTER
                </span>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Monthly Access Pass
                </h4>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                    TZS 25,000
                  </span>
                  <span className="text-xs text-slate-500 font-bold">/ 30 days</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pt-1">
                  Flexible month-to-month access to unlock and promote verified commercial deals.
                </p>
              </div>

              <button
                onClick={() => onNavigateToSubscriptions?.()}
                className="w-full py-3 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Subscribe Monthly (TZS 25,000)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Package 2: Semi-Annual Pro (Best Value) */}
            <div className="p-6 rounded-3xl border-2 border-[#FF6A00] bg-orange-50/40 dark:bg-slate-800/60 flex flex-col justify-between space-y-4 shadow-sm relative">
              <div className="absolute -top-3 right-6 bg-[#FF6A00] text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>BEST VALUE</span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6A00] bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-orange-200 dark:border-slate-700 inline-block">
                  SEMI-ANNUAL PRO
                </span>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  6-Month Pro Access Pass
                </h4>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                    TZS 100,000
                  </span>
                  <span className="text-xs text-slate-500 font-bold">/ 180 days</span>
                </div>
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  ✓ Save TZS 50,000 compared to monthly payments
                </div>
              </div>

              <button
                onClick={() => onNavigateToSubscriptions?.()}
                className="w-full py-3 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Choose Semi-Annual Pro (TZS 100,000)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Subscription Settings & Auto-Renew for Active PRO */
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4 text-xs">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Access Pass Settings & Renewal
          </h3>

          <label className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Automatic Pass Renewal</span>
              <span className="text-[11px] text-slate-500">
                Automatically renew access via Vodacom M-Pesa or saved mobile payment method on {subscription.expiryDate}
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={handleToggleAutoRenew}
              className="w-5 h-5 text-[#FF6A00] rounded focus:ring-[#FF6A00] cursor-pointer"
            />
          </label>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">
              Need to switch from {subscription.cycle === 'MONTHLY' ? 'Monthly' : 'Semi-Annual'} to another plan?
            </span>
            <button
              onClick={() => onNavigateToSubscriptions?.()}
              className="py-2 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Upgrade / Change Package
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
