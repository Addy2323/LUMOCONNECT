'use client'

import React from 'react'
import {
  PieChart,
  Users,
  MapPin,
  Smartphone,
  Shield,
  TrendingUp,
  Globe,
  Radio,
  Lock,
} from 'lucide-react'

export function AudienceInsightsTab() {
  const regions: { name: string; share: string; buyers: string }[] = []
  const channels: { name: string; percent: string }[] = []

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Aggregated Audience Insights & Reach</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">
              Demographics & Channels
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Understand customer demographics, regional density, and acquisition channel efficiency.
          </p>
        </div>
      </div>

      {/* Privacy Guard Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong>Privacy Safeguarded Analytics:</strong> Customer data is presented in aggregated statistical format. Private personal identifiers (PII) are anonymized in compliance with the Tanzania Personal Data Protection Act (PDPA 2022).
        </div>
      </div>

      {/* Empty State / Grid */}
      {regions.length === 0 && channels.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-dashed text-xs text-slate-500 space-y-2">
          <Globe className="w-10 h-10 mx-auto text-slate-400 opacity-80" />
          <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Customer Audience Data Aggregated Yet</div>
          <div className="max-w-md mx-auto">
            Once partners begin generating customer traffic and conversions across Tanzania, regional concentration and channel breakdown charts will generate automatically.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Regional Distribution */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF6A00]" />
              <span>Regional Customer Concentration</span>
            </h3>

            <div className="space-y-2.5 pt-1">
              {regions.map((reg) => (
                <div key={reg.name} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{reg.name}</span>
                    <div className="text-[10px] text-slate-400">{reg.buyers} verified customers</div>
                  </div>
                  <span className="text-base font-black text-[#FF6A00] font-mono">{reg.share}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Breakdown */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600" />
              <span>Acquisition Channel Efficiency</span>
            </h3>

            <div className="space-y-2.5 pt-1">
              {channels.map((ch) => (
                <div key={ch.name} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{ch.name}</span>
                  <span className="text-base font-black text-emerald-600 font-mono">{ch.percent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
