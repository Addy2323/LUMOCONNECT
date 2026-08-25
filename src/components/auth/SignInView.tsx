'use client'

import React, { useState } from 'react'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { PasswordRecoveryModal } from './PasswordRecoveryModal'

export interface AuthenticatedUserPayload {
  id: string
  email: string
  name: string
  phone?: string
  role: 'PARTNER' | 'BUSINESS' | 'ADMIN' | 'CUSTOMER'
  organizationName?: string | null
  registrationNumber?: string | null
}

interface SignInViewProps {
  onSignInSuccess: (
    role: 'PARTNER' | 'BUSINESS' | 'ADMIN',
    credentials?: { email: string; user?: AuthenticatedUserPayload }
  ) => void
  onCreateAccount: () => void
  onNavigateHome: () => void
}

export function SignInView({
  onSignInSuccess,
  onCreateAccount,
  onNavigateHome,
}: SignInViewProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      setErrorMessage('Please enter both email and password.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Invalid email or password.')
        setIsLoading(false)
        return
      }

      const resolvedRole: 'PARTNER' | 'BUSINESS' | 'ADMIN' =
        data.user.role === 'ADMIN'
          ? 'ADMIN'
          : data.user.role === 'BUSINESS'
          ? 'BUSINESS'
          : 'PARTNER'

      onSignInSuccess(resolvedRole, {
        email: normalizedEmail,
        user: data.user,
      })
    } catch (err: any) {
      setErrorMessage('Network connection error. Please verify your connection.')
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-2 sm:my-8 px-2 sm:px-4">
      {/* Password Recovery Modal */}
      <PasswordRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        onSuccess={() => {
          setResetSuccessMessage('Password successfully reset. You may now sign in.')
        }}
      />

      {/* 2-Column Card on Desktop, Single Clean White Card on Mobile */}
      <div className="rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Solid Vibrant Orange Panel */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#FF6A00] to-[#EA580C] p-8 sm:p-10 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-extrabold uppercase tracking-wider">
              <span>LUMO ECOSYSTEM</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Secure Access
            </h1>

            <div className="space-y-4 pt-2 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <span className="font-semibold text-white/95 leading-snug">
                  Direct factory trade with zero forex risk.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <span className="font-semibold text-white/95 leading-snug">
                  Real-time deal performance tracking and verified payouts.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <span className="font-semibold text-white/95 leading-snug">
                  Encrypted credentials & cryptographically hashed authentication.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <span className="font-semibold text-white/95 leading-snug">
                  Automated TRA tax reporting and instant mobile money settlement.
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-8 border-t border-white/20 flex items-center justify-between text-xs text-white/80">
            <span className="font-bold">Encrypted via TLS 1.3</span>
            <span className="flex items-center gap-1 font-extrabold text-white">
              <ShieldCheck className="w-4 h-4 text-white" />
              Verified Safe
            </span>
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Top Bar with Language/Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  LUMO Secure Gateway
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                  PostgreSQL Guarded
                </span>
              </div>
            </div>

            {/* Form Title & Subtitle */}
            <div className="mb-5">
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
                Sign In to Your Workspace
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                Enter your verified credentials to access your Business, Partner, or Admin Portal.
              </p>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Reset Success Message */}
            {resetSuccessMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@company.co.tz or admin@lumo.co.tz"
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-2xl bg-[#F0F5FA] dark:bg-slate-800/60 text-[#0F172A] dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(true)}
                    className="text-[11px] font-bold text-[#FF6A00] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-10 pr-11 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-2xl bg-[#F0F5FA] dark:bg-slate-800/60 text-[#0F172A] dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-[#FF6A00] focus:ring-[#FF6A00]/30"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Keep me signed in on this device
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#FF6A00] hover:bg-[#EA580C] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Database Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In Securely</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Switcher: Create Account */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center mt-6">
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Don't have an account on LUMO?{' '}
              <button
                type="button"
                onClick={onCreateAccount}
                className="font-extrabold text-[#FF6A00] hover:underline cursor-pointer"
              >
                Create an Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
