'use client'

import React, { useState } from 'react'
import {
  Briefcase,
  Search,
  Plus,
  Edit,
  Pause,
  Play,
  Archive,
  Eye,
  AlertTriangle,
  Lock,
  Sparkles,
  CheckCircle2,
  Copy,
  Clock,
  History,
  X,
  FileText,
  Film,
} from 'lucide-react'
import { BusinessOpportunityItem } from '../types'
import { useBusinessToast } from '../BusinessToast'

interface MyOpportunitiesTabProps {
  opportunities: BusinessOpportunityItem[]
  setOpportunities: React.Dispatch<React.SetStateAction<BusinessOpportunityItem[]>>
  onOpenCreateWizard: () => void
}

export function MyOpportunitiesTab({
  opportunities,
  setOpportunities,
  onOpenCreateWizard,
}: MyOpportunitiesTabProps) {
  const { showToast } = useBusinessToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedOpp, setSelectedOpp] = useState<BusinessOpportunityItem | null>(null)
  const [versioningModal, setVersioningModal] = useState<BusinessOpportunityItem | null>(null)
  const [amendmentReason, setAmendmentReason] = useState('')
  const [newRewardValue, setNewRewardValue] = useState<number>(0)

  const filtered = opportunities.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleTogglePause = (opp: BusinessOpportunityItem) => {
    const nextStatus = opp.status === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED'
    setOpportunities((prev) =>
      prev.map((o) => (o.id === opp.id ? { ...o, status: nextStatus } : o))
    )
    showToast(
      'info',
      `Opportunity ${nextStatus === 'PUBLISHED' ? 'Resumed' : 'Paused'}`,
      `"${opp.title}" is now ${nextStatus.toLowerCase()}.`
    )
  }

  const handleArchive = (opp: BusinessOpportunityItem) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === opp.id ? { ...o, status: 'ARCHIVED' } : o))
    )
    showToast('info', 'Opportunity Archived', `"${opp.title}" has been archived. Existing earned rewards remain payable.`)
  }

  const handleDuplicate = (opp: BusinessOpportunityItem) => {
    const duplicated: BusinessOpportunityItem = {
      ...opp,
      id: `opp_${Date.now()}`,
      slug: `${opp.slug}-copy`,
      title: `${opp.title} (Copy)`,
      status: 'DRAFT',
      version: 1,
      activePartners: 0,
      totalConversions: 0,
      spentTZS: 0,
      createdAt: 'Today',
      versionHistory: [],
    }
    setOpportunities([duplicated, ...opportunities])
    showToast('success', 'Opportunity Duplicated', `Created draft copy: "${duplicated.title}".`)
  }

  const handleDeleteDraft = (opp: BusinessOpportunityItem) => {
    if (opp.status !== 'DRAFT') {
      showToast('error', 'Immutability Guard', 'Only unpublished Drafts can be deleted. Published opportunities must be paused or archived.')
      return
    }
    setOpportunities((prev) => prev.filter((o) => o.id !== opp.id))
    showToast('info', 'Draft Deleted', `Draft "${opp.title}" removed.`)
  }

  const handleCreateNewVersion = () => {
    if (!versioningModal || !amendmentReason.trim()) {
      showToast('error', 'Validation Error', 'You must document the commercial justification for creating a new version.')
      return
    }

    const nextVer = versioningModal.version + 1
    const updated: BusinessOpportunityItem = {
      ...versioningModal,
      version: nextVer,
      rewardValueTZS: newRewardValue > 0 ? newRewardValue : versioningModal.rewardValueTZS,
      status: 'UNDER_REVIEW', // Material changes require LUMO checker re-verification
      versionHistory: [
        ...(versioningModal.versionHistory || []),
        {
          version: nextVer,
          amendedAt: 'Today',
          changesDescription: amendmentReason,
          partnerConsentRequired: versioningModal.activePartners > 0,
        },
      ],
    }

    setOpportunities((prev) =>
      prev.map((o) => (o.id === versioningModal.id ? updated : o))
    )

    showToast(
      'success',
      `Version ${nextVer} Submitted for Review`,
      `Commercial term changes submitted to LUMO Compliance Checkers. Existing enrolled Partners will receive a consent update notification.`
    )
    setVersioningModal(null)
    setAmendmentReason('')
    setNewRewardValue(0)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>My Opportunities & Commercial Terms Registry</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-2 py-0.5 rounded-full">
              C/R/U/Archive + Versioning
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage drafts, submitted, live, and paused opportunities. Published terms are protected by controlled versioning.
          </p>
        </div>

        <button
          onClick={onOpenCreateWizard}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>New Opportunity</span>
        </button>
      </div>

      {/* Editing & Immutability Rules Callout */}
      <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <strong>Opportunity Editing & Versioning Rules:</strong> Drafts can be freely edited or deleted. Once an opportunity is published with active Partners, commercial terms (rewards, attribution window, qualification rules) cannot be changed silently; modifications require generating a <strong>New Version</strong> (e.g. v2, v3) with LUMO review and Partner consent notices.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search opportunities by title, category, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Opportunity Statuses</option>
            <option value="PUBLISHED">Live / Published</option>
            <option value="UNDER_REVIEW">Under LUMO Review</option>
            <option value="DRAFT">Drafts</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Opportunity Cards List */}
      <div className="space-y-3">
        {filtered.map((opp) => (
          <div
            key={opp.id}
            className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4"
          >
            {/* Media Banner & Card Header */}
            <div className="flex flex-col md:flex-row gap-4 items-start">
              {opp.coverImageUrl && (
                <div className="relative w-full md:w-48 h-32 rounded-2xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700">
                  <img
                    src={opp.coverImageUrl}
                    alt={opp.title}
                    className="w-full h-full object-cover"
                  />
                  {opp.promoVideoUrl && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-slate-900 ml-0.5 text-slate-900" />
                      </div>
                    </div>
                  )}
                  {opp.promoVideoUrl && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-purple-900/80 text-purple-200 font-bold px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                      <Film className="w-2.5 h-2.5" />
                      <span>Video Pitch</span>
                    </span>
                  )}
                </div>
              )}

              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] rounded-full">
                        {opp.type.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          opp.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : opp.status === 'UNDER_REVIEW'
                            ? 'bg-purple-100 text-purple-700'
                            : opp.status === 'DRAFT'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {opp.status}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border text-slate-500">
                        Version {opp.version}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                      {opp.title}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-2xl">{opp.publicSummary}</p>
                  </div>

                  <div className="text-right sm:shrink-0 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Partner Reward Rate</div>
                    <div className="text-base font-black text-[#FF6A00] font-mono">
                      TZS {opp.rewardValueTZS.toLocaleString()} / Result
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {opp.commercialResult.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">Active Partners</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{opp.activePartners}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">Total Conversions</span>
                <span className="font-mono font-bold text-emerald-600">{opp.totalConversions}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">Budget Allocated</span>
                <span className="font-mono font-bold">TZS {opp.budgetTZS.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">Tracking Method</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{opp.trackingMethod}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                {opp.status === 'PUBLISHED' && (
                  <button
                    onClick={() => {
                      setVersioningModal(opp)
                      setNewRewardValue(opp.rewardValueTZS)
                    }}
                    className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Create New Version (v{opp.version + 1})</span>
                  </button>
                )}

                {opp.status === 'DRAFT' && (
                  <button
                    onClick={() => onOpenCreateWizard()}
                    className="py-1.5 px-3 bg-[#FF6A00] text-white rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Draft</span>
                  </button>
                )}

                <button
                  onClick={() => handleDuplicate(opp)}
                  className="py-1.5 px-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-white dark:hover:bg-slate-800 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {(opp.status === 'PUBLISHED' || opp.status === 'PAUSED') && (
                  <button
                    onClick={() => handleTogglePause(opp)}
                    className="p-1.5 border rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    title={opp.status === 'PUBLISHED' ? 'Pause Campaign' : 'Resume Campaign'}
                  >
                    {opp.status === 'PUBLISHED' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                )}

                {opp.status === 'DRAFT' && (
                  <button
                    onClick={() => handleDeleteDraft(opp)}
                    className="py-1 px-2.5 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50"
                  >
                    Delete Draft
                  </button>
                )}

                {opp.status !== 'ARCHIVED' && opp.status !== 'DRAFT' && (
                  <button
                    onClick={() => handleArchive(opp)}
                    className="p-1.5 border rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                    title="Archive Opportunity"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE NEW VERSION MODAL */}
      {versioningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center font-black">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Commercial Terms Versioning (v{versioningModal.version + 1})
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">{versioningModal.title}</div>
                </div>
              </div>

              <button
                onClick={() => setVersioningModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200 leading-relaxed">
                <strong>Material Change Protection:</strong> This opportunity has {versioningModal.activePartners} active Partners. Altering commercial terms requires creating Version {versioningModal.version + 1}. All existing Partners will receive an automatic terms update notification.
              </div>

              <div>
                <label className="font-bold block mb-1">New Reward Value (TZS)</label>
                <input
                  type="number"
                  value={newRewardValue}
                  onChange={(e) => setNewRewardValue(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Reason for Amendment & Changelog Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Expanded eligible geographic territory to include Morogoro rural districts with increased commission rate..."
                  value={amendmentReason}
                  onChange={(e) => setAmendmentReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleCreateNewVersion}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Submit Version {versioningModal.version + 1} for Review
              </button>
              <button
                onClick={() => setVersioningModal(null)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
