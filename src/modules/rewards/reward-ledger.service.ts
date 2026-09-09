import type { Prisma } from '@prisma/client'

export type Tx = Prisma.TransactionClient

export interface PostRewardLedgerParams {
  rewardId: string
  grossAmountMinor: bigint
  netAmountMinor: bigint
  taxWithheldMinor: bigint
  platformFeeMinor: bigint
  narration: string
}

/**
 * Posts balanced double-entry accounting journal entries for a payable commercial reward.
 *
 * Debit:  HD_REWARD_EXPENSE (Gross reward liability incurred)
 * Credit: HD_PARTNER_PAYABLE (Net reward payable to partner)
 * Credit: HD_TAX_PAYABLE (TRA 5% statutory withholding tax payable)
 * Credit: HD_FEE_REVENUE (Platform service fees retained)
 */
export async function postRewardJournalEntry(
  tx: Tx,
  params: PostRewardLedgerParams
): Promise<string> {
  const {
    rewardId,
    grossAmountMinor,
    netAmountMinor,
    taxWithheldMinor,
    platformFeeMinor,
    narration,
  } = params

  // Verify balanced accounting entry: Debit === Sum(Credits)
  const totalCredits = netAmountMinor + taxWithheldMinor + platformFeeMinor
  if (grossAmountMinor !== totalCredits) {
    throw new Error(
      `Accounting balance violation: Gross debit (${grossAmountMinor}) does not equal total credits (${totalCredits}).`
    )
  }

  // Ensure standard chart of accounts exists
  const accountDefinitions = [
    { code: 'HD_REWARD_EXPENSE', name: 'Verified Commercial Reward Expense' },
    { code: 'HD_PARTNER_PAYABLE', name: 'Partner Rewards Payable' },
    { code: 'HD_TAX_PAYABLE', name: 'Statutory Reward Withholding Tax Payable' },
    { code: 'HD_FEE_REVENUE', name: 'Platform Facilitation Fee Revenue' },
  ]

  const accounts = await Promise.all(
    accountDefinitions.map(async ({ code, name }) => {
      return await tx.ledgerAccount.upsert({
        where: { accountCode: code },
        update: {},
        create: {
          accountCode: code,
          name,
          ownerType: 'PLATFORM',
        },
      })
    })
  )

  const [expenseAccount, payableAccount, taxAccount, feeAccount] = accounts

  // Create immutable journal entry and lines
  const journalEntry = await tx.journalEntry.create({
    data: {
      sourceType: 'HOT_DEAL_REWARD',
      sourceId: rewardId,
      narration,
      lines: {
        create: [
          {
            ledgerAccountId: expenseAccount.id,
            debitMinor: grossAmountMinor,
            creditMinor: 0n,
          },
          {
            ledgerAccountId: payableAccount.id,
            debitMinor: 0n,
            creditMinor: netAmountMinor,
          },
          {
            ledgerAccountId: taxAccount.id,
            debitMinor: 0n,
            creditMinor: taxWithheldMinor,
          },
          {
            ledgerAccountId: feeAccount.id,
            debitMinor: 0n,
            creditMinor: platformFeeMinor,
          },
        ],
      },
    },
  })

  return journalEntry.id
}
