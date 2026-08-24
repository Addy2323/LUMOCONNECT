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
  Key,
} from 'lucide-react'
import { PasswordRecoveryModal } from './PasswordRecoveryModal'

interface SignInViewProps {
  onSignInSuccess: (role: 'PARTNER' | 'BUSINESS' | 'ADMIN') => void
  onCreateAccount: () => void
  onNavigateHome: () => void
}

export function SignInView({
  onSignInSuccess,
  onCreateAccount,
  onNavigateHome,
}: SignInViewProps) {
  const [email, setEmail] = useState('admin@lumo.co.tz')
  const [password, setPassword] = useState('••••••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [selectedRole, setSelectedRole] = useState<'PARTNER' | 'BUSINESS' | 'ADMIN'>('PARTNER')
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSignInSuccess(selectedRole)
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-2 sm:my-8 px-2 sm:px-4">
      {/* Password Recovery Modal */}
      <PasswordRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        onSuccess={() => {
          alert('Password successfully reset. You may now sign in.')
        }}
      />

      {/* 2-Column Card on Desktop, Single Clean White Card on Mobile */}
      <div className="rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Solid Vibrant Orange Panel (Hidden on mobile for clean mobile view) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#FF6A00] to-[#EA580C] p-8 sm:p-10 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-extrabold uppercase tracking-wider">
              <span>LUMO ECOSYSTEM</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Welcome back
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
                  One account for commercial partners and merchant hubs.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <span className="font-semibold text-white/95 leading-snug">
                  Automated TRA tax reporting and instant mobile money settlement.
                </span>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={onCreateAccount}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/80 hover:bg-white hover:text-[#EA580C] text-white font-bold text-xs transition-all shadow-sm"
              >
                <span>Create Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-white/20 text-[11px] italic text-white/80">
            &ldquo;Shop globally. Delivered locally. Performance Commerce.&rdquo;
          </div>
        </div>

        {/* Right Column / Mobile Main White Card */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white dark:bg-slate-900">
          <div>
            {/* Top Card Bar */}
            <div className="flex items-center justify-between pb-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FF6A00] text-white font-black text-xs flex items-center justify-center shadow-xs">
                  L
                </div>
                <span className="font-extrabold text-base tracking-tight text-[#0F172A] dark:text-white">
                  Lumo
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                  Instant Access
                </span>
              </div>
            </div>

            {/* Form Title & Subtitle */}
            <div className="mb-5">
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                Sign in to manage orders, quotations & logistics.
              </p>
            </div>

            {/* Social Auth Buttons (Google & GitHub) */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => onSignInSuccess('PARTNER')}
                className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0F172A] dark:text-white font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => onSignInSuccess('PARTNER')}
                className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0F172A] dark:text-white font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                Or continue with email
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@lumo.co.tz"
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
                    className="text-xs font-bold text-[#FF6A00] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-2xl bg-[#F0F5FA] dark:bg-slate-800/60 text-[#0F172A] dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Keep me signed in */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FF6A00] accent-[#FF6A00]"
                  />
                  <span className="text-[11px]">Keep me signed in</span>
                </label>
              </div>

              {/* Sign In Primary Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-[0.99]"
              >
                Sign In
              </button>
            </form>

            {/* Create Account Link */}
            <div className="pt-3 text-center">
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                New to Lumo?{' '}
                <button
                  type="button"
                  onClick={onCreateAccount}
                  className="font-bold text-[#FF6A00] hover:underline"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>

          {/* Footer Security Notice */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure authentication • Protected by LUMO</span>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">v1.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
