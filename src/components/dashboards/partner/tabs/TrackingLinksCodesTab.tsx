'use client'

import React, { useState } from 'react'
import {
  Link,
  QrCode,
  Copy,
  Download,
  Power,
  Search,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import { MOCK_TRACKING_LINKS } from '../mockData'
import { PartnerTrackingLinkItem } from '../types'
import { usePartnerToast } from '../PartnerToast'

export function TrackingLinksCodesTab() {
  const { showToast } = usePartnerToast()

  const [links, setLinks] = useState<PartnerTrackingLinkItem[]>(MOCK_TRACKING_LINKS)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = links.filter(
    (l) =>
      l.dealTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.promoCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    showToast('success', 'Copied to Clipboard', `${label}: ${text}`)
  }

  const handleToggleActive = (id: string, currentStatus: boolean, title: string) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isActive: !currentStatus } : l))
    )
    showToast(
      'info',
      currentStatus ? 'Tracking Link Deactivated' : 'Tracking Link Activated',
      `Tracking link for "${title}" is now ${currentStatus ? 'disabled' : 'active'}.`
    )
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Central Tracking Links, Promo Codes & QR Codes</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">
              Read + Generation Tools
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your unique referral identifiers across all active enrolled commercial opportunities.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search by deal title or promo voucher code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        />
      </div>

      {/* Links List */}
      <div className="space-y-3">
        {filtered.map((link) => (
          <div
            key={link.id}
            className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3 text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {link.dealTitle}
                </h4>
                <div className="text-[11px] text-slate-400">
                  Attribution Window: <strong>{link.attributionWindowDays} Days</strong> · Created: {link.createdAt}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(link.id, link.isActive, link.dealTitle)}
                  className={`py-1 px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors ${
                    link.isActive
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{link.isActive ? 'Active Link' : 'Disabled'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Referral URL</span>
                <div className="flex items-center justify-between gap-2 font-mono text-[11px] p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="truncate">{link.url}</span>
                  <button
                    onClick={() => handleCopy(link.url, 'Tracking Link')}
                    className="text-[#FF6A00] font-bold shrink-0 hover:underline"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Voucher Promo Code</span>
                <div className="flex items-center justify-between gap-2 font-mono text-[11px] p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span>Code: <strong>{link.promoCode}</strong></span>
                  <button
                    onClick={() => handleCopy(link.promoCode, 'Promo Code')}
                    className="text-[#FF6A00] font-bold shrink-0 hover:underline"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Traffic: <strong className="text-slate-900 dark:text-white font-mono">{link.clicks} clicks</strong></span>
              <span>Conversions: <strong className="text-emerald-600 font-mono">{link.conversions} sales</strong></span>
              <span>Conversion Rate: <strong className="text-[#FF6A00] font-mono">{link.conversionRate}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
