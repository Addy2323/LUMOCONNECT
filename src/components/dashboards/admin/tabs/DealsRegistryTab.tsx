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

function normalizeToArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean).map(String)
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String)
      } catch {}
    }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map((s) => s.trim()).filter(Boolean)
    }
    return [trimmed]
  }
  return []
}

export function DealsRegistryTab() {
  const { showToast } = useAdminToast()
  const resource = useAdminResource<{ deals: AdminDealItem[] }>('/api/admin/deals')
  const deals = resource.data?.deals ?? []
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<AdminDealItem | null>(null)
  const [inspectTab, setInspectTab] = useState<'overview' | 'media' | 'operations' | 'governance'>('overview')
  const [editingDeal, setEditingDeal] = useState<AdminDealItem | null>(null)
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

  const selectedMediaList = selectedDeal
    ? [...normalizeToArray(selectedDeal.mediaUrls), ...normalizeToArray(selectedDeal.galleryImageUrls)].filter(
        (url, idx, self) => self.indexOf(url) === idx
      )
    : []
  const selectedReqList = selectedDeal ? normalizeToArray(selectedDeal.requirements) : []
  const selectedDelivList = selectedDeal ? normalizeToArray(selectedDeal.deliverables) : []

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
                      title="Inspect Complete Opportunity & Media Assets"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setEditingDeal(deal)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                      title="Edit Opportunity Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
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

      {/* INSPECT OPPORTUNITY FULL MODAL */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative">
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
                    Publisher: <strong>{selectedDeal.businessName}</strong> ({selectedDeal.merchantTIN || 'TIN Verified'}) · Status: <span className="font-bold text-[#FF6A00]">{selectedDeal.status}</span>
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

            {/* Modal Tabs Header */}
            <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs font-bold">
              {[
                { key: 'overview', label: 'Overview & Commercials' },
                { key: 'media', label: 'Media & Pitch' },
                { key: 'operations', label: 'Operations & Rules' },
                { key: 'governance', label: 'Governance & Audit' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setInspectTab(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    inspectTab === tab.key
                      ? 'bg-[#FF6A00] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: OVERVIEW & COMMERCIALS */}
            {inspectTab === 'overview' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Partner Reward</div>
                    <div className="text-sm font-black text-[#FF6A00] font-mono mt-0.5">
                      {selectedDeal.rewardDisplay ?? 'Terms not recorded'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Model: {selectedDeal.commissionModel || 'Fixed'} ({selectedDeal.payoutStructure || 'Escrow'})
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Secured Budget</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                      {selectedDeal.budgetRecorded ? `TZS ${selectedDeal.budgetTZS.toLocaleString()}` : 'Not recorded'}
                    </div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">
                      Spent: TZS {selectedDeal.spentTZS.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Active Partners</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedDeal.activePartners} Enrolled
                    </div>
                  </div>
                </div>

                {/* Multi-Currency & Settlement Breakdown */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Commercial Multi-Currency Ledger</span>
                    <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                      Authoritative: {selectedDeal.currency || 'TZS'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Original Currency</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {selectedDeal.originalCurrency || 'TZS'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Original Value</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {selectedDeal.originalDealValueMinor ? (Number(selectedDeal.originalDealValueMinor) / 100).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Reference TZS</span>
                      <span className="font-mono font-bold text-[#FF6A00]">
                        TZS {selectedDeal.budgetTZS.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Exchange Rate</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {selectedDeal.exchangeRateUsed ? `1 = ${selectedDeal.exchangeRateUsed}` : '1.0000'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description & Summary */}
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200">Public Commercial Summary:</div>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                    {selectedDeal.summary || selectedDeal.description || 'No detailed summary provided.'}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: MEDIA & PITCH */}
            {inspectTab === 'media' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-purple-600" />
                      <span>Promotional Video Pitch</span>
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

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cover Banner Asset</span>
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

                {/* Additional Media Gallery */}
                {selectedMediaList.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="font-bold text-slate-700 dark:text-slate-300">
                      Additional Media Gallery
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedMediaList.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Asset ${i + 1}`}
                          className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: OPERATIONS & RULES */}
            {inspectTab === 'operations' && (
              <div className="space-y-3 text-xs">
                {/* Requirements & Target Audience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Partner Requirements</div>
                    {selectedReqList.length > 0 ? (
                      <ul className="space-y-1">
                        {selectedReqList.map((r, i) => (
                          <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                            <span className="text-[#FF6A00] font-bold">✓</span> {r}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-slate-400 text-[11px]">Standard marketplace requirements apply.</div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Deliverables Expected</div>
                    {selectedDelivList.length > 0 ? (
                      <ul className="space-y-1">
                        {selectedDelivList.map((d, i) => (
                          <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span> {d}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-slate-400 text-[11px]">Commercial outcome deliverables.</div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200">Merchant Contact Details</div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Contact Person</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{selectedDeal.contactPersonName || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Email</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{selectedDeal.contactEmail || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Phone</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{selectedDeal.contactPhone || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: GOVERNANCE & AUDIT */}
            {inspectTab === 'governance' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Maker (Internal / Merchant)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {selectedDeal.makerOperator || 'Business User'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Checker (Compliance Dual-Control)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {selectedDeal.checkerNotes ? 'Compliance Checker Signed' : 'Pending Checker Sign-Off'}
                    </span>
                  </div>
                </div>

                {selectedDeal.termsHash && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 space-y-1">
                    <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center justify-between">
                      <span>Terms SHA-256 Tamper Detection Hash</span>
                      <span className="font-mono text-[9px] bg-blue-200 dark:bg-blue-900 px-1.5 py-0.5 rounded text-blue-950 dark:text-blue-100">
                        Protected
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-blue-800 dark:text-blue-300 break-all select-all">
                      {selectedDeal.termsHash}
                    </div>
                  </div>
                )}

                {selectedDeal.checkerNotes && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 space-y-1">
                    <div className="font-bold text-amber-900 dark:text-amber-200">Checker Notes & Audit Sign-Off:</div>
                    <div className="text-[11px] text-amber-800 dark:text-amber-300">{selectedDeal.checkerNotes}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  const deal = selectedDeal
                  setSelectedDeal(null)
                  setEditingDeal(deal)
                }}
                className="py-2 px-4 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Deal Details</span>
              </button>

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

      {/* EDIT DEAL MODAL */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Edit className="w-5 h-5 text-[#FF6A00]" />
              <span>Edit Opportunity Details</span>
            </h3>

            <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="font-bold block mb-1">Deal Title</label>
                <input
                  type="text"
                  value={editingDeal.title}
                  onChange={(e) => setEditingDeal({ ...editingDeal, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Commercial Summary</label>
                <textarea
                  value={editingDeal.summary || ''}
                  onChange={(e) => setEditingDeal({ ...editingDeal, summary: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Category</label>
                  <select
                    value={editingDeal.category}
                    onChange={(e) => setEditingDeal({ ...editingDeal, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Renewable Energy">Renewable Energy</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Technology">Technology</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Status</label>
                  <select
                    value={editingDeal.status}
                    onChange={(e) => setEditingDeal({ ...editingDeal, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-[#FF6A00]"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Visibility</label>
                  <select
                    value={editingDeal.visibility || 'PUBLIC'}
                    onChange={(e) => setEditingDeal({ ...editingDeal, visibility: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private / Selective</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Featured on Marketplace</label>
                  <select
                    value={editingDeal.featured ? 'true' : 'false'}
                    onChange={(e) => setEditingDeal({ ...editingDeal, featured: e.target.value === 'true' })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="false">Standard Listing</option>
                    <option value="true">Featured (Promoted)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={editingDeal.contactPersonName || ''}
                  onChange={(e) => setEditingDeal({ ...editingDeal, contactPersonName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={editingDeal.contactEmail || ''}
                  onChange={(e) => setEditingDeal({ ...editingDeal, contactEmail: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditingDeal(null)}
                className="py-2 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/deals', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        dealId: editingDeal.id,
                        title: editingDeal.title,
                        summary: editingDeal.summary,
                        status: editingDeal.status,
                        visibility: editingDeal.visibility,
                        featured: editingDeal.featured,
                        contactPersonName: editingDeal.contactPersonName,
                        contactPersonEmail: editingDeal.contactEmail,
                      }),
                    })
                    if (!res.ok) throw new Error('Update failed')
                    showToast('success', 'Opportunity Saved', 'The administrative changes have been persisted.')
                    setEditingDeal(null)
                    resource.retry()
                  } catch (err: any) {
                    showToast('error', 'Update Failed', err.message || 'Could not update deal.')
                  }
                }}
                className="py-2 px-5 bg-[#FF6A00] text-white font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#e05d00] cursor-pointer"
              >
                Save Changes
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
