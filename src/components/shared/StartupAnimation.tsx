'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Sparkles, ShieldCheck, Zap } from 'lucide-react'

interface StartupAnimationProps {
  onComplete: () => void
}

export function StartupAnimation({ onComplete }: StartupAnimationProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isCompletingRef = useRef(false)
  const [fadingOut, setFadingOut] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [progress, setProgress] = useState(0)

  const handleComplete = () => {
    if (isCompletingRef.current) return
    isCompletingRef.current = true
    setFadingOut(true)
    setTimeout(() => {
      onComplete()
    }, 500)
  }

  useEffect(() => {
    // Detect mobile device viewport / touch device
    const checkMobile = () => {
      const mobileWidth = window.innerWidth < 768
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      return mobileWidth || mobileUA
    }

    const mobileDetected = checkMobile()
    setIsMobile(mobileDetected)

    if (mobileDetected) {
      // Mobile: Animate progress bar from 0% to 100% over ~2 seconds
      const startTime = Date.now()
      const duration = 2000

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const pct = Math.min(100, Math.floor((elapsed / duration) * 100))
        setProgress(pct)

        if (pct >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            handleComplete()
          }, 200)
        }
      }, 30)

      return () => clearInterval(interval)
    } else {
      // Desktop: Fallback timer if video takes too long
      const fallbackTimer = setTimeout(() => {
        handleComplete()
      }, 8000)

      return () => clearTimeout(fallbackTimer)
    }
  }, [])

  return (
    <div
      className={`startup-animation-overlay ${fadingOut ? 'startup-fade-out' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B132B',
        transition: 'opacity 0.5s ease-out',
        opacity: fadingOut ? 0 : 1,
        overflow: 'hidden',
      }}
    >
      {isMobile === true ? (
        /* AMAZING MOBILE EXCLUSIVE LOADER */
        <div className="relative w-full h-full flex flex-col items-center justify-between p-8 text-white select-none">
          {/* Ambient Glowing Flares */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#FF6A00]/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

          {/* Top Tagline */}
          <div className="relative z-10 pt-8 flex items-center gap-2 text-xs font-bold text-slate-400 tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Commercial Desk</span>
          </div>

          {/* Center Branding & Emblem */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-5 my-auto">
            <div className="relative">
              {/* Outer Glowing Pulsing Ring */}
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#FF6A00] to-amber-400 p-1 shadow-2xl shadow-[#FF6A00]/40 animate-pulse">
                <div className="w-full h-full bg-[#0B132B] rounded-[22px] flex items-center justify-center">
                  <Zap className="w-12 h-12 text-[#FF6A00] fill-[#FF6A00]/20" />
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-amber-300 absolute -top-2 -right-2 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tight text-white flex items-center justify-center gap-1">
                <span>LUMO</span>
                <span className="text-[#FF6A00]">.</span>
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Partner Commercial Network
              </p>
            </div>
          </div>

          {/* Bottom Progress Bar & Loading Status */}
          <div className="relative z-10 w-full max-w-xs space-y-3 pb-8">
            <div className="flex items-center justify-between text-xs font-bold font-mono text-slate-300">
              <span className="text-[#FF6A00]">
                {progress < 40 ? 'Initializing...' : progress < 85 ? 'Securing Access...' : 'Ready'}
              </span>
              <span>{progress}%</span>
            </div>

            {/* Track */}
            <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-[#FF6A00] to-orange-400 rounded-full transition-all duration-75 shadow-lg shadow-[#FF6A00]/50"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* DESKTOP ANIMATED VIDEO PLAYER */
        <video
          ref={videoRef}
          src="/logo/startup.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleComplete}
          onError={handleComplete}
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100vw',
            maxHeight: '100vh',
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  )
}
