'use client'

import React, { useState } from 'react'
import {
  Webhook,
  QrCode,
  Link,
  Code,
  Zap,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  X,
} from 'lucide-react'
import { useBusinessToast } from '../BusinessToast'

export function TrackingIntegrationsTab() {
  const { showToast } = useBusinessToast()

  const [activeTool, setActiveTool] = useState<'LINKS' | 'QR' | 'API_WEBHOOKS' | 'PLUGINS'>('LINKS')
  const [showSecret, setShowSecret] = useState(false)
  const [testWebhookModal, setTestWebhookModal] = useState(false)

  const trackingLinks = [
    {
      id: 'trk_1',
      title: 'Kijani Solar Home Kit Standard Link',
      url: 'https://lumo.co.tz/d/power-next-1000-homes?ref=brand_direct',
      clicks: 14200,
      conversions: 410,
    },
    {
      id: 'trk_2',
      title: 'Solar Installer Recruitment Referral Link',
      url: 'https://lumo.co.tz/d/solar-installer-referral-program?ref=tech_lead',
      clicks: 5800,
      conversions: 205,
    },
  ]

  const promoCodes = [
    { code: 'KIJANI2026', discount: '5% Customer Off', reward: 'TZS 45,000 to Partner', uses: 248 },
    { code: 'SOLARPOWA', discount: 'Free Installation', reward: 'TZS 45,000 to Partner', uses: 162 },
  ]

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('success', 'Copied to Clipboard', text)
  }

  const handleTestWebhookPing = () => {
    showToast('success', 'Test Webhook Dispatched', 'Received HTTP 200 OK from endpoint in 46ms.')
    setTestWebhookModal(false)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Tracking Tools, APIs & E-Commerce Integrations</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">
              APIs & Webhooks
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic tracking URLs, QR packaging codes, merchant promo vouchers, and API webhook callbacks.
          </p>
        </div>
      </div>

      {/* Sub-tools Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'LINKS', label: 'Tracking Links & Promo Codes', icon: Link },
          { id: 'QR', label: 'QR Code Packaging Generator', icon: QrCode },
          { id: 'API_WEBHOOKS', label: 'API Keys & Webhooks', icon: Webhook },
          { id: 'PLUGINS', label: 'E-Commerce Plugins (Shopify / WooCommerce)', icon: Code },
        ].map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id as any)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTool === t.id
                  ? 'bg-[#0B132B] text-white shadow-2xs font-extrabold'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* TOOL 1: TRACKING LINKS & PROMO CODES */}
      {activeTool === 'LINKS' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Dynamic Tracking URLs
            </h3>

            <div className="space-y-2.5">
              {trackingLinks.map((trk) => (
                <div
                  key={trk.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white">{trk.title}</h4>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{trk.url}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      {trk.clicks.toLocaleString()} clicks · <strong className="text-[#FF6A00]">{trk.conversions} sales</strong>
                    </span>
                    <button
                      onClick={() => handleCopy(trk.url)}
                      className="py-1 px-2.5 bg-white dark:bg-slate-900 border rounded-lg hover:bg-slate-100 font-bold"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Brand Promo Codes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {promoCodes.map((pr) => (
                <div key={pr.code} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-base text-[#FF6A00]">{pr.code}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{pr.uses} uses</span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300">{pr.discount}</div>
                  <div className="text-[10px] text-emerald-600 font-bold">{pr.reward}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOOL 2: QR GENERATOR */}
      {activeTool === 'QR' && (
        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border text-center space-y-3">
          <QrCode className="w-16 h-16 text-[#FF6A00] mx-auto" />
          <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
            High-Resolution Print Packaging QR Generator
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Generate vector SVG or high-res PNG QR codes for printing directly onto hardware packaging, warranty cards, or retail flyers.
          </p>
          <button
            onClick={() => showToast('success', 'QR Package Downloaded', 'Vector SVG/PNG package generated.')}
            className="py-2.5 px-5 bg-[#0B132B] text-white font-extrabold rounded-xl text-xs"
          >
            Download Print QR Code Bundle (SVG / PNG)
          </button>
        </div>
      )}

      {/* TOOL 3: API KEYS & WEBHOOKS */}
      {activeTool === 'API_WEBHOOKS' && (
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Merchant Public API Key & Secret
            </h4>

            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Public API Key</span>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                lumo_pub_9920148ab00213cd49
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Signing Secret</span>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {showSecret ? 'Hide' : 'Reveal Secret'}
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                {showSecret ? 'sec_live_9941a88b1200234c88f4410293' : 'sec_live_************************'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Outbound Webhook Listener
              </h4>
              <button
                onClick={() => setTestWebhookModal(true)}
                className="py-1 px-3 bg-[#FF6A00] text-white font-bold rounded-lg text-xs"
              >
                Send Ping Test
              </button>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Target Endpoint URL</span>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                https://api.kijanisolar.co.tz/v1/lumo/conversions-callback
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 4: PLUGINS */}
      {activeTool === 'PLUGINS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border space-y-3">
            <h4 className="font-black text-sm text-slate-900 dark:text-white">
              Shopify E-Commerce Plugin
            </h4>
            <p className="text-slate-500 text-[11px]">
              Automatically track affiliate orders and customer checkouts directly on Shopify.
            </p>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded">
              Status: Connected (Live)
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border space-y-3">
            <h4 className="font-black text-sm text-slate-900 dark:text-white">
              WooCommerce WordPress Plugin
            </h4>
            <p className="text-slate-500 text-[11px]">
              WordPress webhook listener for automated customer attribution.
            </p>
            <button
              onClick={() => showToast('info', 'Plugin Downloaded', 'LUMO WooCommerce .zip downloaded.')}
              className="py-1.5 px-3 border rounded-xl font-bold hover:bg-white dark:hover:bg-slate-900"
            >
              Download Plugin (.zip)
            </button>
          </div>
        </div>
      )}

      {/* TEST WEBHOOK MODAL */}
      {testWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Send Test Webhook Ping
                </h3>
              </div>
              <button onClick={() => setTestWebhookModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[10px] overflow-x-auto">
              {JSON.stringify(
                {
                  event: 'conversion.verified',
                  reference: 'CONV-TEST-9901',
                  amount: 450000,
                  reward: 45000,
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              )}
            </pre>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleTestWebhookPing}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl"
              >
                Dispatch Test Event
              </button>
              <button onClick={() => setTestWebhookModal(false)} className="py-2.5 px-4 border rounded-xl font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
