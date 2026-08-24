'use client'

import React, { useMemo } from 'react'
import { calculateDealEconomics, type RewardFundingModel } from '@/modules/deals/economics'
import { Calculator, ShieldCheck, Info } from 'lucide-react'

interface DealEconomicsCalculatorProps {
  customerPriceTZS: number
  rewardType: 'PERCENTAGE_COMMISSION' | 'FIXED_COMMISSION' | 'COST_PER_LEAD' | 'COST_PER_ACQUISITION' | 'FIXED_CAMPAIGN_FEE' | 'HYBRID'
  rewardValue: number
  availableRewardCount: number
  fundingModel: RewardFundingModel
  onFundingModelChange?: (model: RewardFundingModel) => void
}

export function DealEconomicsCalculator({
  customerPriceTZS,
  rewardType,
  rewardValue,
  availableRewardCount,
  fundingModel,
  onFundingModelChange,
}: DealEconomicsCalculatorProps) {
  const economics = useMemo(() => {
    return calculateDealEconomics({
      customerPriceTZS: customerPriceTZS || 100000,
      rewardType,
      rewardValue: rewardValue || 10,
      availableRewardCount: availableRewardCount || 10,
      fundingModel,
    })
  }, [customerPriceTZS, rewardType, rewardValue, availableRewardCount, fundingModel])

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Settlement & Economics Preview</h4>
            <p className="text-[11px] text-slate-500">Live breakdown of customer price, fees, taxes, and merchant net proceeds.</p>
          </div>
        </div>

        {onFundingModelChange && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => onFundingModelChange('PREPAID_ESCROW')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                fundingModel === 'PREPAID_ESCROW'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pre-Funded Escrow
            </button>
            <button
              type="button"
              onClick={() => onFundingModelChange('DEDUCTED_FROM_SALE')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                fundingModel === 'DEDUCTED_FROM_SALE'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Deducted From Sale
            </button>
          </div>
        )}
      </div>

      {/* Breakdown Table */}
      <div className="divide-y divide-slate-100 text-xs">
        <div className="py-2 flex justify-between items-center font-semibold text-slate-800">
          <span>Customer Selling Price</span>
          <span className="text-sm font-bold text-slate-900">{economics.displays.customerPrice}</span>
        </div>

        <div className="py-2 flex justify-between items-center text-slate-600">
          <span>Gross Partner Reward</span>
          <span className="font-semibold text-orange-600">− {economics.displays.grossRewardPerUnit}</span>
        </div>

        <div className="py-2 flex justify-between items-center text-slate-600 pl-4 text-[11px]">
          <span>• LUMO Platform Fee (5%)</span>
          <span>{economics.displays.lumoFee}</span>
        </div>

        <div className="py-2 flex justify-between items-center text-slate-600 pl-4 text-[11px]">
          <span>• TRA Statutory Withholding Tax (5%)</span>
          <span>{economics.displays.taxWithheld}</span>
        </div>

        <div className="py-2 flex justify-between items-center text-slate-600 pl-4 text-[11px]">
          <span>• Payment Gateway Fee (1.5%)</span>
          <span>{economics.displays.providerFee}</span>
        </div>

        <div className="py-2.5 flex justify-between items-center bg-emerald-50/50 -mx-5 px-5 font-bold text-emerald-800 border-t border-emerald-100">
          <span>Merchant Estimated Net (per sale)</span>
          <span className="text-sm text-emerald-700">{economics.displays.merchantEstimatedNetPerUnit}</span>
        </div>

        <div className="py-2 flex justify-between items-center bg-orange-50/30 -mx-5 px-5 font-medium text-slate-700">
          <span>Partner Estimated Net Payout (per conversion)</span>
          <span className="font-bold text-orange-700">{economics.displays.partnerNetPayoutPerUnit}</span>
        </div>
      </div>

      {/* Escrow requirement note */}
      {fundingModel === 'PREPAID_ESCROW' && (
        <div className="mt-4 p-3 rounded-lg bg-orange-50/70 border border-orange-200 text-xs text-orange-800 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <strong>Pre-Funded Escrow Required:</strong> To publish, deposit{' '}
            <strong>{economics.displays.requiredEscrowPreFund}</strong> ({availableRewardCount} rewards) into escrow.
            Unused funds are 100% refundable upon deal completion.
          </div>
        </div>
      )}
    </div>
  )
}
