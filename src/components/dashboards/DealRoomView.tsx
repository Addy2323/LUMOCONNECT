'use client'

import React, { useState } from 'react'
import {
  FileText,
  CheckCircle2,
  Clock,
  Send,
  UploadCloud,
  ShieldCheck,
  Building,
  User,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import {
  getDealRoom,
  postDealRoomMessage,
  type DealRoomAgreement,
} from '@/modules/dealroom/service'
import { StatusBadge } from '@/components/shared/StatusBadge'

export function DealRoomView({ dealRoomId = 'dr_safaribox_alex' }: { dealRoomId?: string }) {
  const [room, setRoom] = useState<DealRoomAgreement | undefined>(getDealRoom(dealRoomId))
  const [newMessage, setNewMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'deliverables' | 'chat'>('deliverables')

  if (!room) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-600">Deal Room agreement not found.</p>
      </div>
    )
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    postDealRoomMessage({
      dealRoomId: room.id,
      senderId: 'partner_alex',
      senderName: 'Alex Mushi',
      senderRole: 'PARTNER',
      message: newMessage,
    })

    setNewMessage('')
    setRoom({ ...getDealRoom(dealRoomId)! })
  }

  return (
    <div className="space-y-6">
      {/* Top Agreement Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                LUMO Secure Deal Room · Version {room.currentVersion}.0
              </span>
              <StatusBadge status={room.status} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {room.title}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Agreement between <strong>{room.businessName}</strong> and <strong>{room.partnerName}</strong>
            </p>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-orange-600">
              TZS {(Number(room.fixedFeeTZS) / 100).toLocaleString()} Fixed Fee
            </div>
            {room.commissionRateBps && (
              <span className="text-xs text-slate-500">
                + {room.commissionRateBps / 100}% on all booking revenues
              </span>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-4 pt-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('deliverables')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'deliverables'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Deliverables & Milestone Evidence ({room.deliverables.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Negotiation & Activity Stream ({room.messages.length})
          </button>
        </div>
      </div>

      {/* Deliverables Tab */}
      {activeTab === 'deliverables' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Agreed Contract Deliverables
            </h3>
            <span className="text-xs text-slate-500">
              Terms are immutable. Changes require mutual re-acceptance.
            </span>
          </div>

          <div className="space-y-3">
            {room.deliverables.map((del) => (
              <div
                key={del.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {del.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{del.description}</p>
                  </div>
                  <StatusBadge status={del.status} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-400 text-[11px]">Due Date: <strong>{del.dueDate}</strong></span>

                  {del.status === 'APPROVED' && (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approved by {room.businessName}
                    </span>
                  )}

                  {del.status === 'PENDING' && (
                    <button className="py-1 px-2.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg text-[11px] flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5" />
                      Upload Deliverable Evidence
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat & Negotiation Stream */}
      {activeTab === 'chat' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col h-[450px]">
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
            {room.messages.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-xl max-w-md text-xs ${
                  m.senderRole === 'PARTNER'
                    ? 'ml-auto bg-orange-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                }`}
              >
                <div className="font-bold mb-1 opacity-90 text-[11px]">{m.senderName}</div>
                <p className="leading-relaxed">{m.message}</p>
                <span className="text-[10px] opacity-70 block mt-1 text-right">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send message or upload agreement counteroffer..."
              className="flex-1 text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
            />
            <button
              type="submit"
              className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
