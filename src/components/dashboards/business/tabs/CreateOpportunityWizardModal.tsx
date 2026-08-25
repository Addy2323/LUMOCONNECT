'use client'

import React, { useState } from 'react'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Briefcase,
  Layers,
  Award,
  Target,
  FileText,
  DollarSign,
  ShieldCheck,
  Laptop,
  Smartphone,
  Calendar,
  Lock,
  Image as ImageIcon,
  Video,
  Play,
  Trash2,
  Plus,
  Link,
  Film,
  Paperclip,
} from 'lucide-react'
import {
  OpportunityType,
  CommercialResultType,
  RewardStructureType,
  TrackingMethod,
  BusinessOpportunityItem,
} from '../types'
import { useBusinessToast } from '../BusinessToast'
import { createDealOpportunity } from '@/modules/deals/service'

interface CreateOpportunityWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onOpportunityCreated: (opp: BusinessOpportunityItem) => void
}

const PRESET_COVER_IMAGES = [
  {
    category: 'Renewable Energy',
    label: 'Solar Microgrids & Household Kits',
    url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=60',
  },
  {
    category: 'AgriBusiness',
    label: 'Irrigation & Farming Inputs',
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=800&auto=format&fit=crop&q=60',
  },
  {
    category: 'FinTech & Mobile Money',
    label: 'Digital Payments & POS Terminals',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=60',
  },
  {
    category: 'FMCG & Consumer Goods',
    label: 'Household & Retail Distribution',
    url: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800&auto=format&fit=crop&q=60',
  },
  {
    category: 'B2B & Industrial',
    label: 'Corporate Wholesale & Warehousing',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60',
  },
]

export function CreateOpportunityWizardModal({
  isOpen,
  onClose,
  onOpportunityCreated,
}: CreateOpportunityWizardModalProps) {
  const { showToast } = useBusinessToast()

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [previewDevice, setPreviewDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP')
  const [mediaUploadTab, setMediaUploadTab] = useState<'UPLOAD' | 'PRESET' | 'URL'>('PRESET')

  // Wizard Form State
  const [formData, setFormData] = useState({
    // Step 1: Type
    type: 'CUSTOMER_ACQUISITION' as OpportunityType,

    // Step 2: Basic Details & Media Assets
    title: '',
    publicSummary: '',
    subscriberDescription: '',
    category: 'Renewable Energy',
    region: 'Coastal & Dar es Salaam',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    partnersRequired: 50,
    eligibility: 'Open to verified Sales Agents, Affiliates, and Community Leaders.',

    // Media & Video
    coverImageUrl: PRESET_COVER_IMAGES[0].url,
    promoVideoUrl: '',
    galleryImageUrls: [] as string[],
    marketingAssets: [
      { id: 'ast_1', name: 'Product_Brochure_Tanzania_2026.pdf', url: '#', size: '2.4 MB', type: 'PDF' as const },
    ],

    // Step 3: Commercial Result
    commercialResult: 'COMPLETED_SALE' as CommercialResultType,

    // Step 4: Reward Structure
    rewardStructure: 'FIXED_REWARD' as RewardStructureType,
    rewardValueTZS: 50000,
    rewardPercent: 10,

    // Step 5: Tracking Method
    trackingMethod: 'QR_CODE' as TrackingMethod,

    // Step 6: Funding & Payment
    estimatedBudgetTZS: 25000000,
    maxCommittedAmountTZS: 25000000,
    payoutSchedule: 'WEEKLY_FRIDAY',
    refundReversalConditions: '7-day customer cooling off period applies before payout settlement.',

    // Step 7: Terms & Evidence
    partnerDeliverables: 'Verified installation with customer National ID (NIDA) copy and first STK installment payment.',
    evidenceRequired: 'Installation contract reference and technician activation code.',
    attributionWindowDays: 30,
    cancellationTerms: 'Standard LUMO Deal Room commercial terms apply.',
    disputeProcedure: 'Platform mediation through LUMO disputes resolution board within 14 days.',

    // Step 8: Declarations
    confirmAccurate: false,
    confirmFundingReady: false,
    confirmNoSilentChanges: false,
  })

  if (!isOpen) return null

  const stepsList = [
    { num: 1, title: 'Opportunity Type' },
    { num: 2, title: 'Details & Media' },
    { num: 3, title: 'Commercial Result' },
    { num: 4, title: 'Reward Structure' },
    { num: 5, title: 'Tracking Method' },
    { num: 6, title: 'Funding & Escrow' },
    { num: 7, title: 'Terms & Evidence' },
    { num: 8, title: 'Preview & Submit' },
  ]

  const handleNext = () => {
    if (currentStep === 2 && !formData.title.trim()) {
      showToast('error', 'Validation Error', 'Opportunity title is required to continue.')
      return
    }
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle local file upload for cover image
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setFormData({ ...formData, coverImageUrl: result })
        showToast('success', 'Image Uploaded', `${file.name} imported as featured banner.`)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle local file upload for gallery images
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const fileList = Array.from(files)
      fileList.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result as string
          setFormData((prev) => ({
            ...prev,
            galleryImageUrls: [...prev.galleryImageUrls, result],
          }))
        }
        reader.readAsDataURL(file)
      })
      showToast('success', 'Gallery Images Added', `${fileList.length} photos added to opportunity carousel.`)
    }
  }

  // Handle local file upload for video
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setFormData({ ...formData, promoVideoUrl: result })
        showToast('success', 'Video Attached', `${file.name} imported as promotional video.`)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitToLumo = () => {
    if (!formData.confirmAccurate || !formData.confirmFundingReady || !formData.confirmNoSilentChanges) {
      showToast('error', 'Declaration Required', 'Please confirm all compliance declarations before submitting to LUMO.')
      return
    }

    const created: BusinessOpportunityItem = {
      id: `opp_${Date.now()}`,
      slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
      title: formData.title,
      publicSummary: formData.publicSummary || 'Earn rewards by connecting customers to verified products and services.',
      subscriberDescription: formData.subscriberDescription || formData.publicSummary,
      type: formData.type,
      category: formData.category,
      region: formData.region,
      commercialResult: formData.commercialResult,
      rewardStructure: formData.rewardStructure,
      rewardValueTZS: Number(formData.rewardValueTZS),
      rewardPercent: Number(formData.rewardPercent),
      budgetTZS: Number(formData.estimatedBudgetTZS),
      spentTZS: 0,
      status: 'SUBMITTED',
      version: 1,
      activePartners: 0,
      totalConversions: 0,
      trackingMethod: formData.trackingMethod,
      startDate: formData.startDate,
      endDate: formData.endDate,
      attributionWindowDays: Number(formData.attributionWindowDays),
      partnerDeliverables: formData.partnerDeliverables,
      evidenceRequired: formData.evidenceRequired,
      cancellationTerms: formData.cancellationTerms,
      coverImageUrl: formData.coverImageUrl,
      promoVideoUrl: formData.promoVideoUrl,
      galleryImageUrls: formData.galleryImageUrls,
      marketingAssets: formData.marketingAssets,
      createdAt: 'Today',
    }

    createDealOpportunity(
      {
        title: formData.title,
        opportunityType: (formData.type as any) || 'CUSTOMER_ACQUISITION',
        category: formData.category || 'Renewable Energy',
        summary: formData.publicSummary || formData.title,
        description: formData.subscriberDescription || formData.publicSummary || formData.title,
        rewardType: formData.rewardStructure === 'PERCENTAGE_COMMISSION' ? 'PERCENTAGE_COMMISSION' : 'COST_PER_ACQUISITION',
        baseRewardValue: Number(formData.rewardValueTZS) || 50000,
        currency: 'TZS',
        attributionWindowDays: Number(formData.attributionWindowDays) || 30,
        percentageBps: Number(formData.rewardPercent) ? Number(formData.rewardPercent) * 100 : undefined,
        totalBudgetTZS: Number(formData.estimatedBudgetTZS) || 10000000,
        maxPartners: 50,
        region: formData.region || 'All Tanzania',
        termsAndConditions: formData.cancellationTerms || 'Reward is validated upon delivery note and verification.',
        requiresApproval: true,
        featuredImageUrl: formData.coverImageUrl,
        promoVideoUrl: formData.promoVideoUrl,
      },
      'org_current',
      formData.title ? 'Verified Business Ltd' : 'My Business Ltd',
      'PENDING_REVIEW'
    )

    onOpportunityCreated(created)
    onClose()
    showToast(
      'success',
      'Opportunity Submitted to LUMO Review',
      `"${created.title}" with rich media assets is now in the Admin Maker-Checker review queue.`
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[94vh] flex flex-col justify-between overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-[#FF6A00] flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Create Commercial Opportunity & Import Media
              </h2>
              <div className="text-xs text-slate-500">
                Step {currentStep} of 8: <strong className="text-[#FF6A00]">{stepsList[currentStep - 1].title}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center gap-1.5 py-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar shrink-0">
          {stepsList.map((st) => (
            <button
              key={st.num}
              onClick={() => {
                if (st.num < currentStep) setCurrentStep(st.num)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentStep === st.num
                  ? 'bg-[#FF6A00] text-white shadow-xs'
                  : currentStep > st.num
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}
            >
              <span>{st.num}. {st.title}</span>
              {currentStep > st.num && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </button>
          ))}
        </div>

        {/* Step Body Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
          {/* STEP 1: OPPORTUNITY TYPE */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Select Opportunity Category & Commercial Model
              </h3>
              <p className="text-slate-500 text-xs">
                Choose the model that best matches how Partners will generate value for your business.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'COMMERCIAL_DEAL', title: 'Commercial Deal', desc: 'Direct product or service sales deal.' },
                  { id: 'ADVERTISING_CAMPAIGN', title: 'Advertising Campaign', desc: 'Paid creator promotion and sponsored posts.' },
                  { id: 'AFFILIATE_PROGRAMME', title: 'Affiliate Programme', desc: 'Recurring link or promo code referral system.' },
                  { id: 'CUSTOMER_ACQUISITION', title: 'Customer Acquisition', desc: 'Pay-per-new verified customer or account activation.' },
                  { id: 'LEAD_GENERATION', title: 'Lead Generation', desc: 'Pay for verified inquiries and phone screenings.' },
                  { id: 'B2B_INTRODUCTION', title: 'B2B Introduction', desc: 'Corporate match, distributor, or procurement bounty.' },
                  { id: 'PRODUCT_OPPORTUNITY', title: 'Product Opportunity', desc: 'Physical product sample distribution and feedback.' },
                  { id: 'REVERSE_OPPORTUNITY', title: 'Reverse Opportunity', desc: 'Bounty posted to source a specific requested asset.' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFormData({ ...formData, type: t.id as OpportunityType })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      formData.type === t.id
                        ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/30 dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white">{t.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: BASIC DETAILS & MEDIA IMPORT */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="font-bold block mb-1">Opportunity Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Solar Home System Regional Acquisition Campaign"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                />
              </div>

              {/* MEDIA & VIDEO IMPORT SECTION */}
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#FF6A00]" />
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      Featured Cover Image & Promotional Video
                    </h4>
                  </div>

                  <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMediaUploadTab('PRESET')}
                      className={`px-2.5 py-1 rounded-lg ${mediaUploadTab === 'PRESET' ? 'bg-[#FF6A00] text-white' : 'text-slate-500'}`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaUploadTab('UPLOAD')}
                      className={`px-2.5 py-1 rounded-lg ${mediaUploadTab === 'UPLOAD' ? 'bg-[#FF6A00] text-white' : 'text-slate-500'}`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaUploadTab('URL')}
                      className={`px-2.5 py-1 rounded-lg ${mediaUploadTab === 'URL' ? 'bg-[#FF6A00] text-white' : 'text-slate-500'}`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {/* Cover Image Controls */}
                {mediaUploadTab === 'PRESET' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {PRESET_COVER_IMAGES.map((img) => (
                      <div
                        key={img.label}
                        onClick={() => setFormData({ ...formData, coverImageUrl: img.url })}
                        className={`relative rounded-2xl overflow-hidden border cursor-pointer group transition-all h-24 ${
                          formData.coverImageUrl === img.url ? 'ring-2 ring-[#FF6A00] border-transparent' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                          <span className="text-[10px] text-white font-bold leading-tight">{img.label}</span>
                        </div>
                        {formData.coverImageUrl === img.url && (
                          <div className="absolute top-1.5 right-1.5 bg-[#FF6A00] text-white rounded-full p-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {mediaUploadTab === 'UPLOAD' && (
                  <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-2 bg-white dark:bg-slate-900">
                    <Upload className="w-6 h-6 text-[#FF6A00] mx-auto" />
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Import Featured Image (PNG, JPG, WebP)
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-[#FF6A00] cursor-pointer"
                    />
                  </div>
                )}

                {mediaUploadTab === 'URL' && (
                  <div>
                    <label className="text-[11px] font-bold block mb-1">Direct Image URL (HTTPS)</label>
                    <input
                      type="url"
                      placeholder="https://images.example.com/cover.jpg"
                      value={formData.coverImageUrl}
                      onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                      className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-mono text-xs"
                    />
                  </div>
                )}

                {/* Cover Image Current Preview */}
                {formData.coverImageUrl && (
                  <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-2xl border">
                    <img
                      src={formData.coverImageUrl}
                      alt="Selected Cover"
                      className="w-16 h-12 object-cover rounded-xl shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-emerald-600 font-bold block">✓ Cover Image Active</span>
                      <span className="text-[11px] text-slate-500 truncate block font-mono">
                        {formData.coverImageUrl}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, coverImageUrl: '' })}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Promotional Video URL & Upload */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Film className="w-4 h-4 text-purple-600" />
                      <span>Promotional Video Pitch (YouTube / Vimeo / MP4 File)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Optional · Boosts partner conversion by +40%</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="url"
                        placeholder="https://youtube.com/watch?v=... or MP4 URL"
                        value={formData.promoVideoUrl}
                        onChange={(e) => setFormData({ ...formData, promoVideoUrl: e.target.value })}
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-mono text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 py-2 px-3 bg-white dark:bg-slate-900 border rounded-xl font-bold text-center cursor-pointer hover:bg-slate-100 flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200">
                        <Video className="w-3.5 h-3.5 text-purple-600" />
                        <span>Upload Video (.mp4)</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Multi-Image Gallery Carousel */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Product & Proof Gallery ({formData.galleryImageUrls.length} images)</span>
                    </div>
                    <label className="text-xs text-[#FF6A00] font-bold cursor-pointer hover:underline flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Photos</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleGalleryUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {formData.galleryImageUrls.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                      {formData.galleryImageUrls.map((url, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border shrink-0 group">
                          <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                galleryImageUrls: formData.galleryImageUrls.filter((_, i) => i !== idx),
                              })
                            }
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Public Summary (Visible on LUMO Marketplace)</label>
                <textarea
                  rows={2}
                  placeholder="A concise 1-2 sentence pitch explaining the opportunity..."
                  value={formData.publicSummary}
                  onChange={(e) => setFormData({ ...formData, publicSummary: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Full Subscriber-Only Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide comprehensive details on target customers, pricing, sales materials, and partner guidelines..."
                  value={formData.subscriberDescription}
                  onChange={(e) => setFormData({ ...formData, subscriberDescription: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Industry Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Renewable Energy">Renewable Energy & Solar</option>
                    <option value="FinTech & Banking">FinTech & Mobile Money</option>
                    <option value="AgriBusiness">AgriBusiness & Inputs</option>
                    <option value="Health & FMCG">Health & FMCG Goods</option>
                    <option value="Education & Skills">Education & Vocational Skills</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Target Geographic Region</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Coastal & Dar es Salaam">Dar es Salaam, Pwani, Morogoro</option>
                    <option value="Arusha & Kilimanjaro">Arusha, Kilimanjaro, Manyara</option>
                    <option value="Mwanza & Lake Zone">Mwanza, Mara, Kagera, Shinyanga</option>
                    <option value="Central & Dodoma">Dodoma, Singida, Tabora</option>
                    <option value="National (Tanzania Mainland)">National (All Regions)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: COMMERCIAL RESULT */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Define the Qualifying Commercial Result
              </h3>
              <p className="text-slate-500 text-xs">
                What verifiable action triggers a partner reward?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'COMPLETED_SALE', title: 'Completed Sale', desc: 'Customer pays for product or service.' },
                  { id: 'QUALIFIED_LEAD', title: 'Qualified Lead', desc: 'Customer contact verified and phone screened.' },
                  { id: 'NEW_CUSTOMER', title: 'New Customer Account', desc: 'Account registration and KYC completed.' },
                  { id: 'BOOKING', title: 'Service Booking', desc: 'Appointment or booking deposit paid.' },
                  { id: 'SUBSCRIPTION', title: 'Active Subscription', desc: 'Recurring subscription activated.' },
                  { id: 'APPROVED_CONTENT', title: 'Approved Content', desc: 'Sponsored video or review approved by brand.' },
                  { id: 'PRODUCT_DELIVERY', title: 'Product Delivery', desc: 'Shipment delivered to end customer.' },
                  { id: 'COMMERCIAL_INTRODUCTION', title: 'Commercial Introduction', desc: 'Direct meeting hosted with procurement officer.' },
                  { id: 'SIGNED_DISTRIBUTOR_CONTRACT', title: 'Signed Contract', desc: 'Countersigned B2B dealer agreement.' },
                ].map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setFormData({ ...formData, commercialResult: res.id as CommercialResultType })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      formData.commercialResult === res.id
                        ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/30 dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white">{res.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{res.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: REWARD STRUCTURE */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Configure Partner Reward Structure
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'FIXED_REWARD', title: 'Fixed Reward (TZS)', desc: 'Fixed cash reward per verified result.' },
                  { id: 'PERCENTAGE_COMMISSION', title: 'Percentage Commission (%)', desc: 'Share of customer transaction value.' },
                  { id: 'COST_PER_LEAD', title: 'Cost Per Lead (CPL)', desc: 'Fixed payment per verified lead.' },
                  { id: 'COST_PER_ACQUISITION', title: 'Cost Per Acquisition (CPA)', desc: 'Fixed payment per onboarded customer.' },
                  { id: 'RECURRING_COMMISSION', title: 'Recurring Commission', desc: 'Ongoing monthly % on refills/subscriptions.' },
                  { id: 'BOUNTY', title: 'Bounty / Commercial Bounty', desc: 'Lump-sum milestone payment on deal completion.' },
                ].map((rw) => (
                  <button
                    key={rw.id}
                    onClick={() => setFormData({ ...formData, rewardStructure: rw.id as RewardStructureType })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      formData.rewardStructure === rw.id
                        ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/30 dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs">{rw.title}</div>
                    <div className="text-[10px] text-slate-500">{rw.desc}</div>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border space-y-3">
                {formData.rewardStructure === 'PERCENTAGE_COMMISSION' || formData.rewardStructure === 'RECURRING_COMMISSION' ? (
                  <div>
                    <label className="font-bold block mb-1">Commission Rate (%)</label>
                    <input
                      type="number"
                      value={formData.rewardPercent}
                      onChange={(e) => setFormData({ ...formData, rewardPercent: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-mono font-bold text-base"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-bold block mb-1">Fixed Reward Value (TZS)</label>
                    <input
                      type="number"
                      value={formData.rewardValueTZS}
                      onChange={(e) => setFormData({ ...formData, rewardValueTZS: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-mono font-bold text-base"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: TRACKING METHOD */}
          {currentStep === 5 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Select Conversion Tracking & Evidence Method
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'QR_CODE', title: 'Dynamic QR Code', desc: 'Scan code on flyers, packaging, or product labels.' },
                  { id: 'PROMO_CODE', title: 'Personalized Promo Code', desc: 'Customer applies code at checkout or call center.' },
                  { id: 'LUMO_TRACKING_LINK', title: 'LUMO Tracking Link', desc: 'Unique URL with automatic UTM affiliate attribution.' },
                  { id: 'WEBHOOK', title: 'API / Webhook Event', desc: 'Real-time server-to-server callback integration.' },
                  { id: 'CSV_UPLOAD', title: 'CSV Batch Invoices', desc: 'Weekly upload of offline store receipts.' },
                  { id: 'MANUAL_EVIDENCE_APPROVAL', title: 'Manual Evidence Upload', desc: 'Partner uploads contract copy and photo proof.' },
                ].map((tr) => (
                  <button
                    key={tr.id}
                    onClick={() => setFormData({ ...formData, trackingMethod: tr.id as TrackingMethod })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      formData.trackingMethod === tr.id
                        ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/30 dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs">{tr.title}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{tr.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: FUNDING AND ESCROW */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Escrow Funding & Safeguarding Terms
              </h3>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Safeguarded Escrow Policy:</strong> Reward funds are deposited and safeguarded through LUMO’s licensed banking partners (CRDB Bank Escrow & Vodacom Trust Account). Funds are only released upon confirmed conversion validation.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Committed Reward Budget (TZS)</label>
                  <input
                    type="number"
                    value={formData.estimatedBudgetTZS}
                    onChange={(e) => setFormData({ ...formData, estimatedBudgetTZS: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Settlement Payout Schedule</label>
                  <select
                    value={formData.payoutSchedule}
                    onChange={(e) => setFormData({ ...formData, payoutSchedule: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="WEEKLY_FRIDAY">Weekly Payouts (Every Friday)</option>
                    <option value="BI_WEEKLY">Bi-Weekly Settlement</option>
                    <option value="MONTHLY_END">Monthly Milestone Settlement</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: TERMS AND EVIDENCE */}
          {currentStep === 7 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Deliverables, Evidence & Dispute Conditions
              </h3>

              <div>
                <label className="font-bold block mb-1">Partner Deliverables & Action Required</label>
                <textarea
                  rows={2}
                  value={formData.partnerDeliverables}
                  onChange={(e) => setFormData({ ...formData, partnerDeliverables: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Verification Evidence Required</label>
                <textarea
                  rows={2}
                  value={formData.evidenceRequired}
                  onChange={(e) => setFormData({ ...formData, evidenceRequired: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Attribution Cookie Window (Days)</label>
                  <input
                    type="number"
                    value={formData.attributionWindowDays}
                    onChange={(e) => setFormData({ ...formData, attributionWindowDays: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Dispute Procedure</label>
                  <input
                    type="text"
                    value={formData.disputeProcedure}
                    onChange={(e) => setFormData({ ...formData, disputeProcedure: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: PREVIEW & SUBMISSION WITH MEDIA CAROUSEL */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Preview Opportunity & Confirm Submission
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Review how this opportunity and media assets will appear to Partners on the LUMO Marketplace.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setPreviewDevice('DESKTOP')}
                    className={`p-1.5 rounded-lg ${previewDevice === 'DESKTOP' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-400'}`}
                  >
                    <Laptop className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('MOBILE')}
                    className={`p-1.5 rounded-lg ${previewDevice === 'MOBILE' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-400'}`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Deal Card Preview with Media Banner */}
              <div
                className={`rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md overflow-hidden ${
                  previewDevice === 'MOBILE' ? 'max-w-xs mx-auto' : ''
                }`}
              >
                {/* Media Image Banner & Video Play Badge */}
                {formData.coverImageUrl && (
                  <div className="relative h-44 sm:h-52 w-full bg-slate-900">
                    <img
                      src={formData.coverImageUrl}
                      alt="Opportunity Cover"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] bg-[#FF6A00] text-white font-black uppercase px-2.5 py-1 rounded-full shadow-sm">
                        {formData.category}
                      </span>
                    </div>

                    {formData.promoVideoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-xl backdrop-blur-xs group hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-slate-900 ml-0.5 text-slate-900" />
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-xs font-mono font-black text-white bg-black/50 px-2 py-0.5 rounded-lg backdrop-blur-xs">
                        TZS {Number(formData.rewardValueTZS).toLocaleString()} / Result
                      </span>
                      {formData.promoVideoUrl && (
                        <span className="text-[10px] bg-purple-600/90 text-white font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 backdrop-blur-xs">
                          <Film className="w-3 h-3" />
                          <span>Video Pitch Attached</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4 sm:p-5 space-y-3">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                    {formData.title || 'Untitled Commercial Opportunity'}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {formData.publicSummary || 'No public summary provided.'}
                  </p>

                  {/* Gallery Thumbnails Strip */}
                  {formData.galleryImageUrls.length > 0 && (
                    <div className="pt-2 border-t space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Product Photos:</span>
                      <div className="flex gap-1.5 overflow-x-auto py-1">
                        {formData.galleryImageUrls.map((url, i) => (
                          <img key={i} src={url} alt="Thumbnail" className="w-12 h-12 object-cover rounded-lg border" />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tracking Method:</span>
                      <span className="font-bold">{formData.trackingMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Region:</span>
                      <span className="font-bold">{formData.region}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance Declarations */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.confirmAccurate}
                    onChange={(e) => setFormData({ ...formData, confirmAccurate: e.target.checked })}
                    className="w-4 h-4 text-[#FF6A00] rounded mt-0.5"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    I declare that all business media assets, commercial claims, and video contents are authentic and compliant with Tanzanian advertising regulations.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.confirmFundingReady}
                    onChange={(e) => setFormData({ ...formData, confirmFundingReady: e.target.checked })}
                    className="w-4 h-4 text-[#FF6A00] rounded mt-0.5"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    I confirm that reward escrow funds (TZS {Number(formData.estimatedBudgetTZS).toLocaleString()}) are allocated and will be funded through LUMO licensed payment partners.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.confirmNoSilentChanges}
                    onChange={(e) => setFormData({ ...formData, confirmNoSilentChanges: e.target.checked })}
                    className="w-4 h-4 text-[#FF6A00] rounded mt-0.5"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    <strong>Immutability Acknowledgment:</strong> I understand that published commercial terms, reward percentages, and attribution windows cannot be silently altered or reduced once active Partners enroll.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 gap-3">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              currentStep === 1 ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'border hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex gap-2">
            {currentStep < 8 ? (
              <button
                onClick={handleNext}
                className="py-2.5 px-6 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitToLumo}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Submit Opportunity with Media</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
