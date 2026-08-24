'use client'

import React, { useState } from 'react'
import {
  BarChart3,
  Search,
  Upload,
  RefreshCw,
  QrCode,
  Link,
  Code,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Webhook,
  ArrowUpRight,
  Shield,
  Layers,
  Edit,
} from 'lucide-react'
import { MOCK_CONVERSIONS } from '../mockData'
import { ConversionRecord } from '../types'
import { useAdminToast } from '../AdminToast'

export function ConversionsAttributionTab() {
  const { showToast } = useAdminToast()
  const [conversions, setConversions] = useState<ConversionRecord[]>(MOCK_CONVERSIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [showCsvUpload, setShowCsvUpload] = useState(false)
  const [adjustmentModal, setAdjustmentModal] = useState<ConversionRecord | null>(null)
  const [adjustmentReason, setAdjustmentReason] = useState('')

  const filtered = conversions.filter((c) => {
    const matchesSearch =
      c.dealTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.referenceId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesChannel = channelFilter === 'ALL' || c.channel === channelFilter
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter
    return matchesSearch && matchesChannel && matchesStatus
  })

  const handleReprocess = (id: string) => {
    setConversions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, webhookStatus: 'DELIVERED', status: 'VERIFIED' } : c))
    )
    showToast('success', 'Webhook Reprocessed', 'Reprocessed webhook event. Attribution confirmed.')
  }

  const handleApplyAdjustment = () => {
    if (!adjustmentModal || !adjustmentReason.trim()) return
    setConversions((prev) =>
      prev.map((c) =>
        c.id === adjustmentModal.id ? { ...c, status: 'ADJUSTED' } : c
      )
    )
    showToast('info', 'Attribution Adjusted', `Attribution adjusted for ${adjustmentModal.referenceId}. Reason: "${adjustmentReason}".`)
    setAdjustmentModal(null)
    setAdjustmentReason('')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Conversions, Evidence & Attribution Engine</span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded-full">
              Platform Evidence
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of clicks, referrals, QR scans, API webhooks, duplicate detection and controlled attribution adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCsvUpload(true)}
            className="py-2 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV Transactions</span>
          </button>
        </div>
      </div>

      {/* 4 Attribution Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Tracked Conversions (30D)</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">4,812</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">98.9% Clean Attribution</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-400 uppercase">QR Code Scans</div>
          <div className="text-2xl font-black text-[#FF6A00] mt-1">1,940</div>
          <div className="text-[10px] text-slate-500 mt-1">Physical retail & packaging</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Duplicate Flags Caught</div>
          <div className="text-2xl font-black text-red-600 mt-1">14</div>
          <div className="text-[10px] text-red-600 font-bold mt-1">Blocked from Escrow</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Webhook Delivery Health</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">99.9%</div>
          <div className="text-[10px] text-slate-500 mt-1">Mean latency: 84ms</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by reference ID, deal, or partner name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="ALL">All Attribution Channels</option>
            <option value="AFFILIATE_LINK">Affiliate Link</option>
            <option value="PROMO_CODE">Promo Code</option>
            <option value="QR_SCAN">QR Scan (Physical)</option>
            <option value="MERCHANT_API">Merchant Webhook API</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="ALL">All Attribution Statuses</option>
            <option value="VERIFIED">Verified (Clean)</option>
            <option value="TRACKED">Tracked (Pending)</option>
            <option value="DUPLICATE_FLAGGED">Duplicate Flagged</option>
            <option value="ADJUSTED">Adjusted</option>
          </select>
        </div>
      </div>

      {/* Conversions Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">Reference & Deal</th>
              <th className="p-3">Partner Code</th>
              <th className="p-3">Channel</th>
              <th className="p-3">Order / Commission</th>
              <th className="p-3">Webhook Status</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="p-3">
                  <div className="font-extrabold text-slate-900 dark:text-white font-mono">{c.referenceId}</div>
                  <div className="text-[11px] text-slate-500">{c.dealTitle}</div>
                  <div className="text-[10px] text-slate-400 font-mono">IP: {c.ipAddress} · {c.timestamp}</div>
                </td>

                <td className="p-3">
                  <div className="font-bold text-slate-900 dark:text-white">{c.partnerName}</div>
                  <div className="text-[10px] text-blue-600 font-mono font-bold">{c.partnerCode}</div>
                </td>

                <td className="p-3">
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md font-bold text-[10px] flex items-center gap-1 w-fit">
                    {c.channel === 'QR_SCAN' && <QrCode className="w-3 h-3 text-[#FF6A00]" />}
                    {c.channel === 'AFFILIATE_LINK' && <Link className="w-3 h-3 text-blue-500" />}
                    {c.channel === 'MERCHANT_API' && <Code className="w-3 h-3 text-purple-500" />}
                    <span>{c.channel}</span>
                  </span>
                </td>

                <td className="p-3 font-mono">
                  <div className="text-slate-900 dark:text-white font-bold">
                    TZS {c.amountTZS.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#FF6A00] font-bold">
                    Commission: TZS {c.commissionTZS.toLocaleString()}
                  </div>
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      c.webhookStatus === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {c.webhookStatus}
                  </span>
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      c.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : c.status === 'DUPLICATE_FLAGGED'
                        ? 'bg-red-100 text-red-700'
                        : c.status === 'ADJUSTED'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {c.status}
                  </span>
                </td>

                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {c.webhookStatus === 'FAILED' && (
                      <button
                        onClick={() => handleReprocess(c.id)}
                        className="py-1 px-2.5 bg-orange-50 text-[#FF6A00] border border-orange-200 rounded-lg text-xs font-bold hover:bg-orange-100 flex items-center gap-1"
                        title="Reprocess Failed Webhook"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}

                    <button
                      onClick={() => setAdjustmentModal(c)}
                      className="py-1 px-2 border rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold"
                      title="Adjust Attribution"
                    >
                      Adjust
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CSV UPLOAD MODAL */}
      {showCsvUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Import Offline / Merchant CSV Conversions</span>
            </h3>

            <p className="text-xs text-slate-500">
              Upload point-of-sale offline transactions or batch invoices for automated voucher reconciliation.
            </p>

            <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-2">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Drag and drop CSV transaction sheet
              </div>
              <div className="text-[10px] text-slate-400">
                Columns: date, partner_code, customer_ref, amount_tzs, deal_id
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  showToast('success', 'CSV Batch Processed', '128 transactions imported and attributed.')
                  setShowCsvUpload(false)
                }}
                className="flex-1 py-2.5 bg-[#FF6A00] text-white font-extrabold rounded-xl text-xs"
              >
                Upload & Process Batch
              </button>
              <button
                onClick={() => setShowCsvUpload(false)}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {adjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Edit className="w-5 h-5 text-[#FF6A00]" />
              <span>Controlled Attribution Adjustment</span>
            </h3>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Reference: <strong>{adjustmentModal.referenceId}</strong> ({adjustmentModal.partnerName})
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold block">
                Audited Reason for Attribution Adjustment <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Correcting partner attribution code following customer support confirmation..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleApplyAdjustment}
                className="flex-1 py-2.5 bg-[#0B132B] dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold rounded-xl text-xs"
              >
                Save & Sign Adjustment
              </button>
              <button
                onClick={() => setAdjustmentModal(null)}
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
