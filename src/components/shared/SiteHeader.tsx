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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isAuthenticated = Boolean(currentUserId)

  // Professional Role-Based Navigation:
  // Guests: Discover & Subscriptions only
  // Partner workspace: Discover, Subscriptions, Partner Portal, Deal Room
  // Business workspace: Discover, Business Hub, Deal Room
  // Admin Mode: Admin Portal only shown when explicitly authorized/elevated
  const navItems = [
    { id: 'marketplace', label: 'Discover', icon: Compass },
    { id: 'subscriptions', label: 'Subscriptions', icon: Sparkles },
    ...(isAuthenticated && (activeWorkspace?.type === 'PARTNER' || activeWorkspace?.type === 'PERSONAL' || !activeWorkspace)
      ? [{ id: 'partner', label: 'Partner Portal', icon: Users }]
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
                <div className="relative ml-0.5 sm:ml-1">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`w-9 h-9 rounded-2xl font-black text-xs flex items-center justify-center border transition-all shadow-xs cursor-pointer ${
                      isAdminModeActive
                        ? 'bg-purple-950 text-purple-300 border-purple-600 ring-2 ring-purple-500/30'
                        : activeWorkspace?.type === 'BUSINESS'
                        ? 'bg-blue-950 text-blue-300 border-blue-600 ring-2 ring-blue-500/30'
                        : hasActiveSubscription
                        ? 'bg-[#0B132B] text-white border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-slate-300 dark:border-slate-700'
                    }`}
                    aria-label="User profile & workspace menu"
                  >
                    {userProfile.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl shadow-2xl p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-2.5">
                      {/* Authenticated User Identity */}
                      <div className="px-2.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 dark:text-white truncate">
                            {userProfile.name}
                          </span>
                          {isAdminModeActive ? (
                            <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded-full border border-purple-300 dark:border-purple-800">
                              Admin Mode
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">
                              {activeWorkspace?.type || 'Personal'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                          {userProfile.email}
                        </div>
                      </div>

                      {/* SWITCH WORKSPACE SECTION */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>Switch Workspace</span>
                        </div>

                        {/* List only server-authorized assigned workspaces */}
                        {availableWorkspaces
                          .filter((w) => w.type !== 'ADMIN')
                          .map((ws) => {
                            const isCurrent = activeWorkspace?.id === ws.id
                            return (
                              <button
                                key={ws.id}
                                onClick={() => {
                                  onSelectWorkspace?.(ws)
                                  setUserMenuOpen(false)
                                }}
                                className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                                  isCurrent
                                    ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] font-bold border border-orange-200 dark:border-orange-900/50'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {ws.type === 'BUSINESS' ? (
                                    <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  ) : ws.type === 'PARTNER' ? (
                                    <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <span className="truncate max-w-[170px]">{ws.label}</span>
                                </div>
                                {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />}
                              </button>
                            )
                          })}
                      </div>

                      {/* ADMIN MODE ENTRY (Only visible for authorized admin accounts) */}
                      {hasAdminPrivilege && (
                        <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                          {isAdminModeActive ? (
                            <button
                              onClick={() => {
                                onNavigate('admin')
                                setUserMenuOpen(false)
                              }}
                              className="w-full px-2.5 py-2 text-left rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-between cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-purple-600" />
                                <span>Open Admin Portal</span>
                              </span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onRequestAdminMode?.()
                                setUserMenuOpen(false)
                              }}
                              className="w-full px-2.5 py-2 text-left rounded-xl bg-purple-50/50 hover:bg-purple-50 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 text-purple-800 dark:text-purple-300 font-bold flex items-center justify-between cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-purple-600" />
                                <span>Enter Admin Mode (MFA)</span>
                              </span>
                              <span className="text-[9px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 font-extrabold px-1.5 py-0.5 rounded">
                                Step-Up
                              </span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
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
