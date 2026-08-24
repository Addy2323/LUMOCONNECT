'use client'

import React, { useState } from 'react'
import {
  Compass,
  Users,
  Building2,
  Handshake,
  ShieldCheck,
  Menu,
  X,
  Search,
  ChevronDown,
  User,
  Bell,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react'
import { BrandMark } from './BrandMark'

interface SiteHeaderProps {
  activeView: string
  onNavigate: (view: string) => void
  onOpenHowItWorks?: () => void
  onOpenSignIn?: () => void
  onOpenGetStarted?: () => void
  currentUserId?: string
  currentUserRole?: string
  hasActiveSubscription?: boolean
  onSwitchUserMode?: (mode: 'GUEST' | 'PARTNER_SUBSCRIBED' | 'PARTNER_UNSUBSCRIBED' | 'BUSINESS_OWNER' | 'ADMIN') => void
}

export function SiteHeader({
  activeView,
  onNavigate,
  onOpenHowItWorks,
  onOpenSignIn,
  onOpenGetStarted,
  currentUserId,
  currentUserRole = 'GUEST',
  hasActiveSubscription = false,
  onSwitchUserMode,
}: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const navItems = [
    { id: 'marketplace', label: 'Discover', icon: Compass },
    { id: 'subscriptions', label: 'Subscriptions', icon: Sparkles },
    { id: 'partner', label: 'Partner Portal', icon: Users },
    { id: 'business', label: 'Business Hub', icon: Building2 },
    { id: 'dealroom', label: 'Deal Room', icon: Handshake },
    ...(currentUserRole === 'ADMIN' ? [{ id: 'admin', label: 'Admin Portal', icon: ShieldCheck }] : []),
  ]

  const isAuthView =
    activeView === 'choose_path' ||
    activeView === 'signin' ||
    activeView === 'signup' ||
    activeView === 'auth_verify' ||
    activeView === 'onboarding'

  const isAuthenticated = Boolean(currentUserId)

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 transition-colors">
      <div className="lumo-container h-[56px] sm:h-[70px] flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => onNavigate('marketplace')}
            className="flex items-center gap-2 text-left group focus:outline-none"
            aria-label="LUMO Homepage"
          >
            <BrandMark size={26} />
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="font-black text-lg sm:text-xl tracking-wider text-[#0F172A] dark:text-white group-hover:text-[#FF6A00] transition-colors">
                LUMO
              </span>
              <span className="hidden sm:inline-block text-xs text-[#64748B] font-medium">
                Deals & Opportunities
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Navigation (Hidden on Auth views for focused flow) */}
        {!isAuthView && (
          <nav className="hidden md:flex items-center gap-1 lg:gap-3" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = activeView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative px-3 py-2 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#FF6A00] dark:text-[#FF6A00]'
                      : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
                  }`}
                >
                  {item.id === 'subscriptions' && <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />}
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#FF6A00] rounded-full" />
                  )}
                </button>
              )
            })}
          </nav>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {activeView === 'signin' ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline-block text-xs text-[#64748B] font-medium">
                New to LUMO?
              </span>
              <button
                onClick={onOpenGetStarted}
                className="py-1.5 sm:py-2 px-3.5 sm:px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-extrabold rounded-xl transition-all shadow-xs"
              >
                Create Account
              </button>
            </div>
          ) : isAuthView ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline-block text-xs text-[#64748B] font-medium">
                Already registered?
              </span>
              <button
                onClick={onOpenSignIn}
                className="py-1.5 sm:py-2 px-3.5 sm:px-4 border border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0F172A] dark:text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Quick Search Icon Button */}
              <button
                onClick={() => onNavigate('marketplace')}
                className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Search opportunities"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Notification Bell with Badge */}
              <button
                onClick={() => onNavigate('partner')}
                className="relative p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#FF6A00] text-white font-bold text-[9px] flex items-center justify-center">
                  2
                </span>
              </button>

              {/* Sign In Button if not authenticated */}
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={onOpenSignIn}
                    className="py-1.5 sm:py-2 px-3 sm:px-3.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0F172A] dark:text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                  >
                    Sign In
                  </button>

                  <button
                    onClick={onOpenGetStarted}
                    className="py-1.5 sm:py-2 px-3.5 sm:px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-extrabold rounded-xl transition-all shadow-xs"
                  >
                    Create Account
                  </button>
                </>
              ) : null}

              {/* Persona / Profile Switcher */}
              <div className="relative ml-0.5 sm:ml-1">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center border transition-all shadow-xs ${
                    hasActiveSubscription
                      ? 'bg-[#0B132B] text-white border-emerald-500 ring-2 ring-emerald-500/30'
                      : isAuthenticated
                      ? 'bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-slate-100 text-slate-500 border-slate-300 hover:border-slate-400'
                  }`}
                  aria-label="User profile & test modes menu"
                >
                  {isAuthenticated ? (currentUserRole === 'ADMIN' ? 'AD' : currentUserRole === 'BUSINESS' ? 'KS' : 'AM') : '•••'}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800 mb-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {isAuthenticated ? (currentUserRole === 'ADMIN' ? 'Platform Admin (Given)' : currentUserRole === 'BUSINESS' ? 'Kijani Solar Tech' : 'Alex Mushi') : 'Visitor Mode'}
                        </span>
                        {currentUserRole === 'ADMIN' ? (
                          <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded border border-purple-200">
                            Admin
                          </span>
                        ) : hasActiveSubscription ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                            Active
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {isAuthenticated ? (currentUserRole === 'ADMIN' ? 'Maker-Checker & Audit Operations' : hasActiveSubscription ? 'Verified Subscriber' : 'No Active Subscription') : 'Public Non-Logged In'}
                      </div>
                    </div>

                    {currentUserRole === 'ADMIN' && (
                      <button
                        onClick={() => {
                          onNavigate('admin')
                          setUserMenuOpen(false)
                        }}
                        className="w-full mb-2 px-2.5 py-2 text-left rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-between shadow-2xs"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>Go to Admin Portal</span>
                        </span>
                        <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 font-extrabold px-1.5 py-0.5 rounded">
                          Ops
                        </span>
                      </button>
                    )}

                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2.5 py-1">
                      SIMULATE USER STATE
                    </div>

                    <button
                      onClick={() => {
                        onSwitchUserMode?.('GUEST')
                        setUserMenuOpen(false)
                      }}
                      className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Public Visitor (Guest)</span>
                      </span>
                      {!isAuthenticated && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A00]" />}
                    </button>

                    <button
                      onClick={() => {
                        onSwitchUserMode?.('PARTNER_UNSUBSCRIBED')
                        setUserMenuOpen(false)
                      }}
                      className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Registered User (No Sub)</span>
                      </span>
                      {isAuthenticated && !hasActiveSubscription && currentUserRole === 'PARTNER' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A00]" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onSwitchUserMode?.('PARTNER_SUBSCRIBED')
                        setUserMenuOpen(false)
                      }}
                      className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Active Subscriber (Alex Mushi)</span>
                      </span>
                      {isAuthenticated && hasActiveSubscription && currentUserRole === 'PARTNER' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A00]" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onSwitchUserMode?.('BUSINESS_OWNER')
                        setUserMenuOpen(false)
                      }}
                      className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Business Owner (Kijani Solar)</span>
                      </span>
                      {isAuthenticated && currentUserRole === 'BUSINESS' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A00]" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onSwitchUserMode?.('ADMIN')
                        onNavigate('admin')
                        setUserMenuOpen(false)
                      }}
                      className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                        <span>Platform Administrator</span>
                      </span>
                      {isAuthenticated && currentUserRole === 'ADMIN' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A00]" />
                      )}
                    </button>

                    <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                    <button
                      onClick={() => {
                        onNavigate('subscriptions')
                        setUserMenuOpen(false)
                      }}
                      className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-bold text-[#FF6A00]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>View Pricing & Plans</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Mobile Menu Button on non-auth views */}
          {!isAuthView && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Sheet) */}
      {!isAuthView && mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full p-3 rounded-xl text-sm font-semibold text-left flex items-center gap-3 ${
                    isActive
                      ? 'bg-orange-50 dark:bg-orange-950/50 text-[#FF6A00] font-bold'
                      : 'text-[#64748B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
