'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Menu } from 'lucide-react'
import { BusinessSidebarSection, BusinessOpportunityItem, BusinessPartnerItem, RewardFundingBalance } from './business/types'
import { BusinessToastProvider } from './business/BusinessToast'
import { BusinessMobileSidebar, BusinessSidebar } from './business/BusinessSidebar'
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

// Services & Domain
import { listOpportunities } from '@/modules/deals/service'
import type { OpportunityItem } from '@/modules/deals/types'

// Initial Data
import {
  MOCK_BUSINESS_OPPORTUNITIES,
  MOCK_BUSINESS_PARTNERS,
  MOCK_FUNDING_BALANCE,
} from './business/mockData'

interface BusinessDashboardViewProps {
  initialTab?: BusinessSidebarSection
  businessName?: string
  profilePhotoUrl?: string
  registrationNumber?: string
  onCreateDeal?: () => void
  onExploreDeals?: () => void
  onSignOut?: () => void
}

function mapDealToBusinessOpportunity(opp: OpportunityItem): BusinessOpportunityItem {
  return {
    id: opp.id,
    slug: opp.slug,
    title: opp.title,
    publicSummary: opp.summary,
    subscriberDescription: opp.description,
    type: (opp.type as any) || 'COMMERCIAL_DEAL',
    category: opp.category,
    region: opp.region,
    commercialResult: 'COMPLETED_SALE',
    rewardStructure: 'FIXED_REWARD',
    rewardValueTZS: Number((opp as any).baseRewardValue || (opp as any).rewardValue || 50000),
    budgetTZS: 5000000,
    spentTZS: 0,
    status: (opp.status as any) || 'PUBLISHED',
    version: 1,
    activePartners: opp.activePartnerCount || 0,
    totalConversions: 0,
    trackingMethod: 'PROMO_CODE',
    startDate: new Date().toISOString().split('T')[0],
    endDate: 'Open Access',
    attributionWindowDays: 30,
    partnerDeliverables: opp.description,
    evidenceRequired: opp.termsAndConditions || 'Verified customer receipt and merchant sign-off.',
    cancellationTerms: '7 days written notice with protection for all verified conversions.',
    coverImageUrl: opp.featuredImageUrl,
    promoVideoUrl: opp.promoVideoUrl,
    createdAt: 'Active',
    marketingAssets: [
      { id: '1', name: 'Product Banner 1080p', url: opp.featuredImageUrl || '', type: 'IMAGE', size: '1.2 MB' },
      { id: '2', name: 'Commercial Term Sheet PDF', url: '#', type: 'PDF', size: '240 KB' },
    ],
  }
}

export function BusinessDashboardView({
  initialTab = 'overview',
  businessName = 'My Business',
  profilePhotoUrl,
  registrationNumber,
  onCreateDeal,
  onExploreDeals,
  onSignOut,
}: BusinessDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<BusinessSidebarSection>(initialTab)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showWizardModal, setShowWizardModal] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Central state managed across tabs
  const [opportunities, setOpportunities] = useState<BusinessOpportunityItem[]>([])
  const [partners, setPartners] = useState<BusinessPartnerItem[]>(MOCK_BUSINESS_PARTNERS)
  const [fundingBalance, setFundingBalance] = useState<RewardFundingBalance>(MOCK_FUNDING_BALANCE)

  const reloadData = useCallback(() => {
    const rawOpps = listOpportunities()
    const mapped = rawOpps.map(mapDealToBusinessOpportunity)
    setOpportunities(mapped)

    // Load active partners from joined deals in storage
    if (typeof window !== 'undefined') {
      try {
        const joined = JSON.parse(localStorage.getItem('lumo_partner_joined_deals') || '[]')
        if (Array.isArray(joined) && joined.length > 0) {
          const partnerList: BusinessPartnerItem[] = joined.map((j: any, idx: number) => ({
            id: `p_${idx}_${j.opportunityId}`,
            partnerName: j.referralId ? `Partner (${j.referralId.slice(0, 8)})` : 'Verified Partner',
            partnerType: 'SALES_AGENT',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            phoneMasked: '+255 712 *** ***',
            channels: ['WhatsApp Groups', 'Direct Sales', 'Instagram'],
            region: 'Dar es Salaam',
            performanceScore: 94,
            completedDeals: 12,
            conversionQuality: '99.2%',
            cancellationRate: '0.8%',
            businessRating: 4.9,
            appliedOpportunityId: j.opportunityId,
            appliedOpportunityTitle: j.title || 'Commercial Campaign',
            applicationDate: j.joinedDate || new Date().toLocaleDateString(),
            applicationPitch: 'Direct distribution network with active corporate & retail client reach.',
            status: 'ACTIVE',
            joinedProgramDate: j.joinedDate || new Date().toLocaleDateString(),
            totalEarnedTZS: j.earningsEarnedTZS || 0,
            verifiedConversionsCount: j.verifiedConversionsCount || 0,
          }))
          setPartners(partnerList)
        }
      } catch (e) {
        console.warn('Could not load joined partners for business', e)
      }
    }
  }, [])

  useEffect(() => {
    reloadData()
    const handleUpdate = () => reloadData()
    window.addEventListener('lumo:deals-updated', handleUpdate)
    window.addEventListener('lumo:joined-deals-updated', handleUpdate)
    return () => {
      window.removeEventListener('lumo:deals-updated', handleUpdate)
      window.removeEventListener('lumo:joined-deals-updated', handleUpdate)
    }
  }, [reloadData])

  const handleOpportunityCreated = (newOpp: BusinessOpportunityItem) => {
    setOpportunities([newOpp, ...opportunities])
    setActiveTab('my_opportunities')
  }

  return (
    <BusinessToastProvider>
      <div className="dashboard-shell w-full bg-[#F8FAFC] dark:bg-[#0B1220] min-h-screen text-[#0F172A] dark:text-slate-100 flex flex-col lg:flex-row transition-colors">
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
          profilePhotoUrl={profilePhotoUrl}
          registrationNumber={registrationNumber}
          pendingApplicationsCount={partners.filter((p) => p.status === 'APPLIED').length}
          activeDealRoomsCount={0}
          myOpportunitiesCount={opportunities.length}
        />

        <BusinessMobileSidebar
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenCreateWizard={() => setShowWizardModal(true)}
          businessName={businessName}
          profilePhotoUrl={profilePhotoUrl}
          registrationNumber={registrationNumber}
          pendingApplicationsCount={partners.filter((p) => p.status === 'APPLIED').length}
          activeDealRoomsCount={0}
          myOpportunitiesCount={opportunities.length}
          onBrowseMarketplace={onExploreDeals}
          onSignOut={onSignOut}
        />

        {/* ========================================================================= */}
        {/* MAIN DASHBOARD CONTENT AREA                                               */}
        {/* ========================================================================= */}
        <main className="dashboard-main min-w-0 flex-1 w-full space-y-5 sm:space-y-6">
          {/* Top Header Bar */}
          <div className="dashboard-topbar bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-[#FF6A00] dark:border-slate-700 sm:h-10 sm:w-10"
                aria-label="Open business navigation"
                aria-expanded={mobileSidebarOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="min-w-0 truncate text-sm font-black text-[#0F172A] dark:text-white sm:text-xl">
                {activeTab === 'overview' && 'Business Overview'}
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

            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline-block">
                  {registrationNumber ? `BRELA #${registrationNumber}` : 'BRELA Verified'}
                </span>
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
          {activeTab === 'business_profile' && (
            <BusinessProfileTab
              businessName={businessName}
              profilePhotoUrl={profilePhotoUrl}
              registrationNumber={registrationNumber}
            />
          )}
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
