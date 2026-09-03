'use client'

import React from 'react'
import { X, Building2, ShieldCheck, Sparkles, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react'

interface BusinessPublishNoticeModalProps {
  isOpen: boolean
  onClose: () => void
  onRegisterBusiness: () => void
  onExploreSubscriptions: () => void
}

export function BusinessPublishNoticeModal({
  isOpen,
  onClose,
  onRegisterBusiness,
  onExploreSubscriptions,
}: BusinessPublishNoticeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center border border-orange-200 dark:border-orange-900/50">
          <Building2 className="w-7 h-7" />
        </div>

        {/* Title & Explanation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#FF6A00] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>ROLE SPECIFICATION RULE</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white">
            Deal Publishing is for Verified Businesses
          </h3>

          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-300 leading-relaxed">
            On LUMO, <strong>Partners cannot create or publish deals</strong>. Partners discover, unlock full details, and promote published deals to earn rewards with an active subscription.
          </p>
        </div>

        {/* Role Comparison Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">Partners (Creators & Promoters):</strong>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Subscribe to get unlimited access to published deals, generate tracking links, and earn commissions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">Businesses (Enterprises & Merchants):</strong>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Fund commercial budgets, set reward terms, and publish deals for thousands of active partners.
              </p>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={onExploreSubscriptions}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F172A] dark:text-slate-200 font-extrabold text-xs hover:bg-slate-50 text-center transition-colors"
          >
            Explore Partner Plans
          </button>

          <button
            type="button"
            onClick={onRegisterBusiness}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs text-center shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Register as Business</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
