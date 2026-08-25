'use client'

import React, { useState, useEffect } from 'react'
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
  UserCheck,
  Check,
  Tag,
  Gift,
} from 'lucide-react'
import {
  listSubscriptionPlans,
  updateSubscriptionPlan,
  grantUserSubscription,
  resetSubscriptionPlans,
} from '@/modules/subscriptions/service'
import type { SubscriptionPlanItem, SubscriptionPlanCode } from '@/modules/subscriptions/types'
import { MOCK_SUBSCRIPTION_LEDGER } from '../mockData'
import { SubscriptionTransaction } from '../types'
import { useAdminToast } from '../AdminToast'

export function SubscriptionsTab() {
  const { showToast } = useAdminToast()

  const [ledger, setLedger] = useState<SubscriptionTransaction[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lumo_admin_sub_ledger')
        if (saved) return JSON.parse(saved)
      } catch (e) {
        console.warn('Could not read admin sub ledger', e)
      }
    }
    return MOCK_SUBSCRIPTION_LEDGER
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([])

  // Modals
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null)
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [grantForm, setGrantForm] = useState({
    userEmail: '',
    userName: '',
    planCode: 'MONTHLY' as SubscriptionPlanCode,
    days: 30,
    amountPaidTZS: 0,
  })

  const reloadPlans = () => {
    setPlans(listSubscriptionPlans())
  }

  useEffect(() => {
    reloadPlans()
    const handleUpdate = () => reloadPlans()
    window.addEventListener('lumo:plans-updated', handleUpdate)
    return () => window.removeEventListener('lumo:plans-updated', handleUpdate)
  }, [])

  const saveLedger = (newLedger: SubscriptionTransaction[]) => {
    setLedger(newLedger)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo_admin_sub_ledger', JSON.stringify(newLedger))
    }
  }

  const filteredLedger = ledger.filter((item) => {
    const matchesSearch =
      item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.providerRef.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlan = planFilter === 'ALL' || item.planCode === planFilter
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
    return matchesSearch && matchesPlan && matchesStatus
  })

  const handleExtendSubscription = (id: string, additionalDays: number) => {
    const updated = ledger.map((sub) => {
      if (sub.id === id) {
        return {
          ...sub,
          status: 'ACTIVE' as const,
          expiresAt: `Extended (+${additionalDays} days)`,
        }
      }
      return sub
    })
    saveLedger(updated)
    showToast('success', 'Subscription Extended', `Access extended by ${additionalDays} days. Audit ledger updated.`)
  }

  const handleCancelSubscription = (id: string) => {
    const updated = ledger.map((sub) =>
      sub.id === id ? { ...sub, status: 'CANCELLED' as const } : sub
    )
    saveLedger(updated)
    showToast('info', 'Subscription Cancelled', 'Status changed to Cancelled. Financial transactions remain immutable.')
  }

  const handleSavePlanEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlan) return

    updateSubscriptionPlan(editingPlan.code, editingPlan)
    reloadPlans()
    setEditingPlan(null)
    showToast('success', 'Plan Configuration Saved', `Updated pricing and terms published live for ${editingPlan.name}.`)
  }

  const handleGrantSubscription = (e: React.FormEvent) => {
    e.preventDefault()
    if (!grantForm.userEmail.trim()) {
      showToast('error', 'Validation Error', 'User email is required.')
      return
    }

    const selectedPlan = plans.find((p) => p.code === grantForm.planCode)
    grantUserSubscription(
      grantForm.userEmail.trim(),
      grantForm.planCode,
      Number(grantForm.days),
      grantForm.amountPaidTZS
    )

    const newTx: SubscriptionTransaction = {
      id: `sub_grant_${Date.now()}`,
      userId: grantForm.userEmail.trim(),
      userName: grantForm.userName.trim() || grantForm.userEmail.split('@')[0],
      planCode: grantForm.planCode,
      planName: selectedPlan?.name || grantForm.planCode,
      providerRef: `ADMIN-GRANT-${Date.now().toString().slice(-6)}`,
      amountTZS: Number(grantForm.amountPaidTZS) || (selectedPlan ? selectedPlan.priceTZS : 0),
      startsAt: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + grantForm.days * 86400000).toISOString().slice(0, 10),
      status: 'ACTIVE',
      createdAt: new Date().toISOString().slice(0, 10),
    }

    saveLedger([newTx, ...ledger])
    setShowGrantModal(false)
    setGrantForm({
      userEmail: '',
      userName: '',
      planCode: 'MONTHLY',
      days: 30,
      amountPaidTZS: 0,
    })

    showToast(
      'success',
      'Subscription Granted',
      `Active membership granted to ${grantForm.userEmail} for ${grantForm.days} days.`
    )
  }

  const handleAddFeature = () => {
    if (!editingPlan) return
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, 'New premium benefit item'],
    })
  }

  const handleRemoveFeature = (idx: number) => {
    if (!editingPlan) return
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== idx),
    })
  }

  const handleFeatureChange = (idx: number, val: string) => {
    if (!editingPlan) return
    const updatedFeatures = [...editingPlan.features]
    updatedFeatures[idx] = val
    setEditingPlan({
      ...editingPlan,
      features: updatedFeatures,
    })
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Partner Subscriptions & Plans Control</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-2 py-0.5 rounded-full">
              Live Pricing & Access Control
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure live membership pricing, validity days, and features. Granted plans immediately synchronize across the public platform.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrantModal(true)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Grant Access to User</span>
          </button>
        </div>
      </div>

      {/* 3 Interactive Plan Definition Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div
            key={p.code}
            className={`p-4 sm:p-5 rounded-3xl border flex flex-col justify-between space-y-3 transition-all relative ${
              p.isBestValue
                ? 'border-[#FF6A00] bg-orange-50/20 dark:bg-slate-800/80 shadow-md ring-1 ring-[#FF6A00]/20'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
            }`}
          >
            {p.isBestValue && (
              <span className="absolute -top-2.5 right-4 bg-[#FF6A00] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                Recommended
              </span>
            )}

            <div>
              <div className="flex items-center justify-between">
                <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                  {p.name}
                </span>
                <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-bold">
                  {p.billingPeriod}
                </span>
              </div>

              <div className="text-xl font-black text-[#FF6A00] font-mono mt-1.5">
                {p.priceDisplay}
              </div>

              <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                {p.description}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {p.features.length} Features Included
              </div>

              <button
                onClick={() => setEditingPlan(p)}
                className="w-full py-2 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Edit Plan & Pricing</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by subscriber name or provider reference (MPESA-VOD...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="ALL">All Plans</option>
            <option value="MONTHLY">Monthly Starter</option>
            <option value="SEMI_ANNUAL">Semi-Annual Pro</option>
            <option value="ENTERPRISE">Enterprise AI</option>
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
            {filteredLedger.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No subscription transactions recorded in the billing ledger yet.
                </td>
              </tr>
            ) : (
              filteredLedger.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-extrabold text-slate-900 dark:text-white">{sub.userName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">User: {sub.userId}</div>
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
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : sub.status === 'PENDING'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleExtendSubscription(sub.id, 30)}
                        className="py-1 px-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold hover:bg-blue-100 cursor-pointer"
                        title="Extend +30 Days"
                      >
                        +30 Days
                      </button>

                      {sub.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleCancelSubscription(sub.id)}
                          className="py-1 px-2.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold hover:bg-red-100 cursor-pointer"
                          title="Cancel Subscription"
                        >
                          Cancel
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

      {/* ======================================================================= */}
      {/* EDIT PLAN CONFIGURATION MODAL                                           */}
      {/* ======================================================================= */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#FF6A00]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Configure Plan: {editingPlan.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlanEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Plan Display Name</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Price in TZS</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.priceTZS}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        priceTZS: Number(e.target.value),
                        priceDisplay: `TZS ${Number(e.target.value).toLocaleString()}`,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Billing Period Label</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.periodDisplay}
                    onChange={(e) => setEditingPlan({ ...editingPlan, periodDisplay: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                    placeholder="/month, /6 months"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Plan Summary Description</label>
                <textarea
                  required
                  rows={2}
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Included Features & Bullet Points</label>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="text-[11px] font-bold text-[#FF6A00] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {editingPlan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        className="flex-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.isBestValue || false}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isBestValue: e.target.checked })}
                    className="w-4 h-4 text-[#FF6A00] rounded focus:ring-0"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Highlight as "Best Value / Recommended"
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="py-2 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Save & Publish Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* GRANT SUBSCRIPTION MODAL                                                */}
      {/* ======================================================================= */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Grant Access to User
                </h3>
              </div>
              <button
                onClick={() => setShowGrantModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantSubscription} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">User Email or Phone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. daudi.marketing@lumopartner.tz"
                  value={grantForm.userEmail}
                  onChange={(e) => setGrantForm({ ...grantForm, userEmail: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">User Display Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Daudi Mzava"
                  value={grantForm.userName}
                  onChange={(e) => setGrantForm({ ...grantForm, userName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Select Plan Tier</label>
                  <select
                    value={grantForm.planCode}
                    onChange={(e) => setGrantForm({ ...grantForm, planCode: e.target.value as SubscriptionPlanCode })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="MONTHLY">Monthly Starter</option>
                    <option value="SEMI_ANNUAL">Semi-Annual Pro</option>
                    <option value="ENTERPRISE">Enterprise AI</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Validity Days</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={grantForm.days}
                    onChange={(e) => setGrantForm({ ...grantForm, days: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="py-2 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Grant Active Membership
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
