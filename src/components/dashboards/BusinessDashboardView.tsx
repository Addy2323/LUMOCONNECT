'use client'

import React, { useState } from 'react'
import {
  Bell,
  Search,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Users,
  Target,
  Wallet,
  Megaphone,
  BarChart3,
  Building2,
  Lock,
} from 'lucide-react'
import { BusinessSidebarSection, BusinessOpportunityItem, BusinessPartnerItem, RewardFundingBalance } from './business/types'
import { BusinessToastProvider } from './business/BusinessToast'
import { BusinessSidebar } from './business/BusinessSidebar'
import { CreateOpportunityWizardModal } from './business/tabs/CreateOpportunityWizardModal'

// Tab components
import { OverviewTab } from './business/tabs/OverviewTab'
import { MyOpportunitiesTab } from './business/tabs/MyOpportunitiesTab'
import { PartnersApplicationsTab } from './business/tabs/PartnersApplicationsTab'
import { DealRoomsTab } from './business/tabs/DealRoomsTab'
import { DealPerformanceTab } from './business/tabs/DealPerformanceTab'
import { ConversionsResultsTab } from './business/tabs/ConversionsResultsTab'
import { RewardsCommissionsTab } from './business/tabs/RewardsCommissionsTab'
import { PaymentsFundingTab } from './business/tabs/PaymentsFundingTab'
import { CampaignsTab } from './business/tabs/CampaignsTab'
import { PartnerDiscoveryTab } from './business/tabs/PartnerDiscoveryTab'
import { AudienceInsightsTab } from './business/tabs/AudienceInsightsTab'
import { ReportsExportsTab } from './business/tabs/ReportsExportsTab'
import { TrackingIntegrationsTab } from './business/tabs/TrackingIntegrationsTab'
import { BillingSubscriptionTab } from './business/tabs/BillingSubscriptionTab'
import { BusinessProfileTab } from './business/tabs/BusinessProfileTab'
import { TeamAccessTab } from './business/tabs/TeamAccessTab'
import { SettingsSecurityTab } from './business/tabs/SettingsSecurityTab'
import { HelpSupportTab } from './business/tabs/HelpSupportTab'

// Initial Data
import {
  MOCK_BUSINESS_OPPORTUNITIES,
  MOCK_BUSINESS_PARTNERS,
  MOCK_FUNDING_BALANCE,
} from './business/mockData'

interface BusinessDashboardViewProps {
  businessName?: string
  onCreateDeal?: () => void
  onExploreDeals?: () => void
}

export function BusinessDashboardView({
  businessName = 'Kijani Solar Tech',
  onCreateDeal,
  onExploreDeals,
}: BusinessDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<BusinessSidebarSection>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showWizardModal, setShowWizardModal] = useState(false)

  // Central state managed across tabs
  const [opportunities, setOpportunities] = useState<BusinessOpportunityItem[]>(MOCK_BUSINESS_OPPORTUNITIES)
  const [partners, setPartners] = useState<BusinessPartnerItem[]>(MOCK_BUSINESS_PARTNERS)
  const [fundingBalance, setFundingBalance] = useState<RewardFundingBalance>(MOCK_FUNDING_BALANCE)

  // Mobile fast navigation pills
  const mobilePills: { id: BusinessSidebarSection; label: string; isWizard?: boolean }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'create_opportunity', label: '+ Create Opportunity', isWizard: true },
    { id: 'my_opportunities', label: 'My Opportunities' },
    { id: 'partners_applications', label: 'Partners' },
    { id: 'deal_rooms', label: 'Deal Rooms' },
    { id: 'deal_performance', label: 'Performance' },
    { id: 'conversions_results', label: 'Conversions' },
    { id: 'rewards_commissions', label: 'Rewards' },
    { id: 'payments_funding', label: 'Reward Balance' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'partner_discovery', label: 'Find Partners' },
    { id: 'tracking_integrations', label: 'Integrations' },
    { id: 'billing_subscription', label: 'Billing' },
  ]

  const handleOpportunityCreated = (newOpp: BusinessOpportunityItem) => {
    setOpportunities([newOpp, ...opportunities])
    setActiveTab('my_opportunities')
  }

  return (
    <BusinessToastProvider>
      <div className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] min-h-[calc(100vh-80px)] text-[#0F172A] dark:text-slate-100 flex flex-col lg:flex-row gap-6 items-start pb-20 md:pb-16 transition-colors">
        {/* ========================================================================= */}
        {/* DESKTOP 4-GROUP STRUCTURED BUSINESS SIDEBAR                               */}
        {/* ========================================================================= */}
        <BusinessSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenCreateWizard={() => setShowWizardModal(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          businessName={businessName}
          pendingApplicationsCount={partners.filter((p) => p.status === 'APPLIED').length}
          activeDealRoomsCount={0}
          myOpportunitiesCount={opportunities.length}
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
                  onClick={() => {
                    if (pill.isWizard) {
                      setShowWizardModal(true)
                    } else {
                      setActiveTab(pill.id)
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-2xs shrink-0 ${
                    pill.isWizard
                      ? 'bg-[#FF6A00] text-white shadow-xs'
                      : isActive
                      ? 'bg-[#0B132B] text-white shadow-xs font-extrabold'
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
                {activeTab === 'overview' && 'Business Overview & Commercial Pulse'}
                {activeTab === 'create_opportunity' && 'Create Commercial Opportunity'}
                {activeTab === 'my_opportunities' && 'My Opportunities & Terms Registry'}
                {activeTab === 'partners_applications' && 'Partners & Opportunity Applications'}
                {activeTab === 'deal_rooms' && 'Deal Rooms & B2B Negotiations'}
                {activeTab === 'deal_performance' && 'Deal Performance & ROI Analytics'}
                {activeTab === 'conversions_results' && 'Commercial Outcomes & Conversions'}
                {activeTab === 'rewards_commissions' && 'Rewards, Commissions & Obligations'}
                {activeTab === 'payments_funding' && 'Reward Funding Balance & Escrow'}
                {activeTab === 'campaigns' && 'Campaign Groups & Strategic Initiatives'}
                {activeTab === 'partner_discovery' && 'Verified Partner Talent Directory'}
                {activeTab === 'audience_insights' && 'Audience Reach & Channel Insights'}
                {activeTab === 'reports_exports' && 'Performance Reports & Statutory Exports'}
                {activeTab === 'tracking_integrations' && 'Tracking Links, QR Codes & Webhooks'}
                {activeTab === 'billing_subscription' && 'Business SaaS Membership & Billing'}
                {activeTab === 'business_profile' && 'Business Profile & Verified Legal Credentials'}
                {activeTab === 'team_access' && 'Team Members & Portal Access Roles'}
                {activeTab === 'settings_security' && 'Security, MFA & Notification Preferences'}
                {activeTab === 'help_support' && 'Help Desk, Disputes & Support Center'}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setShowWizardModal(true)}
                className="hidden sm:flex py-2 px-3.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Create Opportunity</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline-block">BRELA #184920</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB ROUTING RENDERER                                                      */}
          {/* ========================================================================= */}
          {/* GROUP 1: WORKSPACE */}
          {activeTab === 'overview' && (
            <OverviewTab
              businessName={businessName}
              fundingBalance={fundingBalance}
              opportunities={opportunities}
              partners={partners}
              onOpenCreateWizard={() => setShowWizardModal(true)}
              onNavigateTab={setActiveTab}
            />
          )}
          {activeTab === 'create_opportunity' && (
            <OverviewTab
              businessName={businessName}
              fundingBalance={fundingBalance}
              opportunities={opportunities}
              partners={partners}
              onOpenCreateWizard={() => setShowWizardModal(true)}
              onNavigateTab={setActiveTab}
            />
          )}
          {activeTab === 'my_opportunities' && (
            <MyOpportunitiesTab
              opportunities={opportunities}
              setOpportunities={setOpportunities}
              onOpenCreateWizard={() => setShowWizardModal(true)}
            />
          )}
          {activeTab === 'partners_applications' && (
            <PartnersApplicationsTab
              partners={partners}
              setPartners={setPartners}
            />
          )}
          {activeTab === 'deal_rooms' && <DealRoomsTab />}

          {/* GROUP 2: PERFORMANCE */}
          {activeTab === 'deal_performance' && (
            <DealPerformanceTab opportunities={opportunities} />
          )}
          {activeTab === 'conversions_results' && <ConversionsResultsTab />}
          {activeTab === 'rewards_commissions' && <RewardsCommissionsTab />}
          {activeTab === 'payments_funding' && (
            <PaymentsFundingTab
              fundingBalance={fundingBalance}
              setFundingBalance={setFundingBalance}
            />
          )}

          {/* GROUP 3: GROWTH */}
          {activeTab === 'campaigns' && <CampaignsTab />}
          {activeTab === 'partner_discovery' && (
            <PartnerDiscoveryTab opportunities={opportunities} />
          )}
          {activeTab === 'audience_insights' && <AudienceInsightsTab />}
          {activeTab === 'reports_exports' && <ReportsExportsTab />}

          {/* GROUP 4: ACCOUNT & SYSTEM */}
          {activeTab === 'tracking_integrations' && <TrackingIntegrationsTab />}
          {activeTab === 'billing_subscription' && <BillingSubscriptionTab />}
          {activeTab === 'business_profile' && <BusinessProfileTab />}
          {activeTab === 'team_access' && <TeamAccessTab />}
          {activeTab === 'settings_security' && <SettingsSecurityTab />}
          {activeTab === 'help_support' && <HelpSupportTab />}
        </main>

        {/* ========================================================================= */}
        {/* 8-STEP CREATE OPPORTUNITY WIZARD MODAL                                    */}
        {/* ========================================================================= */}
        <CreateOpportunityWizardModal
          isOpen={showWizardModal}
          onClose={() => setShowWizardModal(false)}
          onOpportunityCreated={handleOpportunityCreated}
        />
      </div>
    </BusinessToastProvider>
  )
}
