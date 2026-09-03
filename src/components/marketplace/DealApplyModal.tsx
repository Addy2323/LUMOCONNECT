'use client'

import React, { useState } from 'react'
import { X, CheckCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import type { OpportunityItem } from '@/modules/deals/types'
import { createTrackingLink } from '@/modules/tracking/service'

interface DealApplyModalProps {
  deal: OpportunityItem | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (code: string) => void
}

export function DealApplyModal({ deal, isOpen, onClose, onSuccess }: DealApplyModalProps) {
  const [proposal, setProposal] = useState('')
  const [channel, setChannel] = useState('WHATSAPP')
  const [customCode, setCustomCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [createdLink, setCreatedLink] = useState<{ code: string; qrCode: string; url: string } | null>(null)

  if (!isOpen || !deal) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const link = await createTrackingLink({
        opportunityId: deal.id,
        dealId: `deal_${deal.id}`,
        partnerId: 'partner_alex',
        campaignName: `${deal.companyName} Promotion`,
        destinationUrl: `https://lumo.co.tz/d/${deal.slug}`,
        customCode: customCode || undefined,
      })

      setCreatedLink({
        code: link.code,
        qrCode: link.qrCodeDataUrl,
        url: link.destinationUrl,
      })
      onSuccess(link.code)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {createdLink ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              You are now enrolled in this Deal!
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Your unique tracking link and QR code have been created. Money follows genuine and verified transactions.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-5 text-left">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Your Tracking Code
              </div>
              <div className="font-mono text-base font-bold text-orange-600 dark:text-orange-400 mb-3">
                {createdLink.code}
              </div>

              {createdLink.qrCode && (
                <div className="flex items-center gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={createdLink.qrCode}
                    alt="Tracking QR Code"
                    className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-600 shadow-xs"
                  />
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white mb-1">Scan or Share</p>
                    <p className="text-[11px] text-slate-500">
                      Share via WhatsApp, print on flyers, or place in creator bio links.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
            >
              Done & View in Partner Dashboard
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Commercial Partner Enrollment</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Apply for {deal.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Offered by <strong>{deal.companyName}</strong> · Reward:{' '}
              <span className="text-orange-600 font-bold">{deal.rewardDisplay}</span> ({deal.rewardDetail})
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Promotional Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="WHATSAPP">WhatsApp Status & Direct Client Messaging</option>
                  <option value="INSTAGRAM">Instagram / TikTok Video Content</option>
                  <option value="B2B_NETWORK">Direct B2B Executive Introductions</option>
                  <option value="WEBSITE">Website & Newsletter Audience</option>
                  <option value="PHYSICAL">Physical POS / Community Hub</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Promo Code (Optional)
                </label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="e.g. ALEX2026"
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brief Pitch / Target Audience Notes
                </label>
                <textarea
                  rows={3}
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  placeholder="Describe your audience or prospective buyers..."
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  LUMO tracks conversions through verifiable economic events. Self-referrals and artificial traffic are monitored by risk algorithms.
                </span>
              </div>

              <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 p-3 text-[11px] text-slate-600 dark:border-slate-700 dark:text-slate-300">
                <input type="checkbox" required checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#FF6A00]" />
                <span>I understand and accept these commercial terms</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !termsAccepted}
                  className="w-1/2 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? 'Generating Links...' : 'Accept & Get Link'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
