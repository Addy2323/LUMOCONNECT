'use client'

import React from 'react'
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  Building,
  ArrowLeft,
} from 'lucide-react'
import { generatePartnerStatement } from '@/modules/tax/service'
import { BrandMark } from '@/components/shared/BrandMark'

export function EarningsStatementView({ onBack }: { onBack?: () => void }) {
  const statement = generatePartnerStatement({
    partnerId: 'partner_alex',
    partnerName: 'Alex Mushi',
    classification: 'INDIVIDUAL_RESIDENT',
    monthYear: 'August 2026',
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="py-2 px-3 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={() => window.print()}
            className="py-2 px-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Formal Statement Document */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <BrandMark size={32} />
            <div>
              <div className="text-lg font-extrabold tracking-widest">LUMO</div>
              <div className="text-[10px] text-slate-400 font-semibold tracking-wider">
                LOTUSRISE COMPANY LIMITED
              </div>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              PARTNER EARNINGS STATEMENT
            </h2>
            <div className="font-mono text-xs text-orange-600 font-semibold mt-0.5">
              {statement.statementNumber}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Period: {statement.period}</div>
          </div>
        </div>

        {/* Partner & Company Details */}
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div>
            <div className="text-slate-400 font-semibold uppercase text-[10px] mb-1">Partner Information</div>
            <strong className="block text-slate-900 dark:text-white text-sm">{statement.partnerName}</strong>
            <div className="text-slate-500">TIN: {statement.tinNumber}</div>
            <div className="text-slate-500">Tax Classification: Resident Individual (TRA 5%)</div>
            <div className="text-slate-500">Settlement: M-Pesa (+255 712 *** 881)</div>
          </div>

          <div>
            <div className="text-slate-400 font-semibold uppercase text-[10px] mb-1">Issuer Information</div>
            <strong className="block text-slate-900 dark:text-white text-sm">LotusRise Company Limited</strong>
            <div className="text-slate-500">TIN: 140-992-108 · VRN: 40-029108-Z</div>
            <div className="text-slate-500">Ali Hassan Mwinyi Rd, Dar es Salaam, Tanzania</div>
          </div>
        </div>

        {/* Statement Itemization Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Reference / Deal</th>
                <th className="py-2.5 px-3 text-right">Gross Earnings</th>
                <th className="py-2.5 px-3 text-right">TRA Tax (5%)</th>
                <th className="py-2.5 px-3 text-right">Net Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {statement.transactions.map((tx) => (
                <tr key={tx.ref} className="font-mono">
                  <td className="py-3 px-3 text-slate-500">{tx.date}</td>
                  <td className="py-3 px-3 font-sans font-medium text-slate-900 dark:text-white">
                    {tx.dealTitle} <span className="text-slate-400 font-mono text-[11px]">({tx.ref})</span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {tx.grossAmount}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500">
                    {tx.taxAmount}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600">
                    {tx.netAmount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end pt-2 text-xs">
          <div className="w-64 space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Gross Partner Earnings:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                TZS {(Number(statement.grossEarningsMinorUnits) / 100).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>TRA Withholding Tax (5%):</span>
              <span className="font-mono text-slate-900 dark:text-white">
                - TZS {(Number(statement.taxWithheldMinorUnits) / 100).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>LUMO Tech Platform Fee (5%):</span>
              <span className="font-mono text-slate-900 dark:text-white">
                - TZS {(Number(statement.platformFeesMinorUnits) / 100).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-2">
              <span>Net Disbursed to M-Pesa:</span>
              <span className="font-mono text-emerald-600">
                TZS {(Number(statement.netPaidMinorUnits) / 100).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Compliance Footer Note */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            This statement is generated in compliance with the Tanzania Revenue Authority (TRA) Withholding Tax regulations. Retain this certificate for annual statutory tax filings.
          </span>
        </div>
      </div>
    </div>
  )
}
