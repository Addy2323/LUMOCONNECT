'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  Users,
  Globe,
  Megaphone,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  Send,
  Check,
  AlertCircle,
  FileText,
  Tag,
  ChevronRight,
  X,
} from 'lucide-react'
import { BrandMark } from '@/components/shared/BrandMark'

interface BusinessInterestLandingViewProps {
  onBackToMain?: () => void
}

const CATEGORY_OPTIONS = [
  'Sports & Fitness',
  'Travel & Tourism',
  'Technology & Software',
  'Retail & E-commerce',
  'Hospitality & Dining',
  'Energy & Solar',
  'Real Estate & Housing',
  'Professional Services',
  'Healthcare & Wellness',
  'Manufacturing & Agriculture',
  'Other',
]

const INTEREST_OPTIONS_GRID = [
  { id: 'Sell Products / Services', label: 'Sell Products / Services' },
  { id: 'Advertising', label: 'Advertising' },
  { id: 'Find Customers', label: 'Find Customers' },
  { id: 'International Opportunities', label: 'International Opportunities' },
  { id: 'Partner Opportunities', label: 'Partner Opportunities' },
  { id: 'Other', label: 'Other' },
]

const TANZANIA_REGIONS_OPTIONS = [
  'Dar es Salaam',
  'Arusha',
  'Dodoma',
  'Geita',
  'Iringa',
  'Kagera',
  'Katavi',
  'Kigoma',
  'Kilimanjaro',
  'Lindi',
  'Manyara',
  'Mara',
  'Mbeya',
  'Morogoro',
  'Mtwara',
  'Mwanza',
  'Njombe',
  'Pemba Kaskazini (North Pemba)',
  'Pemba Kusini (South Pemba)',
  'Pwani (Coast)',
  'Rukwa',
  'Ruvuma',
  'Shinyanga',
  'Simiyu',
  'Singida',
  'Songwe',
  'Tabora',
  'Tanga',
  'Unguja Kaskazini (North Zanzibar)',
  'Unguja Kusini (South Zanzibar)',
  'Unguja Mjini Magharibi (Urban West Zanzibar)',
  'Other / Outside Tanzania',
]

const SUBMITTING_AS_OPTIONS = [
  { id: 'Individual', label: 'Individual', description: 'Private citizen or professional' },
  { id: 'Business', label: 'Business', description: 'Registered enterprise or company' },
  { id: 'Organization', label: 'Organization', description: 'NGO, cooperative or institution' },
  { id: 'Investor', label: 'Investor', description: 'Looking to fund or syndicate' },
  { id: 'Buyer', label: 'Buyer', description: 'Procuring products or services' },
  { id: 'Seller', label: 'Seller', description: 'Supplying verified goods or assets' },
  { id: 'Property Owner / Agent', label: 'Property Owner / Agent', description: 'Real estate, land, commercial' },
  { id: 'Other', label: 'Other', description: 'Specialized arrangement' },
]

export function BusinessInterestLandingView({ onBackToMain }: BusinessInterestLandingViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submittingAs, setSubmittingAs] = useState('Business')
  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Sell Products / Services',
    'Find Customers',
  ])
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [socialMedia, setSocialMedia] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((i) => i !== interestId)
        : [...prev, interestId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (!submittingAs) {
      setSubmitError('Please select who you are submitting as.')
      return
    }
    if (!businessName.trim()) {
      setSubmitError('Please enter your business / entity name.')
      return
    }
    if (!contactName.trim()) {
      setSubmitError('Please enter your contact person name.')
      return
    }
    if (!phone.trim()) {
      setSubmitError('Please enter your phone number.')
      return
    }
    if (!email.trim()) {
      setSubmitError('Please enter your email address.')
      return
    }
    if (!category) {
      setSubmitError('Please select a business category.')
      return
    }
    if (selectedInterests.length === 0) {
      setSubmitError('Please select at least one area of interest.')
      return
    }

    setIsSubmitting(true)

    const finalLocation =
      location === 'Other / Outside Tanzania'
        ? customLocation.trim() || 'Other / Outside Tanzania'
        : location

    try {
      const res = await fetch('/api/business-interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submittingAs,
          businessName,
          contactName,
          phone,
          email,
          category,
          interests: selectedInterests,
          description,
          website,
          location: finalLocation,
          socialMedia,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit interest.')
      }

      setIsSubmitted(true)
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openFormModal = () => {
    setIsFormOpen(true)
  }

  const closeFormModal = () => {
    setIsFormOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#061426] text-slate-100 font-sans flex flex-col justify-between selection:bg-[#FF6B00] selection:text-white relative">
      
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#061426]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark size={36} />
            <div className="flex flex-col">
              <span className="font-black tracking-wider text-white text-lg leading-none">LUMO</span>
              <span className="text-[10px] text-[#FF6B00] font-extrabold uppercase tracking-widest mt-0.5">
                Business Growth
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openFormModal}
              className="px-5 py-2 rounded-full bg-[#FF6B00] hover:bg-[#E65F00] text-white font-black text-xs transition-all shadow-md shadow-orange-500/25 cursor-pointer"
            >
              I&apos;m Interested
            </button>

            {onBackToMain && (
              <button
                onClick={onBackToMain}
                className="px-4 py-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
              >
                Back to Platform
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#051122] via-[#091E36] to-[#0B2545] pt-10 pb-16 lg:pt-16 lg:pb-24 px-4 sm:px-6">
        
        {/* Soft Background Glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#FF6B00]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Headline & Content (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Program Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-[#FF6B00]/50 text-[#FF6B00] text-xs font-black uppercase tracking-wider shadow-sm">
                <Building2 className="w-3.5 h-3.5" />
                <span>BUSINESS GROWTH PROGRAM</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
                  Your Business Has Potential.
                  <span className="block text-[#FF6B00] mt-1">Let’s Build It Together.</span>
                </h1>
              </div>

              {/* Subtitle Description */}
              <div className="space-y-3">
                <p className="text-white text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-2 flex-wrap">
                  <span className="text-[#FF6B00]">Reach more customers.</span>
                  <span className="text-slate-400 font-normal hidden sm:inline">•</span>
                  <span>Find the right Partners.</span>
                  <span className="text-slate-400 font-normal hidden sm:inline">•</span>
                  <span className="text-[#FF6B00]">Unlock new opportunities.</span>
                </p>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                  LUMO helps businesses turn products, services and commercial goals into measurable opportunities across local and international markets.
                </p>
              </div>

              {/* Main CTA Button & Trust Bullets */}
              <div className="pt-2 space-y-5">
                <button
                  onClick={openFormModal}
                  className="px-9 py-4 rounded-full bg-[#FF6B00] hover:bg-[#E65F00] text-white font-black text-base transition-all shadow-xl shadow-[#FF6B00]/35 flex items-center gap-3 group cursor-pointer hover:scale-105"
                >
                  <span>I&apos;m Interested</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </button>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-bold text-slate-300 pt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span>Free to submit request</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span>No commitment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span>LUMO team-guided</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Entrepreneur Graphic & Cursive Callout (5 Cols) */}
            <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
              
              {/* Cursive Overlay Callout top-right of portrait */}
              <div className="absolute -top-8 right-2 sm:right-6 z-20 text-right pointer-events-none select-none">
                <div className="font-serif italic text-white text-xs sm:text-sm font-bold leading-tight rotate-[-2deg] drop-shadow-md">
                  More customers.<br />
                  More opportunities.<br />
                  More growth.
                </div>
                {/* Arrow SVG */}
                <svg
                  className="w-7 h-7 text-white inline-block mt-0.5 opacity-90 transform -scale-x-100 rotate-45"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M4 4c6 2 11 8 11 15M10 17l5 2 2-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Cutout Entrepreneur Image (Seamless without card frame) */}
              <div className="relative w-full max-w-[320px] sm:max-w-[380px]">
                <img
                  src="/images/african_entrepreneur_hero.png"
                  alt="African Female Entrepreneur - LUMO Business Growth"
                  className="w-full h-auto max-h-[460px] object-cover object-top rounded-t-3xl shadow-2xl filter brightness-105 contrast-105"
                />
                {/* Bottom gradient fade blend */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#051122] via-[#051122]/60 to-transparent" />
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Middle Section: "Why Businesses Choose LUMO" */}
      <section className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 py-16 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Section Title */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Why Businesses Choose LUMO
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              More than a marketplace — LUMO is your growth partner.
            </p>
          </div>

          {/* 4 Feature Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Grow Sales */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-[#FF6B00] dark:text-orange-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Grow Sales</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Reach new customers and increase revenue.
                </p>
              </div>
            </div>

            {/* Find Partners */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Find Partners</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Connect with trusted agents, creators and affiliates.
                </p>
              </div>
            </div>

            {/* Reach New Markets */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Reach New Markets</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Explore local, regional and international opportunities.
                </p>
              </div>
            </div>

            {/* Promote Your Business */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Promote Your Business</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Get the right visibility for your brand and products.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Bottom Section: "How It Works" 5-Step Dark Process Timeline Bar */}
      <section className="bg-[#030914] text-white border-t border-slate-800/80 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-6 items-center">
          
          <div className="lg:col-span-3">
            <h3 className="text-lg font-extrabold text-white tracking-tight">
              How It Works
            </h3>
            <p className="text-xs text-slate-400">
              Getting started is simple.
            </p>
          </div>

          <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#FF6B00] text-white font-black flex items-center justify-center text-xs shrink-0">
                1
              </div>
              <div>
                <div className="font-bold text-white text-[11px]">Submit your details</div>
                <div className="text-[10px] text-slate-400">Click &apos;I&apos;m Interested&apos;.</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block ml-auto shrink-0" />
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#FF6B00] text-white font-black flex items-center justify-center text-xs shrink-0">
                2
              </div>
              <div>
                <div className="font-bold text-white text-[11px]">LUMO reviews business</div>
                <div className="text-[10px] text-slate-400">We check &amp; verify info.</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block ml-auto shrink-0" />
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#FF6B00] text-white font-black flex items-center justify-center text-xs shrink-0">
                3
              </div>
              <div>
                <div className="font-bold text-white text-[11px]">Our team contacts you</div>
                <div className="text-[10px] text-slate-400">We reach out with next steps.</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block ml-auto shrink-0" />
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#FF6B00] text-white font-black flex items-center justify-center text-xs shrink-0">
                4
              </div>
              <div>
                <div className="font-bold text-white text-[11px]">Onboarding &amp; verify</div>
                <div className="text-[10px] text-slate-400">Complete setup process.</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block ml-auto shrink-0" />
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#FF6B00] text-white font-black flex items-center justify-center text-xs shrink-0">
                5
              </div>
              <div>
                <div className="font-bold text-white text-[11px]">Start using LUMO</div>
                <div className="text-[10px] text-slate-400">Grow, connect and earn.</div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-[#020610] border-t border-slate-800/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrandMark size={24} />
            <span className="font-bold text-slate-400">LUMO — The Deals &amp; Opportunities Marketplace</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>www.lumo.co.tz</span>
            <span>•</span>
            <span className="italic text-slate-400">Discover. Connect. Perform. Earn.</span>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* POP-UP MODAL (WITHOUT VISIBLE SCROLLBAR LINE)             */}
      {/* ========================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          
          <div className="relative bg-white text-slate-900 w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto animate-in zoom-in-95 duration-200 [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            
            {/* Close Button (X) */}
            <button
              onClick={closeFormModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer z-10"
              title="Close Form"
            >
              <X className="w-4 h-4" />
            </button>

            {isSubmitted ? (
              /* Success confirmation view inside modal */
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-orange-100 text-[#FF6B00] flex items-center justify-center mx-auto border border-orange-300 shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-0.5 rounded-full bg-orange-100 text-orange-900 text-[10px] font-black uppercase tracking-wider">
                    Submission Successful
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    Thank You for Connecting with LUMO!
                  </h3>
                  <p className="text-slate-600 text-xs max-w-md mx-auto leading-relaxed">
                    We received details for <strong className="text-slate-900">{businessName}</strong>. Our team will contact you at <strong className="text-[#FF6B00] font-bold">{phone}</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5">
                  <div className="font-bold text-slate-800">Next Steps:</div>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                    <li>Our team reviews your submission.</li>
                    <li>You receive an SMS with approval &amp; link to <code className="bg-white px-1 border rounded">lumo.co.tz/choose-path</code>.</li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setIsSubmitted(false)
                    closeFormModal()
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#FF6B00] hover:bg-[#E65F00] text-white font-black text-xs transition-colors shadow-lg shadow-orange-500/20"
                >
                  Done &amp; Close Window
                </button>
              </div>
            ) : (
              /* Compact Form view inside modal */
              <div>
                
                {/* Form Modal Header */}
                <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-slate-100 pr-8">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center font-black shrink-0 border border-orange-200">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                      Tell Us About Your Business
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                      Fill in a few details and we&apos;ll get in touch soon.
                    </p>
                  </div>
                </div>

                {submitError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Form Fields */}
                <form onSubmit={handleSubmit} className="space-y-2.5">
                  
                  {/* Row 0: Who are you submitting as? */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Who are you submitting as? <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={submittingAs}
                        onChange={(e) => setSubmittingAs(e.target.value)}
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-8 pr-7 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:bg-white font-semibold appearance-none"
                      >
                        {SUBMITTING_AS_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label} — {opt.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 1: Business Name + Contact Person (2 Columns) */}
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        {submittingAs === 'Individual' ? 'Full Name / Entity Name' : 'Business Name'} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder={submittingAs === 'Individual' ? 'e.g. Jane Doe' : 'e.g. ABC Trading Co.'}
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:bg-white font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Contact Person <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="e.g. John M. Doe"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:bg-white font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Phone Number + Email Address (2 Columns) */}
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          placeholder="e.g. +255 712 345 678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:bg-white font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          placeholder="e.g. john@yourbusiness.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:bg-white font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Business Category */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Business Category <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-8 pr-7 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:bg-white font-semibold appearance-none"
                      >
                        <option value="">Select category</option>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Location / Region Select */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Location / Region <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-8 pr-7 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:bg-white font-semibold appearance-none"
                      >
                        <option value="">Select region / city</option>
                        {TANZANIA_REGIONS_OPTIONS.map((reg) => (
                          <option key={reg} value={reg}>
                            {reg}
                          </option>
                        ))}
                      </select>
                    </div>

                    {location === 'Other / Outside Tanzania' && (
                      <input
                        type="text"
                        placeholder="Specify city or country (e.g. Nairobi, Kenya)..."
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        className="w-full mt-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00]"
                      />
                    )}
                  </div>

                  {/* Row 5: What are you interested in? (2-Column Checkbox Grid) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      What are you interested in? <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
                      {INTEREST_OPTIONS_GRID.map((item) => {
                        const isChecked = selectedInterests.includes(item.id)
                        return (
                          <label
                            key={item.id}
                            onClick={() => toggleInterest(item.id)}
                            className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 selection:bg-transparent"
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                isChecked
                                  ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className="text-[10.5px] leading-tight">{item.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Row 6: Business Description (Optional) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Tell us briefly about your business <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <textarea
                        rows={1.5}
                        placeholder="e.g. What do you do? What are your goals?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:bg-white font-medium resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#E65F00] disabled:opacity-50 text-white font-black text-xs transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting Request...' : 'Submit Interest'}</span>
                  </button>

                  <p className="text-[9.5px] text-slate-400 text-center leading-tight pt-0.5">
                    By submitting, you agree that LUMO may contact you regarding business opportunities and onboarding.
                  </p>

                </form>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  )
}
