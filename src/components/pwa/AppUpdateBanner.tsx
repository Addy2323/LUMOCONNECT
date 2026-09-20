'use client'

import React, { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
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
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-xl bg-[#121827]/95 backdrop-blur-xl border border-[#3E271E] rounded-2xl p-3 shadow-2xl text-white animate-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center justify-between gap-3 px-1">
        {/* Icon & Message Container */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#341B12] border border-[#522918] text-[#FF6A00] flex items-center justify-center shrink-0 shadow-inner">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white tracking-tight truncate">
              {isSw ? 'Sasisho Linapatikana' : 'Update Available'}
            </h4>
            <p className="text-xs text-slate-300 truncate">
              {isSw
                ? 'Toleo jipya la Lumo Dealers lipo tayari.'
                : 'A new version of Lumo Dealers is ready.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={applyUpdate}
            className="py-2 px-4 bg-gradient-to-r from-[#FF6A00] to-[#FF5500] hover:from-[#EA580C] hover:to-[#D97706] text-white text-xs font-bold rounded-full shadow-md hover:shadow-orange-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            {isSw ? 'Sasisha Sasa' : 'Update Now'}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label={isSw ? 'Baadaye' : 'Later'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
