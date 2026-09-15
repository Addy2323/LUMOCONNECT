'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  PackageCheck,
  Clock3,
  BadgeCheck,
  Crown,
  Loader2,
  AlertCircle,
  User,
  Eye,
} from 'lucide-react'
import type { OpportunityItem, ReferralTicketDTO } from '@/modules/deals/types'
import { getWhatsAppCoordinationUrl } from '@/modules/deals/referral-cases'
import { useLanguage } from '@/lib/i18n'

interface WhatsAppMiddlemanModalProps {
  deal: OpportunityItem | null
  isOpen: boolean
  onClose: () => void
  initialBuyerName?: string
  initialBuyerPhone?: string
  onViewProgress?: () => void
}

export interface EscrowInquiry {
  id: string
  dealId: string
  dealTitle: string
  dealSlug: string
  sellerCompany: string
  sellerPhone: string
  sellerWhatsApp: string
  buyerName: string
  buyerPhone: string
  quantity: number
  deliveryLocation: string
  notes?: string
  escrowStatus: 'WAITING_ESCROW_PAYMENT' | 'FUNDS_HELD_IN_ESCROW' | 'DELIVERY_INSPECTION' | 'RELEASED_TO_SELLER'
  createdAt: string
  ticketCode: string
}

interface PartnerProfile {
  id: string
  name: string
  email: string
  phone: string | null
  whatsapp: string | null
  hasWhatsApp: boolean
  isPhoneVerified: boolean
}

export function WhatsAppMiddlemanModal({
  deal,
  isOpen,
  onClose,
  initialBuyerName = '',
  initialBuyerPhone = '',
  onViewProgress,
}: WhatsAppMiddlemanModalProps) {
  const { t, locale } = useLanguage()
  const isSw = locale === 'sw'

  // Partner profile (fetched from server)
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [whatsAppInput, setWhatsAppInput] = useState('')
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false)

  // Form fields
  const [quantity, setQuantity] = useState(deal?.minOrderQuantity || 1)
  const [deliveryLocation, setDeliveryLocation] = useState(deal?.region || 'Dar es Salaam')
  const [specifications, setSpecifications] = useState('')
  const [buyerNotes, setBuyerNotes] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(true)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submittedTicket, setSubmittedTicket] = useState<ReferralTicketDTO | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch partner profile on modal open
  useEffect(() => {
    if (!isOpen) return
    setProfileLoading(true)
    setErrorMessage(null)

    fetch('/api/referrals/partner-profile', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setPartnerProfile(data.profile)
          if (!data.profile.hasWhatsApp && !data.profile.whatsapp) {
            setShowWhatsAppPrompt(true)
          } else {
            setShowWhatsAppPrompt(false)
          }
        }
      })
      .catch(() => {
        // Use fallback from localStorage
        try {
          const stored = localStorage.getItem('lumo_user_session')
          if (stored) {
            const parsed = JSON.parse(stored)
            setPartnerProfile({
              id: parsed.id || 'partner',
              name: parsed.name || 'Partner',
              email: parsed.email || '',
              phone: parsed.phone || null,
              whatsapp: parsed.phone || null,
              hasWhatsApp: false,
              isPhoneVerified: false,
            })
            setShowWhatsAppPrompt(true)
          }
        } catch {}
      })
      .finally(() => setProfileLoading(false))
  }, [isOpen])

  if (!isOpen || !deal) return null

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
      setErrorMessage('Could not save WhatsApp number. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!termsAccepted) {
      setErrorMessage(
        isSw
          ? 'Lazima ukubaliane na masharti ya uratibu.'
          : 'You must accept the coordination terms to proceed.'
      )
      return
    }

    const partnerWhatsApp = partnerProfile?.whatsapp || whatsAppInput.trim() || partnerProfile?.phone || ''
    if (!partnerWhatsApp) {
      setErrorMessage(
        isSw
          ? 'Namba ya WhatsApp inahitajika kwa uratibu.'
          : 'A WhatsApp number is required for coordination.'
      )
      return
    }

    setIsSubmitting(true)

    try {
      const idempotencyKey = `COORD_${deal.id}_${partnerProfile?.id || 'anon'}_${Date.now()}`
      const res = await fetch('/api/referrals/tickets', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          dealTitle: deal.title,
          dealSlug: deal.slug,
          submissionType: 'COORDINATION_ENQUIRY',
          partnerWhatsApp,
          partnerPhone: partnerProfile?.phone || partnerWhatsApp,
          quantity: Number(quantity) || 1,
          deliveryDestination: deliveryLocation.trim() || deal.region,
          specifications: specifications.trim() || undefined,
          additionalNotes: buyerNotes.trim() || undefined,
          acceptedTermsVersion: 1,
          merchantOrgId: (deal as any).organizationId || null,
          merchantName: (deal as any).companyName || null,
          rewardAmountTZS: (deal as any).baseRewardValue || null,
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

      // Also persist as legacy EscrowInquiry for backward compat
      if (typeof window !== 'undefined' && data.ticket) {
        try {
          const inquiry: EscrowInquiry = {
            id: data.ticket.id,
            dealId: deal.id,
            dealTitle: deal.title,
            dealSlug: deal.slug,
            sellerCompany: 'Lumo Dealers', // Never expose merchant name
            sellerPhone: '+255 775 717 501',
            sellerWhatsApp: '255775717501',
            buyerName: partnerProfile?.name || 'Partner',
            buyerPhone: partnerWhatsApp,
            quantity: Number(quantity) || 1,
            deliveryLocation: deliveryLocation.trim() || deal.region,
            notes: buyerNotes.trim() || undefined,
            escrowStatus: 'DELIVERY_INSPECTION',
            createdAt: new Date().toISOString(),
            ticketCode: data.ticket.ticketReference,
          }
          const existing: EscrowInquiry[] = JSON.parse(
            localStorage.getItem('lumo_escrow_inquiries') || '[]'
          )
          localStorage.setItem('lumo_escrow_inquiries', JSON.stringify([inquiry, ...existing]))
          window.dispatchEvent(new Event('lumo:escrow-inquiries-updated'))
        } catch {}
      }
    } catch (err) {
      setIsSubmitting(false)
      setErrorMessage(
        isSw
          ? 'Hitilafu ya mtandao. Tafadhali jaribu tena.'
          : 'Network error. Please try again.'
      )
    }
  }

  // WhatsApp URL (only reference + deal title, zero PII)
  const ticketRef = submittedTicket?.ticketReference || ''
  const waUrl = ticketRef ? getWhatsAppCoordinationUrl(ticketRef, deal.title) : '#'

  const handleCopyMessage = () => {
    const msg = `Hello Lumo, I am following up on referral ticket ${ticketRef} for ${deal.title}. Please assist with coordination.`
    navigator.clipboard.writeText(msg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative overflow-y-auto max-h-[calc(100dvh-2rem)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{isSw ? 'Uratibu wa Lumo Dealers' : 'Lumo Dealers Coordination'}</span>
        </div>

        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug mb-4">
          {isSw ? 'Ratibisha na Lumo kupitia WhatsApp' : 'Coordinate with Lumo via WhatsApp'}
        </h3>

        {/* Deal Quick Summary Strip */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 mb-5 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                {deal.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <span>{isSw ? 'Imechapishwa na' : 'Published by'} <strong>Lumo Dealers</strong></span>
                <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              </p>
            </div>
            <span className="text-xs font-black text-orange-600 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-md shrink-0">
              {deal.principalPriceDisplay || 'Commercial Deal'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 dark:text-slate-300 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="flex items-center gap-1 font-semibold">
              <MapPin className="w-3 h-3 text-orange-500" /> {deal.region}
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Clock3 className="w-3 h-3 text-emerald-600" /> {isSw ? 'Ukaguzi wa 48h' : '48h Inspection Protection'}
            </span>
            {deal.isGoldenVip && (
              <span className="font-extrabold text-amber-600 flex items-center gap-1"><Crown className="w-3 h-3 text-amber-500 shrink-0" /> Golden VIP</span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {profileLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{isSw ? 'Inapakia wasifu wako...' : 'Loading your profile...'}</span>
          </div>
        ) : !submittedTicket ? (
          /* Step 1: Coordination Form */
          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                    {isSw ? 'Wasifu wako' : 'Your Profile'}
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

            {/* WhatsApp Prompt if missing */}
            {showWhatsAppPrompt && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  {isSw
                    ? 'Namba ya WhatsApp inahitajika kwa uratibu'
                    : 'WhatsApp number required for coordination'}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isSw ? 'Kiasi / Upeo Unaohitajika' : 'Quantity / Scope Required'}
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="e.g. 5"
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isSw ? 'Eneo la Uwasilishaji' : 'Delivery / Site Location'}
                </label>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="e.g. Mikocheni B, Dar es Salaam"
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isSw ? 'Maelezo ya Bidhaa / Vipimo (Hiari)' : 'Specifications / Requirements (Optional)'}
              </label>
              <textarea
                rows={2}
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                placeholder={isSw ? 'Mfano: Rangi nyeupe, ukubwa wa 42...' : 'e.g. White color, size 42, must include warranty...'}
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isSw ? 'Maswali au Ratiba (Hiari)' : 'Specific Inquiries or Timelines (Optional)'}
              </label>
              <textarea
                rows={2}
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                placeholder={isSw ? 'Mfano: Nahitaji ukaguzi wa mfano kabla ya...' : 'e.g. Need physical sample inspection before releasing final balance.'}
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
              />
            </div>

            {/* Terms Pill */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-emerald-600 rounded"
                />
                <span className="text-[11px] text-emerald-900 dark:text-emerald-300 font-medium">
                  {isSw
                    ? 'Ninaelewa kuwa Lumo inaratibu rufaa na wafanyabiashara hulipa zawadi moja kwa moja baada ya mteja kununua.'
                    : 'I understand that Lumo coordinates referrals and merchants pay rewards directly upon completed customer purchase.'}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!termsAccepted || isSubmitting || (showWhatsAppPrompt && !whatsAppInput.trim())}
              className="w-full py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isSw ? 'Inawasilisha...' : 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 fill-slate-950" />
                  <span>{isSw ? 'Wasilisha na Unganisha kupitia WhatsApp' : 'Submit & Connect via WhatsApp'}</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: Ticket Created — Success + WhatsApp Launch */
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-4 text-center dark:border-emerald-700 dark:bg-emerald-950/30">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                {isSw ? 'Tiketi ya Uratibu Imeundwa' : 'Coordination Ticket Created'}
              </p>
              <p className="font-mono text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {submittedTicket.ticketReference}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {isSw
                  ? 'Lumo imeandaa muunganisho wako wa uratibu.'
                  : 'Lumo has prepared your coordination connection.'}
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">{isSw ? 'Aina:' : 'Type:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {isSw ? 'Hoja ya Uratibu' : 'Coordination Enquiry'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">{isSw ? 'Vitengo:' : 'Units:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">{submittedTicket.quantity} unit(s)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">{isSw ? 'Ukaguzi:' : 'Inspection:'}</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{isSw ? 'Ukaguzi wa Ubora wa 48h' : '48h Quality Inspection'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <MessageSquare className="w-4 h-4 fill-slate-950" />
                <span>{isSw ? 'Fungua WhatsApp ya Uratibu Sasa' : 'Open WhatsApp Coordination Now'}</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (isSw ? 'Imenakiliwa!' : 'Copied!') : (isSw ? 'Nakili Ujumbe' : 'Copy Message')}</span>
                </button>

                {onViewProgress ? (
                  <button
                    type="button"
                    onClick={() => { onClose(); onViewProgress() }}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isSw ? 'Angalia Maendeleo' : 'View Progress'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {isSw ? 'Imekamilika' : 'Done & Back to Deals'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
