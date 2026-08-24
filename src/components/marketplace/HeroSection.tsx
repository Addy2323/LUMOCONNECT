'use client'

import React from 'react'
import { ArrowRight, ArrowUpRight, CheckCircle, Sparkles, PlusCircle } from 'lucide-react'
import type { OpportunityItem } from '@/modules/deals/types'

interface HeroSectionProps {
  onExplore: () => void
  onPublishDeal: () => void
  onViewSubscriptions?: () => void
  currentUserRole?: string
  onViewAllOpportunities?: () => void
  onSelectPreviewOpportunity?: (opp: OpportunityItem) => void
  previewOpportunities: OpportunityItem[]
}

export function HeroSection({
  onExplore,
  onPublishDeal,
  onViewSubscriptions,
  currentUserRole = 'GUEST',
  onViewAllOpportunities,
  onSelectPreviewOpportunity,
  previewOpportunities,
}: HeroSectionProps) {
  const topPreviews = previewOpportunities.slice(0, 3)
  const isBusinessOrAdmin = currentUserRole === 'BUSINESS' || currentUserRole === 'ADMIN'

  return (
    <section className="relative rounded-3xl bg-[#0B132B] dark:bg-[#070D1E] border border-slate-800 text-white p-6 sm:p-8 lg:p-12 shadow-2xl overflow-hidden mb-6 sm:mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column (Main Hero Copy) */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 text-slate-300 text-[11px] font-semibold border border-slate-700/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
            <span>Tanzania&apos;s Performance Commerce Marketplace</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
            Discover Opportunities. <br />
            <span className="text-[#FF6A00]">Perform. Earn.</span>
          </h1>

          {/* Supporting Paragraph */}
          <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed max-w-xl">
            Connect with verified businesses, promote measurable commercial opportunities and earn from genuine results with unlimited deal access.
          </p>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onExplore}
              className="w-full sm:w-auto py-3.5 px-6 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>Explore Opportunities</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {isBusinessOrAdmin ? (
              <button
                onClick={onPublishDeal}
                className="hidden sm:inline-flex py-3.5 px-5 bg-transparent hover:bg-slate-800/80 text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition-colors items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-[#FF6A00]" />
                <span>Publish a Business Deal</span>
              </button>
            ) : (
              <button
                onClick={onViewSubscriptions}
                className="hidden sm:inline-flex py-3.5 px-5 bg-slate-800/80 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition-colors items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-[#FF6A00]" />
                <span>Partner Membership Plans</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Opportunities Preview Box (Desktop only, hidden on mobile for clean view) */}
        <div className="hidden lg:block lg:col-span-5">
          <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-700/70 p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Opportunities
                </h3>
              </div>
              <button
                onClick={onViewAllOpportunities}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#FF6A00]" />
              </button>
            </div>

            <div className="space-y-2.5">
              {topPreviews.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => onSelectPreviewOpportunity?.(opp)}
                  className="group p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#0B1220] text-[#FF6A00] font-bold text-xs flex items-center justify-center border border-slate-700/60 shrink-0">
                      {opp.companyLogo || opp.companyName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white truncate group-hover:text-[#FF6A00] transition-colors">
                        <span className="truncate">{opp.companyName}</span>
                        {opp.isVerified && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 fill-emerald-400/20" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                        <span>{opp.category}</span>
                        <span>·</span>
                        <span className="truncate">{opp.region.split(',')[0]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Potential reward
                    </div>
                    <div className="text-xs font-bold text-[#FF6A00] font-mono">
                      {opp.rewardDisplay}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
