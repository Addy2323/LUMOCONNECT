'use client'

import React from 'react'
import { ShieldAlert, LogOut, Lock } from 'lucide-react'

interface AdminModeBannerProps {
  adminEmail: string
  adminRoleName: string
  onExitAdminMode: () => void
}

export function AdminModeBanner({
  adminEmail,
  adminRoleName,
  onExitAdminMode,
}: AdminModeBannerProps) {
  return (
    <div className="w-full bg-slate-950 text-white border-b border-purple-900/60 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md relative z-40">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-5 h-5 rounded-md bg-purple-600/30 text-purple-400 border border-purple-500/40">
          <ShieldAlert className="w-3.5 h-3.5" />
        </span>
        <span className="font-extrabold tracking-wide uppercase text-[11px] text-purple-300">
          ADMIN MODE — Sensitive actions are monitored & audited
        </span>
        <span className="hidden sm:inline-block text-slate-500">|</span>
        <span className="hidden sm:inline-block text-slate-300 font-mono text-[11px]">
          {adminEmail}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-700 text-purple-300 text-[10px] font-bold">
          {adminRoleName}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] text-slate-400 font-mono hidden md:inline-block flex items-center gap-1">
          <Lock className="w-3 h-3 text-emerald-400" /> Elevated Session
        </span>
        <button
          onClick={onExitAdminMode}
          className="py-1 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Admin Mode</span>
        </button>
      </div>
    </div>
  )
}
