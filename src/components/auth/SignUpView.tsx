'use client'

import React, { useState } from 'react'
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'

type SignUpField = 'fullName' | 'email' | 'phone' | 'password' | 'confirmPassword' | 'terms'
type SignUpErrors = Partial<Record<SignUpField, string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function normalizeTanzaniaPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (/^0[67]\d{8}$/.test(digits)) return `+255${digits.slice(1)}`
  if (/^255[67]\d{8}$/.test(digits)) return `+${digits}`
  return null
}

function validateSignUp(values: {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}) {
  const errors: SignUpErrors = {}
  const nameParts = values.fullName.trim().split(/\s+/).filter(Boolean)

  if (nameParts.length < 2 || values.fullName.trim().length < 5) {
    errors.fullName = 'Enter your first and last legal name.'
  } else if (/[^\p{L}'\u2019 -]/u.test(values.fullName.trim())) {
    errors.fullName = 'Name can only contain letters, spaces, apostrophes, and hyphens.'
  }
  if (!emailPattern.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (!normalizeTanzaniaPhone(values.phone)) {
    errors.phone = 'Enter a valid Tanzania mobile number, e.g. +255 712 345 678.'
  }
  if (values.password.length < 8) {
    errors.password = 'Password must contain at least 8 characters.'
  } else if (!/[a-z]/.test(values.password) || !/[A-Z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = 'Include an uppercase letter, lowercase letter, and number.'
  }
  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }
  if (!values.agreeTerms) {
    errors.terms = 'You must accept the terms and privacy policy.'
  }

  return errors
}

interface SignUpViewProps {
  role?: 'PARTNER' | 'BUSINESS'
  onSignUpSuccess: (role: 'PARTNER' | 'BUSINESS', details: { name: string; email: string; phone: string; password?: string }) => void
  onNavigateSignIn: () => void
  onChangePath?: () => void
}

export function SignUpView({
  role = 'PARTNER',
  onSignUpSuccess,
  onNavigateSignIn,
  onChangePath,
}: SignUpViewProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('+255')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errors, setErrors] = useState<SignUpErrors>({})

  const clearError = (field: SignUpField) => {
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors = validateSignUp({ fullName, email, phone, password, confirmPassword, agreeTerms })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSignUpSuccess(role, {
      name: fullName.trim().replace(/\s+/g, ' '),
      email: email.trim().toLowerCase(),
      phone: normalizeTanzaniaPhone(phone)!,
      password,
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-2 sm:my-8 px-2.5 sm:px-4">
      {/* 2-Column Card on Desktop, Single Clean White Card on Mobile */}
      <div className="rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Solid Vibrant Orange Panel (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#FF6A00] to-[#EA580C] p-8 sm:p-10 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-extrabold uppercase tracking-wider">
              <span>{role === 'PARTNER' ? 'MSHIRIKA WA MAUZO / PARTNER NETWORK' : 'BUSINESS HUB'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {role === 'PARTNER' ? 'Join as Mshirika wa Mauzo / Partner' : 'Join as Business'}
            </h1>

            <div className="space-y-4 pt-2 text-xs sm:text-sm">
              {role === 'PARTNER' ? (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <span className="font-semibold text-white/95 leading-snug">
                      Earn verified commissions on performance-driven commercial deals.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <span className="font-semibold text-white/95 leading-snug">
                      Instant mobile money settlement via M-Pesa, Airtel & Tigo Pesa.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <span className="font-semibold text-white/95 leading-snug">
                      Real-time link tracking with fraud-resistant attribution.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <span className="font-semibold text-white/95 leading-snug">
                      Automated TRA statutory withholding tax certificate generation.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <span className="font-semibold text-white/95 leading-snug">
                      Publish scalable performance deals across East Africa.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <span className="font-semibold text-white/95 leading-snug">
                      Pay only when verified sales, leads, or distribution occur.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <span className="font-semibold text-white/95 leading-snug">
                      Private Deal Rooms with custom commercial agreements.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <span className="font-semibold text-white/95 leading-snug">
                      Escrow-protected fund settlements with full audit trails.
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={onNavigateSignIn}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/80 hover:bg-white hover:text-[#EA580C] text-white font-bold text-xs transition-all shadow-sm"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {onChangePath && (
                <button
                  type="button"
                  onClick={onChangePath}
                  className="text-xs font-semibold text-white/80 hover:text-white underline underline-offset-4"
                >
                  Change Path
                </button>
              )}
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-white/20 text-[11px] italic text-white/80">
            &ldquo;Money follows genuine and independently verifiable economic activity.&rdquo;
          </div>
        </div>

        {/* Right Column / Main White Card */}
        <div className="lg:col-span-7 p-4 min-[380px]:p-5 sm:p-10 flex flex-col justify-between bg-white dark:bg-slate-900">
          <div>
            {/* Top Card Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2">
              <div className="flex shrink-0 items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FF6A00] text-white font-black text-xs flex items-center justify-center shadow-xs">
                  L
                </div>
                <span className="font-extrabold text-base tracking-tight text-[#0F172A] dark:text-white">
                  Lumo
                </span>
              </div>

              <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                {onChangePath && (
                  <button
                    type="button"
                    onClick={onChangePath}
                    className="text-[11px] font-bold text-[#F97316] hover:underline mr-1"
                  >
                    {role === 'PARTNER' ? 'Switch to Business' : 'Switch to Mshirika wa Mauzo / Partner'}
                  </button>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                  Instant Access
                </span>
              </div>
            </div>

            {/* Form Title & Subtitle */}
            <div className="mb-5">
              <h2 className="text-lg min-[380px]:text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight leading-tight">
                {role === 'PARTNER' ? 'Create Mshirika wa Mauzo / Partner Account' : 'Create Business Account'}
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                {role === 'PARTNER'
                  ? 'Join LUMO to discover deals, promote products, and earn rewards.'
                  : 'Join LUMO to publish opportunities and scale with verified partners.'}
              </p>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1">
                  Full Legal Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      clearError('fullName')
                    }}
                    placeholder={role === 'PARTNER' ? 'Alex Mushi' : 'Grace Mlay'}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? 'full-name-error' : undefined}
                    className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border rounded-2xl bg-[#F0F5FA] dark:bg-slate-800/60 text-[#0F172A] dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] ${errors.fullName ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'}`}
                  />
                </div>
                {errors.fullName && <p id="full-name-error" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600"><AlertCircle className="h-3 w-3 shrink-0" />{errors.fullName}</p>}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      clearError('email')
                    }}
                    placeholder="you@example.co.tz"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border rounded-2xl bg-[#F0F5FA] dark:bg-slate-800/60 text-[#0F172A] dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] ${errors.email ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'}`}
                  />
                </div>
                {errors.email && <p id="email-error" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600"><AlertCircle className="h-3 w-3 shrink-0" />{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1">
                  Phone Number (for Meseji OTP & Payouts)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      clearError('phone')
                    }}
                    placeholder="+255 712 345 678"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border rounded-2xl bg-[#F0F5FA] dark:bg-slate-800/60 text-[#0F172A] dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] font-mono ${errors.phone ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'}`}
                  />
                </div>
                {errors.phone && <p id="phone-error" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600"><AlertCircle className="h-3 w-3 shrink-0" />{errors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      clearError('password')
                      clearError('confirmPassword')
                    }}
                    placeholder="At least 8 characters"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby="password-help"
                    className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border rounded-2xl bg-[#F0F5FA] dark:bg-slate-800/60 text-[#0F172A] dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] ${errors.password ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p id="password-help" className={`mt-1 text-[10px] ${errors.password ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>
                  {errors.password || 'Use 8+ characters with uppercase, lowercase, and a number.'}
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      clearError('confirmPassword')
                    }}
                    placeholder="Re-enter password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                    className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border rounded-2xl bg-[#F0F5FA] dark:bg-slate-800/60 text-[#0F172A] dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] ${errors.confirmPassword ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p id="confirm-password-error" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600"><AlertCircle className="h-3 w-3 shrink-0" />{errors.confirmPassword}</p>}
              </div>

              {/* Terms Checkbox */}
              <div className="pt-0.5">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-[#64748B] dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked)
                      clearError('terms')
                    }}
                    aria-invalid={Boolean(errors.terms)}
                    aria-describedby={errors.terms ? 'terms-error' : undefined}
                    className="mt-0.5 w-4 h-4 shrink-0 rounded text-[#FF6A00] accent-[#FF6A00]"
                  />
                  <span className="text-[11px]">
                    I agree to the Lumo{' '}
                    <a href="#" className="font-bold text-[#FF6A00] hover:underline">
                      terms
                    </a>{' '}
                    and{' '}
                    <a href="#" className="font-bold text-[#FF6A00] hover:underline">
                      privacy policy
                    </a>
                    .
                  </span>
                </label>
                {errors.terms && <p id="terms-error" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600"><AlertCircle className="h-3 w-3 shrink-0" />{errors.terms}</p>}
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-[0.99]"
              >
                Create Account & Continue
              </button>
            </form>

            {/* Already registered? */}
            <div className="pt-3 text-center">
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={onNavigateSignIn}
                  className="font-bold text-[#FF6A00] hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>

          {/* Footer Security Notice */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B] dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Instant Access after OTP verification</span>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">v1.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
