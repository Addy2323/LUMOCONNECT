'use client'

import { BackToHomeButton } from '@/components/shared/BackToHomeButton'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import { useSubscriptionCountdown } from './partner/useSubscriptionCountdown'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

// Tab components
import { OverviewTab, type PartnerOverviewPayoutSummary } from './partner/tabs/OverviewTab'
import { DiscoverOpportunitiesTab } from './partner/tabs/DiscoverOpportunitiesTab'
import { SavedOpportunitiesTab } from './partner/tabs/SavedOpportunitiesTab'
import { MyDealsTab } from './partner/tabs/MyDealsTab'
import { LeadsReferralsTab } from './partner/tabs/LeadsReferralsTab'
import { PerformanceTab } from './partner/tabs/PerformanceTab'
import { EarningsPayoutsTab } from './partner/tabs/EarningsPayoutsTab'
import { NotificationsTab } from './partner/tabs/NotificationsTab'
import { ProfileVerificationTab } from './partner/tabs/ProfileVerificationTab'
import { SubscriptionTab } from './partner/tabs/SubscriptionTab'
import { SettingsSecurityTab } from './partner/tabs/SettingsSecurityTab'
import { HelpSupportTab } from './partner/tabs/HelpSupportTab'

// Services
import { listOpportunities, setOpportunitiesInStore } from '@/modules/deals/service'
import { getUserSubscription, setUserSubscription } from '@/modules/subscriptions/service'
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
  userId?: string
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
    businessName: 'Lumo Deals',
    businessLogo: opp.companyLogo || 'LD',
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
  userId,
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
  const contentScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeTab])
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

  const [subscription, setSubscription] = useState<PartnerSubscriptionPlan>(MOCK_PARTNER_SUBSCRIPTION)
  const countdown = useSubscriptionCountdown(subscription)
  const [opportunities, setOpportunities] = useState<PartnerOpportunitySummary[]>([])
  const [joinedDeals, setJoinedDeals] = useState<JoinedDealItem[]>([])
  const [leads, setLeads] = useState<PartnerLeadItem[]>(MOCK_PARTNER_LEADS)
  const [performance, setPerformance] = useState<PartnerPerformanceMetrics>(MOCK_PARTNER_PERFORMANCE)
  const [payoutSummary, setPayoutSummary] = useState<PartnerOverviewPayoutSummary | null>(null)

  // Reload Overview metrics and payout summary from authenticated server
  const reloadOverview = useCallback(() => {
    fetch('/api/partner/overview', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          if (data.payoutSummary) {
            setPayoutSummary(data.payoutSummary)
          }
          if (data.metrics) {
            setPerformance((prev) => ({
              ...prev,
              approvedRewardsTZS: data.metrics.availableEarningsTZS ?? prev.approvedRewardsTZS,
              qualifiedLeads: data.metrics.qualifiedLeadsCount ?? prev.qualifiedLeads,
              verifiedConversions: data.metrics.verifiedConversionsCount ?? prev.verifiedConversions,
            }))
          }
        }
      })
      .catch((err) => console.warn('Could not fetch partner overview:', err))
  }, [])

  // Submit Lead Modal Trigger
  const [showSubmitLeadModal, setShowSubmitLeadModal] = useState(false)
  const [selectedDealForLead, setSelectedDealForLead] = useState<JoinedDealItem | null>(null)

  // Reload Opportunities from shared storage & live database
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

    // Immediate render from local/cached opportunities
    const rawOpps = listOpportunities()
    if (rawOpps.length > 0) {
      setOpportunities(rawOpps.map((opp) => mapOpportunityToPartnerSummary(opp, savedSet)))
    }

    // Always fetch fresh authoritative opportunities from PostgreSQL database
    fetch('/api/opportunities')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const oppList = data?.opportunities || data?.data
        if (Array.isArray(oppList)) {
          setOpportunitiesInStore(oppList)
          setOpportunities(oppList.map((opp: any) => mapOpportunityToPartnerSummary(opp, savedSet)))
        }
      })
      .catch((err) => {
        console.warn('Could not fetch opportunities from server:', err)
      })
  }, [])

  // Reload Subscription Status from local store and database
  const reloadSubscription = useCallback(() => {
    // 1. Immediate sync from local/memory store
    const localSub =
      (userId ? getUserSubscription(userId) : null) ||
      (email ? getUserSubscription(email) : null) ||
      (partnerName ? getUserSubscription(partnerName) : null)

    if (localSub && localSub.isActive) {
      setSubscription({
        planName: localSub.planName,
        status: localSub.status,
        daysRemaining: localSub.daysRemaining,
        priceTZS: localSub.amountPaidTZS || 25000,
        cycle: (localSub.planCode as any) || 'MONTHLY',
        expiryDate: localSub.expiresAt ? new Date(localSub.expiresAt).toLocaleDateString() : '—',
        startedAtISO: localSub.startsAt ? new Date(localSub.startsAt).toISOString() : undefined,
        expiresAtISO: localSub.expiresAt ? new Date(localSub.expiresAt).toISOString() : undefined,
        autoRenew: localSub.autoRenew,
      })
    } else if (localSub) {
      setSubscription({
        planName: localSub.planName,
        status: localSub.status || 'EXPIRED',
        daysRemaining: 0,
        priceTZS: localSub.amountPaidTZS || 25000,
        cycle: (localSub.planCode as any) || 'MONTHLY',
        expiryDate: localSub.expiresAt ? new Date(localSub.expiresAt).toLocaleDateString() : '—',
        startedAtISO: localSub.startsAt ? new Date(localSub.startsAt).toISOString() : undefined,
        expiresAtISO: localSub.expiresAt ? new Date(localSub.expiresAt).toISOString() : undefined,
        autoRenew: localSub.autoRenew,
      })
    } else {
      setSubscription(MOCK_PARTNER_SUBSCRIPTION)
    }

    // 2. Query server database for permanently stored subscription
    if (typeof window !== 'undefined' && (userId || email)) {
      const q = new URLSearchParams()
      if (userId) q.set('userId', userId)
      if (email) q.set('email', email)

      fetch(`/api/subscriptions/active?${q.toString()}`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.subscription) {
            const s = data.subscription
            setSubscription({
              planName: s.planName,
              status: s.status,
              daysRemaining: s.daysRemaining,
              priceTZS: s.amountPaidTZS || 25000,
              cycle: (s.planCode as any) || 'MONTHLY',
              expiryDate: s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '—',
              startedAtISO: s.startsAt,
              expiresAtISO: s.expiresAt,
              serverTimeISO: data.serverTime || s.serverTime,
              remainingMilliseconds: s.remainingMilliseconds,
              autoRenew: s.autoRenew,
            })
            if (userId) setUserSubscription(userId, s)
            if (email) setUserSubscription(email, s)
          } else if (data?.success && !data.hasActiveSubscription) {
            setSubscription(MOCK_PARTNER_SUBSCRIPTION)
          }
        })
        .catch(() => {})
    }
  }, [userId, email, partnerName])

  // Reload Joined Deals from authenticated server database
  const reloadJoinedDeals = useCallback(() => {
    fetch('/api/partner/deals', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.deals)) {
          setJoinedDeals(data.deals)
        }
      })
      .catch((err) => console.warn('Could not fetch partner enrolled deals:', err))
  }, [])

  useEffect(() => {
    reloadOpportunities()
    reloadSubscription()
    reloadJoinedDeals()
    reloadOverview()

    const handleDealsUpdate = () => reloadOpportunities()
    const handleSavedUpdate = () => reloadOpportunities()
    const handleSubUpdate = () => reloadSubscription()
    const handleJoinedUpdate = () => {
      reloadJoinedDeals()
      reloadOverview()
    }
    const handleOverviewUpdate = () => reloadOverview()

    window.addEventListener('lumo:deals-updated', handleDealsUpdate)
    window.addEventListener('lumo:saved-deals-updated', handleSavedUpdate)
    window.addEventListener('lumo:subscription-updated', handleSubUpdate)
    window.addEventListener('lumo:plans-updated', handleSubUpdate)
    window.addEventListener('lumo:joined-deals-updated', handleJoinedUpdate)
    window.addEventListener('lumo:referral-cases-updated', handleJoinedUpdate)
    window.addEventListener('lumo:leads-updated', handleOverviewUpdate)
    window.addEventListener('lumo:payouts-updated', handleOverviewUpdate)

    return () => {
      window.removeEventListener('lumo:deals-updated', handleDealsUpdate)
      window.removeEventListener('lumo:saved-deals-updated', handleSavedUpdate)
      window.removeEventListener('lumo:subscription-updated', handleSubUpdate)
      window.removeEventListener('lumo:plans-updated', handleSubUpdate)
      window.removeEventListener('lumo:joined-deals-updated', handleJoinedUpdate)
      window.removeEventListener('lumo:referral-cases-updated', handleJoinedUpdate)
      window.removeEventListener('lumo:leads-updated', handleOverviewUpdate)
      window.removeEventListener('lumo:payouts-updated', handleOverviewUpdate)
    }
  }, [reloadOpportunities, reloadSubscription, reloadJoinedDeals, reloadOverview])

  const saveJoinedDeals = (newDeals: JoinedDealItem[]) => {
    setJoinedDeals(newDeals)
  }

  const handleJoinOpportunity = async (opp: PartnerOpportunitySummary) => {
    const isAlreadyJoined = joinedDeals.some((d) => d.opportunityId === opp.id)
    if (!isAlreadyJoined) {
      try {
        const res = await fetch('/api/partner/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            opportunityId: opp.id,
            dealId: opp.id,
            slug: opp.slug,
            title: opp.title,
          }),
        })
        const data = await res.json()
        if (data?.success && data.deal) {
          setJoinedDeals((prev) => [data.deal, ...prev.filter((d) => d.opportunityId !== opp.id)])
        }
      } catch (e) {
        console.error('Error joining deal on server:', e)
      }
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
      <div className="dashboard-shell partner-dashboard-shell w-full bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-slate-100 flex flex-col lg:flex-row transition-colors">
        {/* ========================================================================= */}
        {/* DESKTOP 3-GROUP STRUCTURED PARTNER SIDEBAR                                */}
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
        <main className="dashboard-main min-w-0 flex-1 w-full">
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
                {activeTab === 'overview' && 'Commercial Partner Overview'}
                {activeTab === 'discover' && 'Discover Commercial Opportunities'}
                {activeTab === 'saved_opportunities' && 'Saved Opportunities & Bookmarks'}
                {activeTab === 'my_deals' && 'My Deals & Enrolled Campaigns'}
                {activeTab === 'leads_referrals' && 'Customer Leads & Commercial Referrals'}
                {activeTab === 'performance' && 'Performance & Outcome Analytics'}
                {activeTab === 'earnings_payouts' && 'Earnings, Commissions & Payouts'}
                {activeTab === 'notifications' && 'Notifications & Operational Alerts'}
                {activeTab === 'profile_verification' && 'Partner Profile & Verified KYC'}
                {activeTab === 'subscription' && 'Partner Access Pass & Subscription'}
                {activeTab === 'settings_security' && 'Security, MFA & Notification Preferences'}
                {activeTab === 'help_support' && 'Help Desk, Support & Dispute Center'}
              </h1>
            </div>

            <BackToHomeButton onNavigate={onExploreDeals} />

          <div className="hidden shrink-0 items-center gap-3 sm:flex">
              {subscription.status === 'ACTIVE' && !countdown.isExpired ? (
                <div
                  onClick={() => setActiveTab('subscription')}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-300 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                  title="Active PRO Subscription - Click to view countdown"
                >
                  <span className="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase shadow-2xs">
                    PRO
                  </span>
                  <span className="hidden sm:inline-block font-mono font-extrabold text-[#FF6A00]">
                    {countdown.badgeDisplay}
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

              <ThemeToggle variant="icon" />

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
          <div ref={contentScrollRef} className="partner-dashboard-content space-y-5 sm:space-y-6" tabIndex={0} role="region" aria-label="Partner dashboard content">
          {activeTab === 'overview' && (
            <OverviewTab
              partnerName={partnerName}
              performance={performance}
              opportunities={opportunities}
              joinedDeals={joinedDeals}
              profileCompletion={profileCompletion}
              payoutSummary={payoutSummary}
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
              onNavigateToTab={setActiveTab}
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

          {/* GROUP 2: PERFORMANCE */}
          {activeTab === 'performance' && (
            <PerformanceTab
              performance={performance}
              joinedDeals={joinedDeals}
              profileCompletion={profileCompletion}
            />
          )}

          {activeTab === 'earnings_payouts' && (
            <><EarningsPayoutsTab />{onOpenStatement && <button type="button" onClick={onOpenStatement} className="text-sm font-semibold text-orange-700">Open earnings statement</button>}</>
          )}

          {activeTab === 'notifications' && <NotificationsTab onNavigateTab={setActiveTab} />}

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

          {activeTab === 'settings_security' && <SettingsSecurityTab />}

          {activeTab === 'help_support' && <HelpSupportTab />}
          </div>
        </main>
      </div>
    </PartnerToastProvider>
  )
}
