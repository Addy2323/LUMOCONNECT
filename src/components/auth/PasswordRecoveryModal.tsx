'use client'

import React, { useState } from 'react'
import {
  X,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react'

interface PasswordRecoveryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PasswordRecoveryModal({
  isOpen,
  onClose,
  onSuccess,
}: PasswordRecoveryModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [identifier, setIdentifier] = useState('alex.mushi@lumo.co.tz')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  if (!isOpen) return null

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(3)
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#F97316] flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-[#0F172A] dark:text-white">
              Account Recovery
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              {step === 1 && 'Enter your verified email or phone'}
              {step === 2 && 'Enter security OTP code'}
              {step === 3 && 'Create new secure password'}
            </p>
          </div>
        </div>

        {/* Step 1: Enter Identifier */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                Email or Mobile Number
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. you@example.com or +255 712 345 678"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-slate-50/50 text-[#0F172A] dark:text-white"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 text-[11px] text-[#64748B] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
              <span>
                We will dispatch a 6-digit security code via Meseji SMS and Email to verify your identity.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors"
            >
              Send Recovery Code
            </button>
          </form>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                6-Digit Security Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="749201"
                className="w-full text-center tracking-[0.5em] font-mono font-bold text-lg p-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-slate-50/50 text-[#0F172A] dark:text-white"
              />
              <span className="block text-[11px] text-slate-400 mt-1.5 text-center">
                Demo code: <strong>749201</strong> (Expires in 10 minutes)
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors"
            >
              Verify Code
            </button>
          </form>
        )}

        {/* Step 3: Create New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-slate-50/50 text-[#0F172A] dark:text-white"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Resetting your password will automatically revoke all existing active sessions on other devices for your security.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Update Password & Revoke Sessions</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
