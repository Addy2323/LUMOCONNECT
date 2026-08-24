'use client'

import React, { useState, useMemo } from 'react'
import { listOpportunities, getProtectedOpportunityDetails } from '@/modules/deals/service'
import type { OpportunityItem } from '@/modules/deals/types'
import type { ProtectedDealDetails } from '@/modules/deals/service'
import { requireActiveDealSubscription } from '@/modules/subscriptions/authorization'
import { getUserSubscription, setUserSubscription } from '@/modules/subscriptions/service'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { Footer } from '@/components/shared/Footer'
import { MobileNav } from '@/components/shared/MobileNav'
import { HeroSection } from '@/components/marketplace/HeroSection'
import { TrustStrip } from '@/components/marketplace/TrustStrip'
import { MarketplaceSectionHeader } from '@/components/marketplace/MarketplaceSectionHeader'
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters'
import { OpportunityCard } from '@/components/marketplace/OpportunityCard'
import {
  MarketplaceEmptyState,
} from '@/components/marketplace/MarketplaceStates'
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
import type { UserWorkspaceInfo, WorkspaceType } from '@/lib/session'

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
  const [savedDeals, setSavedDeals] = useState<string[]>([])
  const [selectedRolePath, setSelectedRolePath] = useState<'PARTNER' | 'BUSINESS'>('PARTNER')

  // Authentication State: Authenticated as Given M. with multi-workspace assignments
  const [currentUserId, setCurrentUserId] = useState<string | undefined>('usr_given_main')
  const [userDetails, setUserDetails] = useState({
    name: 'Given M.',
    email: 'given@lumo.co.tz',
    phone: '+255 700 000 000',
  })

  // Workspace & Admin Mode Security State
  const [availableWorkspaces] = useState<UserWorkspaceInfo[]>(INITIAL_WORKSPACES)
  const [activeWorkspace, setActiveWorkspace] = useState<UserWorkspaceInfo>(INITIAL_WORKSPACES[1]) // Partner Workspace
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

  // Filtered Opportunities from domain service
  const allOpportunities = useMemo(() => listOpportunities(), [])

  const opportunities = useMemo(() => {
    return listOpportunities({
      query: searchQuery,
      category: selectedCategory,
      type: selectedType,
      region: selectedRegion,
      sortBy,
    })
  }, [searchQuery, selectedCategory, selectedType, selectedRegion, sortBy])

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (selectedType !== 'ALL' ? 1 : 0) +
    (selectedRegion !== 'ALL' ? 1 : 0)

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('ALL')
    setSelectedType('ALL')
    setSelectedRegion('ALL')
  }

  const handleToggleSave = (dealId: string) => {
    setSavedDeals((prev) =>
      prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId]
    )
  }

  /**
   * Legitimate Workspace Switching Handler
   */
  const handleSelectWorkspace = (workspace: UserWorkspaceInfo) => {
    setActiveWorkspace(workspace)
    setIsAdminModeActive(false)

    if (workspace.type === 'PARTNER') {
      setActiveView('partner')
    } else if (workspace.type === 'BUSINESS') {
      setActiveView('business')
    } else {
      setActiveView('marketplace')
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
    setIsAdminModeActive(false)
    setActiveView('marketplace')
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-slate-100 transition-colors">
      {/* Persistent Admin Mode Security Warning Banner */}
      {isAdminModeActive && (
        <AdminModeBanner
          adminEmail={userDetails.email}
          adminRoleName="Super Administrator"
          onExitAdminMode={handleExitAdminMode}
        />
      )}

      {/* 70px Site Header with Legitimate Workspace Switcher */}
      <SiteHeader
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
          setActiveView(view)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onOpenHowItWorks={() => setShowHowItWorks(true)}
        onOpenSignIn={() => setActiveView('signin')}
        onOpenGetStarted={() => setActiveView('choose_path')}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <main className={`flex-1 ${isAuthView ? 'w-full px-4 sm:px-6' : 'lumo-container py-8 sm:py-10'}`}>
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

            {/* Section Header */}
            <div id="marketplace-filters-section" className="pt-2">
              <MarketplaceSectionHeader
                onPostOpportunity={handleTriggerCreateDeal}
                currentUserRole={currentUserRole}
                sortBy={sortBy}
                onSortChange={setSortBy}
                totalCount={opportunities.length}
              />
            </div>

            {/* Elevated 5-Column Search & Filters Bar */}
            <MarketplaceFilters
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
              totalResults={opportunities.length}
            />

            {/* Opportunity Grid */}
            {opportunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
                {opportunities.map((item) => {
                  const isOwner = Boolean(currentUserOrgId && currentUserOrgId === item.organizationId)
                  const isAdmin = currentUserRole === 'ADMIN'
                  const isAuthorizedForThisDeal = hasActiveSubscription || isOwner || isAdmin

                  return (
                    <OpportunityCard
                      key={item.id}
                      item={item}
                      isSubscribed={isAuthorizedForThisDeal}
                      isSaved={savedDeals.includes(item.id)}
                      onToggleSave={() => handleToggleSave(item.id)}
                      onApply={() => handleDealAction(item, 'join')}
                      onViewDetails={() => handleDealAction(item, 'view')}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="pb-12">
                <MarketplaceEmptyState onReset={handleClearFilters} />
              </div>
            )}
          </div>
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
            partnerName={userDetails.name.split(' ')[0] || 'Amina'}
            onOpenStatement={() => setActiveView('statement')}
            onExploreDeals={() => setActiveView('marketplace')}
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
            businessName={activeWorkspace.type === 'BUSINESS' ? (activeWorkspace.organizationName || 'Kijani Solar Tech') : userDetails.name}
            onCreateDeal={() => setShowCreateWizard(true)}
            onExploreDeals={() => setActiveView('marketplace')}
          />
        )}

        {/* VIEW 5: DEAL ROOM */}
        {activeView === 'dealroom' && <DealRoomView />}

        {/* VIEW 6: ADMIN & AUDIT OPERATIONS */}
        {activeView === 'admin' && (
          <AdminDashboardView
            adminName="Given"
            onExploreDeals={() => setActiveView('marketplace')}
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
                  setCurrentUserId('usr_given_main')
                  const target = availableWorkspaces.find((w) => (role === 'BUSINESS' ? w.type === 'BUSINESS' : w.type === 'PARTNER')) || availableWorkspaces[1]
                  setActiveWorkspace(target)
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
                onComplete={(finalRole) => {
                  setCurrentUserId('usr_given_main')
                  const target = availableWorkspaces.find((w) => (finalRole === 'BUSINESS' ? w.type === 'BUSINESS' : w.type === 'PARTNER')) || availableWorkspaces[1]
                  setActiveWorkspace(target)
                  if (subscriptionRedirectContext.returnTo) {
                    setActiveView('subscriptions')
                  } else if (finalRole === 'PARTNER') {
                    setActiveView('partner')
                  } else {
                    setActiveView('business')
                  }
                }}
                onCancel={() => setActiveView('marketplace')}
              />
            )}

            {/* SIGN IN */}
            {activeView === 'signin' && (
              <SignInView
                onSignInSuccess={(role) => {
                  setCurrentUserId('usr_given_main')
                  const target = availableWorkspaces.find((w) => (role === 'BUSINESS' ? w.type === 'BUSINESS' : role === 'ADMIN' ? w.type === 'ADMIN' : w.type === 'PARTNER')) || availableWorkspaces[1]
                  setActiveWorkspace(target)
                  if (role === 'ADMIN') {
                    setIsAdminModeActive(true)
                  }
                  if (subscriptionRedirectContext.returnTo) {
                    setActiveView('subscriptions')
                  } else if (role === 'PARTNER') {
                    setActiveView('partner')
                  } else if (role === 'BUSINESS') {
                    setActiveView('business')
                  } else {
                    setActiveView('admin')
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
      <MobileNav activeView={activeView} onNavigate={setActiveView} />

      {/* Footer ONLY on non-auth views */}
      {!isAuthView && <Footer onNavigate={setActiveView} />}
    </div>
  )
}
