'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  UserPlus,
  Shield,
  Lock,
  Unlock,
  Key,
  RotateCcw,
  Archive,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  Phone,
  Smartphone,
} from 'lucide-react'
import { MOCK_USERS } from '../mockData'
import { UserAccount } from '../types'
import { useAdminToast } from '../AdminToast'

export function UsersAccessTab() {
  const { showToast } = useAdminToast()
  const [users, setUsers] = useState<UserAccount[]>(MOCK_USERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState<{
    type: 'SUSPEND' | 'REACTIVATE' | 'RESET_MFA' | 'REVOKE_SESSIONS' | 'LOCK' | 'ARCHIVE'
    user: UserAccount
  } | null>(null)
  const [actionReason, setActionReason] = useState('')

  useEffect(() => {
    fetch('/api/admin/overview')
      .then((res) => res.json())
      .then((data) => {
        if (data.users && data.users.length > 0) {
          setUsers(data.users)
        }
      })
      .catch((err) => console.warn('Failed to fetch live users:', err))
  }, [])

  // New Invite Form State
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'PARTNER' as 'PARTNER' | 'BUSINESS' | 'ADMIN',
    password: '',
    confirmPassword: '',
  })

  const [savingUser, setSavingUser] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const closeInvite = () => {
    setShowInviteModal(false)
    setInviteForm({ name: '', email: '', phone: '', role: 'PARTNER', password: '', confirmPassword: '' })
    setInviteError('')
    setShowPassword(false)
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleExecuteAction = () => {
    if (!showActionModal) return
    const { type, user } = showActionModal

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === user.id) {
          if (type === 'SUSPEND') return { ...u, status: 'SUSPENDED' }
          if (type === 'REACTIVATE') return { ...u, status: 'ACTIVE' }
          if (type === 'LOCK') return { ...u, status: 'LOCKED' }
          if (type === 'ARCHIVE') return { ...u, status: 'ARCHIVED' }
          if (type === 'RESET_MFA') return { ...u, mfaEnabled: false }
        }
        return u
      })
    )

    showToast('info', `User Action: ${type}`, `Action executed for ${user.name}. Reason: "${actionReason || 'Administrative update'}".`)
    setShowActionModal(null)
    setActionReason('')
  }

  const handleCreateInvite = async (event: React.FormEvent) => {
    event.preventDefault()
    if (savingUser) return
    setInviteError('')
    if (inviteForm.password !== inviteForm.confirmPassword) {
      setInviteError('Passwords do not match.')
      return
    }
    setSavingUser(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to create account.')
      setUsers(previous => [data.user, ...previous])
      closeInvite()
      showToast('success', 'Account created', data.user.email + ' can now sign in with the password you set.')
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Unable to create account.')
    } finally {
      setSavingUser(false)
    }
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Users & Access Management</span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded-full">
              C/R/U/Archive
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Partner & Business accounts, internal staff, role assignments and account security.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create User Account</span>
        </button>
      </div>

      {/* Immutability Notice Alert */}
      <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Immutable Record Policy:</strong> User accounts with transaction histories or audit traces cannot be permanently deleted. Use <strong>Archive</strong> or <strong>Suspend</strong>.
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone (+255...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="ALL">All Roles</option>
            <option value="PARTNER">Partner (Affiliate/Influencer)</option>
            <option value="BUSINESS">Business (Deal Publisher)</option>
            <option value="STAFF">Internal Staff</option>
            <option value="ADMIN">Platform Administrator</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="LOCKED">Locked (Compromised)</option>
            <option value="ARCHIVED">Archived (Deactivated)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[750px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">User & Contact</th>
              <th className="p-3">Role</th>
              <th className="p-3">Security & MFA</th>
              <th className="p-3">KYC Status</th>
              <th className="p-3">Transactions / Balance</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No registered users or accounts found matching current query.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-extrabold text-slate-900 dark:text-white">{user.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>{user.email}</span>
                    <span>·</span>
                    <span>{user.phone}</span>
                  </div>
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      user.role === 'PARTNER'
                        ? 'bg-blue-100 text-blue-800'
                        : user.role === 'BUSINESS'
                        ? 'bg-orange-100 text-[#FF6A00]'
                        : user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>

                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    {user.mfaEnabled ? (
                      <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5" /> MFA Active
                      </span>
                    ) : (
                      <span className="text-amber-600 font-bold text-[11px]">No MFA</span>
                    )}
                  </div>
                </td>

                <td className="p-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      user.kycStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : user.kycStatus === 'UNDER_REVIEW'
                        ? 'bg-amber-100 text-amber-700'
                        : user.kycStatus === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {user.kycStatus}
                  </span>
                </td>

                <td className="p-3 font-mono">
                  <div className="text-slate-900 dark:text-white font-bold">
                    TZS {user.balanceTZS.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">{user.totalTransactions} txs</div>
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      user.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : user.status === 'SUSPENDED'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : user.status === 'LOCKED'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>

                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {user.status === 'ACTIVE' ? (
                      <button
                        onClick={() => setShowActionModal({ type: 'SUSPEND', user })}
                        className="p-1 text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Suspend Account"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowActionModal({ type: 'REACTIVATE', user })}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        title="Reactivate Account"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => setShowActionModal({ type: 'RESET_MFA', user })}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Reset MFA"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setShowActionModal({ type: 'ARCHIVE', user })}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                      title="Archive / Deactivate"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <form onSubmit={handleCreateInvite} role="dialog" aria-modal="true" aria-label="Create user account" className="max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#FF6A00]" />
              <span>Create User Account</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label htmlFor="new-user-name" className="font-bold block mb-1">Full Name</label>
                <input
                  id="new-user-name" required disabled={savingUser} minLength={2} maxLength={120}
                  type="text"
                  placeholder="e.g. Asha Bakari"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label htmlFor="new-user-email" className="font-bold block mb-1">Email Address</label>
                <input
                  id="new-user-email" required disabled={savingUser} autoComplete="off"
                  type="email"
                  placeholder="e.g. asha@lumo.co.tz"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label htmlFor="new-user-phone" className="font-bold block mb-1">Phone Number (Tanzania)</label>
                <input
                  id="new-user-phone" required disabled={savingUser} inputMode="tel"
                  type="text"
                  placeholder="+255 7XX XXX XXX"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label htmlFor="new-user-role" className="font-bold block mb-1">Assigned Role</label>
                <select
                  id="new-user-role" disabled={savingUser}
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >

                  <option value="PARTNER">Partner / Affiliate</option>
                  <option value="BUSINESS">Business User</option>
                  <option value="ADMIN">Platform Administrator</option>
                </select>
              </div>
            </div>

            <fieldset className="space-y-3 text-xs" disabled={savingUser}>
              <legend className="font-bold mb-2">Login credentials</legend>
              <p className="text-slate-500">Use the email above and this password to sign in.</p>
              {(['password', 'confirmPassword'] as const).map(field => (
                <div key={field}>
                  <label htmlFor={field} className="font-bold block mb-1">{field === 'password' ? 'Password' : 'Confirm password'}</label>
                  <input id={field} name={field} type={showPassword ? 'text' : 'password'} required minLength={12} maxLength={128}
                    autoComplete="new-password" value={inviteForm[field]}
                    onChange={event => setInviteForm({ ...inviteForm, [field]: event.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                </div>
              ))}
              <p className="text-slate-500">At least 12 characters, with uppercase, lowercase and a number.</p>
              <label className="flex items-center gap-2"><input type="checkbox" checked={showPassword} onChange={event => setShowPassword(event.target.checked)} />Show passwords</label>
            </fieldset>
            {inviteError && <p role="alert" className="text-xs text-red-600">{inviteError}</p>}
            <div className="flex gap-2 pt-2">
              <button
                type="submit" disabled={savingUser}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs"
              >
                {savingUser ? 'Creating account...' : 'Create Account'}
              </button>
              <button
                type="button" disabled={savingUser} onClick={closeInvite}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONTROLLED ACTION MODAL WITH MANDATORY REASON */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Confirm Administrative Action: {showActionModal.type}</span>
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Target Account: <strong>{showActionModal.user.name}</strong> ({showActionModal.user.email})
            </p>

            <div className="text-xs space-y-1">
              <label className="font-bold block">
                Mandatory Reason for Audit Log <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Specify regulatory, compliance or security reason for this decision..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExecuteAction}
                className="flex-1 py-2.5 bg-[#0B132B] dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold rounded-xl text-xs"
              >
                Confirm & Log Decision
              </button>
              <button
                onClick={() => setShowActionModal(null)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
