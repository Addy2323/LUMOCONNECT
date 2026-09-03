'use client'

import React, { useEffect } from 'react'
import {
  Home,
  Search,
  Bookmark,
  Briefcase,
  Users,
  MessageSquareCode,
  TrendingUp,
  Wallet,
  Bell,
  ShieldCheck,
  CreditCard,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Store,
  LogOut,
} from 'lucide-react'
import { PartnerSidebarSection, PartnerSubscriptionPlan } from './types'
import { BrandMark } from '@/components/shared/BrandMark'

interface PartnerSidebarProps {
  activeTab: PartnerSidebarSection
  onSelectTab: (tab: PartnerSidebarSection) => void
  sidebarCollapsed: boolean
  onToggleCollapse: () => void
  partnerName?: string
  profilePhotoUrl?: string
  myDealsCount?: number
  savedCount?: number
  leadsCount?: number
  subscription: PartnerSubscriptionPlan
  onManagePlan?: () => void
}

interface PartnerNavItem {
  id: PartnerSidebarSection
  label: string
  icon: React.ComponentType<{ className?: string }>
  opType: string
  badge?: number
  badgeColor?: string
}

interface PartnerMobileSidebarProps {
  open: boolean
  onClose: () => void
  activeTab: PartnerSidebarSection
  onSelectTab: (tab: PartnerSidebarSection) => void
  partnerName?: string
  profilePhotoUrl?: string
  myDealsCount?: number
  savedCount?: number
  leadsCount?: number
  subscription: PartnerSubscriptionPlan
  onManagePlan?: () => void
  onBrowseMarketplace?: () => void
  onSignOut?: () => void
}

function getNavGroups({
  myDealsCount,
  savedCount,
  leadsCount,
}: {
  myDealsCount: number
  savedCount: number
  leadsCount: number
}): { title: string; items: PartnerNavItem[] }[] {
  return [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'overview', label: 'Overview', icon: Home, opType: 'Read/Monitor' },
        { id: 'discover', label: 'Discover Opportunities', icon: Search, opType: 'Read + Join' },
        { id: 'saved_opportunities', label: 'Saved Opportunities', icon: Bookmark, opType: 'Read/Bookmarks', badge: savedCount > 0 ? savedCount : undefined },
        { id: 'my_deals', label: 'My Deals', icon: Briefcase, opType: 'Read/Workflow', badge: myDealsCount > 0 ? myDealsCount : undefined, badgeColor: 'bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00]' },
        { id: 'leads_referrals', label: 'Leads & Referrals', icon: Users, opType: 'Draft CRUD + Submit', badge: leadsCount > 0 ? leadsCount : undefined, badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' },
        { id: 'deal_rooms', label: 'Deal Rooms', icon: MessageSquareCode, opType: 'Negotiate & Milestones' },
      ],
    },
    {
      title: 'PERFORMANCE',
      items: [
        { id: 'performance', label: 'Performance', icon: TrendingUp, opType: 'Read/Analytics' },
        { id: 'earnings_payouts', label: 'Earnings & Payouts', icon: Wallet, opType: 'Read + Payout Request' },
        { id: 'notifications', label: 'Notifications', icon: Bell, opType: 'Read/Preferences' },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { id: 'profile_verification', label: 'Profile & Verification', icon: ShieldCheck, opType: 'Read/KYC Update' },
        { id: 'subscription', label: 'Subscription', icon: CreditCard, opType: 'Payment Workflow' },
        { id: 'help_support', label: 'Help & Support', icon: HelpCircle, opType: 'C/R/U/Close' },
      ],
    },
  ]
}

export function PartnerSidebar({
  activeTab,
  onSelectTab,
  sidebarCollapsed,
  onToggleCollapse,
  partnerName = 'Alex M.',
  profilePhotoUrl,
  myDealsCount = 0,
  savedCount = 0,
  leadsCount = 0,
  subscription,
  onManagePlan,
}: PartnerSidebarProps) {
  const navGroups = getNavGroups({ myDealsCount, savedCount, leadsCount })

  return (
    <aside
      className={`dashboard-sidebar hidden lg:flex flex-col ${
        sidebarCollapsed ? 'w-20' : 'w-[298px]'
      } bg-white dark:bg-slate-900 border-r border-[#E2E8F0] dark:border-slate-800 p-4 shrink-0 transition-all duration-200 sticky top-0 h-screen overflow-hidden`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <BrandMark size={40} />
            <div>
              <div className="font-black text-xl leading-none tracking-tight text-[#0B1739] dark:text-white">LUMO</div>
              <span className="mt-1 block text-[10px] font-medium text-slate-500">Deals &amp; Opportunities</span>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mx-auto cursor-pointer"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!sidebarCollapsed && (
        <div className="mt-3 rounded-md bg-[#071B42] px-3 py-2 text-center text-[10px] font-black uppercase tracking-wide text-white">
          Mshirika wa Mauzo / Partner
        </div>
      )}

      {/* Scrollable Navigation Groups */}
      <div className="flex-1 overflow-y-auto space-y-5 py-3 pr-1 no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.title}
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const IconComponent = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold transition-all group cursor-pointer ${
                      isActive
                        ? 'border-l-[3px] border-[#FF6A00] bg-orange-50 text-[#FF6A00] dark:bg-slate-800'
                        : 'border-l-[3px] border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-[#FF6A00]'
                            : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                        }`}
                      />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!sidebarCollapsed && (
                      <div className="flex items-center gap-1.5">
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono ${
                              item.badgeColor || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Subscription Access Pass Card */}
      {!sidebarCollapsed && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
          {subscription.status === 'ACTIVE' ? (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-800/60 border border-orange-200/80 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[11px] text-slate-900 dark:text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#FF6A00] fill-[#FF6A00]" />
                  <span>{subscription.planName}</span>
                </span>
                <span className="text-[9px] bg-emerald-100 text-emerald-700 font-black px-1.5 py-0.2 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>PRO ACTIVE</span>
                </span>
              </div>

              {/* Countdown Ticker & Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                  <span>⏳ Remaining Time:</span>
                  <span className="text-[#FF6A00]">{subscription.daysRemaining} Days</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#FF6A00] to-emerald-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(10, (subscription.daysRemaining / (subscription.cycle === 'SEMI_ANNUAL' ? 180 : 30)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (onManagePlan) onManagePlan()
                  else onSelectTab('subscription')
                }}
                className="w-full py-1.5 bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-700 text-[#FF6A00] font-extrabold rounded-xl text-[11px] hover:bg-orange-50 transition-colors text-center cursor-pointer shadow-2xs"
              >
                Manage Access Pass
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">No Active Pass</span>
                <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold px-1.5 py-0.2 rounded-full">
                  Locked
                </span>
              </div>
              <div className="text-[10px] text-slate-500">0 days remaining · Subscribe to unlock deals</div>
              <button
                onClick={() => {
                  if (onManagePlan) onManagePlan()
                  else onSelectTab('subscription')
                }}
                className="w-full py-1.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-[11px] transition-colors text-center cursor-pointer shadow-xs"
              >
                <Sparkles className="mr-1 inline h-3 w-3" aria-hidden="true" />
                Get PRO Pass
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}

export function PartnerMobileSidebar({
  open,
  onClose,
  activeTab,
  onSelectTab,
  partnerName = 'Alex M.',
  profilePhotoUrl,
  myDealsCount = 0,
  savedCount = 0,
  leadsCount = 0,
  subscription,
  onManagePlan,
  onBrowseMarketplace,
  onSignOut,
}: PartnerMobileSidebarProps) {
  const navGroups = getNavGroups({ myDealsCount, savedCount, leadsCount })

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const selectTab = (tab: PartnerSidebarSection) => {
    onSelectTab(tab)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Partner navigation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close navigation"
      />

      <aside className="relative flex h-full w-[min(20rem,88vw)] flex-col bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt={partnerName} className="h-[30px] w-[30px] shrink-0 rounded-xl object-cover ring-2 ring-emerald-400" />
            ) : (
              <BrandMark size={30} />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-[#0F172A] dark:text-white">LUMO</span>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-black uppercase text-[#FF6A00] dark:bg-orange-950/60">
                  {subscription.status === 'ACTIVE' ? 'PRO' : 'Mshirika wa Mauzo / Partner'}
                </span>
              </div>
              <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{partnerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Partner dashboard sections">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={`flex min-h-11 w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-[#0B132B] text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#FF6A00]' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-black ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onBrowseMarketplace?.()
                onClose()
              }}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-2 text-[10px] font-extrabold text-slate-700 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-[#FF6A00] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Store className="h-4 w-4" />
              Browse Marketplace
            </button>
            <button
              type="button"
              onClick={() => {
                onSignOut?.()
                onClose()
              }}
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-extrabold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onManagePlan) onManagePlan()
              else selectTab('subscription')
              onClose()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6A00] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#EA580C]"
          >
            <Sparkles className="h-4 w-4" />
            {subscription.status === 'ACTIVE' ? 'Manage Access Pass' : 'Get PRO Pass'}
          </button>
        </div>
      </aside>
    </div>
  )
}
