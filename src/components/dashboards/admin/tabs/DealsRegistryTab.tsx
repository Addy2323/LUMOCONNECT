'use client'

import React, { useState } from 'react'
import {
  Briefcase,
  Search,
  Plus,
  Play,
  Pause,
  Archive,
  Eye,
  Edit,
  History,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Building,
  Tag,
} from 'lucide-react'
import { MOCK_ADMIN_DEALS } from '../mockData'
import { AdminDealItem } from '../types'
import { useAdminToast } from '../AdminToast'

export function DealsRegistryTab() {
  const { showToast } = useAdminToast()
  const [deals, setDeals] = useState<AdminDealItem[]>(MOCK_ADMIN_DEALS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newDealForm, setNewDealForm] = useState({
    title: '',
    businessName: 'Kijani Solar Tech Ltd',
    category: 'Renewable Energy',
    type: 'CUSTOMER_ACQUISITION' as AdminDealItem['type'],
    rewardValueTZS: 50000,
    budgetTZS: 20000000,
  })

  const filteredDeals = deals.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.businessName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter
    const matchesCategory = categoryFilter === 'ALL' || d.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleTogglePause = (id: string) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextStatus = d.status === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED'
          showToast('info', `Campaign ${nextStatus === 'PUBLISHED' ? 'Resumed' : 'Paused'}`, `"${d.title}" status updated.`)
          return { ...d, status: nextStatus }
        }
        return d
      })
    )
  }

  const handleArchiveDeal = (id: string) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === id) return { ...d, status: 'ARCHIVED' }
        return d
      })
    )
    showToast('info', 'Opportunity Archived', 'Deal archived. Record retained in immutable platform ledger.')
  }

  const handleCreateDraft = () => {
    if (!newDealForm.title) return
    const newDeal: AdminDealItem = {
      id: `deal_${Date.now()}`,
      slug: newDealForm.title.toLowerCase().replace(/\s+/g, '-'),
      title: newDealForm.title,
      businessName: newDealForm.businessName,
      category: newDealForm.category,
      type: newDealForm.type,
      rewardValueTZS: Number(newDealForm.rewardValueTZS),
      budgetTZS: Number(newDealForm.budgetTZS),
      spentTZS: 0,
      status: 'DRAFT',
      version: 1,
      activePartners: 0,
      createdAt: 'Today',
    }
    setDeals([newDeal, ...deals])
    setShowCreateModal(false)
    setNewDealForm({
      title: '',
      businessName: 'Kijani Solar Tech Ltd',
      category: 'Renewable Energy',
      type: 'CUSTOMER_ACQUISITION',
      rewardValueTZS: 50000,
      budgetTZS: 20000000,
    })
    showToast('success', 'Draft Created', 'Draft created on behalf of verified business. Ready for Maker submission.')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Deals & Opportunities Repository</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-2 py-0.5 rounded-full">
              C/R/U/Archive
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository for all Deals, campaigns, affiliate programs, leads, and B2B opportunities with strict versioning.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="py-2.5 px-4 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#FF6A00]" />
          <span>Create Draft on Behalf of Business</span>
        </button>
      </div>

      {/* Versioning & Policy Banner */}
      <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
        <History className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Commercial Terms Versioning:</strong> Published deals with participating Partners cannot be silently edited. Any commercial reward adjustments create a new effective-dated version (v2+).
        </span>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search deals by title or publishing business..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="ALL">All Deal Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="UNDER_REVIEW">Under Review (Maker-Checker)</option>
            <option value="PUBLISHED">Published (Live)</option>
            <option value="PAUSED">Paused</option>
            <option value="ARCHIVED">Archived / Closed</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="ALL">All Categories</option>
            <option value="Renewable Energy">Renewable Energy</option>
            <option value="Financial Services">Financial Services</option>
            <option value="Agriculture">Agriculture & Farming</option>
            <option value="Technology">Technology & SaaS</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">Deal Details</th>
              <th className="p-3">Publisher</th>
              <th className="p-3">Reward Terms</th>
              <th className="p-3">Escrow Budget</th>
              <th className="p-3">Active Partners</th>
              <th className="p-3">Version & Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filteredDeals.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No deals or opportunities registered in platform registry yet.
                </td>
              </tr>
            ) : (
              filteredDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-extrabold text-slate-900 dark:text-white max-w-xs">{deal.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {deal.id} · {deal.category}</div>
                  </td>

                <td className="p-3">
                  <div className="font-bold text-slate-900 dark:text-white">{deal.businessName}</div>
                  <div className="text-[10px] text-slate-400">{deal.type}</div>
                </td>

                <td className="p-3 font-mono">
                  <span className="text-[#FF6A00] font-black text-xs">
                    TZS {deal.rewardValueTZS.toLocaleString()}
                  </span>
                  <div className="text-[10px] text-slate-400">per verified outcome</div>
                </td>

                <td className="p-3 font-mono">
                  <div className="text-slate-900 dark:text-white font-bold">
                    TZS {deal.budgetTZS.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600">
                    Spent: TZS {deal.spentTZS.toLocaleString()}
                  </div>
                </td>

                <td className="p-3">
                  <span className="font-bold text-slate-900 dark:text-white">{deal.activePartners}</span>
                  <span className="text-slate-400 text-[10px]"> partners</span>
                </td>

                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px] font-bold">
                      v{deal.version}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        deal.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : deal.status === 'UNDER_REVIEW'
                          ? 'bg-amber-100 text-amber-700'
                          : deal.status === 'PAUSED'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {deal.status}
                    </span>
                  </div>
                </td>

                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {deal.status === 'PUBLISHED' || deal.status === 'PAUSED' ? (
                      <button
                        onClick={() => handleTogglePause(deal.id)}
                        className={`p-1.5 rounded-lg border text-xs font-bold ${
                          deal.status === 'PUBLISHED'
                            ? 'text-purple-600 hover:bg-purple-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={deal.status === 'PUBLISHED' ? 'Pause Deal' : 'Resume Deal'}
                      >
                        {deal.status === 'PUBLISHED' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    ) : null}

                    <button
                      onClick={() => handleArchiveDeal(deal.id)}
                      className="p-1.5 rounded-lg border text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      title="Archive Deal"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>

      {/* CREATE DRAFT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#FF6A00]" />
              <span>Create Deal Draft on Behalf of Business</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Select Verified Business</label>
                <select
                  value={newDealForm.businessName}
                  onChange={(e) => setNewDealForm({ ...newDealForm, businessName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value="Kijani Solar Tech Ltd">Kijani Solar Tech Ltd (BRELA Verified)</option>
                  <option value="MobiPay Africa Ltd">MobiPay Africa Ltd (BRELA Verified)</option>
                  <option value="Kilimo Bora Agrotech">Kilimo Bora Agrotech (BRELA Verified)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Deal Title & Objective</label>
                <input
                  type="text"
                  placeholder="e.g. Expand Solar Installations in Morogoro"
                  value={newDealForm.title}
                  onChange={(e) => setNewDealForm({ ...newDealForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Category</label>
                  <select
                    value={newDealForm.category}
                    onChange={(e) => setNewDealForm({ ...newDealForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Renewable Energy">Renewable Energy</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Technology">Technology</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Opportunity Type</label>
                  <select
                    value={newDealForm.type}
                    onChange={(e) => setNewDealForm({ ...newDealForm, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="CUSTOMER_ACQUISITION">Customer Acquisition</option>
                    <option value="QUALIFIED_LEADS">Qualified Leads</option>
                    <option value="DISTRIBUTOR_SEARCH">Distributor Search</option>
                    <option value="BOUNTIES">Reverse Bounties</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Partner Reward (TZS)</label>
                  <input
                    type="number"
                    value={newDealForm.rewardValueTZS}
                    onChange={(e) => setNewDealForm({ ...newDealForm, rewardValueTZS: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Total Escrow Budget (TZS)</label>
                  <input
                    type="number"
                    value={newDealForm.budgetTZS}
                    onChange={(e) => setNewDealForm({ ...newDealForm, budgetTZS: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateDraft}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs"
              >
                Create Version 1 Draft
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
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
