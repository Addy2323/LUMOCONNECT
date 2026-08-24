'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import {
  createSubscriptionCheckout,
  submitEnterpriseInquiry,
} from '@/modules/subscriptions/service'
import type { EnterpriseInquiryInput } from '@/modules/subscriptions/types'

interface SubscriptionsViewProps {
  currentUserId?: string
  returnTo?: string
  intent?: 'view' | 'join'
  reasonMessage?: string
  subscriptionStatus?: string
  onSubscriptionSuccess: (planCode: string, returnTo?: string) => void
  onNavigateHome: () => void
}

export function SubscriptionsView({
  currentUserId = 'alex_partner',
  returnTo,
  intent,
  reasonMessage = "Subscribe now to unlock this deal. You'll return automatically after payment.",
  onSubscriptionSuccess,
  onNavigateHome,
}: SubscriptionsViewProps) {
  // Checkout Modal State
  const [selectedPlanCode, setSelectedPlanCode] = useState<'MONTHLY' | 'SEMI_ANNUAL' | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'AIRTEL' | 'TIGO' | 'HALOPESA'>('MPESA')
  const [phoneNumber, setPhoneNumber] = useState('+255 712 345 678')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
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

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlanCode) return
    setIsProcessingPayment(true)

    try {
      const result = await createSubscriptionCheckout({
        userId: currentUserId,
        planCode: selectedPlanCode,
        paymentMethod,
        phoneNumber,
        returnTo,
        intent,
      })

      if (result.success) {
        setPaymentSuccessData({
          planName: result.planName,
          expiresAt: result.expiresAt,
        })
        setTimeout(() => {
          setSelectedPlanCode(null)
          onSubscriptionSuccess(selectedPlanCode, returnTo)
        }, 1500)
      }
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitEnterpriseInquiry(enterpriseForm, currentUserId)
    setEnterpriseSubmitted(true)
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-2 sm:py-6 px-3 sm:px-6 pb-24 md:pb-12">
      {/* Top Notification Alert Banner */}
      <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-[#FEF6EE] dark:bg-amber-950/40 border border-[#FEE4D2] dark:border-amber-800/60 flex items-center gap-3 shadow-2xs">
        <Lock className="w-4 h-4 text-[#FF6A00] shrink-0" />
        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
          {reasonMessage || "Subscribe now to unlock this deal. You'll return automatically after payment."}
        </p>
      </div>

      {/* Header Eyebrow & Title */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white dark:bg-slate-900 text-[#FF6A00] text-[11px] font-extrabold border border-[#FF6A00]/40 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
          <span>LUMO MEMBERSHIP PLANS</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0F172A] dark:text-white">
          Unlock Every LUMO Opportunity
        </h1>

        <p className="text-xs sm:text-sm lg:text-base text-[#64748B] dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Choose a plan and get unlimited access to verified deals, full opportunity details, deal participation, performance tracking and earning tools.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP / LAPTOP 3-COLUMN VIEW (hidden md:grid md:grid-cols-3)           */}
      {/* ========================================================================= */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-10">
        {/* DESKTOP CARD 1: MONTHLY */}
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all">
          <div>
            <h3 className="text-xl lg:text-2xl font-black text-[#0F172A] dark:text-white">
              Monthly
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1.5 leading-relaxed min-h-[36px]">
              Flexible access for individuals who want to discover and promote LUMO opportunities.
            </p>

            <div className="flex items-baseline gap-1.5 my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <span className="text-3xl lg:text-4xl font-black text-[#0F172A] dark:text-white font-mono">
                TZS 25,000
              </span>
              <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                /month
              </span>
            </div>

            <div className="space-y-3 mb-8">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                WHAT&apos;S INCLUDED
              </div>
              {[
                'Unlimited access to published deals',
                'Unlimited deal-detail viewing',
                'Join unlimited opportunities',
                'Access complete reward and commission terms',
                'Sales and promotional resources',
                'Performance and referral tracking',
                'Earnings dashboard',
                'Real-time deal notifications',
                'Standard customer support',
                'Cancel before the next billing period',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#0F172A] dark:text-slate-200">
                  <span className="text-[#FF6A00] font-black text-xs shrink-0 mt-0.5">✓</span>
                  <span className="leading-snug">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedPlanCode('MONTHLY')}
            className="w-full py-3.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs lg:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span>Subscribe Monthly</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* DESKTOP CARD 2: SEMI-ANNUAL (BEST VALUE) */}
        <div className="bg-white dark:bg-slate-900 border-2 border-[#FF6A00] rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-2xl relative scale-[1.02] z-10">
          {/* Best Value Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF6A00] text-white px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>BEST VALUE</span>
          </div>

          <div>
            <h3 className="text-xl lg:text-2xl font-black text-[#0F172A] dark:text-white">
              Semi-Annual
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1.5 leading-relaxed min-h-[36px]">
              Six months of uninterrupted access for active partners and opportunity professionals.
            </p>

            <div className="my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl lg:text-4xl font-black text-[#0F172A] dark:text-white font-mono">
                  TZS 100,000
                </span>
                <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                  /6 months
                </span>
              </div>
              <div className="text-[11px] font-semibold text-[#FF6A00] mt-1.5">
                Equivalent to approximately TZS 16,667 per month
              </div>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ✓ Save TZS 50,000 compared with monthly payments
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                WHAT&apos;S INCLUDED
              </div>
              {[
                'Everything in the Monthly plan',
                'Unlimited access for six months',
                'Join unlimited opportunities',
                'Advanced performance insights',
                'Priority opportunity notifications',
                'Priority customer support',
                'Early access to selected opportunities',
                'One payment every six months',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#0F172A] dark:text-slate-200">
                  <span className="text-[#FF6A00] font-black text-xs shrink-0 mt-0.5">✓</span>
                  <span className="leading-snug">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedPlanCode('SEMI_ANNUAL')}
            className="w-full py-3.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs lg:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span>Choose Semi-Annual</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* DESKTOP CARD 3: AI-POWERED ENTERPRISE */}
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all">
          <div>
            <h3 className="text-xl lg:text-2xl font-black text-[#0F172A] dark:text-white">
              AI-Powered Enterprise
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1.5 leading-relaxed min-h-[36px]">
              AI-powered opportunity intelligence and enterprise access for organizations and professional teams.
            </p>

            <div className="flex items-baseline justify-between my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-2xl lg:text-3xl font-black text-[#0F172A] dark:text-white">
                  Custom pricing
                </span>
              </div>
              <div className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                Annual agreement
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                WHAT&apos;S INCLUDED
              </div>
              {[
                'Everything in the Semi-Annual plan',
                'Unlimited enterprise deal access',
                'AI-powered opportunity recommendations',
                'AI deal-to-partner matching',
                'AI-generated sales insights',
                'AI-assisted promotional content',
                'Team member access',
                'Organization performance dashboard',
                'Advanced reporting and exports',
                'Dedicated account manager',
                'Priority onboarding',
                'API and business-system integration options',
                'Custom support and service agreement',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#0F172A] dark:text-slate-200">
                  <span className="text-[#FF6A00] font-black text-xs shrink-0 mt-0.5">✓</span>
                  <span className="leading-snug">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEnterpriseModal(true)}
            className="w-full py-3.5 px-4 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs lg:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span>Talk to Sales</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE STACKED VIEW (md:hidden - preserves exact mobile reference)        */}
      {/* ========================================================================= */}
      <div className="md:hidden space-y-4 mb-6">
        {/* 1. MOBILE MONTHLY */}
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 shadow-xs relative">
          <div className="grid grid-cols-1 gap-4 items-start mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#0F172A] dark:text-white">
                Monthly
              </h3>
              <div className="flex items-baseline gap-1.5 my-1.5">
                <span className="text-2xl font-black text-[#0F172A] dark:text-white font-mono">
                  TZS 25,000
                </span>
                <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                  / month
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Flexible access for individuals ready to discover and promote LUMO opportunities.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {[
                'Unlimited published deals',
                'Full deal details',
                'Join unlimited opportunities',
                'Rewards and commission terms',
                'Performance and earnings tracking',
                'Real-time notifications',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span className="w-4 h-4 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0 text-[10px] font-black">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedPlanCode('MONTHLY')}
            className="w-full py-3.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all text-center active:scale-[0.99]"
          >
            Subscribe Monthly
          </button>
        </div>

        {/* 2. MOBILE SEMI-ANNUAL (BEST VALUE) */}
        <div className="bg-white dark:bg-slate-900 border-2 border-[#FF6A00] rounded-3xl p-5 shadow-md relative pt-6">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF6A00] text-white px-4 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-xs flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>BEST VALUE</span>
          </div>

          <div className="grid grid-cols-1 gap-4 items-start mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#0F172A] dark:text-white">
                Semi-Annual
              </h3>
              <div className="flex items-baseline gap-1.5 my-1.5">
                <span className="text-2xl font-black text-[#0F172A] dark:text-white font-mono">
                  TZS 100,000
                </span>
                <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                  / 6 months
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
                About TZS 16,667 per month
              </div>
              <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 my-0.5">
                Save TZS 50,000
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed mt-1">
                Six months of uninterrupted access for active partners.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {[
                'Everything in Monthly',
                'Unlimited access for six months',
                'Advanced performance insights',
                'Priority opportunity alerts',
                'Priority support',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span className="w-4 h-4 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0 text-[10px] font-black">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedPlanCode('SEMI_ANNUAL')}
            className="w-full py-3.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all text-center active:scale-[0.99]"
          >
            Choose Semi-Annual
          </button>
        </div>

        {/* 3. MOBILE AI-POWERED ENTERPRISE */}
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-5 shadow-xs relative">
          <div className="grid grid-cols-1 gap-4 items-start mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#0F172A] dark:text-white">
                AI-Powered Enterprise
              </h3>
              <div className="flex items-baseline gap-1.5 my-1.5">
                <span className="text-2xl font-black text-[#0F172A] dark:text-white">
                  Custom pricing
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium mb-1">
                Annual agreement
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                AI-powered opportunity intelligence and enterprise access for professional teams.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {[
                'Everything in Semi-Annual',
                'Unlimited enterprise deal access',
                'AI opportunity recommendations',
                'AI deal-to-partner matching',
                'AI-generated sales insights',
                'Team access and advanced reporting',
                'Dedicated account manager',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span className="w-4 h-4 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0 text-[10px] font-black">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEnterpriseModal(true)}
            className="w-full py-3.5 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all text-center active:scale-[0.99]"
          >
            Talk to Sales
          </button>
        </div>
      </div>

      {/* BOTTOM COMPLIANCE INFO BOX */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800 flex items-start gap-3 text-xs text-[#64748B] dark:text-slate-400 shadow-2xs max-w-4xl mx-auto">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          All paid plans include unlimited deal access. Plan differences are based on duration, support and AI capabilities.
        </p>
      </div>

      {/* MOBILE MONEY CHECKOUT MODAL */}
      {selectedPlanCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setSelectedPlanCode(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {paymentSuccessData ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center animate-in zoom-in-95 duration-200">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-[#0F172A] dark:text-white">
                  Subscription Active!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You now have full unlimited access to all LUMO opportunities on the <strong>{paymentSuccessData.planName}</strong> plan.
                </p>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Returning to your opportunity workspace...
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecutePayment} className="space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#FF6A00] uppercase tracking-wider mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>LUMO SECURE CHECKOUT</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#0F172A] dark:text-white">
                    {selectedPlanCode === 'MONTHLY' ? 'Monthly' : 'Semi-Annual'} Plan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Amount: <strong className="font-mono text-slate-900 dark:text-white">{selectedPlanCode === 'MONTHLY' ? 'TZS 25,000' : 'TZS 100,000'}</strong>
                  </p>
                </div>

                {/* Mobile Money Provider Radio Group */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Select Mobile Money Provider
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'MPESA', name: 'M-Pesa', desc: 'Vodacom TZ' },
                      { id: 'AIRTEL', name: 'Airtel Money', desc: 'Airtel TZ' },
                      { id: 'TIGO', name: 'Tigo Pesa', desc: 'Tigo TZ' },
                      { id: 'HALOPESA', name: 'HaloPesa', desc: 'Halotel TZ' },
                    ].map((provider) => (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => setPaymentMethod(provider.id as any)}
                        className={`p-3 rounded-xl text-left border text-xs font-bold transition-all ${
                          paymentMethod === provider.id
                            ? 'border-[#FF6A00] bg-orange-50/60 dark:bg-orange-950/40 text-[#FF6A00] ring-2 ring-[#FF6A00]/20'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>{provider.name}</div>
                        <div className="text-[10px] font-normal text-slate-400">{provider.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone Number Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Money Phone Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+255 712 345 678"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-[#F0F5FA] font-mono text-[#0F172A] dark:text-white focus:bg-white"
                    />
                  </div>
                </div>

                {/* Submit Payment CTA */}
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full py-3.5 bg-[#FF6A00] hover:bg-[#EA580C] disabled:bg-slate-300 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {isProcessingPayment ? (
                    <span>Processing USSD Prompt...</span>
                  ) : (
                    <>
                      <span>Authorize Payment ({selectedPlanCode === 'MONTHLY' ? 'TZS 25,000' : 'TZS 100,000'})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ENTERPRISE SALES ENQUIRY MODAL */}
      {showEnterpriseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => {
                setShowEnterpriseModal(false)
                setEnterpriseSubmitted(false)
              }}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {enterpriseSubmitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-[#0F172A] dark:text-white">
                  Enterprise Enquiry Received!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{enterpriseForm.fullName}</strong>. Your enterprise inquiry for <strong>{enterpriseForm.businessName}</strong> has been logged. Our team will contact you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowEnterpriseModal(false)
                    setEnterpriseSubmitted(false)
                  }}
                  className="py-2.5 px-6 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnterpriseSubmit} className="space-y-3.5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#FF6A00] uppercase tracking-wider mb-1">
                    <Building2 className="w-4 h-4" />
                    <span>ENTERPRISE SOLUTIONS</span>
                  </div>
                  <h3 className="text-xl font-black text-[#0F172A] dark:text-white">
                    Talk to Enterprise Sales
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={enterpriseForm.fullName}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, fullName: e.target.value })}
                      placeholder="e.g. Grace Mlay"
                      className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      required
                      value={enterpriseForm.businessName}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, businessName: e.target.value })}
                      placeholder="e.g. Serengeti Corp"
                      className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={enterpriseForm.workEmail}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, workEmail: e.target.value })}
                      placeholder="grace@company.com"
                      className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={enterpriseForm.phoneNumber}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, phoneNumber: e.target.value })}
                      placeholder="+255 712 345 678"
                      className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Message / Business Goals
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={enterpriseForm.message}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, message: e.target.value })}
                    placeholder="Tell us about your team and scale requirements..."
                    className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEnterpriseModal(false)}
                    className="w-1/2 py-2.5 text-xs font-semibold border rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Enquiry</span>
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
