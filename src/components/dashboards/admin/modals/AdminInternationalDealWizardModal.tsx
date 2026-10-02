'use client'

import React, { useState } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Globe,
  DollarSign,
  ShieldCheck,
  Target,
  Layers,
  Link,
  Award,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Building2,
  FileText,
} from 'lucide-react'
import {
  InternationalDealType,
  InternationalRewardStructure,
  CreateInternationalDealWizardInput,
} from '@/src/modules/international/types'
import { ISO_COUNTRIES } from '@/src/modules/international/countries'

interface AdminInternationalDealWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const WIZARD_STEPS = [
  { step: 1, title: 'Origin & Target Market', desc: 'Define countries & regional scope' },
  { step: 2, title: 'Classification & Info', desc: 'Deal type, title & descriptions' },
  { step: 3, title: 'Scope & Deliverables', desc: 'Outcomes & success criteria' },
  { step: 4, title: 'Reward & Multi-Currency', desc: 'Commission, bounty & bonuses' },
  { step: 5, title: 'Partner Requirements', desc: 'Eligibility, KYC & partner types' },
  { step: 6, title: 'Tracking & Attribution', desc: 'Links, codes & attribution' },
  { step: 7, title: 'Verification & Risk', desc: 'Brand audit & verification' },
  { step: 8, title: 'Publishing Settings', desc: 'Featured flags & access rules' },
  { step: 9, title: 'Final Review & Publish', desc: 'Review deal dossier & launch' },
]

const DEAL_TYPES: InternationalDealType[] = [
  'Sales Deal',
  'Advertising Campaign',
  'Affiliate Program',
  'Customer Acquisition',
  'Lead Generation',
  'B2B Opportunity',
  'Distributor Opportunity',
  'Supplier Opportunity',
  'Sourcing Opportunity',
  'Product Opportunity',
  'Service Opportunity',
  'Travel Opportunity',
  'Property Opportunity',
  'SaaS Opportunity',
  'Event Promotion',
  'Business Introduction',
  'Franchise Opportunity',
  'Import Opportunity',
  'Export Opportunity',
  'Other',
]

export function AdminInternationalDealWizardModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminInternationalDealWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [formData, setFormData] = useState<CreateInternationalDealWizardInput>({
    title: '',
    shortDescription: '',
    fullDescription: '',
    dealType: 'Sales Deal',
    originCountryCode: 'CN',
    originCountryName: 'China',
    targetCountryCode: 'TZ',
    targetCountryName: 'Tanzania',
    targetRegion: 'East Africa',
    remoteOnline: true,
    crossBorder: true,
    dealLanguage: 'English',
    requiredOutcome: '',
    successCondition: '',
    rewardStructure: {
      rewardType: 'HYBRID',
      currency: 'USD',
      commissionRate: 5,
      fixedReward: 50,
      milestoneBonusRules: [
        { targetCount: 50, bonusAmount: 500, currency: 'USD' },
      ],
      displayLabel: '5% Commission + USD 500 Bonus',
    },
    partnerRequirements: {
      eligibilityMode: 'OPEN',
      partnerTypes: ['Sales Agent', 'Affiliate', 'Creator'],
      requireKYC: true,
      requireKYB: false,
    },
    trackingConfig: {
      trackingMethod: 'LINK',
      destinationUrl: '',
    },
    verificationDetails: {
      sourceType: 'Direct brand relationship',
      contactPersonName: '',
      contactPersonEmail: '',
      verificationStatus: 'VERIFIED',
    },
    isFeatured: true,
    isTrending: false,
  })

  if (!isOpen) return null

  const handleNext = () => {
    setError('')
    // Validation per step
    if (currentStep === 1) {
      if (!formData.originCountryCode || !formData.targetCountryCode) {
        setError('Please select both Origin and Target countries.')
        return
      }
    }
    if (currentStep === 2) {
      if (!formData.title || !formData.shortDescription) {
        setError('Please provide a title and short summary for the deal.')
        return
      }
    }
    if (currentStep === 3) {
      if (!formData.requiredOutcome || !formData.successCondition) {
        setError('Please specify the required outcome and success criteria.')
        return
      }
    }

    if (currentStep < 9) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setError('')
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/international/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        onSuccess()
        onClose()
      } else {
        setError(data.error || 'Failed to create international deal.')
      }
    } catch (err: any) {
      setError(err.message || 'Server error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // Milestone bonus rule handlers
  const addMilestoneRule = () => {
    const rules = formData.rewardStructure.milestoneBonusRules || []
    setFormData({
      ...formData,
      rewardStructure: {
        ...formData.rewardStructure,
        milestoneBonusRules: [
          ...rules,
          { targetCount: 100, bonusAmount: 1000, currency: formData.rewardStructure.currency },
        ],
      },
    })
  }

  const removeMilestoneRule = (index: number) => {
    const rules = [...(formData.rewardStructure.milestoneBonusRules || [])]
    rules.splice(index, 1)
    setFormData({
      ...formData,
      rewardStructure: {
        ...formData.rewardStructure,
        milestoneBonusRules: rules,
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl text-slate-100 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Create International Commercial Opportunity</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/40">
                  Step {currentStep} of 9
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                LUMO Admin Specification Desk — Exclusive Opportunity Publisher
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar / Step Navigator */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto">
          <div className="flex items-center min-w-max space-x-2">
            {WIZARD_STEPS.map((s) => {
              const isActive = s.step === currentStep
              const isCompleted = s.step < currentStep
              return (
                <button
                  key={s.step}
                  onClick={() => s.step <= currentStep && setCurrentStep(s.step)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                      : isCompleted
                      ? 'bg-slate-800/90 text-cyan-400 hover:bg-slate-800'
                      : 'bg-slate-900/60 text-slate-500'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      isActive
                        ? 'bg-slate-950 text-cyan-400 font-bold'
                        : isCompleted
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? '✓' : s.step}
                  </span>
                  <span>{s.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard Body Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {/* STEP 1: Origin & Target Market */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> 1. Origin Company & Cross-Border Scope
                </h3>
                <p className="text-xs text-slate-400">
                  Specify the foreign brand/country originating the commercial opportunity and the target market.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Origin Country (Brand Location) *
                  </label>
                  <select
                    value={formData.originCountryCode}
                    onChange={(e) => setFormData({ ...formData, originCountryCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  >
                    {ISO_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Origin Country Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. United Arab Emirates, China, United Kingdom"
                    value={formData.originCountryName || ''}
                    onChange={(e) => setFormData({ ...formData, originCountryName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Country (Where Partners Perform) *
                  </label>
                  <select
                    value={formData.targetCountryCode}
                    onChange={(e) => setFormData({ ...formData, targetCountryCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  >
                    {ISO_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Region Scope
                  </label>
                  <select
                    value={formData.targetRegion || 'East Africa'}
                    onChange={(e) => setFormData({ ...formData, targetRegion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="Tanzania Only">Tanzania Only</option>
                    <option value="East Africa">East Africa (TZ, KE, UG, RW)</option>
                    <option value="Africa Wide">Africa Wide</option>
                    <option value="Global / Remote">Global / Remote</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <label className="flex items-center space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.remoteOnline}
                    onChange={(e) => setFormData({ ...formData, remoteOnline: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Remote / Online Execution</span>
                    <span className="text-[10px] text-slate-400 block">Partner can perform completely online</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.crossBorder}
                    onChange={(e) => setFormData({ ...formData, crossBorder: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Cross-Border Settlement</span>
                    <span className="text-[10px] text-slate-400 block">Rewards cleared cross-border</span>
                  </div>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deal Language</label>
                  <input
                    type="text"
                    value={formData.dealLanguage || 'English'}
                    onChange={(e) => setFormData({ ...formData, dealLanguage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Classification & Core Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> 2. Opportunity Classification & Core Details
                </h3>
                <p className="text-xs text-slate-400">
                  Set the category, public title, and full operational breakdown for partners.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deal Type *</label>
                  <select
                    value={formData.dealType}
                    onChange={(e) => setFormData({ ...formData, dealType: e.target.value as InternationalDealType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  >
                    {DEAL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Opportunity Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sell 100 Smart Electronics Devices in Tanzania"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Short Description (Marketplace Card Teaser) *
                </label>
                <textarea
                  rows={2}
                  placeholder="Concise 1-2 sentence teaser shown on the opportunity card..."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Opportunity Description & Instructions (Markdown Supported)
                </label>
                <textarea
                  rows={6}
                  placeholder="Detailed breakdown of the commercial opportunity, brand overview, partner expectations, step-by-step instructions..."
                  value={formData.fullDescription || ''}
                  onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Scope & Deliverables */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Target className="w-4 h-4" /> 3. Required Outcome & Verification Criteria
                </h3>
                <p className="text-xs text-slate-400">
                  Clearly define what partners must achieve for reward payout eligibility.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary Required Outcome *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100 Verified Smartphone Sales or Signed Distributor Contract"
                  value={formData.requiredOutcome}
                  onChange={(e) => setFormData({ ...formData, requiredOutcome: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Success & Verification Condition *
                </label>
                <textarea
                  rows={3}
                  placeholder="Exact verification criteria required by LUMO Admin to release reward funds (e.g. Order payment confirmation, bill of lading, signed bilateral agreement)..."
                  value={formData.successCondition}
                  onChange={(e) => setFormData({ ...formData, successCondition: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-500 outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Reward Engine & Multi-Currency */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> 4. Commercial Terms & Multi-Currency Reward Engine
                </h3>
                <p className="text-xs text-slate-400">
                  Configure primary payout currency, commissions, fixed rewards, and milestone bonus tiers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reward Model *</label>
                  <select
                    value={formData.rewardStructure.rewardType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rewardStructure: {
                          ...formData.rewardStructure,
                          rewardType: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="COMMISSION">Commission Only (%)</option>
                    <option value="FIXED">Fixed Amount / Order</option>
                    <option value="HYBRID">Hybrid (% Commission + Fixed Bonus)</option>
                    <option value="CPA">CPA (Cost Per Action / Lead)</option>
                    <option value="BOUNTY">Flat Bounty (Success Fee)</option>
                    <option value="REVENUE_SHARE">Revenue Share Override</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Settlement Currency *</label>
                  <select
                    value={formData.rewardStructure.currency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rewardStructure: {
                          ...formData.rewardStructure,
                          currency: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="USD">USD ($ - United States Dollar)</option>
                    <option value="TZS">TZS (Tsh - Tanzanian Shilling)</option>
                    <option value="KES">KES (KSh - Kenyan Shilling)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="AED">AED (AED - UAE Dirham)</option>
                    <option value="ZAR">ZAR (R - South African Rand)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Marketplace Display Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5% Commission + USD 1,200 Bonus"
                    value={formData.rewardStructure.displayLabel || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rewardStructure: {
                          ...formData.rewardStructure,
                          displayLabel: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 5"
                    value={formData.rewardStructure.commissionRate || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rewardStructure: {
                          ...formData.rewardStructure,
                          commissionRate: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fixed Reward ({formData.rewardStructure.currency})
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={formData.rewardStructure.fixedReward || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rewardStructure: {
                          ...formData.rewardStructure,
                          fixedReward: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              {/* Milestone Bonus Rules */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" /> Milestone Payout Tiers
                  </span>
                  <button
                    type="button"
                    onClick={addMilestoneRule}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Milestone Rule
                  </button>
                </div>

                {(!formData.rewardStructure.milestoneBonusRules ||
                  formData.rewardStructure.milestoneBonusRules.length === 0) && (
                  <p className="text-[11px] text-slate-500">No milestone bonus tiers configured yet.</p>
                )}

                {formData.rewardStructure.milestoneBonusRules?.map((rule, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 font-mono w-16">Tier {idx + 1}</span>
                    <input
                      type="number"
                      placeholder="Target Sales Count"
                      value={rule.targetCount}
                      onChange={(e) => {
                        const rules = [...(formData.rewardStructure.milestoneBonusRules || [])]
                        rules[idx].targetCount = parseInt(e.target.value) || 0
                        setFormData({
                          ...formData,
                          rewardStructure: { ...formData.rewardStructure, milestoneBonusRules: rules },
                        })
                      }}
                      className="w-36 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                    <span className="text-xs text-slate-400 font-mono">Conversions → Bonus:</span>
                    <input
                      type="number"
                      placeholder="Bonus Amount"
                      value={rule.bonusAmount}
                      onChange={(e) => {
                        const rules = [...(formData.rewardStructure.milestoneBonusRules || [])]
                        rules[idx].bonusAmount = parseFloat(e.target.value) || 0
                        setFormData({
                          ...formData,
                          rewardStructure: { ...formData.rewardStructure, milestoneBonusRules: rules },
                        })
                      }}
                      className="w-32 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                    <span className="text-xs font-mono text-cyan-400">{formData.rewardStructure.currency}</span>
                    <button
                      type="button"
                      onClick={() => removeMilestoneRule(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Partner Requirements & Eligibility */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> 5. Partner Requirements & Eligibility Gates
                </h3>
                <p className="text-xs text-slate-400">
                  Control who can see, apply, or auto-enroll into this international deal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Eligibility Mode</label>
                  <select
                    value={formData.partnerRequirements.eligibilityMode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        partnerRequirements: {
                          ...formData.partnerRequirements,
                          eligibilityMode: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="OPEN">Open (All Verified Partners)</option>
                    <option value="RESTRICTED">Restricted (Admin Approval Required)</option>
                    <option value="INVITE_ONLY">Invite Only (Selected Partners)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Minimum Partner Trust Score (0-100)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 75"
                    value={formData.partnerRequirements.minPartnerScore || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        partnerRequirements: {
                          ...formData.partnerRequirements,
                          minPartnerScore: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.partnerRequirements.requireKYC}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        partnerRequirements: {
                          ...formData.partnerRequirements,
                          requireKYC: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Require Identity Verification (KYC)</span>
                    <span className="text-[10px] text-slate-400 block">Verified NIDA/Passport required</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.partnerRequirements.requireKYB}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        partnerRequirements: {
                          ...formData.partnerRequirements,
                          requireKYB: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Require Business Verification (KYB)</span>
                    <span className="text-[10px] text-slate-400 block">Registered business entity required</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 6: Tracking & Attribution Setup */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Link className="w-4 h-4" /> 6. Tracking & Conversion Attribution
                </h3>
                <p className="text-xs text-slate-400">
                  Set up how conversions and sales are attributed to partners.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tracking Method</label>
                  <select
                    value={formData.trackingConfig.trackingMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trackingConfig: {
                          ...formData.trackingConfig,
                          trackingMethod: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="LINK">Unique Partner Referral Link</option>
                    <option value="PROMO_CODE">Promo Code Distribution</option>
                    <option value="LEAD_FORM">LUMO Native Lead Form</option>
                    <option value="MANUAL">Manual Admin Verification</option>
                    <option value="API">Server API Webhook</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Destination / Landing Page URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://lumo.africa/deals/example-deal"
                    value={formData.trackingConfig.destinationUrl || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trackingConfig: {
                          ...formData.trackingConfig,
                          destinationUrl: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Origin Verification & Risk Audit */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> 7. Origin Brand Audit & Verification Details
                </h3>
                <p className="text-xs text-slate-400">
                  Record proof of deal authenticity for internal audit and partner trust assurance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Source Relationship Type</label>
                  <select
                    value={formData.verificationDetails.sourceType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        verificationDetails: {
                          ...formData.verificationDetails,
                          sourceType: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="Direct brand relationship">Direct Brand Relationship</option>
                    <option value="Authorized representative">Authorized Representative / Agent</option>
                    <option value="Verified submitter">Verified Submitter Case</option>
                    <option value="Strategic partner">Strategic Embassy / Chamber Partner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Brand Representative Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wei Chen"
                    value={formData.verificationDetails.contactPersonName || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        verificationDetails: {
                          ...formData.verificationDetails,
                          contactPersonName: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Representative Email / Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. global@brand.example.com"
                    value={formData.verificationDetails.contactPersonEmail || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        verificationDetails: {
                          ...formData.verificationDetails,
                          contactPersonEmail: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Verification Audit Status
                  </label>
                  <select
                    value={formData.verificationDetails.verificationStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        verificationDetails: {
                          ...formData.verificationDetails,
                          verificationStatus: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 outline-none font-semibold text-emerald-400"
                  >
                    <option value="VERIFIED">VERIFIED (100% Audited by LUMO)</option>
                    <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Publishing Settings */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> 8. Marketplace Visibility & Promotion Flags
                </h3>
                <p className="text-xs text-slate-400">
                  Set featured status, badges, and automated enrollment policies.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 p-4 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Featured Opportunity</span>
                    <span className="text-[10px] text-slate-400 block">Pin to top hero banner on International Marketplace</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isTrending}
                    onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Trending Deal</span>
                    <span className="text-[10px] text-slate-400 block">Display High Demand 🔥 badge</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 9: Final Review & Publish */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> 9. Final Dossier Review & Marketplace Launch
                </h3>
                <p className="text-xs text-slate-400">
                  Review the compiled international commercial opportunity before publishing to verified partners.
                </p>
              </div>

              {/* Summary Dossier Card */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/30 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                      {formData.dealType}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">{formData.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{formData.shortDescription}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block">
                      {formData.rewardStructure.displayLabel || `${formData.rewardStructure.commissionRate}% Commission`}
                    </span>
                    <span className="text-[10px] text-slate-400">Primary: {formData.rewardStructure.currency}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Origin Country</span>
                    <span className="font-semibold text-white">{formData.originCountryCode} ({formData.originCountryName || 'Foreign Brand'})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Target Scope</span>
                    <span className="font-semibold text-white">{formData.targetCountryCode} — {formData.targetRegion}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Required Outcome</span>
                    <span className="font-semibold text-cyan-400">{formData.requiredOutcome}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Verification</span>
                    <span className="font-semibold text-emerald-400">✓ VERIFIED BY ADMIN</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            {currentStep < 9 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-500/20 transition"
              >
                <span>Continue Step {currentStep + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition"
              >
                {loading ? (
                  <span>Publishing to Marketplace...</span>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Publish Deal to International Marketplace</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
