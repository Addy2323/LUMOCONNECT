'use client'

import React, { useState } from 'react'
import {
  X,
  Building2,
  Lock,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Send,
} from 'lucide-react'
import { ISO_COUNTRIES } from '@/modules/international/countries'

interface BusinessSaleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function BusinessSaleModal({ isOpen, onClose, onSuccess }: BusinessSaleModalProps) {
  const [teaserTitle, setTeaserTitle] = useState('')
  const [countryCode, setCountryCode] = useState('TZ')
  const [sector, setSector] = useState('HOSPITALITY')
  const [askingPrice, setAskingPrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [annualRevenue, setAnnualRevenue] = useState('')
  const [ebitda, setEbitda] = useState('')
  const [reasonForSale, setReasonForSale] = useState('')
  const [confidentialNotes, setConfidentialNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!teaserTitle.trim() || !askingPrice) {
      setErrorMsg('Please enter teaser title and asking price.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/international/businesses-for-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teaserTitle,
          countryCode,
          sector,
          askingPriceMinor: Math.round(parseFloat(askingPrice) * 100),
          currency,
          annualRevenueMinor: annualRevenue ? Math.round(parseFloat(annualRevenue) * 100) : null,
          ebitdaMinor: ebitda ? Math.round(parseFloat(ebitda) * 100) : null,
          reasonForSale,
          confidentialNotes,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit business sale listing')
      }

      setSubmitted(true)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting business listing')
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
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">List Business for Sale</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confidential listing protected by NDA & LUMO Intermediary Desk
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
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confidential Listing Submitted</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Your company identity is anonymized. Interested buyers must accept an NDA before requesting unredacted financial dossiers.
              </p>
              <button onClick={onClose} className="px-6 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl">
                Close
              </button>
            </div>
          ) : (
            <form id="business-sale-form" onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && <div className="text-xs text-red-600">{errorMsg}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confidential Teaser Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Established Beach Resort & Eco-Lodge in Zanzibar"
                  value={teaserTitle}
                  onChange={(e) => setTeaserTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Country
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
                    Industry Sector
                  </label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="HOSPITALITY">Hospitality & Tourism</option>
                    <option value="MANUFACTURING">Manufacturing & Industrial</option>
                    <option value="RETAIL">Retail & Distribution</option>
                    <option value="SERVICES">Logistics & Transportation</option>
                    <option value="AGRICULTURE">Farming & Processing</option>
                    <option value="TECHNOLOGY">Tech & Telecoms</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Asking Price *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 2800000"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Annual Revenue
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1200000"
                    value={annualRevenue}
                    onChange={(e) => setAnnualRevenue(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
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
                    <option value="TZS">TZS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Sale & Operational Highlights
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize asset base, staff retention, long-term lease terms, or expansion motives..."
                  value={reasonForSale}
                  onChange={(e) => setReasonForSale(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 rounded-xl text-xs text-purple-800 dark:text-purple-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Your exact company name, location address, and owner contact remain completely hidden until you approve an NDA request.</span>
              </div>
            </form>
          )}
        </div>

        {/* Sticky Action Footer */}
        {!submitted && (
          <div className="p-3 sm:px-6 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shrink-0 sticky bottom-0 z-10">
            <button
              type="submit"
              form="business-sale-form"
              disabled={submitting}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md active:scale-[0.99] transition-all"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting Listing...' : 'Publish Confidential Sale Listing'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
