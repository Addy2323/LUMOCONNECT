'use client'

import React from 'react'
import {
  Bookmark,
  ShieldCheck,
  Film,
  Trash2,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { PartnerOpportunitySummary } from '../types'
import { usePartnerToast } from '../PartnerToast'

interface SavedOpportunitiesTabProps {
  opportunities: PartnerOpportunitySummary[]
  setOpportunities: React.Dispatch<React.SetStateAction<PartnerOpportunitySummary[]>>
  onOpenOpportunityDetail: (opp: PartnerOpportunitySummary) => void
  onExploreMore: () => void
}

export function SavedOpportunitiesTab({
  opportunities,
  setOpportunities,
  onOpenOpportunityDetail,
  onExploreMore,
}: SavedOpportunitiesTabProps) {
  const { showToast } = usePartnerToast()

  const savedList = opportunities.filter((o) => o.isSaved)

  const handleRemove = (id: string, title: string) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isSaved: false } : o))
    )
    showToast('info', 'Removed from Bookmarks', `"${title}" removed.`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Saved Opportunities & Bookmarks</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-2 py-0.5 rounded-full">
              {savedList.length} Bookmarked
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Opportunities you bookmarked for later review before joining.
          </p>
        </div>

        <button
          onClick={onExploreMore}
          className="py-2 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
          <span>Discover More Deals</span>
        </button>
      </div>

      {savedList.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            No saved opportunities yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click the bookmark icon on any deal in the Discover tab to save it here for quick access.
          </p>
          <button
            onClick={onExploreMore}
            className="py-2 px-5 bg-[#FF6A00] text-white font-extrabold text-xs rounded-xl shadow-xs"
          >
            Explore Deals
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedList.map((opp) => (
            <div
              key={opp.id}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden flex flex-col justify-between group hover:border-orange-300 transition-all shadow-xs"
            >
              <div>
                {opp.coverImageUrl && (
                  <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={opp.coverImageUrl}
                      alt={opp.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] bg-[#FF6A00] text-white font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                        {opp.category}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemove(opp.id, opp.title)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{opp.businessName}</span>
                    {opp.isBusinessVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>

                  <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {opp.title}
                  </h4>

                  <div className="font-mono font-black text-xs text-[#FF6A00]">
                    {opp.rewardDisplay}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => onOpenOpportunityDetail(opp)}
                  className="w-full py-2 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-colors text-center"
                >
                  View Details & Join
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
