'use client'

import React, { useState } from 'react'
import {
  X,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Send,
  Sparkles,
} from 'lucide-react'
import { ISO_COUNTRIES } from '@/modules/international/countries'

interface FindInvestorsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function FindInvestorsModal({ isOpen, onClose, onSuccess }: FindInvestorsModalProps) {
  const [projectName, setProjectName] = useState('')
  const [countryCode, setCountryCode] = useState('TZ')
  const [sector, setSector] = useState('ENERGY')
  const [capitalRequired, setCapitalRequired] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [purpose, setPurpose] = useState('')
  const [structure, setStructure] = useState('EQUITY')
  const [equityAvailable, setEquityAvailable] = useState('')
  const [sponsorContribution, setSponsorContribution] = useState('')
  const [preferredInvestorType, setPreferredInvestorType] = useState('PRIVATE_EQUITY')
  const [targetMarket, setTargetMarket] = useState('')
  const [timeline, setTimeline] = useState('IMMEDIATE')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!projectName.trim() || !capitalRequired) {
      setErrorMsg('Please enter your project name and required capital.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/international/find-investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          countryCode,
          sector,
          capitalRequiredMinor: Math.round(parseFloat(capitalRequired) * 100),
          currency,
          purpose,
          structure,
          equityAvailable: parseFloat(equityAvailable) || 0,
          sponsorContribution,
          preferredInvestorType,
          targetMarket,
          timeline,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit investor request')
      }

      setSubmitted(true)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-16 sm:pb-0 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-xl bg-white dark:bg-[#0B1220] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Find Investors</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submit capital requirements to LUMO's global investor matching syndicate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 pb-28 sm:pb-6 overflow-y-auto flex-1">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mandate Submitted to LUMO Deal Desk</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Your capital request has been registered. LUMO International coordinators will review your dossier and initiate investor matching.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          ) : (
            <form id="find-investors-form" onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && <div className="text-xs text-red-600">{errorMsg}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Project / Business Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Serengeti Solar Hybrid Microgrid"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Country *
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {ISO_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sector *
                  </label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="ENERGY">Energy & Renewables</option>
                    <option value="AGRICULTURE">Agribusiness & Processing</option>
                    <option value="INFRASTRUCTURE">Infrastructure & Logistics</option>
                    <option value="REAL_ESTATE">Real Estate & Hospitality</option>
                    <option value="TECHNOLOGY">Fintech & Technology</option>
                    <option value="MANUFACTURING">Manufacturing & Mining</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Capital Required *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5000000"
                    value={capitalRequired}
                    onChange={(e) => setCapitalRequired(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AED">AED</option>
                    <option value="TZS">TZS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Investment Structure
                  </label>
                  <select
                    value={structure}
                    onChange={(e) => setStructure(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="EQUITY">Equity Investment</option>
                    <option value="DEBT">Debt / Loan</option>
                    <option value="JOINT_VENTURE">Joint Venture</option>
                    <option value="STRATEGIC">Strategic Partner</option>
                    <option value="CONVERTIBLE">Convertible Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Equity Offered %
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 25"
                    value={equityAvailable}
                    onChange={(e) => setEquityAvailable(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Purpose of Capital & Project Overview
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail project milestones, expected ROI, and allocation of capital..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </form>
          )}
        </div>

        {/* Sticky Action Footer */}
        {!submitted && (
          <div className="p-3 sm:px-6 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shrink-0 sticky bottom-0 z-10">
            <button
              type="submit"
              form="find-investors-form"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md active:scale-[0.99] transition-all"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting to LUMO Desk...' : 'Submit Capital Requirement Mandate'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
