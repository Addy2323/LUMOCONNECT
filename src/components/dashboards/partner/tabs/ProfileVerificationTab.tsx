'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  Save,
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Lock,
  Globe,
} from 'lucide-react'
import { MOCK_PARTNER_KYC } from '../mockData'
import { PartnerKYCProfile } from '../types'
import { usePartnerToast } from '../PartnerToast'

interface ProfileVerificationTabProps {
  partnerName?: string
  email?: string
  phone?: string
}

export function ProfileVerificationTab({
  partnerName = 'Alex M.',
  email = 'alex@gmail.com',
  phone = '+255 754 000 000',
}: ProfileVerificationTabProps) {
  const { showToast } = usePartnerToast()

  const [profile, setProfile] = useState<PartnerKYCProfile>({
    ...MOCK_PARTNER_KYC,
    fullName: partnerName,
    email,
    phoneMasked: phone,
  })
  const [identityChanged, setIdentityChanged] = useState(false)

  const handleSave = () => {
    if (identityChanged) {
      showToast(
        'warning',
        'KYC Reverification Required',
        'Changes to NIDA identity or legal names require LUMO compliance reverification before taking effect.'
      )
    } else {
      showToast('success', 'Profile Updated', 'Partner contact details and channels updated.')
    }
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Partner Profile & Verified KYC Identity</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
              NIDA Verified
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your verified partner public listing, distribution channels, and national identity credentials.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="py-2.5 px-5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition-all active:scale-[0.99]"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Reverification Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Identity Reverification Rule:</strong> You may freely update your active promotional channels, region, and phone number. Modifying your verified legal name, NIDA number, or TRA TIN will require automated identity reverification.
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Profile Info */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Partner Profile & Channels
          </h3>

          <div>
            <label className="font-bold block mb-1">Full Legal Name</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => {
                setProfile({ ...profile, fullName: e.target.value })
                setIdentityChanged(true)
              }}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-bold"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Partner Commercial Type</label>
            <select
              value={profile.partnerType}
              onChange={(e) => setProfile({ ...profile, partnerType: e.target.value as any })}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-bold"
            >
              <option value="SALES_AGENT">Direct Field Sales Agent</option>
              <option value="CONTENT_CREATOR">Content Creator / Influencer</option>
              <option value="COMMERCIAL_BROKER">Commercial B2B Broker</option>
              <option value="DISTRIBUTOR">Wholesale Distributor</option>
              <option value="AFFILIATE">Digital Affiliate Marketer</option>
            </select>
          </div>

          <div>
            <label className="font-bold block mb-1">Operating Region</label>
            <input
              type="text"
              value={profile.region}
              onChange={(e) => setProfile({ ...profile, region: e.target.value })}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Audience Reach / Contact Size</label>
            <input
              type="text"
              value={profile.audienceSize}
              onChange={(e) => setProfile({ ...profile, audienceSize: e.target.value })}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900"
            />
          </div>
        </div>

        {/* KYC Compliance Info */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              National Identity & Tax Verification
            </h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded">
              ✓ NIDA Verified
            </span>
          </div>

          <div>
            <label className="font-bold block mb-1">National ID (NIDA)</label>
            <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">
              {profile.nidaNumberMasked}
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1">Tax Identification Number (TIN)</label>
            <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">
              {profile.tinNumberMasked}
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1">Verified Email</label>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border font-mono">
              {profile.email}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
