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
  Trash2,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  Phone,
  Smartphone,
  Camera,
  Eye,
  ShieldCheck,
  UserCheck,
  X,
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
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserAccount | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState<{
    type: 'SUSPEND' | 'REACTIVATE' | 'RESET_MFA' | 'REVOKE_SESSIONS' | 'LOCK' | 'ARCHIVE' | 'DELETE'
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

  const handleExecuteAction = async () => {
    if (!showActionModal) return
    const { type, user } = showActionModal

    if (type === 'DELETE') {
      try {
        const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(user.id)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, reason: actionReason || 'Permanent account deletion requested by administrator.' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Action failed')

        setUsers((prev) => prev.filter((u) => u.id !== user.id))
        showToast('success', 'User Deleted Permanently', `${user.name} (${user.email}) has been permanently deleted from the system.`)
      } catch (err: any) {
        showToast('error', 'Deletion Failed', err.message || 'Could not permanently delete user.')
      }
      setShowActionModal(null)
      setActionReason('')
      return
    }

    let newStatus: UserAccount['status'] | undefined
    if (type === 'SUSPEND') newStatus = 'SUSPENDED'
    if (type === 'REACTIVATE') newStatus = 'ACTIVE'
    if (type === 'LOCK') newStatus = 'LOCKED'
    if (type === 'ARCHIVE') newStatus = 'ARCHIVED'

    if (newStatus) {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, status: newStatus }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Action failed')

        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus as any } : u))
        )
        showToast('success', `User Action: ${type}`, `Successfully updated status for ${user.name}.`)
      } catch (err: any) {
        showToast('error', `Action Failed`, err.message || 'Could not update user status.')
      }
    } else {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === user.id) {
            if (type === 'RESET_MFA') return { ...u, mfaEnabled: false }
          }
          return u
        })
      )
      showToast('info', `User Action: ${type}`, `Action executed for ${user.name}.`)
    }

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

  const getUserInitials = (name: string) => {
    if (!name) return 'US'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Users & Access Management</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
              Full Admin (CRUD)
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Partner & Business accounts, internal staff, onboarding profile pictures, security, and account status.
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

      {/* Account Administration Policy Notice Alert */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#FF6A00] shrink-0" />
          <span>
            <strong>Administrative Privileges & Verified Identity:</strong> User profile photos are captured during onboarding face scanning & KYC verification and fixed for identity integrity.
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
        <table className="w-full text-xs text-left min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">User & Profile Picture</th>
              <th className="p-3">Role</th>
              <th className="p-3">Security & MFA</th>
              <th className="p-3">KYC & Face Scan</th>
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
                <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProfileUser(user)}
                        className="relative group shrink-0"
                        title="Click to view full onboarding profile picture & face scan identity"
                      >
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/80 shadow-2xs group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white font-extrabold text-xs flex items-center justify-center border-2 border-slate-300 dark:border-slate-600 shadow-2xs group-hover:scale-105 transition-transform">
                            {getUserInitials(user.name)}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border border-white dark:border-slate-900 shadow-2xs" title="Onboarding Face Verified">
                          <ShieldCheck className="w-3 h-3" />
                        </div>
                      </button>

                      <div>
                        <div
                          onClick={() => setSelectedProfileUser(user)}
                          className="font-extrabold text-slate-900 dark:text-white hover:text-[#FF6A00] dark:hover:text-[#FF6A00] cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{user.name}</span>
                          <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline" />
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{user.email}</span>
                          <span>·</span>
                          <span>{user.phone}</span>
                        </div>
                      </div>
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

                    {user.email.toLowerCase() === 'admin@lumo.co.tz' ? (
                      <button
                        disabled
                        className="p-1 text-slate-300 dark:text-slate-600 cursor-not-allowed rounded-lg"
                        title="Primary Root Administrator cannot be deleted"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowActionModal({ type: 'DELETE', user })}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Permanently Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
            <h3 className={`text-base font-black flex items-center gap-2 ${
              showActionModal.type === 'DELETE' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
            }`}>
              {showActionModal.type === 'DELETE' ? (
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              <span>
                {showActionModal.type === 'DELETE'
                  ? 'Permanently Delete User Account'
                  : `Confirm Administrative Action: ${showActionModal.type}`}
              </span>
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Target Account: <strong>{showActionModal.user.name}</strong> ({showActionModal.user.email})
            </p>

            {showActionModal.type === 'DELETE' && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  Irreversible Action Warning
                </p>
                <p>
                  This will permanently purge <strong>{showActionModal.user.name}</strong> ({showActionModal.user.email}) from the platform. All access permissions, sessions, and associated account links will be permanently deleted.
                </p>
              </div>
            )}

            <div className="text-xs space-y-1">
              <label className="font-bold block">
                {showActionModal.type === 'DELETE' ? 'Reason for Deletion (Audit Log)' : 'Mandatory Reason for Audit Log'} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder={
                  showActionModal.type === 'DELETE'
                    ? "Specify the regulatory, administrative or fraud reason for deleting this account..."
                    : "Specify regulatory, compliance or security reason for this decision..."
                }
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExecuteAction}
                className={`flex-1 py-2.5 font-extrabold rounded-xl text-xs text-white transition-colors ${
                  showActionModal.type === 'DELETE'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#0B132B] dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800'
                }`}
              >
                {showActionModal.type === 'DELETE' ? 'Permanently Delete User' : 'Confirm & Log Decision'}
              </button>
              <button
                onClick={() => {
                  setShowActionModal(null)
                  setActionReason('')
                }}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* READ-ONLY ONBOARDING USER PROFILE & FACE SCAN IDENTITY MODAL */}
      {selectedProfileUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-[#FF6A00]">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  User Profile & Face Scan Identity
                </span>
              </div>
              <button
                onClick={() => setSelectedProfileUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Picture Card */}
            <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700 relative">
              <div className="relative mb-3">
                {selectedProfileUser.image ? (
                  <img
                    src={selectedProfileUser.image}
                    alt={selectedProfileUser.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-emerald-500 shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-white font-black text-2xl flex items-center justify-center border-4 border-slate-700 shadow-md">
                    {getUserInitials(selectedProfileUser.name)}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white dark:border-slate-900 shadow-xs" title="Onboarding Face Scan Verified">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {selectedProfileUser.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {selectedProfileUser.email}
              </p>

              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-full text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold">
                <UserCheck className="w-3.5 h-3.5" />
                <span>ONBOARDING FACE VERIFIED · FIXED IDENTITY RECORD</span>
              </div>
            </div>

            {/* Read-Only Identity Security Notice */}
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Read-Only Identity Profile Photo</span>
                <span className="text-[11px] leading-relaxed">
                  Captured during user onboarding & face scanning KYC. This profile photo is permanently bound to this user account for security and fraud protection and cannot be modified.
                </span>
              </div>
            </div>

            {/* Account Metadata Grid */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 font-semibold">User Role</span>
                  <span className="font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 text-[10px]">
                    {selectedProfileUser.role}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 font-semibold">Phone Number</span>
                  <span className="font-extrabold font-mono text-slate-900 dark:text-white">
                    {selectedProfileUser.phone}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 font-semibold">Account Status</span>
                  <span className="font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                    {selectedProfileUser.status}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 font-semibold">KYC Verification</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {selectedProfileUser.kycStatus || 'VERIFIED'}
                  </span>
                </div>

                {selectedProfileUser.organizationName && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 font-semibold">Business Organization</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {selectedProfileUser.organizationName}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Member Since</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {selectedProfileUser.joinedDate || '2026-01-01'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedProfileUser(null)}
                className="w-full py-2.5 bg-[#0B132B] dark:bg-slate-100 dark:text-slate-900 text-white font-extrabold rounded-xl text-xs hover:opacity-90 transition-opacity"
              >
                Close Identity Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
