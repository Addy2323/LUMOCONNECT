'use client'

import React, { useState } from 'react'
import {
  X,
  Globe,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Building2,
  User,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import { ISO_COUNTRIES, searchCountries, SUPPORTED_CURRENCIES } from '@/modules/international/countries'
import {
  InternationalSubmitterType,
  InternationalCategory,
  InternationalIntent,
  PreferredContactMethod,
} from '@/modules/international/types'

interface InternationalSubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (reference: string) => void
}

const SUBMITTER_TYPES: { id: InternationalSubmitterType; label: string; desc: string }[] = [
  { id: 'INDIVIDUAL', label: 'Individual', desc: 'Private citizen or professional' },
  { id: 'BUSINESS', label: 'Business', desc: 'Registered enterprise or company' },
  { id: 'ORGANIZATION', label: 'Organization', desc: 'NGO, cooperative or institution' },
  { id: 'INVESTOR', label: 'Investor', desc: 'Looking to fund or syndicate' },
  { id: 'BUYER', label: 'Buyer', desc: 'Procuring products or services' },
  { id: 'SELLER', label: 'Seller', desc: 'Supplying verified goods or assets' },
  { id: 'PROPERTY_OWNER', label: 'Property Owner / Agent', desc: 'Real estate, land, commercial' },
  { id: 'OTHER', label: 'Other', desc: 'Specialized arrangement' },
]

const CATEGORIES: { id: InternationalCategory; label: string }[] = [
  { id: 'BUSINESS_OPPORTUNITY', label: 'Business Opportunity' },
  { id: 'PRODUCTS_SUPPLY', label: 'Products / Supply Flow' },
  { id: 'PROPERTY', label: 'Real Estate & Property' },
  { id: 'VEHICLES', label: 'Vehicles & Heavy Equipment' },
  { id: 'INVESTMENT', label: 'Investment Opportunity' },
  { id: 'BUYER_REQUIREMENT', label: 'Buyer Requirement' },
  { id: 'SELLER_OFFER', label: 'Seller Offer' },
  { id: 'DISTRIBUTION', label: 'Distribution & Dealership' },
  { id: 'IMPORT_EXPORT', label: 'Import / Export' },
  { id: 'PARTNERSHIP', label: 'Joint Venture & Partnership' },
  { id: 'CONTRACT_TENDER', label: 'Contract & Tender' },
  { id: 'HOSPITALITY', label: 'Hospitality & Tourism' },
  { id: 'AGRICULTURE', label: 'Agriculture & Commodities' },
  { id: 'TECHNOLOGY', label: 'Technology & Software' },
  { id: 'PROFESSIONAL_SERVICES', label: 'Professional Services' },
  { id: 'OTHER', label: 'Other' },
]

export function InternationalSubmissionModal({
  isOpen,
  onClose,
  onSuccess,
}: InternationalSubmissionModalProps) {
  const [step, setStep] = useState<number>(1)
  const [countrySearch, setCountrySearch] = useState('')

  // Form State
  const [submitterType, setSubmitterType] = useState<InternationalSubmitterType>('BUSINESS')
  const [countryCode, setCountryCode] = useState('AE') // UAE default as popular trade hub
  const [city, setCity] = useState('')
  const [category, setCategory] = useState<InternationalCategory>('BUSINESS_OPPORTUNITY')
  const [intent, setIntent] = useState<InternationalIntent>('OFFERING')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [declaredValue, setDeclaredValue] = useState<string>('')
  const [currency, setCurrency] = useState('USD')
  const [whatNeededFromLumo, setWhatNeededFromLumo] = useState('')
  const [fullName, setFullName] = useState('')
  const [organization, setOrganization] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [preferredContact, setPreferredContact] = useState<PreferredContactMethod>('WHATSAPP')
  const [website, setWebsite] = useState('')

  // Result State
  const [submitting, setSubmitting] = useState(false)
  const [submissionReference, setSubmissionReference] = useState<string | null>(null)
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const selectedCountry = ISO_COUNTRIES.find((c) => c.code === countryCode) || ISO_COUNTRIES[0]
  const filteredCountries = searchCountries(countrySearch)

  const handleNextStep = () => {
    setErrorMsg(null)
    if (step === 1 && !submitterType) {
      setErrorMsg('Please select who you are.')
      return
    }
    if (step === 2 && !countryCode) {
      setErrorMsg('Please select your country.')
      return
    }
    if (step === 3) {
      if (!title.trim() || !description.trim()) {
        setErrorMsg('Please enter an opportunity title and description.')
        return
      }
    }
    setStep((prev) => Math.min(prev + 1, 4))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!fullName.trim() || !whatsapp.trim() || !email.trim()) {
      setErrorMsg('Please fill in your full name, WhatsApp number, and email address.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/international/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitterType,
          countryCode,
          city,
          category,
          intent,
          title,
          description,
          declaredValue: parseFloat(declaredValue) || 0,
          currency,
          whatNeededFromLumo,
          fullName,
          organization,
          whatsapp,
          email,
          preferredContact,
          website,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit international opportunity.')
      }

      setSubmissionReference(data.reference)
      setWhatsAppUrl(data.whatsApp?.url || null)
      setStep(5) // Success step
      if (onSuccess) onSuccess(data.reference)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = () => {
    if (submissionReference) {
      navigator.clipboard.writeText(submissionReference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-[#0B1220] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Submit an International Opportunity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                LUMO International • Open to individuals & businesses worldwide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress (Steps 1 to 4) */}
        {step <= 4 && (
          <div className="px-6 pt-3 pb-2 bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span className={step === 1 ? 'text-[#FF6A00]' : ''}>1. Who You Are</span>
              <span className={step === 2 ? 'text-[#FF6A00]' : ''}>2. Location</span>
              <span className={step === 3 ? 'text-[#FF6A00]' : ''}>3. Opportunity</span>
              <span className={step === 4 ? 'text-[#FF6A00]' : ''}>4. Contacts</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#FF6A00] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 p-3 text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: WHO ARE YOU */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Who are you submitting as?
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUBMITTER_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSubmitterType(t.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      submitterType === t.id
                        ? 'border-[#FF6A00] bg-orange-50/40 dark:bg-orange-950/20 ring-2 ring-orange-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{t.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Country *
                </label>
                <input
                  type="text"
                  placeholder="Search country name or currency..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white mb-2"
                />
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCountries.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCountryCode(c.code)
                        setCurrency(c.currency)
                      }}
                      className={`w-full px-3.5 py-2 text-xs flex items-center justify-between text-left transition-colors ${
                        countryCode === c.code
                          ? 'bg-orange-50 dark:bg-orange-950/30 font-bold text-[#FF6A00]'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {c.dialCode} • {c.currency}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  City / State / Region
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dubai, Nairobi, Johannesburg, London..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 3: OPPORTUNITY DETAILS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIntent('OFFERING')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    intent === 'OFFERING'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Offering Something
                </button>
                <button
                  type="button"
                  onClick={() => setIntent('LOOKING_FOR')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    intent === 'LOOKING_FOR'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Looking for Something
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as InternationalCategory)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Opportunity Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Seeking East Africa Distributor for German Solar Inverters"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Short Description *
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the opportunity, capacity, target buyers or partners, and key commercial requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Estimated Value
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 150000"
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {Object.keys(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  What do you need from LUMO?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Introduce verified buyers, local partner vetting, contract coordination"
                  value={whatNeededFromLumo}
                  onChange={(e) => setWhatNeededFromLumo(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 4: CONTACT INFORMATION */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Business / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="Global Energy FZE"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    placeholder={`${selectedCountry.dialCode} 50 123 4567`}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="partner@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Preferred Contact Channel
                  </label>
                  <select
                    value={preferredContact}
                    onChange={(e) => setPreferredContact(e.target.value as PreferredContactMethod)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                    <option value="BOTH">Both WhatsApp & Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Website / Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                🔒 <strong>Privacy Guarantee</strong>: Your direct phone and email are confidential. They will not be publicly displayed. LUMO acts as your secure intermediary.
              </div>
            </form>
          )}

          {/* STEP 5: SUCCESS / CONFIRMATION */}
          {step === 5 && (
            <div className="py-6 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-950/40 text-green-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Submission Received</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Thank you. Your submission is recorded. Our team will review the details and initiate verification.
                </p>
              </div>

              {/* Reference Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md mx-auto">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                  Your Official International Reference
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-base font-black text-[#FF6A00]">
                    {submissionReference}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                    title="Copy Reference"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Lifecycle roadmap */}
              <div className="max-w-md mx-auto p-3.5 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-xl text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
                  What happens next?
                </div>
                <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside">
                  <li><strong>LUMO Desk Review</strong>: Coordinator evaluates commercial viability.</li>
                  <li><strong>WhatsApp / Email Outreach</strong>: We contact you to verify terms.</li>
                  <li><strong>Distribution</strong>: Once approved, opportunity is published to verified International Members.</li>
                </ol>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {whatsAppUrl && (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Open WhatsApp Notification
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls (Steps 1 to 4) */}
        {step <= 4 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Submitting to LUMO...' : 'SUBMIT TO LUMO'}
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
