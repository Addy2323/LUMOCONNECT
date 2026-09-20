'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Eye,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'
import type { OpportunityItem, ReferralTicketDTO } from '@/modules/deals/types'
import {
  getWhatsAppCoordinationUrl,
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

  // Form Fields matching prototype
  const [customerType, setCustomerType] = useState<string>('Business')
  const [customerRole, setCustomerRole] = useState<string>('')
  const [companyName, setCompanyName] = useState('')
  const [country, setCountry] = useState('Tanzania')
  const [city, setCity] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [relationship, setRelationship] = useState('Existing Business Contact')
  const [interestLevel, setInterestLevel] = useState('Strong Potential Interest')
  const [lumoMayContact, setLumoMayContact] = useState('Yes')
  const [capabilityMatch, setCapabilityMatch] = useState('Appears Capable')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [declarationAccepted, setDeclarationAccepted] = useState(false)

  // Field-level error validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Submissions & Status
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState<ReferralTicketDTO | null>(null)
  const [copiedRef, setCopiedRef] = useState(false)

  // Category-based default customer role
  const defaultRole = useMemo(() => {
    if (!deal) return 'Inspection / Verification Company'
    if (deal.subcategory) return deal.subcategory
    const cat = (deal.category || '').toLowerCase()
    const title = (deal.title || '').toLowerCase()

    if (cat.includes('medical') || title.includes('medical') || title.includes('hospital') || title.includes('equipment')) {
      return 'Hospitals & Clinics'
    }
    if (cat.includes('cargo') || title.includes('inspect')) {
      return 'Inspection / Verification Company'
    }
    if (cat.includes('vehicle') || title.includes('car') || title.includes('truck')) {
      return 'Corporate Fleet Buyer'
    }
    if (cat.includes('property') || title.includes('rent') || title.includes('house')) {
      return 'Corporate Tenant / Buyer'
    }
    if (cat.includes('agri') || title.includes('pump') || title.includes('grain')) {
      return 'Agricultural Distributor'
    }
    return 'Corporate Client'
  }, [deal])

  // Initialize role and country on deal load
  useEffect(() => {
    if (!customerRole || customerRole === 'Corporate Client' || customerRole === 'Inspection / Verification Company') {
      setCustomerRole(defaultRole)
    }
    if (deal?.region && deal.region.trim()) {
      setCountry(deal.region.trim())
    }
  }, [defaultRole, customerRole, deal])

  // Clear field error on change helper
  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev }
        delete copy[field]
        return copy
      })
    }
    if (errorMessage) {
      setErrorMessage(null)
    }
  }

  // Fetch partner profile on open
  useEffect(() => {
    if (!isOpen) return
    setProfileLoading(true)
    setErrorMessage(null)
    setFieldErrors({})

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
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.partner) {
          setPartnerProfile(data.partner)
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [isOpen, currentUserId, partnerName, partnerPhone])

  if (!isOpen || !deal) return null

  const handleResetAndClose = () => {
    setSubmittedTicket(null)
    setErrorMessage(null)
    setFieldErrors({})
    setIsSubmitting(false)
    onClose()
  }

  const handleCopyRef = (refText: string) => {
    navigator.clipboard.writeText(refText)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Comprehensive client-side validation
    const cleanName = companyName.trim()
    const cleanContact = contactPerson.trim()
    const cleanPhone = phone.trim()
    const cleanDigits = cleanPhone.replace(/\D/g, '')

    const newErrors: Record<string, string> = {}

    // 1. Company / Customer Name validation
    if (!cleanName || cleanName.length < 2) {
      newErrors.companyName = isSw
        ? 'Tafadhali weka jina sahihi la mteja au kampuni (angalau herufi 2).'
        : 'Please enter a valid Customer or Company Name (min 2 characters).'
    }

    // 2. Contact Person validation (must not be empty, must not be numbers only)
    if (!cleanContact || cleanContact.length < 2) {
      newErrors.contactPerson = isSw
        ? 'Tafadhali weka jina la mtu wa mawasiliano.'
        : 'Please enter the Contact Person name.'
    } else if (/^\d+$/.test(cleanContact)) {
      newErrors.contactPerson = isSw
        ? 'Mtu wa mawasiliano hawezi kuwa namba pekee. Weka jina la mtu.'
        : 'Contact Person cannot be only numbers. Please enter a contact name.'
    }

    // 3. Phone number validation (at least 9-10 digits e.g. 07XXXXXXXX)
    if (!cleanPhone) {
      newErrors.phone = isSw
        ? 'Namba ya simu au WhatsApp inahitajika.'
        : 'Phone or WhatsApp number is required.'
    } else if (cleanDigits.length < 9 || cleanDigits.length > 15) {
      newErrors.phone = isSw
        ? 'Weka namba sahihi ya simu yenye tarakimu 9-10 (mfano: 0712 345 678 au +255 712 345 678).'
        : 'Please enter a valid phone number (at least 9-10 digits, e.g. 0712 345 678 or +255 712 345 678).'
    }

    // 4. Email validation (if provided)
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = isSw
        ? 'Weka anwani sahihi ya barua pepe (mfano: name@company.com).'
        : 'Please enter a valid email address (e.g. name@company.com).'
    }

    // 5. Good Faith Declaration
    if (!declarationAccepted) {
      newErrors.declarationAccepted = isSw
        ? 'Tafadhali weka alama ya tiki kuthibitisha uwasilishaji huu.'
        : 'Please check the box to confirm this submission is accurate and made in good faith.'
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors)
      setErrorMessage(Object.values(newErrors)[0])
      return
    }

    setIsSubmitting(true)

    // Join deal in background
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

    const resolvedPartnerId = currentUserId || partnerProfile?.id || storedUser?.id || '00000000-0000-0000-0000-000000000001'
    const resolvedPartnerName = partnerProfile?.name || partnerName || storedUser?.name || 'Connecting Partner'
    const resolvedPartnerPhone = partnerProfile?.phone || partnerPhone || storedUser?.phone || '+255712345678'
    const partnerWhatsApp = partnerProfile?.whatsapp || resolvedPartnerPhone || '+255775717501'

    try {
      const idempotencyKey = `LCON_${deal.id}_${cleanDigits}_${resolvedPartnerId}`

      const payload = {
        dealId: deal.id,
        opportunityId: deal.id,
        dealTitle: deal.title,
        dealSlug: deal.slug,
        submissionType: 'CUSTOMER_CONNECTION',
        ticketPrefix: 'LUMO-CON',
        partnerUserId: resolvedPartnerId,
        partnerName: resolvedPartnerName,
        partnerPhone: resolvedPartnerPhone,
        partnerWhatsApp,
        entityType: customerType,
        customerRole: customerRole.trim() || defaultRole,
        companyName: customerType === 'Individual' ? undefined : cleanName,
        contactPerson: cleanContact,
        customerFirstName: cleanContact.split(' ')[0] || cleanName.split(' ')[0],
        customerLastName: cleanContact.split(' ').slice(1).join(' ') || 'Customer',
        customerCountry: country.trim() || 'Tanzania',
        customerCity: city.trim() || undefined,
        customerPhone: cleanPhone,
        customerEmail: email.trim() || undefined,
        relationshipWithCustomer: relationship,
        spokenToCustomer: 'Yes',
        customerInterestLevel: interestLevel,
        lumoMayContact,
        customerSuitability: capabilityMatch,
        relevantCapabilities: [capabilityMatch],
        declarationAccepted: true,
        contactPermissionConfirmed: lumoMayContact === 'Yes',
        additionalNotes: additionalNotes.trim() || undefined,
        rewardDisplay: deal.rewardDisplay,
        idempotencyKey,
      }

      const res = await fetch('/api/referrals/tickets', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(resolvedPartnerId ? { 'X-User-Id': resolvedPartnerId } : {}),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        const failureMessage = data.message || data.error || 'Failed to submit connection. Please verify details.'
        setErrorMessage(failureMessage)
        return
      }

      setSubmittedTicket(data.ticket)
      if (onReferralSubmitted && data.ticket?.ticketReference) {
        onReferralSubmitted(data.ticket.ticketReference)
      }
    } catch {
      setErrorMessage(isSw ? 'Hitilafu ya mtandao. Tafadhali jaribu tena.' : 'Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const whatsAppUrl = submittedTicket
    ? getWhatsAppCoordinationUrl(submittedTicket.ticketReference, deal.title)
    : ''

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 pb-16 sm:pb-0 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in-0 zoom-in-95 duration-150 max-h-[85vh] sm:max-h-none">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {isSw ? 'Wasilisha Muunganisho wa Mteja' : 'Submit Customer Connection'}
          </h3>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isSw ? 'Funga' : 'Close'}
          </button>
        </div>

        {/* Read-Only Deal Notice Banner */}
        <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
          {isSw ? (
            <>Unaunganisha mteja anayetarajiwa kwenye: <strong className="font-semibold">{deal.title}</strong>. Masharti ya deal hayawezi kubadilishwa (read-only).</>
          ) : (
            <>You are connecting a potential customer to: <strong className="font-semibold">{deal.title}</strong>. Deal terms are read-only.</>
          )}
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span className="font-semibold leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Dynamic Content */}
        {submittedTicket ? (
          /* Confirmation View */
          <div className="p-6 space-y-4">
            <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{isSw ? 'Muunganisho Umewasilishwa kwa Mafanikio' : 'Customer Connection Submitted Successfully'}</span>
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                {isSw
                  ? 'Muunganisho wako umepokelewa na dawati la LUMO. Tunapitia uhalali na upatikanaji wa fursa kabla ya kuanzisha mawasiliano.'
                  : 'LUMO coordination desk has received your connection and is reviewing attribution and merchant availability.'}
              </p>
              
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Connection Reference</span>
                  <span className="font-mono text-base font-black text-[#FF6A00]">{submittedTicket.ticketReference}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyRef(submittedTicket.ticketReference)}
                  className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRef ? (isSw ? 'Imenakiliwa' : 'Copied') : (isSw ? 'Nakili' : 'Copy')}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 fill-slate-950" />
                <span>{isSw ? 'Wasiliana kupitia WhatsApp Desk' : 'Coordinate via LUMO WhatsApp'}</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>

              {onViewProgress ? (
                <button
                  type="button"
                  onClick={() => { handleResetAndClose(); onViewProgress() }}
                  className="flex-1 py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isSw ? 'Tazama Miunganisho Yangu' : 'View in My Connections'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg transition-all cursor-pointer"
                >
                  {isSw ? 'Funga' : 'Close'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Simple 2-Column Form matching user prototype */
          <form onSubmit={handleSubmit} noValidate>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 max-h-[70vh] overflow-y-auto">
              
              {/* Row 1: Customer Type & Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {isSw ? 'Aina ya Mteja *' : 'Customer Type *'}
                </label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="Business">Business</option>
                  <option value="Individual">Individual</option>
                  <option value="Institution">Institution</option>
                  <option value="Government Entity">Government Entity</option>
                  <option value="Association">Association</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {isSw ? 'Nafasi ya Mteja *' : 'Customer Role *'}
                </label>
                <input
                  type="text"
                  required
                  value={customerRole}
                  onChange={(e) => setCustomerRole(e.target.value)}
                  placeholder="e.g. Agricultural Distributor"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              {/* Row 2: Customer / Company Name & Country */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {isSw ? 'Jina la Mteja / Kampuni *' : 'Customer / Company Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value)
                    clearFieldError('companyName')
                  }}
                  placeholder={customerType === 'Individual' ? 'e.g. Given Mhema' : 'e.g. Kilimo Distribution Ltd'}
                  className={`w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-colors ${
                    fieldErrors.companyName
                      ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-orange-500'
                  }`}
                />
                {fieldErrors.companyName && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.companyName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {isSw ? 'Nchi *' : 'Country *'}
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Tanzania"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              {/* Row 3: City & Contact Person */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {isSw ? 'Mji / Jiji' : 'City'}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Dar es Salaam"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {isSw ? 'Mtu wa Mawasiliano *' : 'Contact Person *'}
                </label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => {
                    setContactPerson(e.target.value)
                    clearFieldError('contactPerson')
                  }}
                  placeholder="e.g. Given Mhema"
                  className={`w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-colors ${
                    fieldErrors.contactPerson
                      ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-orange-500'
                  }`}
                />
                {fieldErrors.contactPerson && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.contactPerson}</p>
                )}
              </div>

              {/* Row 4: Phone / WhatsApp & Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {isSw ? 'Simu / WhatsApp *' : 'Phone / WhatsApp *'}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    clearFieldError('phone')
                  }}
                  placeholder="e.g. 0712 345 678 au +255 712 345 678"
                  className={`w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none font-mono transition-colors ${
                    fieldErrors.phone
                      ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-orange-500'
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {isSw ? 'Barua Pepe *' : 'Email *'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearFieldError('email')
                  }}
                  placeholder="e.g. givenmhema@gmail.com"
                  className={`w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-colors ${
                    fieldErrors.email
                      ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-orange-500'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              {/* Row 5: Your Relationship & Interest Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {isSw ? 'Uhusiano Wako *' : 'Your Relationship *'}
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="Existing Business Contact">Existing Business Contact</option>
                  <option value="Personal Acquaintance">Personal Acquaintance</option>
                  <option value="Direct Client">Direct Client</option>
                  <option value="Industry Associate">Industry Associate</option>
                  <option value="Referral / Intermediary">Referral / Intermediary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {isSw ? 'Kiwango cha Nia *' : 'Interest Level *'}
                </label>
                <select
                  value={interestLevel}
                  onChange={(e) => setInterestLevel(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="Strong Potential Interest">Strong Potential Interest</option>
                  <option value="Confirmed Interest">Confirmed Interest</option>
                  <option value="Exploring Options">Exploring Options</option>
                  <option value="Immediate Requirement">Immediate Requirement</option>
                </select>
              </div>

              {/* Row 6: Can LUMO Contact Them & Capability Match */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {isSw ? 'Je LUMO inaweza kuwasiliana nao? *' : 'Can LUMO contact them? *'}
                </label>
                <select
                  value={lumoMayContact}
                  onChange={(e) => setLumoMayContact(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {isSw ? 'Ulinganifu wa Uwezo *' : 'Capability Match *'}
                </label>
                <select
                  value={capabilityMatch}
                  onChange={(e) => setCapabilityMatch(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="Appears Capable">Appears Capable</option>
                  <option value="Highly Qualified">Highly Qualified</option>
                  <option value="Established Track Record">Established Track Record</option>
                  <option value="Direct Fit">Direct Fit</option>
                  <option value="Unverified">Unverified</option>
                </select>
              </div>

              {/* Row 7: Additional Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {isSw ? 'Maelezo ya Ziada' : 'Additional Notes'}
                </label>
                <textarea
                  rows={3}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder={isSw ? 'Muktadha wowote wa ziada...' : 'Any helpful context or specific customer requirements...'}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                />
              </div>

              {/* Row 8: Good Faith Declaration Checkbox */}
              <div className="sm:col-span-2 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => {
                      setDeclarationAccepted(e.target.checked)
                      clearFieldError('declarationAccepted')
                    }}
                    className={`w-4 h-4 rounded text-[#FF6A00] focus:ring-orange-500 cursor-pointer ${
                      fieldErrors.declarationAccepted ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {isSw
                      ? 'Nathibitisha kuwa uwasilishaji huu ni sahihi na umefanywa kwa nia njema.'
                      : 'I confirm this submission is accurate and made in good faith.'}
                  </span>
                </label>
                {fieldErrors.declarationAccepted && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.declarationAccepted}</p>
                )}
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isSw ? 'Ghairi' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#FF6A00] hover:bg-[#EA580C] rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSw ? 'Wasilisha Muunganisho' : 'Submit Connection'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
