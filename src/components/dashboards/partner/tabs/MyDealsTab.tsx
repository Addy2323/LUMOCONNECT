'use client'

import React, { useState } from 'react'
import {
  Briefcase,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  QrCode,
  Download,
  Share2,
  Lock,
  Layers,
  LogOut,
  Send,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { JoinedDealItem, JoinedDealStatus } from '../types'
import { usePartnerToast } from '../PartnerToast'

interface MyDealsTabProps {
  joinedDeals: JoinedDealItem[]
  setJoinedDeals: React.Dispatch<React.SetStateAction<JoinedDealItem[]>>
  onOpenSubmitLeadModal: (deal: JoinedDealItem) => void
}

export function MyDealsTab({
  joinedDeals,
  setJoinedDeals,
  onOpenSubmitLeadModal,
}: MyDealsTabProps) {
  const { showToast } = usePartnerToast()

  const [activeSubTab, setActiveSubTab] = useState<JoinedDealStatus>('ACTIVE')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDealTools, setSelectedDealTools] = useState<JoinedDealItem | null>(null)
  const [showQrModal, setShowQrModal] = useState<JoinedDealItem | null>(null)

  const subTabs: { id: JoinedDealStatus; label: string; count: number }[] = [
    { id: 'ACTIVE', label: 'Active Deals', count: joinedDeals.filter((d) => d.status === 'ACTIVE').length },
    { id: 'AWAITING_APPROVAL', label: 'Awaiting Approval', count: joinedDeals.filter((d) => d.status === 'AWAITING_APPROVAL').length },
    { id: 'APPLIED', label: 'Applied', count: joinedDeals.filter((d) => d.status === 'APPLIED').length },
    { id: 'MILESTONES', label: 'Milestones', count: joinedDeals.filter((d) => d.status === 'MILESTONES').length },
    { id: 'COMPLETED', label: 'Completed', count: joinedDeals.filter((d) => d.status === 'COMPLETED').length },
    { id: 'REJECTED', label: 'Rejected', count: joinedDeals.filter((d) => d.status === 'REJECTED').length },
    { id: 'EXITED', label: 'Exited', count: joinedDeals.filter((d) => d.status === 'EXITED').length },
    { id: 'CANCELLED', label: 'Cancelled', count: joinedDeals.filter((d) => d.status === 'CANCELLED').length },
  ]

  const filteredDeals = joinedDeals.filter((d) => {
    const matchesStatus = d.status === activeSubTab
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.businessName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    showToast('success', 'Copied to Clipboard', `${label}: ${text}`)
  }

  const handleExitDeal = (deal: JoinedDealItem) => {
    setJoinedDeals((prev) =>
      prev.map((d) => (d.id === deal.id ? { ...d, status: 'EXITED' } : d))
    )
    setSelectedDealTools(null)
    showToast(
      'info',
      'Deal Exited',
      `You have exited "${deal.title}". All previously verified earnings remain safeguarded and payable.`
    )
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>My Deals & Active Commercial Engagements</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-2 py-0.5 rounded-full">
              Read / Workflow
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your enrolled deals, access promotional toolkits, submit customer referrals, and track milestones.
          </p>
        </div>
      </div>

      {/* Immutability Notice */}
      <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong>Deal Terms Safeguard:</strong> Commercial reward values, attribution windows, and qualification terms are locked by the verified Business. Partners cannot edit Deal terms, but may exit where permitted while retaining all earned rewards.
        </div>
      </div>

      {/* 8 Horizontal Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSubTab === tab.id
                ? 'bg-[#0B132B] text-white shadow-2xs font-extrabold'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                activeSubTab === tab.id ? 'bg-[#FF6A00] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search enrolled deals by title or business..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        />
      </div>

      {/* Deals Cards List */}
      <div className="space-y-4">
        {filteredDeals.map((deal) => (
          <div
            key={deal.id}
            className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-orange-100 text-[#FF6A00] rounded-full">
                    {deal.category}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      deal.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : deal.status === 'AWAITING_APPROVAL'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {deal.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                  {deal.title}
                </h3>
                <p className="text-xs text-slate-500">Business: <strong>{deal.businessName}</strong> · Enrolled: {deal.joinedDate}</p>
              </div>

              <div className="text-right sm:shrink-0 bg-white dark:bg-slate-900 p-3 rounded-2xl border">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Reward Value</div>
                <div className="text-base font-black text-[#FF6A00] font-mono">
                  {deal.rewardDisplay}
                </div>
                <div className="text-[10px] text-emerald-600 font-bold">
                  Earned: TZS {deal.earningsEarnedTZS.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Quick Tracking Strip */}
            {deal.status === 'ACTIVE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-900 p-3 rounded-2xl border">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Your Tracking URL</span>
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-[11px]">
                    <span className="truncate">{deal.trackingLink}</span>
                    <button
                      onClick={() => handleCopy(deal.trackingLink, 'Tracking Link')}
                      className="text-[#FF6A00] hover:underline shrink-0 font-bold"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Promo Code & QR</span>
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-[11px]">
                    <span>Code: <strong>{deal.promoCode}</strong></span>
                    <button
                      onClick={() => setShowQrModal(deal)}
                      className="text-blue-600 hover:underline shrink-0 font-bold flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View QR</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics & Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4 text-xs">
                <span>Leads: <strong className="text-slate-900 dark:text-white font-mono">{deal.activeLeadsCount}</strong></span>
                <span>Conversions: <strong className="text-emerald-600 font-mono">{deal.verifiedConversionsCount}</strong></span>
                {deal.milestoneProgressPercent > 0 && (
                  <span>Milestone: <strong className="text-purple-600 font-mono">{deal.milestoneProgressPercent}%</strong></span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {deal.status === 'ACTIVE' && (
                  <button
                    onClick={() => onOpenSubmitLeadModal(deal)}
                    className="py-1.5 px-3.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Lead</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedDealTools(deal)}
                  className="py-1.5 px-3 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold hover:bg-slate-100 flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Deal Tools & Requirements</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DEAL TOOLS & DELIVERABLES DRAWER MODAL */}
      {selectedDealTools && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Deal Tools & Guidelines
                </h3>
                <div className="text-[11px] text-slate-500">{selectedDealTools.title}</div>
              </div>
              <button onClick={() => setSelectedDealTools(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white">Deliverables & Evidence Required:</div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {selectedDealTools.deliverablesSummary}
                </p>
                <div className="text-[10px] text-slate-400">Evidence: {selectedDealTools.evidenceRequired}</div>
              </div>

              <div>
                <span className="font-bold block mb-1">Your Unique Referral ID</span>
                <div className="p-2.5 bg-white dark:bg-slate-900 border rounded-xl font-mono text-slate-900 dark:text-white font-bold flex justify-between items-center">
                  <span>{selectedDealTools.referralId}</span>
                  <button
                    onClick={() => handleCopy(selectedDealTools.referralId, 'Referral ID')}
                    className="text-[#FF6A00] font-bold text-xs"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <span className="font-bold block mb-1">Approved Marketing Collateral</span>
                <button
                  onClick={() => showToast('success', 'Assets Downloaded', 'Product brochures and promotional flyers ZIP downloaded.')}
                  className="w-full py-2.5 border rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Download className="w-4 h-4 text-[#FF6A00]" />
                  <span>Download Partner Media Kit & Specs (ZIP)</span>
                </button>
              </div>

              {selectedDealTools.canExit && (
                <div className="pt-3 border-t">
                  <button
                    onClick={() => handleExitDeal(selectedDealTools)}
                    className="w-full py-2 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 flex items-center justify-center gap-1.5 text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Voluntary Exit from Deal</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xs w-full p-5 shadow-2xl text-center space-y-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              Dynamic Referral QR Code
            </h3>
            <img
              src={showQrModal.qrCodeUrl}
              alt="QR Code"
              className="w-48 h-48 mx-auto rounded-2xl border p-2 bg-white"
            />
            <p className="text-[11px] text-slate-500">
              Promo Code: <strong>{showQrModal.promoCode}</strong>
            </p>
            <button
              onClick={() => setShowQrModal(null)}
              className="w-full py-2 bg-[#0B132B] text-white font-bold rounded-xl text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
