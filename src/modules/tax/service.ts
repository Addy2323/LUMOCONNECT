import {
  calculateWithholdingTax,
  calculatePlatformFee,
  calculateNetPayable,
  formatMoney,
} from '@/lib/money'

export type TaxClassification = 'INDIVIDUAL_RESIDENT' | 'INDIVIDUAL_NON_RESIDENT' | 'CORPORATE_REGISTERED'

export interface TaxRateRule {
  classification: TaxClassification
  rateBps: number // 500 = 5.00%
  description: string
}

export const TANZANIA_TAX_RULES: Record<TaxClassification, TaxRateRule> = {
  INDIVIDUAL_RESIDENT: {
    classification: 'INDIVIDUAL_RESIDENT',
    rateBps: 500, // 5% standard TRA withholding on commission & advertising
    description: 'TRA Resident Individual Withholding Tax (5.0%)',
  },
  INDIVIDUAL_NON_RESIDENT: {
    classification: 'INDIVIDUAL_NON_RESIDENT',
    rateBps: 1500, // 15% non-resident withholding
    description: 'TRA Non-Resident Withholding Tax (15.0%)',
  },
  CORPORATE_REGISTERED: {
    classification: 'CORPORATE_REGISTERED',
    rateBps: 0, // Invoiced with valid TIN/VRN certificate
    description: 'VAT / Corporate Registered (0% Withholding at source - direct invoice)',
  },
}

export interface PartnerStatementData {
  statementNumber: string
  partnerId: string
  partnerName: string
  tinNumber?: string
  classification: TaxClassification
  period: string
  currency: string
  grossEarningsMinorUnits: bigint
  taxWithheldMinorUnits: bigint
  platformFeesMinorUnits: bigint
  netPaidMinorUnits: bigint
  generatedAt: Date
  transactions: {
    ref: string
    dealTitle: string
    date: string
    grossAmount: string
    taxAmount: string
    netAmount: string
  }[]
}

export function generatePartnerStatement({
  partnerId,
  partnerName,
  classification = 'INDIVIDUAL_RESIDENT',
  monthYear = 'August 2026',
}: {
  partnerId: string
  partnerName: string
  classification?: TaxClassification
  monthYear?: string
}): PartnerStatementData {
  const rule = TANZANIA_TAX_RULES[classification] || TANZANIA_TAX_RULES.INDIVIDUAL_RESIDENT
  const gross = BigInt(128450000) // TZS 1,284,500.00
  const tax = calculateWithholdingTax(gross, rule.rateBps)
  const fee = calculatePlatformFee(gross, 500) // 5% LUMO fee
  const net = calculateNetPayable({ grossCommission: gross, taxWithheld: tax, platformFee: fee })

  return {
    statementNumber: `LUMO-STM-202608-${partnerId.slice(-4).toUpperCase()}`,
    partnerId,
    partnerName,
    tinNumber: '142-998-310',
    classification,
    period: monthYear,
    currency: 'TZS',
    grossEarningsMinorUnits: gross,
    taxWithheldMinorUnits: tax,
    platformFeesMinorUnits: fee,
    netPaidMinorUnits: net,
    generatedAt: new Date(),
    transactions: [
      {
        ref: 'MP-2048',
        dealTitle: 'MobiPay SME Merchant Onboarding',
        date: '2026-08-23',
        grossAmount: 'TZS 25,000',
        taxAmount: 'TZS 1,250',
        netAmount: 'TZS 22,500',
      },
      {
        ref: 'KS-881',
        dealTitle: 'Kijani Solar Household Installations',
        date: '2026-08-20',
        grossAmount: 'TZS 45,000',
        taxAmount: 'TZS 2,250',
        netAmount: 'TZS 40,500',
      },
      {
        ref: 'SB-104',
        dealTitle: 'SafariBox Serengeti Campaign Deliverable',
        date: '2026-08-15',
        grossAmount: 'TZS 450,000',
        taxAmount: 'TZS 22,500',
        netAmount: 'TZS 405,000',
      },
    ],
  }
}
