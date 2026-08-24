'use client'

import React, { useState } from 'react'
import {
  Webhook,
  Search,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Globe,
  X,
  Code,
  Send,
} from 'lucide-react'
import { MOCK_WEBHOOKS } from '../mockData'
import { WebhookIntegration } from '../types'
import { useAdminToast } from '../AdminToast'

export function IntegrationsWebhooksTab() {
  const { showToast } = useAdminToast()

  const [integrations, setIntegrations] = useState<WebhookIntegration[]>(MOCK_WEBHOOKS)
  const [showSecretId, setShowSecretId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [pingConsoleModal, setPingConsoleModal] = useState<{
    integration: WebhookIntegration
    status: 'IDLE' | 'SENDING' | 'SUCCESS'
    latencyMs: number
    responseBody: string
  } | null>(null)

  const [newIntegration, setNewIntegration] = useState({
    name: '',
    targetUrl: '',
    provider: 'VODACOM' as 'VODACOM' | 'TIGO' | 'AIRTEL' | 'SELCOM' | 'SHOPIFY_PLUGIN' | 'WOOCOMMERCE',
    events: ['payment.received', 'payout.completed'],
  })

  const handleTestPing = (int: WebhookIntegration) => {
    setPingConsoleModal({
      integration: int,
      status: 'SENDING',
      latencyMs: 38,
      responseBody: JSON.stringify(
        {
          event: 'ping.test',
          timestamp: new Date().toISOString(),
          status: 'HTTP_200_OK',
          gateway: int.provider,
          signature_verified: true,
        },
        null,
        2
      ),
    })

    setTimeout(() => {
      setPingConsoleModal((prev) => (prev ? { ...prev, status: 'SUCCESS' } : null))
    }, 600)
  }

  const handleAddIntegration = () => {
    if (!newIntegration.name.trim() || !newIntegration.targetUrl.trim()) {
      showToast('error', 'Validation Error', 'API Integration Name and Endpoint Target URL are required.')
      return
    }

    const created: WebhookIntegration = {
      id: `int_${Date.now()}`,
      name: newIntegration.name,
      targetUrl: newIntegration.targetUrl,
      provider: newIntegration.provider,
      apiKeyMasked: `lumo_live_${Math.random().toString(36).substring(2, 12)}************`,
      secretMasked: `sec_${Math.random().toString(36).substring(2, 12)}************`,
      events: newIntegration.events,
      health: 'HEALTHY',
      successRate: 100.0,
      lastPing: 'Just now',
      pendingRetries: 0,
    }

    setIntegrations([...integrations, created])
    setShowAddModal(false)
    setNewIntegration({
      name: '',
      targetUrl: '',
      provider: 'VODACOM',
      events: ['payment.received', 'payout.completed'],
    })

    showToast('success', 'Webhook Connected', `Integration "${created.name}" registered and operational.`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Payment Gateways, Merchant APIs & Webhooks</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">
              API & Gateways
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure mobile money gateway endpoints, merchant webhook listeners, Shopify/WooCommerce plugins and test event delivery.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Connect New Webhook API</span>
        </button>
      </div>

      {integrations.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-dashed text-xs text-slate-500 space-y-2">
          <Webhook className="w-10 h-10 mx-auto text-slate-400 opacity-80" />
          <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Webhook Endpoints Configured</div>
          <div className="max-w-md mx-auto">
            Connect HTTP webhook listeners for Vodacom M-Pesa, Tigo Pesa, Airtel Money, or custom merchant e-commerce gateways to process live attribution callbacks.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {integrations.map((int) => (
            <div
              key={int.id}
              className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold">
                    <Webhook className="w-5 h-5 text-[#FF6A00]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                      {int.name}
                    </h4>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{int.targetUrl}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
                    {int.successRate}% Success
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{int.lastPing}</span>
                </div>
              </div>

              {/* Masked Credentials Display */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Public API Key</span>
                  <div className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">{int.apiKeyMasked}</div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Webhook Signing Secret</span>
                  <div className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 flex items-center justify-between">
                    <span>{showSecretId === int.id ? 'sec_live_9941a88b1200234c88f' : int.secretMasked}</span>
                    <button
                      onClick={() => setShowSecretId(showSecretId === int.id ? null : int.id)}
                      className="text-xs text-blue-600 hover:underline ml-2 cursor-pointer"
                    >
                      {showSecretId === int.id ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex gap-1.5 flex-wrap">
                  {int.events.map((e) => (
                    <span key={e} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-[10px] rounded font-mono font-bold">
                      {e}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestPing(int)}
                    className="py-1.5 px-3 bg-[#0B132B] hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-[#FF6A00]" />
                    <span>Send Ping Test</span>
                  </button>

                  <button
                    onClick={() => showToast('info', 'Retry Queue Clean', '0 pending failed webhooks for this endpoint.')}
                    className="py-1.5 px-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs cursor-pointer"
                  >
                    Retry Queue (0)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONNECT WEBHOOK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-[#FF6A00] flex items-center justify-center font-black">
                  <Webhook className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Connect Webhook API Endpoint
                  </h3>
                  <div className="text-[11px] text-slate-500">Configure provider callback listener and signing secret</div>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Integration Name</label>
                <input
                  type="text"
                  placeholder="e.g. Selcom Merchant Gateway Callback"
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Provider Type</label>
                <select
                  value={newIntegration.provider}
                  onChange={(e) => setNewIntegration({ ...newIntegration, provider: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="VODACOM">Vodacom M-Pesa B2C Open API</option>
                  <option value="TIGO">Tigo Pesa STK Gateway</option>
                  <option value="AIRTEL">Airtel Money Aggregator</option>
                  <option value="SELCOM">Selcom Tanzania API</option>
                  <option value="SHOPIFY_PLUGIN">Shopify E-Commerce Plugin</option>
                  <option value="WOOCOMMERCE">WooCommerce E-Commerce Plugin</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Target Endpoint URL (HTTPS)</label>
                <input
                  type="url"
                  placeholder="https://api.lumo.co.tz/v1/webhooks/..."
                  value={newIntegration.targetUrl}
                  onChange={(e) => setNewIntegration({ ...newIntegration, targetUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleAddIntegration}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Register & Activate Webhook
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE PING TEST CONSOLE MODAL */}
      {pingConsoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Webhook Ping Test Execution
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Target: {pingConsoleModal.integration.name}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPingConsoleModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>HTTP 200 OK</span>
                </span>
                <span className="font-mono text-[11px]">Roundtrip: {pingConsoleModal.latencyMs}ms</span>
              </div>

              <div>
                <span className="font-bold text-slate-500 block mb-1 text-[10px] uppercase">Payload Response</span>
                <pre className="p-3 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  {pingConsoleModal.responseBody}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setPingConsoleModal(null)}
                className="py-2 px-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl"
              >
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
