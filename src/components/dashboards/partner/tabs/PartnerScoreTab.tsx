'use client'

import React from 'react'
import {
  Award,
  Star,
  CheckCircle2,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  ThumbsUp,
} from 'lucide-react'
import { MOCK_PARTNER_SCORE } from '../mockData'
import { PartnerScoreDetail } from '../types'

export function PartnerScoreTab() {
  const score: PartnerScoreDetail = MOCK_PARTNER_SCORE

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Partner Score & Verified Reputation</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
              {score.overallScore}/100 Score
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your algorithmic reputation score unlocks higher commission deals and priority B2B invitation matching.
          </p>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0B132B] to-[#1C2541] text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] bg-[#FF6A00] font-black uppercase px-2.5 py-0.5 rounded-full">
              {score.tierName}
            </span>
            <div className="text-3xl sm:text-4xl font-black mt-2 font-mono">
              {score.overallScore} <span className="text-base text-slate-400 font-sans">/ 100</span>
            </div>
            <p className="text-xs text-slate-300">Top 5% of verified commercial partners in East Africa</p>
          </div>

          <div className="text-right sm:border-l border-slate-700 sm:pl-6 space-y-1">
            <div className="text-xs text-slate-400 font-bold uppercase">Deals Completed</div>
            <div className="text-2xl font-black text-[#FF6A00] font-mono">{score.completedDealsCount}</div>
            <div className="text-[10px] text-emerald-400">100% On-Time Delivery</div>
          </div>
        </div>

        {/* Quality Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-700 text-xs">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-slate-400 block text-[10px]">Conversion Quality Rate</span>
            <span className="text-base font-bold font-mono text-emerald-400">{score.conversionQualityPercent}%</span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-slate-400 block text-[10px]">Lead Responsiveness</span>
            <span className="text-base font-bold font-mono text-blue-400">{score.responsivenessScore}%</span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-slate-400 block text-[10px]">Compliance & Fair Dealing</span>
            <span className="text-base font-bold font-mono text-amber-400">{score.complianceRating} / 5.0</span>
          </div>
        </div>
      </div>

      {/* Recommendations to Level Up */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#FF6A00]" />
          <span>Actionable Tips to Reach 100/100 Score</span>
        </h3>

        <div className="space-y-2 text-xs">
          {score.tipsToLevelUp.map((tip, idx) => (
            <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-slate-700 dark:text-slate-200">{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
