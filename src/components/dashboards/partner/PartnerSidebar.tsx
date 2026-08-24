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
                <span className="text-[9px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                  Partner
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[140px]">
                {partnerName} · Verified Partner
              </span>
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

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl font-bold text-xs transition-all text-left group ${
                      isActive
                        ? 'bg-orange-50/80 dark:bg-slate-800 text-[#FF6A00] dark:text-[#FF6A00] shadow-2xs font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
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

      {/* Bottom Subscription Access Pass Card */}
      {!sidebarCollapsed && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-800/60 border border-orange-200/80 dark:border-slate-700 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[11px] text-slate-900 dark:text-white">
                {subscription.planName}
              </span>
              <span className="text-[9px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.2 rounded-full">
                ● Active
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              {subscription.daysRemaining} days remaining · Full Access
            </div>
            <button
              onClick={() => {
                if (onManagePlan) onManagePlan()
                else onSelectTab('subscription')
              }}
              className="w-full py-1.5 bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-700 text-[#FF6A00] font-extrabold rounded-xl text-[11px] hover:bg-orange-50 transition-colors text-center"
            >
              Manage Access Pass
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
