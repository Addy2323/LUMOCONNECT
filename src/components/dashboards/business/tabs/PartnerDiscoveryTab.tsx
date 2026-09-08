'use client'

import React, { useState } from 'react'
import {
  UserSearch,
  Search,
  Star,
  CheckCircle2,
  Send,
  Filter,
  MapPin,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  Lock,
  X,
  Users,
  Phone,
  Mail,
  Tag,
  Handshake,
} from 'lucide-react'
import { BusinessOpportunityItem } from '../types'
import { VERIFIED_PARTNERS_DIRECTORY, VerifiedPartnerDirectoryItem } from '../mockData'
import { useBusinessToast } from '../BusinessToast'

interface PartnerDiscoveryTabProps {
  opportunities: BusinessOpportunityItem[]
}

export function PartnerDiscoveryTab({ opportunities }: PartnerDiscoveryTabProps) {
  const { showToast } = useBusinessToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [partnerTypeFilter, setPartnerTypeFilter] = useState('ALL')
  const [regionFilter, setRegionFilter] = useState('ALL')
  const [inviteModalPartner, setInviteModalPartner] = useState<VerifiedPartnerDirectoryItem | null>(null)
  const [selectedOppId, setSelectedOppId] = useState(opportunities[0]?.id || '')

  const allCategories = Array.from(new Set(VERIFIED_PARTNERS_DIRECTORY.map((p) => p.category)))

  const filtered = VERIFIED_PARTNERS_DIRECTORY.filter((p) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.companyName && p.companyName.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      p.contactPhone.toLowerCase().includes(q) ||
      p.contactEmail.toLowerCase().includes(q) ||
      p.skills.some((s) => s.toLowerCase().includes(q)) ||
      p.region.toLowerCase().includes(q)

    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter
    const matchesType = partnerTypeFilter === 'ALL' || p.type === partnerTypeFilter
    const matchesRegion = regionFilter === 'ALL' || p.region.includes(regionFilter)

    return matchesSearch && matchesCategory && matchesType && matchesRegion
  })

  const handleSendInvitation = () => {
    if (!inviteModalPartner || !selectedOppId) return
    const opp = opportunities.find((o) => o.id === selectedOppId)

    showToast(
      'success',
      'Invitation Dispatched',
      `Invitation to apply for "${opp?.title}" sent to ${inviteModalPartner.name}. The partner will be notified via SMS (${inviteModalPartner.contactPhone}) and Email (${inviteModalPartner.contactEmail}).`
    )
    setInviteModalPartner(null)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Verified Partner Talent Discovery</span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded-full">
              Verified Directory
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover verified performance partners, certified sales agents, B2B distributors, and creators with phone, email, and skills search across Tanzania.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, skills (e.g. Solar, TRA, Grain), phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:border-[#FF6A00]"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">📁 All Industry Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={partnerTypeFilter}
            onChange={(e) => setPartnerTypeFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Roles</option>
            <option value="Certified Sales Agent">Certified Sales Agent</option>
            <option value="B2B Regional Distributor">B2B Regional Distributor</option>
            <option value="Commercial Property Broker">Commercial Property Broker</option>
            <option value="Sourcing Aggregator">Sourcing Aggregator</option>
            <option value="Creator / Media Partner">Creator / Media Partner</option>
            <option value="Lead Generator">Lead Generator</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Regions</option>
            <option value="Dar es Salaam">Dar es Salaam</option>
            <option value="Mwanza">Mwanza</option>
            <option value="Arusha">Arusha</option>
            <option value="Shinyanga">Shinyanga</option>
            <option value="Zanzibar">Zanzibar</option>
          </select>
        </div>
      </div>

      {/* Discovery Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-dashed text-xs text-slate-500 space-y-2">
          <Users className="w-10 h-10 mx-auto text-slate-400 opacity-80" />
          <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Partners Found</div>
          <div className="max-w-md mx-auto">
            Try adjusting your search criteria, category, or skills keywords.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((prt) => (
            <div
              key={prt.id}
              className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#0B132B] text-white font-black text-sm flex items-center justify-center">
                      {prt.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {prt.name}
                        </h4>
                        {prt.verified && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                            BRELA
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {prt.category} · {prt.type}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-amber-500 font-black flex items-center justify-end gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{prt.rating.toFixed(1)}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{prt.completedDeals} deals</div>
                  </div>
                </div>

                {/* Direct Contact Phone & Email */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400 flex items-center gap-1 font-sans">
                      <Phone className="w-3 h-3 text-[#FF6A00]" />
                      <span>Phone:</span>
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200">{prt.contactPhone}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400 flex items-center gap-1 font-sans">
                      <Mail className="w-3 h-3 text-purple-600" />
                      <span>Email:</span>
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200">{prt.contactEmail}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-500" />
                      <span>Region:</span>
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{prt.region}</span>
                  </div>
                </div>

                {/* Skills Chips */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expertise & Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {prt.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t flex gap-2">
                <button
                  type="button"
                  onClick={() => setInviteModalPartner(prt)}
                  className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white rounded-xl font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Invite to Opportunity</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-[#FF6A00]" />
                <span>Invite: {inviteModalPartner.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setInviteModalPartner(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Contact Phone:</span>
                <span className="font-bold">{inviteModalPartner.contactPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Contact Email:</span>
                <span className="font-bold">{inviteModalPartner.contactEmail}</span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <label className="font-bold block text-slate-700 dark:text-slate-300">
                Select Target Commercial Opportunity
              </label>
              {opportunities.length === 0 ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-xl text-amber-800 dark:text-amber-200">
                  No active opportunities created yet. Create an opportunity first before sending invites.
                </div>
              ) : (
                <select
                  value={selectedOppId}
                  onChange={(e) => setSelectedOppId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                >
                  {opportunities.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title} (TZS {o.rewardValueTZS.toLocaleString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSendInvitation}
                disabled={opportunities.length === 0}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] disabled:bg-slate-300 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Send Formal Invitation
              </button>
              <button
                type="button"
                onClick={() => setInviteModalPartner(null)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
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
