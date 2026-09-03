'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Sparkles,
  Menu,
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
import { PartnerMobileSidebar, PartnerSidebar } from './partner/PartnerSidebar'

// Tab components
import { OverviewTab } from './partner/tabs/OverviewTab'
import { DiscoverOpportunitiesTab } from './partner/tabs/DiscoverOpportunitiesTab'
import { SavedOpportunitiesTab } from './partner/tabs/SavedOpportunitiesTab'
import { MyDealsTab } from './partner/tabs/MyDealsTab'
import { LeadsReferralsTab } from './partner/tabs/LeadsReferralsTab'
import { DealRoomsTab } from './partner/tabs/DealRoomsTab'
import { PerformanceTab } from './partner/tabs/PerformanceTab'
import { EarningsPayoutsTab } from './partner/tabs/EarningsPayoutsTab'
import { NotificationsTab } from './partner/tabs/NotificationsTab'
import { ProfileVerificationTab } from './partner/tabs/ProfileVerificationTab'
import { SubscriptionTab } from './partner/tabs/SubscriptionTab'
import { HelpSupportTab } from './partner/tabs/HelpSupportTab'

// Services
import { listOpportunities } from '@/modules/deals/service'
import { getUserSubscription } from '@/modules/subscriptions/service'
import type { OpportunityItem } from '@/modules/deals/types'

// Initial Mock Data
import {
  MOCK_JOINED_DEALS,
  MOCK_PARTNER_KYC,
  MOCK_PARTNER_LEADS,
  MOCK_PARTNER_PERFORMANCE,
  MOCK_PARTNER_SUBSCRIPTION,
} from './partner/mockData'
import { calculatePartnerProfileCompletion } from './partner/profileCompletion'

interface PartnerDashboardViewProps {
  initialTab?: PartnerSidebarSection
  partnerName?: string
  email?: string
  phone?: string
  profilePhotoUrl?: string
  onOpenStatement?: () => void
  onExploreDeals?: () => void
  onNavigateToSubscriptions?: () => void
  onSelectOpportunity?: (dealId: string) => void
  onSignOut?: () => void
}

function mapOpportunityToPartnerSummary(
  opp: OpportunityItem,
  savedSet: Set<string>
): PartnerOpportunitySummary {
  return {
    id: opp.id,
    slug: opp.slug,
    title: opp.title,
    businessName: opp.companyName,
    businessLogo: opp.companyLogo,
    isBusinessVerified: opp.isVerified,
    category: opp.category,
    region: opp.region,
    type: (opp.type as any) || 'CUSTOMER_ACQUISITION',
    rewardDisplay: opp.rewardDisplay,
    rewardValueTZS: Number((opp as any).baseRewardValue || (opp as any).rewardValue || 50000),
    activePartnersCount: opp.activePartnerCount || 0,
    closingDate: 'Open Access',
    isSaved: savedSet.has(opp.id),
    coverImageUrl: opp.featuredImageUrl,
    promoVideoUrl: opp.promoVideoUrl,
    publicSummary: opp.summary,
    confidentialTerms: {
      subscriberDescription: opp.description,
      qualifyingDeliverables: opp.description,
      evidenceRequired: opp.termsAndConditions || 'Verified customer proof and merchant sign-off.',
      attributionWindowDays: 30,
    },
  }
}

export function PartnerDashboardView({
  initialTab = 'overview',
  partnerName = 'Alex M.',
  email,
  phone,
  profilePhotoUrl,
  onOpenStatement,
  onExploreDeals,
  onNavigateToSubscriptions,
  onSelectOpportunity,
  onSignOut,
}: PartnerDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<PartnerSidebarSection>(initialTab)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profileCompletion, setProfileCompletion] = useState(() =>
    calculatePartnerProfileCompletion({
      ...MOCK_PARTNER_KYC,
      fullName: partnerName,
      email: email || '',
      phoneMasked: phone || '',
    })
  )

  // Central state managed across Partner tabs
  const [opportunities, setOpportunities] = useState<PartnerOpportunitySummary[]>([])
  const [joinedDeals, setJoinedDeals] = useState<JoinedDealItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lumo_partner_joined_deals')
        if (saved) return JSON.parse(saved)
      } catch (e) {
        console.warn('Could not read joined deals from localStorage', e)
      }
    }
    return MOCK_JOINED_DEALS
  })
  const [leads, setLeads] = useState<PartnerLeadItem[]>(MOCK_PARTNER_LEADS)
  const [performance, setPerformance] = useState<PartnerPerformanceMetrics>(MOCK_PARTNER_PERFORMANCE)
  const [subscription, setSubscription] = useState<PartnerSubscriptionPlan>(MOCK_PARTNER_SUBSCRIPTION)

  // Submit Lead Modal Trigger
  const [showSubmitLeadModal, setShowSubmitLeadModal] = useState(false)
  const [selectedDealForLead, setSelectedDealForLead] = useState<JoinedDealItem | null>(null)

  // Reload Opportunities & Saved Bookmarks
  const reloadOpportunities = useCallback(() => {
    let savedIds: string[] = []
    if (typeof window !== 'undefined') {
      try {
        savedIds = JSON.parse(localStorage.getItem('lumo_saved_deals') || '[]')
      } catch (e) {
        console.warn('Could not parse lumo_saved_deals', e)
      }
    }
    const savedSet = new Set(savedIds)
    const rawOpps = listOpportunities()
    const mapped = rawOpps.map((opp) => mapOpportunityToPartnerSummary(opp, savedSet))
    setOpportunities(mapped)
  }, [])

  // Reload Subscription Status
  const reloadSubscription = useCallback(() => {
    const userIdentifier = email || partnerName || 'alex_partner'
    const userSub = getUserSubscription(userIdentifier) || getUserSubscription('alex_partner')
    if (userSub && userSub.isActive) {
      setSubscription({
        planName: userSub.planName,
        status: 'ACTIVE',
        daysRemaining: userSub.daysRemaining,
        priceTZS: userSub.amountPaidTZS || 25000,
        cycle: (userSub.planCode as any) || 'MONTHLY',
        expiryDate: userSub.expiresAt ? new Date(userSub.expiresAt).toLocaleDateString() : '—',
        autoRenew: userSub.autoRenew,
      })
    } else {
      setSubscription(MOCK_PARTNER_SUBSCRIPTION)
    }
  }, [email, partnerName])

  // Reload Joined Deals
  const reloadJoinedDeals = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lumo_partner_joined_deals')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            setJoinedDeals(parsed)
            return
          }
        }
      } catch (e) {
        console.warn('Could not read joined deals from localStorage', e)
      }
    }
  }, [])

  useEffect(() => {
    reloadOpportunities()
    reloadSubscription()
    reloadJoinedDeals()

    const handleDealsUpdate = () => reloadOpportunities()
    const handleSavedUpdate = () => reloadOpportunities()
    const handleSubUpdate = () => reloadSubscription()
    const handleJoinedUpdate = () => reloadJoinedDeals()

    window.addEventListener('lumo:deals-updated', handleDealsUpdate)
    window.addEventListener('lumo:saved-deals-updated', handleSavedUpdate)
    window.addEventListener('lumo:subscription-updated', handleSubUpdate)
    window.addEventListener('lumo:plans-updated', handleSubUpdate)
    window.addEventListener('lumo:joined-deals-updated', handleJoinedUpdate)

    return () => {
      window.removeEventListener('lumo:deals-updated', handleDealsUpdate)
      window.removeEventListener('lumo:saved-deals-updated', handleSavedUpdate)
      window.removeEventListener('lumo:subscription-updated', handleSubUpdate)
      window.removeEventListener('lumo:plans-updated', handleSubUpdate)
      window.removeEventListener('lumo:joined-deals-updated', handleJoinedUpdate)
    }
  }, [reloadOpportunities, reloadSubscription, reloadJoinedDeals])

  const saveJoinedDeals = (newDeals: JoinedDealItem[]) => {
    setJoinedDeals(newDeals)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo_partner_joined_deals', JSON.stringify(newDeals))
    }
  }

  const handleJoinOpportunity = (opp: PartnerOpportunitySummary) => {
    const isAlreadyJoined = joinedDeals.some((d) => d.opportunityId === opp.id)
    if (!isAlreadyJoined) {
      const partnerCode = (partnerName || 'alex').toLowerCase().replace(/[^a-z0-9]/g, '_')
      const newJoined: JoinedDealItem = {
        id: `joined_${Date.now()}`,
        opportunityId: opp.id,
        title: opp.title,
        businessName: opp.businessName,
        category: opp.category,
        status: 'ACTIVE',
        joinedDate: new Date().toLocaleDateString(),
        rewardDisplay: opp.rewardDisplay,
        rewardValueTZS: opp.rewardValueTZS,
        trackingLink: `https://lumo.co.tz/d/${opp.slug}?partner=${partnerCode}`,
        referralId: `LUMO-${partnerCode.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        promoCode: `${partnerCode.slice(0, 4).toUpperCase()}${opp.slug.slice(0, 4).toUpperCase()}`,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://lumo.co.tz/d/${opp.slug}?partner=${partnerCode}`,
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
      saveJoinedDeals([newJoined, ...joinedDeals])
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
      <div className="dashboard-shell w-full bg-[#F8FAFC] dark:bg-[#0B1220] min-h-screen text-[#0F172A] dark:text-slate-100 flex flex-col lg:flex-row transition-colors">
        {/* ========================================================================= */}
        {/* DESKTOP 4-GROUP STRUCTURED PARTNER SIDEBAR                                */}
        {/* ========================================================================= */}
        <PartnerSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          partnerName={partnerName}
          profilePhotoUrl={profilePhotoUrl}
          myDealsCount={joinedDeals.length}
          savedCount={opportunities.filter((o) => o.isSaved).length}
          leadsCount={leads.length}
          subscription={subscription}
          onManagePlan={() => {
            if (onNavigateToSubscriptions) {
              onNavigateToSubscriptions()
            } else {
              setActiveTab('subscription')
            }
          }}
        />

        <PartnerMobileSidebar
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          partnerName={partnerName}
          profilePhotoUrl={profilePhotoUrl}
          myDealsCount={joinedDeals.length}
          savedCount={opportunities.filter((o) => o.isSaved).length}
          leadsCount={leads.length}
          subscription={subscription}
          onBrowseMarketplace={onExploreDeals}
          onSignOut={onSignOut}
          onManagePlan={() => {
            if (onNavigateToSubscriptions) onNavigateToSubscriptions()
            else setActiveTab('subscription')
          }}
        />

        {/* ========================================================================= */}
        {/* MAIN PARTNER DASHBOARD CONTENT AREA                                       */}
        {/* ========================================================================= */}
        <main className="dashboard-main min-w-0 flex-1 w-full space-y-5 sm:space-y-6">
          {/* MOBILE SIDEBAR TRIGGER (VISIBLE ONLY BELOW DESKTOP BREAKPOINT) */}
          {/* Top Header Bar */}
          <div className="dashboard-topbar bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-[#FF6A00] dark:border-slate-700 sm:h-10 sm:w-10"
                aria-label="Open partner navigation"
                aria-expanded={mobileSidebarOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="min-w-0 truncate text-sm font-black text-[#0F172A] dark:text-white sm:text-xl">
                {activeTab === 'overview' && 'Mshirika wa Mauzo / Partner Overview'}
                {activeTab === 'discover' && 'Discover Commercial Opportunities'}
                {activeTab === 'saved_opportunities' && 'Saved Opportunities & Bookmarks'}
                {activeTab === 'my_deals' && 'My Deals & Enrolled Campaigns'}
                {activeTab === 'leads_referrals' && 'Customer Leads & Commercial Referrals'}
                {activeTab === 'deal_rooms' && 'Deal Rooms & Negotiations'}
                {activeTab === 'performance' && 'Performance & Outcome Analytics'}
                {activeTab === 'earnings_payouts' && 'Earnings, Commissions & Payouts'}
                {activeTab === 'notifications' && 'Notifications & Operational Alerts'}
                {activeTab === 'profile_verification' && 'Mshirika wa Mauzo / Partner Profile & Verified KYC'}
                {activeTab === 'subscription' && 'Partner Access Pass & Subscription'}
                {activeTab === 'help_support' && 'Help Desk, Support & Dispute Center'}
              </h1>
            </div>

            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              {subscription.status === 'ACTIVE' ? (
                <div
                  onClick={() => setActiveTab('subscription')}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-300 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                  title="Active PRO Subscription - Click to view countdown"
                >
                  <span className="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase shadow-2xs">
                    PRO
                  </span>
                  <span className="hidden sm:inline-block font-mono font-extrabold text-[#FF6A00]">
                    {subscription.daysRemaining}d remaining
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (onNavigateToSubscriptions) onNavigateToSubscriptions()
                    else setActiveTab('subscription')
                  }}
                  className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-xl bg-[#FF6A00] hover:bg-[#EA580C] text-white cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Get PRO Pass</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Profile {profileCompletion}%</span>
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
              profileCompletion={profileCompletion}
              onNavigateTab={setActiveTab}
              onOpenOpportunityDetail={(opp) => {
                if (subscription?.status !== 'ACTIVE') {
                  if (onNavigateToSubscriptions) {
                    onNavigateToSubscriptions()
                  } else {
                    setActiveTab('subscription')
                  }
                } else {
                  setActiveTab('discover')
                }
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
              onNavigateToSubscriptions={onNavigateToSubscriptions}
            />
          )}

          {activeTab === 'saved_opportunities' && (
            <SavedOpportunitiesTab
              opportunities={opportunities}
              setOpportunities={setOpportunities}
              onOpenOpportunityDetail={(opp) => {
                if (subscription?.status !== 'ACTIVE') {
                  if (onNavigateToSubscriptions) {
                    onNavigateToSubscriptions()
                  } else {
                    setActiveTab('subscription')
                  }
                } else {
                  setActiveTab('discover')
                }
              }}
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
            <PerformanceTab
              performance={performance}
              joinedDeals={joinedDeals}
              profileCompletion={profileCompletion}
            />
          )}

          {activeTab === 'earnings_payouts' && (
            <EarningsPayoutsTab onOpenStatement={onOpenStatement} />
          )}

          {activeTab === 'notifications' && <NotificationsTab />}

          {/* GROUP 3: ACCOUNT */}
          {activeTab === 'profile_verification' && (
            <ProfileVerificationTab
              partnerName={partnerName}
              email={email}
              phone={phone}
              profilePhotoUrl={profilePhotoUrl}
              onCompletionChange={setProfileCompletion}
            />
          )}

          {activeTab === 'subscription' && (
            <SubscriptionTab
              subscription={subscription}
              setSubscription={setSubscription}
              onNavigateToSubscriptions={onNavigateToSubscriptions}
            />
          )}

          {activeTab === 'help_support' && <HelpSupportTab />}
        </main>
      </div>
    </PartnerToastProvider>
  )
}
