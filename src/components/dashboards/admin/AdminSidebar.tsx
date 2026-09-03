'use client'

import React, { useEffect } from 'react'
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
  X,
  Store,
  LogOut,
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

interface AdminMobileSidebarProps {
  open: boolean
  onClose: () => void
  activeTab: AdminSidebarSection
  onSelectTab: (tab: AdminSidebarSection) => void
  adminName?: string
  adminRole?: string
  onOpenSystemStatus: () => void
  onOpenAdminProfile: () => void
  pendingVerificationsCount?: number
  pendingDealsCount?: number
  flaggedRiskCount?: number
  openDisputesCount?: number
  onBrowseMarketplace?: () => void
  onSignOut?: () => void
}

function getNavGroups({
  pendingVerificationsCount,
  pendingDealsCount,
  flaggedRiskCount,
  openDisputesCount,
}: {
  pendingVerificationsCount: number
  pendingDealsCount: number
  flaggedRiskCount: number
  openDisputesCount: number
}): { title: string; items: NavItem[] }[] {
  return [
    {
      title: 'PLATFORM',
      items: [
        { id: 'overview', label: 'Overview', icon: Home, opType: 'Read/Monitor' },
        { id: 'users', label: 'Users & Access', icon: Users, opType: 'C/R/U/Archive' },
        { id: 'verifications', label: 'Business Verification', icon: ShieldCheck, badge: pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined, badgeColor: 'bg-orange-100 text-[#FF6A00]', opType: 'Review Workflow' },
        { id: 'deals', label: 'Deals & Opportunities', icon: Briefcase, opType: 'C/R/U/Archive' },
        { id: 'approvals', label: 'Deal Approvals', icon: CheckCircle, badge: pendingDealsCount > 0 ? pendingDealsCount : undefined, badgeColor: 'bg-orange-100 text-[#FF6A00]', opType: 'Approval Workflow' },
        { id: 'conversions', label: 'Conversions & Attribution', icon: BarChart3, opType: 'Platform Evidence' },
      ],
    },
    {
      title: 'FINANCIAL OPERATIONS',
      items: [
        { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, opType: 'Mixed CRUD' },
        { id: 'payments', label: 'Payments', icon: Wallet, opType: 'Immutable Ledger' },
        { id: 'payouts', label: 'Rewards & Payouts', icon: Award, opType: 'Financial Workflow' },
        { id: 'reconciliation', label: 'Reconciliation', icon: Calculator, opType: 'Match & Close' },
        { id: 'tax', label: 'Tax & Statements', icon: Receipt, opType: 'TRA 5% & Rules' },
      ],
    },
    {
      title: 'RISK & SUPPORT',
      items: [
        { id: 'kyc', label: 'KYC & Compliance', icon: UserCheck, opType: 'Review Workflow' },
        { id: 'risk', label: 'Fraud & Risk', icon: AlertTriangle, badge: flaggedRiskCount > 0 ? flaggedRiskCount : undefined, badgeColor: 'bg-red-100 text-red-600', opType: 'Case Management' },
        { id: 'disputes', label: 'Disputes & Complaints', icon: MessageSquare, badge: openDisputesCount > 0 ? openDisputesCount : undefined, badgeColor: 'bg-amber-100 text-amber-700', opType: 'C/R/U/Close' },
        { id: 'logs', label: 'Audit Logs', icon: FileText, opType: '100% Read-Only' },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell, opType: 'Template & Delivery' },
        { id: 'content', label: 'Content & Promotions', icon: Megaphone, opType: 'Publish/Archive' },
        { id: 'roles', label: 'Roles & Permissions', icon: UserCog, opType: 'C/R/U/Revoke' },
        { id: 'integrations', label: 'Integrations & Webhooks', icon: Webhook, opType: 'API & Gateways' },
        { id: 'settings', label: 'System Settings', icon: Settings, opType: 'Versioned Config' },
      ],
    },
  ]
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
  const navGroups = getNavGroups({ pendingVerificationsCount, pendingDealsCount, flaggedRiskCount, openDisputesCount })

  return (
    <aside
      className={`dashboard-sidebar hidden lg:flex flex-col justify-between ${
        sidebarCollapsed ? 'w-20' : 'w-[298px]'
      } bg-white dark:bg-slate-900 border-r border-[#E2E8F0] dark:border-slate-800 p-4 shrink-0 transition-all duration-200 sticky top-0 h-screen overflow-y-auto space-y-4`}
    >
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <BrandMark size={40} />
              <div>
                <div className="font-black text-xl leading-none tracking-tight text-[#0B1739] dark:text-white">LUMO</div>
                <div className="mt-1 text-[10px] font-medium text-[#64748B] dark:text-slate-400">Deals &amp; Opportunities</div>
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
          <div className="w-full py-2 px-3 bg-[#071B42] dark:bg-[#070D1E] text-white rounded-md text-[10px] font-black tracking-wider uppercase flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#FF6A00]" />
              <span>Admin Portal</span>
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
                        ? 'border-l-[3px] border-[#FF6A00] bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] font-bold'
                        : 'border-l-[3px] border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 font-medium'
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

export function AdminMobileSidebar({
  open,
  onClose,
  activeTab,
  onSelectTab,
  adminName = 'Given M.',
  adminRole = 'Super Administrator',
  onOpenSystemStatus,
  onOpenAdminProfile,
  pendingVerificationsCount = 0,
  pendingDealsCount = 0,
  flaggedRiskCount = 0,
  openDisputesCount = 0,
  onBrowseMarketplace,
  onSignOut,
}: AdminMobileSidebarProps) {
  const navGroups = getNavGroups({ pendingVerificationsCount, pendingDealsCount, flaggedRiskCount, openDisputesCount })

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
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
      <button type="button" className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={onClose} aria-label="Close navigation" />
      <aside className="relative flex h-full w-[min(20rem,88vw)] flex-col bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark size={30} />
            <div className="min-w-0">
              <p className="font-black leading-tight text-[#0F172A] dark:text-white">LUMO</p>
              <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">Admin Console</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-3 mt-3 flex items-center justify-between rounded-xl bg-[#0B132B] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white">
          <span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-[#FF6A00]" />Maker-Checker Ops</span>
          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-emerald-300">PROD</span>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Admin dashboard sections">
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
                    onClick={() => { onSelectTab(item.id); onClose() }}
                    className={`flex min-h-11 w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-orange-50 text-[#FF6A00] shadow-sm dark:bg-orange-950/40'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#FF6A00]' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-black ${item.badgeColor}`}>{item.badge}</span>
                    )}
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
          <button type="button" onClick={() => { onOpenSystemStatus(); onClose() }} className="flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-left dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white"><Activity className="h-4 w-4 text-emerald-600" />System Status</span>
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">99.98%</span>
          </button>
          <button type="button" onClick={() => { onOpenAdminProfile(); onClose() }} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B132B] text-xs font-black text-white">GM</div>
            <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-900 dark:text-white">{adminName}</p><p className="truncate text-[10px] text-slate-400">{adminRole}</p></div>
          </button>
        </div>
      </aside>
    </div>
  )
}
