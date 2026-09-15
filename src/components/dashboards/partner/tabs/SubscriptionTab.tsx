'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  AlertTriangle,
  RefreshCw,
  BellRing,
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
  useEffect(() => {
    setAutoRenew(subscription.autoRenew)
  }, [subscription.autoRenew])

  // Server-time authoritative delta calculation
  const serverOffset = useMemo(() => {
    if (!subscription.serverTimeISO) return 0
    const serverTimeMs = new Date(subscription.serverTimeISO).getTime()
    return isNaN(serverTimeMs) ? 0 : serverTimeMs - Date.now()
  }, [subscription.serverTimeISO])

  const targetExpiryMs = useMemo(() => {
    if (!subscription.expiresAtISO) return 0
    const expiryMs = new Date(subscription.expiresAtISO).getTime()
    return isNaN(expiryMs) ? 0 : expiryMs
  }, [subscription.expiresAtISO])

  const calculateTimeLeft = useCallback(() => {
    if (subscription.status === 'EXPIRED' || !targetExpiryMs) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 }
    }
    const authoritativeNow = Date.now() + serverOffset
    const diffMs = Math.max(0, targetExpiryMs - authoritativeNow)

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds, totalMs: diffMs }
  }, [subscription.status, targetExpiryMs, serverOffset])

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft)

  useEffect(() => {
    setTimeLeft(calculateTimeLeft())

    if (subscription.status === 'EXPIRED' || !targetExpiryMs) return

    const timer = setInterval(() => {
      const updated = calculateTimeLeft()
      setTimeLeft(updated)
      if (updated.totalMs === 0 && subscription.status === 'ACTIVE') {
        setSubscription((prev) => ({
          ...prev,
          status: 'EXPIRED',
          daysRemaining: 0,
        }))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [calculateTimeLeft, subscription.status, targetExpiryMs, setSubscription])

  const isProActive = subscription.status === 'ACTIVE' && timeLeft.totalMs > 0
  const isExpiringSoon = isProActive && timeLeft.totalMs <= 24 * 60 * 60 * 1000 // Less than 24h
  const isExpired = subscription.status === 'EXPIRED' || (!isProActive && subscription.daysRemaining === 0)

  const handleToggleAutoRenew = () => {
    const next = !autoRenew
    setAutoRenew(next)
    setSubscription((prev) => ({ ...prev, autoRenew: next }))
    showToast(
      'info',
      next ? 'Renewal Reminders Active' : 'Renewal Reminders Paused',
      next
        ? 'You will receive SMS and in-app alerts 24 hours prior to pass expiry.'
        : 'Renewal reminder notifications have been paused.'
    )
  }

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Partner Access Pass & Subscription
            </h2>
            {isProActive ? (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black tracking-wider uppercase shadow-xs">
                <Sparkles className="w-3 h-3 fill-white" />
                <span>PRO ACTIVE ({subscription.cycle})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-black tracking-wider uppercase border border-rose-200 dark:border-rose-800">
                <Lock className="w-3 h-3" />
                <span>{isExpired ? 'PASS EXPIRED' : 'INACTIVE'}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Your verified subscription pass unlocks full commercial deal terms, sales collateral kits, and deal joining access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-xl flex items-center gap-1.5 border ${
              isProActive
                ? isExpiringSoon
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 animate-pulse'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isProActive
                  ? isExpiringSoon
                    ? 'bg-amber-500'
                    : 'bg-emerald-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {isProActive
                ? isExpiringSoon
                  ? 'Expiring in < 24 Hours'
                  : 'Active & In Good Standing'
                : 'Access Pass Expired'}
            </span>
          </span>
        </div>
      </div>

      {/* Urgency Alert Banner if Expiring in < 24 Hours */}
      {isExpiringSoon && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300 dark:border-amber-700/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-900 dark:text-amber-200">
                Pass Expires Today — Renew to Avoid Disruption
              </h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/80">
                Your remaining time is under 24 hours. Renewing early carries forward your remaining hours with zero lost time.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToSubscriptions?.()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Renew Pass Now
          </button>
        </div>
      )}

      {/* Expired Alert Banner */}
      {isExpired && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-900 dark:text-rose-200">
                Commercial Access Pass Expired
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Your Access Pass has expired. Renew today to regain full deal-room access, marketing kits, and partner commissions. Your account history, wallet balance, and verified profile remain completely safe.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToSubscriptions?.()}
            className="px-5 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-black text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>RENEW ACCESS</span>
          </button>
        </div>
      )}

      {/* Plan Hero Card with High-Impact Gradient */}
      <div
        className={`p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-6 relative overflow-hidden ${
          isProActive
            ? 'bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0B132B]'
            : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700'
        }`}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#FF6A00] font-black uppercase text-[10px] tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProActive ? `${subscription.cycle} PRO PASS` : 'EXPIRED PASS'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              {subscription.planName || 'LUMO Partner Access Pass'}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {isProActive ? (
                <>
                  Active Coverage · Valid Until: <strong className="text-white font-mono">{subscription.expiryDate}</strong>
                </>
              ) : (
                <>No active billing period. Renew or choose a package below to unlock all commercial deals.</>
              )}
            </p>
          </div>

          <div className="text-left sm:text-right bg-white/5 sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-white/10 sm:border-transparent">
            <div className="text-2xl sm:text-3xl font-black font-mono text-[#FF6A00]">
              TZS {subscription.priceTZS ? subscription.priceTZS.toLocaleString() : '25,000'}
            </div>
            <span
              className={`text-[11px] font-bold flex items-center sm:justify-end gap-1 mt-0.5 ${
                isProActive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isProActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Unlimited Commercial Access</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Access Restricted (Expired)</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* 4 DIGITAL COUNTERS LIVE COUNTDOWN TIMER */}
        <div className="pt-2 pb-2 relative z-10">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>Time Remaining on Current Pass</span>
            </div>
            {isExpiringSoon && (
              <span className="text-amber-400 text-[10px] font-black uppercase tracking-wider">
                Expiring Soon
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-lg">
            {/* Days Box */}
            <div className="bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-3 sm:p-4 text-center shadow-inner">
              <div className={`text-2xl sm:text-4xl font-black font-mono ${isProActive ? 'text-[#FF6A00]' : 'text-slate-500'}`}>
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mt-1">
                Days
              </div>
            </div>

            {/* Hours Box */}
            <div className="bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-3 sm:p-4 text-center shadow-inner">
              <div className={`text-2xl sm:text-4xl font-black font-mono ${isProActive ? 'text-white' : 'text-slate-500'}`}>
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mt-1">
                Hours
              </div>
            </div>

            {/* Minutes Box */}
            <div className="bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-3 sm:p-4 text-center shadow-inner">
              <div className={`text-2xl sm:text-4xl font-black font-mono ${isProActive ? 'text-white' : 'text-slate-500'}`}>
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mt-1">
                Minutes
              </div>
            </div>

            {/* Seconds Box */}
            <div className="bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-3 sm:p-4 text-center shadow-inner">
              <div
                className={`text-2xl sm:text-4xl font-black font-mono ${
                  isProActive
                    ? isExpiringSoon
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
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
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isProActive ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>Unlimited Deal Enrolment</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isProActive ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>Marketing Video Kits</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isProActive ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>Direct B2B Deal Rooms</span>
          </div>
        </div>
      </div>

      {/* Package Selection Cards (For Unsubscribed, Expired, or Upgrading Partners) */}
      {!isProActive ? (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Choose a Membership Plan to Activate Your Pass
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant mobile money activation via Vodacom M-Pesa, Airtel Money, or Tigo Pesa.
              </p>
            </div>
            <button
              onClick={() => onNavigateToSubscriptions?.()}
              className="px-4 py-2 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>View All Subscription Plans</span>
            </button>
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
                  <span className="text-xs text-slate-500 font-bold">/ 1 Calendar Month</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pt-1">
                  Flexible month-to-month access to unlock and promote verified commercial deals with instant settlement.
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
                  <span className="text-xs text-slate-500 font-bold">/ 6 Months</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  Save TZS 50,000 compared to monthly payments
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
        /* Subscription Settings & Renewal Reminder for Active PRO */
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4 text-xs">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <BellRing className="w-4 h-4 text-[#FF6A00]" />
            <span>Pass Notifications & Renewal Alerts</span>
          </h3>

          <label className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs">
            <div className="space-y-0.5 pr-4">
              <span className="font-bold text-slate-900 dark:text-white block">Renewal Reminder</span>
              <span className="text-[11px] text-slate-500 leading-relaxed block">
                Receive SMS and in-app alerts 24 hours prior to pass expiry to renew seamlessly with your preferred mobile money network on {subscription.expiryDate}.
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={handleToggleAutoRenew}
              className="w-5 h-5 text-[#FF6A00] rounded focus:ring-[#FF6A00] cursor-pointer shrink-0"
            />
          </label>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">
              Need to extend early or switch from {subscription.cycle === 'MONTHLY' ? 'Monthly' : 'Semi-Annual'}? Early renewals automatically preserve 100% of your remaining days.
            </span>
            <button
              onClick={() => onNavigateToSubscriptions?.()}
              className="py-2 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
            >
              Extend / Switch Package
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
