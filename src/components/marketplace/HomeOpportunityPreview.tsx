'use client'

import React, { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import type { OpportunityItem } from '@/modules/deals/types'
import { getUserEnrolledDealIds } from '@/modules/deals/service'
import { OpportunityCard } from './OpportunityCard'

interface HomeOpportunityPreviewProps {
  opportunities: OpportunityItem[]
  currentUserRole: string
  currentUserOrgId?: string
  currentUserId?: string
  hasActiveSubscription: boolean
  savedDeals: string[]
  onToggleSave: (dealId: string) => void
  onDealAction: (opportunity: OpportunityItem, intent: 'view' | 'join') => void
  onViewMore: () => void
}

export function HomeOpportunityPreview({
  opportunities,
  currentUserRole,
  currentUserOrgId,
  currentUserId,
  hasActiveSubscription,
  savedDeals,
  onToggleSave,
  onDealAction,
  onViewMore,
}: HomeOpportunityPreviewProps) {
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(() => getUserEnrolledDealIds(currentUserId))

  useEffect(() => {
    const syncEnrolled = () => {
      setEnrolledIds(getUserEnrolledDealIds(currentUserId))
    }
    syncEnrolled()

    window.addEventListener('lumo:joined-deals-updated', syncEnrolled)
    window.addEventListener('lumo:deals-updated', syncEnrolled)
    window.addEventListener('storage', syncEnrolled)

    return () => {
      window.removeEventListener('lumo:joined-deals-updated', syncEnrolled)
      window.removeEventListener('lumo:deals-updated', syncEnrolled)
      window.removeEventListener('storage', syncEnrolled)
    }
  }, [currentUserId])

  const previewOpportunities = opportunities.slice(0, 3)

  if (previewOpportunities.length === 0) return null

  return (
    <section aria-labelledby="home-opportunities-title" className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/30 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-600">Latest deals</p>
          <h2 id="home-opportunities-title" className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
            Featured opportunities
          </h2>
          <p className="mt-1 text-sm text-slate-500">A quick look at deals available now across Tanzania.</p>
        </div>
        <button type="button" onClick={onViewMore} className="hidden items-center gap-2 text-sm font-extrabold text-orange-600 transition hover:text-orange-700 sm:flex">
          View more opportunities <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {previewOpportunities.map((item) => {
          const isOwner = Boolean(currentUserOrgId && currentUserOrgId === item.organizationId)
          const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN'
          const isAuthorizedForThisDeal = hasActiveSubscription || isOwner || isAdmin
          const isEnrolled = enrolledIds.has(item.id) || (item.slug ? enrolledIds.has(item.slug) : false)

          return (
            <OpportunityCard
              key={item.id}
              item={item}
              isSubscribed={isAuthorizedForThisDeal}
              isSaved={savedDeals.includes(item.id)}
              isEnrolled={isEnrolled}
              onToggleSave={() => onToggleSave(item.id)}
              onApply={() => onDealAction(item, 'join')}
              onViewDetails={() => onDealAction(item, 'view')}
              onOpenEnrolled={() => onDealAction(item, 'view')}
            />
          )
        })}
      </div>

      <div className="mt-6 flex justify-center">
        <button type="button" onClick={onViewMore} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 sm:w-auto sm:min-w-64">
          View More Opportunities <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}
