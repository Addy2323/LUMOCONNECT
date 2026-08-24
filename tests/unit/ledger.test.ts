import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateDoubleEntryBalance,
  postJournalEntry,
  getAccountBalance,
  resetLedger,
  CHART_OF_ACCOUNTS,
} from '@/lib/ledger'

describe('Double-Entry Accounting Ledger', () => {
  beforeEach(() => {
    resetLedger()
  })

  it('validates that balanced debits and credits pass validation', () => {
    const lines = [
      {
        ledgerAccountId: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
        accountCode: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
        debitMinor: 5000000n, // TZS 50,000.00
        creditMinor: 0n,
      },
      {
        ledgerAccountId: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
        accountCode: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
        debitMinor: 0n,
        creditMinor: 5000000n, // TZS 50,000.00
      },
    ]

    const result = validateDoubleEntryBalance(lines)
    expect(result.isValid).toBe(true)
    expect(result.totalDebits).toBe(5000000n)
    expect(result.totalCredits).toBe(5000000n)
  })

  it('rejects an unbalanced journal entry where debits !== credits', () => {
    const lines = [
      {
        ledgerAccountId: CHART_OF_ACCOUNTS.COMMISSION_EXPENSE_BUSINESS,
        debitMinor: 100000n,
        creditMinor: 0n,
      },
      {
        ledgerAccountId: CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS,
        debitMinor: 0n,
        creditMinor: 90000n, // 10,000 missing
      },
    ]

    const result = validateDoubleEntryBalance(lines)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Journal entry is out of balance')
  })

  it('rejects lines with negative amounts or simultaneous debit & credit', () => {
    const negativeLines = [
      {
        ledgerAccountId: 'acc_1',
        debitMinor: -100n,
        creditMinor: 0n,
      },
      {
        ledgerAccountId: 'acc_2',
        debitMinor: 0n,
        creditMinor: -100n,
      },
    ]
    expect(validateDoubleEntryBalance(negativeLines).isValid).toBe(false)

    const simultaneousLines = [
      {
        ledgerAccountId: 'acc_1',
        debitMinor: 100n,
        creditMinor: 100n,
      },
      {
        ledgerAccountId: 'acc_2',
        debitMinor: 0n,
        creditMinor: 0n,
      },
    ]
    expect(validateDoubleEntryBalance(simultaneousLines).isValid).toBe(false)
  })

  it('posts multi-line commission distribution and updates account balances accurately', () => {
    const grossCommission = 2500000n // TZS 25,000
    const taxWithheld = 125000n // 5% TRA = TZS 1,250
    const platformFee = 125000n // 5% LUMO = TZS 1,250
    const netPayable = 2250000n // TZS 22,500

    const entry = postJournalEntry({
      sourceType: 'CONVERSION',
      sourceId: 'conv_test_101',
      currency: 'TZS',
      narration: 'Partner commission distribution test',
      lines: [
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.COMMISSION_EXPENSE_BUSINESS,
          accountCode: CHART_OF_ACCOUNTS.COMMISSION_EXPENSE_BUSINESS,
          debitMinor: grossCommission,
          creditMinor: 0n,
        },
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS,
          accountCode: CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS,
          debitMinor: 0n,
          creditMinor: netPayable,
        },
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.TRA_WITHHOLDING_TAX_PAYABLE,
          accountCode: CHART_OF_ACCOUNTS.TRA_WITHHOLDING_TAX_PAYABLE,
          debitMinor: 0n,
          creditMinor: taxWithheld,
        },
        {
          ledgerAccountId: CHART_OF_ACCOUNTS.PLATFORM_TRANSACTION_FEE_REVENUE,
          accountCode: CHART_OF_ACCOUNTS.PLATFORM_TRANSACTION_FEE_REVENUE,
          debitMinor: 0n,
          creditMinor: platformFee,
        },
      ],
    })

    expect(entry.id).toBeDefined()
    expect(entry.entryNumber).toContain('JE-')
    expect(entry.totalAmountMinor).toBe(grossCommission)

    const partnerPayableBalance = getAccountBalance(CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS)
    expect(partnerPayableBalance.credits).toBe(netPayable)

    const traTaxBalance = getAccountBalance(CHART_OF_ACCOUNTS.TRA_WITHHOLDING_TAX_PAYABLE)
    expect(traTaxBalance.credits).toBe(taxWithheld)
  })
})
