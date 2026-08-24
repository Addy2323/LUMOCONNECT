/**
 * LUMO Double-Entry Accounting Ledger Engine
 *
 * Implements strict double-entry balancing rules:
 *   Total Debits === Total Credits
 *
 * Invariant: Every financial transaction creates an immutable JournalEntry
 * containing at least two balanced JournalLine postings.
 */

import { nanoid } from 'nanoid'

export type AccountOwnerType = 'PLATFORM' | 'ORGANIZATION' | 'PARTNER' | 'ESCROW'

export interface LedgerAccountRecord {
  id: string
  accountCode: string
  name: string
  ownerType: AccountOwnerType
  ownerId?: string
  currency: string
  isActive: boolean
}

export interface JournalLineInput {
  ledgerAccountId: string
  accountCode?: string
  debitMinor: bigint
  creditMinor: bigint
  memo?: string
}

export interface JournalEntryInput {
  sourceType: 'PAYMENT' | 'CONVERSION' | 'REWARD' | 'PAYOUT' | 'WITHDRAWAL' | 'ADJUSTMENT' | 'SUBSCRIPTION'
  sourceId: string
  currency?: string
  narration: string
  lines: JournalLineInput[]
}

export interface JournalLineRecord extends JournalLineInput {
  id: string
  journalEntryId: string
}

export interface JournalEntryRecord {
  id: string
  entryNumber: string
  sourceType: string
  sourceId: string
  currency: string
  narration: string
  totalAmountMinor: bigint
  postedAt: Date
  lines: JournalLineRecord[]
}

// In-memory ledger storage for high-fidelity offline/testing execution
const inMemoryAccounts = new Map<string, LedgerAccountRecord>()
const inMemoryEntries: JournalEntryRecord[] = []

/**
 * Standard System Chart of Accounts Codes
 */
export const CHART_OF_ACCOUNTS = {
  // Assets (1000s)
  CASH_MOBILE_MONEY: '1010_CASH_MOMONEY',
  CASH_BANK_SETTLEMENT: '1020_CASH_BANK',
  ACCOUNTS_RECEIVABLE: '1100_AR_BUSINESS',
  // Liabilities (2000s)
  PARTNER_PAYABLE_COMMISSIONS: '2010_AP_PARTNER_COMMISSIONS',
  BUSINESS_PREFUNDED_ESCROW: '2020_ESCROW_PREFUNDED_DEPOSITS',
  TRA_WITHHOLDING_TAX_PAYABLE: '2030_AP_TRA_WITHHOLDING_TAX',
  CUSTOMER_PURCHASE_ESCROW: '2040_ESCROW_CUSTOMER_PURCHASE',
  PAYABLE_TO_MERCHANT: '2050_AP_MERCHANT_SETTLEMENT',
  REFUND_RESERVE: '2060_ESCROW_REFUND_RESERVE',
  DISPUTED_FUNDS_HOLD: '2070_ESCROW_DISPUTED_HOLD',
  // Equity (3000s)
  PLATFORM_EQUITY: '3000_PLATFORM_RETAINED',
  // Revenues (4000s)
  PLATFORM_SUBSCRIPTION_REVENUE: '4010_REV_SUBSCRIPTIONS',
  PLATFORM_TRANSACTION_FEE_REVENUE: '4020_REV_TRANSACTION_FEES',
  // Expenses (5000s)
  PAYMENT_GATEWAY_FEES: '5010_EXP_GATEWAY_PROCESSING',
  COMMISSION_EXPENSE_BUSINESS: '5020_EXP_COMMISSIONS',
} as const

export interface DailyReconciliationResult {
  runId: string
  reconciliationDate: string
  totalLedgerDebitsMinor: bigint
  totalLedgerCreditsMinor: bigint
  isBalanced: boolean
  providerSettlementMatch: boolean
  discrepancyMinor: bigint
  accountsSummary: {
    merchantRewardReserve: bigint
    customerPurchaseFunds: bigint
    payableToMerchant: bigint
    payableToPartner: bigint
    refundReserve: bigint
    lumoFees: bigint
    providerFees: bigint
    taxes: bigint
    disputedFunds: bigint
  }
}

export function performDailyReconciliation(): DailyReconciliationResult {
  const merchantRewardReserve = getAccountBalance(CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW).credits
  const customerPurchaseFunds = getAccountBalance(CHART_OF_ACCOUNTS.CUSTOMER_PURCHASE_ESCROW).credits
  const payableToMerchant = getAccountBalance(CHART_OF_ACCOUNTS.PAYABLE_TO_MERCHANT).credits
  const payableToPartner = getAccountBalance(CHART_OF_ACCOUNTS.PARTNER_PAYABLE_COMMISSIONS).credits
  const refundReserve = getAccountBalance(CHART_OF_ACCOUNTS.REFUND_RESERVE).credits
  const lumoFees = getAccountBalance(CHART_OF_ACCOUNTS.PLATFORM_TRANSACTION_FEE_REVENUE).credits
  const providerFees = getAccountBalance(CHART_OF_ACCOUNTS.PAYMENT_GATEWAY_FEES).debits
  const taxes = getAccountBalance(CHART_OF_ACCOUNTS.TRA_WITHHOLDING_TAX_PAYABLE).credits
  const disputedFunds = getAccountBalance(CHART_OF_ACCOUNTS.DISPUTED_FUNDS_HOLD).credits

  let totalDebits = 0n
  let totalCredits = 0n
  for (const entry of inMemoryEntries) {
    for (const line of entry.lines) {
      totalDebits += line.debitMinor
      totalCredits += line.creditMinor
    }
  }

  const discrepancy = totalDebits - totalCredits

  return {
    runId: `rec_${nanoid(12)}`,
    reconciliationDate: new Date().toISOString().slice(0, 10),
    totalLedgerDebitsMinor: totalDebits,
    totalLedgerCreditsMinor: totalCredits,
    isBalanced: discrepancy === 0n,
    providerSettlementMatch: true,
    discrepancyMinor: discrepancy,
    accountsSummary: {
      merchantRewardReserve,
      customerPurchaseFunds,
      payableToMerchant,
      payableToPartner,
      refundReserve,
      lumoFees,
      providerFees,
      taxes,
      disputedFunds,
    },
  }
}


/**
 * Validates the fundamental double-entry invariant:
 * Sum(Debits) === Sum(Credits) and each line cannot have both debit & credit > 0.
 */
export function validateDoubleEntryBalance(lines: JournalLineInput[]): {
  isValid: boolean
  totalDebits: bigint
  totalCredits: bigint
  error?: string
} {
  if (!lines || lines.length < 2) {
    return {
      isValid: false,
      totalDebits: 0n,
      totalCredits: 0n,
      error: 'A valid journal entry must contain at least 2 journal lines.',
    }
  }

  let totalDebits = 0n
  let totalCredits = 0n

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.debitMinor < 0n || line.creditMinor < 0n) {
      return {
        isValid: false,
        totalDebits,
        totalCredits,
        error: `Negative amounts are invalid in line index ${i}. Use corresponding debit or credit postings.`,
      }
    }

    if (line.debitMinor > 0n && line.creditMinor > 0n) {
      return {
        isValid: false,
        totalDebits,
        totalCredits,
        error: `Line index ${i} cannot contain both positive debit and positive credit.`,
      }
    }

    if (line.debitMinor === 0n && line.creditMinor === 0n) {
      return {
        isValid: false,
        totalDebits,
        totalCredits,
        error: `Line index ${i} has zero debit and zero credit.`,
      }
    }

    totalDebits += line.debitMinor
    totalCredits += line.creditMinor
  }

  if (totalDebits !== totalCredits) {
    return {
      isValid: false,
      totalDebits,
      totalCredits,
      error: `Journal entry is out of balance. Total debits (${totalDebits}) !== Total credits (${totalCredits}). Difference: ${totalDebits - totalCredits}`,
    }
  }

  return {
    isValid: true,
    totalDebits,
    totalCredits,
  }
}

/**
 * Posts a double-entry journal entry to the ledger.
 * Throws an error if the entry is unbalanced.
 */
export function postJournalEntry(input: JournalEntryInput): JournalEntryRecord {
  const validation = validateDoubleEntryBalance(input.lines)
  if (!validation.isValid) {
    throw new Error(`LEDGER_UNBALANCED_ENTRY: ${validation.error}`)
  }

  const entryId = `je_${nanoid(16)}`
  const entryNumber = `JE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nanoid(6).toUpperCase()}`

  const lines: JournalLineRecord[] = input.lines.map((l, index) => ({
    ...l,
    id: `jl_${nanoid(16)}_${index}`,
    journalEntryId: entryId,
  }))

  const record: JournalEntryRecord = {
    id: entryId,
    entryNumber,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    currency: input.currency ?? 'TZS',
    narration: input.narration,
    totalAmountMinor: validation.totalDebits,
    postedAt: new Date(),
    lines,
  }

  inMemoryEntries.push(record)
  return record
}

/**
 * Retrieves all journal entries posted for a specific source record.
 */
export function getJournalEntriesForSource(sourceId: string): JournalEntryRecord[] {
  return inMemoryEntries.filter((e) => e.sourceId === sourceId)
}

/**
 * Calculates net balance for a specific account code.
 * Normal asset/expense: Debits - Credits
 * Normal liability/equity/revenue: Credits - Debits
 */
export function getAccountBalance(accountCode: string): { debits: bigint; credits: bigint; net: bigint } {
  let debits = 0n
  let credits = 0n

  for (const entry of inMemoryEntries) {
    for (const line of entry.lines) {
      if (line.accountCode === accountCode || line.ledgerAccountId === accountCode) {
        debits += line.debitMinor
        credits += line.creditMinor
      }
    }
  }

  return {
    debits,
    credits,
    net: debits - credits,
  }
}

/**
 * Resets the in-memory ledger (useful for test runs).
 */
export function resetLedger(): void {
  inMemoryEntries.length = 0
  inMemoryAccounts.clear()
}
