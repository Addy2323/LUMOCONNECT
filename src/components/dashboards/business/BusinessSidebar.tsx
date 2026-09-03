'use client'

import React, { useEffect } from 'react'
import {
  Home,
  PlusCircle,
  Briefcase,
  Users,
  MessageSquareCode,
  TrendingUp,
  Target,
  Award,
  Wallet,
  Megaphone,
  UserSearch,
  PieChart,
  FileSpreadsheet,
  Webhook,
  CreditCard,
  Building2,
  UserPlus,
  Shield,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
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
        { id: 'deal_rooms', label: 'Deal Rooms', icon: MessageSquareCode, opType: 'Negotiate & Milestones', badge: activeDealRoomsCount > 0 ? activeDealRoomsCount : undefined, badgeColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' },
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
        { id: 'campaigns', label: 'Campaigns', icon: Megaphone, opType: 'CRUD/Publish' },
        { id: 'partner_discovery', label: 'Partner Discovery', icon: UserSearch, opType: 'Search & Invite' },
        { id: 'audience_insights', label: 'Audience Insights', icon: PieChart, opType: 'Read/Analytics' },
        { id: 'reports_exports', label: 'Reports & Exports', icon: FileSpreadsheet, opType: 'Saved Reports CRUD' },
      ],
    },
    {
      title: 'ACCOUNT & SYSTEM',
      items: [
        { id: 'tracking_integrations', label: 'Tracking & Integrations', icon: Webhook, opType: 'APIs & Webhooks' },
        { id: 'billing_subscription', label: 'Billing & Subscription', icon: CreditCard, opType: 'SaaS Invoices' },
        { id: 'business_profile', label: 'Business Profile', icon: Building2, opType: 'KYB Guarded' },
        { id: 'team_access', label: 'Team & Access', icon: UserPlus, opType: 'C/R/U/Revoke' },
        { id: 'settings_security', label: 'Settings & Security', icon: Shield, opType: 'Read/Update' },
        { id: 'help_support', label: 'Help & Support', icon: HelpCircle, opType: 'C/R/U/Close' },
      ],
    },
  ]
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
  pendingApplicationsCount = 0,
  activeDealRoomsCount = 0,
  myOpportunitiesCount = 0,
}: BusinessSidebarProps) {
  const navGroups = getNavGroups({ pendingApplicationsCount, activeDealRoomsCount, myOpportunitiesCount })

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
                const Icon = item.icon
                const isActive = activeTab === item.id

                if (item.isSpecialAction) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onOpenCreateWizard()
                      }}
                      className="group my-1 flex w-full items-center justify-between rounded-xl border-l-[3px] border-transparent px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-orange-50 hover:text-[#FF6A00] dark:text-slate-300 dark:hover:bg-slate-800"
                      title={item.label}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6A00] text-white">
                          <Icon className="h-4 w-4 shrink-0" />
                        </span>
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!sidebarCollapsed && (
                        <span className="text-[9px] bg-orange-50 text-[#FF6A00] font-bold px-1.5 py-0.5 rounded-md">
                          Wizard
                        </span>
                      )}
                    </button>
                  )
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl font-bold text-xs transition-all text-left group ${
                      isActive
                        ? 'border-l-[3px] border-[#FF6A00] bg-orange-50/80 dark:bg-slate-800 text-[#FF6A00] dark:text-[#FF6A00] font-extrabold'
                        : 'border-l-[3px] border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title={`${item.label} (${item.opType})`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-[#FF6A00]'
                            : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        }`}
                      />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!sidebarCollapsed && (
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {item.badge !== undefined && item.badge > 0 && (
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

      {/* Bottom Business KYB Badge & Safeguarding Note */}
      {!sidebarCollapsed && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-black text-emerald-900 dark:text-emerald-300 text-[11px] block">
                  Verified Business
                </span>
                <span className="text-[9px] text-emerald-700 dark:text-emerald-400">
                  {registrationNumber ? `BRELA #${registrationNumber} · TIN Verified` : 'BRELA · TIN Verified'}
                </span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
  pendingApplicationsCount = 0,
  activeDealRoomsCount = 0,
  myOpportunitiesCount = 0,
  onBrowseMarketplace,
  onSignOut,
}: BusinessMobileSidebarProps) {
  const navGroups = getNavGroups({ pendingApplicationsCount, activeDealRoomsCount, myOpportunitiesCount })

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
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-xs font-black text-emerald-900 dark:text-emerald-300">Verified Business</p>
              <p className="truncate text-[10px] text-emerald-700 dark:text-emerald-400">{registrationNumber ? `BRELA #${registrationNumber} · TIN Verified` : 'BRELA · TIN Verified'}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
