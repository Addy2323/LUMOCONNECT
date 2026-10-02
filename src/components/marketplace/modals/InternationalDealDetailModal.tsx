'use client'

import React, { useState } from 'react'
import {
  X,
  Globe,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Send,
  Sparkles,
  HelpCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { AdminInternationalDealItem } from '@/src/modules/international/types'

interface InternationalDealDetailModalProps {
  deal: AdminInternationalDealItem | null
  isOpen: boolean
  onClose: () => void
  onApplied?: () => void
}

export function InternationalDealDetailModal({
  deal,
  isOpen,
  onClose,
  onApplied,
}: InternationalDealDetailModalProps) {
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [showFullDetails, setShowFullDetails] = useState(false)
  const [showEstimator, setShowEstimator] = useState(false)

  const [partnerName, setPartnerName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [partnerPhone, setPartnerPhone] = useState('')
  const [partnerCountry, setPartnerCountry] = useState('TZ')
  const [applicationNote, setApplicationNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Interactive Earnings Calculator State
  const [calcTargetCount, setCalcTargetCount] = useState(10)

  if (!isOpen || !deal) return null

  // Calculate estimated earnings based on deal reward structure
  const calcCommission = ((deal.rewardStructure.commissionRate || 0) / 100) * (calcTargetCount * 100)
  const calcFixed = (deal.rewardStructure.fixedReward || 0) * calcTargetCount
  const calcCpa = (deal.rewardStructure.cpaAmount || 0) * calcTargetCount
  let calcBonus = 0
  if (deal.rewardStructure.milestoneBonusRules) {
    for (const rule of deal.rewardStructure.milestoneBonusRules) {
      if (calcTargetCount >= rule.targetCount) {
        calcBonus += rule.bonusAmount
      }
    }
  }
  const totalEstEarnings = calcCommission + calcFixed + calcCpa + calcBonus

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partnerName.trim() || !partnerEmail.trim()) {
      setErrorMsg('Please enter your full name and email address.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/international/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          partnerUserId: `partner_${Date.now()}`,
          partnerName,
          partnerEmail,
          partnerPhone,
          partnerCountry,
          applicationNote,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg(data.message || 'Application submitted successfully!')
        if (onApplied) onApplied()
      } else {
        setErrorMsg(data.error || 'Failed to submit application.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#081324] border border-cyan-500/40 ring-1 ring-cyan-500/20 rounded-2xl w-full max-w-4xl text-slate-100 shadow-2xl overflow-hidden my-auto animate-fade-in flex flex-col max-h-[90vh]">
        {/* HEADER SECTION */}
        <div className="relative bg-[#060D1E] border-b border-cyan-900/40 shrink-0">
          {deal.imageUrl && (
            <div className="relative h-36 sm:h-44 w-full overflow-hidden">
              <img
                src={deal.imageUrl}
                alt={deal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060D1E] via-[#060D1E]/60 to-transparent" />
            </div>
          )}

          <div className="p-5 sm:p-6 relative z-10 -mt-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-slate-900/90 hover:bg-slate-800 text-cyan-400 hover:text-white rounded-full transition border border-cyan-500/30 cursor-pointer shadow-lg"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mb-2 pr-12">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 font-mono">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{deal.originCountryFlag} {deal.originCountryName} ➔ {deal.targetCountryFlag} {deal.targetCountryName}</span>
            </span>

            <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {deal.dealType}
            </span>

            {deal.isFeatured && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                ⭐ Featured Deal
              </span>
            )}
            {deal.isTrending && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                🔥 High Demand
              </span>
            )}
          </div>

          {/* Title & Short Teaser */}
          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">{deal.title}</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">{deal.shortDescription}</p>

          {/* Verification Banner */}
          <div className="mt-4 pt-3 border-t border-cyan-900/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PUBLISHED & GUARANTEED BY LUMO ADMIN</span>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>Settlement Currency:</span>
              <span className="text-xs font-bold text-cyan-300 font-mono bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-0.5 rounded-md">
                {deal.rewardStructure.currency}
              </span>
            </div>
          </div>
        </div>
      </div>

        {/* MODAL BODY (SCROLLABLE IF NEEDED, FITS CLEANLY) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* 4-BOX CLARITY GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Q1: What is this opportunity? */}
            <div className="p-4 bg-[#040A15] rounded-xl border border-cyan-900/40 space-y-1.5">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>1. What is this opportunity?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                A verified commercial activity from <strong className="text-white">{deal.originCountryName}</strong> aimed at market execution in <strong className="text-white">{deal.targetCountryName}</strong> ({deal.targetRegion}).
              </p>
            </div>

            {/* Q2: Who is publishing & verifying it? */}
            <div className="p-4 bg-[#040A15] rounded-xl border border-cyan-900/40 space-y-1.5">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                <Building2 className="w-3.5 h-3.5" />
                <span>2. Who is publishing & verifying it?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Directly vetted and published by <strong className="text-white">LUMO Admin Desk</strong> under source audit status: <span className="text-emerald-400 font-bold">VERIFIED</span> ({deal.verificationDetails.sourceType}).
              </p>
            </div>

            {/* Q3: Required outcome */}
            <div className="p-4 bg-[#040A15] rounded-xl border border-cyan-900/40 space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. What outcome is required to earn?</span>
              </div>
              <div className="text-xs text-white font-bold bg-[#0B172E] p-2.5 rounded-xl border border-cyan-800/40 text-center">
                {deal.requiredOutcome}
              </div>
              <p className="text-[11px] text-slate-400">
                Success condition: {deal.successCondition}
              </p>
            </div>

            {/* Q4: Reward structure */}
            <div className="p-4 bg-[#040A15] rounded-xl border border-cyan-900/40 space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Reward & Commission Structure</span>
              </div>
              <p className="text-sm font-extrabold text-emerald-400">
                {deal.rewardStructure.displayLabel || `${deal.rewardStructure.currency} ${deal.rewardStructure.commissionRate}% Commission`}
              </p>
              {deal.rewardStructure.milestoneBonusRules && deal.rewardStructure.milestoneBonusRules.length > 0 && (
                <div className="text-[11px] text-slate-300 space-y-1 pt-0.5">
                  <span className="font-semibold text-slate-400 block text-[10px]">Milestone Bonuses:</span>
                  {deal.rewardStructure.milestoneBonusRules.map((m, i) => (
                    <div key={i} className="flex justify-between font-mono bg-[#0B172E] px-2.5 py-1 rounded border border-slate-800">
                      <span>Reach {m.targetCount} conversions</span>
                      <span className="text-amber-400 font-bold">+{m.currency} {m.bonusAmount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLLAPSIBLE DETAILS BREAKDOWN */}
          {deal.fullDescription && (
            <div className="bg-[#040A15] rounded-xl border border-cyan-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFullDetails(!showFullDetails)}
                className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-cyan-400 hover:text-cyan-300 transition text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Detailed Operational Breakdown & Deliverables</span>
                </span>
                {showFullDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showFullDetails && (
                <div className="p-4 pt-0 border-t border-cyan-900/20 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {deal.fullDescription}
                </div>
              )}
            </div>
          )}

          {/* COLLAPSIBLE EARNINGS ESTIMATOR */}
          <div className="bg-[#040A15] rounded-xl border border-cyan-900/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowEstimator(!showEstimator)}
              className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-cyan-400 hover:text-cyan-300 transition text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Interactive Partner Earnings Estimator</span>
              </span>
              {showEstimator ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showEstimator && (
              <div className="p-4 pt-0 space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-300 font-medium">Target Conversions:</span>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={calcTargetCount}
                    onChange={(e) => setCalcTargetCount(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-bold text-cyan-400 font-mono w-16 text-right">
                    {calcTargetCount} units
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                  <div className="bg-[#0B172E] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Commissions</span>
                    <span className="text-xs font-bold text-white font-mono">
                      {deal.rewardStructure.currency} {calcCommission.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#0B172E] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Fixed Rewards</span>
                    <span className="text-xs font-bold text-white font-mono">
                      {deal.rewardStructure.currency} {(calcFixed + calcCpa).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#0B172E] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Milestone Bonus</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      {deal.rewardStructure.currency} {calcBonus.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-cyan-950/60 p-2.5 rounded-lg border border-cyan-500/40">
                    <span className="text-[10px] text-cyan-300 font-bold block">Est. Payout</span>
                    <span className="text-xs font-extrabold text-emerald-400 font-mono">
                      {deal.rewardStructure.currency} {totalEstEarnings.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* APPLICATION FORM */}
          {applyModalOpen && (
            <form onSubmit={handleApplySubmit} className="p-4 sm:p-5 bg-[#040A15] rounded-xl border border-cyan-500/40 space-y-3.5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2.5">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" /> Apply for {deal.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {successMsg ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs text-center font-bold">
                  ✓ {successMsg}
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Baraka Juma"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        className="w-full bg-[#0B172E] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="baraka@example.com"
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        className="w-full bg-[#0B172E] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Phone / WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="+255 700 000 000"
                        value={partnerPhone}
                        onChange={(e) => setPartnerPhone(e.target.value)}
                        className="w-full bg-[#0B172E] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Base Country</label>
                      <select
                        value={partnerCountry}
                        onChange={(e) => setPartnerCountry(e.target.value)}
                        className="w-full bg-[#0B172E] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                      >
                        <option value="TZ">🇹🇿 Tanzania</option>
                        <option value="KE">🇰🇪 Kenya</option>
                        <option value="UG">🇺🇬 Uganda</option>
                        <option value="ZA">🇿🇦 South Africa</option>
                        <option value="AE">🇦🇪 United Arab Emirates</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Application Note / Strategy (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Describe how you intend to promote or execute this opportunity..."
                      value={applicationNote}
                      onChange={(e) => setApplicationNote(e.target.value)}
                      className="w-full bg-[#0B172E] border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Submitting Application...' : 'Confirm & Apply to International Deal'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        {/* FOOTER BAR */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-t border-cyan-900/40 bg-[#040A15] shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ref: {deal.reference}</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/40 transition cursor-pointer"
            >
              Close
            </button>
            {!applyModalOpen && (
              <button
                onClick={() => setApplyModalOpen(true)}
                className="flex items-center space-x-1.5 px-5 py-1.5 rounded-full text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply & Join Opportunity</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
