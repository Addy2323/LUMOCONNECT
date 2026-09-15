'use client'

import React from 'react'
import { Download, X, Sparkles } from 'lucide-react'
import { usePwa } from '@/lib/pwa/PwaContext'
import { useLanguage } from '@/lib/i18n'
import { BrandMark } from '@/components/shared/BrandMark'

export function FirstVisitInstallPrompt() {
  const { isInstalled, showFirstVisitPrompt, dismissFirstVisitPrompt, openInstallFlow } = usePwa()
  const { locale, t } = useLanguage()

  // Never show if already running in standalone installed app or if dismissed
  if (isInstalled || !showFirstVisitPrompt) {
    return null
  }

  const isSw = locale === 'sw'

  const title = isSw ? 'Sakinisha Lumo Dealers' : 'Install Lumo Dealers'
  const message = isSw
    ? 'Fikia fursa na fuatilia rufaa zako moja kwa moja kutoka kwenye skrini ya mwanzo.'
    : 'Access opportunities and track your referrals directly from your home screen.'
  const installBtnText = isSw ? 'Sakinisha Programu' : 'Install App'
  const dismissBtnText = isSw ? 'Si Sasa' : 'Not Now'

  return (
    <div
      role="region"
      aria-label="App installation invitation"
      className="fixed z-50 bottom-16 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md bg-[#0F172A]/95 dark:bg-[#0B132B]/95 backdrop-blur-xl border border-orange-500/30 dark:border-orange-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl text-white animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3.5">
        {/* Lumo Icon / Brandmark */}
        <div className="w-11 h-11 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-inner">
          <BrandMark size={24} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5 truncate">
              <span>{title}</span>
              <span className="text-[10px] bg-orange-500/20 text-orange-400 font-bold px-1.5 py-0.5 rounded-full border border-orange-500/30 uppercase tracking-wider">
                PWA
              </span>
            </h3>
            <button
              type="button"
              onClick={dismissFirstVisitPrompt}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={dismissBtnText}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-1 text-xs text-slate-300 leading-relaxed">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="mt-3.5 flex items-center gap-2.5">
            <button
              type="button"
              onClick={openInstallFlow}
              className="flex-1 py-2 px-3.5 bg-gradient-to-r from-[#FF6A00] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{installBtnText}</span>
            </button>

            <button
              type="button"
              onClick={dismissFirstVisitPrompt}
              className="py-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              {dismissBtnText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
