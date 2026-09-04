'use client'

import React from 'react'
import { ArrowRight, CheckCircle, PlusCircle, Sparkles, Trophy } from 'lucide-react'

const RECENT_PARTNER_EARNINGS = [
  { partner: 'A******* M.', amount: 'TZS 49,000', source: 'Product sale', time: '1 min ago' },
  { partner: 'J******* K.', amount: 'TZS 41,300', source: 'Verified lead', time: '3 mins ago' },
  { partner: 'N******* A.', amount: 'TZS 25,000', source: 'Property referral', time: '6 mins ago' },
  { partner: 'S******* J.', amount: 'TZS 20,000', source: 'Supply deal', time: '9 mins ago' },
]

interface HeroSectionProps {
  onExplore: () => void
  onPublishDeal: () => void
  onViewSubscriptions?: () => void
  currentUserRole?: string
}

export function HeroSection({
  onExplore,
  onPublishDeal,
  onViewSubscriptions,
  currentUserRole = 'GUEST',
}: HeroSectionProps) {
  const isBusinessOrAdmin = currentUserRole === 'BUSINESS' || currentUserRole === 'ADMIN'

  return (
    <section className="relative mb-6 overflow-hidden rounded-3xl border border-slate-800 bg-[#0B132B] p-6 text-white shadow-2xl dark:bg-[#070D1E] sm:mb-8 sm:p-8 lg:p-12">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-4 sm:space-y-5 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1 text-[11px] font-semibold text-slate-300 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#FF6A00]" />
            <span>Tanzania&apos;s Performance Commerce Marketplace</span>
          </div>

          <h1 className="text-3xl font-black leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
            Discover Opportunities. <br />
            <span className="text-[#FF6A00]">Perform. Earn.</span>
          </h1>

          <p className="max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm lg:text-base">
            Connect with verified businesses, promote measurable commercial opportunities and earn from genuine results with unlimited deal access.
          </p>

          <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center">
            <button onClick={onExplore} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6A00] px-6 py-3.5 text-xs font-extrabold text-white shadow-lg transition-all hover:bg-[#EA580C] active:scale-[0.99] sm:w-auto sm:text-sm">
              <span>Explore Opportunities</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {isBusinessOrAdmin ? (
              <button onClick={onPublishDeal} className="hidden items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-transparent px-5 py-3.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800/80 sm:inline-flex sm:text-sm">
                <PlusCircle className="h-4 w-4 text-[#FF6A00]" />
                <span>Publish a Business Deal</span>
              </button>
            ) : (
              <button onClick={onViewSubscriptions} className="hidden items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 sm:inline-flex sm:text-sm">
                <Sparkles className="h-4 w-4 text-[#FF6A00]" />
                <span>Partner Membership Plans</span>
              </button>
            )}
          </div>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <div className="space-y-3.5 rounded-2xl border border-slate-700/70 bg-[#111827]/90 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">Partner Earnings Flow</h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-300">
                <CheckCircle className="h-3 w-3" /> Verified
              </span>
            </div>

            <div className="h-[224px] overflow-hidden" aria-label="Recent verified partner earnings">
              <div className="lumo-earnings-vertical-flow flex flex-col">
                {[0, 1].map((groupIndex) => (
                  <div key={groupIndex} aria-hidden={groupIndex === 1} className="flex flex-col gap-2.5 pb-2.5">
                    {RECENT_PARTNER_EARNINGS.map((earning) => (
                      <div key={`${groupIndex}-${earning.partner}-${earning.amount}`} className="flex h-[68px] w-full shrink-0 items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-900/75 p-3">
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                            <Trophy className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-slate-200">{earning.partner} earned</p>
                            <p className="mt-0.5 font-mono text-sm font-black text-emerald-400">{earning.amount}</p>
                          </div>
                        </div>
                        <div className="min-w-0 shrink text-right text-[10px] text-slate-400">
                          <p className="truncate">{earning.source}</p>
                          <p className="mt-1 shrink-0 text-slate-500">{earning.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
