'use client'

import React, { useState } from 'react'
import {
  User,
  X,
  Key,
  Shield,
  Smartphone,
  Laptop,
  Globe,
  Clock,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  RefreshCw,
} from 'lucide-react'
import { AdminRole } from './types'

interface AdminProfileModalProps {
  isOpen: boolean
  onClose: () => void
  adminName?: string
  adminRole?: string
  onSwitchRole?: (role: AdminRole) => void
  onSignOut?: () => void
}

export function AdminProfileModal({
  isOpen,
  onClose,
  adminName = 'Given M.',
  adminRole = 'Super Administrator',
  onSwitchRole,
  onSignOut,
}: AdminProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions' | 'activity' | 'roles'>('profile')
  const [profileData, setProfileData] = useState({
    name: adminName,
    email: 'given@lumo.co.tz',
    phone: '+255 784 000 111',
    title: 'Head of Operations & Platform Architecture',
  })
  const [mfaEnabled, setMfaEnabled] = useState(true)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [sessions, setSessions] = useState([
    {
      id: 'sess_1',
      device: 'Chrome 128 on Windows 11 (Current)',
      ip: '197.250.2.14',
      location: 'Dar es Salaam, Tanzania',
      lastActive: 'Active now',
      current: true,
    },
    {
      id: 'sess_2',
      device: 'Safari on iPhone 15 Pro',
      ip: '102.164.88.21',
      location: 'Dar es Salaam, Tanzania',
      lastActive: '2 hours ago',
      current: false,
    },
  ])

  const [personalActivity] = useState([
    { action: 'Approved Maker-Checker Batch LUMO-DISB-2026-W08', time: 'Today, 09:30 AM' },
    { action: 'Reviewed BRELA Verification for MobiPay Africa', time: 'Today, 10:42 AM' },
    { action: 'Inspected Fraud Alert Case RISK-2026-089', time: 'Today, 10:55 AM' },
    { action: 'Closed Reconciliation Run for M-Pesa Week 3', time: '19 Feb 2026' },
  ])

  if (!isOpen) return null

  const handleRevokeOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.current))
  }

  const authorizedRoles: { role: AdminRole; label: string; desc: string; isHighPrivilege?: boolean }[] = [
    {
      role: 'SUPER_ADMIN',
      label: 'Super Administrator',
      desc: 'Full platform oversight & emergency operations.',
      isHighPrivilege: true,
    },
    {
      role: 'MAKER_OPERATIONS',
      label: 'Maker / Operations Admin',
      desc: 'Deal drafting, initial submissions, user onboarding.',
    },
    {
      role: 'CHECKER_COMPLIANCE',
      label: 'Checker / Compliance Admin',
      desc: 'Second-pair-of-eyes approvals, KYC verification, disbursements.',
    },
    {
      role: 'FINANCE_ADMIN',
      label: 'Finance Administrator',
      desc: 'Reconciliation, TRA tax statements, payment ledgers.',
    },
    {
      role: 'SUPPORT_OFFICER',
      label: 'Support & Disputes Officer',
      desc: 'Dispute investigation, evidence collection, tickets.',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0B132B] text-white font-black text-sm flex items-center justify-center shadow-xs">
              GM
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {profileData.name}
              </h2>
              <div className="text-xs text-slate-500 font-medium">
                {adminRole} · {profileData.email}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs font-bold overflow-x-auto no-scrollbar">
          {[
            { id: 'profile', label: 'My Profile' },
            { id: 'security', label: 'Security & MFA' },
            { id: 'sessions', label: `Active Sessions (${sessions.length})` },
            { id: 'activity', label: 'Personal Audit' },
            { id: 'roles', label: 'Switch Role' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#FF6A00] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={profileData.email}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  value={profileData.title}
                  onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <button className="py-2 px-4 bg-[#0B132B] dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-2xs">
              Save Profile Changes
            </button>
          </div>
        )}

        {/* TAB 2: SECURITY & MFA */}
        {activeTab === 'security' && (
          <div className="space-y-4 text-xs">
            {/* MFA Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Two-Factor Authentication (MFA / TOTP)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded">
                      ENFORCED
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Required for all administrator actions (Maker-Checker & Payouts).
                  </div>
                </div>
              </div>

              <button
                onClick={() => setMfaEnabled(!mfaEnabled)}
                className="py-1.5 px-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mfaEnabled ? 'Reconfigure App' : 'Enable MFA'}
              </button>
            </div>

            {/* Password Change */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Password & Authentication Key
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Last rotated 38 days ago. Minimum 12 characters with symbol.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="py-1.5 px-3 bg-[#0B132B] text-white rounded-xl font-bold"
                >
                  Change Password
                </button>
              </div>

              {showPasswordChange && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                  <input
                    type="password"
                    placeholder="Current Password"
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="password"
                    placeholder="New Secure Password"
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <button className="py-1.5 px-3 bg-[#FF6A00] text-white font-bold rounded-lg text-xs">
                    Update Password Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVE SESSIONS */}
        {activeTab === 'sessions' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">
                Manage logged-in devices authorized for this admin account.
              </span>
              {sessions.length > 1 && (
                <button
                  onClick={handleRevokeOtherSessions}
                  className="text-red-600 hover:text-red-700 font-bold"
                >
                  Revoke Other Sessions
                </button>
              )}
            </div>

            <div className="space-y-2">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{sess.device}</span>
                        {sess.current && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.2 rounded">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        IP: {sess.ip} · {sess.location} · {sess.lastActive}
                      </div>
                    </div>
                  </div>

                  {!sess.current && (
                    <button
                      onClick={() => setSessions(sessions.filter((s) => s.id !== sess.id))}
                      className="text-xs text-red-600 font-bold hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PERSONAL AUDIT TRAIL */}
        {activeTab === 'activity' && (
          <div className="space-y-3 text-xs">
            <div className="text-slate-500">
              Immutable record of sensitive operations executed under your signature.
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {personalActivity.map((act, i) => (
                <div key={i} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-900 dark:text-white">{act.action}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SWITCH AUTHORIZED ROLE */}
        {activeTab === 'roles' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200">
              <div className="font-bold flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Anti-Self-Promotion Policy Enforced</span>
              </div>
              <div className="text-[11px] mt-0.5">
                Administrators can only switch between roles pre-assigned by platform governance. Self-elevation of permissions is strictly prohibited.
              </div>
            </div>

            <div className="space-y-2">
              {authorizedRoles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    onSwitchRole?.(r.role)
                    onClose()
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center justify-between text-left"
                >
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{r.label}</span>
                      {r.isHighPrivilege && (
                        <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded">
                          Dual-Control Required
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{r.desc}</div>
                  </div>
                  <span className="text-xs text-[#FF6A00] font-bold">Switch</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onSignOut}
            className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Admin Console</span>
          </button>

          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
