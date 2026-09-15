'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  MapPin,
  Tag,
  MessageCircle,
  Send,
  CheckCircle2,
  Globe,
  AlertCircle,
  Package,
  Award,
  Clock,
  Sparkles,
  PhoneCall,
  ChevronRight,
  Store,
} from 'lucide-react'
import type { PromoCodeResolution } from '@/modules/promotional-toolkit/public-allowlist'
import { recordPromoInteraction } from '@/modules/promotional-toolkit/analytics'
import { submitCustomerReferralEnquiry } from '@/modules/deals/referral-cases'
import { DealMediaViewer } from '@/components/common/DealMediaViewer'

interface PublicLandingClientViewProps {
  code: string
  initialLang: 'EN' | 'SW'
  resolution: PromoCodeResolution
}

export function PublicLandingClientView({ code, initialLang, resolution }: PublicLandingClientViewProps) {
  const [lang, setLang] = useState<'EN' | 'SW'>(initialLang)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [submittedEnquiryRef, setSubmittedEnquiryRef] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerRegion, setCustomerRegion] = useState('')
  const [quantityNeeded, setQuantityNeeded] = useState('1')
  const [notes, setNotes] = useState('')

  const deal = resolution.dealData

  useEffect(() => {
    // Record page visit analytics (filters crawlers)
    if (typeof navigator !== 'undefined') {
      recordPromoInteraction(code, 'PAGE_VISIT', navigator.userAgent, document.referrer)
    }
  }, [code, deal])

  if (!resolution.isValid || !deal) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-[#FF6A00] mx-auto animate-bounce" />
          <h1 className="text-xl font-black">Opportunity Not Found</h1>
          <p className="text-xs text-slate-400">
            {resolution.errorReason || 'The requested opportunity link is invalid or no longer available.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6A00] text-white text-xs font-bold hover:bg-[#EA580C] transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Visit Lumo Dealers</span>
          </Link>
        </div>
      </div>
    )
  }

  const isAvailable = deal.availabilityStatus === 'AVAILABLE'
  const isSwahili = lang === 'SW'

  const titleText = isSwahili && deal.titleSw ? deal.titleSw : deal.title
  const summaryText = isSwahili && deal.summarySw ? deal.summarySw : deal.summary
  const descriptionText = isSwahili && deal.descriptionSw ? deal.descriptionSw : deal.description

  // Lumo integrated phone number: 0775 717 501 -> formatted for WhatsApp: 255775717501
  const lumoWhatsAppPhone = '255775717501'

  const handleWhatsAppClick = () => {
    const messageText = isSwahili
      ? `Habari Lumo Dealers! Ninapenda kuulizia fursa: "${titleText}" (Ref: ${code}). Naomba msaada wa maelezo zaidi.`
      : `Hello Lumo Dealers! I am interested in: "${titleText}" (Ref: ${code}). Please assist with details.`

    const waUrl = `https://api.whatsapp.com/send?phone=${lumoWhatsAppPhone}&text=${encodeURIComponent(messageText)}`
    recordPromoInteraction(code, 'CONTACT_CLICK', typeof navigator !== 'undefined' ? navigator.userAgent : undefined)
    window.open(waUrl, '_blank')
  }

  const handleSubmitEnquiry = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (!customerName.trim() || !customerPhone.trim()) {
      setSubmitError(isSwahili ? 'Tafadhali jaza jina lako na namba ya simu.' : 'Please provide your name and phone number.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = submitCustomerReferralEnquiry({
        promoCode: code,
        dealId: deal.id,
        dealSlug: deal.slug,
        dealTitle: deal.title,
        customerName,
        customerPhone,
        customerRegion: customerRegion || deal.region,
        notes: `Quantity needed: ${quantityNeeded}. ${notes}`.trim(),
      })

      if (res.success && res.referralCase) {
        setSubmittedEnquiryRef(res.referralCase.reference)
        recordPromoInteraction(code, 'SUBMITTED_ENQUIRY', typeof navigator !== 'undefined' ? navigator.userAgent : undefined)
      } else {
        setSubmitError(res.message || 'Failed to submit enquiry. Please try again.')
      }
    } catch (err) {
      setSubmitError('An error occurred. Please try WhatsApp contact directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF6A00] flex items-center justify-center font-black text-white text-sm shadow-md">
              L
            </div>
            <div>
              <div className="font-black text-base leading-none text-white tracking-tight">LUMO DEALERS</div>
              <div className="text-[10px] text-slate-400 font-medium">Verified Commercial Opportunity</div>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setLang('SW')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                lang === 'SW' ? 'bg-[#FF6A00] text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kiswahili
            </button>
            <button
              onClick={() => setLang('EN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                lang === 'EN' ? 'bg-[#FF6A00] text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6">
        {/* Availability Banner */}
        {!isAvailable && (
          <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-600/60 text-amber-200 flex items-center gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold">
                {deal.availabilityStatus === 'SOLD_OUT'
                  ? 'Fursa Hii Imeshakamilika / Deal Sold Out'
                  : 'Fursa Hii Haipatikani Kwa Sasa / Currently Unavailable'}
              </div>
              <div className="text-amber-300/80 text-[11px] mt-0.5">
                New enquiries are currently paused for this listing. Contact Lumo directly for similar opportunities.
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image Gallery & Description */}
          <div className="lg:col-span-7 space-y-6">
            {/* Featured Image Viewer */}
            <div className="space-y-3">
              <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 aspect-4/3 shadow-2xl">
                <img
                  src={
                    (deal.galleryImageUrls?.includes(selectedImage) ? selectedImage : '') ||
                    deal.featuredImageUrl || deal.galleryImageUrls?.[0] || '/logo/lumodealers-white.png'
                  }
                  alt={titleText}
                  className="w-full h-full object-cover"
                />

                {/* Badges on Image */}
                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-700 text-[#FF6A00] font-black text-xs flex items-center gap-1 shadow-lg">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{deal.opportunityType === 'REVERSE_SOURCING' ? 'WANTED' : 'FOR SALE'}</span>
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-200 font-extrabold text-xs">
                    {deal.category}
                  </span>
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {deal.galleryImageUrls && deal.galleryImageUrls.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {deal.galleryImageUrls.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(url)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        selectedImage === url ? 'border-[#FF6A00] scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {deal.promoVideoUrl && <section className="space-y-3">
              <h2 className="font-bold">{isSwahili ? 'Video ya bidhaa' : 'Product video'}</h2>
              <div className="aspect-video overflow-hidden rounded-2xl bg-black">
                <DealMediaViewer mediaUrl={deal.promoVideoUrl} posterUrl={deal.featuredImageUrl} altTitle={titleText} />
              </div>
              {/^(https?:\/\/)/i.test(deal.promoVideoUrl) && <a href={deal.promoVideoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-400 underline">{isSwahili ? 'Fungua video asili' : 'Open original video'}</a>}
            </section>}

            {/* Title & Overview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>{deal.region}, Tanzania</span>
                {deal.principalPriceDisplay && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-mono font-black">{deal.principalPriceDisplay}</span>
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{titleText}</h1>

              <p className="text-sm text-slate-300 leading-relaxed font-medium bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                {summaryText}
              </p>
            </div>

            {/* Technical Specifications & Guarantees */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#FF6A00]" />
                <span>Verification & Product Attributes</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-slate-500 font-semibold">Condition</div>
                  <div className="font-bold text-slate-200">{deal.productCondition || 'BRAND_NEW'}</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-slate-500 font-semibold">Warranty</div>
                  <div className="font-bold text-slate-200">{deal.warrantyPeriod || '12 Months'}</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-slate-500 font-semibold">Quality Index</div>
                  <div className="font-bold text-emerald-400">{deal.qualityScore || 98}% Score</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-slate-500 font-semibold">Min Order Qty</div>
                  <div className="font-bold text-slate-200">{deal.minOrderQuantity || 1} Unit(s)</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5 col-span-2 sm:col-span-2">
                  <div className="text-[10px] text-slate-500 font-semibold">Publisher & Coordination</div>
                  <div className="font-bold text-[#FF6A00]">Lumo Dealers Tanzania</div>
                </div>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-sm text-white">
                {isSwahili ? 'Maelezo ya Kina' : 'Full Details & Deliverables'}
              </h3>
              <div className="text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-line font-normal">
                {descriptionText}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive WhatsApp & Customer Enquiry Box */}
          <div className="lg:col-span-5 space-y-5">
            {/* Primary Action Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#FF6A00]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6A00]">
                  {isSwahili ? 'Wasiliana Na Lumo' : 'Direct Inquiry & Order'}
                </span>
                <h3 className="text-lg font-black text-white">
                  {isSwahili ? 'Unahitaji Fursa Hii?' : 'Interested in this Listing?'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isSwahili
                    ? 'Pata uratibu wa haraka na msaada wa manunuzi kupitia WhatsApp au jaza fomu hapa chini.'
                    : 'Get instant response & procurement coordination via WhatsApp or submit your inquiry below.'}
                </p>
              </div>

              {/* Big WhatsApp CTA Button */}
              <button
                onClick={handleWhatsAppClick}
                disabled={!isAvailable}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white/20" />
                <span>{isSwahili ? 'Wasiliana na Lumo kwa WhatsApp' : 'Contact Lumo on WhatsApp'}</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <span className="relative px-3 bg-slate-900 text-[10px] font-bold text-slate-500 uppercase">
                  {isSwahili ? 'Au Jaza Fomu Ya Mteja' : 'Or Submit Customer Enquiry'}
                </span>
              </div>

              {/* Submitted Confirmation Card */}
              {submittedEnquiryRef ? (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="font-extrabold text-sm text-white">
                    {isSwahili ? 'Ombi Lako Limepokelewa!' : 'Enquiry Submitted Successfully!'}
                  </h4>
                  <p className="text-xs text-emerald-300/90">
                    {isSwahili
                      ? `Kumbukumbu yako ni: `
                      : `Your reference code is: `}
                    <span className="font-mono font-black text-white">{submittedEnquiryRef}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isSwahili
                      ? 'Timu yetu itawasiliana nawe ndani ya saa 24.'
                      : 'Our coordination desk will reach out to you within 24 hours.'}
                  </p>
                </div>
              ) : (
                /* Customer Enquiry Form */
                <form onSubmit={handleSubmitEnquiry} className="space-y-3 text-xs">
                  {submitError && (
                    <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-[11px]">
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {isSwahili ? 'Jina Lako Kamili' : 'Your Full Name'} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Juma Rashidi"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {isSwahili ? 'Namba ya Simu / WhatsApp' : 'Phone Number (WhatsApp)'} *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g., 0754 000 111"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        {isSwahili ? 'Mkoa / Mahali' : 'Region / Location'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Dar es Salaam"
                        value={customerRegion}
                        onChange={(e) => setCustomerRegion(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:outline-none focus:border-[#FF6A00]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        {isSwahili ? 'Idadi' : 'Quantity Needed'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantityNeeded}
                        onChange={(e) => setQuantityNeeded(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:outline-none focus:border-[#FF6A00]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {isSwahili ? 'Maelezo Ziada' : 'Additional Message / Notes'}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={isSwahili ? 'Weka maelezo yoyote ya ziada...' : 'Any specific requirements or queries...'}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:outline-none focus:border-[#FF6A00] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !isAvailable}
                    className="w-full py-3 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#EA580C] disabled:opacity-50 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting...' : isSwahili ? 'Tuma Ombi Lako' : 'Submit Customer Inquiry'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Disclaimer & Privacy Guarantee Card */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Lumo Guarantee & Merchant Protection</span>
              </div>
              <p>
                All inquiries, settlement verification, and reward distributions are processed directly through Lumo Dealers Operating Model. Merchant contact information is kept confidential to prevent disintermediation.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-4 bg-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Lumo Dealers Tanzania. All rights reserved.</div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">Marketplace</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Merchant Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
