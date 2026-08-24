'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  Download,
  Filter,
  BarChart3,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  Eye,
  Calendar,
} from 'lucide-react'
import { BusinessOpportunityItem } from '../types'
import { useBusinessToast } from '../BusinessToast'

interface DealPerformanceTabProps {
  opportunities: BusinessOpportunityItem[]
}

export function DealPerformanceTab({ opportunities }: DealPerformanceTabProps) {
  const { showToast } = useBusinessToast()
  const [selectedOpportunityId, setSelectedOpportunityId] = useState('ALL')

  const totalSpent = opportunities.reduce((acc, o) => acc + o.spentTZS, 0)
  const totalConversions = opportunities.reduce((acc, o) => acc + o.totalConversions, 0)
  const estimatedRevenue = totalConversions * 450000 // Estimated gross sales generated
  const roiMultiplier = totalSpent > 0 ? (estimatedRevenue / totalSpent).toFixed(1) : '0.0'
  const avgCostPerSale = totalConversions > 0 ? Math.round(totalSpent / totalConversions) : 0

  const handleExport = () => {
    showToast('success', 'Performance Report Exported', 'CSV/PDF analytics report downloaded.')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Commercial Deal Performance & ROI Analytics</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
              Read / Analytics
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Measure gross commercial revenue, acquisition costs, partner conversion efficiency, and return on reward expenditure.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="py-2 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Analytics</span>
        </button>
      </div>

      {/* 4 Financial ROI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Commercial Value</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            TZS {(estimatedRevenue / 1000000).toFixed(1)}M
          </div>
          <span className="text-[10px] text-slate-400">Total customer order value</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Rewards Spent</span>
          <div className="text-xl sm:text-2xl font-black text-[#FF6A00] font-mono mt-1">
            TZS {(totalSpent / 1000000).toFixed(1)}M
          </div>
          <span className="text-[10px] text-slate-500">Paid out to verified partners</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Return on Spend (ROI)</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-1">
            {roiMultiplier}x
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">TZS 1 spent = TZS {roiMultiplier} revenue</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Average Cost per Sale</span>
          <div className="text-xl sm:text-2xl font-black text-purple-600 font-mono mt-1">
            TZS {avgCostPerSale.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">100% success-based</span>
        </div>
      </div>

      {/* Breakdown per Opportunity */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Performance Breakdown by Live Opportunity
        </h3>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b">
              <tr>
                <th className="p-3">Opportunity</th>
                <th className="p-3">Commercial Model</th>
                <th className="p-3">Conversions</th>
                <th className="p-3">Reward Expenditure</th>
                <th className="p-3">Estimated Gross Sales</th>
                <th className="p-3 text-right">ROI Multiplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {opportunities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                    No active commercial deals listed yet. Performance and ROI multipliers will populate once deals receive customer conversions.
                  </td>
                </tr>
              ) : (
                opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-extrabold text-slate-900 dark:text-white">{opp.title}</div>
                      <div className="text-[10px] text-slate-400">{opp.region}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {opp.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-600">
                      {opp.totalConversions}
                    </td>
                    <td className="p-3 font-mono font-bold text-[#FF6A00]">
                      TZS {opp.spentTZS.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono">
                      TZS {(opp.totalConversions * 450000).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600">
                      {opp.spentTZS > 0 ? `${((opp.totalConversions * 450000) / opp.spentTZS).toFixed(1)}x` : '0.0x'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
