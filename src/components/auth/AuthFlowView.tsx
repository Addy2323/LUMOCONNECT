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
  FileText,
  Trash2,
  FileCheck,
  Info,
} from 'lucide-react'
import type { UserRole, PartnerType } from '@/modules/identity/types'
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  getInitialSecuritySettings,
  submitVerificationRecord,
} from '@/modules/identity/service'

interface UploadedDocItem {
  id: string
  slotKey: string
  title: string
  fileName: string
  fileSize: string
  previewUrl?: string
  uploadedAt: string
}

export interface OnboardingProfilePayload {
  name: string
  legalName?: string
  tradingName?: string
  registrationNumber?: string
  tinNumber?: string
  industry?: string
  contactPerson?: string
  email?: string
  phone?: string
}

interface AuthFlowViewProps {
  initialRole?: UserRole
  initialEmail?: string
  initialPhone?: string
  initialPassword?: string
  onComplete: (role: UserRole, profileData?: OnboardingProfilePayload) => void
  onCancel: () => void
}

export function AuthFlowView({
  initialRole = 'PARTNER',
  initialEmail = '',
  initialPhone = '',
  initialPassword = '',
  onComplete,
  onCancel,
}: AuthFlowViewProps) {
  const [currentStep, setCurrentStep] = useState<number>(2) // Step 1 was Create Account & Path Selection
  const [role, setRole] = useState<UserRole>(initialRole)

  // Step 2: Phone Verification State
  const [phone, setPhone] = useState(initialPhone)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState<number>(60)
  const [canResend, setCanResend] = useState(false)
  const [attemptsRemaining, setAttemptsRemaining] = useState(3)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)

  // Step 3: Role Profile State (Partner)
  const [entityType, setEntityType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL')
  const [partnerType, setPartnerType] = useState<PartnerType>('AFFILIATE_CREATOR')
  const [region, setRegion] = useState('Dar es Salaam')
  const [district, setDistrict] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [socialChannels, setSocialChannels] = useState('')
  const [identityType, setIdentityType] = useState<'NIDA_ID' | 'PASSPORT' | 'TIN_CERTIFICATE'>('NIDA_ID')
  const [identityNumber, setIdentityNumber] = useState('')

  // Step 3: Role Profile State (Business)
  const [bizLegalName, setBizLegalName] = useState('')
  const [bizTradingName, setBizTradingName] = useState('')
  const [brelaRegNumber, setBrelaRegNumber] = useState('')
  const [traTin, setTraTin] = useState('')
  const [bizCategory, setBizCategory] = useState('')
  const [authorizedRepName, setAuthorizedRepName] = useState('')
  const [authorizedRepDesignation, setAuthorizedRepDesignation] = useState('')
  const [authorizedRepIdNumber, setAuthorizedRepIdNumber] = useState('')

  // Step 4: Verification Status & Real Document Files (KYC / KYB) - Completely Empty for Clean Onboarding
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDocItem>>({})
  const [step4Error, setStep4Error] = useState<string | null>(null)

  const handleFileUpload = (slotKey: string, title: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setUploadedDocs((prev) => ({
        ...prev,
        [slotKey]: {
          id: `doc_${Date.now()}_${slotKey}`,
          slotKey,
          title,
          fileName: file.name,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          previewUrl: dataUrl,
          uploadedAt: 'Just now',
        },
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleAdvanceToSecurity = () => {
    setStep4Error(null)
    if (Object.keys(uploadedDocs).length === 0) {
      setStep4Error('Please attach at least your primary statutory document (NIDA or BRELA) to proceed.')
      return
    }

    // Submit the verification case to the central registry so Admin can review and download
    submitVerificationRecord({
      entityType: role === 'BUSINESS' ? 'BUSINESS' : 'PARTNER',
      businessName: role === 'BUSINESS' ? (bizTradingName || bizLegalName || 'New Registered Business') : (initialEmail.split('@')[0] || 'New Partner Applicant'),
      registrationNumber: brelaRegNumber || identityNumber || 'PENDING-REG',
      tinNumber: traTin || 'PENDING-TIN',
      industry: bizCategory || (selectedSkills && selectedSkills[0]) || 'General Commerce',
      contactPerson: authorizedRepName || 'Applicant Signatory',
      email: initialEmail || 'business@lumo.co.tz',
      phone: phone || initialPhone || '+255 700 000 000',
      status: 'SUBMITTED',
      documents: Object.values(uploadedDocs).map((doc) => ({
        id: doc.id,
        name: doc.fileName,
        type: doc.slotKey === 'primary' ? (role === 'BUSINESS' ? 'BRELA_CERT' : 'ID_PASSPORT') : doc.slotKey === 'tin' ? 'TIN_CERT' : 'ID_PASSPORT',
        fileSize: doc.fileSize,
        previewUrl: doc.previewUrl,
        status: 'PENDING',
        uploadedAt: doc.uploadedAt,
      })),
      beneficialOwners: authorizedRepName ? [authorizedRepName] : ['Primary Signatory'],
    })

    // Asynchronously commit user, organization, verification case, and documents to PostgreSQL database
    try {
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: initialEmail || `enterprise_${Date.now()}@lumo.co.tz`,
          name: role === 'BUSINESS' ? (bizTradingName || bizLegalName || 'Registered Enterprise') : (initialEmail.split('@')[0] || 'Registered Partner'),
          phone: phone || initialPhone || undefined,
          role,
          bizDetails: role === 'BUSINESS' ? {
            legalName: bizLegalName || undefined,
            tradingName: bizTradingName || undefined,
            brelaRegNumber: brelaRegNumber || undefined,
            traTin: traTin || undefined,
            bizCategory: bizCategory || undefined,
            contactPerson: authorizedRepName || undefined,
          } : undefined,
          documents: Object.values(uploadedDocs).map((d) => ({
            name: d.fileName,
            type: d.title,
            fileSize: d.fileSize,
          })),
        }),
      }).catch((err) => console.warn('PostgreSQL Database Registration Sync:', err))
    } catch (e) {
      // Non-blocking catch
    }

    setCurrentStep(5)
  }

  // Step 5: Security Setup (2FA & Trusted Device)
  const [securitySettings, setSecuritySettings] = useState(getInitialSecuritySettings())

  useEffect(() => {
    setSecuritySettings(getInitialSecuritySettings())
  }, [])

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
                    placeholder="e.g. Kijani Solar Tech Limited"
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white placeholder:text-slate-400"
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
                    placeholder="e.g. Kijani Solar"
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white placeholder:text-slate-400"
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
                    placeholder="e.g. 149820-TZ"
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white font-mono placeholder:text-slate-400"
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
                    placeholder="e.g. 142-998-310"
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white font-mono placeholder:text-slate-400"
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
                  <option value="">Select industry category...</option>
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
                    placeholder="e.g. Grace Mlay"
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white placeholder:text-slate-400"
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
                    placeholder="e.g. Managing Director"
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white placeholder:text-slate-400"
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
                    placeholder="19881105-12110-00002-18"
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-[#F0F5FA] text-[#0F172A] dark:text-white font-mono placeholder:text-slate-400"
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
              Upload statutory verification files. Verification guarantees compliant commission settlements and TRA tax compliance.
            </p>
          </div>

          {/* Compliance Info Banner */}
          <div className="p-4 sm:p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-blue-950 dark:text-blue-200">
                  Compliance Status:
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-600 text-white shadow-2xs">
                {Object.keys(uploadedDocs).length > 0 ? 'READY FOR REVIEW' : 'PENDING UPLOAD'}
              </span>
            </div>

            <p className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
              Documents are encrypted with 256-bit AES statutory safeguarding. Verification against official BRELA and NIDA registries takes place within 24 hours. You can continue with setup right away.
            </p>
          </div>

          {/* Document Upload Slots */}
          <div className="space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">
              Required Statutory Documents ({role === 'BUSINESS' ? 'Business Track' : 'Partner Track'})
            </div>

            {/* Document Slot 1: Primary ID / Incorporation */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      {role === 'BUSINESS'
                        ? 'BRELA Certificate of Incorporation / Registration'
                        : 'NIDA National ID Card / Passport'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {role === 'BUSINESS'
                        ? 'Official certificate issued by BRELA Tanzania'
                        : 'Clear front and back photo or scanned PDF'}
                    </div>
                  </div>
                </div>

                {uploadedDocs.primary ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Attached</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                    Required
                  </span>
                )}
              </div>

              {uploadedDocs.primary ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {uploadedDocs.primary.fileName}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      ({uploadedDocs.primary.fileSize})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[11px] font-bold text-[#FF6A00] hover:underline cursor-pointer">
                      <span>Replace</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload('primary', role === 'BUSINESS' ? 'BRELA Certificate' : 'NIDA Card', file)
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedDocs((prev) => {
                          const next = { ...prev }
                          delete next.primary
                          return next
                        })
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#FF6A00] dark:hover:border-[#FF6A00] rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-orange-50/20 transition-all text-center">
                  <Upload className="w-6 h-6 text-[#FF6A00]" />
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Click to browse or drop file here
                  </span>
                  <span className="text-[10px] text-slate-400">
                    PDF, JPG or PNG up to 10MB
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload('primary', role === 'BUSINESS' ? 'BRELA Certificate' : 'NIDA Card', file)
                    }}
                  />
                </label>
              )}
            </div>

            {/* Document Slot 2: TRA TIN Certificate */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      TRA Taxpayer Identification Number (TIN) Certificate
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Tanzania Revenue Authority Taxpayer Registration Certificate
                    </div>
                  </div>
                </div>

                {uploadedDocs.tin ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Attached</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    Optional
                  </span>
                )}
              </div>

              {uploadedDocs.tin ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {uploadedDocs.tin.fileName}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      ({uploadedDocs.tin.fileSize})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[11px] font-bold text-[#FF6A00] hover:underline cursor-pointer">
                      <span>Replace</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload('tin', 'TRA TIN Certificate', file)
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedDocs((prev) => {
                          const next = { ...prev }
                          delete next.tin
                          return next
                        })
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#FF6A00] dark:hover:border-[#FF6A00] rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-orange-50/20 transition-all text-center">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Click to attach TIN Certificate
                  </span>
                  <span className="text-[10px] text-slate-400">
                    PDF, JPG or PNG up to 10MB
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload('tin', 'TRA TIN Certificate', file)
                    }}
                  />
                </label>
              )}
            </div>

            {/* Document Slot 3: Business Director ID (Business Only) */}
            {role === 'BUSINESS' && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        Authorized Director / Managing Signatory NIDA ID
                      </div>
                      <div className="text-[11px] text-slate-500">
                        NIDA ID card or passport copy for {authorizedRepName || 'Managing Director'}
                      </div>
                    </div>
                  </div>

                  {uploadedDocs.director ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Attached</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      Optional
                    </span>
                  )}
                </div>

                {uploadedDocs.director ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {uploadedDocs.director.fileName}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        ({uploadedDocs.director.fileSize})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[11px] font-bold text-[#FF6A00] hover:underline cursor-pointer">
                        <span>Replace</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload('director', 'Director NIDA ID', file)
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedDocs((prev) => {
                            const next = { ...prev }
                            delete next.director
                            return next
                          })
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#FF6A00] dark:hover:border-[#FF6A00] rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-orange-50/20 transition-all text-center">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      Click to attach Director NIDA ID
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PDF, JPG or PNG up to 10MB
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload('director', 'Director NIDA ID', file)
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Validation error if any */}
          {step4Error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{step4Error}</span>
            </div>
          )}

          {/* Wizard Footer Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="py-2.5 px-4 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleAdvanceToSecurity}
              className="py-3 px-6 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
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
              onClick={() => {
                const profilePayload: OnboardingProfilePayload = {
                  name:
                    role === 'BUSINESS'
                      ? bizTradingName.trim() || bizLegalName.trim() || 'My Business'
                      : initialEmail.split('@')[0] || 'Registered Partner',
                  legalName: bizLegalName.trim() || undefined,
                  tradingName: bizTradingName.trim() || undefined,
                  registrationNumber: brelaRegNumber.trim() || identityNumber.trim() || undefined,
                  tinNumber: traTin.trim() || undefined,
                  industry: bizCategory.trim() || (selectedSkills && selectedSkills[0]) || undefined,
                  contactPerson: authorizedRepName.trim() || undefined,
                  email: initialEmail || undefined,
                  phone: phone || initialPhone || undefined,
                }
                onComplete(role, profilePayload)
              }}
              className="py-3 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
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
