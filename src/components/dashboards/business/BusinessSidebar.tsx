'use client'

import React, { useEffect } from 'react'
import {
  Home,
  PlusCircle,
  Briefcase,
  Users,
  TrendingUp,
  Target,
  Award,
  Wallet,
  FileSpreadsheet,
  UserSearch,
  Building2,
  UserPlus,
  Shield,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  Store,
  LogOut,
} from 'lucide-react'
import { BusinessSidebarSection } from './types'
import { BrandMark } from '@/components/shared/BrandMark'

interface BusinessSidebarProps {
  activeTab: BusinessSidebarSection
  onSelectTab: (tab: BusinessSidebarSection) => void
  onOpenCreateWizard: () => void
  sidebarCollapsed: boolean
  onToggleCollapse: () => void
  businessName?: string
  profilePhotoUrl?: string
  registrationNumber?: string
  verificationStatus?: string
  pendingApplicationsCount?: number
  activeDealRoomsCount?: number
  myOpportunitiesCount?: number
}

interface BusinessNavItem {
  id: BusinessSidebarSection
  label: string
  icon: React.ComponentType<{ className?: string }>
  opType: string
  badge?: number
  badgeColor?: string
  isSpecialAction?: boolean
}

interface BusinessMobileSidebarProps {
  open: boolean
  onClose: () => void
  activeTab: BusinessSidebarSection
  onSelectTab: (tab: BusinessSidebarSection) => void
  onOpenCreateWizard: () => void
  businessName?: string
  profilePhotoUrl?: string
  registrationNumber?: string
  verificationStatus?: string
  pendingApplicationsCount?: number
  activeDealRoomsCount?: number
  myOpportunitiesCount?: number
  onBrowseMarketplace?: () => void
  onSignOut?: () => void
}

function getNavGroups({
  pendingApplicationsCount,
  activeDealRoomsCount,
  myOpportunitiesCount,
}: {
  pendingApplicationsCount: number
  activeDealRoomsCount: number
  myOpportunitiesCount: number
}): { title: string; items: BusinessNavItem[] }[] {
  return [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'overview', label: 'Overview', icon: Home, opType: 'Read/Monitor' },
        { id: 'create_opportunity', label: 'Create Opportunity', icon: PlusCircle, opType: 'Draft CRUD / Wizard', isSpecialAction: true },
        { id: 'my_opportunities', label: 'My Opportunities', icon: Briefcase, opType: 'C/R/U/Archive', badge: myOpportunitiesCount > 0 ? myOpportunitiesCount : undefined, badgeColor: 'bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00]' },
        { id: 'partners_applications', label: 'Partners & Applications', icon: Users, opType: 'Read/Workflow', badge: pendingApplicationsCount > 0 ? pendingApplicationsCount : undefined, badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' },
      ],
    },
    {
      title: 'PERFORMANCE',
      items: [
        { id: 'deal_performance', label: 'Deal Performance', icon: TrendingUp, opType: 'Read/Analytics' },
        { id: 'conversions_results', label: 'Conversions & Results', icon: Target, opType: 'Controlled Update' },
        { id: 'rewards_commissions', label: 'Rewards & Commissions', icon: Award, opType: 'Financial Workflow' },
        { id: 'payments_funding', label: 'Payments & Funding', icon: Wallet, opType: 'Ledger / Safeguarded' },
      ],
    },
    {
      title: 'GROWTH',
      items: [
        { id: 'partner_discovery', label: 'Partner Discovery', icon: UserSearch, opType: 'Search & Invite' },
        { id: 'reports_exports', label: 'Reports & Exports', icon: FileSpreadsheet, opType: 'Saved Reports CRUD' },
      ],
    },
    {
      title: 'ACCOUNT & SETTINGS',
      items: [
        { id: 'business_profile', label: 'Business Profile', icon: Building2, opType: 'KYB Guarded' },
        { id: 'team_access', label: 'Team & Access', icon: UserPlus, opType: 'C/R/U/Revoke' },
        { id: 'settings_security', label: 'Settings & Security', icon: Shield, opType: 'Read/Update' },
        { id: 'help_support', label: 'Help & Support', icon: HelpCircle, opType: 'C/R/U/Close' },
      ],
    },
  ]
}

function getVerificationBadgeDetails(status?: string, registrationNumber?: string) {
  const norm = (status || 'NOT_SUBMITTED').toUpperCase()
  if (norm === 'VERIFIED') {
    return {
      title: 'Verified Business',
      subtitle: registrationNumber ? `BRELA #${registrationNumber} · Verified` : 'BRELA · TIN Verified',
      boxClasses: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60',
      titleClasses: 'text-emerald-900 dark:text-emerald-300',
      subClasses: 'text-emerald-700 dark:text-emerald-400',
      pulseClass: 'bg-emerald-500',
      Icon: ShieldCheck,
      iconColor: 'text-emerald-600',
    }
  }
  if (norm === 'PENDING') {
    return {
      title: 'Verification Pending',
      subtitle: registrationNumber ? `BRELA #${registrationNumber} · In Review` : 'KYB Under Review',
      boxClasses: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60',
      titleClasses: 'text-amber-900 dark:text-amber-300',
      subClasses: 'text-amber-700 dark:text-amber-400',
      pulseClass: 'bg-amber-500',
      Icon: Clock,
      iconColor: 'text-amber-600',
    }
  }
  if (norm === 'REJECTED') {
    return {
      title: 'Verification Rejected',
      subtitle: 'Resubmit KYB Documents',
      boxClasses: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60',
      titleClasses: 'text-red-900 dark:text-red-300',
      subClasses: 'text-red-700 dark:text-red-400',
      pulseClass: 'bg-red-500',
      Icon: ShieldAlert,
      iconColor: 'text-red-600',
    }
  }
  return {
    title: 'Unverified Business',
    subtitle: 'Submit KYB Documents',
    boxClasses: 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800',
    titleClasses: 'text-slate-800 dark:text-slate-300',
    subClasses: 'text-slate-500 dark:text-slate-400',
    pulseClass: 'bg-slate-400',
    Icon: Shield,
    iconColor: 'text-slate-500',
  }
}

export function BusinessSidebar({
  activeTab,
  onSelectTab,
  onOpenCreateWizard,
  sidebarCollapsed,
  onToggleCollapse,
  businessName = 'My Business',
  profilePhotoUrl,
  registrationNumber,
  verificationStatus = 'NOT_SUBMITTED',
  pendingApplicationsCount = 0,
  activeDealRoomsCount = 0,
  myOpportunitiesCount = 0,
}: BusinessSidebarProps) {
  const navGroups = getNavGroups({ pendingApplicationsCount, activeDealRoomsCount, myOpportunitiesCount })
  const badge = getVerificationBadgeDetails(verificationStatus, registrationNumber)
  const BadgeIcon = badge.Icon

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
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mx-auto"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!sidebarCollapsed && (
        <div className="mt-3 rounded-md bg-[#071B42] px-3 py-2 text-center text-[10px] font-black uppercase tracking-wide text-white">
          Business Portal
        </div>
      )}

      {/* Scrollable Navigation Groups */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-5 py-3 pr-1 no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!sidebarCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.isSpecialAction) onOpenCreateWizard()
                    else onSelectTab(item.id)
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors relative cursor-pointer ${
                    item.isSpecialAction
                      ? 'bg-[#FF6A00] text-white hover:bg-[#EA580C] shadow-sm my-1'
                      : isActive
                      ? 'bg-orange-50 text-[#FF6A00] font-black dark:bg-orange-950/40'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${item.isSpecialAction || isActive ? 'text-current' : 'text-slate-400'}`} />
                    {!sidebarCollapsed && <span className="text-xs truncate">{item.label}</span>}
                  </div>

                  {!sidebarCollapsed && item.badge !== undefined && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Bottom Dynamic KYB Verification Badge */}
      {!sidebarCollapsed && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
          <div className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs ${badge.boxClasses}`}>
            <div className="flex items-center gap-2 min-w-0">
              <BadgeIcon className={`w-4 h-4 shrink-0 ${badge.iconColor}`} />
              <div className="min-w-0">
                <span className={`font-black text-[11px] block truncate ${badge.titleClasses}`}>
                  {badge.title}
                </span>
                <span className={`text-[9px] block truncate ${badge.subClasses}`}>
                  {badge.subtitle}
                </span>
              </div>
            </div>
            <span className={`w-2 h-2 rounded-full shrink-0 ml-1 ${badge.pulseClass} animate-pulse`} />
          </div>
        </div>
      )}
    </aside>
  )
}

export function BusinessMobileSidebar({
  open,
  onClose,
  activeTab,
  onSelectTab,
  onOpenCreateWizard,
  businessName = 'My Business',
  profilePhotoUrl,
  registrationNumber,
  verificationStatus = 'NOT_SUBMITTED',
  pendingApplicationsCount = 0,
  activeDealRoomsCount = 0,
  myOpportunitiesCount = 0,
  onBrowseMarketplace,
  onSignOut,
}: BusinessMobileSidebarProps) {
  const navGroups = getNavGroups({ pendingApplicationsCount, activeDealRoomsCount, myOpportunitiesCount })
  const badge = getVerificationBadgeDetails(verificationStatus, registrationNumber)
  const BadgeIcon = badge.Icon

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Business navigation">
      <button type="button" className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={onClose} aria-label="Close navigation" />
      <aside className="relative flex h-full w-[min(20rem,88vw)] flex-col bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt={businessName} className="h-[30px] w-[30px] shrink-0 rounded-xl object-cover ring-2 ring-emerald-400" />
            ) : (
              <BrandMark size={30} />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-[#0F172A] dark:text-white">LUMO</span>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-black uppercase text-[#FF6A00] dark:bg-orange-950/60">Business</span>
              </div>
              <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{businessName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Business dashboard sections">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{group.title}</p>
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.isSpecialAction) onOpenCreateWizard()
                      else onSelectTab(item.id)
                      onClose()
                    }}
                    className={`flex min-h-11 w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${
                      item.isSpecialAction
                        ? 'my-1 bg-[#FF6A00] text-white shadow-sm hover:bg-[#EA580C]'
                        : isActive
                        ? 'bg-orange-50 text-[#FF6A00] shadow-sm dark:bg-orange-950/40'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                    aria-current={!item.isSpecialAction && isActive ? 'page' : undefined}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className={`h-5 w-5 shrink-0 ${item.isSpecialAction || isActive ? 'text-current' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.isSpecialAction ? (
                      <span className="ml-2 rounded-md bg-white/20 px-2 py-0.5 text-[9px] font-bold">Wizard</span>
                    ) : item.badge !== undefined ? (
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-black ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>{item.badge}</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { onBrowseMarketplace?.(); onClose() }} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-2 text-[10px] font-extrabold text-slate-700 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-[#FF6A00] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <Store className="h-4 w-4" />Browse Marketplace
            </button>
            <button type="button" onClick={() => { onSignOut?.(); onClose() }} className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-extrabold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30">
              <LogOut className="h-4 w-4" />Log out
            </button>
          </div>
          <div className={`flex items-center gap-3 rounded-2xl border p-3 ${badge.boxClasses}`}>
            <BadgeIcon className={`h-5 w-5 shrink-0 ${badge.iconColor}`} />
            <div className="min-w-0">
              <p className={`text-xs font-black ${badge.titleClasses}`}>{badge.title}</p>
              <p className={`truncate text-[10px] ${badge.subClasses}`}>{badge.subtitle}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
