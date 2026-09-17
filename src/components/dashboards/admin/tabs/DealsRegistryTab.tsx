'use client'

import React, { useState } from 'react'
import {
  Search,
  X,
  Edit3,
  Check,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Plus,
  RefreshCw,
} from 'lucide-react'
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
  const [selectedDeal, setSelectedDeal] = useState<AdminDealItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    businessName: '',
    contactPersonName: '',
    type: '',
    category: '',
    subcategory: '',
    region: '',
    visibility: 'PUBLIC',
    originalCurrency: 'USD',
    dealValue: '',
    targetCustomer: '',
    commercialResultType: '',
    rewardType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    rewardPercentage: '',
    fixedRewardAmount: '',
    rewardDisplayLabel: '',
    rewardTrigger: '',
    summary: '',
    description: '',
  })

  const openDealReview = (deal: AdminDealItem, startInEditMode = false) => {
    setSelectedDeal(deal)
    setIsEditing(startInEditMode)

    const rawVal = deal.originalDealValue
      ? String(deal.originalDealValue)
      : deal.commercialValueMinor
      ? String(Number(deal.commercialValueMinor) / 100)
      : deal.budgetTZS
      ? String(deal.budgetTZS)
      : ''

    const targetCustomerStr =
      typeof deal.targetAudience === 'string'
        ? deal.targetAudience
        : Array.isArray(deal.targetAudience)
        ? deal.targetAudience.join(', ')
        : ''

    const isPct = deal.rewardPercentage !== undefined && deal.rewardPercentage !== null && deal.rewardPercentage > 0

    setEditForm({
      title: deal.title || '',
      businessName: deal.businessName || '',
      contactPersonName: deal.contactPersonName || deal.businessName || '',
      type: deal.type || '',
      category: deal.category || '',
      subcategory: deal.subcategory || '',
      region: deal.region || '',
      visibility: deal.visibility || 'PUBLIC',
      originalCurrency: deal.originalCurrency || 'USD',
      dealValue: rawVal && rawVal !== '0' ? rawVal : '',
      targetCustomer: targetCustomerStr,
      commercialResultType: deal.commercialResultType || '',
      rewardType: isPct ? 'PERCENTAGE' : 'FIXED',
      rewardPercentage: deal.rewardPercentage ? String(deal.rewardPercentage) : '',
      fixedRewardAmount: deal.rewardValueTZS ? String(deal.rewardValueTZS) : '',
      rewardDisplayLabel: deal.rewardDisplay || (deal.rewardPercentage ? `${deal.rewardPercentage}%` : ''),
      rewardTrigger:
        deal.rewardTrigger ||
        deal.successCondition ||
        '',
      summary:
        deal.summary || '',
      description:
        deal.description ||
        (Array.isArray(deal.requirements) ? deal.requirements.join('\n') : '') ||
        '',
    })
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: id, status: newStatus }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || result.message || 'Unable to update this deal.')
      resource.retry()
      if (selectedDeal && selectedDeal.id === id) {
        setSelectedDeal({ ...selectedDeal, status: newStatus as any })
      }
      showToast('success', 'Status Updated', `Deal status changed to ${newStatus}.`)
    } catch (error) {
      showToast('error', 'Update Failed', error instanceof Error ? error.message : 'Please retry.')
    }
  }

  const handleSaveDeal = async (publishImmediately = false) => {
    if (!selectedDeal) return
    setIsSaving(true)
    try {
      const rawVal = parseFloat(editForm.dealValue.replace(/,/g, '')) || 0
      const valMinor = BigInt(Math.round(rawVal * 100)).toString()
      const isPct = editForm.rewardType === 'PERCENTAGE'
      const pctVal = parseFloat(editForm.rewardPercentage) || 0
      const fixedVal = parseFloat(editForm.fixedRewardAmount.replace(/,/g, '')) || 0
      const fixedMinor = BigInt(Math.round(fixedVal * 100)).toString()

      const payload: any = {
        dealId: selectedDeal.id,
        title: editForm.title.trim(),
        contactPersonName: editForm.contactPersonName.trim(),
        type: editForm.type.trim(),
        subcategory: editForm.subcategory.trim(),
        region: editForm.region.trim(),
        visibility: editForm.visibility,
        originalCurrency: editForm.originalCurrency,
        originalDealValueMinor: valMinor,
        commercialValueMinor: valMinor,
        commercialResultType: editForm.commercialResultType.trim(),
        rewardTrigger: editForm.rewardTrigger.trim(),
        rewardModel: isPct ? 'PERCENTAGE' : 'FIXED_REWARD',
        rewardType: isPct ? 'PERCENTAGE' : 'FIXED',
        rewardPercentage: isPct ? pctVal : null,
        fixedRewardAmountMinor: isPct ? null : fixedMinor,
        rewardDisplayLabel: isPct ? `${pctVal}%` : `${editForm.originalCurrency} ${fixedVal.toLocaleString()}`,
        summary: editForm.summary.trim(),
        description: editForm.description.trim(),
        requirements: editForm.description.trim() ? [editForm.description.trim()] : [],
      }

      if (publishImmediately) {
        payload.status = 'PUBLISHED'
        payload.forcePublish = true
      }

      const res = await fetch('/api/admin/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to update deal')

      showToast(
        'success',
        publishImmediately ? 'Deal Published Live!' : 'Changes Saved',
        publishImmediately
          ? 'Deal details updated and published to the marketplace.'
          : 'All deal fields have been saved successfully.'
      )
      setIsEditing(false)
      resource.retry()

      // Update local modal data
      setSelectedDeal((prev) =>
        prev
          ? {
              ...prev,
              ...payload,
              status: publishImmediately ? 'PUBLISHED' : prev.status,
              originalDealValue: rawVal,
              rewardDisplay: payload.rewardDisplayLabel,
            }
          : null
      )
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Could not save deal.')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredDeals = deals.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.businessName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (!resource.data) return <ResourceStatus {...resource} />

  return (
    <div className="space-y-6">
      <ResourceStatus {...resource} />

      {/* Main Registry Container matching Prototype */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
        {/* Title Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Deals &amp; Opportunities Repository
          </h2>
          <span className="text-xs text-slate-400 font-medium">Master Repository</span>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="DRAFT">Draft</option>
              <option value="PAUSED">Paused</option>
              <option value="CLOSED">Closed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Table matching prototype screenshot */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-[11px] text-slate-400 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 px-2 font-bold tracking-wider">DEAL</th>
                <th className="pb-3 px-4 font-bold tracking-wider w-36">STATUS</th>
                <th className="pb-3 px-2 font-bold tracking-wider text-right w-48">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-slate-400 font-medium">
                    No deals match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{deal.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {deal.businessName} · {deal.category}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          deal.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                            : deal.status === 'UNDER_REVIEW'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                            : deal.status === 'PAUSED'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400'
                            : deal.status === 'CLOSED' || deal.status === 'ARCHIVED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                            : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {deal.status}
                      </span>
                    </td>

                    <td className="py-4 px-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDealReview(deal, false)}
                          className="border border-slate-700 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Full Review
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(deal.id, deal.status === 'CLOSED' ? 'PUBLISHED' : 'CLOSED')}
                          className="bg-[#801b2a] hover:bg-[#661521] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          {deal.status === 'CLOSED' ? 'Reopen' : 'Close'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL DEAL RECORD MODAL - Matching Prototype Screenshot & Adding Full Edit Capability */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Full Deal Record</h3>
                {isEditing && (
                  <span className="text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-md">
                    Admin Editing Mode
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>

                    {selectedDeal.status !== 'PUBLISHED' && (
                      <button
                        type="button"
                        onClick={() => handleSaveDeal(true)}
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Publish Deal</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedDeal(null)}
                      className="border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs px-4 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveDeal(false)}
                      disabled={isSaving}
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveDeal(true)}
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Publishing...' : 'Save & Publish'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Top Row: 2 Cards (Opportunity & Commercial Terms) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CARD 1: OPPORTUNITY */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900/40 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Opportunity</h4>

                {!isEditing ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex">
                      <span className="w-24 text-slate-400 font-medium shrink-0">ID</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        LUMO-OPP-{selectedDeal.id.slice(0, 6).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="w-24 text-slate-400 font-medium shrink-0">Owner</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {editForm.contactPersonName || selectedDeal.businessName || '-'}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="w-24 text-slate-400 font-medium shrink-0">Type</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{editForm.type || '-'}</span>
                    </div>

                    <div className="flex">
                      <span className="w-24 text-slate-400 font-medium shrink-0">Category</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {editForm.category || '-'}
                        {editForm.subcategory ? ` / ${editForm.subcategory}` : ''}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="w-24 text-slate-400 font-medium shrink-0">Location</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{editForm.region || '-'}</span>
                    </div>

                    <div className="flex">
                      <span className="w-24 text-slate-400 font-medium shrink-0">Visibility</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                        {editForm.visibility || '-'}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="w-24 text-slate-400 font-medium shrink-0">Status</span>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                        {selectedDeal.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Opportunity Edit Inputs */
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Deal Title</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Owner / Contact</label>
                        <input
                          type="text"
                          value={editForm.contactPersonName}
                          onChange={(e) => setEditForm({ ...editForm, contactPersonName: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Type</label>
                        <input
                          type="text"
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Category</label>
                        <input
                          type="text"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Subcategory</label>
                        <input
                          type="text"
                          value={editForm.subcategory}
                          onChange={(e) => setEditForm({ ...editForm, subcategory: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Location</label>
                        <input
                          type="text"
                          value={editForm.region}
                          onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Visibility</label>
                        <select
                          value={editForm.visibility}
                          onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        >
                          <option value="PUBLIC">PUBLIC</option>
                          <option value="PRIVATE">PRIVATE</option>
                          <option value="RESTRICTED">RESTRICTED</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 2: COMMERCIAL TERMS */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900/40 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Commercial Terms</h4>

                {!isEditing ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex">
                      <span className="w-28 text-slate-400 font-medium shrink-0">Value</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        {editForm.dealValue && !isNaN(parseFloat(editForm.dealValue.replace(/,/g, '')))
                          ? `${editForm.originalCurrency || 'USD'} ${parseFloat(
                              editForm.dealValue.replace(/,/g, '')
                            ).toLocaleString()}`
                          : '-'}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="w-28 text-slate-400 font-medium shrink-0">Target Customer</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {editForm.targetCustomer || '-'}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="w-28 text-slate-400 font-medium shrink-0">Result Type</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        {editForm.commercialResultType || '-'}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="w-28 text-slate-400 font-medium shrink-0">Reward</span>
                      <span className="font-bold text-[#FF6A00]">
                        {editForm.rewardType === 'PERCENTAGE'
                          ? (editForm.rewardPercentage ? `${editForm.rewardPercentage}%` : '-')
                          : (editForm.fixedRewardAmount && !isNaN(parseFloat(editForm.fixedRewardAmount.replace(/,/g, '')))
                              ? `${editForm.originalCurrency || 'USD'} ${parseFloat(
                                  editForm.fixedRewardAmount.replace(/,/g, '')
                                ).toLocaleString()}`
                              : '-')}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="w-28 text-slate-400 font-medium shrink-0">Trigger</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                        {editForm.rewardTrigger || '-'}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Commercial Terms Edit Inputs */
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Currency</label>
                        <select
                          value={editForm.originalCurrency}
                          onChange={(e) => setEditForm({ ...editForm, originalCurrency: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                        >
                          <option value="USD">USD</option>
                          <option value="TZS">TZS</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="KES">KES</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Commercial Value</label>
                        <input
                          type="text"
                          value={editForm.dealValue}
                          onChange={(e) => setEditForm({ ...editForm, dealValue: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                          placeholder="e.g. 2250000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Target Customer</label>
                      <input
                        type="text"
                        value={editForm.targetCustomer}
                        onChange={(e) => setEditForm({ ...editForm, targetCustomer: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Result Type</label>
                      <input
                        type="text"
                        value={editForm.commercialResultType}
                        onChange={(e) => setEditForm({ ...editForm, commercialResultType: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Reward Type</label>
                        <select
                          value={editForm.rewardType}
                          onChange={(e) =>
                            setEditForm({ ...editForm, rewardType: e.target.value as 'PERCENTAGE' | 'FIXED' })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        >
                          <option value="PERCENTAGE">Percentage (%)</option>
                          <option value="FIXED">Fixed Amount</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          {editForm.rewardType === 'PERCENTAGE' ? 'Reward Percentage (%)' : 'Fixed Reward Value'}
                        </label>
                        <input
                          type="text"
                          value={
                            editForm.rewardType === 'PERCENTAGE'
                              ? editForm.rewardPercentage
                              : editForm.fixedRewardAmount
                          }
                          onChange={(e) =>
                            setEditForm(
                              editForm.rewardType === 'PERCENTAGE'
                                ? { ...editForm, rewardPercentage: e.target.value }
                                : { ...editForm, fixedRewardAmount: e.target.value }
                            )
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                          placeholder={editForm.rewardType === 'PERCENTAGE' ? '5' : '50000'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Trigger Condition</label>
                      <input
                        type="text"
                        value={editForm.rewardTrigger}
                        onChange={(e) => setEditForm({ ...editForm, rewardTrigger: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: 1 Card (Descriptions) */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900/40 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Descriptions</h4>

              {!isEditing ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white mb-1">Public Summary</h5>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{editForm.summary || '-'}</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white mb-1">
                      Full Description &amp; Requirements
                    </h5>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {editForm.description || '-'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Descriptions Edit Inputs */
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Public Summary</label>
                    <textarea
                      rows={3}
                      value={editForm.summary}
                      onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed"
                      placeholder="Brief public overview of the opportunity..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Full Description &amp; Requirements
                    </label>
                    <textarea
                      rows={5}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed"
                      placeholder="Full scope, technical expectations, inspection standards, or partner deliverables..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
