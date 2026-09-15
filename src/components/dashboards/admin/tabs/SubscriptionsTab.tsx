'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  Crown,
  RefreshCw,
  User,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  Eye,
  Phone,
  Mail,
} from 'lucide-react'
import {
  listSubscriptionPlans,
  updateSubscriptionPlan,
  grantUserSubscription,
  resetSubscriptionPlans,
} from '@/modules/subscriptions/service'
import type { SubscriptionPlanItem, SubscriptionPlanCode } from '@/modules/subscriptions/types'
import { SubscriptionTransaction } from '../types'
import { useAdminToast } from '../AdminToast'

export function SubscriptionsTab() {
  const { showToast } = useAdminToast()

  const [ledger, setLedger] = useState<SubscriptionTransaction[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lumo_admin_sub_ledger')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            return parsed.map((s: any) => ({
              ...s,
              amountTZS: Number(s.amountTZS ?? s.amountPaidTZS ?? 0),
            }))
          }
        }
      } catch (e) {
        console.warn('Could not read admin sub ledger', e)
      }
    }
    return []
  })

  const [metrics, setMetrics] = useState({
    totalActive: 0,
    expiringTomorrow: 0,
    expiring7Days: 0,
    totalExpired: 0,
    totalRevenueTZS: 0,
    totalSubscribers: 0,
  })
  const [sortBy, setSortBy] = useState<'remaining_asc' | 'newest'>('remaining_asc')
  const [selectedSubForDetail, setSelectedSubForDetail] = useState<SubscriptionTransaction | null>(null)

  const [isLoadingSubs, setIsLoadingSubs] = useState(false)
  const [registeredUsers, setRegisteredUsers] = useState<
    { id: string; name: string; email: string; phone?: string; role?: string }[]
  >([])

  const [searchQuery, setSearchQuery] = useState('')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([])

  // Modals
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null)
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [isSubmittingGrant, setIsSubmittingGrant] = useState(false)

  const [grantForm, setGrantForm] = useState({
    userEmail: '',
    userName: '',
    userPhone: '',
    planCode: 'GOLDEN_VIP' as SubscriptionPlanCode,
    days: 30,
    amountPaidTZS: 50000,
    reason: 'Payment Gateway Failure Bypass / USSD Retry',
  })

  const reloadPlans = () => {
    setPlans(listSubscriptionPlans())
  }

  const loadDatabaseSubscriptions = useCallback(async () => {
    setIsLoadingSubs(true)
    try {
      const res = await fetch(`/api/admin/subscriptions?sortBy=${sortBy}`)
      if (res.ok) {
        const data = await res.json()
        if (data.metrics) {
          setMetrics(data.metrics)
        }
        if (data.subscriptions && Array.isArray(data.subscriptions)) {
          const sanitized = data.subscriptions.map((s: any) => ({
            ...s,
            amountTZS: Number(s.amountTZS ?? s.amountPaidTZS ?? 0),
          }))
          setLedger(sanitized)
          if (typeof window !== 'undefined') {
            localStorage.setItem('lumo_admin_sub_ledger', JSON.stringify(sanitized))
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch database subscriptions:', e)
    } finally {
      setIsLoadingSubs(false)
    }
  }, [sortBy])

  const loadRegisteredUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users?limit=100')
      if (res.ok) {
        const data = await res.json()
        if (data.users && Array.isArray(data.users)) {
          setRegisteredUsers(data.users)
        }
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    reloadPlans()
    loadDatabaseSubscriptions()
    loadRegisteredUsers()

    const handleUpdate = () => {
      reloadPlans()
      loadDatabaseSubscriptions()
    }
    window.addEventListener('lumo:plans-updated', handleUpdate)
    window.addEventListener('lumo:subscription-updated', handleUpdate)
    return () => {
      window.removeEventListener('lumo:plans-updated', handleUpdate)
      window.removeEventListener('lumo:subscription-updated', handleUpdate)
    }
  }, [loadDatabaseSubscriptions, loadRegisteredUsers])

  const saveLedger = (newLedger: SubscriptionTransaction[]) => {
    setLedger(newLedger)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo_admin_sub_ledger', JSON.stringify(newLedger))
    }
  }

  const filteredLedger = ledger.filter((item) => {
    const matchesSearch =
      item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.userEmail && item.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.userPhone && item.userPhone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.providerRef.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlan = planFilter === 'ALL' || item.planCode === planFilter
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
    return matchesSearch && matchesPlan && matchesStatus
  })

  const handlePlanSelect = (code: SubscriptionPlanCode) => {
    const selected = plans.find((p) => p.code === code)
    const defaultDays =
      code === 'SEMI_ANNUAL'
        ? 180
        : code === 'ANNUAL' || code === 'ENTERPRISE'
        ? 365
        : 30

    const defaultPrice =
      selected?.priceTZS ??
      (code === 'GOLDEN_VIP'
        ? 50000
        : code === 'ANNUAL'
        ? 180000
        : code === 'SEMI_ANNUAL'
        ? 100000
        : code === 'ENTERPRISE'
        ? 1500000
        : 25000)

    setGrantForm((prev) => ({
      ...prev,
      planCode: code,
      days: defaultDays,
      amountPaidTZS: defaultPrice,
    }))
  }

  const handleSelectExistingUser = (u: { id: string; name: string; email: string; phone?: string }) => {
    setGrantForm((prev) => ({
      ...prev,
      userEmail: u.email,
      userName: u.name,
      userPhone: u.phone || '',
    }))
  }

  const handleOpenUpgradeForUser = (sub: SubscriptionTransaction) => {
    setGrantForm({
      userEmail: sub.userEmail && sub.userEmail !== '—' ? sub.userEmail : sub.userId,
      userName: sub.userName,
      userPhone: sub.userPhone && sub.userPhone !== '—' ? sub.userPhone : '',
      planCode: sub.isGoldenVip ? 'GOLDEN_VIP' : 'MONTHLY',
      days: 30,
      amountPaidTZS: sub.isGoldenVip ? 50000 : 25000,
      reason: 'Manual Admin Upgrade / Plan Renewal',
    })
    setShowGrantModal(true)
  }

  const handleExtendSubscription = async (subId: string, additionalDays: number) => {
    const target = ledger.find((s) => s.id === subId)
    if (target) {
      try {
        const res = await fetch('/api/admin/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userIdentifier: target.userEmail && target.userEmail !== '—' ? target.userEmail : target.userId,
            planCode: target.planCode,
            daysToAdd: additionalDays,
            amountPaidTZS: 0,
            reason: `Admin Extension (+${additionalDays} days)`,
          }),
        })
        if (res.ok) {
          showToast('success', 'Subscription Extended', `Access extended by ${additionalDays} days in database.`)
          await loadDatabaseSubscriptions()
          return
        }
      } catch (err) {}
    }

    // Local fallback update
    const updated = ledger.map((sub) => {
      if (sub.id === subId) {
        return {
          ...sub,
          status: 'ACTIVE' as const,
          expiresAt: `Extended (+${additionalDays} days)`,
        }
      }
      return sub
    })
    saveLedger(updated)
    showToast('success', 'Subscription Extended', `Access extended by ${additionalDays} days.`)
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

  const handleGrantSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetInput = grantForm.userEmail.trim()
    if (!targetInput) {
      showToast('error', 'Validation Error', 'User email or phone is required.')
      return
    }

    setIsSubmittingGrant(true)

    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIdentifier: targetInput,
          email: targetInput.includes('@') ? targetInput : undefined,
          phone: !targetInput.includes('@') ? targetInput : grantForm.userPhone || undefined,
          planCode: grantForm.planCode,
          daysToAdd: Number(grantForm.days),
          amountPaidTZS: Number(grantForm.amountPaidTZS),
          reason: grantForm.reason || 'Admin manual upgrade / payment bypass',
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to upgrade user subscription')
      }

      // Synchronize in runtime memory for immediate local session consistency
      grantUserSubscription(
        targetInput,
        grantForm.planCode,
        Number(grantForm.days),
        grantForm.amountPaidTZS
      )

      await loadDatabaseSubscriptions()
      window.dispatchEvent(new Event('lumo:subscription-updated'))

      setShowGrantModal(false)
      showToast(
        'success',
        'User Subscription Upgraded!',
        `Successfully activated ${grantForm.planCode} for ${targetInput} (${grantForm.days} days). VIP deal access is now permanently saved in PostgreSQL.`
      )

      setGrantForm({
        userEmail: '',
        userName: '',
        userPhone: '',
        planCode: 'GOLDEN_VIP',
        days: 30,
        amountPaidTZS: 50000,
        reason: 'Payment Gateway Failure Bypass / USSD Retry',
      })
    } catch (err: any) {
      showToast('error', 'Upgrade Failed', err.message || 'Could not upgrade subscription.')
    } finally {
      setIsSubmittingGrant(false)
    }
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
            Configure live membership pricing, validity days, and features. Admin can directly upgrade any user to normal or Golden VIP subscription when payments fail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setGrantForm({
                userEmail: '',
                userName: '',
                userPhone: '',
                planCode: 'GOLDEN_VIP',
                days: 30,
                amountPaidTZS: 50000,
                reason: 'Payment Gateway Failure Bypass / USSD Retry',
              })
              setShowGrantModal(true)
            }}
            className="py-2.5 px-4 bg-gradient-to-r from-amber-500 via-[#FF6A00] to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Crown className="w-4 h-4 text-amber-100" />
            <span>+ Upgrade User Subscription</span>
          </button>
        </div>
      </div>

      {/* Real Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Total Active */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Active Passes
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-100 mt-1">
            {metrics.totalActive}
          </div>
          <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
            Full commercial access
          </p>
        </div>

        {/* Metric 2: Expiring in 7 Days */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Expiring in 7d
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-900 dark:text-amber-100 mt-1">
            {metrics.expiring7Days}
          </div>
          <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
            Due for renewal soon
          </p>
        </div>

        {/* Metric 3: Expiring Tomorrow */}
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Expiring &lt; 24h
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-900 dark:text-rose-100 mt-1">
            {metrics.expiringTomorrow}
          </div>
          <p className="text-[10px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">
            SMS reminder dispatched
          </p>
        </div>

        {/* Metric 4: Total Expired */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Expired Passes
            </span>
            <X className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {metrics.totalExpired}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Restricted commercial access
          </p>
        </div>

        {/* Metric 5: Total Revenue */}
        <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6A00]">
              Pass Revenue
            </span>
            <CreditCard className="w-4 h-4 text-[#FF6A00]" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-orange-900 dark:text-orange-100 mt-1">
            TZS {metrics.totalRevenueTZS.toLocaleString()}
          </div>
          <p className="text-[10px] text-orange-700/80 dark:text-orange-400/80 mt-0.5">
            Total historical collections
          </p>
        </div>
      </div>

      {/* Interactive Plan Definition Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => {
          const isGolden = p.isGoldenVip || p.code === 'GOLDEN_VIP' || p.code === 'ANNUAL' || p.code === 'ENTERPRISE'
          return (
            <div
              key={p.code}
              className={`p-4 sm:p-5 rounded-3xl border flex flex-col justify-between space-y-3 transition-all relative ${
                isGolden
                  ? 'border-amber-400/60 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm ring-1 ring-amber-400/20'
                  : p.isBestValue
                  ? 'border-[#FF6A00] bg-orange-50/20 dark:bg-slate-800/80 shadow-md ring-1 ring-[#FF6A00]/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2 absolute -top-2.5 right-4">
                {isGolden && (
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <Crown className="w-3 h-3" /> VIP Early Access
                  </span>
                )}
                {p.isBestValue && !isGolden && (
                  <span className="bg-[#FF6A00] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                    Recommended
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
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

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEditingPlan(p)}
                    className="py-1.5 px-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3 h-3 text-[#FF6A00]" />
                    <span>Edit Pricing</span>
                  </button>

                  <button
                    onClick={() => {
                      handlePlanSelect(p.code)
                      setShowGrantModal(true)
                    }}
                    className="py-1.5 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Gift className="w-3 h-3 text-emerald-600" />
                    <span>Grant Plan</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter & Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 items-center">
        <div className="sm:col-span-3 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, phone, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="sm:col-span-2">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="ALL">All Plans</option>
            <option value="GOLDEN_VIP">👑 Golden VIP</option>
            <option value="ANNUAL">👑 Annual Elite (VIP)</option>
            <option value="MONTHLY">Monthly Starter</option>
            <option value="SEMI_ANNUAL">Semi-Annual Pro</option>
            <option value="ENTERPRISE">Enterprise AI</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="remaining_asc">⏳ Expiring Soonest</option>
            <option value="newest">🕒 Newest First</option>
          </select>
        </div>

        <div className="sm:col-span-1 flex justify-center">
          <button
            onClick={loadDatabaseSubscriptions}
            disabled={isLoadingSubs}
            title="Refresh from Database"
            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingSubs ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="sm:col-span-2">
          <button
            onClick={() => {
              setGrantForm({
                userEmail: '',
                userName: '',
                userPhone: '',
                planCode: 'GOLDEN_VIP',
                days: 30,
                amountPaidTZS: 50000,
                reason: 'Payment Gateway Failure Bypass / USSD Retry',
              })
              setShowGrantModal(true)
            }}
            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>+ Upgrade</span>
          </button>
        </div>
      </div>

      {/* Subscription Ledger Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">Subscriber & Contact</th>
              <th className="p-3">Plan / VIP Tier</th>
              <th className="p-3">Provider Reference</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Validity & Remaining</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filteredLedger.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-6 h-6 text-slate-300" />
                    <span>No subscription records found.</span>
                    <button
                      onClick={() => setShowGrantModal(true)}
                      className="mt-2 text-xs font-bold text-[#FF6A00] hover:underline"
                    >
                      + Upgrade or grant a subscription now
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLedger.map((sub) => {
                const isActive = sub.status === 'ACTIVE'
                const isUnder24h = isActive && sub.hoursRemaining !== undefined && sub.hoursRemaining <= 24
                const isUnder7d = isActive && sub.daysRemaining !== undefined && sub.daysRemaining <= 7

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{sub.userName}</span>
                        {sub.isGoldenVip && (
                          <Crown className="w-3 h-3 text-amber-500 fill-amber-400 inline" />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-0.5 text-[11px] text-slate-500">
                        {sub.userEmail && sub.userEmail !== '—' && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" />
                            <span>{sub.userEmail}</span>
                          </span>
                        )}
                        {sub.userPhone && sub.userPhone !== '—' && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{sub.userPhone}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{sub.planName}</span>
                      </div>
                      {sub.isGoldenVip ? (
                        <span className="inline-block mt-0.5 text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold px-1.5 py-0.2 rounded">
                          VIP Hot Deals Pass
                        </span>
                      ) : (
                        <span className="inline-block mt-0.5 text-[9px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold px-1.5 py-0.2 rounded">
                          Standard Pass
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {sub.providerRef}
                    </td>

                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      TZS {Number(sub.amountTZS ?? sub.amountPaidTZS ?? 0).toLocaleString()}
                    </td>

                    <td className="p-3 text-[11px] text-slate-500">
                      <div>{sub.startsAt} → {sub.expiresAt}</div>
                      <div className="mt-1">
                        {isActive ? (
                          isUnder24h ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 animate-pulse">
                              Expiring in {sub.hoursRemaining || 0}h
                            </span>
                          ) : isUnder7d ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                              {sub.daysRemaining}d remaining
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              {sub.daysRemaining}d remaining
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Expired
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isActive
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
                          onClick={() => setSelectedSubForDetail(sub)}
                          className="py-1 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                          title="Inspect subscriber details"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={() => handleOpenUpgradeForUser(sub)}
                          className="py-1 px-2 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold hover:bg-amber-100 cursor-pointer flex items-center gap-1"
                          title="Upgrade user plan"
                        >
                          <Crown className="w-3 h-3 text-amber-500" />
                          <span>Upgrade</span>
                        </button>

                        <button
                          onClick={() => handleExtendSubscription(sub.id, 30)}
                          className="py-1 px-2 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold hover:bg-blue-100 cursor-pointer"
                          title="Extend +30 Days"
                        >
                          +30d
                        </button>

                        {isActive && (
                          <button
                            onClick={() => handleCancelSubscription(sub.id)}
                            className="py-1 px-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs font-bold cursor-pointer"
                            title="Cancel Subscription"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
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

            <form onSubmit={handleSavePlanEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Plan Display Name</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Price (TZS)</label>
                  <input
                    type="number"
                    required
                    min={0}
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
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
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
      {/* UPGRADE / GRANT SUBSCRIPTION MODAL                                      */}
      {/* ======================================================================= */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-[#FF6A00] flex items-center justify-center shadow-xs">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Upgrade User Subscription
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bypass failed payment and immediately activate normal or Golden VIP pass.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGrantModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantSubscription} className="space-y-4 text-xs">
              {/* Target User Section */}
              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="font-bold block text-slate-800 dark:text-slate-200">
                  Target User Account (Email or Phone Number)
                </label>

                {registeredUsers.length > 0 && (
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Quick Pick from Registered Database Users:
                    </span>
                    <select
                      onChange={(e) => {
                        const picked = registeredUsers.find((u) => u.email === e.target.value)
                        if (picked) handleSelectExistingUser(picked)
                      }}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs mb-2"
                    >
                      <option value="">-- Select Registered User --</option>
                      {registeredUsers.map((u) => (
                        <option key={u.id} value={u.email}>
                          {u.name} ({u.email}) {u.phone ? `· ${u.phone}` : ''} [{u.role || 'USER'}]
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="User Email or Phone Number *"
                      value={grantForm.userEmail}
                      onChange={(e) => setGrantForm({ ...grantForm, userEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="User Display Name (Optional)"
                      value={grantForm.userName}
                      onChange={(e) => setGrantForm({ ...grantForm, userName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Plan Tier Selector */}
              <div>
                <label className="font-bold block mb-1.5 text-slate-800 dark:text-slate-200">
                  Select Subscription Plan Tier
                </label>

                <div className="space-y-2">
                  {/* Golden VIP Tier */}
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-1">
                    <Crown className="w-3 h-3" />
                    <span>Golden VIP Access Tiers</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlanSelect('GOLDEN_VIP')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        grantForm.planCode === 'GOLDEN_VIP'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-400/40'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 dark:text-white">Golden VIP</span>
                        <span className="text-[10px] font-mono text-amber-600 font-bold">TZS 50,000</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">30 Days · 24h Hot Deals Early Access</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlanSelect('ANNUAL')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        grantForm.planCode === 'ANNUAL'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-400/40'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 dark:text-white">Annual Elite</span>
                        <span className="text-[10px] font-mono text-amber-600 font-bold">TZS 180,000</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">365 Days · Full Year + 1 Mo Free VIP</p>
                    </button>
                  </div>

                  {/* Standard Subscriptions Tier */}
                  <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1 pt-1.5">
                    <CreditCard className="w-3 h-3" />
                    <span>Standard Partner Tiers</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlanSelect('MONTHLY')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        grantForm.planCode === 'MONTHLY'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-400/40'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300'
                      }`}
                    >
                      <span className="font-extrabold text-slate-900 dark:text-white block">Monthly</span>
                      <span className="text-[10px] font-mono text-blue-600 font-bold">TZS 25,000</span>
                      <p className="text-[9px] text-slate-500 mt-0.5">30 Days Pass</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlanSelect('SEMI_ANNUAL')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        grantForm.planCode === 'SEMI_ANNUAL'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-400/40'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300'
                      }`}
                    >
                      <span className="font-extrabold text-slate-900 dark:text-white block">Semi-Annual</span>
                      <span className="text-[10px] font-mono text-blue-600 font-bold">TZS 100,000</span>
                      <p className="text-[9px] text-slate-500 mt-0.5">180 Days (6 Mos)</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlanSelect('ENTERPRISE')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        grantForm.planCode === 'ENTERPRISE'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 ring-2 ring-purple-400/40'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-300'
                      }`}
                    >
                      <span className="font-extrabold text-slate-900 dark:text-white block">Enterprise</span>
                      <span className="text-[10px] font-mono text-purple-600 font-bold">TZS 1.5M</span>
                      <p className="text-[9px] text-slate-500 mt-0.5">365 Days AI VIP</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Validity Days & Amount Paid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Validity Days</label>
                    <div className="flex gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setGrantForm({ ...grantForm, days: 30 })}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        30d
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setGrantForm({ ...grantForm, days: 180 })}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        180d
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setGrantForm({ ...grantForm, days: 365 })}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        365d
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    value={grantForm.days}
                    onChange={(e) => setGrantForm({ ...grantForm, days: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Amount Paid (TZS)</label>
                    <button
                      type="button"
                      onClick={() => setGrantForm({ ...grantForm, amountPaidTZS: 0 })}
                      className="text-[10px] text-amber-600 font-bold hover:underline"
                    >
                      Set 0 (Bypass)
                    </button>
                  </div>
                  <input
                    type="number"
                    required
                    min={0}
                    value={grantForm.amountPaidTZS}
                    onChange={(e) => setGrantForm({ ...grantForm, amountPaidTZS: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Upgrade Reason / Failure Bypass Note */}
              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                  Reason / Operational Bypass Note
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Snippe USSD timeout / Mobile money network failed"
                  value={grantForm.reason}
                  onChange={(e) => setGrantForm({ ...grantForm, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    'Mobile Money Failed / USSD Retry',
                    'Direct Bank Transfer Settlement',
                    'Cash Paid at Office / Merchant Pay',
                    'Promotional VIP Upgrade',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGrantForm({ ...grantForm, reason: preset })}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      {preset}
                    </button>
                  ))}
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
                  disabled={isSubmittingGrant}
                  className="py-2 px-5 bg-gradient-to-r from-amber-500 to-[#FF6A00] hover:from-amber-600 hover:to-[#EA580C] text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingGrant ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Activating in Database...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-3.5 h-3.5" />
                      <span>Upgrade & Activate Pass Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ======================================================================= */}
      {/* SUBSCRIBER DETAIL INSPECTION MODAL                                      */}
      {/* ======================================================================= */}
      {selectedSubForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-[#FF6A00]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Subscriber Inspection & Control
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedSubForDetail.providerRef}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubForDetail(null)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Subscriber Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {selectedSubForDetail.userName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      selectedSubForDetail.status === 'ACTIVE'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {selectedSubForDetail.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {selectedSubForDetail.userEmail || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Phone</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono font-medium">
                      {selectedSubForDetail.userPhone || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">User ID</span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono text-[10px] truncate block">
                      {selectedSubForDetail.userId}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Plan Code</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">
                      {selectedSubForDetail.planCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Validity & Time Left */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Billing Validity</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {selectedSubForDetail.startsAt} → {selectedSubForDetail.expiresAt}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Remaining Duration</span>
                  <span className="font-extrabold text-[#FF6A00] font-mono">
                    {selectedSubForDetail.status === 'ACTIVE'
                      ? `${selectedSubForDetail.daysRemaining} days (${selectedSubForDetail.hoursRemaining || 0} hours)`
                      : 'Expired (0 hours)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Amount Paid</span>
                  <span className="font-extrabold font-mono text-slate-900 dark:text-white">
                    TZS {Number(selectedSubForDetail.amountTZS ?? selectedSubForDetail.amountPaidTZS ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Quick Lifecycle Extensions
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={async () => {
                      await handleExtendSubscription(selectedSubForDetail.id, 7)
                      setSelectedSubForDetail(null)
                    }}
                    className="p-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl font-bold text-center cursor-pointer transition-colors"
                  >
                    +7 Days
                  </button>
                  <button
                    onClick={async () => {
                      await handleExtendSubscription(selectedSubForDetail.id, 30)
                      setSelectedSubForDetail(null)
                    }}
                    className="p-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl font-bold text-center cursor-pointer transition-colors"
                  >
                    +30 Days
                  </button>
                  <button
                    onClick={async () => {
                      await handleExtendSubscription(selectedSubForDetail.id, 180)
                      setSelectedSubForDetail(null)
                    }}
                    className="p-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl font-bold text-center cursor-pointer transition-colors"
                  >
                    +180 Days
                  </button>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      const target = selectedSubForDetail
                      setSelectedSubForDetail(null)
                      handleOpenUpgradeForUser(target)
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-[#FF6A00] text-white font-extrabold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Upgrade Plan</span>
                  </button>

                  <button
                    onClick={() => setSelectedSubForDetail(null)}
                    className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
