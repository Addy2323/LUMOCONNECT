'use client'

import React, { useState } from 'react'
import {
  UserCog,
  Shield,
  Plus,
  Lock,
  Key,
  CheckCircle2,
  AlertTriangle,
  Users,
  X,
  Sliders,
  Check,
} from 'lucide-react'
import { useAdminToast } from '../AdminToast'

export function RolesPermissionsTab() {
  const { showToast } = useAdminToast()

  const [roles, setRoles] = useState([
    {
      name: 'Super Administrator',
      code: 'SUPER_ADMIN',
      members: 2,
      desc: 'Complete platform authority, emergency controls, and settings rollback.',
      dualControlRequired: true,
      permissions: ['DEALS_CREATE_DRAFT', 'DEALS_CHECKER_APPROVE', 'KYB_VERIFY', 'PAYOUTS_CHECKER_APPROVE', 'RECONCILIATION_RUN', 'SYSTEM_SETTINGS_WRITE', 'AUDIT_EXPORT'],
    },
    {
      name: 'Maker / Operations Admin',
      code: 'MAKER_OPERATIONS',
      members: 4,
      desc: 'Deal drafting, partner onboarding, manual conversion entry.',
      dualControlRequired: false,
      permissions: ['DEALS_CREATE_DRAFT', 'USERS_INVITE', 'CONTENT_MANAGE', 'NOTIFICATIONS_SEND'],
    },
    {
      name: 'Checker / Compliance Officer',
      code: 'CHECKER_COMPLIANCE',
      members: 3,
      desc: 'Second-pair-of-eyes approvals, KYB/KYC verification, payout authorizations.',
      dualControlRequired: true,
      permissions: ['DEALS_CHECKER_APPROVE', 'KYB_VERIFY', 'PAYOUTS_CHECKER_APPROVE', 'RISK_HOLD_APPLY'],
    },
    {
      name: 'Finance & Reconciliation Admin',
      code: 'FINANCE_ADMIN',
      members: 3,
      desc: 'Telco reconciliation, TRA tax statement calculation, accounting exports.',
      dualControlRequired: false,
      permissions: ['RECONCILIATION_RUN', 'TAX_MANAGE', 'PAYMENTS_LEDGER_VIEW', 'PAYOUTS_BATCH_CREATE'],
    },
    {
      name: 'Disputes & Support Officer',
      code: 'SUPPORT_OFFICER',
      members: 5,
      desc: 'Case mediation, evidence review, customer ticket escalation.',
      dualControlRequired: false,
      permissions: ['DISPUTES_INVESTIGATE', 'DISPUTES_RESOLVE', 'USERS_VIEW_HISTORY'],
    },
  ])

  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)
  const [configuringRole, setConfiguringRole] = useState<typeof roles[0] | null>(null)

  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    code: '',
    desc: '',
    dualControlRequired: false,
    selectedPerms: ['DEALS_CREATE_DRAFT', 'USERS_INVITE'],
  })

  const ALL_PERMISSIONS = [
    { code: 'DEALS_CREATE_DRAFT', label: 'Create Deal Drafts', group: 'Deals' },
    { code: 'DEALS_CHECKER_APPROVE', label: 'Authorize & Publish Deals (Checker)', group: 'Deals' },
    { code: 'KYB_VERIFY', label: 'Verify Business KYB & TIN', group: 'Compliance' },
    { code: 'RISK_HOLD_APPLY', label: 'Apply Anti-Fraud Holds', group: 'Risk' },
    { code: 'PAYOUTS_BATCH_CREATE', label: 'Prepare Payout Batches (Maker)', group: 'Finance' },
    { code: 'PAYOUTS_CHECKER_APPROVE', label: 'Authorize Mobile Money Payouts (Checker)', group: 'Finance' },
    { code: 'RECONCILIATION_RUN', label: 'Run Telco Reconciliation', group: 'Finance' },
    { code: 'TAX_MANAGE', label: 'Update TRA Statutory Tax Rules', group: 'Finance' },
    { code: 'DISPUTES_RESOLVE', label: 'Resolve & Mediate Disputes', group: 'Support' },
    { code: 'SYSTEM_SETTINGS_WRITE', label: 'Modify Platform Settings', group: 'System' },
  ]

  const handleCreateRole = () => {
    if (!newRoleForm.name.trim() || !newRoleForm.code.trim()) {
      showToast('error', 'Validation Error', 'Role Name and System Code are required.')
      return
    }

    const created = {
      name: newRoleForm.name,
      code: newRoleForm.code.toUpperCase().replace(/\s+/g, '_'),
      members: 0,
      desc: newRoleForm.desc || 'Custom internal platform role.',
      dualControlRequired: newRoleForm.dualControlRequired,
      permissions: newRoleForm.selectedPerms,
    }

    setRoles([...roles, created])
    setShowCreateRoleModal(false)
    setNewRoleForm({
      name: '',
      code: '',
      desc: '',
      dualControlRequired: false,
      selectedPerms: ['DEALS_CREATE_DRAFT', 'USERS_INVITE'],
    })

    showToast('success', 'Role Created', `Role "${created.name}" registered with ${created.permissions.length} permissions.`)
  }

  const handleToggleRolePerm = (permCode: string) => {
    if (!configuringRole) return
    const updatedPerms = configuringRole.permissions.includes(permCode)
      ? configuringRole.permissions.filter((p) => p !== permCode)
      : [...configuringRole.permissions, permCode]

    setConfiguringRole({ ...configuringRole, permissions: updatedPerms })
    setRoles((prev) =>
      prev.map((r) => (r.code === configuringRole.code ? { ...r, permissions: updatedPerms } : r))
    )
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Internal Roles, Privileges & Maker-Checker Matrix</span>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded-full">
              C/R/U/Revoke
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC) governing Maker-Checker segregation and preventing self-promotion.
          </p>
        </div>

        <button
          onClick={() => setShowCreateRoleModal(true)}
          className="py-2.5 px-4 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4 text-[#FF6A00]" />
          <span>Create Custom Internal Role</span>
        </button>
      </div>

      {/* Dual Control Notice */}
      <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <strong>Dual-Control Protection:</strong> Assigning powerful roles (Super Admin, Checker) requires two-person approval. Self-promotion is cryptographically blocked by the identity kernel.
        </div>
      </div>

      {/* Roles List */}
      <div className="space-y-3">
        {roles.map((r) => (
          <div
            key={r.code}
            className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {r.name}
                </h4>
                <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border text-slate-500 font-bold">
                  {r.code}
                </span>
                {r.dualControlRequired && (
                  <span className="text-[9px] bg-purple-100 text-purple-700 font-extrabold px-1.5 py-0.2 rounded">
                    Dual-Control Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 max-w-xl">{r.desc}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="font-bold text-xs text-slate-900 dark:text-white">{r.members} assigned staff</div>
                <div className="text-[10px] text-emerald-600 font-bold">
                  {r.permissions.length} Active Permissions
                </div>
              </div>

              <button
                onClick={() => setConfiguringRole(r)}
                className="py-1.5 px-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-white dark:hover:bg-slate-900 transition-colors"
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE CUSTOM ROLE MODAL */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center font-black">
                  <UserCog className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Create Custom Internal Role
                  </h3>
                  <div className="text-[11px] text-slate-500">Define role scope, dual-control policy and permission toggles</div>
                </div>
              </div>

              <button
                onClick={() => setShowCreateRoleModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Role Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Auditor"
                    value={newRoleForm.name}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">System Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SENIOR_AUDITOR"
                    value={newRoleForm.code}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Role Description</label>
                <textarea
                  rows={2}
                  placeholder="Outline the responsibilities and restrictions of this role..."
                  value={newRoleForm.desc}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, desc: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <label className="flex items-center justify-between p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Require Dual-Control (2-Person Rule)</span>
                  <span className="text-[10px] text-slate-500">Actions by this role must be counter-signed by a Compliance Checker</span>
                </div>
                <input
                  type="checkbox"
                  checked={newRoleForm.dualControlRequired}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, dualControlRequired: e.target.checked })}
                  className="w-4 h-4 text-[#FF6A00] rounded"
                />
              </label>

              <div>
                <label className="font-extrabold block uppercase tracking-wider text-[10px] text-slate-400 mb-1.5">
                  Initial Permission Grants
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = newRoleForm.selectedPerms.includes(perm.code)
                    return (
                      <label
                        key={perm.code}
                        className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 cursor-pointer text-[11px]"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRoleForm({
                                ...newRoleForm,
                                selectedPerms: [...newRoleForm.selectedPerms, perm.code],
                              })
                            } else {
                              setNewRoleForm({
                                ...newRoleForm,
                                selectedPerms: newRoleForm.selectedPerms.filter((p) => p !== perm.code),
                              })
                            }
                          }}
                          className="w-3.5 h-3.5 text-[#FF6A00] rounded"
                        />
                        <span className="truncate">{perm.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleCreateRole}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Register & Save Role
              </button>
              <button
                onClick={() => setShowCreateRoleModal(false)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURE ROLE DRAWER/MODAL */}
      {configuringRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Configure Permissions: {configuringRole.name}
                </h3>
                <div className="text-[11px] text-slate-500 font-mono">{configuringRole.code}</div>
              </div>

              <button
                onClick={() => {
                  setConfiguringRole(null)
                  showToast('success', 'Permissions Saved', `Role permissions updated for ${configuringRole.name}.`)
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {ALL_PERMISSIONS.map((perm) => {
                const isActive = configuringRole.permissions.includes(perm.code)
                return (
                  <button
                    key={perm.code}
                    onClick={() => handleToggleRolePerm(perm.code)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{perm.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{perm.code} · {perm.group}</div>
                    </div>
                    {isActive ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-xs text-slate-400">+</span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setConfiguringRole(null)
                  showToast('success', 'Permissions Saved', `Role permissions updated for ${configuringRole.name}.`)
                }}
                className="py-2 px-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl"
              >
                Save & Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
