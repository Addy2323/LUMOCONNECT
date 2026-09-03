'use client'

import React from 'react'
import { Home, LayoutGrid, Tag, TrendingUp, User } from 'lucide-react'

interface MobileNavProps {
  activeView: string
  onNavigate: (view: string) => void
}

export function MobileNav({ activeView, onNavigate }: MobileNavProps) {
  const items = [
    { id: 'marketplace', label: 'Home', icon: Home },
    { id: 'marketplace_catalog', label: 'Marketplace', icon: LayoutGrid },
    { id: 'deals', label: 'My Deals', icon: Tag },
    { id: 'earnings', label: 'Earnings', icon: TrendingUp },
    { id: 'account', label: 'Account', icon: User },
  ]

  const isAccountActive =
    activeView === 'choose_path' ||
    activeView === 'signin' ||
    activeView === 'signup' ||
    activeView === 'auth_verify' ||
    activeView === 'onboarding'

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-lg border-t border-[#E2E8F0] dark:border-slate-800 px-2 py-2 flex justify-around items-center safe-area-pb shadow-lg">
      {items.map((item) => {
        const Icon = item.icon
        const isActive =
          item.id === 'account'
            ? isAccountActive
            : item.id === 'marketplace_catalog'
            ? activeView === 'marketplace_catalog'
            : item.id === 'marketplace'
            ? activeView === 'marketplace' && !isAccountActive
            : activeView === item.id

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`touch-target flex flex-col items-center justify-center p-1 rounded-xl transition-all ${
              isActive
                ? 'text-[#F97316] font-bold scale-105'
                : 'text-[#64748B] hover:text-[#0F172A] dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
