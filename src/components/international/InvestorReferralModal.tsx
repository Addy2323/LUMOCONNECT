'use client'

import React, { useState } from 'react'
import {
  X,
  UserCheck,
  CheckCircle2,
  Send,
  ShieldCheck,
  Lock,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react'
import { ISO_COUNTRIES } from '@/modules/international/countries'

interface InvestorReferralModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
  opportunityId?: string
  opportunityTitle?: string
  onSuccess?: (introReference: string) => void
}

export function InvestorReferralModal({
  isOpen,
  onClose,
  currentUserId,
  opportunityId,
  opportunityTitle,
  onSuccess,
}: InvestorReferralModalProps) {
  const [investorEntityName, setInvestorEntityName] = useState('')
  const [investorType, setInvestorType] = useState('FAMILY_OFFICE')
  const [countryCode, setCountryCode] = useState('AE')
  const [relationshipType, setRelationshipType] = useState('DIRECT_REPRESENTATIVE')
  const [estimatedBudget, setEstimatedBudget] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [mandateNotes, setMandateNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [introReference, setIntroReference] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!investorEntityName.trim() || !estimatedBudget) {
      setErrorMsg('Please provide the investor name/alias and estimated capital capacity.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/international/introductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerUserId: currentUserId,
          opportunityId,
          investorEntityName,
          investorType,
          countryCode,
          relationshipType,
          estimatedBudgetMinor: Math.round(parseFloat(estimatedBudget) * 100),
          currency,
          mandateNotes,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to register investor referral.')
      }

      setIntroReference(data.reference)
      if (onSuccess) onSuccess(data.reference)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting investor referral.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = () => {
    if (introReference) {
      navigator.clipboard.writeText(introReference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-16 sm:pb-0 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-xl bg-white dark:bg-[#0B1220] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">I Have an Investor</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutably attribute partner commission for investor introductions
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

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 pb-28 sm:pb-6 overflow-y-auto flex-1">
          {introReference ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-950/40 text-green-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Investor Referral Pipeline Created
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Your investor introduction is immutably tied to your LUMO Partner account. All future deal room progress and commissions will be attributed to you.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md mx-auto">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                  Introduction Pipeline Reference
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-base font-black text-[#FF6A00]">
                    {introReference}
                  </span>
                  <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-slate-600">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button onClick={onClose} className="px-6 py-2 bg-[#FF6A00] text-white text-xs font-bold rounded-xl">
                Done & Close
              </button>
            </div>
          ) : (
            <form id="investor-referral-form" onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && <div className="text-xs text-red-600">{errorMsg}</div>}

              {opportunityTitle && (
                <div className="p-3 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
                  Target Opportunity: <span className="text-[#FF6A00]">{opportunityTitle}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Investor Entity Name / Alias *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Maktoum Capital Holding"
                    value={investorEntityName}
                    onChange={(e) => setInvestorEntityName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Investor Category
                  </label>
                  <select
                    value={investorType}
                    onChange={(e) => setInvestorType(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="FAMILY_OFFICE">Family Office</option>
                    <option value="PRIVATE_EQUITY">Private Equity Fund</option>
                    <option value="VENTURE_CAPITAL">Venture Capital</option>
                    <option value="SOVEREIGN_FUND">Sovereign Wealth Fund</option>
                    <option value="DFI">Development Finance Institution (DFI)</option>
                    <option value="HIGH_NET_WORTH">High Net Worth Individual (HNW)</option>
                    <option value="CORPORATE">Corporate Strategic Investor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Investor Location Country
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
                    Your Relationship with Investor
                  </label>
                  <select
                    value={relationshipType}
                    onChange={(e) => setRelationshipType(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="DIRECT_REPRESENTATIVE">Direct Authorized Representative</option>
                    <option value="ADVISOR">Financial / Legal Advisor</option>
                    <option value="REFERRAL_PARTNER">Referral Partner</option>
                    <option value="MANDATED_BROKER">Mandated Broker</option>
                    <option value="PERSONAL_NETWORK">Personal Network Connection</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Investment Budget *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10000000"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(e.target.value)}
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

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mandate Notes & Expected Terms
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail ticket size preferences, required ROI, or governance requirements..."
                  value={mandateNotes}
                  onChange={(e) => setMandateNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                🛡️ <strong>Partner Attribution Protection</strong>: Once created, LUMO Desk will coordinate the introduction while preserving your originating partner commission rights.
              </div>
            </form>
          )}
        </div>

        {/* Sticky Action Footer */}
        {!introReference && (
          <div className="p-3 sm:px-6 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shrink-0 sticky bottom-0 z-10">
            <button
              type="submit"
              form="investor-referral-form"
              disabled={submitting}
              className="w-full py-3 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md active:scale-[0.99] transition-all"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Registering Pipeline...' : 'Create Investor Referral Pipeline'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
