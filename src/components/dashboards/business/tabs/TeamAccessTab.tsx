'use client'

import React, { useState } from 'react'
import {
  UserPlus,
  Users,
  Plus,
  Shield,
  Trash2,
  Mail,
  Lock,
  X,
} from 'lucide-react'
import { MOCK_TEAM_MEMBERS } from '../mockData'
import { BusinessTeamMember } from '../types'
import { useBusinessToast } from '../BusinessToast'

export function TeamAccessTab() {
  const { showToast } = useBusinessToast()

  const [team, setTeam] = useState<BusinessTeamMember[]>(MOCK_TEAM_MEMBERS)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'CAMPAIGN_MANAGER' as BusinessTeamMember['role'],
  })

  const handleInvite = () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      showToast('error', 'Validation Error', 'Colleague name and corporate email are required.')
      return
    }

    const created: BusinessTeamMember = {
      id: `team_${Date.now()}`,
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      status: 'INVITED',
      lastLogin: 'Pending invitation accept',
      joinedDate: 'Today',
    }

    setTeam([...team, created])
    setShowInviteModal(false)
    setInviteForm({ name: '', email: '', role: 'CAMPAIGN_MANAGER' })
    showToast('success', 'Invitation Dispatched', `Onboarding link sent to ${created.email}.`)
  }

  const handleRevoke = (id: string, name: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== id))
    showToast('info', 'Access Revoked', `Team access for ${name} revoked.`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Team Members & Portal Access Roles</span>
            <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-2 py-0.5 rounded-full">
              C/R/U/Revoke
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employees authorized to operate campaigns, approve partner deliverables, and review billing statements.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Role Segregation Notice */}
      <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <strong>Role Segregation Rule:</strong> Business roles (Owner, Campaign Manager, Finance Officer, Support Agent) control internal workspace access. Business roles cannot grant platform-level LUMO administrator privileges.
        </div>
      </div>

      {/* Team Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[600px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b">
            <tr>
              <th className="p-3">Team Member</th>
              <th className="p-3">Portal Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last Active</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {team.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3">
                  <div className="font-extrabold text-slate-900 dark:text-white">{member.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{member.email}</div>
                </td>

                <td className="p-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">
                    {member.role.replace(/_/g, ' ')}
                  </span>
                </td>

                <td className="p-3">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      member.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {member.status}
                  </span>
                </td>

                <td className="p-3 text-slate-500 text-[11px]">{member.lastLogin}</td>

                <td className="p-3 text-right">
                  {member.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRevoke(member.id, member.name)}
                      className="p-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Invite Team Member
                </h3>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Colleague Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Neema Mwangi"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  placeholder="neema@kijanisolar.co.tz"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Business Portal Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                >
                  <option value="CAMPAIGN_MANAGER">Campaign Manager (Create deals & manage partners)</option>
                  <option value="FINANCE_OFFICER">Finance Officer (Escrow funding & invoices)</option>
                  <option value="SUPPORT_AGENT">Support Agent (Respond to partner messages)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleInvite}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl shadow-xs"
              >
                Send Portal Invitation
              </button>
              <button onClick={() => setShowInviteModal(false)} className="py-2.5 px-4 border rounded-xl font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
