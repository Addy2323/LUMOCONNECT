'use client'

import React, { useState } from 'react'
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Shield,
  MessageSquare,
  UserCheck,
  UserX,
  Send,
  Lock,
  ExternalLink,
  ChevronRight,
  X,
  Filter,
} from 'lucide-react'
import { BusinessPartnerItem, PartnerApplicationStatus } from '../types'
import { useBusinessToast } from '../BusinessToast'

interface PartnersApplicationsTabProps {
  partners: BusinessPartnerItem[]
  setPartners: React.Dispatch<React.SetStateAction<BusinessPartnerItem[]>>
}

export function PartnersApplicationsTab({
  partners,
  setPartners,
}: PartnersApplicationsTabProps) {
  const { showToast } = useBusinessToast()

  const [activeSubTab, setActiveSubTab] = useState<PartnerApplicationStatus>('APPLIED')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPartner, setSelectedPartner] = useState<BusinessPartnerItem | null>(null)
  const [messageModal, setMessageModal] = useState<BusinessPartnerItem | null>(null)
  const [messageText, setMessageText] = useState('')

  const subTabs: { id: PartnerApplicationStatus; label: string; count: number }[] = [
    { id: 'APPLIED', label: 'Applications', count: partners.filter((p) => p.status === 'APPLIED').length },
    { id: 'SHORTLISTED', label: 'Shortlisted', count: partners.filter((p) => p.status === 'SHORTLISTED').length },
    { id: 'ACTIVE', label: 'Active Partners', count: partners.filter((p) => p.status === 'ACTIVE').length },
    { id: 'COMPLETED', label: 'Completed', count: partners.filter((p) => p.status === 'COMPLETED').length },
    { id: 'REJECTED', label: 'Rejected', count: partners.filter((p) => p.status === 'REJECTED').length },
    { id: 'BLOCKED', label: 'Blocked from Business', count: partners.filter((p) => p.status === 'BLOCKED').length },
    { id: 'INVITED', label: 'Invitations', count: partners.filter((p) => p.status === 'INVITED').length },
  ]

  const filteredPartners = partners.filter((p) => {
    const matchesStatus = p.status === activeSubTab
    const matchesSearch =
      p.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.partnerType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.appliedOpportunityTitle.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleUpdateStatus = (partnerId: string, nextStatus: PartnerApplicationStatus, reason?: string) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === partnerId ? { ...p, status: nextStatus } : p))
    )

    const partner = partners.find((p) => p.id === partnerId)
    showToast(
      'success',
      `Partner Status Updated: ${nextStatus}`,
      `${partner?.partnerName} moved to ${nextStatus.replace(/_/g, ' ')}.`
    )
    if (selectedPartner?.id === partnerId) {
      setSelectedPartner(null)
    }
  }

  const handleSendMessage = () => {
    if (!messageModal || !messageText.trim()) return
    showToast(
      'success',
      'Message Dispatched',
      `Direct deal message sent to ${messageModal.partnerName}.`
    )
    setMessageModal(null)
    setMessageText('')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Partners & Opportunity Applications</span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded-full">
              Read / Workflow
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review applicant profiles, accept verified sellers, coordinate deliverables, and manage brand exclusions.
          </p>
        </div>
      </div>

      {/* Privacy Guard Notice */}
      <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong>Partner Privacy Safeguard:</strong> You can view the Partner’s verified public profile, performance rating, conversion quality, and relevant distribution channels. Private NIDA identity documents and unrelated business activities remain confidential.
        </div>
      </div>

      {/* 7 Horizontal Sub-Tabs */}
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
          placeholder="Search partners by name, type, or opportunity..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        />
      </div>

      {/* Partners List Grid */}
      {filteredPartners.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500">
          <Users className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <div className="font-bold text-slate-700 dark:text-slate-300">No Partners in this Section</div>
          <div className="mt-0.5">When verified sales partners, brokers, or content creators apply or are invited to your deals, they will appear here.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPartners.map((prt) => (
          <div
            key={prt.id}
            className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0B132B] text-white font-black text-xs flex items-center justify-center">
                    {prt.avatar}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                      {prt.partnerName}
                    </h4>
                    <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border text-slate-500 font-bold">
                      {prt.partnerType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-emerald-600 font-mono">
                    Score: {prt.performanceScore}/100
                  </div>
                  <div className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5 justify-end">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span>{prt.businessRating} Rating</span>
                  </div>
                </div>
              </div>

              {/* Target Opportunity */}
              <div className="mt-3 p-2.5 bg-white dark:bg-slate-900 rounded-2xl border text-xs space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Applied Opportunity:</div>
                <div className="font-bold text-slate-900 dark:text-white leading-tight">
                  {prt.appliedOpportunityTitle}
                </div>
                {prt.applicationPitch && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 italic pt-1 border-t mt-1">
                    &quot;{prt.applicationPitch}&quot;
                  </p>
                )}
              </div>

              {/* Quality Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-2">
                <div>
                  <span className="text-slate-400 block">Quality</span>
                  <span className="font-bold text-slate-900 dark:text-white">{prt.conversionQuality}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Completed</span>
                  <span className="font-bold text-slate-900 dark:text-white">{prt.completedDeals} Deals</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Earnings</span>
                  <span className="font-mono font-bold text-[#FF6A00]">
                    TZS {prt.totalEarnedTZS.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5">
              {activeSubTab === 'APPLIED' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(prt.id, 'ACTIVE')}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Accept Partner
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(prt.id, 'SHORTLISTED')}
                    className="py-1.5 px-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-100"
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(prt.id, 'REJECTED')}
                    className="py-1.5 px-3 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100"
                  >
                    Decline
                  </button>
                </>
              )}

              {activeSubTab === 'SHORTLISTED' && (
                <button
                  onClick={() => handleUpdateStatus(prt.id, 'ACTIVE')}
                  className="flex-1 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Approve Application
                </button>
              )}

              {activeSubTab === 'ACTIVE' && (
                <>
                  <button
                    onClick={() => setMessageModal(prt)}
                    className="flex-1 py-1.5 bg-[#0B132B] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#FF6A00]" />
                    <span>Send Message</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(prt.id, 'BLOCKED')}
                    className="py-1.5 px-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold"
                    title="Block from this business only"
                  >
                    Block from Brand
                  </button>
                </>
              )}

              {activeSubTab === 'BLOCKED' && (
                <button
                  onClick={() => handleUpdateStatus(prt.id, 'ACTIVE')}
                  className="flex-1 py-1.5 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  Unblock Partner
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

      {/* DIRECT MESSAGE MODAL */}
      {messageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Message Partner: {messageModal.partnerName}
                </h3>
              </div>
              <button onClick={() => setMessageModal(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="text-slate-500">
                Opportunity: <strong>{messageModal.appliedOpportunityTitle}</strong>
              </div>

              <textarea
                rows={4}
                placeholder="Share promotional guidelines, marketing materials, or coordinate field logistics..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleSendMessage}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Direct Message</span>
              </button>
              <button onClick={() => setMessageModal(null)} className="py-2.5 px-4 border rounded-xl text-xs font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
