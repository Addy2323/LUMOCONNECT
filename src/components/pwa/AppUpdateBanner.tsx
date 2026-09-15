'use client'

import React, { useState } from 'react'
import { RefreshCw, Sparkles, X } from 'lucide-react'
import { usePwa } from '@/lib/pwa/PwaContext'
import { useLanguage } from '@/lib/i18n'

export function AppUpdateBanner() {
  const { isUpdateAvailable, applyUpdate } = usePwa()
  const { locale } = useLanguage()
  const [dismissed, setDismissed] = useState(false)

  if (!isUpdateAvailable || dismissed) {
    return null
  }

  const isSw = locale === 'sw'

  return (
    <aside
      aria-label="Application update announcement"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg bg-[#0F172A]/95 dark:bg-[#0B132B]/95 backdrop-blur-xl border border-orange-500/40 rounded-2xl p-3.5 shadow-2xl text-white animate-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#FF6A00] flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white tracking-tight truncate">
              {isSw ? 'Sasisho Linapatikana' : 'Update Available'}
            </h4>
            <p className="text-[11px] text-slate-300 truncate">
              {isSw
                ? 'Toleo jipya la Lumo Dealers lipo tayari.'
                : 'A new version of Lumo Dealers is ready.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={applyUpdate}
            className="py-1.5 px-3 bg-gradient-to-r from-[#FF6A00] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            {isSw ? 'Sasisha Sasa' : 'Update Now'}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isSw ? 'Baadaye' : 'Later'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
