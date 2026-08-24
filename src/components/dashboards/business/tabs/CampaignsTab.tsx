'use client'

import React, { useState } from 'react'
import {
  Megaphone,
  Plus,
  Layers,
  Calendar,
  DollarSign,
  TrendingUp,
  Archive,
  Edit,
  Pause,
  Play,
  X,
  Sparkles,
  Briefcase,
} from 'lucide-react'
import { MOCK_BUSINESS_CAMPAIGNS } from '../mockData'
import { BusinessCampaignGroup } from '../types'
import { useBusinessToast } from '../BusinessToast'

export function CampaignsTab() {
  const { showToast } = useBusinessToast()

  const [campaigns, setCampaigns] = useState<BusinessCampaignGroup[]>(MOCK_BUSINESS_CAMPAIGNS)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    objective: '',
    totalBudgetTZS: 50000000,
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    channels: 'Field Sales, Tech Creators, Regional Distributors',
  })

  const handleCreateCampaign = () => {
    if (!newCampaign.title.trim() || !newCampaign.objective.trim()) {
      showToast('error', 'Validation Error', 'Campaign title and objective are required.')
      return
    }

    const created: BusinessCampaignGroup = {
      id: `camp_${Date.now()}`,
      title: newCampaign.title,
      objective: newCampaign.objective,
      totalBudgetTZS: Number(newCampaign.totalBudgetTZS),
      spentTZS: 0,
      startDate: newCampaign.startDate,
      endDate: newCampaign.endDate,
      status: 'ACTIVE',
      associatedOpportunityIds: [],
      channels: newCampaign.channels.split(',').map((c) => c.trim()),
      impressions: 0,
      conversions: 0,
    }

    setCampaigns([created, ...campaigns])
    setShowCreateModal(false)
    setNewCampaign({
      title: '',
      objective: '',
      totalBudgetTZS: 50000000,
      startDate: '2026-09-01',
      endDate: '2026-12-31',
      channels: 'Field Sales, Tech Creators, Regional Distributors',
    })

    showToast('success', 'Campaign Initiative Launched', `"${created.title}" is now active. You can associate opportunities to it.`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Commercial Campaigns & Strategic Initiatives</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-2 py-0.5 rounded-full">
              CRUD / Publish / Archive
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate multi-channel commercial initiatives grouping 1 or more specific opportunities with unified budgets.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign Group</span>
        </button>
      </div>

      {/* Conceptual Distinction Callout */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        <strong>Campaigns vs. Opportunities:</strong> An <em>Opportunity</em> is one concrete offer a Partner joins (e.g. household sales commission). A <em>Campaign</em> is a broader commercial umbrella containing multiple opportunities, unified budgets, and shared creative materials.
      </div>

      {/* Campaigns Grid */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500">
            <Megaphone className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <div className="font-bold text-slate-700 dark:text-slate-300">No Commercial Campaigns Created Yet</div>
            <div className="mt-0.5">Click &quot;New Campaign Group&quot; above to organize multiple deals under unified budgets and distribution channels.</div>
          </div>
        ) : (
          campaigns.map((camp) => (
          <div
            key={camp.id}
            className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {camp.status}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {camp.startDate} → {camp.endDate}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {camp.title}
                </h3>
                <p className="text-xs text-slate-500 max-w-2xl">{camp.objective}</p>
              </div>

              <div className="text-right sm:shrink-0 bg-white dark:bg-slate-900 p-3 rounded-2xl border">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Allocated Campaign Budget</div>
                <div className="text-base font-black text-[#FF6A00] font-mono">
                  TZS {camp.totalBudgetTZS.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-600 font-bold">
                  Spent: TZS {camp.spentTZS.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Channels & Linked Opportunities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-900 p-3.5 rounded-2xl border">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Active Distribution Channels
                </span>
                <div className="flex flex-wrap gap-1">
                  {camp.channels.map((ch) => (
                    <span key={ch} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-medium text-[10px]">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Associated Deals & Opportunities
                </span>
                <div className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-[#FF6A00]" />
                  <span>3 Active Opportunities linked</span>
                </div>
              </div>
            </div>
          </div>
        )))}
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Create Strategic Campaign
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 National Rural Solar Expansion"
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Commercial Objective</label>
                <textarea
                  rows={2}
                  placeholder="State the commercial goal, targets, and expected outcomes..."
                  value={newCampaign.objective}
                  onChange={(e) => setNewCampaign({ ...newCampaign, objective: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Total Campaign Budget (TZS)</label>
                <input
                  type="number"
                  value={newCampaign.totalBudgetTZS}
                  onChange={(e) => setNewCampaign({ ...newCampaign, totalBudgetTZS: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleCreateCampaign}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Launch Campaign Initiative
              </button>
              <button onClick={() => setShowCreateModal(false)} className="py-2.5 px-4 border rounded-xl text-xs font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
