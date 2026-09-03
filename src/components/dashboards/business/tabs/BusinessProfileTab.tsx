'use client'

import React, { useState } from 'react'
import {
  Building2,
  ShieldCheck,
  Save,
  AlertTriangle,
  Upload,
  Globe,
  Mail,
  Phone,
  Lock,
} from 'lucide-react'
import { useBusinessToast } from '../BusinessToast'

interface BusinessProfileTabProps {
  businessName?: string
  profilePhotoUrl?: string
  registrationNumber?: string
}

export function BusinessProfileTab({
  businessName = 'My Business Ltd',
  profilePhotoUrl,
  registrationNumber,
}: BusinessProfileTabProps) {
  const { showToast } = useBusinessToast()

  const [profile, setProfile] = useState({
    businessName,
    tagline: 'Verified Commercial Merchant on the LUMO Ecosystem',
    industry: 'Renewable Energy, Technology & Trade',
    website: `https://${businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.tz`,
    email: `info@${businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.tz`,
    phone: '+255 754 000 000',
    hqAddress: 'Dar es Salaam, Tanzania',
    brelaRegNumber: registrationNumber || 'BRELA-VERIFIED',
    tinNumber: '148-291-002',
    vatNumber: '40-028491-K',
  })

  const [legalNameChanged, setLegalNameChanged] = useState(false)

  const handleSaveProfile = () => {
    if (legalNameChanged) {
      showToast(
        'warning',
        'Compliance Reverification Triggered',
        'Changes to verified legal entities require LUMO Compliance re-approval before updating on the marketplace.'
      )
    } else {
      showToast('success', 'Profile Updated', 'Public business profile updated.')
    }
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Business Profile & Verified Legal Credentials</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
              KYB Guarded
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain your brand public listing, contact information, and verified BRELA / TRA legal declarations.
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          className="py-2.5 px-5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition-all active:scale-[0.99]"
        >
          <Save className="w-4 h-4" />
          <span>Save Profile Changes</span>
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
          <strong>Legal Reverification Rule:</strong> You may freely update public marketing descriptions, logos, and contacts. Changes to verified legal entity name, BRELA incorporation certificate, or TRA TIN will trigger temporary compliance reverification.
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
            <label className="font-bold block mb-1">Business Public Display Name</label>
            <input
              type="text"
              value={profile.businessName}
              onChange={(e) => {
                setProfile({ ...profile, businessName: e.target.value })
                setLegalNameChanged(true)
              }}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-bold"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Brand Tagline</label>
            <input
              type="text"
              value={profile.tagline}
              onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900"
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
            <label className="font-bold block mb-1">Official Website</label>
            <input
              type="url"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-mono text-[11px]"
            />
          </div>
        </div>

        {/* Legal & Compliance Info */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Verified Legal Credentials (TRA / BRELA)
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Verified Active
            </span>
          </div>

          <div>
            <label className="font-bold block mb-1">BRELA Incorporation Number</label>
            <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 font-mono text-slate-700 dark:text-slate-300 font-bold">
              {profile.brelaRegNumber}
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1">Tanzania Revenue Authority (TRA) TIN</label>
            <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 font-mono text-slate-700 dark:text-slate-300 font-bold">
              {profile.tinNumber}
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1">Registered Headquarters Address</label>
            <input
              type="text"
              value={profile.hqAddress}
              onChange={(e) => setProfile({ ...profile, hqAddress: e.target.value })}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
