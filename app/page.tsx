'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { listOpportunities, getProtectedOpportunityDetails } from '@/modules/deals/service'
import type { OpportunityItem } from '@/modules/deals/types'
import type { ProtectedDealDetails } from '@/modules/deals/service'
import { requireActiveDealSubscription } from '@/modules/subscriptions/authorization'
import { getUserSubscription, setUserSubscription } from '@/modules/subscriptions/service'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { Footer } from '@/components/shared/Footer'
import { MobileNav } from '@/components/shared/MobileNav'
import { NavigationLoader } from '@/components/shared/NavigationLoader'
import { HeroSection } from '@/components/marketplace/HeroSection'
import { TrustStrip } from '@/components/marketplace/TrustStrip'
import { OpportunityDiscoveryFeed } from '@/components/marketplace/OpportunityDiscoveryFeed'
import { MarketplaceCatalog } from '@/components/marketplace/MarketplaceCatalog'
import { DealApplyModal } from '@/components/marketplace/DealApplyModal'
import { CreateDealWizard } from '@/components/marketplace/CreateDealWizard'
import { BusinessPublishNoticeModal } from '@/components/marketplace/BusinessPublishNoticeModal'
import { ProtectedDealDetailsModal } from '@/components/marketplace/ProtectedDealDetailsModal'
import { SubscriptionsView } from '@/components/subscriptions/SubscriptionsView'
import { PartnerDashboardView } from '@/components/dashboards/PartnerDashboardView'
import { BusinessDashboardView } from '@/components/dashboards/BusinessDashboardView'
import { AdminDashboardView } from '@/components/dashboards/AdminDashboardView'
import { DealRoomView } from '@/components/dashboards/DealRoomView'
import { EarningsStatementView } from '@/components/dashboards/EarningsStatementView'
import { CustomerProductCheckoutView } from '@/components/customer/CustomerProductCheckoutView'
import { ChoosePathView } from '@/components/auth/ChoosePathView'
import { SignUpView } from '@/components/auth/SignUpView'
import { SignInView } from '@/components/auth/SignInView'
import { AuthFlowView } from '@/components/auth/AuthFlowView'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { HowItWorksModal } from '@/components/shared/HowItWorksModal'
import { AdminStepUpModal } from '@/components/auth/AdminStepUpModal'
import { AdminModeBanner } from '@/components/shared/AdminModeBanner'
import { LanguageSwitch } from '@/components/shared/LanguageSwitch'
import type { UserWorkspaceInfo, WorkspaceType } from '@/lib/session'
import type { PartnerSidebarSection } from '@/components/dashboards/partner/types'
import type { BusinessSidebarSection } from '@/components/dashboards/business/types'

// Authenticated User Workspace Configuration (Server-retrieved)
const INITIAL_WORKSPACES: UserWorkspaceInfo[] = [
  {
    type: 'PERSONAL',
    id: 'ws_personal',
    label: 'Personal Account',
    role: 'CUSTOMER',
  },
  {
    type: 'PARTNER',
    id: 'ws_partner',
    label: 'Partner Workspace',
    role: 'PARTNER',
  },
  {
    type: 'BUSINESS',
    id: 'ws_kijani',
    label: 'Kijani Solar — Business',
    organizationId: 'org_kijani',
    organizationName: 'Kijani Solar Tech Ltd',
    role: 'BUSINESS_OWNER',
  },
  {
    type: 'ADMIN',
    id: 'ws_admin',
    label: 'LUMO Administration',
    role: 'SUPER_ADMIN',
  },
]

export default function LumoApp() {
  const [activeView, setActiveView] = useState('marketplace')
  const [partnerDashboardTab, setPartnerDashboardTab] = useState<PartnerSidebarSection>('overview')
  const [businessDashboardTab, setBusinessDashboardTab] = useState<BusinessSidebarSection>('overview')
  const [savedDeals, setSavedDeals] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('lumo_saved_deals') || '[]')
      } catch (e) {}
    }
    return []
  })
  const [selectedRolePath, setSelectedRolePath] = useState<'PARTNER' | 'BUSINESS'>('PARTNER')

  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
  const [registeredPassword, setRegisteredPassword] = useState('')
  const [userDetails, setUserDetails] = useState<{
    name: string
    email: string
    phone: string
    password?: string
    profilePhotoUrl?: string
  }>({
    name: '',
    email: '',
    phone: '',
  })

  // Workspace & Admin Mode Security State
  const [availableWorkspaces, setAvailableWorkspaces] = useState<UserWorkspaceInfo[]>([INITIAL_WORKSPACES[0]])
  const [activeWorkspace, setActiveWorkspace] = useState<UserWorkspaceInfo>(INITIAL_WORKSPACES[0])
  const [isAdminModeActive, setIsAdminModeActive] = useState(false)
  const [showAdminStepUpModal, setShowAdminStepUpModal] = useState(false)

  const currentUserRole = activeWorkspace.role
  const currentUserOrgId = activeWorkspace.organizationId

  // Subscription Redirection Context
  const [subscriptionRedirectContext, setSubscriptionRedirectContext] = useState<{
    returnTo?: string
    intent?: 'view' | 'join'
    reasonMessage?: string
    status?: string
  }>({})

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedRegion, setSelectedRegion] = useState('ALL')
  const [minReward, setMinReward] = useState(0)
  const [sortBy, setSortBy] = useState<'recommended' | 'highest_reward' | 'newest' | 'ending_soon'>('recommended')

  // Modals
  const [selectedDealForApply, setSelectedDealForApply] = useState<OpportunityItem | null>(null)
  const [selectedProtectedDeal, setSelectedProtectedDeal] = useState<ProtectedDealDetails | null>(null)
  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const [showBusinessNotice, setShowBusinessNotice] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  const handleTriggerCreateDeal = () => {
    if (activeWorkspace.type === 'BUSINESS' || isAdminModeActive) {
      setShowCreateWizard(true)
    } else {
      setShowBusinessNotice(true)
    }
  }

  // Subscription status check
  const userSub = useMemo(() => {
    return currentUserId ? getUserSubscription(currentUserId) : null
  }, [currentUserId, activeView])

  const hasActiveSubscription = Boolean(userSub && userSub.isActive)

  const [dealsRevision, setDealsRevision] = useState(0)

  useEffect(() => {
    const lockedPhoto = localStorage.getItem(`lumo_locked_profile_photo:${userDetails.email.toLowerCase()}`)
    if (lockedPhoto) {
      setUserDetails((previous) => ({ ...previous, profilePhotoUrl: lockedPhoto }))
    }
  }, [])

  useEffect(() => {
    const handleUpdate = () => setDealsRevision((r) => r + 1)
    const handleSavedUpdate = () => {
      if (typeof window !== 'undefined') {
        try {
          setSavedDeals(JSON.parse(localStorage.getItem('lumo_saved_deals') || '[]'))
        } catch (e) {}
      }
    }
    window.addEventListener('lumo:deals-updated', handleUpdate)
    window.addEventListener('lumo:saved-deals-updated', handleSavedUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('lumo:deals-updated', handleUpdate)
      window.removeEventListener('lumo:saved-deals-updated', handleSavedUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  // Filtered Opportunities from domain service
  const allOpportunities = useMemo(() => listOpportunities(), [dealsRevision, activeView])

  const opportunities = useMemo(() => {
    return listOpportunities({
      query: searchQuery,
      category: selectedCategory,
      type: selectedType,
      region: selectedRegion,
      minReward,
      sortBy,
    })
  }, [searchQuery, selectedCategory, selectedType, selectedRegion, minReward, sortBy, dealsRevision, activeView])

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (selectedType !== 'ALL' ? 1 : 0) +
    (selectedRegion !== 'ALL' ? 1 : 0) +
    (minReward > 0 ? 1 : 0)

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('ALL')
    setSelectedType('ALL')
    setSelectedRegion('ALL')
    setMinReward(0)
  }

  const handleToggleSave = (dealId: string) => {
    setSavedDeals((prev) => {
      const next = prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId]
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('lumo_saved_deals', JSON.stringify(next))
          window.dispatchEvent(new Event('lumo:saved-deals-updated'))
        } catch (e) {}
      }
      return next
    })
  }

  const navigateToView = (view: string) => {
    const requiresCompletedOnboarding = ['partner', 'business', 'admin', 'dealroom', 'statement'].includes(view)
    if (requiresCompletedOnboarding && !currentUserId) {
      setActiveView(registeredPassword && userDetails.email ? 'auth_verify' : 'signin')
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }
    if (view === activeView) return
    setActiveView(view)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  /**
   * Legitimate Workspace Switching Handler
   */
  const handleSelectWorkspace = (workspace: UserWorkspaceInfo) => {
    setActiveWorkspace(workspace)
    setIsAdminModeActive(false)

    if (workspace.type === 'PARTNER') {
      navigateToView('partner')
    } else if (workspace.type === 'BUSINESS') {
      navigateToView('business')
    } else {
      navigateToView('marketplace')
    }
  }

  /**
   * Request Admin Mode with Step-Up MFA
   */
  const handleRequestAdminMode = () => {
    setShowAdminStepUpModal(true)
  }

  /**
   * Admin Mode Step-Up Success Handler
   */
  const handleAdminStepUpSuccess = () => {
    setShowAdminStepUpModal(false)
    setIsAdminModeActive(true)
    const adminWs = availableWorkspaces.find((w) => w.type === 'ADMIN') || INITIAL_WORKSPACES[3]
    setActiveWorkspace(adminWs)
    setActiveView('admin')
  }

  /**
   * Exit Admin Mode Handler
   */
  const handleExitAdminMode = () => {
    setIsAdminModeActive(false)
    const partnerWs = availableWorkspaces.find((w) => w.type === 'PARTNER') || INITIAL_WORKSPACES[1]
    setActiveWorkspace(partnerWs)
    setActiveView('partner')
  }

  const handleSignOut = () => {
    setCurrentUserId(undefined)
    setUserDetails({ name: '', email: '', phone: '' })
    setRegisteredPassword('')
    setAvailableWorkspaces([INITIAL_WORKSPACES[0]])
    setActiveWorkspace(INITIAL_WORKSPACES[0])
    setIsAdminModeActive(false)
    if (typeof window !== 'undefined') sessionStorage.removeItem('lumo_reg_pwd')
    setActiveView('marketplace')
  }

  const handleMobileNavigation = (destination: string) => {
    if (destination === 'marketplace' || destination === 'marketplace_catalog') {
      setActiveView(destination)
      return
    }

    if (!currentUserId) {
      setActiveView('choose_path')
      return
    }

    if (activeWorkspace.type === 'BUSINESS') {
      setBusinessDashboardTab(
        destination === 'deals'
          ? 'my_opportunities'
          : destination === 'earnings'
            ? 'payments_funding'
            : 'business_profile'
      )
      setActiveView('business')
      return
    }

    setPartnerDashboardTab(
      destination === 'deals'
        ? 'my_deals'
        : destination === 'earnings'
          ? 'earnings_payouts'
          : 'profile_verification'
    )
    setActiveView('partner')
  }

  /**
   * Subscription-Gated Deal Access Handler
   */
  const handleDealAction = (deal: OpportunityItem, intent: 'view' | 'join') => {
    const decision = requireActiveDealSubscription({
      userId: currentUserId,
      userRole: currentUserRole,
      userOrgId: currentUserOrgId,
      dealIdOrSlug: deal.id,
      intent,
    })

    if (!decision.isAuthorized) {
      if (!currentUserId) {
        // Unauthenticated -> Redirect to sign in with returnTo & intent
        setSubscriptionRedirectContext({
          returnTo: `/deals/${deal.slug}`,
          intent,
          reasonMessage: decision.reason,
        })
        setActiveView('signin')
      } else {
        // Authenticated non-subscriber / expired -> Redirect to subscriptions with returnTo & intent
        setSubscriptionRedirectContext({
          returnTo: `/deals/${deal.slug}`,
          intent,
          reasonMessage: decision.reason,
          status: decision.subscriptionStatus,
        })
        setActiveView('subscriptions')
      }
      return
    }

    // Authorized (Active Subscriber, Deal Owner, or Admin)
    const protectedResult = getProtectedOpportunityDetails(deal.id, {
      userId: currentUserId,
      userRole: currentUserRole,
      userOrgId: currentUserOrgId,
    })

    if (protectedResult.success && protectedResult.data) {
      if (intent === 'join') {
        setSelectedDealForApply(deal)
      } else {
        setSelectedProtectedDeal(protectedResult.data)
      }
    }
  }

  const handleSubscriptionSuccess = (planCode: string, returnTo?: string) => {
    if (!currentUserId) {
      setSubscriptionRedirectContext({
        returnTo,
        intent: subscriptionRedirectContext.intent,
        reasonMessage: 'Complete registration and onboarding before activating a subscription.',
      })
      setActiveView(registeredPassword && userDetails.email ? 'auth_verify' : 'choose_path')
      return
    }
    if (returnTo) {
      const slug = returnTo.replace('/deals/', '')
      const opp = listOpportunities().find((o) => o.slug === slug || o.id === slug)
      if (opp) {
        setActiveView('marketplace')
        handleDealAction(opp, subscriptionRedirectContext.intent || 'view')
        setSubscriptionRedirectContext({})
        return
      }
    }
    setActiveView('partner')
  }

  const isAuthView =
    activeView === 'choose_path' ||
    activeView === 'signup' ||
    activeView === 'signin' ||
    activeView === 'auth_verify'

  const isDashboardView =
    activeView === 'partner' ||
    activeView === 'business' ||
    activeView === 'admin' ||
    activeView === 'dealroom' ||
    activeView === 'statement'

  return (
    <div id="lumo-localized-app" className={`${isAuthView ? 'auth-page-root' : ''} min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-slate-100 transition-colors`}>
      <NavigationLoader key={activeView} />
      <LanguageSwitch />
      {/* Persistent Admin Mode Security Warning Banner */}
      {isAdminModeActive && !isDashboardView && (
        <AdminModeBanner
          adminEmail={userDetails.email}
          adminRoleName="Super Administrator"
          onExitAdminMode={handleExitAdminMode}
        />
      )}

      {/* Public header is hidden on dashboards and focused authentication screens. */}
      {!isDashboardView && !isAuthView && <SiteHeader
        activeView={activeView}
        currentUserId={currentUserId}
        currentUserRole={activeWorkspace.role}
        hasActiveSubscription={hasActiveSubscription}
        userProfile={userDetails}
        activeWorkspace={activeWorkspace}
        availableWorkspaces={availableWorkspaces}
        onSelectWorkspace={handleSelectWorkspace}
        onRequestAdminMode={handleRequestAdminMode}
        isAdminModeActive={isAdminModeActive}
        onNavigate={(view) => {
          if (view === 'admin' && !isAdminModeActive) {
            handleRequestAdminMode()
            return
          }
          navigateToView(view)
        }}
        onOpenHowItWorks={() => setShowHowItWorks(true)}
        onOpenSignIn={() => navigateToView('signin')}
        onOpenGetStarted={() => navigateToView('choose_path')}
        onSignOut={handleSignOut}
      />}

      {/* Main Container */}
      <main
        className={`flex-1 ${
          isDashboardView
            ? 'w-full'
            : isAuthView
            ? 'w-full px-4 sm:px-6'
            : 'lumo-container py-8 sm:py-10'
        }`}
      >
        {/* VIEW 1: MARKETPLACE DISCOVERY */}
        {activeView === 'marketplace' && (
          <div className="space-y-8">
            {/* 2-Column Hero Section */}
            <HeroSection
              previewOpportunities={allOpportunities}
              currentUserRole={currentUserRole}
              onExplore={() => {
                const filterElem = document.getElementById('marketplace-filters-section')
                if (filterElem) filterElem.scrollIntoView({ behavior: 'smooth' })
              }}
              onPublishDeal={handleTriggerCreateDeal}
              onViewSubscriptions={() => setActiveView('subscriptions')}
              onViewAllOpportunities={() => {
                const filterElem = document.getElementById('marketplace-filters-section')
                if (filterElem) filterElem.scrollIntoView({ behavior: 'smooth' })
              }}
              onSelectPreviewOpportunity={(opp) => handleDealAction(opp, 'view')}
            />

            {/* Trust & Performance Strip */}
            <TrustStrip />

            <OpportunityDiscoveryFeed
              region={selectedRegion}
              onRegionChange={setSelectedRegion}
              onSelectCategory={(category) => {
                setSearchQuery('')
                setSelectedCategory(category)
              }}
              onViewAll={() => {
                const filterElem = document.getElementById('marketplace-filters-section')
                if (filterElem) filterElem.scrollIntoView({ behavior: 'smooth' })
              }}
            />

            <MarketplaceCatalog
              opportunities={opportunities}
              query={searchQuery}
              onQueryChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              selectedRegion={selectedRegion}
              onRegionChange={setSelectedRegion}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onClearFilters={handleClearFilters}
              activeFilterCount={activeFilterCount}
              minReward={minReward}
              onMinRewardChange={setMinReward}
              currentUserRole={currentUserRole}
              currentUserOrgId={currentUserOrgId}
              hasActiveSubscription={hasActiveSubscription}
              savedDeals={savedDeals}
              onToggleSave={handleToggleSave}
              onDealAction={handleDealAction}
              onPostOpportunity={handleTriggerCreateDeal}
            />
          </div>
        )}

        {/* DEDICATED MARKETPLACE: COMPLETE DEAL CATALOGUE */}
        {activeView === 'marketplace_catalog' && (
          <MarketplaceCatalog
            opportunities={opportunities}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedRegion={selectedRegion}
            onRegionChange={setSelectedRegion}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onClearFilters={handleClearFilters}
            activeFilterCount={activeFilterCount}
            minReward={minReward}
            onMinRewardChange={setMinReward}
            currentUserRole={currentUserRole}
            currentUserOrgId={currentUserOrgId}
            hasActiveSubscription={hasActiveSubscription}
            savedDeals={savedDeals}
            onToggleSave={handleToggleSave}
            onDealAction={handleDealAction}
            onPostOpportunity={handleTriggerCreateDeal}
          />
        )}

        {/* VIEW 2: SUBSCRIPTION PLANS (/subscriptions) */}
        {activeView === 'subscriptions' && (
          <SubscriptionsView
            currentUserId={currentUserId || 'alex_partner'}
            returnTo={subscriptionRedirectContext.returnTo}
            intent={subscriptionRedirectContext.intent}
            reasonMessage={subscriptionRedirectContext.reasonMessage}
            subscriptionStatus={subscriptionRedirectContext.status}
            onSubscriptionSuccess={handleSubscriptionSuccess}
            onNavigateHome={() => setActiveView('marketplace')}
          />
        )}

        {/* VIEW 3: PARTNER PORTAL */}
        {activeView === 'partner' && (
          <PartnerDashboardView
            initialTab={partnerDashboardTab}
            partnerName={userDetails.name || 'Partner'}
            email={userDetails.email}
            phone={userDetails.phone}
            profilePhotoUrl={userDetails.profilePhotoUrl}
            onOpenStatement={() => setActiveView('statement')}
            onExploreDeals={() => setActiveView('marketplace')}
            onSignOut={handleSignOut}
            onNavigateToSubscriptions={() => setActiveView('subscriptions')}
            onSelectOpportunity={(dealId) => {
              const opp = listOpportunities().find((o) => o.id === dealId || o.slug === dealId)
              if (opp) handleDealAction(opp, 'view')
            }}
          />
        )}

        {/* VIEW 4: BUSINESS HUB */}
        {activeView === 'business' && (
          <BusinessDashboardView
            initialTab={businessDashboardTab}
            businessName={activeWorkspace.type === 'BUSINESS' ? (activeWorkspace.organizationName || `${userDetails.name}'s Business`) : userDetails.name}
            profilePhotoUrl={userDetails.profilePhotoUrl}
            onCreateDeal={() => setShowCreateWizard(true)}
            onExploreDeals={() => setActiveView('marketplace')}
            onSignOut={handleSignOut}
          />
        )}

        {/* VIEW 5: DEAL ROOM */}
        {activeView === 'dealroom' && <DealRoomView />}

        {/* VIEW 6: ADMIN & AUDIT OPERATIONS */}
        {activeView === 'admin' && (
          <AdminDashboardView
            adminName={userDetails.name || 'Platform Administrator'}
            onExploreDeals={() => setActiveView('marketplace')}
            onExitAdminMode={handleExitAdminMode}
            onSignOut={handleSignOut}
          />
        )}

        {/* VIEW 7: STATEMENTS */}
        {activeView === 'statement' && (
          <EarningsStatementView onBack={() => setActiveView('partner')} />
        )}

        {/* VIEW 8: CUSTOMER REFERRAL PRODUCT CHECKOUT (Frictionless, No Subscription Required) */}
        {activeView === 'customer_checkout' && (
          <CustomerProductCheckoutView
            onBackToMarketplace={() => setActiveView('marketplace')}
          />
        )}

        {/* AUTHENTICATION VIEWS WITH REUSABLE AuthLayout */}
        {isAuthView && (
          <AuthLayout>
            {/* STEP 1A: CHOOSE YOUR PATH (Partner vs Business) */}
            {activeView === 'choose_path' && (
              <ChoosePathView
                onSelectPath={(role) => {
                  setSelectedRolePath(role)
                  setActiveView('signup')
                }}
                onNavigateSignIn={() => setActiveView('signin')}
              />
            )}

            {/* STEP 1B: SIGN UP / CREATE ACCOUNT (Form Tailored to Chosen Path) */}
            {activeView === 'signup' && (
              <SignUpView
                role={selectedRolePath}
                onSignUpSuccess={(role, details) => {
                  setSelectedRolePath(role)
                  setUserDetails(details)
                  const pwd = details.password || ''
                  setRegisteredPassword(pwd)
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('lumo_reg_pwd', pwd)
                  }
                  setCurrentUserId(undefined)

                  // A pending applicant remains a guest until every onboarding step succeeds.
                  setAvailableWorkspaces([INITIAL_WORKSPACES[0]])
                  setActiveWorkspace(INITIAL_WORKSPACES[0])
                  setActiveView('auth_verify')
                }}
                onNavigateSignIn={() => setActiveView('signin')}
                onChangePath={() => setActiveView('choose_path')}
              />
            )}

            {/* STEP 2-5: CONTACT OTP, ROLE PROFILE, KYC/KYB & 2FA SECURITY */}
            {activeView === 'auth_verify' && (
              <AuthFlowView
                initialRole={selectedRolePath}
                initialEmail={userDetails.email}
                initialPhone={userDetails.phone}
                onComplete={async (finalRole, profileData) => {
                  const chosenBizName =
                    profileData?.tradingName ||
                    profileData?.legalName ||
                    profileData?.name ||
                    (userDetails.name ? `${userDetails.name}'s Business` : 'My Business')

                  const userName = profileData?.contactPerson || userDetails.name || (profileData?.email ? profileData.email.split('@')[0] : 'User')

                  const activePwd =
                    registeredPassword ||
                    userDetails.password ||
                    (typeof window !== 'undefined' ? sessionStorage.getItem('lumo_reg_pwd') || '' : '')

                  if (!activePwd) {
                    throw new Error('Your signup session expired. Please return to signup and create your password again.')
                  }

                  const regPayload = {
                    onboardingComplete: true as const,
                    email: profileData?.email || userDetails.email,
                    password: activePwd,
                    name: userName,
                    phone: profileData?.phone || userDetails.phone,
                    image: profileData?.profilePhotoUrl,
                    role: finalRole,
                    bizDetails:
                      finalRole === 'BUSINESS'
                        ? {
                            legalName: profileData?.legalName || chosenBizName,
                            tradingName: profileData?.tradingName || chosenBizName,
                            brelaRegNumber: profileData?.registrationNumber,
                            traTin: profileData?.tinNumber,
                            bizCategory: profileData?.industry,
                            contactPerson: profileData?.contactPerson || userName,
                          }
                        : undefined,
                  }

                  const registrationResponse = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(regPayload),
                  })
                  const registrationData = await registrationResponse.json().catch(() => null)

                  if (!registrationResponse.ok || !registrationData?.user?.id) {
                    throw new Error(
                      registrationData?.message ||
                      registrationData?.error ||
                      'We could not activate your account. Check your connection and try again.'
                    )
                  }

                  setUserDetails((prev) => ({
                    ...prev,
                    name: userName,
                    email: profileData?.email || prev.email,
                    phone: profileData?.phone || prev.phone,
                    profilePhotoUrl: profileData?.profilePhotoUrl || prev.profilePhotoUrl,
                  }))
                  if (profileData?.profilePhotoUrl) {
                    const profileEmail = (profileData.email || userDetails.email).toLowerCase()
                    try {
                      localStorage.setItem(`lumo_locked_profile_photo:${profileEmail}`, profileData.profilePhotoUrl)
                    } catch {
                      // Account activation must not fail if the browser cannot cache the portrait locally.
                    }
                  }

                  if (finalRole === 'BUSINESS') {
                    const bizWorkspace: UserWorkspaceInfo = {
                      type: 'BUSINESS',
                      id: `ws_${Date.now()}`,
                      label: `${chosenBizName} — Business`,
                      organizationId: `org_${Date.now()}`,
                      organizationName: chosenBizName,
                      role: 'BUSINESS_OWNER',
                    }
                    setAvailableWorkspaces((prev) => [
                      ...prev.filter((w) => w.type !== 'BUSINESS'),
                      bizWorkspace,
                    ])
                    setActiveWorkspace(bizWorkspace)
                  } else {
                    const partnerWorkspace: UserWorkspaceInfo = {
                      type: 'PARTNER',
                      id: 'ws_partner',
                      label: `${userName} Workspace`,
                      role: 'PARTNER',
                    }
                    setAvailableWorkspaces((prev) => [
                      ...prev.filter((w) => w.type !== 'PARTNER'),
                      partnerWorkspace,
                    ])
                    setActiveWorkspace(partnerWorkspace)
                  }

                  setRegisteredPassword('')
                  if (typeof window !== 'undefined') sessionStorage.removeItem('lumo_reg_pwd')
                  setCurrentUserId(registrationData.user.id)

                  if (subscriptionRedirectContext.returnTo) {
                    setActiveView('subscriptions')
                  } else if (finalRole === 'PARTNER') {
                    setActiveView('partner')
                  } else {
                    setActiveView('business')
                  }
                }}
                onCancel={() => {
                  setCurrentUserId(undefined)
                  setRegisteredPassword('')
                  setUserDetails({ name: '', email: '', phone: '' })
                  setAvailableWorkspaces([INITIAL_WORKSPACES[0]])
                  setActiveWorkspace(INITIAL_WORKSPACES[0])
                  if (typeof window !== 'undefined') sessionStorage.removeItem('lumo_reg_pwd')
                  setActiveView('marketplace')
                }}
              />
            )}

            {/* SIGN IN */}
            {activeView === 'signin' && (
              <SignInView
                onSignInSuccess={(role, credentials) => {
                  const authUser = credentials?.user
                  const email = (authUser?.email || credentials?.email || userDetails.email).trim().toLowerCase()
                  const effectiveRole: 'PARTNER' | 'BUSINESS' | 'ADMIN' =
                    authUser?.role === 'ADMIN' || email === 'admin@lumo.co.tz'
                      ? 'ADMIN'
                      : authUser?.role === 'BUSINESS'
                      ? 'BUSINESS'
                      : 'PARTNER'

                  const displayName = authUser?.name || (email.includes('@') ? email.split('@')[0] : userDetails.name)
                  
                  setUserDetails((prev) => ({
                    ...prev,
                    email,
                    name: effectiveRole === 'ADMIN' ? 'Platform Administrator' : displayName,
                    phone: authUser?.phone || prev.phone,
                    profilePhotoUrl:
                      authUser?.image ||
                      localStorage.getItem(`lumo_locked_profile_photo:${email}`) ||
                      undefined,
                  }))
                  if (authUser?.id) {
                    setCurrentUserId(authUser.id)
                  }

                  let target = availableWorkspaces.find((w) => w.type === effectiveRole) || INITIAL_WORKSPACES.find((w) => w.type === effectiveRole) || availableWorkspaces[1]
                  
                  if (effectiveRole === 'BUSINESS') {
                    const bizName = authUser?.organizationName || `${displayName}'s Business`
                    const bizWs: UserWorkspaceInfo = {
                      type: 'BUSINESS',
                      id: `ws_${Date.now()}`,
                      label: `${bizName} — Business`,
                      organizationId: `org_${Date.now()}`,
                      organizationName: bizName,
                      role: 'BUSINESS_OWNER',
                    }
                    setAvailableWorkspaces((prev) => [
                      ...prev.filter((w) => w.type !== 'BUSINESS'),
                      bizWs,
                    ])
                    target = bizWs
                  } else if (effectiveRole === 'ADMIN') {
                    target = INITIAL_WORKSPACES[3] // LUMO Administration
                    setIsAdminModeActive(true)
                  } else {
                    const partnerWs: UserWorkspaceInfo = {
                      type: 'PARTNER',
                      id: `ws_${Date.now()}`,
                      label: `${displayName} — Partner`,
                      role: 'PARTNER',
                    }
                    setAvailableWorkspaces((prev) => [
                      ...prev.filter((w) => w.type !== 'PARTNER'),
                      partnerWs,
                    ])
                    target = partnerWs
                  }
                  
                  setActiveWorkspace(target)
                  if (subscriptionRedirectContext.returnTo) {
                    setActiveView('subscriptions')
                  } else if (effectiveRole === 'ADMIN') {
                    setActiveView('admin')
                  } else if (effectiveRole === 'BUSINESS') {
                    setActiveView('business')
                  } else {
                    setActiveView('partner')
                  }
                }}
                onCreateAccount={() => setActiveView('choose_path')}
                onNavigateHome={() => setActiveView('marketplace')}
              />
            )}
          </AuthLayout>
        )}
      </main>

      {/* Create Deal Wizard Modal Dialog */}
      {showCreateWizard && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl my-8">
            <CreateDealWizard
              onSuccess={() => {
                setShowCreateWizard(false)
                setActiveView('marketplace')
              }}
              onCancel={() => setShowCreateWizard(false)}
            />
          </div>
        </div>
      )}

      {/* Business Only Deal Creation Notice Modal (When Partner/Guest clicks Publish) */}
      <BusinessPublishNoticeModal
        isOpen={showBusinessNotice}
        onClose={() => setShowBusinessNotice(false)}
        onRegisterBusiness={() => {
          setShowBusinessNotice(false)
          setSelectedRolePath('BUSINESS')
          setActiveView('choose_path')
        }}
        onExploreSubscriptions={() => {
          setShowBusinessNotice(false)
          setActiveView('subscriptions')
        }}
      />

      {/* Deal Apply & Link Generation Modal */}
      <DealApplyModal
        deal={selectedDealForApply}
        isOpen={Boolean(selectedDealForApply)}
        onClose={() => setSelectedDealForApply(null)}
        onSuccess={() => {
          // enrolled
        }}
      />

      {/* Protected Full Deal Details Modal */}
      <ProtectedDealDetailsModal
        deal={selectedProtectedDeal}
        isOpen={Boolean(selectedProtectedDeal)}
        onClose={() => setSelectedProtectedDeal(null)}
        currentUserId={currentUserId}
        userRole={currentUserRole}
        userOrgId={currentUserOrgId}
      />

      {/* Admin Step-Up Authentication Modal (MFA TOTP / Password) */}
      {showAdminStepUpModal && (
        <AdminStepUpModal
          adminEmail={userDetails.email}
          onSuccess={handleAdminStepUpSuccess}
          onClose={() => setShowAdminStepUpModal(false)}
        />
      )}

      {/* How It Works Explainer Modal */}
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
        onGetStarted={() => {
          setShowHowItWorks(false)
          setActiveView('choose_path')
        }}
      />

      {/* Mobile Navigation Bottom Bar */}
      {!isDashboardView && <MobileNav activeView={activeView} onNavigate={handleMobileNavigation} />}

      {/* Footer ONLY on non-auth views */}
      {!isAuthView && !isDashboardView && <Footer onNavigate={setActiveView} />}
    </div>
  )
}
