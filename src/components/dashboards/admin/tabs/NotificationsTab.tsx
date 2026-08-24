'use client'

import React, { useState } from 'react'
import {
  Bell,
  Search,
  Plus,
  Mail,
  Smartphone,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  X,
  Sparkles,
} from 'lucide-react'
import { useAdminToast } from '../AdminToast'

export function NotificationsTab() {
  const { showToast } = useAdminToast()

  const [templates, setTemplates] = useState([
    {
      id: 'tmpl_1',
      title: 'Partner Reward Payout Credited',
      channel: 'SMS' as 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP',
      trigger: 'PAYOUT_DISBURSED',
      body: 'Hongera! Your LUMO reward of TZS {{amount}} has been sent to {{phone}}. Ref: {{ref}}',
      sentCount: 14200,
      deliveryRate: '99.8%',
    },
    {
      id: 'tmpl_2',
      title: 'Business Deal Approved & Published',
      channel: 'EMAIL' as 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP',
      trigger: 'DEAL_PUBLISHED',
      body: 'Your campaign "{{deal_title}}" is now live on LUMO Marketplace.',
      sentCount: 840,
      deliveryRate: '100.0%',
    },
    {
      id: 'tmpl_3',
      title: 'Subscription Expiry Notice (3 Days Left)',
      channel: 'SMS' as 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP',
      trigger: 'SUBSCRIPTION_EXPIRING',
      body: 'Kumbuka: Your LUMO Semi-Annual subscription expires in 3 days. Renew to retain deal access.',
      sentCount: 3120,
      deliveryRate: '99.6%',
    },
  ])

  const [showComposer, setShowComposer] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    channel: 'SMS' as 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP',
    trigger: 'NEW_CONVERSION_VERIFIED',
    body: 'Hongera {{partner_name}}! A new conversion was verified for deal "{{deal_title}}". Commission: TZS {{amount}}.',
  })

  const handleCreateTemplate = () => {
    if (!newTemplate.title.trim() || !newTemplate.body.trim()) {
      showToast('error', 'Validation Error', 'Template title and message body are required.')
      return
    }

    const created = {
      id: `tmpl_${Date.now()}`,
      title: newTemplate.title,
      channel: newTemplate.channel,
      trigger: newTemplate.trigger,
      body: newTemplate.body,
      sentCount: 0,
      deliveryRate: '100.0%',
    }

    setTemplates([created, ...templates])
    setShowComposer(false)
    setNewTemplate({
      title: '',
      channel: 'SMS',
      trigger: 'NEW_CONVERSION_VERIFIED',
      body: 'Hongera {{partner_name}}! A new conversion was verified for deal "{{deal_title}}". Commission: TZS {{amount}}.',
    })

    showToast('success', 'Notification Template Created', `Template "${created.title}" registered for trigger ${created.trigger}.`)
  }

  const insertVariable = (tag: string) => {
    setNewTemplate({
      ...newTemplate,
      body: `${newTemplate.body} ${tag}`,
    })
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Communications & Automated Notifications</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">
              CRUD + Delivery Logs
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure SMS (Infobip/local telco) & transactional email templates, recipient segments, and automated triggers. Delivery logs are read-only.
          </p>
        </div>

        <button
          onClick={() => setShowComposer(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>New Notification Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((t) => (
          <div
            key={t.id}
            className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border text-slate-700 dark:text-slate-300">
                  {t.channel}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">{t.deliveryRate} Delivery</span>
              </div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white mt-2 leading-tight">
                {t.title}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border mt-2">
                &quot;{t.body}&quot;
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t text-slate-400">
              <span className="text-[10px]">Trigger: {t.trigger}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{t.sentCount.toLocaleString()} sent</span>
            </div>
          </div>
        ))}
      </div>

      {/* TEMPLATE COMPOSER MODAL */}
      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-black">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Create Notification Template
                  </h3>
                  <div className="text-[11px] text-slate-500">Configure delivery channel, automated trigger, and message copy</div>
                </div>
              </div>

              <button
                onClick={() => setShowComposer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Template Title</label>
                <input
                  type="text"
                  placeholder="e.g. Instant Conversion Credit Alert"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Delivery Channel</label>
                  <select
                    value={newTemplate.channel}
                    onChange={(e) => setNewTemplate({ ...newTemplate, channel: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="SMS">SMS (Local Telco / Infobip)</option>
                    <option value="EMAIL">Transactional Email (Amazon SES)</option>
                    <option value="PUSH">Web & Mobile Push</option>
                    <option value="IN_APP">In-App Notification Center</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Automated Event Trigger</label>
                  <select
                    value={newTemplate.trigger}
                    onChange={(e) => setNewTemplate({ ...newTemplate, trigger: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="NEW_CONVERSION_VERIFIED">New Conversion Verified</option>
                    <option value="PAYOUT_DISBURSED">Payout Batch Disbursed</option>
                    <option value="DEAL_PUBLISHED">New Opportunity Published</option>
                    <option value="SUBSCRIPTION_EXPIRING">Subscription Expiring Soon</option>
                    <option value="KYB_VERIFIED">Business KYB Approved</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold">Message Body Copy</label>
                  <span className="text-[10px] text-slate-400">Click tags below to insert dynamic data</span>
                </div>
                <textarea
                  rows={3}
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                />

                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {['{{partner_name}}', '{{amount}}', '{{deal_title}}', '{{phone}}', '{{ref}}'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertVariable(tag)}
                      className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] hover:bg-slate-300"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleCreateTemplate}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Save & Activate Template
              </button>
              <button
                onClick={() => setShowComposer(false)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold"
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
