'use client'

import React, { useState } from 'react'
import {
  CreditCard,
  CheckCircle2,
  Download,
  Calendar,
  Sparkles,
  Zap,
  Clock,
} from 'lucide-react'
import { MOCK_SAAS_SUBSCRIPTION } from '../mockData'
import { BusinessSaaSSubscription } from '../types'
import { useBusinessToast } from '../BusinessToast'

export function BillingSubscriptionTab() {
  const { showToast } = useBusinessToast()
  const [sub] = useState<BusinessSaaSSubscription>(MOCK_SAAS_SUBSCRIPTION)

  const handleDownloadInvoice = (invNum: string) => {
    showToast('success', 'VAT Invoice Downloaded', `Official TRA electronic invoice ${invNum} downloaded (PDF).`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Business SaaS Subscription & Billing</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
              SaaS Invoices
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your LUMO Business membership tier, opportunity limits, seat capacity, and statutory VAT invoices.
          </p>
        </div>
      </div>

      {/* Plan Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0B132B] to-[#1C2541] text-white space-y-4 shadow-lg border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] bg-[#FF6A00] font-black uppercase px-2.5 py-0.5 rounded-full">
              {sub.cycle} Plan
            </span>
            <h3 className="text-xl sm:text-2xl font-black mt-2">
              {sub.planName}
            </h3>
            <p className="text-xs text-slate-300">Next renewal: {sub.nextBillingDate}</p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black font-mono text-[#FF6A00]">
              TZS {sub.priceTZS.toLocaleString()} / Year
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">✓ Active & Good Standing</span>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-700 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Active Opportunities Capacity:</span>
              <span className="font-bold font-mono">{sub.activeOpportunitiesUsed} / {sub.activeOpportunitiesLimit}</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-[#FF6A00] w-[30%]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Partner Roster Seats:</span>
              <span className="font-bold font-mono">{sub.partnerSeatsUsed} / {sub.partnerSeatsLimit}</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[28%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Electronic Fiscal Billing Invoices (TRA EFD Compliant)
        </h3>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b">
              <tr>
                <th className="p-3">Invoice Number</th>
                <th className="p-3">Billing Date</th>
                <th className="p-3">Amount (incl. 18% VAT)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">PDF Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {sub.invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                    No billing invoices generated yet. Annual and monthly subscription renewals will archive electronic receipts here.
                  </td>
                </tr>
              ) : (
                sub.invoices.map((inv) => (
                <tr key={inv.invoiceNumber} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                  <td className="p-3 text-slate-500">{inv.date}</td>
                  <td className="p-3 font-mono font-bold">TZS {inv.amountTZS.toLocaleString()}</td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDownloadInvoice(inv.invoiceNumber)}
                      className="py-1 px-2.5 border rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1 ml-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
