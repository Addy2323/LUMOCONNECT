'use client'

import React, { useState, useEffect } from 'react'
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
  Video,
  Image as ImageIcon,
  Film,
  X,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import { getVideoEmbedInfo } from '@/modules/deals/service'
import { DealMediaViewer } from '@/components/common/DealMediaViewer'
import { useAdminResource } from '../useAdminResource'
import { ResourceStatus } from '../ResourceStatus'
import { AdminDealItem } from '../types'
import { useAdminToast } from '../AdminToast'

export function DealsRegistryTab() {
  const { showToast } = useAdminToast()
  const resource = useAdminResource<{ deals: AdminDealItem[] }>('/api/admin/deals')
  const deals = resource.data?.deals ?? []
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<AdminDealItem | null>(null)
  const [removeAllOpen, setRemoveAllOpen] = useState(false)
  const [removalConfirmation, setRemovalConfirmation] = useState('')
  const [removing, setRemoving] = useState(false)

  const removeAllProducts = async () => {
    if (removing || removalConfirmation !== 'REMOVE ALL PRODUCTS') return
    setRemoving(true)
    try {
      const response = await fetch('/api/admin/deals/remove-all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation: removalConfirmation }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Removal failed.')
      setRemoveAllOpen(false)
      setRemovalConfirmation('')
      resource.retry()
      showToast('success', 'Products removed', `${result.archivedCount} listings archived. Transaction history preserved.`)
    } catch (error) { showToast('error', 'Removal failed', error instanceof Error ? error.message : 'Please retry.') }
    finally { setRemoving(false) }
  }

  const [newDealForm, setNewDealForm] = useState({
    title: '',
    businessName: '',
    category: 'Renewable Energy',
    type: 'CUSTOMER_ACQUISITION' as AdminDealItem['type'],
    rewardValueTZS: 0,
    budgetTZS: 0,
  })

  const filteredDeals = deals.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.businessName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter
    const matchesCategory = categoryFilter === 'ALL' || d.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/admin/deals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dealId: id, status }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to update this deal.')
      resource.retry()
      showToast('success', 'Deal updated', 'The database status has been updated.')
    } catch (error) {
      showToast('error', 'Update failed', error instanceof Error ? error.message : 'Please retry.')
    }
  }
  const handleTogglePause = (id: string) => {
    const target = deals.find(deal => deal.id === id)
    if (target) void updateStatus(id, target.status === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED')
  }
  const handleArchiveDeal = (id: string) => { void updateStatus(id, 'ARCHIVED') }
  const handleCreateDraft = () => {
    showToast('error', 'Draft creation unavailable', 'The administrator draft workflow is not connected to persistent business records yet. No draft was created.')
  }

  if (!resource.data) return <ResourceStatus {...resource} />

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      <ResourceStatus {...resource} />
      <div className="rounded-xl border border-red-200 p-4">
        <button type="button" onClick={() => setRemoveAllOpen(true)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Remove all products</button>
        {removeAllOpen && <div className="mt-3 space-y-3">
          <p className="text-sm">Remove every database listing from the marketplace, across all categories and pages. Orders, rewards and transaction history remain available. Archived records remain in the admin registry.</p>
          <label className="block text-sm">Type REMOVE ALL PRODUCTS to confirm
            <input value={removalConfirmation} onChange={event => setRemovalConfirmation(event.target.value)} className="mt-1 block w-full max-w-sm rounded border p-2" disabled={removing} />
          </label>
          <button type="button" disabled={removing || removalConfirmation !== 'REMOVE ALL PRODUCTS'} onClick={removeAllProducts} className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-40">{removing ? 'Removing…' : 'Confirm removal'}</button>
          <button type="button" disabled={removing} onClick={() => { setRemoveAllOpen(false); setRemovalConfirmation('') }} className="px-4 py-2">Cancel</button>
        </div>}
      </div>
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
            Database opportunities. Shows up to 100 recent records; refreshes every five seconds.
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
              <th className="p-3">Secured Budget</th>
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
                    {deal.rewardDisplay ?? 'Terms not recorded'}
                  </span>
                  <div className="text-[10px] text-slate-400">per verified outcome</div>
                </td>

                <td className="p-3 font-mono">
                  <div className="text-slate-900 dark:text-white font-bold">
                    {deal.budgetRecorded ? `TZS ${deal.budgetTZS.toLocaleString()}` : 'Not recorded'}
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
                      {deal.version ? `v${deal.version}` : 'Unpublished'}
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
                    <button
                      onClick={() => setSelectedDeal(deal)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                      title="Inspect Opportunity & Media Assets"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {deal.status === 'PUBLISHED' || deal.status === 'PAUSED' ? (
                      <button
                        onClick={() => handleTogglePause(deal.id)}
                        className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                          deal.status === 'PUBLISHED'
                            ? 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 border-purple-200 dark:border-purple-800'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                        }`}
                        title={deal.status === 'PUBLISHED' ? 'Pause Deal' : 'Resume Deal'}
                      >
                        {deal.status === 'PUBLISHED' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    ) : null}

                    <button
                      onClick={() => handleArchiveDeal(deal.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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

      {/* INSPECT DEAL & MEDIA MODAL */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-[#FF6A00] flex items-center justify-center font-black">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {selectedDeal.title}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Publisher: <strong>{selectedDeal.businessName}</strong> · Status: <span className="font-bold text-[#FF6A00]">{selectedDeal.status}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDeal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Commercial Terms Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Partner Reward</div>
                <div className="text-sm font-black text-[#FF6A00] font-mono mt-0.5">
                  {selectedDeal.rewardDisplay ?? 'Terms not recorded'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Secured Budget</div>
                <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {selectedDeal.budgetRecorded ? `TZS ${selectedDeal.budgetTZS.toLocaleString()}` : 'Not recorded'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Active Partners</div>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedDeal.activePartners} Enrolled
                </div>
              </div>
            </div>

            {/* Uploaded Media & Promotional Assets Review */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#FF6A00]" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Uploaded Media & Video Assets
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-[#FF6A00]">
                  Verified Media
                </span>
              </div>

              {/* Media Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Video Preview */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-purple-600" />
                    <span>Promotional Pitch Video</span>
                  </div>

                  {selectedDeal.promoVideoUrl ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video relative">
                      <DealMediaViewer
                        mediaUrl={selectedDeal.promoVideoUrl}
                        posterUrl={selectedDeal.featuredImageUrl}
                        altTitle={selectedDeal.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 text-center text-xs text-slate-400 aspect-video flex flex-col items-center justify-center gap-1 bg-white dark:bg-slate-900">
                      <Video className="w-6 h-6 opacity-30 text-slate-400" />
                      <span className="font-semibold">No Video Attached</span>
                    </div>
                  )}
                </div>

                {/* Banner Preview */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Featured Cover Banner</span>
                  </div>

                  {selectedDeal.featuredImageUrl ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-video relative">
                      <img
                        src={selectedDeal.featuredImageUrl}
                        alt={selectedDeal.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 text-center text-xs text-slate-400 aspect-video flex flex-col items-center justify-center gap-1 bg-white dark:bg-slate-900">
                      <ImageIcon className="w-6 h-6 opacity-30 text-slate-400" />
                      <span className="font-semibold">Default Banner</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Public Commercial Summary */}
              {(selectedDeal.summary || selectedDeal.description) && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#FF6A00]" />
                    <span>Public Commercial Summary:</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    {selectedDeal.summary || selectedDeal.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDeal(null)}
                className="py-2 px-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs cursor-pointer hover:bg-slate-800"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <option value="">Business selection is not connected</option>
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
                    onChange={(e) => setNewDealForm({ ...newDealForm, type: e.target.value as any })}
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
                  <label className="font-bold block mb-1">Total Secured Budget (TZS)</label>
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
