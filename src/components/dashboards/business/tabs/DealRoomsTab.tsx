'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import { MOCK_DEAL_ROOMS } from '../mockData'
import { DealRoomSession } from '../types'
import { useBusinessToast } from '../BusinessToast'

export function DealRoomsTab() {
  const { showToast } = useBusinessToast()

  const [rooms, setRooms] = useState<DealRoomSession[]>(MOCK_DEAL_ROOMS)
  const [selectedRoom, setSelectedRoom] = useState<DealRoomSession | null>(rooms[0] || null)
  const [counterOfferAmount, setCounterOfferAmount] = useState(1500000)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<{ sender: string; time: string; text: string }[]>([])

  const handleSendChat = () => {
    if (!chatMessage.trim() || !selectedRoom) return
    setChatHistory([
      ...chatHistory,
      {
        sender: 'You (Business)',
        time: 'Just now',
        text: chatMessage,
      },
    ])
    setChatMessage('')
    showToast('success', 'Message Dispatched', 'Message transmitted to Partner Deal Room.')
  }

  const handleSignAgreement = () => {
    if (!selectedRoom) return
    setRooms((prev) =>
      prev.map((r) => (r.id === selectedRoom.id ? { ...r, contractSigned: true, stage: 'TERMS_AGREED' } : r))
    )
    setSelectedRoom({ ...selectedRoom, contractSigned: true, stage: 'TERMS_AGREED' })
    showToast('success', 'Digital Agreement Countersigned', 'Digital agreement signed and sealed in escrow.')
  }

  if (rooms.length === 0 || !selectedRoom) {
    return (
      <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Deal Rooms & Commercial Negotiations</span>
              <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded-full">
                B2B Collaboration
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dedicated secure collaboration rooms for B2B distributors and high-tier creator agreements with milestone escrow tracking.
            </p>
          </div>
        </div>

        <div className="text-center py-16 px-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 max-w-lg mx-auto my-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Handshake className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No Active Deal Rooms
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto mb-6">
            When high-tier partners apply to your deals or submit commercial collaboration offers, your private negotiation rooms will open here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Deal Rooms & Commercial Negotiations</span>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded-full">
              B2B Negotiation & Milestones
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated secure collaboration rooms for B2B distributors and high-tier creator agreements with milestone escrow tracking.
          </p>
        </div>
      </div>

      {/* Main Grid: Room List & Active Room Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Rooms List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Active Deal Rooms ({rooms.length})
          </h3>

          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`w-full p-4 rounded-2xl border text-left transition-all space-y-2 ${
                selectedRoom.id === room.id
                  ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/20 dark:bg-slate-800'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono">
                  {room.stage.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400">{room.lastUpdated}</span>
              </div>

              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                {room.partnerName}
              </h4>
              <div className="text-[11px] text-slate-500 truncate">{room.opportunityTitle}</div>

              <div className="text-xs font-mono font-black text-[#FF6A00] pt-1 border-t">
                Escrow: TZS {room.currentProposedRewardTZS.toLocaleString()}
              </div>
            </button>
          ))}
        </div>

        {/* Right Column: Room Workspace (8 Cols) */}
        <div className="lg:col-span-8 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {selectedRoom.partnerName}
                </h3>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-mono">
                  {selectedRoom.partnerType}
                </span>
              </div>
              <p className="text-xs text-slate-500">{selectedRoom.opportunityTitle}</p>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 font-bold uppercase">Agreed Bounty</div>
              <div className="text-base font-black text-[#FF6A00] font-mono">
                TZS {selectedRoom.currentProposedRewardTZS.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Deliverables & Contract State */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500">Agreed Deliverables Summary:</span>
              <span className="font-mono text-emerald-600 font-bold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Safeguarded Escrow Contract</span>
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {selectedRoom.deliverablesSummary}
            </p>
          </div>

          {/* Digital Signature & Counter-Offer Bar */}
          <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0B132B] text-white flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4 text-[#FF6A00]" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  {selectedRoom.contractSigned ? 'Digital Contract Fully Executed' : 'Digital Contract Pending Execution'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {selectedRoom.contractSigned
                    ? 'Both parties have signed. Funds committed in escrow.'
                    : 'Countersign agreement to lock milestone funds in safeguarding escrow.'}
                </p>
              </div>
            </div>

            {!selectedRoom.contractSigned && (
              <button
                onClick={handleSignAgreement}
                className="py-2 px-4 bg-[#FF6A00] hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                Countersign MOU Agreement
              </button>
            )}
          </div>

          {/* Negotiation / Chat Thread */}
          <div className="space-y-3 pt-2">
            <div className="font-bold text-xs text-slate-500 flex items-center gap-1.5">
              <MessageSquareCode className="w-4 h-4 text-[#FF6A00]" />
              <span>Direct Commercial Coordination Thread</span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto p-3 bg-white dark:bg-slate-900 rounded-2xl border">
              {chatHistory.map((c, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{c.sender}</span>
                    <span className="font-mono">{c.time}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Type update or negotiation note..."
                className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs outline-hidden focus:border-[#FF6A00]"
              />
              <button
                onClick={handleSendChat}
                className="p-2.5 bg-[#FF6A00] hover:bg-orange-600 text-white rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
