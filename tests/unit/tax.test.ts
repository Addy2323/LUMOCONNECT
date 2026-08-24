import { describe, it, expect } from 'vitest'
import {
  generatePartnerStatement,
  listPartnerStatements,
  exportStatementCsv,
  TANZANIA_TAX_RULES,
} from '@/modules/tax/service'

describe('TRA Tax Withholding & Earnings Statement Generator', () => {
  it('applies statutory 5% withholding tax for resident individual partners', () => {
    const statement = generatePartnerStatement({
      partnerId: 'partner_resident_01',
      partnerName: 'Alex Mushi',
      classification: 'INDIVIDUAL_RESIDENT',
      monthYear: 'August 2026',
    })

    expect(statement.classification).toBe('INDIVIDUAL_RESIDENT')
    expect(statement.statementNumber).toContain('LUMO-STM-202608-')

    // 5% of gross
    const expectedTax = (statement.grossEarningsMinorUnits * 500n) / 10000n
    expect(statement.taxWithheldMinorUnits).toBe(expectedTax)

    // Net paid = Gross - Tax - 5% platform fee
    const expectedFee = (statement.grossEarningsMinorUnits * 500n) / 10000n
    expect(statement.netPaidMinorUnits).toBe(statement.grossEarningsMinorUnits - expectedTax - expectedFee)
  })

  it('applies statutory 15% withholding tax for non-resident individual partners', () => {
    const statement = generatePartnerStatement({
      partnerId: 'partner_nonresident_02',
      partnerName: 'Kenyan Media Agency',
      classification: 'INDIVIDUAL_NON_RESIDENT',
      monthYear: 'August 2026',
    })

    expect(statement.classification).toBe('INDIVIDUAL_NON_RESIDENT')

    // 15% of gross
    const expectedTax = (statement.grossEarningsMinorUnits * 1500n) / 10000n
    expect(statement.taxWithheldMinorUnits).toBe(expectedTax)
  })

  it('applies 0% withholding tax for registered corporate entities with TIN/VRN', () => {
    const statement = generatePartnerStatement({
      partnerId: 'corp_agency_03',
      partnerName: 'Acme Media TZ Ltd',
      classification: 'CORPORATE_REGISTERED',
      monthYear: 'August 2026',
    })

    expect(statement.classification).toBe('CORPORATE_REGISTERED')
    expect(statement.taxWithheldMinorUnits).toBe(0n)
  })

  it('exports statement to a valid CSV format with header, rows, and summary block', () => {
    const statement = generatePartnerStatement({
      partnerId: 'partner_csv_test',
      partnerName: 'Alex Mushi',
      classification: 'INDIVIDUAL_RESIDENT',
    })

    const csv = exportStatementCsv(statement)
    expect(csv).toContain('Transaction Ref,Deal Title,Date')
    expect(csv).toContain('MobiPay SME Merchant Onboarding')
    expect(csv).toContain('Statement Number')
    expect(csv).toContain(statement.statementNumber)
  })

  it('lists historical partner statements', () => {
    const statements = listPartnerStatements('partner_alex')
    expect(statements.length).toBeGreaterThan(0)
    expect(statements[0].period).toBe('August 2026')
  })
})
