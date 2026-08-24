'use client'

import React, { useState } from 'react'
import {
  Shield,
  Key,
  Smartphone,
  CheckCircle2,
  Lock,
  Bell,
  Sliders,
  LogOut,
} from 'lucide-react'
import { useBusinessToast } from '../BusinessToast'

export function SettingsSecurityTab() {
  const { showToast } = useBusinessToast()

  const [mfaEnabled, setMfaEnabled] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [smsPayoutAlerts, setSmsPayoutAlerts] = useState(true)
  const [twoPersonRuleApproval, setTwoPersonRuleApproval] = useState(true)

  const handleRevokeSessions = () => {
    showToast('info', 'Sessions Terminated', 'All other active sessions have been revoked.')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Security, MFA & Notification Preferences</span>
            <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-2 py-0.5 rounded-full">
              Read / Update
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-factor authentication, active devices, and escrow withdrawal threshold controls.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Security Controls */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#FF6A00]" />
            <span>Account Security & MFA</span>
          </h3>

          <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border cursor-pointer">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Two-Factor Authentication (MFA)</span>
              <span className="text-[10px] text-slate-400">Enforce TOTP authenticator code on login</span>
            </div>
            <input
              type="checkbox"
              checked={mfaEnabled}
              onChange={(e) => {
                setMfaEnabled(e.target.checked)
                showToast('info', 'MFA Updated', `Two-factor authentication is ${e.target.checked ? 'enforced' : 'disabled'}.`)
              }}
              className="w-4 h-4 text-[#FF6A00] rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border cursor-pointer">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Dual-Signature on Escrow Top-Ups</span>
              <span className="text-[10px] text-slate-400">Require 2 authorized managers for amounts &gt; TZS 5,000,000</span>
            </div>
            <input
              type="checkbox"
              checked={twoPersonRuleApproval}
              onChange={(e) => setTwoPersonRuleApproval(e.target.checked)}
              className="w-4 h-4 text-[#FF6A00] rounded"
            />
          </label>

          <div className="pt-2">
            <button
              onClick={handleRevokeSessions}
              className="w-full py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-bold hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Revoke All Other Active Sessions</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            <span>Operational Notification Alerts</span>
          </h3>

          <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border cursor-pointer">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Instant Conversion Alerts</span>
              <span className="text-[10px] text-slate-400">Email notice whenever a Partner records a verified outcome</span>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 text-[#FF6A00] rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border cursor-pointer">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">SMS Escrow Balance Warnings</span>
              <span className="text-[10px] text-slate-400">SMS alert when committed reward escrow dips below 20%</span>
            </div>
            <input
              type="checkbox"
              checked={smsPayoutAlerts}
              onChange={(e) => setSmsPayoutAlerts(e.target.checked)}
              className="w-4 h-4 text-[#FF6A00] rounded"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
