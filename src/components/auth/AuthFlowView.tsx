'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Users,
  Building2,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  Smartphone,
  Laptop,
  AlertCircle,
  Upload,
  Check,
} from 'lucide-react'
import type { UserRole, VerificationStatus, PartnerType } from '@/modules/identity/types'
import { sendPhoneOtp, verifyPhoneOtp, getInitialSecuritySettings } from '@/modules/identity/service'

interface AuthFlowViewProps {
  initialRole?: UserRole
  initialEmail?: string
  initialPhone?: string
  onComplete: (role: UserRole) => void
  onCancel: () => void
}

export function AuthFlowView({
  initialRole = 'PARTNER',
  initialEmail = 'alex.mushi@lumo.co.tz',
  initialPhone = '+255 712 345 678',
  onComplete,
  onCancel,
}: AuthFlowViewProps) {
  const [currentStep, setCurrentStep] = useState<number>(2) // Step 1 was Create Account & Path Selection
  const [role, setRole] = useState<UserRole>(initialRole)

  // Step 2: 6-Digit Phone OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [resendCountdown, setResendCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [attemptsRemaining, setAttemptsRemaining] = useState(3)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)

  // Step 3: Role Profile State (Partner)
  const [entityType, setEntityType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL')
  const [partnerType, setPartnerType] = useState<PartnerType>('AFFILIATE_CREATOR')
  const [region, setRegion] = useState('Dar es Salaam')
  const [district, setDistrict] = useState('Kinondoni')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Solar & Clean Energy',
    'Fintech & SME Payments',
  ])
  const [socialChannels, setSocialChannels] = useState('@alexmushi (Instagram & WhatsApp)')
  const [identityType, setIdentityType] = useState<'NIDA_ID' | 'PASSPORT' | 'TIN_CERTIFICATE'>('NIDA_ID')
  const [identityNumber, setIdentityNumber] = useState('19940823-14120-00001-29')

  // Step 3: Role Profile State (Business)
  const [bizLegalName, setBizLegalName] = useState('Kijani Solar Tech Limited')
  const [bizTradingName, setBizTradingName] = useState('Kijani Solar')
  const [brelaRegNumber, setBrelaRegNumber] = useState('149820-TZ')
  const [traTin, setTraTin] = useState('142-998-310')
  const [bizCategory, setBizCategory] = useState('Renewable Energy')
  const [authorizedRepName, setAuthorizedRepName] = useState('Grace Mlay')
  const [authorizedRepDesignation, setAuthorizedRepDesignation] = useState('Managing Director')
  const [authorizedRepIdNumber, setAuthorizedRepIdNumber] = useState('19881105-12110-00002-18')

  // Step 4: Verification Status (KYC / KYB)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('UNDER_REVIEW')
  const [uploadedDocName, setUploadedDocName] = useState('NIDA_National_ID_Card.pdf')
  const [reviewNotes, setReviewNotes] = useState(
    'Documents submitted. Our compliance team verifies NIDA & BRELA records within 2 hours.'
  )

  // Step 5: Security Setup (2FA & Trusted Device)
  const [securitySettings, setSecuritySettings] = useState(getInitialSecuritySettings())

  // Resend Countdown Timer
  useEffect(() => {
    let timer: any
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1)
      }, 1000)
    } else {
      setCanResend(true)
    }
    return () => clearInterval(timer)
  }, [resendCountdown])

  // Focus the first OTP box on mount
  useEffect(() => {
    if (currentStep === 2 && inputRefs.current[0]) {
      inputRefs.current[0]?.focus()
    }
  }, [currentStep])

  // Handle individual digit change in the 6 animated boxes
  const handleDigitChange = (index: number, value: string) => {
    setOtpError(null)

    // Handle single character or pasted string
    if (value.length > 1) {
      // Pasted full code
      const pastedCode = value.replace(/\D/g, '').slice(0, 6)
      if (pastedCode) {
        const newDigits = [...otpDigits]
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pastedCode[i] || ''
        }
        setOtpDigits(newDigits)
        const focusIdx = Math.min(pastedCode.length, 5)
        inputRefs.current[focusIdx]?.focus()

        if (pastedCode.length === 6) {
          triggerVerification(pastedCode)
        }
        return
      }
    }

    const cleanVal = value.replace(/\D/g, '')
    const newDigits = [...otpDigits]
    newDigits[index] = cleanVal
    setOtpDigits(newDigits)

    // Auto-advance to next box if digit entered
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // If all 6 digits filled, automatically verify
    const fullOtp = newDigits.join('')
    if (fullOtp.length === 6) {
      triggerVerification(fullOtp)
    }
  }

  // Handle backspace key navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle OTP verification trigger
  const triggerVerification = (codeToVerify: string) => {
    setIsVerifying(true)
    setOtpError(null)

    setTimeout(() => {
      setIsVerifying(false)
      const result = verifyPhoneOtp(initialPhone, codeToVerify)
      if (result.success || codeToVerify === '749201') {
        setIsPhoneVerified(true)
        setTimeout(() => {
          setCurrentStep(3) // Auto advance to Role Profile on success
        }, 600)
      } else {
        setOtpError(result.error || 'Invalid OTP code. Please enter the 6-digit code sent to your phone.')
        setAttemptsRemaining((prev) => Math.max(0, prev - 1))
      }
    }, 400)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fullOtp = otpDigits.join('')
    if (fullOtp.length < 6) {
      setOtpError('Please enter all 6 digits.')
      return
    }
    triggerVerification(fullOtp)
  }

  const handleResendOtp = () => {
    if (!canResend) return
    setResendCountdown(60)
    setCanResend(false)
    setOtpDigits(['', '', '', '', '', ''])
    sendPhoneOtp(initialPhone)
    setOtpError(null)
    inputRefs.current[0]?.focus()
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  const availableSkills = [
    'Solar & Clean Energy',
    'Fintech & SME Payments',
    'Agriculture & FMCG',
    'Travel & Hospitality',
    'B2B Software & ERP',
    'Digital Creator / Reels',
  ]

  const handleRevokeSession = (sessionId: string) => {
    setSecuritySettings((prev) => ({
      ...prev,
      activeSessions: prev.activeSessions.filter((s) => s.id !== sessionId),
    }))
  }

  return (
    <div className="max-w-2xl mx-auto my-4 sm:my-8 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl transition-all">
      {/* Multi-Step Wizard Progress Bar */}
      <div className="mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-extrabold text-[#F97316] uppercase tracking-wider">
            Step {currentStep} of 5 ·{' '}
            {currentStep === 2 && 'Verify Phone Number'}
            {currentStep === 3 && 'Complete Role Profile'}
            {currentStep === 4 && 'Identity & Business Verification (KYC/KYB)'}
            {currentStep === 5 && 'Security Setup & Activation'}
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {role === 'PARTNER' ? 'Partner Track' : 'Business Track'}
          </span>
        </div>

        {/* 5 Step Indicator Segments */}
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentStep >= i
                  ? 'bg-[#F97316]'
                  : 'bg-slate-100 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 2: 6 ANIMATED DIGIT BOXES FOR PHONE OTP VERIFICATION ONLY */}
      {currentStep === 2 && (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <div className="text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#F97316] flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Smartphone className="w-6 h-6" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
              Verify phone number
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1.5 leading-relaxed">
              We have sent a 6-digit verification code via <strong>Meseji SMS</strong> to{' '}
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {initialPhone}
              </span>
              .
            </p>
          </div>

          {/* 6 Animated Digit Input Boxes */}
          <div className="py-3">
            <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 max-w-md mx-auto">
              {otpDigits.map((digit, idx) => {
                const isFilled = digit !== ''
                return (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isPhoneVerified}
                    className={`w-11 h-14 sm:w-14 sm:h-16 text-center font-mono font-black text-2xl sm:text-3xl rounded-2xl border transition-all duration-200 shadow-xs focus:outline-none ${
                      isPhoneVerified
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : isFilled
                        ? 'border-[#FF6A00] bg-orange-50/50 dark:bg-orange-950/20 text-[#0F172A] dark:text-white scale-105 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 bg-[#F0F5FA] dark:bg-slate-800/60 text-[#0F172A] dark:text-white hover:border-slate-300'
                    } focus:border-[#FF6A00] focus:ring-4 focus:ring-[#FF6A00]/20 focus:scale-110`}
                  />
                )
              })}
            </div>

            {/* Quick Demo Helper & Expiry status */}
            <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400 max-w-md mx-auto mt-4 px-1">
              <span>
                Demo code:{' '}
                <button
                  type="button"
                  onClick={() => {
                    const demoCode = ['7', '4', '9', '2', '0', '1']
                    setOtpDigits(demoCode)
                    triggerVerification('749201')
                  }}
                  className="font-mono font-bold text-[#FF6A00] hover:underline"
                >
                  749201
                </button>{' '}
                (10 mins expiry)
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {attemptsRemaining} attempts left
              </span>
            </div>
          </div>

          {/* Success Check Feedback */}
          {isPhoneVerified && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Phone number verified successfully! Proceeding to next step...</span>
            </div>
          )}

          {/* Error Message */}
          {otpError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          {/* Resend Row */}
          <div className="flex items-center justify-between text-xs pt-1 max-w-md mx-auto">
            <span className="text-[#64748B]">Didn&apos;t receive the SMS code?</span>
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOtp}
                className="font-bold text-[#FF6A00] hover:underline"
              >
                Resend Code via Meseji
              </button>
            ) : (
              <span className="text-slate-400 font-mono text-[11px]">
                Resend countdown: {resendCountdown}s
              </span>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isVerifying || isPhoneVerified}
              className="py-3 px-8 bg-[#FF6A00] hover:bg-[#EA580C] disabled:bg-slate-300 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-[0.99]"
            >
              {isVerifying ? (
                <span>Verifying...</span>
              ) : isPhoneVerified ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Verified</span>
                </>
              ) : (
                <>
                  <span>Verify & Proceed</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: COMPLETE ROLE PROFILE */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
              {role === 'PARTNER' ? 'Complete Partner Profile' : 'Complete Business Profile'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
              {role === 'PARTNER'
                ? 'Specify your commercial skills, promotion channels, and tax details.'
                : 'Enter your legal registration, BRELA details, and authorized representative.'}
            </p>
          </div>

          {/* Partner Fields */}
          {role === 'PARTNER' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                    Individual or Company
                  </label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as any)}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white"
                  >
                    <option value="INDIVIDUAL">Individual Resident</option>
                    <option value="COMPANY">Registered Business / Agency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                    Partner Commercial Type
                  </label>
                  <select
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value as any)}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white"
                  >
                    <option value="AFFILIATE_CREATOR">Affiliate & Digital Creator</option>
                    <option value="COMMERCIAL_INTRODUCER">Commercial Introducer & B2B Lead</option>
                    <option value="B2B_DISTRIBUTOR">Regional Distributor / Sourcing</option>
                    <option value="MARKETING_AGENCY">Marketing Agency</option>
                    <option value="COMMUNITY_LEADER">Community / Co-op Leader</option>
                  </select>
                </div>
              </div>

              {/* Location in Tanzania */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                    Region in Tanzania
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white"
                  >
                    <option value="Dar es Salaam">Dar es Salaam</option>
                    <option value="Arusha">Arusha</option>
                    <option value="Mwanza">Mwanza</option>
                    <option value="Dodoma">Dodoma</option>
                    <option value="Mbeya">Mbeya</option>
                    <option value="Morogoro">Morogoro</option>
                    <option value="Zanzibar">Zanzibar</option>
                    <option value="Kilimanjaro">Kilimanjaro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                    District / Municipality
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Kinondoni, Ilala, Ubungo"
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white"
                  />
                </div>
              </div>

              {/* Skills & Industry Focus */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-2">
                  Skills & Industry Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill)
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#FF6A00] text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Promotion Channels & Social Handles */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                  Social & Business Channels
                </label>
                <input
                  type="text"
                  value={socialChannels}
                  onChange={(e) => setSocialChannels(e.target.value)}
                  placeholder="e.g. @alexmushi (Instagram 25k followers, WhatsApp 1,200 contacts, YouTube)"
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white"
                />
              </div>

              {/* National Identity / NIDA Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                    Identity Document Type
                  </label>
                  <select
                    value={identityType}
                    onChange={(e) => setIdentityType(e.target.value as any)}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white"
                  >
                    <option value="NIDA_ID">NIDA National ID (Tanzania)</option>
                    <option value="PASSPORT">East African Passport</option>
                    <option value="TIN_CERTIFICATE">TRA TIN Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                    Document / NIDA Number
                  </label>
                  <input
                    type="text"
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(e.target.value)}
                    placeholder="19940823-14120-00001-29"
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Business Fields */}
          {role === 'BUSINESS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                    Legal Entity Name (BRELA Registered)
                  </label>
                  <input
                    type="text"
                    value={bizLegalName}
                    onChange={(e) => setBizLegalName(e.target.value)}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                    Trading Brand Name
                  </label>
                  <input
                    type="text"
                    value={bizTradingName}
                    onChange={(e) => setBizTradingName(e.target.value)}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                    BRELA Registration Number
                  </label>
                  <input
                    type="text"
                    value={brelaRegNumber}
                    onChange={(e) => setBrelaRegNumber(e.target.value)}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                    TRA Tax Identification Number (TIN)
                  </label>
                  <input
                    type="text"
                    value={traTin}
                    onChange={(e) => setTraTin(e.target.value)}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Business Category */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                  Business Category & Industry Sector
                </label>
                <select
                  value={bizCategory}
                  onChange={(e) => setBizCategory(e.target.value)}
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white"
                >
                  <option value="Renewable Energy">Renewable Energy & Solar</option>
                  <option value="Fintech & Payments">Fintech & Digital Payments</option>
                  <option value="FMCG & Retail">FMCG, Trade & Retail Distribution</option>
                  <option value="Travel & Hospitality">Travel & Hospitality</option>
                  <option value="Agriculture">Agribusiness & Processing</option>
                  <option value="Software">Software & IT Services</option>
                </select>
              </div>

              {/* Authorized Representative */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                    Authorized Representative
                  </label>
                  <input
                    type="text"
                    value={authorizedRepName}
                    onChange={(e) => setAuthorizedRepName(e.target.value)}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={authorizedRepDesignation}
                    onChange={(e) => setAuthorizedRepDesignation(e.target.value)}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                    Representative NIDA ID
                  </label>
                  <input
                    type="text"
                    value={authorizedRepIdNumber}
                    onChange={(e) => setAuthorizedRepIdNumber(e.target.value)}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="py-2.5 px-4 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="py-3 px-6 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <span>Save & Upload KYC Docs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: IDENTITY & BUSINESS VERIFICATION (KYC / KYB) */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
              Identity & Business Verification
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
              Upload statutory verification files. Verification guarantees compliant commission settlements and TRA compliance.
            </p>
          </div>

          {/* Status Tracker Banner with Interactive Statuses */}
          <div className="p-4 sm:p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-blue-950 dark:text-blue-200">
                  Verification Lifecycle:
                </span>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1.5">
                {(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as VerificationStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setVerificationStatus(status)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                        verificationStatus === status
                          ? status === 'APPROVED'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : status === 'REJECTED'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>

            <p className="text-xs text-blue-900 dark:text-blue-300">
              {verificationStatus === 'APPROVED' &&
                '✓ Verification approved! Your statutory documents have been successfully verified.'}
              {verificationStatus === 'UNDER_REVIEW' && reviewNotes}
              {verificationStatus === 'SUBMITTED' &&
                'Documents uploaded. Pending queue assignment for compliance officer review.'}
              {verificationStatus === 'DRAFT' &&
                'Documents saved in draft mode. Click Submit to initiate verification.'}
              {verificationStatus === 'REJECTED' &&
                '⚠️ Document illegible or expired. Please upload a clear replacement copy.'}
            </p>
          </div>

          {/* Document Upload Area */}
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-slate-50/50 transition-colors">
            <Upload className="w-8 h-8 text-[#FF6A00] mx-auto mb-2" />
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
              {uploadedDocName}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              PDF, JPG or PNG up to 10MB (NIDA Card / BRELA Certificate / TIN Document)
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setUploadedDocName('Updated_KYC_Verification_Document.pdf')
                  setVerificationStatus('APPROVED')
                  setReviewNotes('Document verified successfully! Your account is approved.')
                }}
                className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-semibold rounded-lg"
              >
                Re-upload / Correct Document
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="py-2.5 px-4 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="py-3 px-6 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <span>Security Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: SECURITY SETUP (2FA & Trusted Device) & ACCOUNT ACTIVATION */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
              Security Setup & Activation
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
              Protect your financial payouts, active links, and commercial deals.
            </p>
          </div>

          {/* 2FA Toggle */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF6A00] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-[#0F172A] dark:text-white">
                  Two-Factor Authentication (2FA)
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                  Requires Meseji SMS OTP for payout authorization and sensitive logins.
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.twoFactorEnabled}
                onChange={(e) =>
                  setSecuritySettings((prev) => ({
                    ...prev,
                    twoFactorEnabled: e.target.checked,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6A00]" />
            </label>
          </div>

          {/* Active Devices & Sessions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-[#0F172A] dark:text-white uppercase tracking-wider">
                Trusted Devices & Active Sessions
              </h3>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Current Device Registered
              </span>
            </div>

            <div className="space-y-2">
              {securitySettings.activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Laptop className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <span>{session.deviceName}</span>
                        {session.isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {session.browser} · {session.ipAddress}
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(session.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Account Activation Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs">
            <div className="font-extrabold flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>
                Ready for Activation: {role === 'PARTNER' ? 'Partner Portal Access' : 'Business Hub Access'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
              {role === 'PARTNER'
                ? 'Approved partners receive full marketplace access, tracking link generation, and M-Pesa payout wallet.'
                : 'Approved businesses receive Deal Room publishing rights, partner application review, and escrow management.'}
            </p>
          </div>

          {/* Finish & Activate Action */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="py-2.5 px-4 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => onComplete(role)}
              className="py-3 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Activate Account & Enter {role === 'PARTNER' ? 'Partner Portal' : 'Business Hub'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
