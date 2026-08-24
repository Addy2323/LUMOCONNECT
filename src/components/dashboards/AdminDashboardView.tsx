'use client'

import React, { useState } from 'react'
import {
  Search,
  Bell,
  Layers,
  ChevronRight,
  Shield,
  Activity,
  User,
  ExternalLink,
} from 'lucide-react'
import { AdminSidebarSection, AdminRole } from './admin/types'
import { AdminSidebar } from './admin/AdminSidebar'
import { SystemStatusModal } from './admin/SystemStatusModal'
import { AdminProfileModal } from './admin/AdminProfileModal'
import { AdminToastProvider } from './admin/AdminToast'

// Tab components
import { OverviewTab } from './admin/tabs/OverviewTab'
import { UsersAccessTab } from './admin/tabs/UsersAccessTab'
import { BusinessVerificationTab } from './admin/tabs/BusinessVerificationTab'
import { DealsRegistryTab } from './admin/tabs/DealsRegistryTab'
import { DealApprovalsTab } from './admin/tabs/DealApprovalsTab'
import { ConversionsAttributionTab } from './admin/tabs/ConversionsAttributionTab'
import { SubscriptionsTab } from './admin/tabs/SubscriptionsTab'
import { PaymentsTab } from './admin/tabs/PaymentsTab'
import { RewardsPayoutsTab } from './admin/tabs/RewardsPayoutsTab'
import { ReconciliationTab } from './admin/tabs/ReconciliationTab'
import { TaxStatementsTab } from './admin/tabs/TaxStatementsTab'
import { KycComplianceTab } from './admin/tabs/KycComplianceTab'
import { FraudRiskTab } from './admin/tabs/FraudRiskTab'
import { DisputesComplaintsTab } from './admin/tabs/DisputesComplaintsTab'
import { AuditLogsTab } from './admin/tabs/AuditLogsTab'
import { NotificationsTab } from './admin/tabs/NotificationsTab'
import { ContentPromotionsTab } from './admin/tabs/ContentPromotionsTab'
import { RolesPermissionsTab } from './admin/tabs/RolesPermissionsTab'
import { IntegrationsWebhooksTab } from './admin/tabs/IntegrationsWebhooksTab'
import { SystemSettingsTab } from './admin/tabs/SystemSettingsTab'

interface AdminDashboardViewProps {
  adminName?: string
  onExploreDeals?: () => void
}

export function AdminDashboardView({
  adminName = 'Given',
  onExploreDeals,
}: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<AdminSidebarSection>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showReviewQueueModal, setShowReviewQueueModal] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'VERIFICATIONS' | 'DEALS' | 'REWARDS' | 'FLAGGED'>('ALL')
  const [currentAdminRole, setCurrentAdminRole] = useState<AdminRole>('SUPER_ADMIN')

  // Mobile fast navigation pills
  const mobilePills: { id: AdminSidebarSection; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'verifications', label: 'Verifications' },
    { id: 'approvals', label: 'Deal Approvals' },
    { id: 'conversions', label: 'Attribution' },
    { id: 'payments', label: 'Payments' },
    { id: 'payouts', label: 'Payouts' },
    { id: 'tax', label: 'TRA 5% Tax' },
    { id: 'risk', label: 'Fraud & Risk' },
    { id: 'disputes', label: 'Disputes' },
    { id: 'logs', label: 'Audit Logs' },
    { id: 'integrations', label: 'Webhooks' },
  ]

  const handleOpenReviewQueue = (filter: 'ALL' | 'VERIFICATIONS' | 'DEALS' | 'REWARDS' | 'FLAGGED' = 'ALL') => {
    setReviewFilter(filter)
    setShowReviewQueueModal(true)
  }

  return (
    <AdminToastProvider>
      <div className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] min-h-[calc(100vh-80px)] text-[#0F172A] dark:text-slate-100 flex flex-col lg:flex-row gap-6 items-start pb-20 md:pb-16 transition-colors">
      {/* ========================================================================= */}
      {/* DESKTOP 4-GROUP STRUCTURED ADMIN SIDEBAR                                  */}
      {/* ========================================================================= */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        adminName={`${adminName} M.`}
        adminRole={
          currentAdminRole === 'SUPER_ADMIN'
            ? 'Super Administrator'
            : currentAdminRole === 'MAKER_OPERATIONS'
            ? 'Maker / Operations'
            : currentAdminRole === 'CHECKER_COMPLIANCE'
            ? 'Checker / Compliance'
            : currentAdminRole === 'FINANCE_ADMIN'
            ? 'Finance Admin'
            : 'Support Officer'
        }
        onOpenSystemStatus={() => setShowStatusModal(true)}
        onOpenAdminProfile={() => setShowProfileModal(true)}
        pendingVerificationsCount={0}
        pendingDealsCount={0}
        flaggedRiskCount={0}
        openDisputesCount={0}
      />

      {/* ========================================================================= */}
      {/* MAIN DASHBOARD CONTENT AREA                                               */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full space-y-5 sm:space-y-6">
        {/* MOBILE HORIZONTAL PILLS SCROLLER (VISIBLE ONLY ON MOBILE <lg) */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          {mobilePills.map((pill) => {
            const isActive = activeTab === pill.id
            return (
              <button
                key={pill.id}
                onClick={() => setActiveTab(pill.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-2xs shrink-0 ${
                  isActive
                    ? 'bg-[#FF6A00] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>{pill.label}</span>
              </button>
            )
          })}
        </div>

        {/* Top Header Bar */}
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-xl font-black text-[#0F172A] dark:text-white truncate">
              {activeTab === 'overview' && 'Overview & Performance Monitor'}
              {activeTab === 'users' && 'Users, Access & Role Management'}
              {activeTab === 'verifications' && 'Business KYB Document Approvals'}
              {activeTab === 'deals' && 'Deals & Opportunities Repository'}
              {activeTab === 'approvals' && 'Pending Deal Approvals (Dual Control)'}
              {activeTab === 'conversions' && 'Conversions & Attribution Engine'}
              {activeTab === 'subscriptions' && 'Partner Subscriptions & Plans'}
              {activeTab === 'payments' && 'Incoming Payments & Settlement Ledger'}
              {activeTab === 'payouts' && 'Rewards & Partner Payout Batches'}
              {activeTab === 'reconciliation' && 'Payment Provider Reconciliation'}
              {activeTab === 'tax' && 'TRA Tax & Statutory Withholding (5%)'}
              {activeTab === 'kyc' && 'KYC & Identity Compliance'}
              {activeTab === 'risk' && 'Fraud Engine & Anomaly Case Management'}
              {activeTab === 'disputes' && 'Disputes, Complaints & Mediation'}
              {activeTab === 'logs' && 'Immutable Platform Audit Ledger'}
              {activeTab === 'notifications' && 'Automated Communications & SMS/Email'}
              {activeTab === 'content' && 'Promotions, Banners & Featured Content'}
              {activeTab === 'roles' && 'Internal RBAC Roles & Privileges'}
              {activeTab === 'integrations' && 'Payment Gateways & Webhooks'}
              {activeTab === 'settings' && 'Platform Settings & Versioned Config'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              onClick={() => handleOpenReviewQueue('ALL')}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Open Review Queue"
              title="Open Review Queue"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline-block">System 99.98%</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB ROUTING RENDERER                                                      */}
        {/* ========================================================================= */}
        {/* GROUP 1: PLATFORM */}
        {activeTab === 'overview' && (
          <OverviewTab
            adminName={adminName}
            onOpenReviewQueue={handleOpenReviewQueue}
            onNavigateTab={setActiveTab}
          />
        )}
        {activeTab === 'users' && <UsersAccessTab />}
        {activeTab === 'verifications' && <BusinessVerificationTab />}
        {activeTab === 'deals' && <DealsRegistryTab />}
        {activeTab === 'approvals' && <DealApprovalsTab />}
        {activeTab === 'conversions' && <ConversionsAttributionTab />}

        {/* GROUP 2: FINANCIAL OPERATIONS */}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'payouts' && <RewardsPayoutsTab />}
        {activeTab === 'reconciliation' && <ReconciliationTab />}
        {activeTab === 'tax' && <TaxStatementsTab />}

        {/* GROUP 3: RISK & SUPPORT */}
        {activeTab === 'kyc' && <KycComplianceTab />}
        {activeTab === 'risk' && <FraudRiskTab />}
        {activeTab === 'disputes' && <DisputesComplaintsTab />}
        {activeTab === 'logs' && <AuditLogsTab />}

        {/* GROUP 4: SYSTEM */}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'content' && <ContentPromotionsTab />}
        {activeTab === 'roles' && <RolesPermissionsTab />}
        {activeTab === 'integrations' && <IntegrationsWebhooksTab />}
        {activeTab === 'settings' && <SystemSettingsTab />}
      </main>

      {/* ========================================================================= */}
      {/* SYSTEM STATUS MONITORING MODAL                                            */}
      {/* ========================================================================= */}
      <SystemStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentUserRole={currentAdminRole}
      />

      {/* ========================================================================= */}
      {/* ADMINISTRATOR PROFILE MODAL                                               */}
      {/* ========================================================================= */}
      <AdminProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        adminName={`${adminName} M.`}
        adminRole={
          currentAdminRole === 'SUPER_ADMIN'
            ? 'Super Administrator'
            : currentAdminRole === 'MAKER_OPERATIONS'
            ? 'Maker / Operations Admin'
            : currentAdminRole === 'CHECKER_COMPLIANCE'
            ? 'Checker / Compliance Admin'
            : currentAdminRole === 'FINANCE_ADMIN'
            ? 'Finance Administrator'
            : 'Support Officer'
        }
        onSwitchRole={(role) => setCurrentAdminRole(role)}
        onSignOut={() => {
          setShowProfileModal(false)
          alert('Signed out of Admin Console.')
        }}
      />

      {/* ========================================================================= */}
      {/* REVIEW & APPROVAL QUEUE MODAL                                             */}
      {/* ========================================================================= */}
      {showReviewQueueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setShowReviewQueueModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6A00] flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Platform Review & Approval Queue ({reviewFilter})
                </h3>
                <div className="text-xs text-slate-500">
                  Maker-Checker Dual Control & Compliance Queue
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs font-bold overflow-x-auto no-scrollbar">
              {(['ALL', 'VERIFICATIONS', 'DEALS', 'REWARDS', 'FLAGGED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setReviewFilter(f)}
                  className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap ${
                    reviewFilter === f
                      ? 'bg-[#FF6A00] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500 space-y-1.5">
                <Layers className="w-8 h-8 mx-auto text-slate-400 opacity-80" />
                <div className="font-bold text-slate-700 dark:text-slate-300">All Review Queues Are Currently Clear</div>
                <div>No pending business verifications, deal approvals, payout batches, or flagged fraud cases awaiting compliance review.</div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminToastProvider>
  )
}
