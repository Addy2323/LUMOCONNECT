'use client'

import React, { useState, useEffect } from 'react'
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Shield,
  Save,
  AlertTriangle,
  Lock,
  Loader2,
} from 'lucide-react'
import { useBusinessToast } from '../BusinessToast'

interface BusinessProfileTabProps {
  businessName?: string
  profilePhotoUrl?: string
  registrationNumber?: string
  verificationStatus?: string
}

export function BusinessProfileTab({
  businessName = 'My Business Ltd',
  profilePhotoUrl,
  registrationNumber,
  verificationStatus: initialVerificationStatus = 'NOT_SUBMITTED',
}: BusinessProfileTabProps) {
  const { showToast } = useBusinessToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string>(initialVerificationStatus)

  const [profile, setProfile] = useState({
    businessName: businessName,
    tradingName: '',
    tagline: 'Verified Commercial Merchant on the LUMO Ecosystem',
    industry: 'Renewable Energy, Technology & Trade',
    website: '',
    email: '',
    phone: '',
    hqAddress: 'Dar es Salaam, Tanzania',
    brelaRegNumber: registrationNumber || '',
    tinNumber: '',
  })

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    fetch('/api/business/profile')
      .then((res) => res.json())
      .then((res) => {
        if (isMounted && res.success && res.data) {
          const d = res.data
          setStatus(d.verificationStatus || 'NOT_SUBMITTED')
          setProfile((prev) => ({
            ...prev,
            businessName: d.legalName || prev.businessName,
            tradingName: d.tradingName || '',
            brelaRegNumber: d.registrationNumber || prev.brelaRegNumber,
            tinNumber: d.tin || '',
            email: d.users?.[0]?.email || prev.email,
          }))
        }
      })
      .catch((err) => console.warn('Could not load business profile:', err))
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/business/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalName: profile.businessName,
          tradingName: profile.tradingName,
          tin: profile.tinNumber,
          registrationNumber: profile.brelaRegNumber,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update business profile')
      }

      showToast('success', 'Profile Updated', 'Business credentials and details saved successfully.')
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = () => {
    const norm = (status || 'NOT_SUBMITTED').toUpperCase()
    if (norm === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
          <ShieldCheck className="h-3 w-3" />
          BRELA · TIN Verified
        </span>
      )
    }
    if (norm === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
          <Clock className="h-3 w-3" />
          Verification In Review
        </span>
      )
    }
    if (norm === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 font-bold px-2 py-0.5 rounded-full">
          <ShieldAlert className="h-3 w-3" />
          Verification Rejected
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">
        <Shield className="h-3 w-3" />
        Unverified Account
      </span>
    )
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Business Profile &amp; Verified Legal Credentials
            </h2>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain your brand public listing, contact information, and verified business legal declarations.
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving || loading}
          className="py-2.5 px-5 bg-[#FF6A00] hover:bg-[#EA580C] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition-all active:scale-[0.99] cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>
      </div>

      {profilePhotoUrl && (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <img src={profilePhotoUrl} alt="Verified account holder" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-emerald-500" />
          <div>
            <p className="flex items-center gap-1.5 text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
              <Lock className="h-4 w-4" />
              Verified account-holder photo
            </p>
            <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
              Captured during onboarding and locked against changes in profile settings.
            </p>
          </div>
        </div>
      )}

      {/* Reverification Rule Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Legal Reverification Rule:</strong> You may freely update public marketing descriptions, logos, and contacts. Changes to verified legal entity name, BRELA incorporation certificate, or TIN will trigger temporary compliance reverification.
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Marketing Info */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Public Brand Information
          </h3>

          <div>
            <label className="font-bold block mb-1">Legal Registered Name</label>
            <input
              type="text"
              value={profile.businessName}
              onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-bold"
              placeholder="e.g. Acme Tanzania Limited"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Trading / Brand Name</label>
            <input
              type="text"
              value={profile.tradingName}
              onChange={(e) => setProfile({ ...profile, tradingName: e.target.value })}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900"
              placeholder="e.g. Acme Tech"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Industry Sector</label>
            <input
              type="text"
              value={profile.industry}
              onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Contact Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-mono text-[11px]"
              placeholder="business@example.co.tz"
            />
          </div>
        </div>

        {/* Legal & Compliance Info */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Legal Credentials (TIN / BRELA)
            </h3>
            {getStatusBadge()}
          </div>

          <div>
            <label className="font-bold block mb-1">BRELA Incorporation Number</label>
            <input
              type="text"
              value={profile.brelaRegNumber}
              onChange={(e) => setProfile({ ...profile, brelaRegNumber: e.target.value })}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-mono font-bold"
              placeholder="e.g. BRELA-123456"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Tax Identification Number (TIN)</label>
            <input
              type="text"
              value={profile.tinNumber}
              onChange={(e) => setProfile({ ...profile, tinNumber: e.target.value })}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-mono font-bold"
              placeholder="e.g. 123-456-789"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Registered Headquarters Address</label>
            <input
              type="text"
              value={profile.hqAddress}
              onChange={(e) => setProfile({ ...profile, hqAddress: e.target.value })}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900"
              placeholder="Dar es Salaam, Tanzania"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
