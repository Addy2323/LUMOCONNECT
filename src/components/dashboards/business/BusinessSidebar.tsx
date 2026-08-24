'use client'

import React from 'react'
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
  ShieldCheck,
  Sparkles,
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

export function BusinessSidebar({
  activeTab,
  onSelectTab,
  onOpenCreateWizard,
  sidebarCollapsed,
  onToggleCollapse,
  businessName = 'Kijani Solar Tech',
  pendingApplicationsCount = 0,
  activeDealRoomsCount = 0,
  myOpportunitiesCount = 0,
}: BusinessSidebarProps) {
  const navGroups: { title: string; items: BusinessNavItem[] }[] = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'overview', label: 'Overview', icon: Home, opType: 'Read/Monitor' },
        {
          id: 'create_opportunity',
          label: 'Create Opportunity',
          icon: PlusCircle,
          opType: 'Draft CRUD / Wizard',
          isSpecialAction: true,
        },
        {
          id: 'my_opportunities',
          label: 'My Opportunities',
          icon: Briefcase,
          opType: 'C/R/U/Archive',
          badge: myOpportunitiesCount > 0 ? myOpportunitiesCount : undefined,
          badgeColor: 'bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00]',
        },
        {
          id: 'partners_applications',
          label: 'Partners & Applications',
          icon: Users,
          opType: 'Read/Workflow',
          badge: pendingApplicationsCount > 0 ? pendingApplicationsCount : undefined,
          badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
        },
        {
          id: 'deal_rooms',
          label: 'Deal Rooms',
          icon: MessageSquareCode,
          opType: 'Negotiate & Milestones',
          badge: activeDealRoomsCount > 0 ? activeDealRoomsCount : undefined,
          badgeColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
        },
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
                  Business
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[140px]">
                {businessName}
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

                if (item.isSpecialAction) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onOpenCreateWizard()
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl font-extrabold text-xs transition-all shadow-xs group mt-1.5 mb-1.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white active:scale-[0.99]`}
                      title={item.label}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 text-white shrink-0" />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!sidebarCollapsed && (
                        <span className="text-[9px] bg-white/20 text-white font-bold px-1.5 py-0.2 rounded-md">
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
                  BRELA #184920 · TIN Verified
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
