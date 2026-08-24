'use client'

import React from 'react'
import {
  Home,
  Users,
  ShieldCheck,
  Briefcase,
  CheckCircle,
  BarChart3,
  CreditCard,
  Wallet,
  Award,
  Calculator,
  Receipt,
  UserCheck,
  AlertTriangle,
  MessageSquare,
  FileText,
  Bell,
  Megaphone,
  UserCog,
  Webhook,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  User,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react'
import { BrandMark } from '@/components/shared/BrandMark'
import { AdminSidebarSection } from './types'

interface AdminSidebarProps {
  activeTab: AdminSidebarSection
  onSelectTab: (tab: AdminSidebarSection) => void
  sidebarCollapsed: boolean
  onToggleCollapse: () => void
  adminName?: string
  adminRole?: string
  onOpenSystemStatus: () => void
  onOpenAdminProfile: () => void
  pendingVerificationsCount?: number
  pendingDealsCount?: number
  flaggedRiskCount?: number
  openDisputesCount?: number
}

interface NavItem {
  id: AdminSidebarSection
  label: string
  icon: React.ComponentType<{ className?: string }>
  opType: string
  badge?: number
  badgeColor?: string
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  sidebarCollapsed,
  onToggleCollapse,
  adminName = 'Given M.',
  adminRole = 'Super Administrator',
  onOpenSystemStatus,
  onOpenAdminProfile,
  pendingVerificationsCount = 0,
  pendingDealsCount = 0,
  flaggedRiskCount = 0,
  openDisputesCount = 0,
}: AdminSidebarProps) {
  const navGroups: { title: string; items: NavItem[] }[] = [
    {
      title: 'PLATFORM',
      items: [
        { id: 'overview' as const, label: 'Overview', icon: Home, opType: 'Read/Monitor' },
        { id: 'users' as const, label: 'Users & Access', icon: Users, opType: 'C/R/U/Archive' },
        {
          id: 'verifications' as const,
          label: 'Business Verification',
          icon: ShieldCheck,
          badge: pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined,
          badgeColor: 'bg-orange-100 text-[#FF6A00]',
          opType: 'Review Workflow',
        },
        { id: 'deals' as const, label: 'Deals & Opportunities', icon: Briefcase, opType: 'C/R/U/Archive' },
        {
          id: 'approvals' as const,
          label: 'Deal Approvals',
          icon: CheckCircle,
          badge: pendingDealsCount > 0 ? pendingDealsCount : undefined,
          badgeColor: 'bg-orange-100 text-[#FF6A00]',
          opType: 'Approval Workflow',
        },
        {
          id: 'conversions' as const,
          label: 'Conversions & Attribution',
          icon: BarChart3,
          opType: 'Platform Evidence',
        },
      ],
    },
    {
      title: 'FINANCIAL OPERATIONS',
      items: [
        { id: 'subscriptions' as const, label: 'Subscriptions', icon: CreditCard, opType: 'Mixed CRUD' },
        { id: 'payments' as const, label: 'Payments', icon: Wallet, opType: 'Immutable Ledger' },
        { id: 'payouts' as const, label: 'Rewards & Payouts', icon: Award, opType: 'Financial Workflow' },
        { id: 'reconciliation' as const, label: 'Reconciliation', icon: Calculator, opType: 'Match & Close' },
        { id: 'tax' as const, label: 'Tax & Statements', icon: Receipt, opType: 'TRA 5% & Rules' },
      ],
    },
    {
      title: 'RISK & SUPPORT',
      items: [
        { id: 'kyc' as const, label: 'KYC & Compliance', icon: UserCheck, opType: 'Review Workflow' },
        {
          id: 'risk' as const,
          label: 'Fraud & Risk',
          icon: AlertTriangle,
          badge: flaggedRiskCount > 0 ? flaggedRiskCount : undefined,
          badgeColor: 'bg-red-100 text-red-600',
          opType: 'Case Management',
        },
        {
          id: 'disputes' as const,
          label: 'Disputes & Complaints',
          icon: MessageSquare,
          badge: openDisputesCount > 0 ? openDisputesCount : undefined,
          badgeColor: 'bg-amber-100 text-amber-700',
          opType: 'C/R/U/Close',
        },
        { id: 'logs' as const, label: 'Audit Logs', icon: FileText, opType: '100% Read-Only' },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'notifications' as const, label: 'Notifications', icon: Bell, opType: 'Template & Delivery' },
        { id: 'content' as const, label: 'Content & Promotions', icon: Megaphone, opType: 'Publish/Archive' },
        { id: 'roles' as const, label: 'Roles & Permissions', icon: UserCog, opType: 'C/R/U/Revoke' },
        { id: 'integrations' as const, label: 'Integrations & Webhooks', icon: Webhook, opType: 'API & Gateways' },
        { id: 'settings' as const, label: 'System Settings', icon: Settings, opType: 'Versioned Config' },
      ],
    },
  ]

  return (
    <aside
      className={`hidden lg:flex flex-col justify-between ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      } bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-3.5 shrink-0 shadow-xs transition-all duration-200 sticky top-24 max-h-[calc(100vh-110px)] overflow-y-auto space-y-4`}
    >
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <BrandMark size={26} />
              <div>
                <div className="font-black text-base text-[#0F172A] dark:text-white leading-none">
                  LUMO
                </div>
                <div className="text-[10px] text-[#64748B] dark:text-slate-400 font-medium">
                  Admin Console
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors mx-auto"
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Console Pill */}
        {!sidebarCollapsed && (
          <div className="w-full py-1.5 px-3 bg-[#0B132B] dark:bg-[#070D1E] text-white rounded-xl text-[10px] font-black tracking-wider uppercase flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#FF6A00]" />
              <span>Maker-Checker Ops</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono">
              PROD
            </span>
          </div>
        )}

        {/* Navigation Groups */}
        <div className="space-y-4 text-xs">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-0.5">
              {!sidebarCollapsed && (
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5 py-1">
                  {group.title}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={sidebarCollapsed ? `${item.label} (${item.opType})` : undefined}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#FF6A00]' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`w-4 h-4 rounded-full ${item.badgeColor} font-black text-[9px] flex items-center justify-center shrink-0 ml-1.5`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Footer: System Status & Admin Profile */}
      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
        {/* System Status Button */}
        <button
          onClick={onOpenSystemStatus}
          className={`w-full p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 transition-colors text-left ${
            sidebarCollapsed ? 'flex justify-center p-2' : ''
          }`}
          title="Open System Status & Health Monitor"
        >
          {sidebarCollapsed ? (
            <div className="relative">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>System Status</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  99.98%
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                All 6 Nodes Operational · Read-only
              </div>
            </div>
          )}
        </button>

        {/* Admin Profile Button */}
        <button
          onClick={onOpenAdminProfile}
          className={`w-full p-2 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left flex items-center gap-2.5 ${
            sidebarCollapsed ? 'justify-center p-2' : 'justify-between'
          }`}
          title="Administrator Profile & Security Settings"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-xl bg-[#0B132B] text-white text-[11px] font-black flex items-center justify-center shrink-0">
              GM
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight truncate">
                  {adminName}
                </div>
                <div className="text-[9px] text-slate-400 truncate font-medium">
                  {adminRole}
                </div>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
        </button>
      </div>
    </aside>
  )
}
