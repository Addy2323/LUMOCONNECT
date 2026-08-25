'use client'

import React from 'react'
import {
  Home,
  Search,
  Bookmark,
  Briefcase,
  Users,
  MessageSquareCode,
  TrendingUp,
  Link,
  Wallet,
  Bell,
  ShoppingBag,
  GraduationCap,
  Award,
  ShieldCheck,
  CreditCard,
  Building,
  Shield,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { PartnerSidebarSection, PartnerSubscriptionPlan } from './types'
import { BrandMark } from '@/components/shared/BrandMark'

interface PartnerSidebarProps {
  activeTab: PartnerSidebarSection
  onSelectTab: (tab: PartnerSidebarSection) => void
  sidebarCollapsed: boolean
  onToggleCollapse: () => void
  partnerName?: string
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

export function PartnerSidebar({
  activeTab,
  onSelectTab,
  sidebarCollapsed,
  onToggleCollapse,
  partnerName = 'Alex M.',
  myDealsCount = 0,
  savedCount = 0,
  leadsCount = 0,
  subscription,
  onManagePlan,
}: PartnerSidebarProps) {
  const navGroups: { title: string; items: PartnerNavItem[] }[] = [
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
        { id: 'tracking_links_codes', label: 'Tracking Links & Codes', icon: Link, opType: 'Read + Generation' },
        { id: 'earnings_payouts', label: 'Earnings & Payouts', icon: Wallet, opType: 'Read + Payout Request' },
        { id: 'notifications', label: 'Notifications', icon: Bell, opType: 'Read/Preferences' },
      ],
    },
    {
      title: 'GROW',
      items: [
        { id: 'sales_toolkit', label: 'Sales Toolkit', icon: ShoppingBag, opType: 'Read + Marketing Kit' },
        { id: 'training_center', label: 'Training Center', icon: GraduationCap, opType: 'Read/Learning' },
        { id: 'partner_score', label: 'Partner Score', icon: Award, opType: 'Read/Score Breakdown' },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { id: 'profile_verification', label: 'Profile & Verification', icon: ShieldCheck, opType: 'Read/KYC Update' },
        { id: 'subscription', label: 'Subscription', icon: CreditCard, opType: 'Payment Workflow' },
        { id: 'payout_methods_tax', label: 'Payout Methods & Tax', icon: Building, opType: 'Read/Update Payouts' },
        { id: 'settings_security', label: 'Settings & Security', icon: Shield, opType: 'Read/Update' },
        { id: 'help_support', label: 'Help & Support', icon: HelpCircle, opType: 'C/R/U/Close' },
      ],
    },
  ]

  return (
    <aside
      className={`hidden lg:flex flex-col ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      } bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 shrink-0 shadow-xs transition-all duration-200 sticky top-24 max-h-[calc(100vh-120px)] overflow-hidden`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <BrandMark size={24} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs tracking-tight text-[#0F172A] dark:text-white">LUMO</span>
                {subscription.status === 'ACTIVE' ? (
                  <span className="text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase flex items-center gap-0.5 shadow-2xs animate-pulse">
                    <Sparkles className="w-2.5 h-2.5 fill-white" />
                    <span>PRO</span>
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                    Partner
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[140px]">
                {partnerName} · {subscription.status === 'ACTIVE' ? 'PRO Partner' : 'Standard Member'}
              </span>
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
                        ? 'bg-[#0B132B] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
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
                ⚡ Get PRO Pass
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
