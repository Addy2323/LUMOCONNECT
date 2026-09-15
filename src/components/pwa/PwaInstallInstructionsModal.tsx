'use client'

import React, { useEffect } from 'react'
import {
  X,
  Share2,
  PlusSquare,
  Monitor,
  Smartphone,
  CheckCircle2,
  Info,
  ExternalLink,
  Laptop,
} from 'lucide-react'
import { usePwa } from '@/lib/pwa/PwaContext'
import { useLanguage } from '@/lib/i18n'
import { BrandMark } from '@/components/shared/BrandMark'

export function PwaInstallInstructionsModal() {
  const { showInstructionsModal, closeInstructionsModal, platform } = usePwa()
  const { locale } = useLanguage()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeInstructionsModal()
      }
    }
    if (showInstructionsModal) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showInstructionsModal, closeInstructionsModal])

  if (!showInstructionsModal) {
    return null
  }

  const isSw = locale === 'sw'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={closeInstructionsModal}
    >
      <div
        className="relative w-full max-w-lg bg-[#0F172A] border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <BrandMark size={22} />
            </div>
            <div>
              <h2 id="pwa-install-title" className="text-base sm:text-lg font-black text-white tracking-tight">
                {isSw ? 'Sakinisha Lumo Dealers' : 'Install Lumo Dealers'}
              </h2>
              <p className="text-xs text-slate-400">
                {isSw ? 'Maelekezo ya kusakinisha kwenye kifaa chako' : 'Installation instructions for your device'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeInstructionsModal}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isSw ? 'Funga' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on detected platform */}
        <div className="py-5 space-y-4">
          {platform === 'ios' ? (
            // iOS Instructions
            <div className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-2.5">
                <Smartphone className="w-5 h-5 text-[#FF6A00] shrink-0 mt-0.5" />
                <p className="text-xs text-orange-200 font-medium leading-relaxed">
                  {isSw
                    ? 'Kwenye vifaa vya Apple (iPhone na iPad), tumia kivinjari cha Safari kusakinisha tovuti kama programu kwenye skrini ya mwanzo.'
                    : 'On Apple devices (iPhone and iPad), use the Safari browser to install the website as an app on your home screen.'}
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                  <div className="w-7 h-7 rounded-xl bg-[#FF6A00] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{isSw ? 'Gonga kitufe cha Shiriki (Share)' : 'Tap the Share button'}</span>
                      <Share2 className="w-3.5 h-3.5 text-[#FF6A00]" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isSw
                        ? 'Kwenye upau wa chini wa kivinjari cha Safari, gonga aikoni ya mraba yenye mshale unaoelekea juu.'
                        : 'At the bottom toolbar of Safari, tap the square icon with an arrow pointing upward.'}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                  <div className="w-7 h-7 rounded-xl bg-[#FF6A00] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{isSw ? "Chagua 'Ongeza kwenye Skrini ya Mwanzo'" : "Select 'Add to Home Screen'"}</span>
                      <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isSw
                        ? "Shuka chini kidogo kwenye menyu na uchague chaguo la 'Add to Home Screen'."
                        : "Scroll down the sharing options and select 'Add to Home Screen'."}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                  <div className="w-7 h-7 rounded-xl bg-[#FF6A00] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {isSw ? "Gonga 'Ongeza' (Add)" : "Tap 'Add' in top right"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isSw
                        ? 'Aikoni ya Lumo itaonekana mara moja kwenye skrini yako kuu ya simu kama programu kamili.'
                        : 'The Lumo Dealers app icon will immediately appear on your home screen for quick access.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : platform === 'desktop' ? (
            // Desktop Instructions
            <div className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-2.5">
                <Laptop className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200 font-medium leading-relaxed">
                  {isSw
                    ? 'Kwenye kompyuta yako (Chrome, Edge, au Brave), unaweza kusakinisha Lumo Dealers kama programu ya dirisha la kujitegemea (Standalone App).'
                    : 'On your computer (Chrome, Edge, or Brave), you can install Lumo Dealers as a standalone desktop application.'}
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                  <div className="w-7 h-7 rounded-xl bg-[#FF6A00] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {isSw ? 'Angalia upande wa kulia wa upau wa anwani (URL)' : 'Look at the address bar'}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isSw
                        ? "Bofya aikoni ya kompyuta au usakinishaji (Install icon) iliyo upande wa kulia wa upau wa anwani."
                        : "Click the Install icon (computer screen with a down arrow) on the right side of the address bar."}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                  <div className="w-7 h-7 rounded-xl bg-[#FF6A00] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {isSw ? "Bofya 'Sakinisha' (Install)" : "Click 'Install' in confirmation prompt"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isSw
                        ? "Dirisha jipya litafunguka likiwa na Lumo kama programu kamili ya kompyuta."
                        : "A dedicated app window will open with Lumo Dealers ready on your taskbar and desktop."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Android fallback / Generic Instructions
            <div className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-2.5">
                <Smartphone className="w-5 h-5 text-[#FF6A00] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {isSw
                    ? "Fungua menyu ya kivinjari chako (nukta 3 za juu kulia) kisha chagua 'Sakinisha programu' au 'Ongeza kwenye Skrini ya Mwanzo'."
                    : "Open your browser menu (3 vertical dots at top right) and tap 'Install app' or 'Add to Home screen'."}
                </p>
              </div>
            </div>
          )}

          {/* Clarity Notice: Web App / No fake downloads */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              {isSw
                ? 'Huu ni usakinishaji wa moja kwa moja wa tovuti kama Programu ya Wavuti (PWA). Hakuna faili la APK au EXE linalopakuliwa.'
                : 'This installs the website directly as a Progressive Web App (PWA). No APK or executable download file is required.'}
            </span>
          </div>
        </div>

        {/* Footer Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={closeInstructionsModal}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            {isSw ? 'Endelea kwenye Tovuti' : 'Continue on Website'}
          </button>
        </div>
      </div>
    </div>
  )
}
