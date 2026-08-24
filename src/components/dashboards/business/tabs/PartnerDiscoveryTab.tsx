'use client'

import React, { useState } from 'react'
import {
  UserSearch,
  Search,
  Filter,
  Star,
  ShieldCheck,
  Send,
  CheckCircle2,
  Lock,
  ChevronRight,
  X,
  Award,
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

  const discoveryCatalog = [
    {
      id: 'disc_1',
      name: 'Salma Kibiki',
      type: 'CONTENT_CREATOR',
      avatar: 'SK',
      region: 'Dar es Salaam & Pwani',
      channels: ['Instagram (85k)', 'TikTok TZ (140k)'],
      niche: 'Clean Energy & Smart Home Tech',
      score: 97,
      completedDeals: 19,
      qualityRate: '99.4%',
      rating: 4.9,
    },
    {
      id: 'disc_2',
      name: 'Twiga Agri & Solar Brokerage',
      type: 'COMMERCIAL_BROKER',
      avatar: 'TA',
      region: 'Arusha & Kilimanjaro',
      channels: ['Farmer Co-operatives', 'Coffee Estates'],
      niche: 'Solar Irrigation & Agri-Pumps',
      score: 95,
      completedDeals: 12,
      qualityRate: '98.8%',
      rating: 5.0,
    },
    {
      id: 'disc_3',
      name: 'Rashid Bakari',
      type: 'SALES_AGENT',
      avatar: 'RB',
      region: 'Mwanza & Lake Zone',
      channels: ['Direct Field Agents', 'Local Markets'],
      niche: 'Off-grid SHS & Appliances',
      score: 92,
      completedDeals: 24,
      qualityRate: '97.2%',
      rating: 4.8,
    },
    {
      id: 'disc_4',
      name: 'Coastal Tech Distributors Ltd',
      type: 'DISTRIBUTOR',
      avatar: 'CT',
      region: 'Coastal & Dar es Salaam',
      channels: ['Hardware Wholesalers', 'Electrical Retailers'],
      niche: 'B2B Equipment & Inverters',
      score: 98,
      completedDeals: 7,
      qualityRate: '100%',
      rating: 5.0,
    },
  ]

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

      {/* Consent Rule Banner */}
      <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong>Partner Consent Rule:</strong> Sending an invitation gives the Partner direct priority access to review your opportunity. Partners cannot be automatically enrolled without their affirmative consent.
        </div>
      </div>

      {/* Filter Bar */}
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
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="ALL">All Partner Types</option>
            <option value="CONTENT_CREATOR">Content Creators & Influencers</option>
            <option value="SALES_AGENT">Direct Field Sales Agents</option>
            <option value="COMMERCIAL_BROKER">Commercial B2B Brokers</option>
            <option value="DISTRIBUTOR">Wholesale Distributors</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="ALL">All Regions</option>
            <option value="Dar es Salaam">Dar es Salaam & Pwani</option>
            <option value="Arusha">Arusha & Kilimanjaro</option>
            <option value="Mwanza">Mwanza & Lake Zone</option>
          </select>
        </div>
      </div>

      {/* Discovery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((prt) => (
          <div
            key={prt.id}
            className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#0B132B] text-white font-black text-sm flex items-center justify-center">
                    {prt.avatar}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {prt.name}
                    </h4>
                    <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border text-slate-500 font-bold">
                      {prt.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-emerald-600 font-mono">
                    Score: {prt.score}/100
                  </div>
                  <div className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5 justify-end">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span>{prt.rating} / 5.0</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Industry Niche:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{prt.niche}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Region Coverage:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{prt.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Conversion Quality:</span>
                  <span className="font-mono font-bold text-emerald-600">{prt.qualityRate}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {prt.channels.map((ch: string) => (
                  <span key={ch} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium text-[10px]">
                    {ch}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setInviteModalPartner(prt)}
                className="w-full py-2 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invite to Opportunity</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* INVITATION MODAL */}
      {inviteModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Invite {inviteModalPartner.name}
                </h3>
              </div>
              <button onClick={() => setInviteModalPartner(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500">
                Select which live opportunity you would like to invite this partner to participate in:
              </p>

              <div>
                <label className="font-bold block mb-1">Target Commercial Opportunity</label>
                <select
                  value={selectedOppId}
                  onChange={(e) => setSelectedOppId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                >
                  {opportunities.map((opp) => (
                    <option key={opp.id} value={opp.id}>
                      {opp.title} (TZS {opp.rewardValueTZS.toLocaleString()} / Result)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleSendInvitation}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Send Formal Invitation</span>
              </button>
              <button onClick={() => setInviteModalPartner(null)} className="py-2.5 px-4 border rounded-xl text-xs font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
