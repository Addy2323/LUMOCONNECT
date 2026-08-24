'use client'

import React, { useState } from 'react'
import {
  Receipt,
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Edit,
  X,
  QrCode,
} from 'lucide-react'
import { MOCK_TAX_RULES } from '../mockData'
import { TaxRuleConfig } from '../types'
import { useAdminToast } from '../AdminToast'

export function TaxStatementsTab() {
  const { showToast } = useAdminToast()

  const [taxRules, setTaxRules] = useState<TaxRuleConfig[]>(MOCK_TAX_RULES)
  const [showAddRuleModal, setShowAddRuleModal] = useState(false)
  const [showTaxCertModal, setShowTaxCertModal] = useState(false)

  const [newRuleForm, setNewRuleForm] = useState({
    code: 'TRA_WITHHOLDING_LOCAL',
    title: '',
    ratePercent: 5.0,
    applicableTo: 'PARTNER_COMMISSION' as const,
    effectiveFrom: '2026-03-01',
    authority: 'TRA' as const,
  })

  // Simulated statement calculation
  const [simulatedGross, setSimulatedGross] = useState(1000000)
  const activeRate = taxRules.find((r) => r.code === 'TRA_WITHHOLDING_5')?.ratePercent || 5.0
  const withholdingAmount = (simulatedGross * activeRate) / 100
  const netEarnings = simulatedGross - withholdingAmount

  const handleAddRule = () => {
    if (!newRuleForm.title) {
      showToast('error', 'Validation Error', 'Tax Rule Title is required.')
      return
    }
    const rule: TaxRuleConfig = {
      id: `tax_${Date.now()}`,
      code: newRuleForm.code,
      title: newRuleForm.title,
      ratePercent: Number(newRuleForm.ratePercent),
      applicableTo: newRuleForm.applicableTo,
      effectiveFrom: newRuleForm.effectiveFrom,
      authority: newRuleForm.authority,
      isActive: true,
    }
    setTaxRules([...taxRules, rule])
    setShowAddRuleModal(false)
    showToast('success', 'Statutory Tax Rule Registered', `Rule "${rule.title}" set to ${rule.ratePercent}% effective from ${rule.effectiveFrom}.`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Tax Compliance, Withholding & Statutory Statements</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
              TRA 5% & Rules
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure effective-dated statutory tax classifications, generate Partner tax receipts, and export TRA compliance reports.
          </p>
        </div>

        <button
          onClick={() => setShowAddRuleModal(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tax Rule Version</span>
        </button>
      </div>

      {/* Tax Rates Configuration Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Effective-Dated Statutory Rules (Tanzania Revenue Authority)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {taxRules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border text-slate-600 dark:text-slate-300">
                      {rule.code}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1.5 leading-tight">
                      {rule.title}
                    </h4>
                  </div>

                  <span className="text-xl font-black text-emerald-600 font-mono">
                    {rule.ratePercent}%
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span>Applicable Target:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{rule.applicableTo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Effective Since:</span>
                    <span className="font-mono">{rule.effectiveFrom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Statutory Authority:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{rule.authority}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enforced in Code
                </span>
                <span className="text-[10px] text-slate-400">Version 2026.1</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Gross-to-Net Calculator & Statement Preview */}
      <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Interactive Gross-to-Net Statement Simulation</span>
          </div>

          <button
            onClick={() => setShowTaxCertModal(true)}
            className="py-1.5 px-3 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 hover:bg-emerald-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate Tax Certificate</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/60">
            <label className="font-bold text-slate-500 block mb-1">Simulate Gross Partner Earnings (TZS)</label>
            <input
              type="number"
              value={simulatedGross}
              onChange={(e) => setSimulatedGross(Number(e.target.value))}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-base"
            />
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/60">
            <div className="font-bold text-slate-500">TRA 5% Withholding Deducted</div>
            <div className="text-lg font-black text-emerald-600 font-mono mt-1">
              - TZS {withholdingAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Remitted to TRA with TIN receipt</div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/60">
            <div className="font-bold text-slate-500">Net Partner Mobile Money Payout</div>
            <div className="text-lg font-black text-[#FF6A00] font-mono mt-1">
              TZS {netEarnings.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Direct to Vodacom / Tigo / Airtel</div>
          </div>
        </div>
      </div>

      {/* TRA WITHHOLDING TAX CERTIFICATE MODAL */}
      {showTaxCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Official TRA Withholding Tax Certificate
                </h3>
                <div className="text-[11px] text-slate-500 font-mono">Certificate Ref: TRA-TZ-2026-W08-8841</div>
              </div>
              <button onClick={() => setShowTaxCertModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-slate-900 dark:text-white">Withholding Entity:</span>
                <span>LotusRise Company Limited (LUMO)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Remuneration:</span>
                <span className="font-mono font-bold">TZS {simulatedGross.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Withholding Tax Rate:</span>
                <span>5.0% Statutory</span>
              </div>
              <div className="flex justify-between font-mono font-bold text-emerald-600">
                <span>Total Tax Remitted to TRA:</span>
                <span>TZS {withholdingAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-black text-[#FF6A00]">
                <span>Net Partner Disbursement:</span>
                <span>TZS {netEarnings.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowTaxCertModal(false)
                  showToast('success', 'Tax Certificate Generated', 'Official TRA withholding certificate downloaded (PDF).')
                }}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Signed Certificate</span>
              </button>
              <button onClick={() => setShowTaxCertModal(false)} className="py-2 px-4 border rounded-xl text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TAX RULE MODAL */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span>Register Effective-Dated Tax Rule</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Rule Title & Legal Citation</label>
                <input
                  type="text"
                  placeholder="e.g. TRA Statutory Commission Withholding 2026"
                  value={newRuleForm.title}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRuleForm.ratePercent}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, ratePercent: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={newRuleForm.effectiveFrom}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, effectiveFrom: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddRule}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl text-xs"
              >
                Save & Enforce Tax Rule
              </button>
              <button
                onClick={() => setShowAddRuleModal(false)}
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
