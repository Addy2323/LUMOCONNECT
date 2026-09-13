'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Zap,
  Building2,
  ShieldCheck,
  Lock,
  ArrowRight,
  Info,
  CheckCircle2,
  X,
  Send,
  Smartphone,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import {
  createSubscriptionCheckout,
  grantUserSubscription,
  submitEnterpriseInquiry,
  listSubscriptionPlans,
  getUserSubscription,
} from '@/modules/subscriptions/service'
import type { EnterpriseInquiryInput, SubscriptionPlanItem, SubscriptionPlanCode } from '@/modules/subscriptions/types'

interface SubscriptionsViewProps {
  currentUserId?: string
  returnTo?: string
  intent?: 'view' | 'join'
  reasonMessage?: string
  subscriptionStatus?: string
  onSubscriptionSuccess: (planCode: string, returnTo?: string) => void
  onNavigateHome: () => void
  onRequireAuth?: (intendedPlanCode?: string) => void
}

export function SubscriptionsView({
  currentUserId,
  returnTo,
  intent,
  reasonMessage = "Subscribe now to unlock this deal. You'll return automatically after payment.",
  onSubscriptionSuccess,
  onNavigateHome,
  onRequireAuth,
}: SubscriptionsViewProps) {
  // Live Plans from configuration
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(listSubscriptionPlans())

  const reloadPlans = () => {
    setPlans(listSubscriptionPlans())
  }

  useEffect(() => {
    reloadPlans()
    const handleUpdate = () => reloadPlans()
    window.addEventListener('lumo:plans-updated', handleUpdate)
    return () => window.removeEventListener('lumo:plans-updated', handleUpdate)
  }, [])

  // Checkout Modal State
  const [selectedPlanCode, setSelectedPlanCode] = useState<SubscriptionPlanCode | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'AIRTEL' | 'TIGO' | 'HALOPESA'>('MPESA')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'INITIATING' | 'WAITING_USSD' | 'ERROR'>('IDLE')
  const [paymentReference, setPaymentReference] = useState<string | null>(null)
  const [paymentInstructions, setPaymentInstructions] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [pollSecondsElapsed, setPollSecondsElapsed] = useState<number>(0)
  const [paymentSuccessData, setPaymentSuccessData] = useState<{ planName: string; expiresAt?: Date } | null>(null)

  // Enterprise Inquiry Modal State
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false)
  const [enterpriseForm, setEnterpriseForm] = useState<EnterpriseInquiryInput>({
    fullName: '',
    businessName: '',
    workEmail: '',
    phoneNumber: '+255',
    teamSize: '5-20 members',
    industry: 'Renewable Energy & Tech',
    expectedDealVolume: '10-50 deals/month',
    aiRequirements: 'AI-assisted promotional content and deal matching',
    message: '',
  })
  const [enterpriseSubmitted, setEnterpriseSubmitted] = useState(false)

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  const handleCloseModal = () => {
    stopPolling()
    setSelectedPlanCode(null)
    setPaymentStatus('IDLE')
    setIsProcessingPayment(false)
    setPaymentError(null)
    setPaymentReference(null)
    setPaymentInstructions(null)
    setPollSecondsElapsed(0)
  }

  const completeSuccessfulSubscription = (targetPlan: SubscriptionPlanItem) => {
    const days = targetPlan.code === 'SEMI_ANNUAL' ? 180 : targetPlan.code === 'ANNUAL' ? 365 : 30
    const updated = grantUserSubscription(
      currentUserId || 'guest_subscriber',
      targetPlan.code,
      days,
      targetPlan.priceTZS
    )

    setPaymentSuccessData({
      planName: targetPlan.name,
      expiresAt: updated.expiresAt,
    })
    setPaymentStatus('IDLE')
    setIsProcessingPayment(false)

    setTimeout(() => {
      handleCloseModal()
      onSubscriptionSuccess(targetPlan.code, returnTo)
    }, 2000)
  }

  const startPollingPaymentStatus = (reference: string, targetPlan: SubscriptionPlanItem) => {
    stopPolling()
    let elapsed = 0
    const maxSeconds = 90

    pollingIntervalRef.current = setInterval(async () => {
      elapsed += 3
      setPollSecondsElapsed(elapsed)

      if (elapsed > maxSeconds) {
        stopPolling()
        setIsProcessingPayment(false)
        setPaymentStatus('ERROR')
        setPaymentError('USSD prompt timed out. If you entered your PIN, click "Check Status Now" below.')
        return
      }

      try {
        const res = await fetch(`/api/payments/${encodeURIComponent(reference)}/status`)
        if (!res.ok) return
        const data = await res.json()
        if (!data.success || !data.data) return

        const status = data.data.status

        if (status === 'SUCCESSFUL') {
          stopPolling()
          completeSuccessfulSubscription(targetPlan)
        } else if (status === 'FAILED') {
          stopPolling()
          setIsProcessingPayment(false)
          setPaymentStatus('ERROR')
          setPaymentError('Payment was declined or cancelled on your mobile device.')
        }
      } catch (e) {
        console.warn('Status polling error', e)
      }
    }, 3000)
  }

  const handlePlanSelect = (planCode: SubscriptionPlanCode) => {
    if (!currentUserId) {
      if (onRequireAuth) {
        onRequireAuth(planCode)
      } else if (typeof window !== 'undefined') {
        window.location.href = '/choose-path'
      }
      return
    }
    setSelectedPlanCode(planCode)
  }

  const handleLivePayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedPlanCode) return

    if (!currentUserId) {
      handleCloseModal()
      if (onRequireAuth) {
        onRequireAuth(selectedPlanCode)
      } else if (typeof window !== 'undefined') {
        window.location.href = '/choose-path'
      }
      return
    }

    setPaymentError(null)

    const cleanedPhone = phoneNumber.trim().replace(/\s+/g, '')
    if (!cleanedPhone || cleanedPhone.length < 9) {
      setPaymentError('Please enter a valid Tanzanian mobile phone number (e.g. 07XXXXXXXX or 2557XXXXXXXX)')
      return
    }

    const currentPlan = plans.find((p) => p.code === selectedPlanCode) || monthlyPlan
    const amountTZS = currentPlan.priceTZS

    setIsProcessingPayment(true)
    setPaymentStatus('INITIATING')
    setPollSecondsElapsed(0)

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountTZS,
          phoneNumber: cleanedPhone,
          paymentMethod:
            paymentMethod === 'AIRTEL'
              ? 'AIRTEL_MONEY'
              : paymentMethod === 'TIGO'
              ? 'TIGO_PESA'
              : paymentMethod === 'HALOPESA'
              ? 'HALOPESA'
              : 'MPESA',
          orderId: `SUB-${Date.now()}-${(currentUserId || 'guest').slice(0, 8)}`,
          customerName: 'LUMO Subscriber',
          customerEmail: currentUserId ? `${currentUserId}@lumo.co.tz` : undefined,
          metadata: {
            planCode: selectedPlanCode,
            userId: currentUserId || 'guest_subscriber',
            planName: currentPlan.name,
            source: 'SUBSCRIPTION_CHECKOUT',
          },
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        const errorMsg = json.error || 'Failed to initiate payment with Snippe. Please check your phone number and balance.'
        setPaymentError(errorMsg)
        setPaymentStatus('ERROR')
        setIsProcessingPayment(false)
        return
      }

      const reference = json.data?.reference
      const instructions = json.data?.instructions || `A USSD push has been sent to ${cleanedPhone}. Please enter your PIN.`

      setPaymentReference(reference)
      setPaymentInstructions(instructions)
      setPaymentStatus('WAITING_USSD')

      // Start live polling status check
      startPollingPaymentStatus(reference, currentPlan)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error communicating with payment gateway'
      setPaymentError(msg)
      setPaymentStatus('ERROR')
      setIsProcessingPayment(false)
    }
  }

  const checkPaymentStatusManually = async () => {
    if (!paymentReference) return
    const currentPlan = plans.find((p) => p.code === selectedPlanCode) || monthlyPlan
    try {
      const res = await fetch(`/api/payments/${encodeURIComponent(paymentReference)}/status`)
      const data = await res.json()
      if (data.success && data.data?.status === 'SUCCESSFUL') {
        stopPolling()
        completeSuccessfulSubscription(currentPlan)
      } else if (data.data?.status === 'FAILED') {
        stopPolling()
        setIsProcessingPayment(false)
        setPaymentStatus('ERROR')
        setPaymentError('Payment was declined or cancelled on your handset.')
      }
    } catch (e) {
      console.warn('Manual status check failed', e)
    }
  }

  const handleEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitEnterpriseInquiry(enterpriseForm, currentUserId)
    setEnterpriseSubmitted(true)
  }

  const monthlyPlan = plans.find((p) => p.code === 'MONTHLY') || plans[0]
  const semiAnnualPlan = plans.find((p) => p.code === 'SEMI_ANNUAL') || plans[1]
  const enterprisePlan = plans.find((p) => p.code === 'ENTERPRISE') || plans[2]

  const activeUserSub = currentUserId ? getUserSubscription(currentUserId) : null
  const isUserProActive = Boolean(activeUserSub && activeUserSub.isActive && activeUserSub.status === 'ACTIVE')
  const [showUpgradePlans, setShowUpgradePlans] = useState(!isUserProActive)

  return (
    <div className="w-full max-w-7xl mx-auto py-2 sm:py-6 px-3 sm:px-6 pb-24 md:pb-12 space-y-6">
      {/* Top Banner: For PRO Users vs Non-Subscribers */}
      {isUserProActive && activeUserSub ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0B132B] text-white shadow-xl space-y-6 border border-amber-500/40 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider mb-2 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>ACTIVE PRO SUBSCRIBER</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {activeUserSub.planName} Pass Active
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                You have full, unrestricted access to all commercial deals, sales toolkits, video pitches, and performance links.
              </p>
            </div>

            <div className="bg-white/10 dark:bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-left sm:text-right">
              <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                Cycle Expiry
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#FF6A00]">
                {activeUserSub.daysRemaining} Days Remaining
              </div>
              <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                ● Status: Active & In Good Standing
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-700/80">
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto py-3 px-6 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore All 7 Unlocked Deals</span>
            </button>

            <button
              onClick={() => setShowUpgradePlans(!showUpgradePlans)}
              className="w-full sm:w-auto py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all text-center cursor-pointer"
            >
              {showUpgradePlans ? 'Hide Plan Options' : 'Upgrade or Extend Pass'}
            </button>
          </div>
        </div>
      ) : (
        /* Non-Subscriber Warning Banner */
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FEF6EE] dark:bg-amber-950/40 border border-[#FEE4D2] dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-[#FF6A00] shrink-0" />
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
              {!currentUserId
                ? 'Create an account or sign in to subscribe and unlock all deals.'
                : (reasonMessage || "Subscribe now to unlock this deal. You'll return automatically after payment.")}
            </p>
          </div>
          {!currentUserId && (
            <button
              type="button"
              onClick={() => (onRequireAuth ? onRequireAuth() : (typeof window !== 'undefined' && (window.location.href = '/choose-path')))}
              className="py-1.5 px-3.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-bold text-xs rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer shrink-0"
            >
              Create Account
            </button>
          )}
        </div>
      )}

      {/* Header Eyebrow & Title */}
      {(showUpgradePlans || !isUserProActive) && (
        <>
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white dark:bg-slate-900 text-[#FF6A00] text-[11px] font-extrabold border border-[#FF6A00]/40 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>LUMO MEMBERSHIP PLANS</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0F172A] dark:text-white">
              {isUserProActive ? 'Upgrade or Extend Your Pass' : 'Unlock Every LUMO Opportunity'}
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-[#64748B] dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Choose a plan and get unlimited access to verified deals, full opportunity details, deal participation, performance tracking and earning tools.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* DESKTOP / LAPTOP 3-COLUMN VIEW (hidden lg:grid lg:grid-cols-3)           */}
          {/* ========================================================================= */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-10">
        {/* DESKTOP CARD 1: MONTHLY */}
        {monthlyPlan && (
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all">
            <div>
              <h3 className="text-xl lg:text-2xl font-black text-[#0F172A] dark:text-white">
                {monthlyPlan.name}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1.5 leading-relaxed min-h-[36px]">
                {monthlyPlan.description}
              </p>

              <div className="flex items-baseline gap-1.5 my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <span className="text-3xl lg:text-4xl font-black text-[#0F172A] dark:text-white font-mono">
                  {monthlyPlan.priceDisplay}
                </span>
                <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                  {monthlyPlan.periodDisplay}
                </span>
              </div>

              <div className="space-y-3 mb-8">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                  WHAT&apos;S INCLUDED
                </div>
                {monthlyPlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#0F172A] dark:text-slate-200">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF6A00]" aria-hidden="true" />
                    <span className="leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handlePlanSelect('MONTHLY')}
              className="w-full py-3.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs lg:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
            >
              <span>{currentUserId ? (monthlyPlan.ctaLabel || 'Subscribe Monthly') : 'Create Account & Subscribe'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* DESKTOP CARD 2: SEMI-ANNUAL (BEST VALUE) */}
        {semiAnnualPlan && (
          <div className="bg-white dark:bg-slate-900 border-2 border-[#FF6A00] rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-2xl relative scale-[1.02] z-10">
            {/* Best Value Badge */}
            {semiAnnualPlan.isBestValue && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF6A00] text-white px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>BEST VALUE</span>
              </div>
            )}

            <div>
              <h3 className="text-xl lg:text-2xl font-black text-[#0F172A] dark:text-white">
                {semiAnnualPlan.name}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1.5 leading-relaxed min-h-[36px]">
                {semiAnnualPlan.description}
              </p>

              <div className="my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl lg:text-4xl font-black text-[#0F172A] dark:text-white font-mono">
                    {semiAnnualPlan.priceDisplay}
                  </span>
                  <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                    {semiAnnualPlan.periodDisplay}
                  </span>
                </div>
                {semiAnnualPlan.equivalentMonthlyDisplay && (
                  <div className="text-[11px] font-semibold text-[#FF6A00] mt-1.5">
                    {semiAnnualPlan.equivalentMonthlyDisplay}
                  </div>
                )}
                {semiAnnualPlan.savingsDisplay && (
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    {semiAnnualPlan.savingsDisplay}
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-8">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                  WHAT&apos;S INCLUDED
                </div>
                {semiAnnualPlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#0F172A] dark:text-slate-200">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF6A00]" aria-hidden="true" />
                    <span className="leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handlePlanSelect('SEMI_ANNUAL')}
              className="w-full py-3.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs lg:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
            >
              <span>{currentUserId ? (semiAnnualPlan.ctaLabel || 'Choose Semi-Annual') : 'Create Account & Subscribe'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* DESKTOP CARD 3: AI-POWERED ENTERPRISE */}
        {enterprisePlan && (
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all">
            <div>
              <h3 className="text-xl lg:text-2xl font-black text-[#0F172A] dark:text-white">
                {enterprisePlan.name}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1.5 leading-relaxed min-h-[36px]">
                {enterprisePlan.description}
              </p>

              <div className="flex items-baseline justify-between my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-2xl lg:text-3xl font-black text-[#0F172A] dark:text-white">
                    {enterprisePlan.priceDisplay}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                  {enterprisePlan.periodDisplay}
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                  WHAT&apos;S INCLUDED
                </div>
                {enterprisePlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#0F172A] dark:text-slate-200">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF6A00]" aria-hidden="true" />
                    <span className="leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowEnterpriseModal(true)}
              className="w-full py-3.5 px-4 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs lg:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
            >
              <span>{enterprisePlan.ctaLabel || 'Talk to Sales'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MOBILE & TABLET RESPONSIVE VIEW (lg:hidden)                               */}
      {/* ========================================================================= */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 1. MOBILE MONTHLY */}
        {monthlyPlan && (
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 shadow-xs relative">
            <div className="grid grid-cols-1 gap-4 items-start mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#0F172A] dark:text-white">
                  {monthlyPlan.name}
                </h3>
                <div className="flex items-baseline gap-1.5 my-1.5">
                  <span className="text-2xl font-black text-[#0F172A] dark:text-white font-mono">
                    {monthlyPlan.priceDisplay}
                  </span>
                  <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                    {monthlyPlan.periodDisplay}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                  {monthlyPlan.description}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {monthlyPlan.features.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span className="w-4 h-4 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handlePlanSelect('MONTHLY')}
              className="w-full py-3.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all text-center active:scale-[0.99] cursor-pointer"
            >
              {currentUserId ? (monthlyPlan.ctaLabel || 'Subscribe Monthly') : 'Create Account & Subscribe'}
            </button>
          </div>
        )}

        {/* 2. MOBILE SEMI-ANNUAL (BEST VALUE) */}
        {semiAnnualPlan && (
          <div className="bg-white dark:bg-slate-900 border-2 border-[#FF6A00] rounded-3xl p-5 shadow-md relative pt-6">
            {semiAnnualPlan.isBestValue && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF6A00] text-white px-4 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-xs flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>BEST VALUE</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 items-start mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#0F172A] dark:text-white">
                  {semiAnnualPlan.name}
                </h3>
                <div className="flex items-baseline gap-1.5 my-1.5">
                  <span className="text-2xl font-black text-[#0F172A] dark:text-white font-mono">
                    {semiAnnualPlan.priceDisplay}
                  </span>
                  <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                    {semiAnnualPlan.periodDisplay}
                  </span>
                </div>
                {semiAnnualPlan.equivalentMonthlyDisplay && (
                  <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
                    {semiAnnualPlan.equivalentMonthlyDisplay}
                  </div>
                )}
                {semiAnnualPlan.savingsDisplay && (
                  <div className="my-0.5 flex items-center gap-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {semiAnnualPlan.savingsDisplay}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-1">
                {semiAnnualPlan.features.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span className="w-4 h-4 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handlePlanSelect('SEMI_ANNUAL')}
              className="w-full py-3.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all text-center active:scale-[0.99] cursor-pointer"
            >
              {currentUserId ? (semiAnnualPlan.ctaLabel || 'Choose Semi-Annual') : 'Create Account & Subscribe'}
            </button>
          </div>
        )}

        {/* 3. MOBILE AI-POWERED ENTERPRISE */}
        {enterprisePlan && (
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 shadow-xs relative">
            <div className="grid grid-cols-1 gap-4 items-start mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#0F172A] dark:text-white">
                  {enterprisePlan.name}
                </h3>
                <div className="flex items-baseline gap-1.5 my-1.5">
                  <span className="text-2xl font-black text-[#0F172A] dark:text-white">
                    {enterprisePlan.priceDisplay}
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium mb-1">
                  {enterprisePlan.periodDisplay}
                </div>
                <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                  {enterprisePlan.description}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {enterprisePlan.features.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span className="w-4 h-4 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowEnterpriseModal(true)}
              className="w-full py-3.5 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all text-center active:scale-[0.99] cursor-pointer"
            >
              {enterprisePlan.ctaLabel || 'Talk to Sales'}
            </button>
          </div>
        )}
      </div>
    </>
  )}

      {/* ========================================================================= */}
      {/* CHECKOUT MODAL: INSTANT MOBILE MONEY POPUP (M-PESA / AIRTEL / TIGO)       */}
      {/* ========================================================================= */}
      {selectedPlanCode && (() => {
        const activePlan = plans.find((p) => p.code === selectedPlanCode) || monthlyPlan
        const providerTitle =
          paymentMethod === 'MPESA'
            ? 'Vodacom M-Pesa'
            : paymentMethod === 'AIRTEL'
            ? 'Airtel Money'
            : paymentMethod === 'TIGO'
            ? 'Tigo Pesa'
            : 'HaloPesa'

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF6A00]" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Confirm Subscription
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {paymentSuccessData ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    Payment Successful!
                  </h4>
                  <p className="text-xs text-slate-500">
                    You are now subscribed to <strong>{paymentSuccessData.planName}</strong>.
                  </p>
                  <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200">
                    Redirecting you back to your commercial opportunities...
                  </div>
                </div>
              ) : paymentStatus === 'INITIATING' ? (
                <div className="py-10 space-y-4 text-center">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-[#FF6A00]/20 border-t-[#FF6A00] animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Connecting to Snippe Payment Switch...
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Requesting mobile money authorization for{' '}
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{phoneNumber}</span>...
                    </p>
                  </div>
                </div>
              ) : paymentStatus === 'WAITING_USSD' ? (
                <div className="py-6 space-y-5 text-center">
                  <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-orange-100 dark:bg-orange-950/40 animate-ping opacity-75" />
                    <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF6A00] to-amber-500 flex items-center justify-center text-white shadow-lg">
                      <Smartphone className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-[#FF6A00] font-mono text-[11px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#FF6A00] animate-pulse" />
                      USSD Push Dispatched
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Authorize Payment on Your Handset
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                      A prompt has been sent to{' '}
                      <strong className="font-mono text-slate-900 dark:text-white">{phoneNumber}</strong> ({providerTitle}).
                      Please enter your {providerTitle} PIN to approve{' '}
                      <strong className="text-[#FF6A00]">{activePlan.priceDisplay}</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Snippe Gateway Ref:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {paymentReference || 'Pending...'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Gateway Verification:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
                        Listening for PIN confirmation ({pollSecondsElapsed}s)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={checkPaymentStatusManually}
                      className="flex-1 py-2.5 px-3 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>I Have Entered My PIN</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : paymentStatus === 'ERROR' ? (
                <div className="py-6 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      Payment Initiation / Authorization Failed
                    </h4>
                    <p className="text-xs text-red-600 dark:text-red-400 max-w-sm mx-auto leading-relaxed">
                      {paymentError || 'The transaction could not be completed. Please verify your phone number and balance.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentStatus('IDLE')
                        setPaymentError(null)
                      }}
                      className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Try Again / Change Phone
                    </button>

                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLivePayment} className="space-y-4 text-xs">
                  <div className="p-3.5 bg-orange-50/50 dark:bg-slate-800 rounded-2xl border border-orange-200/60 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white block">
                        {activePlan.name}
                      </span>
                      <span className="text-[10px] text-slate-500">Instant Activation via Snippe</span>
                    </div>
                    <span className="text-base font-black font-mono text-[#FF6A00]">
                      {activePlan.priceDisplay}
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Select Mobile Money Provider
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['MPESA', 'AIRTEL', 'TIGO', 'HALOPESA'] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            paymentMethod === method
                              ? 'border-[#FF6A00] bg-orange-50 dark:bg-slate-800 text-[#FF6A00] ring-1 ring-[#FF6A00]'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {method === 'MPESA'
                            ? 'Vodacom M-Pesa'
                            : method === 'AIRTEL'
                            ? 'Airtel Money'
                            : method === 'TIGO'
                            ? 'Tigo Pesa'
                            : 'HaloPesa'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Money Phone Number (Tanzania)
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="07XX XXX XXX or 2557..."
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Direct USSD push to Vodacom M-Pesa, Airtel Money, Tigo Pesa & HaloPesa.
                    </p>
                  </div>

                  {paymentError && (
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={isProcessingPayment}
                      className="w-full py-3 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Smartphone className="h-4 w-4" aria-hidden="true" />
                      <span>Pay {activePlan.priceDisplay} with {providerTitle}</span>
                    </button>

                    <p className="text-[10px] text-center text-slate-400">
                      🔒 Secured by Snippe Payment Gateway · Instant USSD PIN prompt sent to your phone.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        )
      })()}

      {/* ========================================================================= */}
      {/* ENTERPRISE INQUIRY MODAL                                                  */}
      {/* ========================================================================= */}
      {showEnterpriseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#FF6A00]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Enterprise AI & Custom API Inquiry
                </h3>
              </div>
              <button
                onClick={() => setShowEnterpriseModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enterpriseSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Inquiry Submitted!
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Our enterprise onboarding team will reach out to you within 2 business hours.
                </p>
                <button
                  onClick={() => setShowEnterpriseModal(false)}
                  className="py-2 px-4 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnterpriseSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={enterpriseForm.fullName}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, fullName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Organization / Company</label>
                    <input
                      type="text"
                      required
                      value={enterpriseForm.businessName}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, businessName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Work Email</label>
                    <input
                      type="email"
                      required
                      value={enterpriseForm.workEmail}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, workEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Custom Requirements or Message</label>
                  <textarea
                    rows={3}
                    value={enterpriseForm.message}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, message: e.target.value })}
                    placeholder="Tell us about your team size, expected deal volume, or API integration requirements..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEnterpriseModal(false)}
                    className="py-2 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs shadow-xs"
                  >
                    Send Enterprise Inquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
