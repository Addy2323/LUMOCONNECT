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
} from 'lucide-react'
import { MOCK_PARTNER_DEAL_ROOMS } from '../mockData'
import { PartnerDealRoom } from '../types'
import { usePartnerToast } from '../PartnerToast'

export function DealRoomsTab() {
  const { showToast } = usePartnerToast()

  const [rooms, setRooms] = useState<PartnerDealRoom[]>(MOCK_PARTNER_DEAL_ROOMS)
  const [selectedRoom, setSelectedRoom] = useState<PartnerDealRoom>(rooms[0])
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'Kijani Solar Tech (Alex Mushi)',
      time: 'Today, 10:15 AM',
      text: 'Welcome to the B2B Deal Room! We have approved your commercial introduction proposal for Mwanza & Shinyanga regional wholesale distribution.',
    },
    {
      sender: 'Alex Mwamburi (You)',
      time: 'Today, 11:30 AM',
      text: 'Thank you! The distributor MOU is scheduled for signing this Thursday. Initial order commitment is 100 home kits.',
    },
  ])

  const handleSendChat = () => {
    if (!chatMessage.trim()) return
    setChatHistory([
      ...chatHistory,
      {
        sender: 'Alex Mwamburi (You)',
        time: 'Just now',
        text: chatMessage,
      },
    ])
    setChatMessage('')
    showToast('success', 'Message Transmitted', 'Message sent to Business Deal Coordinator.')
  }

  const handleSignContract = () => {
    setRooms((prev) =>
      prev.map((r) => (r.id === selectedRoom.id ? { ...r, contractSigned: true, stage: 'TERMS_AGREED' } : r))
    )
    setSelectedRoom({ ...selectedRoom, contractSigned: true, stage: 'TERMS_AGREED' })
    showToast('success', 'Digital Agreement Signed', 'Digital contract countersigned and locked in escrow.')
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
            Dedicated secure collaboration rooms for B2B distributor introductions, creator partnerships, and milestone contracts.
          </p>
        </div>
      </div>

      {/* Main Grid: Room List & Active Room Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Rooms List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Enrolled Deal Rooms ({rooms.length})
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
                {room.businessName}
              </h4>
              <div className="text-[11px] text-slate-500 truncate">{room.dealTitle}</div>

              <div className="text-xs font-mono font-black text-[#FF6A00] pt-1 border-t">
                Escrow Bounty: TZS {room.agreedBountyTZS.toLocaleString()}
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
                  {selectedRoom.businessName}
                </h3>
              </div>
              <p className="text-xs text-slate-500">{selectedRoom.dealTitle}</p>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 font-bold uppercase">Agreed Milestone Bounty</div>
              <div className="text-base font-black text-[#FF6A00] font-mono">
                TZS {selectedRoom.agreedBountyTZS.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Deliverables & Contract State */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Agreed Deliverables Summary:</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                selectedRoom.contractSigned ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedRoom.contractSigned ? '✓ Digital Contract Signed' : 'Pending Signature'}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              {selectedRoom.deliverables}
            </p>
          </div>

          {/* Chat Communication History */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Direct Business Communication & Evidence Trail
            </h4>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border space-y-3 max-h-48 overflow-y-auto">
              {chatHistory.map((c, i) => (
                <div key={i} className="text-xs space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>{c.sender}</span>
                    <span>{c.time}</span>
                  </div>
                  <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px]">
                    {c.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type update, share evidence links, or ask questions..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <button
                onClick={handleSendChat}
                className="py-2.5 px-4 bg-[#FF6A00] text-white font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2">
              {!selectedRoom.contractSigned && (
                <button
                  onClick={handleSignContract}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Countersign Agreement</span>
                </button>
              )}
            </div>

            <button
              onClick={() => showToast('info', 'LUMO Mediation Escalated', 'Dispute mediation officer notified for Deal Room.')}
              className="py-2 px-3 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50"
            >
              Request LUMO Mediation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
