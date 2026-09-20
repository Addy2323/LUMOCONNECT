'use client'

import React, { useState } from 'react'
import {
  X,
  Users,
  CheckCircle2,
  Send,
  Globe,
  Sparkles,
} from 'lucide-react'
import { ISO_COUNTRIES } from '@/modules/international/countries'

interface JvPartnersModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function JvPartnersModal({ isOpen, onClose, onSuccess }: JvPartnersModalProps) {
  const [companyName, setCompanyName] = useState('')
  const [countryCode, setCountryCode] = useState('AE')
  const [sector, setSector] = useState('MANUFACTURING')
  const [whatWeBring, setWhatWeBring] = useState<string[]>(['Technology', 'Capital'])
  const [capitalAvailable, setCapitalAvailable] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [partnerCountryRequired, setPartnerCountryRequired] = useState('TZ')
  const [partnerShouldProvide, setPartnerShouldProvide] = useState<string[]>([
    'Local market access',
    'Licences',
  ])
  const [targetProject, setTargetProject] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const toggleWhatWeBring = (val: string) => {
    setWhatWeBring((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    )
  }

  const togglePartnerShouldProvide = (val: string) => {
    setPartnerShouldProvide((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!companyName.trim() || !targetProject.trim()) {
      setErrorMsg('Please complete company name and target project details.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/international/jv-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          countryCode,
          sector,
          whatWeBring,
          capitalAvailableMinor: capitalAvailable ? Math.round(parseFloat(capitalAvailable) * 100) : 0,
          currency,
          partnerCountryRequired,
          partnerShouldProvide,
          targetProject,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit JV partner request')
      }

      setSubmitted(true)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting JV request')
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
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Find Joint Venture Partners</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Structure cross-border JV alliances with verified partners
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
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">JV Request Registered</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                LUMO International Desk has received your JV parameters and will execute matching against active partner dossiers.
              </p>
              <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">
                Close
              </button>
            </div>
          ) : (
            <form id="jv-partners-form" onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && <div className="text-xs text-red-600">{errorMsg}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gulf Solar Tech FZE"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Home Country
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
                    Target Partner Country
                  </label>
                  <select
                    value={partnerCountryRequired}
                    onChange={(e) => setPartnerCountryRequired(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {ISO_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  What Your Side Brings to the JV
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Capital', 'Technology', 'Equipment', 'Brand', 'IP', 'Distribution', 'Expertise'].map((item) => {
                    const selected = whatWeBring.includes(item)
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleWhatWeBring(item)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          selected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {selected ? '✓ ' : ''}{item}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  What the Local Partner Should Provide
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Local market access', 'Land', 'Distribution', 'Licences', 'Customer network', 'Manufacturing', 'Regulatory support'].map((item) => {
                    const selected = partnerShouldProvide.includes(item)
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => togglePartnerShouldProvide(item)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          selected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {selected ? '✓ ' : ''}{item}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target JV Project Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline the planned joint venture entity, proposed revenue split, and operational scope..."
                  value={targetProject}
                  onChange={(e) => setTargetProject(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
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
              form="jv-partners-form"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md active:scale-[0.99] transition-all"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting JV Request...' : 'Submit Joint Venture Request'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
