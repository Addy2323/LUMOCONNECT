'use client'

import React, { useState } from 'react'
import {
  Megaphone,
  Plus,
  Eye,
  Pause,
  Play,
  Archive,
  Image,
  Calendar,
  Smartphone,
  Laptop,
  X,
  Sparkles,
  Link,
  Users,
} from 'lucide-react'
import { useAdminToast } from '../AdminToast'

export function ContentPromotionsTab() {
  const { showToast } = useAdminToast()
  const [promos, setPromos] = useState([
    {
      id: 'promo_1',
      title: 'Morogoro Clean Energy & Solar Acquisition Drive',
      location: 'HOMEPAGE_HERO_BANNER',
      audience: 'ALL_PARTNERS',
      status: 'PUBLISHED',
      impressions: 48900,
      clicks: 3410,
      ctr: '6.9%',
      ctaText: 'Explore Solar Opportunities',
      ctaUrl: '/deals/kijani-solar-home-kit',
    },
    {
      id: 'promo_2',
      title: 'TRA 5% Commission Tax Compliance Notice 2026',
      location: 'PORTAL_ANNOUNCEMENT',
      audience: 'VERIFIED_PARTNERS',
      status: 'PUBLISHED',
      impressions: 12400,
      clicks: 890,
      ctr: '7.1%',
      ctaText: 'View Tax Guidelines',
      ctaUrl: '/tax-rules',
    },
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [previewMode, setPreviewMode] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP')
  const [newPromo, setNewPromo] = useState({
    title: '',
    location: 'HOMEPAGE_HERO_BANNER' as 'HOMEPAGE_HERO_BANNER' | 'PORTAL_ANNOUNCEMENT' | 'DEAL_CARD_SPONSOR',
    audience: 'ALL_PARTNERS' as 'ALL_PARTNERS' | 'VERIFIED_PARTNERS' | 'BUSINESS_OWNERS',
    ctaText: 'Learn More & Apply',
    ctaUrl: '/deals',
    startDate: '2026-08-25',
    endDate: '2026-09-25',
    bannerTag: 'Featured Opportunity',
  })

  const handleToggleStatus = (id: string) => {
    setPromos((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const next = p.status === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED'
          showToast(
            next === 'PUBLISHED' ? 'success' : 'info',
            `Promotion Banner ${next === 'PUBLISHED' ? 'Resumed' : 'Paused'}`,
            `Campaign "${p.title}" status changed to ${next}.`
          )
          return { ...p, status: next }
        }
        return p
      })
    )
  }

  const handleArchivePromo = (id: string) => {
    setPromos((prev) => prev.filter((p) => p.id !== id))
    showToast('info', 'Promotion Archived', 'Campaign archived and removed from active displays.')
  }

  const handleSavePromo = () => {
    if (!newPromo.title.trim()) {
      showToast('error', 'Validation Error', 'Please provide a title for the promotional campaign.')
      return
    }

    const created = {
      id: `promo_${Date.now()}`,
      title: newPromo.title,
      location: newPromo.location,
      audience: newPromo.audience,
      status: 'PUBLISHED',
      impressions: 0,
      clicks: 0,
      ctr: '0.0%',
      ctaText: newPromo.ctaText,
      ctaUrl: newPromo.ctaUrl,
    }

    setPromos([created, ...promos])
    setShowCreateModal(false)
    setNewPromo({
      title: '',
      location: 'HOMEPAGE_HERO_BANNER',
      audience: 'ALL_PARTNERS',
      ctaText: 'Learn More & Apply',
      ctaUrl: '/deals',
      startDate: '2026-08-25',
      endDate: '2026-09-25',
      bannerTag: 'Featured Opportunity',
    })

    showToast('success', 'Promotion Published', `"${created.title}" is now live across targeted placements.`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Content, Banners & Featured Promotions</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-2 py-0.5 rounded-full">
              CRUD / Publish / Archive
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage homepage promotional banners, featured deal carousels, platform announcements, and campaign scheduling.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promotion Banner</span>
        </button>
      </div>

      {/* Promos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promos.map((p) => (
          <div
            key={p.id}
            className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border text-slate-600 dark:text-slate-300">
                    {p.location.replace(/_/g, ' ')}
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1.5 leading-tight">
                    {p.title}
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    p.status === 'PUBLISHED'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {p.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs mt-3">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">Impressions</div>
                  <div className="font-black text-slate-900 dark:text-white font-mono">{p.impressions.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">Clicks</div>
                  <div className="font-black text-[#FF6A00] font-mono">{p.clicks.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">CTR</div>
                  <div className="font-black text-emerald-600 font-mono">{p.ctr}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/80 dark:border-slate-700">
              <span className="text-slate-500 font-medium">Audience: {p.audience.replace(/_/g, ' ')}</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleToggleStatus(p.id)}
                  className="p-1.5 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  title={p.status === 'PUBLISHED' ? 'Pause Campaign' : 'Resume Campaign'}
                >
                  {p.status === 'PUBLISHED' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => handleArchivePromo(p.id)}
                  className="p-1.5 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Archive Campaign"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE PROMOTION BANNER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-[#FF6A00] flex items-center justify-center font-black">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Create Promotional Banner Campaign
                  </h3>
                  <div className="text-[11px] text-slate-500">Configure target audience, copy, placement & schedule</div>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="font-bold block mb-1">Banner Campaign Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Special Q3 Solar Deal Acquisition Reward Boost"
                    value={newPromo.title}
                    onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Placement Location</label>
                  <select
                    value={newPromo.location}
                    onChange={(e) => setNewPromo({ ...newPromo, location: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="HOMEPAGE_HERO_BANNER">Homepage Hero Banner</option>
                    <option value="PORTAL_ANNOUNCEMENT">Partner Portal Top Announcement</option>
                    <option value="DEAL_CARD_SPONSOR">Marketplace Sponsored Carousel</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Target Audience Segment</label>
                  <select
                    value={newPromo.audience}
                    onChange={(e) => setNewPromo({ ...newPromo, audience: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="ALL_PARTNERS">All Registered Partners</option>
                    <option value="VERIFIED_PARTNERS">Verified & Subscribed Partners Only</option>
                    <option value="BUSINESS_OWNERS">Business Publishers</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={newPromo.ctaText}
                      onChange={(e) => setNewPromo({ ...newPromo, ctaText: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">CTA Target URL</label>
                    <input
                      type="text"
                      value={newPromo.ctaUrl}
                      onChange={(e) => setNewPromo({ ...newPromo, ctaUrl: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-500 uppercase text-[10px]">Live Placement Preview</span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                    <button
                      onClick={() => setPreviewMode('DESKTOP')}
                      className={`p-1 rounded ${previewMode === 'DESKTOP' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-400'}`}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewMode('MOBILE')}
                      className={`p-1 rounded ${previewMode === 'MOBILE' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-400'}`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl bg-gradient-to-r from-[#0B132B] to-[#1C2541] text-white space-y-2 border border-slate-700 shadow-md ${
                  previewMode === 'MOBILE' ? 'max-w-[240px] mx-auto' : ''
                }`}>
                  <span className="text-[9px] bg-[#FF6A00] font-black uppercase px-2 py-0.5 rounded-full">
                    {newPromo.bannerTag}
                  </span>
                  <h4 className="font-black text-xs leading-snug">
                    {newPromo.title || 'Your Promotion Headline Goes Here'}
                  </h4>
                  <p className="text-[10px] text-slate-300">
                    Targeting: {newPromo.audience.replace(/_/g, ' ')}
                  </p>
                  <button className="py-1 px-3 bg-white text-slate-900 font-extrabold text-[10px] rounded-lg">
                    {newPromo.ctaText}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleSavePromo}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Publish Campaign Now
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
