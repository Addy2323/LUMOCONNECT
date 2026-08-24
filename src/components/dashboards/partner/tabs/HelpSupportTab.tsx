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
  LifeBuoy,
} from 'lucide-react'
import { usePartnerToast } from '../PartnerToast'

export function HelpSupportTab() {
  const { showToast } = usePartnerToast()

  const [tickets, setTickets] = useState<
    {
      id: string
      subject: string
      category: string
      status: string
      openedDate: string
      lastUpdate: string
    }[]
  >([])

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
              Partner Support
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit inquiries, request conversion reviews, escalate deal disputes, and communicate with Partner Support.
          </p>
        </div>

        <button
          onClick={() => setShowCreateTicketModal(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Open Support Ticket</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500">
            <LifeBuoy className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <div className="font-bold text-slate-700 dark:text-slate-300">No Support Tickets Submitted</div>
            <div className="mt-0.5">Have questions or need assistance with deals, referrals, or payouts? Click &quot;Open Support Ticket&quot; to contact our 24/7 team.</div>
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[11px] text-slate-400">{t.id}</span>
                  <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {t.category}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{t.subject}</h4>
                <div className="text-[11px] text-slate-500">{t.lastUpdate}</div>
              </div>

              <div className="text-right text-[11px] text-slate-400 shrink-0 font-mono">
                Opened: {t.openedDate}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#FF6A00]" />
              <span>Create New Support Request</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="Rewards & Earnings">Rewards & Earnings</option>
                  <option value="Deal Dispute">Deal Dispute / Contract Mediation</option>
                  <option value="Tracking & Conversion Verification">Tracking & Conversion Verification</option>
                  <option value="Account & KYC">Account & KYC Verification</option>
                  <option value="Technical Support">Technical Platform Support</option>
                </select>
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inquiring about referral confirmation status..."
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Explanation & Evidence Links
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue with reference IDs, deal titles, or customer phone numbers..."
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateTicket}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs cursor-pointer"
              >
                Submit Request
              </button>
              <button
                onClick={() => setShowCreateTicketModal(false)}
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
