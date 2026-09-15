'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { listOpportunities, getProtectedOpportunityDetails, isUserEnrolledInDeal } from '@/modules/deals/service'
import type { OpportunityItem } from '@/modules/deals/types'
import type { ProtectedDealDetails } from '@/modules/deals/service'
import { requireActiveDealSubscription } from '@/modules/subscriptions/authorization'
import { getUserSubscription, setUserSubscription } from '@/modules/subscriptions/service'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { Footer } from '@/components/shared/Footer'
import { MobileNav } from '@/components/shared/MobileNav'
import { NavigationLoader } from '@/components/shared/NavigationLoader'
import { StartupAnimation } from '@/components/shared/StartupAnimation'
import { LandingPage } from '@/components/marketplace/LandingPage'
import { MarketplaceCatalog } from '@/components/marketplace/MarketplaceCatalog'
import { DealApplyModal } from '@/components/marketplace/DealApplyModal'
import { CreateDealWizard } from '@/components/marketplace/CreateDealWizard'
import { BusinessPublishNoticeModal } from '@/components/marketplace/BusinessPublishNoticeModal'
import { ProtectedDealDetailsModal } from '@/components/marketplace/ProtectedDealDetailsModal'
import { WhatsAppMiddlemanModal } from '@/components/marketplace/WhatsAppMiddlemanModal'
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

const ROUTE_MAP: Record<string, string> = {
  marketplace: '/',
  marketplace_catalog: '/catalog',
  subscriptions: '/subscriptions',
  partner: '/partner',
  business: '/business',
  admin: '/admin',
  signin: '/signin',
  signup: '/signup',
  choose_path: '/choose-path',
  auth_verify: '/verify',
  dealroom: '/dealroom',
  statement: '/statement',
  customer_checkout: '/checkout',
}

const PATH_TO_VIEW_MAP: Record<string, string> = Object.entries(ROUTE_MAP).reduce(
  (acc, [view, path]) => {
    acc[path] = view
    return acc
  },
  {} as Record<string, string>
)

export default function LumoApp() {
  const [showStartup, setShowStartup] = useState(true)
  const [activeView, setActiveView] = useState('marketplace')
  const [partnerDashboardTab, setPartnerDashboardTab] = useState<PartnerSidebarSection>('overview')
  const [businessDashboardTab, setBusinessDashboardTab] = useState<BusinessSidebarSection>('overview')
  const [mounted, setMounted] = useState(false)
  const [savedDeals, setSavedDeals] = useState<string[]>([])
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
  const [selectedDealForWhatsApp, setSelectedDealForWhatsApp] = useState<OpportunityItem | null>(null)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
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

  const [dealsRevision, setDealsRevision] = useState(0)

  // Subscription status check (checks both userId UUID and email for robust session continuity)
  const userSub = useMemo(() => {
    return (
      (currentUserId ? getUserSubscription(currentUserId) : null) ||
      (userDetails.email ? getUserSubscription(userDetails.email) : null)
    )
  }, [currentUserId, userDetails.email, activeView, dealsRevision])

  const hasActiveSubscription = mounted ? Boolean(userSub && userSub.isActive) : false
  const isGoldenVipUser = mounted
    ? Boolean(
        userSub?.hasGoldenVipAccess ||
        userSub?.planCode === 'GOLDEN_VIP' ||
        activeWorkspace.type === 'ADMIN' ||
        activeWorkspace.type === 'BUSINESS'
      )
    : false

  // Synchronize active subscription from database whenever user identity is present
  useEffect(() => {
    if (!currentUserId && !userDetails.email) return
    const q = new URLSearchParams()
    if (currentUserId) q.set('userId', currentUserId)
    if (userDetails.email) q.set('email', userDetails.email)

    fetch(`/api/subscriptions/active?${q.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.hasActiveSubscription && data.subscription) {
          if (currentUserId) setUserSubscription(currentUserId, data.subscription)
          if (userDetails.email) setUserSubscription(userDetails.email, data.subscription)
          setDealsRevision((r) => r + 1)
        }
      })
      .catch(() => {})
  }, [currentUserId, userDetails.email])

  const handleConnectWhatsApp = (deal: OpportunityItem) => {
    setSelectedDealForWhatsApp(deal)
    setShowWhatsAppModal(true)
  }

  useEffect(() => {
    const lockedPhoto = localStorage.getItem(`lumo_locked_profile_photo:${userDetails.email.toLowerCase()}`)
    if (lockedPhoto) {
      setUserDetails((previous) => ({ ...previous, profilePhotoUrl: lockedPhoto }))
    }
  }, [])

  // Session Restoration & Hydration Effect (Persists auth state on page refresh)
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Synchronous hydration from localStorage cache
    try {
      const cachedUser = localStorage.getItem('lumo_auth_session')
      const cachedWorkspace = localStorage.getItem('lumo_active_workspace')
      const cachedWorkspaces = localStorage.getItem('lumo_available_workspaces')

      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser)
        if (parsedUser?.id) {
          setCurrentUserId(parsedUser.id)
          setUserDetails((prev) => ({
            ...prev,
            name: parsedUser.name || prev.name,
            email: parsedUser.email || prev.email,
            phone: parsedUser.phone || prev.phone,
            profilePhotoUrl: parsedUser.image || prev.profilePhotoUrl,
          }))
        }
      }

      if (cachedWorkspace) {
        const parsedWs = JSON.parse(cachedWorkspace)
        if (parsedWs?.type) setActiveWorkspace(parsedWs)
      }

      if (cachedWorkspaces) {
        const parsedWss = JSON.parse(cachedWorkspaces)
        if (Array.isArray(parsedWss) && parsedWss.length > 0) setAvailableWorkspaces(parsedWss)
      }
    } catch (e) {
      console.warn('Session hydration cache error', e)
    }

    // 2. Asynchronous verification check against /api/auth/me cookie endpoint
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.user?.id) {
          const u = data.user
          setCurrentUserId(u.id)
          setUserDetails((prev) => ({
            ...prev,
            name: u.name || prev.name,
            email: u.email || prev.email,
            phone: u.phone || prev.phone,
            profilePhotoUrl: u.image || prev.profilePhotoUrl,
          }))

          let targetWs: UserWorkspaceInfo
          if (u.role === 'ADMIN') {
            targetWs = INITIAL_WORKSPACES[3]
            setIsAdminModeActive(true)
          } else if (u.role === 'BUSINESS') {
            targetWs = {
              type: 'BUSINESS',
              id: `ws_${u.organizationId || 'biz'}`,
              label: `${u.organizationName || u.name}'s Business`,
              organizationId: u.organizationId,
              organizationName: u.organizationName,
              role: 'BUSINESS_OWNER',
            }
          } else {
            targetWs = {
              type: 'PARTNER',
              id: 'ws_partner',
              label: `${u.name} Workspace`,
              role: 'PARTNER',
            }
          }

          const freshWorkspaces = [INITIAL_WORKSPACES[0], targetWs]
          setAvailableWorkspaces(freshWorkspaces)
          setActiveWorkspace(targetWs)

          try {
            localStorage.setItem('lumo_auth_session', JSON.stringify(u))
            localStorage.setItem('lumo_active_workspace', JSON.stringify(targetWs))
            localStorage.setItem('lumo_available_workspaces', JSON.stringify(freshWorkspaces))
          } catch (e) {}

          const currentPath = window.location.pathname
          const matchedView = PATH_TO_VIEW_MAP[currentPath]
          if (matchedView) {
            setActiveView(matchedView)
          } else if (currentPath === '/' || currentPath === '') {
            if (u.role === 'ADMIN') setActiveView('admin')
            else if (u.role === 'BUSINESS') setActiveView('business')
            else if (u.role === 'PARTNER') setActiveView('partner')
          }
        } else {
          try {
            localStorage.removeItem('lumo_auth_session')
            localStorage.removeItem('lumo_active_workspace')
            localStorage.removeItem('lumo_available_workspaces')
          } catch (e) {}
        }
      })
      .catch(() => {})
  }, [])

  // Sync URL location path on initial load & popstate browser back/forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return

    const initialPath = window.location.pathname
    const matchedView = PATH_TO_VIEW_MAP[initialPath]
    if (matchedView) {
      const requiresCompletedOnboarding = ['partner', 'business', 'admin', 'dealroom', 'statement'].includes(matchedView)
      if (!requiresCompletedOnboarding || currentUserId) {
        setActiveView(matchedView)
      }
    }

    const handlePopState = () => {
      const currentPath = window.location.pathname
      const view = PATH_TO_VIEW_MAP[currentPath] || 'marketplace'
      setActiveView(view)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [currentUserId])

  useEffect(() => {
    setMounted(true)
    try {
      const sessionStr = localStorage.getItem('lumo_user_session')
      if (sessionStr) {
        const session = JSON.parse(sessionStr)
        if (session.id) {
          setCurrentUserId(session.id)
          // When launched as PWA standalone (?source=pwa) at root, direct signed-in users to their workspace dashboard
          if (typeof window !== 'undefined' && window.location.search.includes('source=pwa') && window.location.pathname === '/') {
            if (session.role === 'BUSINESS' || session.activeWorkspaceType === 'BUSINESS') {
              setActiveView('business')
            } else if (session.role === 'ADMIN' || session.activeWorkspaceType === 'ADMIN') {
              setActiveView('admin')
            } else {
              setActiveView('partner')
            }
          }
        }
        if (session.name || session.email || session.phone) {
          setUserDetails((prev) => ({
            ...prev,
            name: session.name || prev.name,
            email: session.email || prev.email,
            phone: session.phone || prev.phone,
            profilePhotoUrl: session.profilePhotoUrl || prev.profilePhotoUrl,
          }))
        }
      }
    } catch (e) {}

    try {
      const saved = localStorage.getItem('lumo_saved_deals')
      if (saved) {
        setSavedDeals(JSON.parse(saved))
      }
    } catch (e) {}

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
    window.addEventListener('lumo:subscription-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('lumo:deals-updated', handleUpdate)
      window.removeEventListener('lumo:saved-deals-updated', handleSavedUpdate)
      window.removeEventListener('lumo:subscription-updated', handleUpdate)
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
    const targetView = requiresCompletedOnboarding && !currentUserId
      ? (registeredPassword && userDetails.email ? 'auth_verify' : 'signin')
      : view

    if (targetView !== activeView) {
      setActiveView(targetView)
    }

    if (typeof window !== 'undefined') {
      const path = ROUTE_MAP[targetView] || '/'
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path)
      }
    }
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

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Proceed to clear local state if network is offline
    }
    setCurrentUserId(undefined)
    setUserDetails({ name: '', email: '', phone: '' })
    setRegisteredPassword('')
    setAvailableWorkspaces([INITIAL_WORKSPACES[0]])
    setActiveWorkspace(INITIAL_WORKSPACES[0])
    setIsAdminModeActive(false)
    if (typeof window !== 'undefined') {
      sessionStorage.clear()
      try {
        localStorage.removeItem('lumo_auth_session')
        localStorage.removeItem('lumo_active_workspace')
        localStorage.removeItem('lumo_available_workspaces')
        localStorage.removeItem('lumo_user_session')
        localStorage.removeItem('lumo_partner_joined_deals')
        localStorage.removeItem('lumo_user_subscriptions')
        localStorage.removeItem('lumo_saved_deals')
        // Clean up any email-specific locked profile photos
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('lumo_locked_profile_photo') || key.startsWith('lumo_partner_')) {
            localStorage.removeItem(key)
          }
        })
      } catch (e) {}
      window.history.pushState({}, '', '/')
    }
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
        if (isUserEnrolledInDeal(deal.id, currentUserId)) {
          setSelectedProtectedDeal(protectedResult.data)
        } else {
          setSelectedDealForApply(deal)
        }
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

  if (showStartup) {
    return <StartupAnimation onComplete={() => setShowStartup(false)} />
  }

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
            ? 'w-full px-3 sm:px-6'
            : activeView === 'marketplace'
            ? 'w-full pb-28 md:pb-0'
            : 'lumo-container py-6 sm:py-10 pb-28 md:pb-10'
        }`}
      >
        {/* VIEW 1: MARKETPLACE DISCOVERY */}
        {activeView === 'marketplace' && (
          <LandingPage
            onExplore={() => navigateToView('marketplace_catalog')}
            onJoin={() => navigateToView(currentUserId ? 'subscriptions' : 'choose_path')}
            onCategory={(query) => {
              handleClearFilters()
              setSearchQuery(query)
              navigateToView('marketplace_catalog')
            }}
          />
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
            currentUserId={currentUserId}
            hasActiveSubscription={hasActiveSubscription}
            isGoldenVipUser={isGoldenVipUser}
            savedDeals={savedDeals}
            onToggleSave={handleToggleSave}
            onDealAction={handleDealAction}
            onPostOpportunity={handleTriggerCreateDeal}
            onConnectWhatsApp={handleConnectWhatsApp}
            onUpgradeToVip={() => setActiveView('subscriptions')}
          />
        )}

        {/* VIEW 2: SUBSCRIPTION PLANS (/subscriptions) */}
        {activeView === 'subscriptions' && (
          <SubscriptionsView
            currentUserId={currentUserId}
            userEmail={userDetails.email}
            userPhone={userDetails.phone}
            returnTo={subscriptionRedirectContext.returnTo}
            intent={subscriptionRedirectContext.intent}
            reasonMessage={subscriptionRedirectContext.reasonMessage}
            subscriptionStatus={subscriptionRedirectContext.status}
            onSubscriptionSuccess={handleSubscriptionSuccess}
            onNavigateHome={() => setActiveView('marketplace')}
            onRequireAuth={(intendedPlanCode) => {
              setSubscriptionRedirectContext((prev) => ({
                ...prev,
                returnTo: 'subscriptions',
                intent: 'join',
                reasonMessage: 'Create an account or sign in to complete your subscription.',
              }))
              navigateToView('choose_path')
            }}
          />
        )}

        {/* VIEW 3: PARTNER PORTAL */}
        {activeView === 'partner' && (
          <PartnerDashboardView
            initialTab={partnerDashboardTab}
            partnerName={userDetails.name || 'Partner'}
            email={userDetails.email}
            phone={userDetails.phone}
            userId={currentUserId}
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
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('lumo_reg_pwd')
                    try {
                      localStorage.setItem(
                        'lumo_user_session',
                        JSON.stringify({
                          id: registrationData.user.id,
                          name: userName,
                          email: profileData?.email || userDetails.email,
                          phone: profileData?.phone || userDetails.phone,
                          role: finalRole,
                          profilePhotoUrl: profileData?.profilePhotoUrl,
                        })
                      )
                    } catch {}
                  }
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
                  if (typeof window !== 'undefined') {
                    try {
                      localStorage.setItem(
                        'lumo_user_session',
                        JSON.stringify({
                          id: authUser?.id,
                          name: effectiveRole === 'ADMIN' ? 'Platform Administrator' : displayName,
                          email,
                          phone: authUser?.phone || userDetails.phone,
                          role: effectiveRole,
                          profilePhotoUrl: authUser?.image,
                        })
                      )
                    } catch {}
                  }

                  // Synchronize subscription from PostgreSQL database on login
                  const syncUid = authUser?.id
                  const syncEmail = email
                  if (syncUid || syncEmail) {
                    const q = new URLSearchParams()
                    if (syncUid) q.set('userId', syncUid)
                    if (syncEmail) q.set('email', syncEmail)
                    fetch(`/api/subscriptions/active?${q.toString()}`)
                      .then((res) => (res.ok ? res.json() : null))
                      .then((data) => {
                        if (data?.success && data.hasActiveSubscription && data.subscription) {
                          if (syncUid) setUserSubscription(syncUid, data.subscription)
                          if (syncEmail) setUserSubscription(syncEmail, data.subscription)
                          setDealsRevision((r) => r + 1)
                        }
                      })
                      .catch(() => {})
                  }

                  let target = availableWorkspaces.find((w) => w.type === effectiveRole) || INITIAL_WORKSPACES.find((w) => w.type === effectiveRole) || availableWorkspaces[1]
                  let nextWorkspaces = availableWorkspaces
                  
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
                    nextWorkspaces = [
                      ...availableWorkspaces.filter((w) => w.type !== 'BUSINESS'),
                      bizWs,
                    ]
                    setAvailableWorkspaces(nextWorkspaces)
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
                    nextWorkspaces = [
                      ...availableWorkspaces.filter((w) => w.type !== 'PARTNER'),
                      partnerWs,
                    ]
                    setAvailableWorkspaces(nextWorkspaces)
                    target = partnerWs
                  }
                  
                  setActiveWorkspace(target)

                  // Save authenticated session in local storage for instant hydration on refresh
                  if (typeof window !== 'undefined') {
                    try {
                      localStorage.setItem('lumo_auth_session', JSON.stringify({
                        id: authUser?.id || credentials?.user?.id,
                        email,
                        name: displayName,
                        role: effectiveRole,
                        phone: authUser?.phone,
                        image: authUser?.image,
                        organizationId: target.organizationId,
                        organizationName: target.organizationName,
                      }))
                      localStorage.setItem('lumo_active_workspace', JSON.stringify(target))
                      localStorage.setItem('lumo_available_workspaces', JSON.stringify(nextWorkspaces))
                    } catch (e) {}
                  }

                  let destinationView = 'partner'
                  let destinationPath = '/partner'

                  if (subscriptionRedirectContext.returnTo) {
                    destinationView = 'subscriptions'
                    destinationPath = '/subscriptions'
                  } else if (effectiveRole === 'ADMIN') {
                    destinationView = 'admin'
                    destinationPath = '/admin'
                  } else if (effectiveRole === 'BUSINESS') {
                    destinationView = 'business'
                    destinationPath = '/business'
                  }

                  setActiveView(destinationView)
                  if (typeof window !== 'undefined' && window.location.pathname !== destinationPath) {
                    window.history.pushState({}, '', destinationPath)
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
        currentUserId={currentUserId}
        userRole={currentUserRole}
        userOrgId={currentUserOrgId}
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
        partnerName={userDetails.name || undefined}
        partnerPhone={userDetails.phone || undefined}
        userRole={currentUserRole}
        userOrgId={currentUserOrgId}
        onConnectWhatsApp={() => {
          if (selectedProtectedDeal) {
            const opp = opportunities.find((o) => o.id === selectedProtectedDeal.id)
            if (opp) {
              handleConnectWhatsApp(opp)
            }
          }
        }}
      />

      {/* WhatsApp Escrow Matchmaker Modal */}
      <WhatsAppMiddlemanModal
        deal={selectedDealForWhatsApp}
        isOpen={showWhatsAppModal}
        onClose={() => {
          setShowWhatsAppModal(false)
          setSelectedDealForWhatsApp(null)
        }}
        initialBuyerName={userDetails.name}
        initialBuyerPhone={userDetails.phone}
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
      {!isAuthView && !isDashboardView && <Footer onNavigate={navigateToView} variant={activeView === 'marketplace' ? 'landing' : 'default'} />}
    </div>
  )
}
