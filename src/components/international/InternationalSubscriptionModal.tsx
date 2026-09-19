'use client'

import React, { useState } from 'react'
import {
  X,
  Sparkles,
  Check,
  Globe,
  CreditCard,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { InternationalPlanCode, InternationalSubscriptionPlan } from '@/modules/international/types'
import { SUPPORTED_CURRENCIES, formatCurrencyValue } from '@/modules/international/countries'

interface InternationalSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
  currentUserEmail?: string
  currentUserName?: string
  onSubscriptionSuccess?: () => void
}

const PLANS: InternationalSubscriptionPlan[] = [
  {
    code: 'INT_MONTHLY',
    name: 'Monthly Private Access',
    billingPeriodMonths: 1,
    basePriceUSD: 49,
    prices: {
      USD: 49,
      EUR: 45,
      GBP: 39,
      AED: 180,
      KES: 6500,
      TZS: 125000,
      ZAR: 890,
    },
    features: [
      'Full access to all verified global opportunities',
      'Direct connection & inquiry requests via LUMO Desk',
      'Access to cross-border buyer & seller dossiers',
      'WhatsApp direct alert for new matches',
    ],
  },
  {
    code: 'INT_SEMI_ANNUAL',
    name: 'Semi-Annual Private Access',
    billingPeriodMonths: 6,
    basePriceUSD: 249,
    prices: {
      USD: 249,
      EUR: 229,
      GBP: 199,
      AED: 915,
      KES: 32500,
      TZS: 640000,
      ZAR: 4500,
    },
    savingsDisplay: 'Save 15%',
    features: [
      'Everything in Monthly Access',
      'Priority coordination with international dealmakers',
      'Dedicated LUMO Cross-border Desk officer',
      'Custom deal sourcing request on demand',
    ],
  },
  {
    code: 'INT_ANNUAL',
    name: 'Annual Global VIP Access',
    billingPeriodMonths: 12,
    basePriceUSD: 449,
    prices: {
      USD: 449,
      EUR: 415,
      GBP: 355,
      AED: 1650,
      KES: 58500,
      TZS: 1150000,
      ZAR: 8100,
    },
    savingsDisplay: 'Best Value — Save 24%',
    features: [
      'Everything in Semi-Annual Access',
      'Direct escrow & commercial agreement assistance',
      'Unlimited international opportunity introductions',
      'VIP access to closed bilateral private syndicates',
    ],
  },
]

export function InternationalSubscriptionModal({
  isOpen,
  onClose,
  currentUserId,
  currentUserEmail,
  currentUserName,
  onSubscriptionSuccess,
}: InternationalSubscriptionModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [selectedPlanCode, setSelectedPlanCode] = useState<InternationalPlanCode>('INT_ANNUAL')
  const [guestEmail, setGuestEmail] = useState(currentUserEmail || '')
  const [guestName, setGuestName] = useState(currentUserName || '')
  const [guestPhone, setGuestPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const selectedPlan = PLANS.find((p) => p.code === selectedPlanCode) || PLANS[0]
  const planPrice = selectedPlan.prices[selectedCurrency] || selectedPlan.basePriceUSD

  const handleSubscribe = async () => {
    setErrorMsg(null)
    const email = (currentUserEmail || guestEmail).trim()
    const name = (currentUserName || guestName).trim()
    const userId = currentUserId || `user_${Date.now()}`

    if (!email) {
      setErrorMsg('Please enter your email to activate International Private Access.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/international/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail: email,
          userName: name || email.split('@')[0],
          userPhone: guestPhone,
          planCode: selectedPlanCode,
          currency: selectedCurrency,
          paymentMethod: 'ONLINE_CHECKOUT',
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to activate subscription.')
      }

      setSuccess(true)
      if (onSubscriptionSuccess) onSubscriptionSuccess()
    } catch (err: any) {
      setErrorMsg(err.message || 'Subscription processing failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0B1220] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                LUMO International Private Access
                <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] px-2 py-0.5 rounded-full font-bold">
                  Separate Entitlement
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unlock full commercial terms, direct buyer/seller dossiers, and verified introductions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {success ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-950/40 text-green-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                International Access Active!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Your account is now entitled to view all verified international opportunities, commercial terms, and submit direct connection inquiries.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#FF6A00] text-white text-xs font-bold rounded-xl hover:bg-[#EA580C] transition-all"
              >
                Explore International Marketplace
              </button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Currency Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#FF6A00]" />
                  Billing Currency:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['USD', 'EUR', 'GBP', 'AED', 'KES', 'TZS', 'ZAR'].map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setSelectedCurrency(curr)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        selectedCurrency === curr
                          ? 'bg-[#FF6A00] text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map((plan) => {
                  const isSelected = selectedPlanCode === plan.code
                  const price = plan.prices[selectedCurrency] || plan.basePriceUSD

                  return (
                    <div
                      key={plan.code}
                      onClick={() => setSelectedPlanCode(plan.code)}
                      className={`relative p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#FF6A00] bg-orange-50/30 dark:bg-orange-950/20 ring-2 ring-orange-500/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {plan.savingsDisplay && (
                        <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                          {plan.savingsDisplay}
                        </span>
                      )}

                      <div>
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {plan.name}
                        </div>
                        <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                          {formatCurrencyValue(price, selectedCurrency)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          billed every {plan.billingPeriodMonths === 1 ? 'month' : `${plan.billingPeriodMonths} months`}
                        </div>

                        <ul className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                          {plan.features.map((feat, i) => (
                            <li key={i} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-[#FF6A00] shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-5 pt-3">
                        <div
                          className={`w-full py-2 text-center text-xs font-bold rounded-xl transition-colors ${
                            isSelected
                              ? 'bg-[#FF6A00] text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Choose Plan'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Submitter Details (If not authenticated) */}
              {!currentUserEmail && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Member Information
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="email"
                      placeholder="Work / Personal Email *"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Secure 256-bit encryption • Cancel anytime
            </div>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="px-6 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading
                ? 'Activating...'
                : `Activate ${selectedPlan.name} • ${formatCurrencyValue(planPrice, selectedCurrency)}`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
