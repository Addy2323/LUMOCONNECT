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
} from 'lucide-react'
import { BusinessOpportunityItem } from '../types'
import { useBusinessToast } from '../BusinessToast'

interface PartnerDiscoveryTabProps {
  opportunities: BusinessOpportunityItem[]
}

export function PartnerDiscoveryTab({ opportunities }: PartnerDiscoveryTabProps) {
  const { showToast } = useBusinessToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [partnerTypeFilter, setPartnerTypeFilter] = useState('ALL')
  const [regionFilter, setRegionFilter] = useState('ALL')
  const [inviteModalPartner, setInviteModalPartner] = useState<any | null>(null)
  const [selectedOppId, setSelectedOppId] = useState(opportunities[0]?.id || '')

  const discoveryCatalog: {
    id: string
    name: string
    type: string
    avatar: string
    region: string
    channels: string[]
    niche: string
    score: number
    completedDeals: number
    qualityRate: string
    rating: number
  }[] = []

  const filtered = discoveryCatalog.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.niche.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = partnerTypeFilter === 'ALL' || p.type === partnerTypeFilter
    const matchesRegion = regionFilter === 'ALL' || p.region.includes(regionFilter)
    return matchesSearch && matchesType && matchesRegion
  })

  const handleSendInvitation = () => {
    if (!inviteModalPartner || !selectedOppId) return
    const opp = opportunities.find((o) => o.id === selectedOppId)

    showToast(
      'success',
      'Invitation Dispatched',
      `Invitation to apply for "${opp?.title}" sent to ${inviteModalPartner.name}. The partner will be notified to review and consent.`
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
              Search & Invite
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover verified performance partners, creators, sales brokers, and distributors across Tanzania.
          </p>
        </div>
      </div>

      {/* Partner Consent Rule Callout */}
      <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong>Partner Consent Rule:</strong> Sending an invitation gives the Partner direct priority access to review your opportunity. Partners cannot be automatically enrolled without their affirmative consent.
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by partner name, expertise, or niche (e.g. Solar, Agri, Creator)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={partnerTypeFilter}
            onChange={(e) => setPartnerTypeFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Partner Types</option>
            <option value="CONTENT_CREATOR">Content Creator / Influencer</option>
            <option value="SALES_AGENT">Direct Field Sales Agent</option>
            <option value="COMMERCIAL_BROKER">Commercial B2B Broker</option>
            <option value="DISTRIBUTOR">Regional Distributor</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Regions</option>
            <option value="Dar es Salaam">Dar es Salaam & Pwani</option>
            <option value="Arusha">Arusha & Kilimanjaro</option>
            <option value="Mwanza">Mwanza & Lake Zone</option>
            <option value="Dodoma">Dodoma & Central</option>
            <option value="Mbeya">Mbeya & Southern Highlands</option>
          </select>
        </div>
      </div>

      {/* Discovery Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-dashed text-xs text-slate-500 space-y-2">
          <Users className="w-10 h-10 mx-auto text-slate-400 opacity-80" />
          <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Partners Listed in Directory Yet</div>
          <div className="max-w-md mx-auto">
            As verified sales agents, digital creators, and brokers subscribe to LUMO, their talent profiles will list here for direct deal invitations.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((prt) => (
            <div
              key={prt.id}
              className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0B132B] text-white font-black text-xs flex items-center justify-center">
                      {prt.avatar}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {prt.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {prt.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400">Score: <strong className="text-emerald-600 font-mono">{prt.score}/100</strong></div>
                    <div className="text-xs text-amber-500 font-black flex items-center justify-end gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{prt.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Industry Niche:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{prt.niche}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Region Coverage:</span>
                    <span className="text-slate-600 dark:text-slate-400">{prt.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conversion Quality:</span>
                    <span className="text-emerald-600 font-mono font-bold">{prt.qualityRate}</span>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {prt.channels.map((ch: string) => (
                    <span key={ch} className="text-[10px] bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t flex gap-2">
                <button
                  onClick={() => setInviteModalPartner(prt)}
                  className="flex-1 py-2 bg-[#FF6A00] hover:bg-[#EA580C] text-white rounded-xl font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-[#FF6A00]" />
              <span>Invite Partner: {inviteModalPartner.name}</span>
            </h3>

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
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
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
                onClick={handleSendInvitation}
                disabled={opportunities.length === 0}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] disabled:bg-slate-300 text-white font-extrabold rounded-xl text-xs cursor-pointer"
              >
                Send Formal Invitation
              </button>
              <button
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
