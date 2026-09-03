'use client'

import React, { useState, useEffect } from 'react'
import {
  Compass,
  Store,
  Users,
  Building2,
  Handshake,
  ShieldCheck,
  Menu,
  X,
  User,
  Bell,
  Sparkles,
  Lock,
  CheckCircle2,
  KeyRound,
  LogOut,
  ChevronRight,
  Shield,
  Layers,
  LayoutDashboard,
} from 'lucide-react'
import { BrandMark } from './BrandMark'
import type { UserWorkspaceInfo, WorkspaceType } from '@/lib/session'

interface SiteHeaderProps {
  activeView: string
  onNavigate: (view: string) => void
  onOpenHowItWorks?: () => void
  onOpenSignIn?: () => void
  onOpenGetStarted?: () => void
  onSignOut?: () => void
  currentUserId?: string
  currentUserRole?: string
  hasActiveSubscription?: boolean
  userProfile?: {
    name: string
    email: string
    profilePhotoUrl?: string
  }
  activeWorkspace?: UserWorkspaceInfo
  availableWorkspaces?: UserWorkspaceInfo[]
  onSelectWorkspace?: (workspace: UserWorkspaceInfo) => void
  onRequestAdminMode?: () => void
  isAdminModeActive?: boolean
}

export function SiteHeader({
  activeView,
  onNavigate,
  onOpenHowItWorks,
  onOpenSignIn,
  onOpenGetStarted,
  onSignOut,
  currentUserId,
  currentUserRole = 'GUEST',
  hasActiveSubscription = false,
  userProfile = {
    name: 'Given M.',
    email: 'given@lumo.co.tz',
  },
  activeWorkspace,
  availableWorkspaces = [],
  onSelectWorkspace,
  onRequestAdminMode,
  isAdminModeActive = false,
}: SiteHeaderProps) {
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAuthenticated = Boolean(currentUserId)

  // Professional Role-Based Navigation:
  // Guests: Discover & Subscriptions only
  // Partner workspace: Discover, Subscriptions, Partner Portal, Deal Room
  // Business workspace: Discover, Business Hub, Deal Room
  // Admin Mode: Admin Portal only shown when explicitly authorized/elevated
  const navItems = [
    { id: 'marketplace', label: 'Discover', icon: Compass },
    { id: 'marketplace_catalog', label: 'Marketplace', icon: Store },
    { id: 'subscriptions', label: 'Subscriptions', icon: Sparkles },
    ...(isAuthenticated && (activeWorkspace?.type === 'PARTNER' || activeWorkspace?.type === 'PERSONAL' || !activeWorkspace)
      ? [{ id: 'partner', label: 'Mshirika wa Mauzo / Partner', icon: Users }]
      : []),
    ...(isAuthenticated && activeWorkspace?.type === 'BUSINESS'
      ? [{ id: 'business', label: 'Business Hub', icon: Building2 }]
      : []),
    ...(isAuthenticated
      ? [
          { id: 'dealroom', label: 'Deal Room', icon: Handshake },
          { id: 'customer_checkout', label: 'Customer Area', icon: Sparkles },
        ]
      : []),
    ...(isAdminModeActive ? [{ id: 'admin', label: 'Admin Portal', icon: ShieldCheck }] : []),
  ]

  const isAuthView =
    activeView === 'choose_path' ||
    activeView === 'signin' ||
    activeView === 'signup' ||
    activeView === 'auth_verify' ||
    activeView === 'onboarding'

  const hasAdminPrivilege = availableWorkspaces.some((w) => w.type === 'ADMIN')

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 transition-colors">
      <div className="lumo-container h-[56px] sm:h-[70px] flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => onNavigate('marketplace')}
            className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer"
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

        {/* Center: Desktop Navigation */}
        {!isAuthView && (
          <nav className="hidden md:flex items-center gap-1 lg:gap-3" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = activeView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative px-3 py-2 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'text-[#FF6A00] dark:text-[#FF6A00]'
                      : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
                  }`}
                >
                  {item.id === 'subscriptions' && <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />}
                  {item.id === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />}
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#FF6A00] rounded-full" />
                  )}
                </button>
              )
            })}
          </nav>
        )}

        {/* Right: Actions & User Workspace Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {activeView === 'signin' ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline-block text-xs text-[#64748B] font-medium">
                New to LUMO?
              </span>
              <button
                onClick={onOpenGetStarted}
                className="py-1.5 sm:py-2 px-3 sm:px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Get Started
              </button>
            </div>
          ) : activeView === 'signup' ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline-block text-xs text-[#64748B] font-medium">
                Already have an account?
              </span>
              <button
                onClick={onOpenSignIn}
                className="py-1.5 sm:py-2 px-3 sm:px-4 border border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0F172A] dark:text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              {/* How it works info modal trigger */}
              <button
                onClick={onOpenHowItWorks}
                className="hidden lg:flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white font-medium px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span>How it works</span>
              </button>

              {/* Notification Bell */}
              {isAuthenticated && (
                <button
                  onClick={() => onNavigate('partner')}
                  className="relative p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                </button>
              )}

              {/* Sign In Button if not authenticated */}
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={onOpenSignIn}
                    className="py-1.5 sm:py-2 px-3 sm:px-3.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0F172A] dark:text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                  >
                    Sign In
                  </button>

                  <button
                    onClick={onOpenGetStarted}
                    className="py-1.5 sm:py-2 px-3.5 sm:px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Create Account
                  </button>
                </>
              ) : (
                /* Authenticated User Workspace Switcher Dropdown */
                <div className="relative ml-0.5 sm:ml-1 flex items-center gap-2">
                  {mounted && hasActiveSubscription && (
                    <button
                      onClick={() => onNavigate('subscriptions')}
                      className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black tracking-wider uppercase shadow-xs hover:opacity-95 transition-opacity cursor-pointer animate-pulse"
                      title="Active PRO Subscriber"
                    >
                      <Sparkles className="w-3 h-3 fill-white" />
                      <span>PRO</span>
                    </button>
                  )}

                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`w-9 h-9 rounded-2xl font-black text-xs flex items-center justify-center border transition-all shadow-xs cursor-pointer ${
                      isAdminModeActive
                        ? 'bg-purple-950 text-purple-300 border-purple-600 ring-2 ring-purple-500/30'
                        : activeWorkspace?.type === 'BUSINESS'
                        ? 'bg-blue-950 text-blue-300 border-blue-600 ring-2 ring-blue-500/30'
                        : mounted && hasActiveSubscription
                        ? 'bg-[#0B132B] text-white border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-slate-300 dark:border-slate-700'
                    }`}
                    aria-label="User profile & workspace menu"
                  >
                    {userProfile.profilePhotoUrl ? (
                      <img src={userProfile.profilePhotoUrl} alt={userProfile.name} className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      userProfile.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </button>

                  {userMenuOpen && (
                    <div className="fixed inset-x-3 top-16 z-50 max-h-[calc(100dvh-4.75rem)] overflow-y-auto overscroll-contain rounded-3xl border border-[#E2E8F0] bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-2.5 dark:border-slate-800 dark:bg-slate-900 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 sm:max-h-[calc(100dvh-6rem)]">
                      {/* Authenticated User Identity */}
                      <div className="px-2.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 dark:text-white truncate">
                            {userProfile.name}
                          </span>
                          {hasActiveSubscription ? (
                            <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                              <Sparkles className="w-2.5 h-2.5 fill-white" />
                              <span>PRO Member</span>
                            </span>
                          ) : isAdminModeActive ? (
                            <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded-full border border-purple-300 dark:border-purple-800">
                              Admin Mode
                            </span>
                          ) : (
                            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-bold px-2 py-0.5 rounded-full">
                              {activeWorkspace?.type || 'Personal'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                          {userProfile.email}
                        </div>
                        {activeWorkspace?.organizationName && activeWorkspace.type === 'BUSINESS' && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1 truncate">
                            <Building2 className="w-3 h-3 shrink-0" />
                            <span className="truncate">{activeWorkspace.organizationName}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                        <button
                          onClick={() => {
                            const dashboardView = isAdminModeActive
                              ? 'admin'
                              : activeWorkspace?.type === 'BUSINESS'
                                ? 'business'
                                : 'partner'
                            onNavigate(dashboardView)
                            setUserMenuOpen(false)
                          }}
                          className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-bold cursor-pointer"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-[#FF6A00]" />
                          <span>Go to Dashboard</span>
                        </button>

                        <button
                          onClick={() => {
                            onNavigate('subscriptions')
                            setUserMenuOpen(false)
                          }}
                          className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-bold text-[#FF6A00] cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Pricing & Subscriptions</span>
                        </button>

                        <button
                          onClick={() => {
                            onSignOut?.()
                            setUserMenuOpen(false)
                          }}
                          className="w-full px-2.5 py-1.5 text-left rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 font-bold cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Mobile Menu Button */}
          {!isAuthView && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
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
                  className={`w-full p-3 rounded-xl text-sm font-semibold text-left flex items-center gap-3 cursor-pointer ${
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
