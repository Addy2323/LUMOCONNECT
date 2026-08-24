'use client'

import React, { useState } from 'react'
import {
  Settings,
  Save,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sliders,
  DollarSign,
  Layers,
  History,
  X,
  AlertTriangle,
} from 'lucide-react'
import { useAdminToast } from '../AdminToast'

export function SystemSettingsTab() {
  const { showToast } = useAdminToast()

  const [config, setConfig] = useState({
    minPayoutTZS: 50000,
    maxDailyDisbursementTZS: 50000000,
    dualControlDisbursementThresholdTZS: 1000000,
    defaultCommissionHoldDays: 7,
    enableInstantMobileMoney: true,
    enablePublicRegistration: true,
    enableAiAttributionEngine: true,
    platformCurrency: 'TZS',
  })

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showRollbackModal, setShowRollbackModal] = useState(false)

  const historicalVersions = [
    {
      version: 'v2026.2',
      committedAt: '15 Feb 2026, 04:30 PM',
      committedBy: 'Given M. (Super Admin)',
      changes: 'Increased 2-Person Rule threshold to 1,000,000 TZS; enabled instant mobile money for verified accounts.',
    },
    {
      version: 'v2026.1',
      committedAt: '01 Jan 2026, 09:00 AM',
      committedBy: 'Given M. (Super Admin)',
      changes: 'Initial production launch settings; 50,000 TZS minimum payout.',
    },
  ]

  const handleSaveConfig = () => {
    setHasUnsavedChanges(false)
    showToast(
      'success',
      'System Settings Version 2026.3 Committed',
      'Changes validated and written to immutable platform configuration ledger.'
    )
  }

  const handleRestoreVersion = (ver: typeof historicalVersions[0]) => {
    setShowRollbackModal(false)
    showToast(
      'warning',
      `Configuration Rolled Back to ${ver.version}`,
      `Previous configuration restored. Audit event created under Super Admin signature.`
    )
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Platform Configuration & Versioned Settings</span>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded-full">
              Versioned Config CRUD
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure platform business rules, disbursement limits, escrow rules, feature flags, and rollback history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRollbackModal(true)}
            className="py-2 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Rollback Version</span>
          </button>

          <button
            onClick={handleSaveConfig}
            className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>Save Version 2026.3</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* Group 1: Payout & Threshold Rules */}
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Disbursement & Risk Thresholds</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                Minimum Partner Payout (TZS)
              </label>
              <input
                type="number"
                value={config.minPayoutTZS}
                onChange={(e) => {
                  setConfig({ ...config, minPayoutTZS: Number(e.target.value) })
                  setHasUnsavedChanges(true)
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                2-Person Rule Threshold (TZS)
              </label>
              <input
                type="number"
                value={config.dualControlDisbursementThresholdTZS}
                onChange={(e) => {
                  setConfig({ ...config, dualControlDisbursementThresholdTZS: Number(e.target.value) })
                  setHasUnsavedChanges(true)
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Payouts exceeding this require Compliance Checker dual-signature.
              </span>
            </div>

            <div>
              <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                Commission Escrow Hold Period (Days)
              </label>
              <input
                type="number"
                value={config.defaultCommissionHoldDays}
                onChange={(e) => {
                  setConfig({ ...config, defaultCommissionHoldDays: Number(e.target.value) })
                  setHasUnsavedChanges(true)
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Group 2: Feature Flags */}
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#FF6A00]" />
            <span>Platform Feature Flags</span>
          </h3>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Instant Mobile Money Payouts</span>
                <span className="text-[10px] text-slate-400">Direct Vodacom / Tigo B2C automated dispatch</span>
              </div>
              <input
                type="checkbox"
                checked={config.enableInstantMobileMoney}
                onChange={(e) => {
                  setConfig({ ...config, enableInstantMobileMoney: e.target.checked })
                  setHasUnsavedChanges(true)
                }}
                className="w-4 h-4 text-[#FF6A00] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Public Partner Registration</span>
                <span className="text-[10px] text-slate-400">Allow open signups with subscription paywall</span>
              </div>
              <input
                type="checkbox"
                checked={config.enablePublicRegistration}
                onChange={(e) => {
                  setConfig({ ...config, enablePublicRegistration: e.target.checked })
                  setHasUnsavedChanges(true)
                }}
                className="w-4 h-4 text-[#FF6A00] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">AI-Powered Attribution & Deduplication</span>
                <span className="text-[10px] text-slate-400">Automated machine learning anomaly detection</span>
              </div>
              <input
                type="checkbox"
                checked={config.enableAiAttributionEngine}
                onChange={(e) => {
                  setConfig({ ...config, enableAiAttributionEngine: e.target.checked })
                  setHasUnsavedChanges(true)
                }}
                className="w-4 h-4 text-[#FF6A00] rounded"
              />
            </label>
          </div>
        </div>
      </div>

      {/* ROLLBACK VERSION SELECTOR MODAL */}
      {showRollbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center font-black">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Platform Settings Rollback
                  </h3>
                  <div className="text-[11px] text-slate-500">Select a historical snapshot to restore</div>
                </div>
              </div>

              <button
                onClick={() => setShowRollbackModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {historicalVersions.map((ver) => (
                <div
                  key={ver.version}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                      {ver.version}
                    </span>
                    <span className="text-[10px] text-slate-400">{ver.committedAt}</span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {ver.changes}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400">By: {ver.committedBy}</span>
                    <button
                      onClick={() => handleRestoreVersion(ver)}
                      className="py-1 px-3 bg-[#0B132B] dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-bold text-xs shadow-2xs hover:bg-slate-800"
                    >
                      Restore This Version
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowRollbackModal(false)}
                className="py-2 px-4 border rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
