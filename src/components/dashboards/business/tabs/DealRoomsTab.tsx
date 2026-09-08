'use client'

import React, { useState, useEffect } from 'react'
import {
  MessageSquareCode,
  FileCheck,
  CheckCircle2,
  Clock,
  Send,
  Upload,
  AlertTriangle,
  Lock,
  DollarSign,
  FileText,
  Shield,
  Layers,
  ArrowRight,
  Handshake,
  Plus,
  Search,
  Filter,
  X,
  ExternalLink,
  ChevronRight,
  Briefcase,
  UserCheck,
  Sparkles,
  Download,
  Phone,
  Mail,
  Tag,
  Star,
  Check,
} from 'lucide-react'
import { DealRoomSession } from '../types'
import { VERIFIED_PARTNERS_DIRECTORY, VerifiedPartnerDirectoryItem } from '../mockData'
import { useBusinessToast } from '../BusinessToast'

const DEFAULT_BUSINESS_DEAL_ROOMS: DealRoomSession[] = [
  {
    id: 'dr_auto_1',
    opportunityTitle: 'Toyota Land Cruiser V8 High-Ticket Acquisition',
    partnerName: 'Kassim Auto Brokers (+255 754 889 120)',
    partnerType: 'Certified Sales Agent',
    stage: 'TERMS_AGREED',
    currentProposedRewardTZS: 2000000,
    deliverablesSummary: 'Signed vehicle purchase agreement, verified buyer TIN/NIDA, and official TRA registration transfer.',
    contractSigned: true,
    messagesCount: 8,
    lastUpdated: '10 mins ago',
  },
  {
    id: 'dr_solar_2',
    opportunityTitle: 'Solar Home Grid Regional Sourcing & Distribution',
    partnerName: 'Mwanza Renewable Energy Ltd (+255 784 112 334)',
    partnerType: 'B2B Regional Distributor',
    stage: 'DIGITAL_SIGNATURE',
    currentProposedRewardTZS: 3000000,
    deliverablesSummary: 'Exclusive Lake Zone distribution agreement, BRELA corporate credentials, and minimum 500-unit initial stocking order.',
    contractSigned: false,
    messagesCount: 14,
    lastUpdated: '1 hour ago',
  },
  {
    id: 'dr_re_3',
    opportunityTitle: 'Prime Commercial Logistics Warehouse (Mbagala)',
    partnerName: 'Victoria Commercial Realtors (+255 713 908 765)',
    partnerType: 'Commercial Property Broker',
    stage: 'OFFER_SUBMITTED',
    currentProposedRewardTZS: 2900000,
    deliverablesSummary: 'Signed 3-year commercial lease contract with tenant upfront guarantee and first 6-month rent deposit.',
    contractSigned: false,
    messagesCount: 4,
    lastUpdated: '3 hours ago',
  },
  {
    id: 'dr_agri_4',
    opportunityTitle: '10 Metric Tons White Maize Batch Off-Take',
    partnerName: 'Kahama Agritech Aggregators (+255 767 445 678)',
    partnerType: 'Sourcing Aggregator',
    stage: 'MILESTONE_PROGRESS',
    currentProposedRewardTZS: 750000,
    deliverablesSummary: 'Quality moisture testing certificate (<13.5%), warehouse delivery sign-off, and grain transport waybill.',
    contractSigned: true,
    messagesCount: 19,
    lastUpdated: 'Yesterday',
  },
]

export function DealRoomsTab() {
  const { showToast } = useBusinessToast()

  const [rooms, setRooms] = useState<DealRoomSession[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lumo_business_deal_rooms')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch (e) {
        console.warn('Failed to load deal rooms', e)
      }
    }
    return DEFAULT_BUSINESS_DEAL_ROOMS
  })

  const [selectedRoom, setSelectedRoom] = useState<DealRoomSession | null>(rooms[0] || null)
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NEGOTIATING' | 'AGREED' | 'MILESTONES'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false)

  // Partner Directory Search in Modal
  const [partnerDirectorySearch, setPartnerDirectorySearch] = useState('')
  const [partnerCategoryFilter, setPartnerCategoryFilter] = useState('ALL')
  const [partnerSkillFilter, setPartnerSkillFilter] = useState('ALL')
  const [partnerInputMode, setPartnerInputMode] = useState<'DIRECTORY' | 'CUSTOM'>('DIRECTORY')
  const [selectedDirectoryPartner, setSelectedDirectoryPartner] = useState<VerifiedPartnerDirectoryItem | null>(null)

  // Chat & Negotiation state per room
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<{ sender: string; time: string; text: string; isBusiness: boolean }[]>([
    {
      sender: 'Partner Deal Specialist',
      time: '10:15 AM',
      text: 'Habari! We have reviewed the commercial terms and are ready to finalize the buyer paperwork once countersigned.',
      isBusiness: false,
    },
    {
      sender: 'You (Business)',
      time: '10:42 AM',
      text: 'Asante sana. Funds are secured through CRDB Bank Safeguard. Please review the deliverables checklist below.',
      isBusiness: true,
    },
  ])

  // New Deal Room Form State
  const [newDealForm, setNewDealForm] = useState({
    opportunityTitle: 'Automotive & Vehicle Finder Bounty',
    partnerName: '',
    partnerContactPhone: '',
    partnerContactEmail: '',
    partnerType: 'Certified Sales Agent',
    partnerCategory: 'Automotive & Transportation',
    rewardAmountTZS: 2000000,
    deliverablesSummary: 'Buyer purchase contract signed, TRA registration transfer completed, and proof of payment submitted.',
    initialMessage: 'Welcome to our private B2B Deal Room. We are pleased to initiate this collaboration under LUMO terms — all funds are secured.',
  })

  // Save rooms to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lumo_business_deal_rooms', JSON.stringify(rooms))
      } catch (e) {
        console.warn('Failed to save deal rooms', e)
      }
    }
  }, [rooms])

  // Filter verified partners directory
  const filteredDirectoryPartners = VERIFIED_PARTNERS_DIRECTORY.filter((p) => {
    const q = partnerDirectorySearch.toLowerCase().trim()
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.companyName && p.companyName.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      p.contactPhone.toLowerCase().includes(q) ||
      p.contactEmail.toLowerCase().includes(q) ||
      p.skills.some((s) => s.toLowerCase().includes(q)) ||
      p.region.toLowerCase().includes(q)

    const matchesCategory = partnerCategoryFilter === 'ALL' || p.category === partnerCategoryFilter
    const matchesSkill = partnerSkillFilter === 'ALL' || p.skills.some((s) => s.toLowerCase().includes(partnerSkillFilter.toLowerCase()))

    return matchesSearch && matchesCategory && matchesSkill
  })

  // All unique skills from directory
  const allUniqueSkills = Array.from(new Set(VERIFIED_PARTNERS_DIRECTORY.flatMap((p) => p.skills)))
  const allUniqueCategories = Array.from(new Set(VERIFIED_PARTNERS_DIRECTORY.map((p) => p.category)))

  // Handle partner selection from directory
  const handleSelectDirectoryPartner = (p: VerifiedPartnerDirectoryItem) => {
    setSelectedDirectoryPartner(p)
    setNewDealForm((prev) => ({
      ...prev,
      partnerName: p.name,
      partnerContactPhone: p.contactPhone,
      partnerContactEmail: p.contactEmail,
      partnerType: p.type,
      partnerCategory: p.category,
      opportunityTitle: `${p.category} Partnership Deal`,
      deliverablesSummary: `Verified ${p.skills.slice(0, 2).join(' & ')} execution, compliance documentation, and signed completion sign-off.`,
    }))
    showToast('info', 'Partner Selected', `Loaded profile for ${p.name}`)
  }

  // Handle Send Chat
  const handleSendChat = () => {
    if (!chatMessage.trim() || !selectedRoom) return
    const newMsg = {
      sender: 'You (Business)',
      time: 'Just now',
      text: chatMessage.trim(),
      isBusiness: true,
    }
    setChatHistory((prev) => [...prev, newMsg])
    setChatMessage('')
    showToast('success', 'Message Dispatched', `Transmitted to ${selectedRoom.partnerName}.`)
  }

  // Handle Countersign
  const handleSignAgreement = () => {
    if (!selectedRoom) return
    const updated = rooms.map((r) =>
      r.id === selectedRoom.id ? { ...r, contractSigned: true, stage: 'TERMS_AGREED' as const } : r
    )
    setRooms(updated)
    setSelectedRoom({ ...selectedRoom, contractSigned: true, stage: 'TERMS_AGREED' })
    showToast('success', 'Agreement Countersigned', 'Digital MOU signed and funds are secured.')
  }

  // Handle Create New Deal Room
  const handleCreateDealRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDealForm.partnerName.trim()) {
      showToast('error', 'Missing Partner Name', 'Please select a partner from the directory or enter partner details.')
      return
    }

    const contactStr = [newDealForm.partnerContactPhone, newDealForm.partnerContactEmail].filter(Boolean).join(' · ')

    const newRoom: DealRoomSession = {
      id: `dr_${Date.now()}`,
      opportunityTitle: newDealForm.opportunityTitle,
      partnerName: `${newDealForm.partnerName}${contactStr ? ` (${contactStr})` : ''}`,
      partnerType: newDealForm.partnerType,
      stage: 'OFFER_SUBMITTED',
      currentProposedRewardTZS: Number(newDealForm.rewardAmountTZS) || 2000000,
      deliverablesSummary: newDealForm.deliverablesSummary,
      contractSigned: false,
      messagesCount: 1,
      lastUpdated: 'Just now',
    }

    const updatedRooms = [newRoom, ...rooms]
    setRooms(updatedRooms)
    setSelectedRoom(newRoom)
    setIsNewDealModalOpen(false)

    // Reset Chat
    setChatHistory([
      {
        sender: 'You (Business)',
        time: 'Just now',
        text: newDealForm.initialMessage,
        isBusiness: true,
      },
    ])

    showToast('success', 'Deal Room Initialized', `Direct collaboration started with ${newRoom.partnerName}`)
  }

  // Filter Rooms
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.opportunityTitle.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (activeFilter === 'NEGOTIATING') return r.stage === 'OFFER_SUBMITTED' || r.stage === 'COUNTER_OFFER'
    if (activeFilter === 'AGREED') return r.stage === 'TERMS_AGREED' || r.stage === 'DIGITAL_SIGNATURE'
    if (activeFilter === 'MILESTONES') return r.stage === 'MILESTONE_PROGRESS' || r.stage === 'COMPLETED'
    return true
  })

  return (
    <div className="space-y-5">
      {/* Header with Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Deal Rooms & Commercial Negotiations
            </h2>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
              B2B Secured Collaboration
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Dedicated private rooms for direct contract negotiations, B2B distributor onboarding, and milestone settlements with secured funds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewDealModalOpen(true)}
            className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Deal Room</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'ALL', label: 'All Deals' },
              { id: 'NEGOTIATING', label: 'Negotiating' },
              { id: 'AGREED', label: 'Agreed / Signed' },
              { id: 'MILESTONES', label: 'Milestones Active' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deals or partners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Main Grid: Room List & Active Room Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Rooms List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Active Negotiations ({filteredRooms.length})
            </span>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No active deal rooms matching filter. Click "Start New Deal Room" above to initiate a collaboration.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredRooms.map((room) => {
                const isSelected = selectedRoom?.id === room.id
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      setSelectedRoom(room)
                      setChatHistory([
                        {
                          sender: room.partnerName,
                          time: '10:15 AM',
                          text: `Habari! Regarding ${room.opportunityTitle}, we have reviewed the deliverables and are prepared to proceed.`,
                          isBusiness: false,
                        },
                        {
                          sender: 'You (Business)',
                          time: '10:42 AM',
                          text: 'Great! All funds are secured and ready upon milestone verification.',
                          isBusiness: true,
                        },
                      ])
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md border-transparent'
                        : 'bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="font-extrabold text-xs truncate max-w-[170px]">
                        {room.partnerName}
                      </div>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                            : getStageBadgeColor(room.stage)
                        }`}
                      >
                        {room.stage.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div
                      className={`text-[11px] truncate mb-2.5 ${
                        isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500'
                      }`}
                    >
                      {room.opportunityTitle}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-[10px] font-bold text-slate-400">Secured Value:</span>
                      <span className="font-mono font-black text-[#FF6A00]">
                        TZS {room.currentProposedRewardTZS.toLocaleString()}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Room Workspace (8 Cols) */}
        {selectedRoom ? (
          <div className="lg:col-span-8 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            {/* Top Room Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {selectedRoom.partnerName}
                  </h3>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold">
                    {selectedRoom.partnerType}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedRoom.opportunityTitle}</p>
              </div>

              <div className="text-left sm:text-right bg-orange-50/60 dark:bg-orange-950/30 p-2.5 rounded-2xl border border-orange-200 dark:border-orange-900/60 shrink-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Agreed Bounty / Reward</div>
                <div className="text-base font-black text-[#FF6A00] font-mono">
                  TZS {selectedRoom.currentProposedRewardTZS.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Deliverables & Secured Funds Status */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#FF6A00]" />
                  <span>Agreed Commercial Deliverables Checklist:</span>
                </span>
                <span className="font-mono text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Funds Are Secured</span>
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {selectedRoom.deliverablesSummary}
              </p>
            </div>

            {/* Digital Contract Execution Status Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5 text-[#FF6A00]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{selectedRoom.contractSigned ? 'Digital MOU Contract Fully Signed' : 'Digital MOU Contract Pending Signature'}</span>
                    {selectedRoom.contractSigned && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {selectedRoom.contractSigned
                      ? 'Both parties have digitally signed. Milestones can be verified and settled.'
                      : 'Countersign agreement to formally seal commercial terms and activate partner attribution.'}
                  </p>
                </div>
              </div>

              {!selectedRoom.contractSigned && (
                <button
                  type="button"
                  onClick={handleSignAgreement}
                  className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  Countersign MOU Agreement
                </button>
              )}
            </div>

            {/* Negotiation & Direct Message Thread */}
            <div className="space-y-3 pt-2">
              <div className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MessageSquareCode className="w-4 h-4 text-[#FF6A00]" />
                  <span>Direct Deal Room Messages</span>
                </div>
                <span className="text-[10px] text-slate-400">Encrypted B2B Channel</span>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                {chatHistory.map((c, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl border text-xs space-y-1 ${
                      c.isBusiness
                        ? 'bg-orange-50/50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/40 ml-4'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{c.sender}</span>
                      <span className="font-mono">{c.time}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>

              {/* Message Input Box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Type an update, counter-offer terms, or request deliverable evidence..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-hidden focus:border-[#FF6A00]"
                />
                <button
                  type="button"
                  onClick={handleSendChat}
                  className="p-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white rounded-xl transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Handshake className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Select a Deal Room</h3>
            <p className="text-xs text-slate-500">Choose a deal from the left or initialize a new B2B negotiation.</p>
          </div>
        )}
      </div>

      {/* MODAL: START NEW DEAL ROOM WITH PARTNER SEARCH & DISCOVERY */}
      {isNewDealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsNewDealModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] flex items-center justify-center font-bold shrink-0">
                <Handshake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Initiate New B2B Deal Room
                </h3>
                <p className="text-xs text-slate-500">
                  Search verified partners by category, skills, phone number, or email to open a dedicated deal negotiation room.
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPartnerInputMode('DIRECTORY')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  partnerInputMode === 'DIRECTORY'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Search Verified Directory ({VERIFIED_PARTNERS_DIRECTORY.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPartnerInputMode('CUSTOM')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  partnerInputMode === 'CUSTOM'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Enter Custom / Unlisted Partner</span>
              </button>
            </div>

            {/* DIRECTORY SEARCH ACCORDION / CONTAINER */}
            {partnerInputMode === 'DIRECTORY' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-extrabold text-xs text-slate-700 dark:text-slate-200 flex items-center justify-between">
                  <span>1. Find & Select Partner:</span>
                  <span className="text-[10px] text-slate-400 font-normal">Search by name, skills, category, phone, email</span>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={partnerDirectorySearch}
                    onChange={(e) => setPartnerDirectorySearch(e.target.value)}
                    placeholder="Search by name, skills (e.g. 'Vehicle Sales', 'Solar', 'Moisture'), phone (+255...), or email..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-hidden focus:border-[#FF6A00]"
                  />
                  {partnerDirectorySearch && (
                    <button
                      type="button"
                      onClick={() => setPartnerDirectorySearch('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Dropdowns: Category & Skills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <select
                      value={partnerCategoryFilter}
                      onChange={(e) => setPartnerCategoryFilter(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    >
                      <option value="ALL">📁 All Industry Categories</option>
                      {allUniqueCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={partnerSkillFilter}
                      onChange={(e) => setPartnerSkillFilter(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    >
                      <option value="ALL">⚡ All Specific Skills</option>
                      {allUniqueSkills.map((sk) => (
                        <option key={sk} value={sk}>{sk}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Search Results List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {filteredDirectoryPartners.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed">
                      No partners found matching your search. Try adjusting category, skills, or phone/email query.
                    </div>
                  ) : (
                    filteredDirectoryPartners.map((ptn) => {
                      const isSelected = selectedDirectoryPartner?.id === ptn.id
                      return (
                        <div
                          key={ptn.id}
                          className={`p-3 rounded-2xl border text-xs transition-all space-y-2 ${
                            isSelected
                              ? 'bg-orange-50 dark:bg-orange-950/40 border-[#FF6A00] ring-1 ring-[#FF6A00]'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                                  {ptn.name}
                                </h4>
                                {ptn.verified && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                                    BRELA Verified
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block">{ptn.category} · {ptn.type} · {ptn.region}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelectDirectoryPartner(ptn)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#FF6A00] text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#FF6A00] hover:text-white'
                              }`}
                            >
                              {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              <span>{isSelected ? 'Selected' : 'Select'}</span>
                            </button>
                          </div>

                          {/* Contact Details: Phone & Email */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800 font-mono">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#FF6A00]" />
                              <span>{ptn.contactPhone}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-purple-600" />
                              <span>{ptn.contactEmail}</span>
                            </span>
                          </div>

                          {/* Skills Chips */}
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {ptn.skills.map((s, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* DEAL ROOM CREATION FORM */}
            <form onSubmit={handleCreateDealRoom} className="space-y-3.5 text-xs">
              <div className="font-extrabold text-xs text-slate-700 dark:text-slate-200">
                2. Commercial Terms & Collaboration Setup:
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-200">
                  Opportunity Title / Deal Name
                </label>
                <input
                  type="text"
                  required
                  value={newDealForm.opportunityTitle}
                  onChange={(e) => setNewDealForm({ ...newDealForm, opportunityTitle: e.target.value })}
                  placeholder="e.g. Mazda CX-5 Sales Finder / Solar Regional Distributor"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-200">
                    Partner / Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newDealForm.partnerName}
                    onChange={(e) => setNewDealForm({ ...newDealForm, partnerName: e.target.value })}
                    placeholder="e.g. Kassim Auto Brokers"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-200">
                    Partner Phone Number
                  </label>
                  <input
                    type="text"
                    value={newDealForm.partnerContactPhone}
                    onChange={(e) => setNewDealForm({ ...newDealForm, partnerContactPhone: e.target.value })}
                    placeholder="+255 754 000 000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-200">
                    Partner Email Address
                  </label>
                  <input
                    type="email"
                    value={newDealForm.partnerContactEmail}
                    onChange={(e) => setNewDealForm({ ...newDealForm, partnerContactEmail: e.target.value })}
                    placeholder="partner@company.co.tz"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-200">
                    Partner Role Type
                  </label>
                  <select
                    value={newDealForm.partnerType}
                    onChange={(e) => setNewDealForm({ ...newDealForm, partnerType: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  >
                    <option value="Certified Sales Agent">Certified Sales Agent</option>
                    <option value="B2B Regional Distributor">B2B Regional Distributor</option>
                    <option value="Commercial Property Broker">Commercial Property Broker</option>
                    <option value="Sourcing Aggregator">Sourcing Aggregator</option>
                    <option value="Creator / Media Partner">Creator / Media Partner</option>
                    <option value="Lead Generator">Lead Generator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-200">
                  Proposed Secured Bounty / Reward (TZS)
                </label>
                <input
                  type="number"
                  value={newDealForm.rewardAmountTZS}
                  onChange={(e) => setNewDealForm({ ...newDealForm, rewardAmountTZS: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-black text-[#FF6A00]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-200">
                  Key Deliverables & Verification Evidence
                </label>
                <textarea
                  rows={2}
                  value={newDealForm.deliverablesSummary}
                  onChange={(e) => setNewDealForm({ ...newDealForm, deliverablesSummary: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 leading-relaxed"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-200">
                  Initial Welcome / Negotiation Message
                </label>
                <input
                  type="text"
                  value={newDealForm.initialMessage}
                  onChange={(e) => setNewDealForm({ ...newDealForm, initialMessage: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewDealModalOpen(false)}
                  className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Handshake className="w-4 h-4" />
                  <span>Initialize Deal Room</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
