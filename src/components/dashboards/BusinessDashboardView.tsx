'use client'

import { BackToHomeButton } from '@/components/shared/BackToHomeButton'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Menu, ShieldCheck, Clock, ShieldAlert, Shield } from 'lucide-react'
import { BusinessSidebarSection, BusinessOpportunityItem, BusinessPartnerItem, RewardFundingBalance } from './business/types'
import { BusinessToastProvider } from './business/BusinessToast'
import { BusinessMobileSidebar, BusinessSidebar } from './business/BusinessSidebar'
import { CreateOpportunityWizardModal } from './business/tabs/CreateOpportunityWizardModal'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

// Tab components
import { OverviewTab } from './business/tabs/OverviewTab'
import { MyOpportunitiesTab } from './business/tabs/MyOpportunitiesTab'
import { PartnersApplicationsTab } from './business/tabs/PartnersApplicationsTab'
import { DealPerformanceTab } from './business/tabs/DealPerformanceTab'
import { ConversionsResultsTab } from './business/tabs/ConversionsResultsTab'
import { RewardsCommissionsTab } from './business/tabs/RewardsCommissionsTab'
import { PaymentsFundingTab } from './business/tabs/PaymentsFundingTab'
import { PartnerDiscoveryTab } from './business/tabs/PartnerDiscoveryTab'
import { ReportsExportsTab } from './business/tabs/ReportsExportsTab'
import { BusinessProfileTab } from './business/tabs/BusinessProfileTab'
import { TeamAccessTab } from './business/tabs/TeamAccessTab'
import { SettingsSecurityTab } from './business/tabs/SettingsSecurityTab'
import { HelpSupportTab } from './business/tabs/HelpSupportTab'

interface BusinessDashboardViewProps {
  initialTab?: BusinessSidebarSection
  businessName?: string
  profilePhotoUrl?: string
  registrationNumber?: string
  userId?: string
  organizationId?: string
  verificationStatus?: string
  onCreateDeal?: () => void
  onExploreDeals?: () => void
  onSignOut?: () => void
}

const CLEAN_FUNDING_BALANCE: RewardFundingBalance = {
  availableBalanceTZS: 0,
  committedToActiveDealsTZS: 0,
  pendingConfirmationTZS: 0,
  rewardsPayableTZS: 0,
  rewardsPaidTZS: 0,
  refundableBalanceTZS: 0,
  safeguardingProvider: 'Not configured',
  lastReconciliationDate: 'Never',
}

export function BusinessDashboardView(props: BusinessDashboardViewProps) {
  return <BusinessDashboardContent key={`${props.userId ?? ''}:${props.organizationId ?? ''}`} {...props} />
}

function BusinessDashboardContent({
  initialTab = 'overview',
  businessName = 'My Business',
  profilePhotoUrl,
  registrationNumber: initialRegNumber,
  userId,
  organizationId,
  verificationStatus: initialVerificationStatus = 'NOT_SUBMITTED',
  onCreateDeal,
  onExploreDeals,
  onSignOut,
}: BusinessDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<BusinessSidebarSection>(initialTab)
  const contentScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeTab])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showWizardModal, setShowWizardModal] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Real Database State (Starts in clean 0-state)
  const [opportunities, setOpportunities] = useState<BusinessOpportunityItem[]>([])
  const [partners, setPartners] = useState<BusinessPartnerItem[]>([])
  const [fundingBalance, setFundingBalance] = useState<RewardFundingBalance>(CLEAN_FUNDING_BALANCE)
  const [currentVerificationStatus, setCurrentVerificationStatus] = useState<string>(initialVerificationStatus)
  const [currentRegNumber, setCurrentRegNumber] = useState<string | undefined>(initialRegNumber)
  const requestGeneration = useRef(0)
  const [loadError, setLoadError] = useState('')
  const [loadState, setLoadState] = useState<'LOADING' | 'ERROR' | 'SUCCESS'>('LOADING')
  const [editingDeal, setEditingDeal] = useState<any>(null)

  const reloadData = useCallback(async () => {
    const generation = ++requestGeneration.current
    setLoadError('')
    setLoadState('LOADING')
    try {
      // 1. Fetch business-owned opportunities
      const oppsRes = await fetch('/api/business/opportunities', { credentials: 'include' })
      if (generation !== requestGeneration.current) return
      if (!oppsRes.ok) throw new Error('Unable to load your business opportunities.')
      const oppsData = await oppsRes.json()
      if (oppsData.success && Array.isArray(oppsData.data)) {
        setOpportunities(oppsData.data)
      } else {
        setOpportunities([])
      }

      // 2. Fetch enrolled partners for business deals
      const partnersRes = await fetch('/api/business/partners', { credentials: 'include' })
      if (generation !== requestGeneration.current) return
      if (partnersRes.ok) {
        const partnersData = await partnersRes.json()
        if (partnersData.success && Array.isArray(partnersData.data)) {
          setPartners(partnersData.data)
        } else {
          setPartners([])
        }
      }

      // 3. Fetch real organization profile & verification status
      const profileRes = await fetch('/api/business/profile', { credentials: 'include' })
      if (generation !== requestGeneration.current) return
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        if (profileData.success && profileData.data) {
          if (profileData.data.verificationStatus) {
            setCurrentVerificationStatus(profileData.data.verificationStatus)
          }
          if (profileData.data.registrationNumber) {
            setCurrentRegNumber(profileData.data.registrationNumber)
          }
        }
      }
      setLoadState('SUCCESS')
    } catch (err: any) {
      if (generation !== requestGeneration.current) return
      setLoadError(err.message || 'Unable to load your business data. Please check your network and retry.')
      setLoadState('ERROR')
      console.warn('Could not reload business data:', err)
    }
  }, [userId, organizationId])

  useEffect(() => {
    reloadData()
    const handleUpdate = () => reloadData()
    window.addEventListener('lumo:deals-updated', handleUpdate)
    window.addEventListener('lumo:joined-deals-updated', handleUpdate)
    return () => {
      requestGeneration.current++
      window.removeEventListener('lumo:deals-updated', handleUpdate)
      window.removeEventListener('lumo:joined-deals-updated', handleUpdate)
    }
  }, [reloadData])

  const handleOpenCreateWizard = (deal?: any) => {
    setEditingDeal(deal || null)
    setShowWizardModal(true)
  }

  const handleOpportunityCreated = (newOpp: BusinessOpportunityItem) => {
    setOpportunities((prev) => [newOpp, ...prev])
    setActiveTab('my_opportunities')
    reloadData()
  }

  const renderTopBarBadge = () => {
    const norm = (currentVerificationStatus || 'NOT_SUBMITTED').toUpperCase()
    if (norm === 'VERIFIED') {
      return (
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline-block">
            {currentRegNumber ? `BRELA #${currentRegNumber}` : 'BRELA · TIN Verified'}
          </span>
        </div>
      )
    }
    if (norm === 'PENDING') {
      return (
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="hidden sm:inline-block">Verification In Review</span>
        </div>
      )
    }
    if (norm === 'REJECTED') {
      return (
        <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 dark:text-red-300 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="hidden sm:inline-block">Verification Rejected</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        <span className="hidden sm:inline-block">Unverified Business</span>
      </div>
    )
  }

  return (
    <BusinessToastProvider key={`${userId ?? ''}:${organizationId ?? ''}`}>
      <div className="dashboard-shell dashboard-viewport w-full bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-slate-100 flex flex-col lg:flex-row transition-colors">
        {/* ========================================================================= */}
        {/* DESKTOP 4-GROUP STRUCTURED BUSINESS SIDEBAR                               */}
        {/* ========================================================================= */}
        <BusinessSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenCreateWizard={() => handleOpenCreateWizard()}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          businessName={businessName}
          profilePhotoUrl={profilePhotoUrl}
          registrationNumber={currentRegNumber}
          verificationStatus={currentVerificationStatus}
          pendingApplicationsCount={partners.filter((p) => p.status === 'APPLIED').length}
          activeDealRoomsCount={0}
          myOpportunitiesCount={opportunities.length}
        />

        <BusinessMobileSidebar
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenCreateWizard={() => handleOpenCreateWizard()}
          businessName={businessName}
          profilePhotoUrl={profilePhotoUrl}
          registrationNumber={currentRegNumber}
          verificationStatus={currentVerificationStatus}
          pendingApplicationsCount={partners.filter((p) => p.status === 'APPLIED').length}
          activeDealRoomsCount={0}
          myOpportunitiesCount={opportunities.length}
          onBrowseMarketplace={onExploreDeals}
          onSignOut={onSignOut}
        />

        {/* ========================================================================= */}
        {/* MAIN DASHBOARD CONTENT AREA                                               */}
        {/* ========================================================================= */}
        <main className="dashboard-main min-w-0 flex-1 w-full">
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
                {activeTab === 'deal_performance' && 'Deal Performance & Attribution Analytics'}
                {activeTab === 'conversions_results' && 'Customer Conversions & Delivery Evidence'}
                {activeTab === 'rewards_commissions' && 'Partner Rewards & Payout Ledger'}
                {activeTab === 'payments_funding' && 'Partner Payment Records'}
                {activeTab === 'partner_discovery' && 'Partner Directory & Performance Recruitment'}
                {activeTab === 'reports_exports' && 'Reports, Audits & Data Exports'}
                {activeTab === 'business_profile' && 'Business Profile & Verified Legal Credentials'}
                {activeTab === 'team_access' && 'Team Members & Permissions'}
                {activeTab === 'settings_security' && 'Business Security & Governance'}
                {activeTab === 'help_support' && 'Help Desk, Disputes & Support Center'}
              </h1>
            </div>

            <BackToHomeButton onNavigate={onExploreDeals} />

            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <ThemeToggle variant="icon" />
              {renderTopBarBadge()}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB ROUTING RENDERER                                                      */}
          {/* ========================================================================= */}
          <div ref={contentScrollRef} className="dashboard-content space-y-5 sm:space-y-6" role="region" aria-label="Business dashboard content" tabIndex={0}>
            <a href="/hot-deals/submit" className="block rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-800">
              Submit a Private Hot Deal · Ownership evidence, capacity &amp; reward terms →
            </a>

            {loadState === 'LOADING' ? (
              <div className="py-20 text-center text-slate-400">
                <Clock className="w-8 h-8 animate-spin text-[#FF6A00] mx-auto mb-3" />
                <div className="font-bold text-slate-700 dark:text-slate-200">Loading your business workspace...</div>
                <div className="text-xs text-slate-400 mt-1">Retrieving opportunities, active partners, and commercial terms.</div>
              </div>
            ) : loadState === 'ERROR' ? (
              <div className="p-8 text-center bg-red-50 dark:bg-red-950/30 rounded-3xl border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200 space-y-3">
                <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
                <div className="font-extrabold text-base">Unable to load your business data</div>
                <p className="text-xs max-w-md mx-auto">{loadError || 'A network error occurred while retrieving your business records.'}</p>
                <button onClick={reloadData} className="py-2 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
                  Retry Connection
                </button>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <OverviewTab
                    businessName={businessName}
                    fundingBalance={fundingBalance}
                    opportunities={opportunities}
                    partners={partners}
                    onOpenCreateWizard={() => handleOpenCreateWizard()}
                    onNavigateTab={setActiveTab}
                  />
                )}
                {activeTab === 'create_opportunity' && (
                  <OverviewTab
                    businessName={businessName}
                    fundingBalance={fundingBalance}
                    opportunities={opportunities}
                    partners={partners}
                    onOpenCreateWizard={() => handleOpenCreateWizard()}
                    onNavigateTab={setActiveTab}
                  />
                )}
                {activeTab === 'my_opportunities' && (
                  <MyOpportunitiesTab
                    opportunities={opportunities}
                    setOpportunities={setOpportunities}
                    onOpenCreateWizard={(deal) => handleOpenCreateWizard(deal)}
                  />
                )}
                {activeTab === 'partners_applications' && (
                  <PartnersApplicationsTab
                    partners={partners}
                    setPartners={setPartners}
                  />
                )}

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
                {activeTab === 'partner_discovery' && (
                  <PartnerDiscoveryTab opportunities={opportunities} />
                )}
                {activeTab === 'reports_exports' && <ReportsExportsTab />}

                {/* GROUP 4: ACCOUNT & SYSTEM */}
                {activeTab === 'business_profile' && (
                  <BusinessProfileTab
                    businessName={businessName}
                    profilePhotoUrl={profilePhotoUrl}
                    registrationNumber={currentRegNumber}
                    verificationStatus={currentVerificationStatus}
                  />
                )}
                {activeTab === 'team_access' && <TeamAccessTab />}
                {activeTab === 'settings_security' && <SettingsSecurityTab />}
                {activeTab === 'help_support' && <HelpSupportTab />}
              </>
            )}
          </div>
        </main>

        {/* ========================================================================= */}
        {/* CREATE OPPORTUNITY WIZARD MODAL                                           */}
        {/* ========================================================================= */}
        <CreateOpportunityWizardModal
          isOpen={showWizardModal}
          onClose={() => {
            setShowWizardModal(false)
            setEditingDeal(null)
          }}
          initialDeal={editingDeal}
          onOpportunityCreated={handleOpportunityCreated}
        />
      </div>
    </BusinessToastProvider>
  )
}
