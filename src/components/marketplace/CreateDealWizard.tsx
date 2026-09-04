'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Sparkles,
  ShieldCheck,
  Calculator,
  PlusCircle,
  HelpCircle,
} from 'lucide-react'
import { createDealOpportunity } from '@/modules/deals/service'
import { TANZANIA_OPPORTUNITY_CATEGORIES, TANZANIA_REGIONS } from '@/modules/deals/taxonomy'
import type { OpportunityTypeSchema, RewardTypeSchema } from '@/modules/deals/types'
import { z } from 'zod'

interface CreateDealWizardProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateDealWizard({ onSuccess, onCancel }: CreateDealWizardProps) {
  const [step, setStep] = useState(1)

  // Form State
  const [title, setTitle] = useState('')
  const [opportunityType, setOpportunityType] = useState<z.infer<typeof OpportunityTypeSchema>>('CUSTOMER_ACQUISITION')
  const [category, setCategory] = useState('Products')
  const [subcategory, setSubcategory] = useState('Electronics')
  const [region, setRegion] = useState('Dar es Salaam')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [rewardType, setRewardType] = useState<z.infer<typeof RewardTypeSchema>>('COST_PER_ACQUISITION')
  const [baseRewardValue, setBaseRewardValue] = useState(45000)
  const [principalPrice, setPrincipalPrice] = useState(100000)
  const [percentageBps, setPercentageBps] = useState(1000) // 10%
  const [totalBudget, setTotalBudget] = useState(5000000)
  const [maxPartners, setMaxPartners] = useState(50)
  const [expiryDays, setExpiryDays] = useState(30)
  const [terms, setTerms] = useState('Reward is validated upon technician sign-off and customer down-payment confirmation. Attribution window is 30 days.')
  const [requiresApproval, setRequiresApproval] = useState(true)
  const [featuredImageUrl, setFeaturedImageUrl] = useState('https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=60')
  const [promoVideoUrl, setPromoVideoUrl] = useState('')

  const handlePublish = () => {
    createDealOpportunity(
      {
        title,
        opportunityType,
        category,
        subcategory,
        summary,
        description,
        rewardType,
        baseRewardValue,
        principalPriceTZS: principalPrice,
        percentageBps: rewardType === 'PERCENTAGE_COMMISSION' ? percentageBps : undefined,
        totalBudgetTZS: totalBudget,
        maxPartners,
        region,
        termsAndConditions: terms,
        requiresApproval,
        featuredImageUrl,
        promoVideoUrl: promoVideoUrl || undefined,
        currency: 'TZS',
        attributionWindowDays: 30,
        expiryDays,
      },
      'org_active_business',
      'Kijani Solar Tech'
    )
    onSuccess()
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      {/* Step Indicator */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 mb-6">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Step {step} of 4
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {step === 1 && '1. Opportunity Definition & Category'}
            {step === 2 && '2. Deliverables & Commercial Value'}
            {step === 3 && '3. Compensation, Budget & Commission Engine'}
            {step === 4 && '4. Review & Publish Deal'}
          </h2>
        </div>

        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-8 h-2 rounded-full transition-colors ${
                step >= i ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Definition */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Deal Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Expand Residential Solar Systems in Morogoro"
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Opportunity Model
              </label>
              <select
                value={opportunityType}
                onChange={(e) => setOpportunityType(e.target.value as any)}
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                <option value="CUSTOMER_ACQUISITION">Customer Acquisition (CPA)</option>
                <option value="QUALIFIED_LEADS">Qualified Lead Generation</option>
                <option value="PRODUCT_SALES">Product Sales Commission</option>
                <option value="CONTENT_CREATION">Content Creation & Influence</option>
                <option value="DISTRIBUTOR_SEARCH">Distributor Search Bounty</option>
                <option value="B2B_INTRODUCTION">B2B Commercial Introduction</option>
                <option value="SUBSCRIPTION_PROMOTION">Subscription Promotion</option>
                <option value="REVERSE_SOURCING">Reverse-Sourcing Opportunity</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Industry Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  const group = TANZANIA_OPPORTUNITY_CATEGORIES.find((item) => item.value === e.target.value)
                  setSubcategory(group?.subcategories[0] || '')
                }}
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                {TANZANIA_OPPORTUNITY_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>{item.icon} {item.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Specific Category
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
            >
              {TANZANIA_OPPORTUNITY_CATEGORIES.find((item) => item.value === category)?.subcategories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Geographic Region Focus
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
            >
              {TANZANIA_REGIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Step 2: Deliverables */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Marketplace Summary (Short Pitch)
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Earn TZS 45,000 for every verified household solar power installation."
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Deliverable & Validation Conditions
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain how conversions are tracked, customer qualification criteria, technician checkouts, or demo meeting expectations..."
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Verification Terms & Fraud Reversal Policy
            </label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
            />
          </div>

          {/* Media & Video Import */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-3">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Deal Cover Image & Video Media</span>
              <span className="text-[10px] text-orange-600 font-normal">Import Image / Video URL</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Featured Cover Image URL
                </label>
                <input
                  type="url"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full text-xs p-2.5 border rounded-lg bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Promotional Video Pitch (YouTube / MP4)
                </label>
                <input
                  type="url"
                  value={promoVideoUrl}
                  onChange={(e) => setPromoVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or MP4 URL"
                  className="w-full text-xs p-2.5 border rounded-lg bg-white dark:bg-slate-900 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Compensation & Budget */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reward Model
              </label>
              <select
                value={rewardType}
                onChange={(e) => setRewardType(e.target.value as any)}
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                <option value="COST_PER_ACQUISITION">Fixed Cost Per Acquisition (CPA)</option>
                <option value="COST_PER_LEAD">Fixed Cost Per Qualified Lead (CPL)</option>
                <option value="PERCENTAGE_COMMISSION">Percentage Revenue Share (%)</option>
                <option value="FIXED_COMMISSION">Fixed Commercial Bounty</option>
                <option value="HYBRID">Hybrid (Fixed Base + % Revenue Share)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {rewardType === 'PERCENTAGE_COMMISSION' ? 'Commission Rate (%)' : 'Fixed Reward Amount (TZS)'}
              </label>
              {rewardType === 'PERCENTAGE_COMMISSION' ? (
                <input
                  type="number"
                  value={percentageBps / 100}
                  onChange={(e) => setPercentageBps(Number(e.target.value) * 100)}
                  placeholder="e.g. 15 for 15%"
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              ) : (
                <input
                  type="number"
                  value={baseRewardValue}
                  onChange={(e) => setBaseRewardValue(Number(e.target.value))}
                  placeholder="e.g. 45000"
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Principal Price / Deal Value (TZS)
              </label>
              <input
                type="number"
                min={1}
                value={principalPrice}
                onChange={(e) => setPrincipalPrice(Number(e.target.value))}
                placeholder="e.g. 85000000"
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Campaign Budget (TZS)
              </label>
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                placeholder="e.g. 5000000"
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Partner Seat Cap
              </label>
              <input
                type="number"
                value={maxPartners}
                onChange={(e) => setMaxPartners(Number(e.target.value))}
                placeholder="e.g. 50"
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Deal Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                placeholder="e.g. 30"
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Calculator preview */}
          <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-800 dark:text-orange-300 mb-2">
              <Calculator className="w-4 h-4 text-orange-600" />
              <span>Attribution & Economics Estimate</span>
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed">
              With a budget of <strong>TZS {totalBudget.toLocaleString()}</strong> and reward of{' '}
              <strong>TZS {baseRewardValue.toLocaleString()}</strong>, your campaign supports up to{' '}
              <strong>{Math.floor(totalBudget / (baseRewardValue || 1))} verified outcomes</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Step 4: Preview */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Deal Preview</div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {title || 'Untitled Commercial Deal'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              {summary || 'No summary provided'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Type</span>
                <strong className="text-slate-800 dark:text-slate-200">{opportunityType}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Category</span>
                <strong className="text-slate-800 dark:text-slate-200">{category}</strong>
                <span className="block text-[10px] text-slate-400">{subcategory}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Principal Price</span>
                <strong className="text-slate-800 dark:text-slate-200">TZS {principalPrice.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Reward</span>
                <strong className="text-orange-600">TZS {baseRewardValue.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Budget</span>
                <strong className="text-slate-800 dark:text-slate-200">TZS {totalBudget.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Expires</span>
                <strong className="text-emerald-700 dark:text-emerald-400">In {expiryDays} days</strong>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 dark:text-emerald-300">
              <strong className="block mb-0.5">Ready for instant marketplace publishing</strong>
              <span>
                Your deal will be listed in the LUMO marketplace. Partners will receive tracking links, and conversions will be processed through the verification pipeline.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="py-2 px-4 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="py-2.5 px-5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            Continue
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            Publish Deal to Marketplace
          </button>
        )}
      </div>
    </div>
  )
}
