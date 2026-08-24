'use client'

import React, { useState } from 'react'
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Upload,
  CheckCircle2,
  Clock,
  Send,
  X,
  FileText,
} from 'lucide-react'
import { usePartnerToast } from '../PartnerToast'

export function HelpSupportTab() {
  const { showToast } = usePartnerToast()

  const [tickets, setTickets] = useState([
    {
      id: 'PTICK-9921',
      subject: 'Inquiry regarding 7-day conversion validation cooling period',
      category: 'Rewards & Earnings',
      status: 'RESOLVED',
      openedDate: '19 Aug 2026',
      lastUpdate: 'Resolved by LUMO Support Desk (Grace)',
    },
    {
      id: 'PTICK-9840',
      subject: 'Deal dispute mediation for Bagamoyo solar installation reference',
      category: 'Deal Dispute',
      status: 'OPEN',
      openedDate: 'Today, 09:30 AM',
      lastUpdate: 'Assigned to Dispute Resolution Board',
    },
  ])

  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'Rewards & Earnings',
    message: '',
  })

  const handleCreateTicket = () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      showToast('error', 'Validation Error', 'Ticket subject and detailed message are required.')
      return
    }

    const created = {
      id: `PTICK-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: newTicket.subject,
      category: newTicket.category,
      status: 'OPEN',
      openedDate: 'Today, Just now',
      lastUpdate: 'Queued for Partner Success Team',
    }

    setTickets([created, ...tickets])
    setShowCreateTicketModal(false)
    setNewTicket({ subject: '', category: 'Rewards & Earnings', message: '' })
    showToast('success', 'Ticket Submitted', `Support ticket ${created.id} submitted. We will reply within 2 hours.`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Help Desk, Support & Dispute Center</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">
              C/R/U/Close
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit inquiries, request conversion reviews, escalate deal disputes, and communicate with Partner Support.
          </p>
        </div>

        <button
          onClick={() => setShowCreateTicketModal(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Open Support Ticket</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-400">{t.id}</span>
                <span className="font-bold text-[10px] px-2 py-0.5 bg-white dark:bg-slate-900 rounded border">
                  {t.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.status === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {t.status}
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {t.subject}
              </h4>
              <p className="text-slate-500 text-[11px]">{t.lastUpdate}</p>
            </div>

            <div className="text-right text-slate-400 text-[10px]">
              Opened: {t.openedDate}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE TICKET MODAL */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Open Support Ticket
                </h3>
              </div>
              <button onClick={() => setShowCreateTicketModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Issue Category</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                >
                  <option value="Rewards & Earnings">Rewards, Commission & Payouts</option>
                  <option value="Deal Dispute">Deal Dispute Mediation</option>
                  <option value="Tracking Links">Tracking Links & QR Codes</option>
                  <option value="Account & KYC">Account & Identity Verification</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Brief summary of issue..."
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Detailed Message</label>
                <textarea
                  rows={4}
                  placeholder="Explain the inquiry and include relevant customer or deal references..."
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleCreateTicket}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl shadow-xs"
              >
                Submit Ticket
              </button>
              <button onClick={() => setShowCreateTicketModal(false)} className="py-2.5 px-4 border rounded-xl font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
