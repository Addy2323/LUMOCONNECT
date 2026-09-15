'use client'

import React, { useState, useEffect } from 'react'
import {
  Bell,
  CheckCircle2,
  DollarSign,
  Briefcase,
  ShieldAlert,
  Clock,
  Trash2,
  Sliders,
  MessageCircle,
  Smartphone,
  Search,
  Sparkles,
  ExternalLink,
  Plus,
  Check,
  Filter,
} from 'lucide-react'
import { usePartnerToast } from '../PartnerToast'
import { useLanguage } from '@/lib/i18n'
import type { PartnerSidebarSection } from '../types'

export interface PartnerNotificationItem {
  id: string
  title: string
  titleSw?: string
  description: string
  descriptionSw?: string
  time: string
  type: 'PAYOUT' | 'REFERRAL' | 'DEAL' | 'SYSTEM'
  isRead: boolean
  actionTab?: PartnerSidebarSection
  actionLabel?: string
  actionLabelSw?: string
}

const SEED_NOTIFICATIONS: PartnerNotificationItem[] = [
  {
    id: 'notif_01',
    title: 'Payout Disbursed: TZS 450,000 via M-Pesa',
    titleSw: 'Malipo Yapokelewa: TZS 450,000 kupitia M-Pesa',
    description: 'Your commission withdrawal request for completed referral #LUMO-8839 has been processed successfully.',
    descriptionSw: 'Ombi lako la kutoa kamisheni ya rufaa iliyokamilika #LUMO-8839 limefanikiwa kutekelezwa.',
    time: '10 mins ago',
    type: 'PAYOUT',
    isRead: false,
    actionTab: 'earnings_payouts',
    actionLabel: 'View Earnings Statement',
    actionLabelSw: 'Tazama Taarifa ya Mapato',
  },
  {
    id: 'notif_02',
    title: 'Customer Referral Approved (#LUMO-9102)',
    titleSw: 'Rufaa ya Mteja Imethibitishwa (#LUMO-9102)',
    description: 'Ujenzi Trade Buyers Ltd confirmed delivery of 500 bags of cement. Reward TZS 180,000 credited to pending balance.',
    descriptionSw: 'Ujenzi Trade Buyers Ltd imethibitisha uwasilishaji wa mifuko 500 ya saruji. Zawadi ya TZS 180,000 imewekwa kwenye salio la kusubiri.',
    time: '1 hour ago',
    type: 'REFERRAL',
    isRead: false,
    actionTab: 'leads_referrals',
    actionLabel: 'Track Referral Status',
    actionLabelSw: 'Fuatilia Hali ya Rufaa',
  },
  {
    id: 'notif_03',
    title: 'New Golden VIP Opportunity Released',
    titleSw: 'Fursa Mpya ya Golden VIP Imetolewa',
    description: '100x 5kW Hybrid Inverters consignment with TZS 450,000 reward per unit sold is now live on marketplace.',
    descriptionSw: 'Mzigo wa Vibadilishaji Umeme 100x 5kW wenye zawadi ya TZS 450,000 kwa kila kitengo sasa upo sokoni.',
    time: '3 hours ago',
    type: 'DEAL',
    isRead: true,
    actionTab: 'discover',
    actionLabel: 'Explore Opportunity',
    actionLabelSw: 'Tazama Fursa',
  },
  {
    id: 'notif_04',
    title: 'Commercial Pass Verified & Active',
    titleSw: 'Pasi ya Kibiashara Imethibitishwa',
    description: 'Your PRO Partner Tier access has been extended. All high-tier reward payouts unlocked.',
    descriptionSw: 'Ufikiaji wako wa Ngazi ya Washirika ya PRO umeongezwa. Malipo yote ya ngazi ya juu yamefunguliwa.',
    time: 'Yesterday',
    type: 'SYSTEM',
    isRead: true,
    actionTab: 'profile_verification',
    actionLabel: 'View Compliance Profile',
    actionLabelSw: 'Tazama Profaili ya Uzingatiaji',
  },
]

interface NotificationsTabProps {
  onNavigateTab?: (tab: PartnerSidebarSection) => void
}

export function NotificationsTab({ onNavigateTab }: NotificationsTabProps) {
  const { showToast } = usePartnerToast()
  const { locale } = useLanguage()

  // SMS & WhatsApp Preferences Persistence
  const [smsEnabled, setSmsEnabled] = useState(true)
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(true)

  // Notifications List State
  const [notifications, setNotifications] = useState<PartnerNotificationItem[]>([])
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'PAYOUT' | 'REFERRAL' | 'DEAL' | 'SYSTEM'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Load state from localStorage on mount and fetch real server notifications
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedNotifs = localStorage.getItem('lumo_partner_notifications')
        if (storedNotifs) {
          const parsed = JSON.parse(storedNotifs)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNotifications(parsed)
          } else {
            setNotifications(SEED_NOTIFICATIONS)
          }
        } else {
          setNotifications(SEED_NOTIFICATIONS)
        }

        const storedSettings = localStorage.getItem('lumo_partner_notification_settings')
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings)
          setSmsEnabled(Boolean(parsedSettings.smsEnabled))
          setWhatsAppEnabled(Boolean(parsedSettings.whatsAppEnabled))
        }
      } catch (e) {
        console.warn('Could not load notifications from storage', e)
        setNotifications(SEED_NOTIFICATIONS)
      }

      // Fetch live notifications from server
      fetch('/api/notifications', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.notifications) && data.notifications.length > 0) {
            const apiNotifs: PartnerNotificationItem[] = data.notifications.map((n: any) => ({
              id: n.id,
              title: n.title,
              description: n.description,
              time: new Date(n.time).toLocaleDateString() + ' ' + new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'REFERRAL',
              isRead: Boolean(n.isRead),
              actionTab: 'leads_referrals',
              actionLabel: 'Track Referral Status',
              actionLabelSw: 'Fuatilia Hali ya Rufaa',
            }))
            setNotifications((prev) => {
              const existingIds = new Set(apiNotifs.map((x) => x.id))
              return [...apiNotifs, ...prev.filter((p) => !existingIds.has(p.id))]
            })
          }
        })
        .catch(() => {})
    }
  }, [])

  // Sync notifications to localStorage
  const saveNotifications = (newNotifs: PartnerNotificationItem[]) => {
    setNotifications(newNotifs)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lumo_partner_notifications', JSON.stringify(newNotifs))
      } catch (e) {
        console.warn('Could not save notifications to storage', e)
      }
    }
  }

  // Handle SMS Toggle Change
  const handleToggleSms = (enabled: boolean) => {
    setSmsEnabled(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo_partner_notification_settings', JSON.stringify({ smsEnabled: enabled, whatsAppEnabled }))
    }
    showToast(
      'info',
      enabled ? 'SMS Notifications Enabled' : 'SMS Notifications Disabled',
      enabled ? 'You will receive instant SMS alerts for payout releases.' : 'SMS alerts paused.'
    )
  }

  // Handle WhatsApp Toggle Change
  const handleToggleWhatsApp = (enabled: boolean) => {
    setWhatsAppEnabled(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo_partner_notification_settings', JSON.stringify({ smsEnabled, whatsAppEnabled: enabled }))
    }
    showToast(
      'info',
      enabled ? 'WhatsApp Alerts Enabled' : 'WhatsApp Alerts Disabled',
      enabled ? 'You will receive real-time deal alerts via WhatsApp.' : 'WhatsApp notifications paused.'
    )
  }

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }))
    saveNotifications(updated)
    showToast('success', 'All Read', 'All operational alerts marked as read.')
  }

  // Clear all read notifications
  const handleClearRead = () => {
    const remaining = notifications.filter((n) => !n.isRead)
    saveNotifications(remaining)
    showToast('info', 'Cleaned Up', 'Read notifications removed.')
  }

  // Mark single notification as read
  const handleMarkSingleRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    saveNotifications(updated)
  }

  // Delete single notification
  const handleDeleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id)
    saveNotifications(updated)
    showToast('info', 'Alert Deleted', 'Notification removed.')
  }

  // Simulate a live operational alert (For testing/demonstration)
  const handleSimulateAlert = () => {
    const alertId = `notif_${Date.now()}`
    const randomAlerts: PartnerNotificationItem[] = [
      {
        id: alertId,
        title: 'New Lead Submitted Successfully',
        titleSw: 'Rufaa Mpya Imewasilishwa Sawa',
        description: 'Your customer referral for Grade 42.5 Cement has been logged into the review queue.',
        descriptionSw: 'Rufaa yako ya mteja wa Saruji Daraja la 42.5 imeingizwa kwenye foleni ya ukaguzi.',
        time: 'Just now',
        type: 'REFERRAL',
        isRead: false,
        actionTab: 'leads_referrals',
        actionLabel: 'View Referral Queue',
        actionLabelSw: 'Tazama Foleni ya Rufaa',
      },
      {
        id: alertId,
        title: 'Commission Credit Approved: TZS 240,000',
        titleSw: 'Malipo ya Kamisheni Yameidhinishwa: TZS 240,000',
        description: 'Wholesale fashion delivery verified by merchant. Payout scheduled for Friday disbursement.',
        descriptionSw: 'Usambazaji wa nguo kwa jumla umethibitishwa na muuzaji. Malipo yamepangwa Ijumaa.',
        time: 'Just now',
        type: 'PAYOUT',
        isRead: false,
        actionTab: 'earnings_payouts',
        actionLabel: 'Check Payout Schedule',
        actionLabelSw: 'Angalia Ratiba ya Malipo',
      },
      {
        id: alertId,
        title: 'Exclusive Commercial Campaign Available',
        titleSw: 'Kampeni Mpya ya Kibiashara Inapatikana',
        description: 'Corporate Fleet clearance campaign offers TZS 320,000 commission per laptop placed.',
        descriptionSw: 'Kampeni ya kompyuta za mashirika inatoa kamisheni ya TZS 320,000 kwa kila kompyuta.',
        time: 'Just now',
        type: 'DEAL',
        isRead: false,
        actionTab: 'discover',
        actionLabel: 'View Campaign',
        actionLabelSw: 'Tazama Kampeni',
      },
    ]

    const selected = randomAlerts[Math.floor(Math.random() * randomAlerts.length)]
    const updated = [selected, ...notifications]
    saveNotifications(updated)
    showToast('success', 'Real-Time Alert Triggered', selected.title)
  }

  // Filter & Search Logic
  const filteredNotifications = notifications.filter((n) => {
    const matchesFilter =
      activeFilter === 'ALL'
        ? true
        : activeFilter === 'UNREAD'
        ? !n.isRead
        : n.type === activeFilter

    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q) ||
      (n.titleSw && n.titleSw.toLowerCase().includes(q))

    return matchesFilter && matchesSearch
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getCategoryIcon = (type: PartnerNotificationItem['type']) => {
    switch (type) {
      case 'PAYOUT':
        return <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      case 'REFERRAL':
        return <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      case 'DEAL':
        return <Sparkles className="w-4 h-4 text-[#FF6A00]" />
      case 'SYSTEM':
      default:
        return <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
    }
  }

  const getCategoryBadgeClass = (type: PartnerNotificationItem['type']) => {
    switch (type) {
      case 'PAYOUT':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
      case 'REFERRAL':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
      case 'DEAL':
        return 'bg-orange-100 text-[#FF6A00] dark:bg-orange-950/60 dark:text-orange-300'
      case 'SYSTEM':
      default:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
    }
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Notifications & Operational Alerts</span>
            <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-2.5 py-0.5 rounded-full">
              {unreadCount} {locale === 'sw' ? 'Zisizosomwa' : 'Unread'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time updates regarding conversion validations, payout disbursements, and Deal Room messages.
          </p>
        </div>

        {/* Action Controls Header */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSimulateAlert}
            className="py-1.5 px-3 bg-orange-50 dark:bg-slate-800 border border-orange-200 dark:border-slate-700 text-[#FF6A00] hover:bg-[#FF6A00] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Simulate a real-time operational notification"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulate Alert</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="py-1.5 px-3 bg-[#0B132B] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>Mark All as Read</span>
            </button>
          )}

          {notifications.some((n) => n.isRead) && (
            <button
              onClick={handleClearRead}
              className="py-1.5 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Clear Read
            </button>
          )}
        </div>
      </div>

      {/* Preferences Bar (SMS & WhatsApp Switches) */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3 sm:grid-cols-2 dark:border-emerald-900/60 dark:bg-emerald-950/20">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white p-3 text-xs border border-emerald-100 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <span className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] flex items-center justify-center shrink-0">
              <Smartphone className="h-4 w-4" />
            </div>
            <span>
              <strong className="block text-slate-900 dark:text-white">SMS notifications</strong>
              <small className="text-slate-500">{locale === 'sw' ? 'Kwa Kiswahili & Kiingereza' : 'In English & Swahili'}</small>
            </span>
          </span>
          <input
            type="checkbox"
            checked={smsEnabled}
            onChange={(e) => handleToggleSms(e.target.checked)}
            className="h-4 w-4 accent-[#FF6A00] cursor-pointer"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white p-3 text-xs border border-emerald-100 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <span className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageCircle className="h-4 w-4" />
            </div>
            <span>
              <strong className="block text-slate-900 dark:text-white">WhatsApp notifications</strong>
              <small className="text-slate-500">{locale === 'sw' ? 'Arifa za Moja kwa Moja' : 'Instant Deal Alerts'}</small>
            </span>
          </span>
          <input
            type="checkbox"
            checked={whatsAppEnabled}
            onChange={(e) => handleToggleWhatsApp(e.target.checked)}
            className="h-4 w-4 accent-emerald-600 cursor-pointer"
          />
        </label>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        {/* Category Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'ALL', label: 'All Alerts', count: notifications.length },
            { id: 'UNREAD', label: 'Unread', count: unreadCount },
            { id: 'PAYOUT', label: 'Payouts', count: notifications.filter((n) => n.type === 'PAYOUT').length },
            { id: 'REFERRAL', label: 'Referrals', count: notifications.filter((n) => n.type === 'REFERRAL').length },
            { id: 'DEAL', label: 'Deals', count: notifications.filter((n) => n.type === 'DEAL').length },
            { id: 'SYSTEM', label: 'System', count: notifications.filter((n) => n.type === 'SYSTEM').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-[#0B132B] text-white shadow-2xs font-extrabold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeFilter === tab.id ? 'bg-[#FF6A00] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Search Bar */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Notifications List Body */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
            No Notifications Match Filter
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No alerts matching "${searchQuery}". Try clearing search keywords.`
              : 'You are all caught up! Real-time alerts regarding referral approvals and payout disbursements will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkSingleRead(n.id)}
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                n.isRead
                  ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
                  : 'bg-orange-50/40 dark:bg-slate-800/80 border-orange-200 dark:border-slate-700 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Icon Container */}
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getCategoryIcon(n.type)}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${getCategoryBadgeClass(n.type)}`}>
                      {n.type}
                    </span>

                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#FF6A00] animate-pulse" title="Unread Alert" />
                    )}

                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                      {locale === 'sw' && n.titleSw ? n.titleSw : n.title}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {locale === 'sw' && n.descriptionSw ? n.descriptionSw : n.description}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span className="font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{n.time}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Link & Controls */}
              <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800 shrink-0 self-end sm:self-center">
                {n.actionTab && onNavigateTab && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarkSingleRead(n.id)
                      onNavigateTab(n.actionTab!)
                    }}
                    className="py-1.5 px-3 bg-slate-900 dark:bg-slate-800 hover:bg-[#FF6A00] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>{locale === 'sw' && n.actionLabelSw ? n.actionLabelSw : n.actionLabel || 'View Details'}</span>
                    <ExternalLink className="w-3 h-3 text-[#FF6A00] hover:text-white" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteNotification(n.id)
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
