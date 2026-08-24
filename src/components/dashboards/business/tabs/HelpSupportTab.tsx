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
import { useBusinessToast } from '../BusinessToast'

export function HelpSupportTab() {
  const { showToast } = useBusinessToast()

  const [tickets, setTickets] = useState([
    {
      id: 'TICK-8812',
      subject: 'Assistance with Shopify Webhook Conversion Setup',
      category: 'API & Integration',
      status: 'OPEN',
      openedDate: 'Today, 09:15 AM',
      lastUpdate: 'Assigned to Tech Support Engineer (Godwin)',
    },
    {
      id: 'TICK-8720',
      subject: 'TRA Electronic Fiscal Receipt Verification Confirmation',
      category: 'Tax & Compliance',
      status: 'RESOLVED',
      openedDate: '18 Aug 2026',
      lastUpdate: 'Resolved by Finance Officer',
    },
  ])

  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'Opportunity Review',
    message: '',
  })

  const handleCreateTicket = () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      showToast('error', 'Validation Error', 'Ticket subject and detailed message are required.')
      return
    }

    const created = {
      id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: newTicket.subject,
      category: newTicket.category,
      status: 'OPEN',
      openedDate: 'Today, Just now',
      lastUpdate: 'Queued for LUMO Business Desk Support',
    }

    setTickets([created, ...tickets])
    setShowCreateTicketModal(false)
    setNewTicket({ subject: '', category: 'Opportunity Review', message: '' })
    showToast('success', 'Support Ticket Created', `Ticket ${created.id} submitted. Our team will respond within 2 business hours.`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Help Desk, Disputes & Support Center</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">
              C/R/U/Close
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit inquiries, upload evidence for dispute mediation, and communicate directly with the LUMO Merchant Success Team.
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

      {/* OPEN TICKET MODAL */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
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
                  <option value="Opportunity Review">Opportunity Compliance Review</option>
                  <option value="API & Integration">API, Webhooks & QR Tracking</option>
                  <option value="Escrow & Payments">Escrow Funding & Disbursals</option>
                  <option value="Partner Dispute">Partner Mediation & Dispute</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Brief summary of your question or issue..."
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  placeholder="Explain the situation and attach relevant transaction or deal references..."
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
