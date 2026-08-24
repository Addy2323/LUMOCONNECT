'use client'

import React from 'react'
import { ShieldCheck, CheckCircle2, Award, Lock } from 'lucide-react'

export function TrustStrip() {
  const items = [
    {
      icon: ShieldCheck,
      title: 'Verified Businesses',
      desc: 'TIN & BRELA registered merchants only',
    },
    {
      icon: CheckCircle2,
      title: 'Transparent Rewards',
      desc: 'Pre-funded milestone & commission pools',
    },
    {
      icon: Award,
      title: 'Auditable Performance',
      desc: 'Verifiable economic outcome tracking',
    },
    {
      icon: Lock,
      title: 'Direct Payouts',
      desc: 'Instant M-Pesa & mobile money settlement',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 px-4 mb-8 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-2xs">
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <div key={i} className="flex items-start gap-3 p-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#F97316] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#0F172A] dark:text-white">
                {item.title}
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 leading-tight">
                {item.desc}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
