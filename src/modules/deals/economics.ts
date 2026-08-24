/**
 * LUMO Complete Deal Economics Engine
 *
 * Computes exact financial breakdown for opportunity publishing:
 * - Customer selling price
 * - Partner reward (fixed or percentage)
 * - LUMO platform fee (default 5%)
 * - Payment-provider fee (default 1.5%)
 * - TRA withholding tax (5% resident)
 * - Merchant estimated net proceeds
 * - Partner estimated net payout
 * - Funding model: PREPAID_ESCROW vs DEDUCTED_FROM_SALE
 */

import { formatMoney } from '@/lib/money'

export type RewardFundingModel = 'PREPAID_ESCROW' | 'DEDUCTED_FROM_SALE'
export type FeePayer = 'MERCHANT_PAYS' | 'CUSTOMER_PAYS' | 'SPLIT'

export interface DealEconomicsInput {
  customerPriceTZS: number
  rewardType: 'PERCENTAGE_COMMISSION' | 'FIXED_COMMISSION' | 'COST_PER_LEAD' | 'COST_PER_ACQUISITION' | 'FIXED_CAMPAIGN_FEE' | 'HYBRID'
  rewardValue: number // Percentage (e.g. 10 for 10%) or fixed TZS (e.g. 45,000)
  availableRewardCount: number // e.g. 100 conversions
  maxSuccessfulPartners?: number
  fundingModel: RewardFundingModel
  feePayer?: FeePayer
  lumoFeeBps?: number // Default 500 (5.00%)
  providerFeeBps?: number // Default 150 (1.50%)
  taxRateBps?: number // Default 500 (5.00% TRA withholding)
}

export interface DealEconomicsBreakdown {
  customerPriceMinor: bigint
  grossRewardPerUnitMinor: bigint
  totalRewardBudgetMinor: bigint
  lumoFeeMinor: bigint
  providerFeeMinor: bigint
  taxWithheldMinor: bigint
  partnerNetPayoutPerUnitMinor: bigint
  totalPartnerNetPayoutMinor: bigint
  merchantEstimatedNetPerUnitMinor: bigint
  totalMerchantEstimatedNetMinor: bigint
  requiredEscrowPreFundMinor: bigint
  fundingModel: RewardFundingModel
  displays: {
    customerPrice: string
    grossRewardPerUnit: string
    totalRewardBudget: string
    lumoFee: string
    providerFee: string
    taxWithheld: string
    partnerNetPayoutPerUnit: string
    merchantEstimatedNetPerUnit: string
    requiredEscrowPreFund: string
  }
}

export function calculateDealEconomics(input: DealEconomicsInput): DealEconomicsBreakdown {
  const customerPriceMinor = BigInt(Math.round(input.customerPriceTZS * 100))
  const count = BigInt(Math.max(1, input.availableRewardCount))
  const lumoBps = BigInt(input.lumoFeeBps ?? 500)
  const providerBps = BigInt(input.providerFeeBps ?? 150)
  const taxBps = BigInt(input.taxRateBps ?? 500)

  // 1. Calculate Gross Reward per unit
  let grossRewardPerUnitMinor = 0n
  if (input.rewardType === 'PERCENTAGE_COMMISSION') {
    const bps = BigInt(Math.round(input.rewardValue * 100))
    grossRewardPerUnitMinor = (customerPriceMinor * bps) / 10000n
  } else {
    grossRewardPerUnitMinor = BigInt(Math.round(input.rewardValue * 100))
  }

  const totalRewardBudgetMinor = grossRewardPerUnitMinor * count

  // 2. Calculate Deductions on Reward
  const taxWithheldMinor = (grossRewardPerUnitMinor * taxBps) / 10000n
  const lumoFeeMinor = (grossRewardPerUnitMinor * lumoBps) / 10000n
  const providerFeeMinor = (customerPriceMinor * providerBps) / 10000n

  const partnerNetPayoutPerUnitMinor = grossRewardPerUnitMinor - taxWithheldMinor - lumoFeeMinor
  const totalPartnerNetPayoutMinor = partnerNetPayoutPerUnitMinor * count

  // 3. Calculate Merchant Net Proceeds
  let merchantEstimatedNetPerUnitMinor = 0n
  let requiredEscrowPreFundMinor = 0n

  if (input.fundingModel === 'DEDUCTED_FROM_SALE') {
    // Reward and fees are deducted directly from the customer payment upon conversion
    merchantEstimatedNetPerUnitMinor = customerPriceMinor - grossRewardPerUnitMinor - providerFeeMinor
    requiredEscrowPreFundMinor = 0n // No pre-funding needed
  } else {
    // PREPAID_ESCROW: Merchant pre-funds the reward pool into LUMO escrow before publishing
    merchantEstimatedNetPerUnitMinor = customerPriceMinor - providerFeeMinor
    requiredEscrowPreFundMinor = totalRewardBudgetMinor
  }

  const totalMerchantEstimatedNetMinor = merchantEstimatedNetPerUnitMinor * count

  return {
    customerPriceMinor,
    grossRewardPerUnitMinor,
    totalRewardBudgetMinor,
    lumoFeeMinor,
    providerFeeMinor,
    taxWithheldMinor,
    partnerNetPayoutPerUnitMinor,
    totalPartnerNetPayoutMinor,
    merchantEstimatedNetPerUnitMinor,
    totalMerchantEstimatedNetMinor,
    requiredEscrowPreFundMinor,
    fundingModel: input.fundingModel,
    displays: {
      customerPrice: formatMoney(customerPriceMinor, 'TZS'),
      grossRewardPerUnit: formatMoney(grossRewardPerUnitMinor, 'TZS'),
      totalRewardBudget: formatMoney(totalRewardBudgetMinor, 'TZS'),
      lumoFee: formatMoney(lumoFeeMinor, 'TZS'),
      providerFee: formatMoney(providerFeeMinor, 'TZS'),
      taxWithheld: formatMoney(taxWithheldMinor, 'TZS'),
      partnerNetPayoutPerUnit: formatMoney(partnerNetPayoutPerUnitMinor, 'TZS'),
      merchantEstimatedNetPerUnit: formatMoney(merchantEstimatedNetPerUnitMinor, 'TZS'),
      requiredEscrowPreFund: formatMoney(requiredEscrowPreFundMinor, 'TZS'),
    },
  }
}
