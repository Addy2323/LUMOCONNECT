'use client'

import React from 'react'
import { X, CheckCircle2, ShieldCheck, ArrowRight, DollarSign, Building, Sparkles } from 'lucide-react'

interface HowItWorksModalProps {
  isOpen: boolean
  onClose: () => void
  onGetStarted: () => void
}

export function HowItWorksModal({ isOpen, onClose, onGetStarted }: HowItWorksModalProps) {
  if (!isOpen) return null

  const steps = [
    {
      num: '01',
      title: 'Businesses Create Measurable Opportunities',
      desc: 'Companies publish concrete commercial goals: verified product sales, activated SME accounts, approved creator content, or regional wholesale distributor introductions.',
    },
    {
      num: '02',
      title: 'Partners Discover & Promote with Custom Tools',
      desc: 'Verified Partners enroll in opportunities, receive unique tracking links and QR codes, and promote across WhatsApp, social media, or executive networks.',
    },
    {
      num: '03',
      title: 'Customers Complete Real Transactions',
      desc: 'Buyers purchase products or activate services. No fake signups or recruitment schemes are ever rewarded.',
    },
    {
      num: '04',
      title: 'LUMO Tracks, Verifies & Attributes Outcomes',
      desc: 'Our attribution engine cross-references work orders, payment confirmations, and fraud risk scores with explainable evidence.',
    },
    {
      num: '05',
      title: 'Partners Earn & Disburse to Mobile Money',
      desc: 'Commissions transition through an auditable lifecycle. Approved funds are disbursed directly to M-Pesa, Airtel Money, or Tigo Pesa with automated TRA tax withholding.',
    },
    {
      num: '06',
      title: 'Businesses Scale with Predictable Acquisition Costs',
      desc: 'Businesses pay only when verifiable results are delivered, driving real economic momentum.',
    },
    {
      num: '07',
      title: 'LUMO Operates as the Orchestration Engine',
      desc: 'LUMO monetizes through platform service fees, enterprise subscriptions, and escrowed deal rooms without being an unlicensed fund custodian.',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/50 px-2.5 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Core Operating Model</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            How LUMO Works
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Governing Principle: <strong className="text-slate-800 dark:text-slate-200">Money follows genuine and independently verifiable economic activity.</strong>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-6 text-xs">
          {steps.map((step) => (
            <div key={step.num} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="w-7 h-7 rounded-lg bg-orange-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                {step.num}
              </span>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-0.5">
                  {step.title}
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero recruitment rewards. Pure economic output.</span>
          </div>
          <button
            onClick={() => {
              onClose()
              onGetStarted()
            }}
            className="py-2.5 px-5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <span>Get Started with LUMO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
