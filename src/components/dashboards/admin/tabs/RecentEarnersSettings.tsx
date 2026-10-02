'use client'

import React, { useEffect, useState } from 'react'
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Globe,
  DollarSign,
  Clock,
  Sparkles,
  AlertCircle,
  Sliders,
  CheckCircle2,
} from 'lucide-react'
import type { EarningsConfig, PublicEarning } from '@/lib/public-earnings'

interface AdminEarningItem extends PublicEarning {
  rawPartnerName: string
  publicOptOut: boolean
}

export function RecentEarnersSettings() {
  const [config, setConfig] = useState<EarningsConfig | null>(null)
  const [earnings, setEarnings] = useState<AdminEarningItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/recent-earners')
      if (!res.ok) throw new Error('Failed to load settings')
      const data = await res.json()
      if (data.config) setConfig(data.config)
      if (data.earnings) setEarnings(data.earnings)
    } catch {
      setMessage('Recent earners settings unavailable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const saveConfig = async () => {
    if (!config) return
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/recent-earners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!response.ok) throw new Error()
      setMessage('Settings saved successfully.')
    } catch {
      setMessage('Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  const toggleVisibility = async (rewardId: string, currentStatus: boolean) => {
    setUpdatingId(rewardId)
    try {
      const response = await fetch('/api/admin/recent-earners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId,
          showInPublicEarningsFeed: !currentStatus,
        }),
      })
      if (!response.ok) throw new Error('Failed to update visibility')
      setEarnings((prev) =>
        prev.map((item) =>
          item.id === rewardId ? { ...item, showInFeed: !currentStatus } : item
        )
      )
    } catch {
      alert('Failed to update visibility status.')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-sm animate-pulse">
        Loading Public Earnings Control Hub...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Authoritative Public Ledger Feed</span>
          </div>
          <h2 className="text-xl font-bold text-white">Public Earnings Feed Control</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Control the real-time &quot;Recent Verified Earnings&quot; ticker displayed on the LUMO homepage.
            All records are generated automatically from completed and verified payouts.
          </p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Strictly Verified Data</span>
        </div>
      </div>

      {/* CONFIGURATION CONTROLS */}
      {config && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Public Ticker Configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center space-x-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
              />
              <div>
                <span className="text-xs font-bold text-white block">Enable Public Ticker</span>
                <span className="text-[10px] text-slate-400 block">Show ticker on public site</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showCategory}
                onChange={(e) => setConfig({ ...config, showCategory: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
              />
              <div>
                <span className="text-xs font-bold text-white block">Show Deal Category</span>
                <span className="text-[10px] text-slate-400 block">Display sector badge</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showTime}
                onChange={(e) => setConfig({ ...config, showTime: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
              />
              <div>
                <span className="text-xs font-bold text-white block">Show Relative Time</span>
                <span className="text-[10px] text-slate-400 block">Display &quot;1 min ago&quot; label</span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Display Mode</label>
              <select
                value={config.mode}
                onChange={(e) =>
                  setConfig({ ...config, mode: e.target.value as EarningsConfig['mode'] })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              >
                <option value="PAID">PAID Only (Verified Payouts)</option>
                <option value="APPROVED">APPROVED & PAID</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Minimum Amount Threshold (TZS)
              </label>
              <input
                type="number"
                min={0}
                max={1000000000}
                value={config.minimumTZS}
                onChange={(e) => setConfig({ ...config, minimumTZS: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max Cards in Feed
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={config.maximumCards}
                onChange={(e) => setConfig({ ...config, maximumCards: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Seconds Per Card (Animation Speed)
              </label>
              <input
                type="number"
                min={4}
                max={20}
                value={config.secondsPerCard}
                onChange={(e) => setConfig({ ...config, secondsPerCard: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={saveConfig}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save Ticker Settings'}
            </button>
            {message && <p className="text-xs text-cyan-400 font-mono">{message}</p>}
          </div>
        </div>
      )}

      {/* LIVE EARNINGS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Live Earnings Feed Audit
            </h3>
            <p className="text-xs text-slate-400">
              Review genuine earnings records. Hide or show completed rewards on the public site.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            {earnings.length} Records Loaded
          </span>
        </div>

        {earnings.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No completed paid rewards recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Partner (Masked)</th>
                  <th className="p-3">Deal / Campaign</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Reward Paid</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Public Ticker</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {earnings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <span className="font-mono text-cyan-300 font-bold block">{item.maskedIdentity}</span>
                      <span className="text-[10px] text-slate-500">{item.rawPartnerName}</span>
                    </td>
                    <td className="p-3 max-w-[200px] truncate font-medium text-white">
                      {item.dealTitle}
                    </td>
                    <td className="p-3">
                      {item.dealType === 'INTERNATIONAL' ? (
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-mono text-[10px]">
                          🌍 INT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full font-mono text-[10px]">
                          🇹🇿 LOCAL
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">{item.category}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      {item.currency} {item.amount.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {item.showInFeed !== false ? (
                        <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Visible
                        </span>
                      ) : (
                        <span className="text-rose-400 text-[11px] font-semibold flex items-center gap-1">
                          <EyeOff className="w-3.5 h-3.5" /> Hidden
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() => toggleVisibility(item.id, item.showInFeed !== false)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition ${
                          item.showInFeed !== false
                            ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                        }`}
                      >
                        {updatingId === item.id
                          ? 'Updating...'
                          : item.showInFeed !== false
                          ? 'Hide from feed'
                          : 'Show in feed'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
