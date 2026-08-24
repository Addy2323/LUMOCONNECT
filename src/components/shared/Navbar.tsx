'use client'

import React from 'react'
import {
  Compass,
  Briefcase,
  Layers,
  Sparkles,
  Bell,
  User,
  Shield,
  FileSpreadsheet,
  Menu,
  X,
} from 'lucide-react'
import { BrandMark } from './BrandMark'

interface NavbarProps {
  activeView: string
  onNavigate: (view: string) => void
  notificationsCount?: number
  onOpenHowItWorks?: () => void
}

export function Navbar({
  activeView,
  onNavigate,
  notificationsCount = 2,
  onOpenHowItWorks,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const navLinks = [
    { id: 'marketplace', label: 'Discover Deals', icon: Compass },
    { id: 'partner', label: 'Partner Portal', icon: Sparkles },
    { id: 'business', label: 'Business Hub', icon: Briefcase },
    { id: 'dealroom', label: 'Deal Room', icon: Layers },
    { id: 'admin', label: 'Operations & Audit', icon: Shield },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="lumo-container h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('marketplace')}
            className="flex items-center gap-3 text-left group"
          >
            <BrandMark size={24} />
            <div>
              <span className="font-extrabold text-base tracking-widest text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">
                LUMO
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Deals & Opportunities
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = activeView === link.id
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenHowItWorks}
            className="hidden sm:inline-flex text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-orange-600 px-2.5 py-1"
          >
            How LUMO Works
          </button>

          <button
            onClick={() => onNavigate('onboarding')}
            className="hidden sm:inline-flex py-1.5 px-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Get Started
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = activeView === link.id
            return (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id)
                  setMobileMenuOpen(false)
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-semibold text-left flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </button>
            )
          })}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                onNavigate('onboarding')
                setMobileMenuOpen(false)
              }}
              className="w-full py-2.5 bg-orange-600 text-white text-xs font-bold rounded-xl text-center"
            >
              Sign Up / Onboarding
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
