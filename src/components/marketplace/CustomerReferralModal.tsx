'use client'

import React, { useState, useEffect } from 'react'
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
  Loader2,
  User,
  Eye,
} from 'lucide-react'
import type { OpportunityItem, ReferralTicketDTO } from '@/modules/deals/types'
import {
  getWhatsAppCoordinationUrl,
  isValidTanzanianPhone,
} from '@/modules/deals/referral-cases'
import { joinOpportunityDeal } from '@/modules/deals/service'
import { useLanguage } from '@/lib/i18n'

interface PartnerProfile {
  id: string
  name: string
  email: string
  phone: string | null
  whatsapp: string | null
  hasWhatsApp: boolean
  isPhoneVerified: boolean
}

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
  currentUserId,
  partnerName,
  partnerPhone,
  userRole = 'PARTNER',
  userOrgId,
  onReferralSubmitted,
  onViewProgress,
}: CustomerReferralModalProps) {
  const { t, locale } = useLanguage()
  const isSw = locale === 'sw'

  // Partner profile from server
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [whatsAppInput, setWhatsAppInput] = useState('')
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false)

  // Customer form fields
  const [customerFirstName, setCustomerFirstName] = useState('')
  const [customerLastName, setCustomerLastName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [contactPermissionConfirmed, setContactPermissionConfirmed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(true)
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [deliveryDestination, setDeliveryDestination] = useState('')

  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submittedTicket, setSubmittedTicket] = useState<ReferralTicketDTO | null>(null)

  // Fetch partner profile from server on open
  useEffect(() => {
    if (!isOpen) return
    setProfileLoading(true)
    setErrorMessage(null)

    const storedUser = (() => {
      try {
        const s = localStorage.getItem('lumo_auth_session') || localStorage.getItem('lumo_user_session')
        return s ? JSON.parse(s) : null
      } catch { return null }
    })()

    const effectiveId = currentUserId || storedUser?.id || ''
    const effectiveName = partnerName || storedUser?.name || ''
    const effectivePhone = partnerPhone || storedUser?.phone || ''

    const query = new URLSearchParams()
    if (effectiveId) query.set('userId', effectiveId)
    if (effectivePhone) query.set('phone', effectivePhone)
    if (effectiveName) query.set('name', effectiveName)

    fetch(`/api/referrals/partner-profile?${query.toString()}`, {
      credentials: 'include',
      headers: {
        ...(effectiveId ? { 'X-User-Id': effectiveId } : {}),
        ...(effectiveName ? { 'X-User-Name': effectiveName } : {}),
        ...(effectivePhone ? { 'X-User-Phone': effectivePhone } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setPartnerProfile(data.profile)
          if (!data.profile.hasWhatsApp && !data.profile.whatsapp) {
            setShowWhatsAppPrompt(true)
          } else {
            setShowWhatsAppPrompt(false)
          }
        } else {
          // Fallback from props / localStorage
          const fallbackName = effectiveName || 'Partner'
          const fallbackPhone = effectivePhone || ''
          setPartnerProfile({
            id: effectiveId || 'partner',
            name: fallbackName,
            email: storedUser?.email || '',
            phone: fallbackPhone,
            whatsapp: fallbackPhone,
            hasWhatsApp: false,
            isPhoneVerified: false,
          })
          setShowWhatsAppPrompt(true)
        }
      })
      .catch(() => {
        // Complete fallback
        setPartnerProfile({
          id: effectiveId || 'partner',
          name: effectiveName || 'Partner',
          email: storedUser?.email || '',
          phone: effectivePhone || null,
          whatsapp: effectivePhone || null,
          hasWhatsApp: false,
          isPhoneVerified: false,
        })
        setShowWhatsAppPrompt(true)
      })
      .finally(() => setProfileLoading(false))
  }, [isOpen, partnerName, partnerPhone, currentUserId])

  if (!isOpen || !deal) return null

  const handleResetAndClose = () => {
    setCustomerFirstName('')
    setCustomerLastName('')
    setCustomerPhone('')
    setContactPermissionConfirmed(false)
    setAdditionalNotes('')
    setErrorMessage(null)
    setSubmittedTicket(null)
    setQuantity(1)
    setDeliveryDestination('')
    onClose()
  }

  const handleSaveWhatsApp = async () => {
    if (!whatsAppInput.trim()) return
    try {
      await fetch('/api/referrals/partner-profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: whatsAppInput.trim() }),
      })
      setPartnerProfile((prev) =>
        prev ? { ...prev, whatsapp: whatsAppInput.trim(), hasWhatsApp: true } : prev
      )
      setShowWhatsAppPrompt(false)
    } catch {
      setErrorMessage(isSw ? 'Imeshindwa kuhifadhi namba ya WhatsApp.' : 'Could not save WhatsApp number.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Client-side validation
    if (!customerFirstName.trim() || !customerLastName.trim()) {
      setErrorMessage(isSw ? 'Tafadhali jaza jina la kwanza na la mwisko la mteja.' : 'Please provide the customer first and last name.')
      return
    }

    if (!customerPhone.trim()) {
      setErrorMessage(isSw ? 'Tafadhali weka namba ya simu ya mteja.' : 'Please enter the customer mobile phone number.')
      return
    }

    if (!isValidTanzanianPhone(customerPhone)) {
      setErrorMessage(isSw
        ? 'Tafadhali weka namba halali ya simu ya Tanzania (mfano 07XXXXXXXX).'
        : 'Please enter a valid Tanzanian mobile phone number (e.g. 07XXXXXXXX or +2557XXXXXXXX).')
      return
    }

    if (!contactPermissionConfirmed) {
      setErrorMessage(isSw
        ? 'Lazima uthibitishe kuwa mteja amekubali kuwasiliana naye.'
        : 'You must confirm that the customer agreed to be contacted regarding this opportunity.')
      return
    }

    if (!termsAccepted) {
      setErrorMessage(isSw ? 'Lazima ukubaliane na masharti.' : 'You must accept the terms to proceed.')
      return
    }

    setIsSubmitting(true)

    // Join the deal if not already joined
    joinOpportunityDeal(deal.id, {
      userId: currentUserId,
      userRole,
      userOrgId,
    })

    const storedUser = (() => {
      try {
        const s = localStorage.getItem('lumo_auth_session') || localStorage.getItem('lumo_user_session')
        return s ? JSON.parse(s) : null
      } catch { return null }
    })()

    const resolvedPartnerId = currentUserId || partnerProfile?.id || storedUser?.id || ''
    const resolvedPartnerName = partnerProfile?.name || partnerName || storedUser?.name || 'Promoting Partner'
    const resolvedPartnerPhone = partnerProfile?.phone || partnerPhone || storedUser?.phone || ''
    const partnerWhatsApp = partnerProfile?.whatsapp || whatsAppInput.trim() || resolvedPartnerPhone || ''

    try {
      const idempotencyKey = `CREF_${deal.id}_${customerPhone.replace(/\D/g, '')}_${resolvedPartnerId}`

      const res = await fetch('/api/referrals/tickets', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': resolvedPartnerId,
          'X-User-Name': resolvedPartnerName,
          'X-User-Phone': resolvedPartnerPhone || partnerWhatsApp,
          'X-User-Role': userRole || 'PARTNER',
        },
        body: JSON.stringify({
          dealId: deal.id,
          dealTitle: deal.title,
          dealSlug: deal.slug,
          submissionType: 'CUSTOMER_REFERRAL',
          partnerUserId: resolvedPartnerId,
          partnerName: resolvedPartnerName,
          partnerPhone: resolvedPartnerPhone || partnerWhatsApp,
          partnerWhatsApp,
          customerFirstName: customerFirstName.trim(),
          customerLastName: customerLastName.trim(),
          customerPhone: customerPhone.trim(),
          contactPermissionConfirmed: true,
          quantity: Number(quantity) || 1,
          deliveryDestination: deliveryDestination.trim() || undefined,
          additionalNotes: additionalNotes.trim() || undefined,
          acceptedTermsVersion: 1,
          merchantOrgId: (deal as any).organizationId || null,
          merchantName: (deal as any).companyName || null,
          rewardAmountTZS: (deal as any).baseRewardValue || 50000,
          rewardDisplay: deal.rewardDisplay || null,
          idempotencyKey,
        }),
      })

      const data = await res.json()
      setIsSubmitting(false)

      if (!data.success) {
        setErrorMessage(data.error || data.message || 'Submission failed.')
        return
      }

      setSubmittedTicket(data.ticket)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('lumo:referral-cases-updated'))
        window.dispatchEvent(new Event('lumo:joined-deals-updated'))
      }
      onReferralSubmitted?.(data.ticket?.ticketReference || '')
    } catch (err) {
      setIsSubmitting(false)
      setErrorMessage(isSw ? 'Hitilafu ya mtandao. Tafadhali jaribu tena.' : 'Network error. Please try again.')
    }
  }

  const whatsAppUrl = submittedTicket?.ticketReference
    ? getWhatsAppCoordinationUrl(submittedTicket.ticketReference, deal.title)
    : '#'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
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
              <span>{isSw ? 'Nina Mteja' : t('I Have a Customer')}</span>
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {isSw ? 'Uwasilishaji wa Rufaa ya Mteja' : 'Customer Referral Submission'}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
            {(deal.titleSw && isSw) ? deal.titleSw : deal.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isSw ? 'Zawadi ya Kufuzu:' : 'Qualifying Reward:'} <strong className="text-[#FF6A00]">{deal.rewardDisplay}</strong>
          </p>
        </div>

        {/* Loading */}
        {profileLoading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-slate-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{isSw ? 'Inapakia wasifu...' : 'Loading profile...'}</span>
          </div>
        ) : submittedTicket ? (
          /* Success State */
          <div className="space-y-4 py-2 animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{isSw ? 'Rufaa ya Mteja Imewasilishwa' : 'Customer Referral Submitted'}</span>
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                {isSw ? 'Rufaa yako ya mteja imewasilishwa kwa mafanikio.' : 'Your customer referral has been submitted successfully.'}{' '}
                <br />
                <strong>{isSw ? 'Kumbukumbu: ' : 'Reference: '}{submittedTicket.ticketReference}</strong>
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                {isSw
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
                  onClick={() => { handleResetAndClose(); onViewProgress() }}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t('View Progress')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {isSw ? 'Imekamilika' : 'Done'}
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

            {/* Read-only Partner Profile */}
            {partnerProfile && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    {isSw ? 'Mshirika Anayetangaza' : 'Promoting Partner'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isSw ? 'Jina' : 'Name'}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{partnerProfile.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isSw ? 'Simu' : 'Phone'}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {partnerProfile.phone || '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp Prompt */}
            {showWhatsAppPrompt && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  {isSw ? 'Namba ya WhatsApp inahitajika' : 'WhatsApp number required for coordination'}
                </p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    value={whatsAppInput}
                    onChange={(e) => setWhatsAppInput(e.target.value)}
                    placeholder="+255 7XX XXX XXX"
                    className="flex-1 text-xs p-2.5 border border-amber-200 dark:border-amber-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#25D366] font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveWhatsApp}
                    className="px-3 py-2 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:bg-[#1EBE5D] cursor-pointer"
                  >
                    {isSw ? 'Hifadhi' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isSw ? 'Jina la Kwanza la Mteja *' : 'Customer First Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isSw ? 'Mfano: Baraka' : 'e.g. Baraka'}
                  value={customerFirstName}
                  onChange={(e) => setCustomerFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isSw ? 'Jina la Mwisho la Mteja *' : 'Customer Last Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isSw ? 'Mfano: Mrema' : 'e.g. Mrema'}
                  value={customerLastName}
                  onChange={(e) => setCustomerLastName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6A00]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isSw ? 'Namba ya Simu ya Mteja *' : 'Customer Mobile Phone Number *'}
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
                {isSw ? 'Namba ya simu ya Tanzania itathibitishwa.' : 'Tanzanian mobile number validated and normalized.'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isSw ? 'Kiasi' : 'Quantity'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6A00]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isSw ? 'Eneo la Uwasilishaji' : 'Delivery Location'}
                </label>
                <input
                  type="text"
                  value={deliveryDestination}
                  onChange={(e) => setDeliveryDestination(e.target.value)}
                  placeholder={isSw ? 'Mfano: Mikocheni' : 'e.g. Mikocheni'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6A00]"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isSw ? 'Maelezo ya Ziada (Hiari)' : 'Additional Notes / Specific Requirements (Optional)'}
              </label>
              <textarea
                rows={2}
                placeholder={isSw ? 'Mfano: Mteja yuko tayari kulipa...' : 'e.g. Needs inspection in Mikocheni on Thursday, ready with payment.'}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6A00]"
              />
            </div>

            {/* Mandatory Permission & Terms Checkboxes */}
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
                  <strong>{isSw ? 'Ruhusa ya Mawasiliano Imethibitishwa:' : 'Contact Permission Confirmed:'}</strong>{' '}
                  {isSw
                    ? 'Ninathibitisha kuwa mteja huyu amekubali kuwasiliana naye kuhusu fursa hii.'
                    : 'I confirm that this customer agreed to be contacted regarding this opportunity.'}
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
                  {isSw
                    ? 'Ninaelewa kuwa Lumo inaratibu rufaa na wafanyabiashara hulipa zawadi moja kwa moja.'
                    : 'I understand that Lumo coordinates referrals and merchants pay rewards directly upon completed customer purchase.'}
                </span>
              </label>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !contactPermissionConfirmed || !termsAccepted || (showWhatsAppPrompt && !whatsAppInput.trim())}
                className="w-full py-3.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isSw ? 'Inawasilisha Rufaa...' : 'Submitting Referral...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{isSw ? 'Wasilisha Rufaa ya Mteja' : 'Submit Customer Referral'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
