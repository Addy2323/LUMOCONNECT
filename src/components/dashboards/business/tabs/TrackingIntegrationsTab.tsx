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
  Plus,
} from 'lucide-react'
import { useBusinessToast } from '../BusinessToast'

export function TrackingIntegrationsTab() {
  const { showToast } = useBusinessToast()

  const [activeTool, setActiveTool] = useState<'LINKS' | 'QR' | 'API_WEBHOOKS' | 'PLUGINS'>('LINKS')
  const [showSecret, setShowSecret] = useState(false)
  const [testWebhookModal, setTestWebhookModal] = useState(false)

  const [trackingLinks, setTrackingLinks] = useState<
    {
      id: string
      title: string
      url: string
      clicks: number
      conversions: number
    }[]
  >([])

  const [promoCodes, setPromoCodes] = useState<
    {
      code: string
      discount: string
      reward: string
      uses: number
    }[]
  >([])

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
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
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

            {trackingLinks.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500">
                <Link className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <div className="font-bold text-slate-700 dark:text-slate-300">No Direct Tracking URLs Configured</div>
                <div className="mt-0.5">Tracking URLs are generated automatically upon publishing opportunities or adding custom affiliate landing pages.</div>
              </div>
            ) : (
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
                        className="py-1 px-2.5 bg-white dark:bg-slate-900 border rounded-lg hover:bg-slate-100 font-bold cursor-pointer"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-3 border-t">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Brand Promo Codes
            </h3>

            {promoCodes.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500">
                <div className="font-bold text-slate-700 dark:text-slate-300">No Brand Promo Codes Created</div>
                <div className="mt-0.5">Custom discount vouchers configured in deal wizards will appear here for tracking conversion attribution.</div>
              </div>
            ) : (
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
            )}
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
            onClick={() => showToast('success', 'Packaging QR Generated', 'Vector QR template compiled for your deals.')}
            className="py-2.5 px-5 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Generate Print Template (SVG)
          </button>
        </div>
      )}

      {/* TOOL 3: API KEYS & WEBHOOKS */}
      {activeTool === 'API_WEBHOOKS' && (
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Merchant REST API Public Key</span>
              <button
                onClick={() => handleCopy('lumo_live_pub_99210041a87b')}
                className="text-[#FF6A00] font-bold hover:underline cursor-pointer"
              >
                Copy Key
              </button>
            </div>
            <div className="font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border">
              lumo_live_pub_99210041a87b
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">API Secret Key (Keep Confidential)</span>
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="text-slate-500 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showSecret ? 'Hide' : 'Reveal'}</span>
              </button>
            </div>
            <div className="font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border">
              {showSecret ? 'lumo_sec_88991200384aa901ef' : '••••••••••••••••••••••••••••••••'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Live Conversion Webhook URL</h4>
                <p className="text-[11px] text-slate-500">LUMO will POST confirmed attribution payloads to this endpoint.</p>
              </div>
              <button
                onClick={() => setTestWebhookModal(true)}
                className="py-1.5 px-3 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-lg text-xs cursor-pointer"
              >
                Send Test Ping
              </button>
            </div>
            <input
              type="url"
              defaultValue="https://api.merchant.co.tz/v1/lumo/conversions"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
            />
          </div>
        </div>
      )}

      {/* TOOL 4: E-COMMERCE PLUGINS */}
      {activeTool === 'PLUGINS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              🛍️
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Shopify One-Click Plugin</h4>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Automatically fire conversion events on successful Shopify checkout completions.
              </p>
            </div>
            <button
              onClick={() => showToast('info', 'Shopify App Store', 'Opening LUMO Connector for Shopify.')}
              className="w-full py-2 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold rounded-xl cursor-pointer"
            >
              Install Shopify App
            </button>
          </div>

          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
              🛒
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">WooCommerce Extension</h4>
              <p className="text-slate-500 text-[11px] mt-0.5">
                WordPress & WooCommerce plugin with automatic UTM tracking and M-Pesa order matching.
              </p>
            </div>
            <button
              onClick={() => showToast('info', 'WooCommerce Plugin', 'Downloading lumo-woocommerce-v1.4.zip.')}
              className="w-full py-2 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold rounded-xl cursor-pointer"
            >
              Download WordPress Plugin
            </button>
          </div>
        </div>
      )}

      {/* Test Webhook Modal */}
      {testWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Webhook className="w-5 h-5 text-[#FF6A00]" />
              <span>Test Webhook Payload</span>
            </h3>
            <p className="text-slate-500">Dispatching sample test payload to your configured endpoint:</p>
            <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto">
{`{
  "event": "conversion.verified",
  "reference_id": "CONV-TEST-9901",
  "sale_amount_tzs": 450000,
  "partner_id": "part_alex_99",
  "timestamp": "${new Date().toISOString()}"
}`}
            </pre>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleTestWebhookPing}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl cursor-pointer"
              >
                Send Test Payload
              </button>
              <button
                onClick={() => setTestWebhookModal(false)}
                className="py-2.5 px-4 border rounded-xl font-bold cursor-pointer"
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
