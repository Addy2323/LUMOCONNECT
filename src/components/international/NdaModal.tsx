'use client'

import React, { useState } from 'react'
import {
  X,
  FileText,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Send,
  Building2,
} from 'lucide-react'

interface NdaModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
  opportunityId?: string
  businessSaleListingId?: string
  targetTitle?: string
  onNdaSigned?: (reference: string) => void
}

export function NdaModal({
  isOpen,
  onClose,
  currentUserId,
  opportunityId,
  businessSaleListingId,
  targetTitle,
  onNdaSigned,
}: NdaModalProps) {
  const [signerFullName, setSignerFullName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signerOrganization, setSignerOrganization] = useState('')
  const [signerTitle, setSignerTitle] = useState('')
  const [agreed, setAgreed] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [ndaRef, setNdaRef] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!agreed) {
      setErrorMsg('You must agree to the Non-Disclosure Agreement terms to proceed.')
      return
    }

    if (!signerFullName.trim() || !signerEmail.trim()) {
      setErrorMsg('Please enter your full name and email address.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/international/ndas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerUserId: currentUserId,
          opportunityId,
          businessSaleListingId,
          signerFullName,
          signerEmail,
          signerOrganization,
          signerTitle,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to execute NDA')
      }

      setNdaRef(data.reference)
      if (onNdaSigned) onNdaSigned(data.reference)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error signing NDA')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-16 sm:pb-0 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-xl bg-white dark:bg-[#0B1220] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#FF6A00]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Non-Disclosure Agreement (NDA)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                LUMO International Confidential Information Agreement
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
          {ndaRef ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">NDA Executed Successfully</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Agreement Reference: <span className="font-mono font-bold text-[#FF6A00]">{ndaRef}</span>
                  <br />
                  Data Room access and unredacted financial dossiers are now unlocked for your account.
                </p>
              </div>
              <button onClick={onClose} className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">
                Proceed to Data Room
              </button>
            </div>
          ) : (
            <form id="nda-form" onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && <div className="text-xs text-red-600">{errorMsg}</div>}

              {targetTitle && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Target Asset: <span className="text-[#FF6A00] font-bold">{targetTitle}</span>
                </div>
              )}

              {/* Standard Legal Text Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 max-h-40 overflow-y-auto space-y-2 font-mono">
                <p><strong>LUMO INTERNATIONAL MUTUAL NON-DISCLOSURE AGREEMENT</strong></p>
                <p>
                  1. <strong>Confidential Information</strong>: The receiving party agrees that all financial records, trade secrets, buyer identities, seller documents, and deal room materials provided via LUMO Intermediary Desk are strictly confidential.
                </p>
                <p>
                  2. <strong>Non-Circumvention</strong>: The receiving party shall not directly contact, negotiate with, or bypass LUMO Desk, the originating partner, or the seller without written authorization.
                </p>
                <p>
                  3. <strong>Governing Law</strong>: This electronic agreement is legally binding and recorded alongside IP timestamp verification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Signer Full Legal Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={signerFullName}
                    onChange={(e) => setSignerFullName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Signer Corporate Email *
                  </label>
                  <input
                    type="email"
                    placeholder="sarah@capital.com"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Organization / Fund
                  </label>
                  <input
                    type="text"
                    placeholder="Global Capital Partners"
                    value={signerOrganization}
                    onChange={(e) => setSignerOrganization(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Title / Position
                  </label>
                  <input
                    type="text"
                    placeholder="Managing Director"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#FF6A00] focus:ring-orange-500"
                />
                <span>
                  I declare under penalty of perjury that I am authorized to bind myself/my firm to this Non-Disclosure & Non-Circumvention Agreement.
                </span>
              </label>
            </form>
          )}
        </div>

        {/* Sticky Action Footer */}
        {!ndaRef && (
          <div className="p-3 sm:px-6 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shrink-0 sticky bottom-0 z-10">
            <button
              type="submit"
              form="nda-form"
              disabled={submitting || !agreed}
              className="w-full py-3 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md active:scale-[0.99] transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitting ? 'Executing NDA...' : 'Electronically Sign & Authorize NDA'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
