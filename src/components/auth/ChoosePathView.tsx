'use client'

import React from 'react'
import { Handshake, Building2, ArrowRight } from 'lucide-react'

interface ChoosePathViewProps {
  onSelectPath: (role: 'PARTNER' | 'BUSINESS') => void
  onNavigateSignIn: () => void
}

export function ChoosePathView({
  onSelectPath,
  onNavigateSignIn,
}: ChoosePathViewProps) {
  return (
    <div className="w-full max-w-4xl mx-auto my-4 sm:my-10 px-4 flex flex-col items-center justify-center">
      {/* Title & Subtitle */}
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
          Choose Your Path
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-2.5 leading-relaxed">
          Select how you want to interact with the LUMO ecosystem to tailor your experience.
        </p>
      </div>

      {/* 2 Large Path Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-8">
        {/* Card 1: Partner Path */}
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-xl hover:border-orange-300 dark:hover:border-orange-500/40 transition-all flex flex-col justify-between items-center text-center group">
          <div className="flex flex-col items-center">
            {/* Handshake Icon Circle */}
            <div className="w-16 h-16 rounded-full bg-[#FFF7ED] dark:bg-orange-950/40 text-[#F97316] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-xs">
              <Handshake className="w-8 h-8" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-extrabold text-[#0F172A] dark:text-white mb-3">
              Join as Mshirika wa Mauzo / Partner
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-[#64748B] dark:text-slate-400 leading-relaxed mb-6">
              For influencers, sales professionals, and referrers. Discover opportunities, connect businesses, and earn rewards through our marketplace.
            </p>
          </div>

          {/* Select Button */}
          <button
            type="button"
            onClick={() => onSelectPath('PARTNER')}
            className="w-full py-3 px-4 rounded-xl bg-[#F0F5FA] hover:bg-[#FFF7ED] dark:bg-slate-800 dark:hover:bg-orange-950/40 text-[#F97316] font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 hover:border-[#F97316] transition-all shadow-2xs"
          >
            Select Mshirika wa Mauzo / Partner
          </button>
        </div>

        {/* Card 2: Business Path */}
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500/40 transition-all flex flex-col justify-between items-center text-center group">
          <div className="flex flex-col items-center">
            {/* Building Icon Circle */}
            <div className="w-16 h-16 rounded-full bg-[#F0F5FA] dark:bg-slate-800 text-[#0284C7] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-xs">
              <Building2 className="w-8 h-8" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-extrabold text-[#0F172A] dark:text-white mb-3">
              Join as Business
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-[#64748B] dark:text-slate-400 leading-relaxed mb-6">
              For companies looking to scale. Publish opportunities, access a network of driven partners, and drive predictable growth.
            </p>
          </div>

          {/* Select Button */}
          <button
            type="button"
            onClick={() => onSelectPath('BUSINESS')}
            className="w-full py-3 px-4 rounded-xl bg-[#F0F5FA] hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 text-[#0284C7] font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 hover:border-[#0284C7] transition-all shadow-2xs"
          >
            Select Business Path
          </button>
        </div>
      </div>

      {/* Bottom Link: Already have an account? */}
      <div className="text-center">
        <p className="text-xs text-[#64748B] dark:text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateSignIn}
            className="font-bold text-[#F97316] hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  )
}
