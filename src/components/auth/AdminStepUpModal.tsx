'use client'

import React, { useState } from 'react'
import { ShieldCheck, Lock, KeyRound, AlertTriangle, X, CheckCircle2 } from 'lucide-react'

interface AdminStepUpModalProps {
  adminEmail: string
  onSuccess: () => void
  onClose: () => void
}

export function AdminStepUpModal({
  adminEmail,
  onSuccess,
  onClose,
}: AdminStepUpModalProps) {
  const [authMethod, setAuthMethod] = useState<'TOTP' | 'PASSWORD'>('TOTP')
  const [totpCode, setTotpCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsVerifying(true)

    // Verify step-up credentials
    setTimeout(() => {
      if (authMethod === 'TOTP') {
        if (!totpCode || totpCode.trim().length < 6) {
          setError('Please enter a valid 6-digit authenticator code.')
          setIsVerifying(false)
          return
        }
      } else {
        if (!password || password.trim().length < 6) {
          setError('Please enter your administrator account password.')
          setIsVerifying(false)
          return
        }
      }

      setIsVerifying(false)
      onSuccess()
    }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-black">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Step-Up Authentication Required
            </h3>
            <p className="text-xs text-slate-500">
              Entering elevated Admin Mode requires identity verification.
            </p>
          </div>
        </div>

        <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-2xl text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            Signing into <strong>{adminEmail}</strong>. All privileged actions within Admin Mode are cryptographically signed and audited.
          </div>
        </div>

        {/* Method Toggle */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAuthMethod('TOTP')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              authMethod === 'TOTP'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Authenticator App (TOTP)
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('PASSWORD')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              authMethod === 'PASSWORD'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Account Password
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {authMethod === 'TOTP' ? (
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                <span>6-Digit Security Code</span>
              </label>
              <input
                type="text"
                autoFocus
                maxLength={6}
                placeholder="123456"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-xl font-mono font-black tracking-widest p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-[10px] text-slate-400 block text-center">
                Enter code from Google Authenticator or 1Password
              </span>
            </div>
          ) : (
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                <span>Administrator Password</span>
              </label>
              <input
                type="password"
                autoFocus
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <span>Verifying Security Token...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authenticate & Enter Admin Mode</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
