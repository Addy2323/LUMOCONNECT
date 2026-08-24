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
  ShoppingBag,
  GraduationCap,
  Award,
  CreditCard,
  Building,
  Shield,
  HelpCircle,
  Link,
  Bookmark,
  MessageSquareCode,
} from 'lucide-react'
import {
  PartnerSidebarSection,
  PartnerOpportunitySummary,
  JoinedDealItem,
  PartnerLeadItem,
  PartnerPerformanceMetrics,
  PartnerSubscriptionPlan,
} from './partner/types'
import { PartnerToastProvider } from './partner/PartnerToast'
import { PartnerSidebar } from './partner/PartnerSidebar'

// Tab components
import { OverviewTab } from './partner/tabs/OverviewTab'
import { DiscoverOpportunitiesTab } from './partner/tabs/DiscoverOpportunitiesTab'
import { SavedOpportunitiesTab } from './partner/tabs/SavedOpportunitiesTab'
import { MyDealsTab } from './partner/tabs/MyDealsTab'
import { LeadsReferralsTab } from './partner/tabs/LeadsReferralsTab'
import { DealRoomsTab } from './partner/tabs/DealRoomsTab'
import { PerformanceTab } from './partner/tabs/PerformanceTab'
import { TrackingLinksCodesTab } from './partner/tabs/TrackingLinksCodesTab'
import { EarningsPayoutsTab } from './partner/tabs/EarningsPayoutsTab'
import { NotificationsTab } from './partner/tabs/NotificationsTab'
import { SalesToolkitTab } from './partner/tabs/SalesToolkitTab'
import { TrainingCenterTab } from './partner/tabs/TrainingCenterTab'
import { PartnerScoreTab } from './partner/tabs/PartnerScoreTab'
import { ProfileVerificationTab } from './partner/tabs/ProfileVerificationTab'
import { SubscriptionTab } from './partner/tabs/SubscriptionTab'
import { PayoutMethodsTaxTab } from './partner/tabs/PayoutMethodsTaxTab'
import { SettingsSecurityTab } from './partner/tabs/SettingsSecurityTab'
import { HelpSupportTab } from './partner/tabs/HelpSupportTab'

// Initial Mock Data
import {
  MOCK_PARTNER_OPPORTUNITIES,
  MOCK_JOINED_DEALS,
  MOCK_PARTNER_LEADS,
  MOCK_PARTNER_PERFORMANCE,
  MOCK_PARTNER_SUBSCRIPTION,
} from './partner/mockData'

interface PartnerDashboardViewProps {
  partnerName?: string
  onOpenStatement?: () => void
  onExploreDeals?: () => void
  onNavigateToSubscriptions?: () => void
  onSelectOpportunity?: (dealId: string) => void
}

export function PartnerDashboardView({
  partnerName = 'Alex M.',
  onOpenStatement,
  onExploreDeals,
  onNavigateToSubscriptions,
  onSelectOpportunity,
}: PartnerDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<PartnerSidebarSection>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Central state managed across Partner tabs
  const [opportunities, setOpportunities] = useState<PartnerOpportunitySummary[]>(MOCK_PARTNER_OPPORTUNITIES)
  const [joinedDeals, setJoinedDeals] = useState<JoinedDealItem[]>(MOCK_JOINED_DEALS)
  const [leads, setLeads] = useState<PartnerLeadItem[]>(MOCK_PARTNER_LEADS)
  const [performance, setPerformance] = useState<PartnerPerformanceMetrics>(MOCK_PARTNER_PERFORMANCE)
  const [subscription, setSubscription] = useState<PartnerSubscriptionPlan>(MOCK_PARTNER_SUBSCRIPTION)

  // Submit Lead Modal Trigger
  const [showSubmitLeadModal, setShowSubmitLeadModal] = useState(false)
  const [selectedDealForLead, setSelectedDealForLead] = useState<JoinedDealItem | null>(null)

  // Fast Mobile Scroller Pills
  const mobilePills: { id: PartnerSidebarSection; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'discover', label: 'Discover' },
    { id: 'saved_opportunities', label: 'Saved' },
    { id: 'my_deals', label: 'My Deals' },
    { id: 'leads_referrals', label: 'Leads' },
    { id: 'deal_rooms', label: 'Deal Rooms' },
    { id: 'performance', label: 'Performance' },
    { id: 'earnings_payouts', label: 'Earnings' },
    { id: 'sales_toolkit', label: 'Sales Toolkit' },
    { id: 'training_center', label: 'Academy' },
    { id: 'subscription', label: 'Subscription' },
  ]

  const handleJoinOpportunity = (opp: PartnerOpportunitySummary) => {
    const isAlreadyJoined = joinedDeals.some((d) => d.opportunityId === opp.id)
    if (!isAlreadyJoined) {
      const newJoined: JoinedDealItem = {
        id: `joined_${Date.now()}`,
        opportunityId: opp.id,
        title: opp.title,
        businessName: opp.businessName,
        category: opp.category,
        status: 'ACTIVE',
        joinedDate: 'Today',
        rewardDisplay: opp.rewardDisplay,
        rewardValueTZS: opp.rewardValueTZS,
        trackingLink: `https://lumo.co.tz/d/${opp.slug}?partner=alex_m`,
        referralId: `LUMO-ALEX-${Date.now().toString().slice(-4)}`,
        promoCode: `ALEX${opp.slug.slice(0, 5).toUpperCase()}`,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://lumo.co.tz/d/${opp.slug}?partner=alex_m`,
        activeLeadsCount: 0,
        verifiedConversionsCount: 0,
        earningsEarnedTZS: 0,
        deliverablesSummary: opp.confidentialTerms?.qualifyingDeliverables || opp.publicSummary,
        evidenceRequired: opp.confidentialTerms?.evidenceRequired || 'Verified transaction matching.',
        milestoneProgressPercent: 0,
        canExit: true,
        coverImageUrl: opp.coverImageUrl,
        promoVideoUrl: opp.promoVideoUrl,
      }
      setJoinedDeals([newJoined, ...joinedDeals])
    }
    setActiveTab('my_deals')
  }

  const handleOpenSubmitLeadFromDeal = (deal: JoinedDealItem) => {
    setSelectedDealForLead(deal)
    setShowSubmitLeadModal(true)
    setActiveTab('leads_referrals')
  }

  return (
    <PartnerToastProvider>
      <div className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] min-h-[calc(100vh-80px)] text-[#0F172A] dark:text-slate-100 flex flex-col lg:flex-row gap-6 items-start pb-20 md:pb-16 transition-colors">
        {/* ========================================================================= */}
        {/* DESKTOP 4-GROUP STRUCTURED PARTNER SIDEBAR                                */}
        {/* ========================================================================= */}
        <PartnerSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          partnerName={partnerName}
          myDealsCount={joinedDeals.length}
          savedCount={opportunities.filter((o) => o.isSaved).length}
          leadsCount={leads.length}
          subscription={subscription}
          onManagePlan={() => setActiveTab('subscription')}
        />

        {/* ========================================================================= */}
        {/* MAIN PARTNER DASHBOARD CONTENT AREA                                       */}
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
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-2xs shrink-0 ${
                    isActive
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
                {activeTab === 'overview' && 'Partner Overview & Activity Pulse'}
                {activeTab === 'discover' && 'Discover Commercial Opportunities'}
                {activeTab === 'saved_opportunities' && 'Saved Opportunities & Bookmarks'}
                {activeTab === 'my_deals' && 'My Deals & Enrolled Campaigns'}
                {activeTab === 'leads_referrals' && 'Customer Leads & Commercial Referrals'}
                {activeTab === 'deal_rooms' && 'Deal Rooms & Negotiations'}
                {activeTab === 'performance' && 'Performance & Outcome Analytics'}
                {activeTab === 'tracking_links_codes' && 'Tracking Links, Promo Codes & QR'}
                {activeTab === 'earnings_payouts' && 'Earnings, Commissions & Payouts'}
                {activeTab === 'notifications' && 'Notifications & Operational Alerts'}
                {activeTab === 'sales_toolkit' && 'Sales & Marketing Promotional Toolkit'}
                {activeTab === 'training_center' && 'Partner Academy & Masterclasses'}
                {activeTab === 'partner_score' && 'Partner Score & Verified Reputation'}
                {activeTab === 'profile_verification' && 'Partner Profile & Verified KYC'}
                {activeTab === 'subscription' && 'Partner Access Pass & Subscription'}
                {activeTab === 'payout_methods_tax' && 'Payout Accounts & TRA Tax Certificates'}
                {activeTab === 'settings_security' && 'Security, MFA & Notification Preferences'}
                {activeTab === 'help_support' && 'Help Desk, Support & Dispute Center'}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline-block">Verified Partner · Score {performance.partnerScore}</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB ROUTING RENDERER                                                      */}
          {/* ========================================================================= */}
          {/* GROUP 1: WORKSPACE */}
          {activeTab === 'overview' && (
            <OverviewTab
              partnerName={partnerName}
              performance={performance}
              opportunities={opportunities}
              joinedDeals={joinedDeals}
              onNavigateTab={setActiveTab}
              onOpenOpportunityDetail={(opp) => {
                setActiveTab('discover')
              }}
              onOpenPayoutRequest={() => setActiveTab('earnings_payouts')}
            />
          )}

          {activeTab === 'discover' && (
            <DiscoverOpportunitiesTab
              opportunities={opportunities}
              setOpportunities={setOpportunities}
              subscription={subscription}
              onJoinOpportunity={handleJoinOpportunity}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'saved_opportunities' && (
            <SavedOpportunitiesTab
              opportunities={opportunities}
              setOpportunities={setOpportunities}
              onOpenOpportunityDetail={() => setActiveTab('discover')}
              onExploreMore={() => setActiveTab('discover')}
            />
          )}

          {activeTab === 'my_deals' && (
            <MyDealsTab
              joinedDeals={joinedDeals}
              setJoinedDeals={setJoinedDeals}
              onOpenSubmitLeadModal={handleOpenSubmitLeadFromDeal}
            />
          )}

          {activeTab === 'leads_referrals' && (
            <LeadsReferralsTab
              leads={leads}
              setLeads={setLeads}
              joinedDeals={joinedDeals}
              showNewLeadModal={showSubmitLeadModal}
              setShowNewLeadModal={setShowSubmitLeadModal}
              selectedDealForLead={selectedDealForLead}
            />
          )}

          {activeTab === 'deal_rooms' && <DealRoomsTab />}

          {/* GROUP 2: PERFORMANCE */}
          {activeTab === 'performance' && (
            <PerformanceTab performance={performance} joinedDeals={joinedDeals} />
          )}

          {activeTab === 'tracking_links_codes' && <TrackingLinksCodesTab />}

          {activeTab === 'earnings_payouts' && (
            <EarningsPayoutsTab onOpenStatement={onOpenStatement} />
          )}

          {activeTab === 'notifications' && <NotificationsTab />}

          {/* GROUP 3: GROW */}
          {activeTab === 'sales_toolkit' && (
            <SalesToolkitTab joinedDeals={joinedDeals} />
          )}

          {activeTab === 'training_center' && <TrainingCenterTab />}

          {activeTab === 'partner_score' && <PartnerScoreTab />}

          {/* GROUP 4: ACCOUNT */}
          {activeTab === 'profile_verification' && <ProfileVerificationTab />}

          {activeTab === 'subscription' && (
            <SubscriptionTab
              subscription={subscription}
              setSubscription={setSubscription}
            />
          )}

          {activeTab === 'payout_methods_tax' && <PayoutMethodsTaxTab />}

          {activeTab === 'settings_security' && <SettingsSecurityTab />}

          {activeTab === 'help_support' && <HelpSupportTab />}
        </main>
      </div>
    </PartnerToastProvider>
  )
}
