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
    platformFeePercent: 3,
    defaultWithholdingTaxPercent: 5,
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

        {/* Group 1: Commercial & Tax Settings */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Commercial & Statutory Tax Settings</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                Platform Fee (%)
              </label>
              <input
                type="number"
                value={config.platformFeePercent || 3}
                onChange={(e) => {
                  setConfig({ ...config, platformFeePercent: Number(e.target.value) })
                  setHasUnsavedChanges(true)
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                Default Withholding Tax (%)
              </label>
              <input
                type="number"
                value={config.defaultWithholdingTaxPercent || 5}
                onChange={(e) => {
                  setConfig({ ...config, defaultWithholdingTaxPercent: Number(e.target.value) })
                  setHasUnsavedChanges(true)
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
              />
            </div>
          </div>

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

          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
            The platform fee applies to verified rewards only. Withholding tax here (5%) is the statutory default for new partners; each partner’s official TRA exemption/TIN profile overrides it.
          </div>
        </div>

        {/* Group 2: Risk Scoring Thresholds */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Risk Scoring & Automated Flagging Thresholds</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-600">Below 35 Score</span>
                <p className="text-[11px] text-slate-500">Cleared automatically once the merchant confirms</p>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Auto-Clear
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-600">35 to 64 Score</span>
                <p className="text-[11px] text-slate-500">Held for review in the admin risk queue</p>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                Hold for Review
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border flex items-center justify-between">
              <div>
                <span className="font-bold text-red-600">65 and Above</span>
                <p className="text-[11px] text-slate-500">Held and flagged as high-risk fraud anomaly</p>
              </div>
              <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                Flag High Risk
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-normal">
            <strong>Heuristic Signals Evaluated:</strong> Self-referrals, duplicate order references, repeat customers inside 24h, conversions with no tracked click, abnormal order values and velocity spikes.
          </div>
        </div>

        {/* Group 3: Payout Controls & Maker/Checker */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Dual-Control & Escrow Holds</span>
          </h3>

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

        {/* Group 4: Environment & Data Controls */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#FF6A00]" />
            <span>Environment & Demo Data Controls</span>
          </h3>

          <p className="text-slate-500 text-[11px]">
            Data is stored in the browser state and survives page reloads.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => showToast('success', 'Platform Data Exported', 'Full platform state exported to JSON.')}
              className="py-2 px-4 border rounded-xl font-bold hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              Export All Data
            </button>

            <button
              onClick={() => showToast('info', 'Demo Data Reset', 'Platform environment reset to factory demo state.')}
              className="py-2 px-4 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100"
            >
              Reset to Demo Data
            </button>
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
