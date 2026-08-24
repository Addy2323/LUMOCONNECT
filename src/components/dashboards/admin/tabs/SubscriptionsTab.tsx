'use client'

import React, { useState } from 'react'
import {
  CreditCard,
  Search,
  Plus,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  RotateCcw,
  Shield,
  Zap,
  X,
  Edit,
} from 'lucide-react'
import { MOCK_SUBSCRIPTION_LEDGER } from '../mockData'
import { SubscriptionTransaction } from '../types'
import { useAdminToast } from '../AdminToast'

export function SubscriptionsTab() {
  const { showToast } = useAdminToast()

  const [ledger, setLedger] = useState<SubscriptionTransaction[]>(MOCK_SUBSCRIPTION_LEDGER)
  const [searchQuery, setSearchQuery] = useState('')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showPlanConfigModal, setShowPlanConfigModal] = useState(false)
  const [plans, setPlans] = useState([
    { code: 'MONTHLY', name: 'Monthly Starter', priceTZS: 35000, days: 30, activeCount: 4120 },
    { code: 'SEMI_ANNUAL', name: 'Semi-Annual Pro', priceTZS: 180000, days: 180, activeCount: 1890 },
    { code: 'ENTERPRISE_AI', name: 'Enterprise AI & Custom API', priceTZS: 1500000, days: 365, activeCount: 42 },
  ])

  const [editingPlan, setEditingPlan] = useState<typeof plans[0] | null>(null)

  const filteredLedger = ledger.filter((item) => {
    const matchesSearch =
      item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.providerRef.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlan = planFilter === 'ALL' || item.planCode === planFilter
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
    return matchesSearch && matchesPlan && matchesStatus
  })

  const handleExtendSubscription = (id: string, additionalDays: number) => {
    setLedger((prev) =>
      prev.map((sub) => {
        if (sub.id === id) {
          return {
            ...sub,
            status: 'ACTIVE',
            expiresAt: `Extended (+${additionalDays} days)`,
          }
        }
        return sub
      })
    )
    showToast('success', 'Subscription Extended', `Access extended by ${additionalDays} days. Audit ledger updated.`)
  }

  const handleCancelSubscription = (id: string) => {
    setLedger((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: 'CANCELLED' } : sub))
    )
    showToast('info', 'Subscription Cancelled', 'Status changed to Cancelled. Financial transactions remain immutable.')
  }

  const handleSavePlanEdit = () => {
    if (!editingPlan) return
    setPlans((prev) =>
      prev.map((p) => (p.code === editingPlan.code ? editingPlan : p))
    )
    setEditingPlan(null)
    setShowPlanConfigModal(false)
    showToast('success', 'Subscription Plan Updated', `Plan pricing and terms updated for ${editingPlan.name}.`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Subscriptions & Access Plans</span>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded-full">
              Mixed CRUD + Workflow
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Monthly, Semi-Annual, and Enterprise AI memberships. Subscription financial records are immutable.
          </p>
        </div>

        <button
          onClick={() => setShowPlanConfigModal(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto active:scale-[0.99]"
        >
          <Sparkles className="w-4 h-4" />
          <span>Configure Subscription Plans</span>
        </button>
      </div>

      {/* 3 Plan Definition Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div
            key={p.code}
            className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                  {p.name}
                </span>
                <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border font-bold">
                  {p.days} Days
                </span>
              </div>
              <div className="text-xl font-black text-[#FF6A00] font-mono mt-1">
                TZS {p.priceTZS.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500">Active Subscribers:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {p.activeCount.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by subscriber name or provider reference (MPESA-VOD...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="ALL">All Plans</option>
            <option value="MONTHLY">Monthly Starter</option>
            <option value="SEMI_ANNUAL">Semi-Annual Pro</option>
            <option value="ENTERPRISE_AI">Enterprise AI</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="PAST_DUE">Past Due</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* Subscription Ledger Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[750px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">Subscriber</th>
              <th className="p-3">Plan Name</th>
              <th className="p-3">Provider Reference</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Validity Period</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filteredLedger.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3">
                  <div className="font-extrabold text-slate-900 dark:text-white">{sub.userName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">ID: {sub.userId}</div>
                </td>

                <td className="p-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{sub.planName}</span>
                </td>

                <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {sub.providerRef}
                </td>

                <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                  TZS {sub.amountTZS.toLocaleString()}
                </td>

                <td className="p-3 text-[11px] text-slate-500">
                  {sub.startsAt} → {sub.expiresAt}
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      sub.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : sub.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sub.status}
                  </span>
                </td>

                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      onClick={() => handleExtendSubscription(sub.id, 30)}
                      className="py-1 px-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100"
                      title="Extend +30 Days"
                    >
                      +30 Days
                    </button>

                    {sub.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleCancelSubscription(sub.id)}
                        className="py-1 px-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100"
                        title="Cancel Subscription"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CONFIGURE SUBSCRIPTION PLANS MODAL */}
      {showPlanConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center font-black">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Configure Subscription Plans & Pricing
                  </h3>
                  <div className="text-[11px] text-slate-500">Edit plan pricing (TZS), duration, and AI perks</div>
                </div>
              </div>

              <button
                onClick={() => setShowPlanConfigModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {plans.map((p) => (
                <div
                  key={p.code}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{p.name}</h4>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Duration: {p.days} Days · Active members: {p.activeCount}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-[#FF6A00] font-mono">
                      TZS {p.priceTZS.toLocaleString()}
                    </span>
                    <button
                      onClick={() => setEditingPlan(p)}
                      className="py-1 px-2.5 border rounded-lg hover:bg-white dark:hover:bg-slate-900 text-xs font-bold"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}

              {editingPlan && (
                <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 space-y-3 pt-3">
                  <div className="font-bold text-xs text-orange-900 dark:text-orange-200">
                    Editing Plan: {editingPlan.name}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">Price (TZS)</label>
                      <input
                        type="number"
                        value={editingPlan.priceTZS}
                        onChange={(e) => setEditingPlan({ ...editingPlan, priceTZS: Number(e.target.value) })}
                        className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Validity (Days)</label>
                      <input
                        type="number"
                        value={editingPlan.days}
                        onChange={(e) => setEditingPlan({ ...editingPlan, days: Number(e.target.value) })}
                        className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePlanEdit}
                      className="py-1.5 px-4 bg-[#FF6A00] text-white font-bold rounded-lg text-xs"
                    >
                      Save Plan Changes
                    </button>
                    <button
                      onClick={() => setEditingPlan(null)}
                      className="py-1.5 px-3 border rounded-lg text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowPlanConfigModal(false)}
                className="py-2 px-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl"
              >
                Close Plan Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
