'use client'

import React, { useState } from 'react'
import {
  Bell,
  CheckCircle2,
  DollarSign,
  Briefcase,
  ShieldAlert,
  Clock,
  Trash2,
  Sliders,
} from 'lucide-react'
import { usePartnerToast } from '../PartnerToast'

export function NotificationsTab() {
  const { showToast } = usePartnerToast()

  const [notifications, setNotifications] = useState<
    {
      id: string
      title: string
      description: string
      time: string
      type: string
      isRead: boolean
    }[]
  >([])

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    showToast('info', 'Notifications Updated', 'All notifications marked as read.')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Notifications & Operational Alerts</span>
            <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-2 py-0.5 rounded-full">
              {notifications.filter((n) => !n.isRead).length} Unread
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time updates regarding conversion validations, payout disbursements, and Deal Room messages.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="py-2 px-3.5 border rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 self-start sm:self-auto transition-colors"
        >
          Mark All as Read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
            No Notifications Yet
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You are all caught up! Real-time alerts regarding referral approvals and payout disbursements will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
                n.isRead
                  ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  : 'bg-orange-50/30 dark:bg-slate-800 border-orange-200/80 dark:border-slate-700'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-[#0B132B] text-white flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-[#FF6A00]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
