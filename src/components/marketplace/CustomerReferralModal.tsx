'use client'

import React, { useState } from 'react'
import {
  X,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  FileCheck2,
} from 'lucide-react'
import type { OpportunityItem } from '@/modules/deals/types'
import {
  submitCustomerReferral,
  getWhatsAppCoordinationUrl,
  isValidTanzanianPhone,
} from '@/modules/deals/referral-cases'
import { joinOpportunityDeal } from '@/modules/deals/service'
import { useLanguage } from '@/lib/i18n'

interface CustomerReferralModalProps {
  deal: OpportunityItem | null
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
  partnerName?: string
  partnerPhone?: string
  userRole?: string
  userOrgId?: string
  onReferralSubmitted?: (reference: string) => void
  onViewProgress?: () => void
}

export function CustomerReferralModal({
  deal,
  isOpen,
  onClose,
  currentUserId = 'alex',
  partnerName = 'Alex Mwakasege',
  partnerPhone = '+255712345678',
  userRole = 'PARTNER',
  userOrgId,
  onReferralSubmitted,
  onViewProgress,
}: CustomerReferralModalProps) {
  const { t, locale } = useLanguage()
  const [customerFirstName, setCustomerFirstName] = useState('')
  const [customerLastName, setCustomerLastName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [contactPermissionConfirmed, setContactPermissionConfirmed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(true)
  const [additionalNotes, setAdditionalNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submittedReference, setSubmittedReference] = useState<string | null>(null)

  if (!isOpen || !deal) return null

  const handleResetAndClose = () => {
    setCustomerFirstName('')
    setCustomerLastName('')
    setCustomerPhone('')
    setContactPermissionConfirmed(false)
    setAdditionalNotes('')
    setErrorMessage(null)
    setSubmittedReference(null)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!customerFirstName.trim() || !customerLastName.trim()) {
      setErrorMessage('Please provide the customer first and last name.')
      return
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Please enter the customer mobile phone number.')
      return
    }

    if (!isValidTanzanianPhone(customerPhone)) {
      setErrorMessage('Please enter a valid Tanzanian mobile phone number (e.g. 07XXXXXXXX or +2557XXXXXXXX).')
      return
    }

    if (!contactPermissionConfirmed) {
      setErrorMessage('You must confirm that the customer agreed to be contacted regarding this opportunity.')
      return
    }

    setIsSubmitting(true)

    // Inline terms acceptance / deal participation if not already joined
    joinOpportunityDeal(deal.id, {
      userId: currentUserId,
      userRole,
      userOrgId,
    })

    const result = submitCustomerReferral({
      dealId: deal.id,
      dealTitle: deal.title,
      dealSlug: deal.slug,
      partnerUserId: currentUserId,
      partnerName,
      partnerPhone,
      customerFirstName,
      customerLastName,
      customerPhone,
      contactPermissionConfirmed,
      additionalNotes,
      rewardAmountTZS: (deal as any).baseRewardValue || 50000,
      rewardDisplay: deal.rewardDisplay,
    })

    setIsSubmitting(false)

    if (!result.success || !result.referralCase) {
      setErrorMessage(result.message)
      return
    }

    setSubmittedReference(result.referralCase.reference)
    onReferralSubmitted?.(result.referralCase.reference)
  }

  const whatsAppUrl = submittedReference
    ? getWhatsAppCoordinationUrl(submittedReference, deal.title)
    : '#'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative overflow-y-auto max-h-[calc(100dvh-2rem)] space-y-5">
        <button
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] text-xs font-bold border border-orange-200 dark:border-orange-800">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{t('I Have a Customer')}</span>
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {locale === 'sw' ? 'Uwasilishaji wa Moja kwa Moja wa Rufaa' : 'Direct Referral Submission'}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
            {(deal.titleSw && locale === 'sw') ? deal.titleSw : deal.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {locale === 'sw' ? 'Zawadi ya Kufuzu:' : 'Qualifying Reward:'} <strong className="text-[#FF6A00]">{deal.rewardDisplay}</strong>
          </p>
        </div>

        {/* Success State */}
        {submittedReference ? (
          <div className="space-y-4 py-2 animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{locale === 'sw' ? 'Rufaa ya Mteja Imewasilishwa' : 'Customer Referral Submitted'}</span>
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                {locale === 'sw' ? 'Rufaa yako ya mteja imewasilishwa kwa mafanikio.' : 'Your customer referral has been submitted successfully.'}{' '}
                <br />
                <strong>{locale === 'sw' ? 'Kumbukumbu: ' : 'Reference: '}{submittedReference}</strong>
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                {locale === 'sw'
                  ? 'Lumo itathibitisha upatikanaji na mfanyabiashara na kukuongoza katika hatua zinazofuata. Fursa yako bado haijakamilika.'
                  : 'Lumo will confirm availability with the merchant and guide you through the next steps. Your deal is not yet completed.'}
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 fill-slate-950" />
                <span>{t('Chat with Lumo')}</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>

              {onViewProgress ? (
                <button
                  type="button"
                  onClick={() => {
                    handleResetAndClose()
                    onViewProgress()
                  }}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t('View Progress')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {locale === 'sw' ? 'Imekamilika' : 'Done'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baraka"
                  value={customerFirstName}
                  onChange={(e) => setCustomerFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Last Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mrema"
                  value={customerLastName}
                  onChange={(e) => setCustomerLastName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6A00]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Customer Mobile Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="07XXXXXXXX or +255XXXXXXXXX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-[#FF6A00]"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Tanzanian mobile number validated and normalized.
              </span>
            </div>

            {/* Submitting Partner Info (Prefilled) */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Promoting Partner
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {partnerName}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Partner Phone
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200 block">
                  {partnerPhone}
                </span>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Additional Notes / Specific Requirements (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Needs inspection in Mikocheni on Thursday, ready with payment."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6A00]"
              />
            </div>

            {/* Mandatory Permission Checkbox */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={contactPermissionConfirmed}
                  onChange={(e) => setContactPermissionConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#FF6A00] shrink-0"
                />
                <span>
                  <strong>Contact Permission Confirmed:</strong> I confirm that this customer agreed to be contacted regarding this opportunity.
                </span>
              </label>

              <label className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#FF6A00] shrink-0"
                />
                <span>
                  I understand that Lumo coordinates referrals and merchants pay rewards directly upon completed customer purchase.
                </span>
              </label>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !contactPermissionConfirmed || !termsAccepted}
                className="w-full py-3.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? (locale === 'sw' ? 'Inawasilisha Rufaa...' : 'Submitting Referral...') : (locale === 'sw' ? 'Wasilisha Rufaa ya Mteja' : 'Submit Customer Referral')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
