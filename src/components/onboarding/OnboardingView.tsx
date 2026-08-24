'use client'

import React, { useState } from 'react'
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from 'lucide-react'

interface OnboardingViewProps {
  onComplete: (role: 'PARTNER' | 'BUSINESS') => void
  onCancel: () => void
}

export function OnboardingView({ onComplete, onCancel }: OnboardingViewProps) {
  const [role, setRole] = useState<'PARTNER' | 'BUSINESS'>('PARTNER')
  const [step, setStep] = useState(1)

  // Partner Form State
  const [partnerName, setPartnerName] = useState('Alex Mushi')
  const [partnerPhone, setPartnerPhone] = useState('+255 712 345 678')
  const [partnerRegion, setPartnerRegion] = useState('Dar es Salaam')
  const [partnerType, setPartnerType] = useState('AFFILIATE_CREATOR')
  const [partnerChannels, setPartnerChannels] = useState('@alexmushi (Instagram & WhatsApp)')
  const [payoutMethod, setPayoutMethod] = useState('MPESA')

  // Business Form State
  const [bizLegalName, setBizLegalName] = useState('Kijani Solar Tech Ltd')
  const [bizTradingName, setBizTradingName] = useState('Kijani Solar')
  const [bizTin, setBizTin] = useState('114-882-901')
  const [bizCategory, setBizCategory] = useState('Renewable Energy')
  const [bizCity, setBizCity] = useState('Dar es Salaam')

  const handleFinish = () => {
    onComplete(role)
  }

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      {/* Role Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
        <button
          onClick={() => {
            setRole('PARTNER')
            setStep(1)
          }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            role === 'PARTNER'
              ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>I want to Earn as a Partner</span>
        </button>
        <button
          onClick={() => {
            setRole('BUSINESS')
            setStep(1)
          }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            role === 'BUSINESS'
              ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>I am a Business / Merchant</span>
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
          Step {step} of 2 · {role === 'PARTNER' ? 'Partner Onboarding' : 'Business Verification'}
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
          {role === 'PARTNER'
            ? step === 1
              ? 'Tell us about yourself & promotional channels'
              : 'Payout settlement & tax classification'
            : step === 1
            ? 'Company registration & trading details'
            : 'Tax Identification (TIN) & authorized rep'}
        </h2>
      </div>

      {/* Partner Flow Step 1 */}
      {role === 'PARTNER' && step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number (for M-Pesa / OTP)
              </label>
              <input
                type="text"
                value={partnerPhone}
                onChange={(e) => setPartnerPhone(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Region in Tanzania
              </label>
              <select
                value={partnerRegion}
                onChange={(e) => setPartnerRegion(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                <option value="Dar es Salaam">Dar es Salaam</option>
                <option value="Arusha">Arusha</option>
                <option value="Mwanza">Mwanza</option>
                <option value="Dodoma">Dodoma</option>
                <option value="Mbeya">Mbeya</option>
                <option value="Morogoro">Morogoro</option>
                <option value="Zanzibar">Zanzibar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Primary Channels & Audience
            </label>
            <input
              type="text"
              value={partnerChannels}
              onChange={(e) => setPartnerChannels(e.target.value)}
              placeholder="e.g. WhatsApp Status (1,500 contacts), Instagram @handle"
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      )}

      {/* Partner Flow Step 2 */}
      {role === 'PARTNER' && step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Instant Payout Method
            </label>
            <select
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
            >
              <option value="MPESA">Vodacom M-Pesa (Tanzania)</option>
              <option value="AIRTEL_MONEY">Airtel Money</option>
              <option value="TIGO_PESA">Tigo Pesa / Mixx</option>
              <option value="HALOPESA">Halopesa</option>
              <option value="CRDB_NMB">Bank Transfer (CRDB / NMB)</option>
            </select>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-0.5">Automated TRA Tax Compliance</strong>
              <span>
                LUMO automatically withholds statutory 5% TRA tax and generates monthly downloadable tax certificates for your earnings records.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Business Flow Step 1 */}
      {role === 'BUSINESS' && step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Legal Business Name (as registered with BRELA)
            </label>
            <input
              type="text"
              value={bizLegalName}
              onChange={(e) => setBizLegalName(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Trading Brand Name
              </label>
              <input
                type="text"
                value={bizTradingName}
                onChange={(e) => setBizTradingName(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Business Category
              </label>
              <select
                value={bizCategory}
                onChange={(e) => setBizCategory(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                <option value="Renewable Energy">Renewable Energy</option>
                <option value="Fintech & Payments">Fintech & Payments</option>
                <option value="Travel & Hospitality">Travel & Hospitality</option>
                <option value="Agriculture & FMCG">Agriculture & FMCG</option>
                <option value="Technology & Enterprise">Technology & Enterprise</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Business Flow Step 2 */}
      {role === 'BUSINESS' && step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              TRA Tax Identification Number (TIN)
            </label>
            <input
              type="text"
              value={bizTin}
              onChange={(e) => setBizTin(e.target.value)}
              placeholder="e.g. 114-882-901"
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-0.5">Commercial Integrity Verification</strong>
              <span>
                Verified businesses can publish deals, create custom Deal Rooms, and access our vetted network of performance partners across East Africa.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="py-2.5 px-4 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        )}

        {step < 2 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="py-2.5 px-6 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            Continue
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            Complete Registration & Enter Portal
          </button>
        )}
      </div>
    </div>
  )
}
