import { providers } from '@/lib/providers'
import { formatMoney } from '@/lib/money'

export interface PayoutBatchItem {
  id: string
  payoutNumber: string
  idempotencyKey: string
  totalAmountTZS: bigint
  currency: string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'AUTHORIZED' | 'PROCESSING' | 'PAID' | 'FAILED'
  makerUserId: string
  makerName: string
  authorizerUserId?: string
  authorizerName?: string
  authorizedAt?: Date
  itemCount: number
  partnerNames: string[]
  createdAt: Date
}

const payoutsStore: PayoutBatchItem[] = []

export function listPayoutBatches(): PayoutBatchItem[] {
  return payoutsStore
}

export function createPayoutDraft(params: {
  makerUserId: string
  makerName: string
  totalAmountTZS: bigint
  currency?: string
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'PAID'
}): PayoutBatchItem {
  const id = `pay_batch_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  const item: PayoutBatchItem = {
    id,
    payoutNumber: `LUMO-PAY-${Date.now()}`,
    idempotencyKey: `idem_${id}`,
    totalAmountTZS: params.totalAmountTZS,
    currency: params.currency || 'TZS',
    status: params.status || 'PENDING_APPROVAL',
    makerUserId: params.makerUserId,
    makerName: params.makerName,
    itemCount: 1,
    partnerNames: ['Partner Recipient'],
    createdAt: new Date(),
  }
  payoutsStore.push(item)
  return item
}

export const LARGE_PAYOUT_THRESHOLD_MINOR = 1000000000n // TZS 10,000,000.00 (10m TZS)
export const COOLING_OFF_PERIOD_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface PayoutSafetyCheckResult {
  isSafe: boolean
  isCoolingOff: boolean
  nameMatches: boolean
  requiresTwoAdmins: boolean
  error?: string
}

/**
 * Validates payout method safety invariants:
 * - 24-hour cooling off on newly added/updated payout accounts
 * - Name matching verification against NIDA / Business registration
 */
export function verifyPayoutMethodSafety({
  methodCreatedAt,
  registeredName,
  accountHolderName,
  totalAmountMinor,
}: {
  methodCreatedAt: Date
  registeredName: string
  accountHolderName: string
  totalAmountMinor: bigint
}): PayoutSafetyCheckResult {
  const isCoolingOff = Date.now() - methodCreatedAt.getTime() < COOLING_OFF_PERIOD_MS
  const cleanReg = registeredName.trim().toLowerCase().replace(/[^a-z]/g, '')
  const cleanHolder = accountHolderName.trim().toLowerCase().replace(/[^a-z]/g, '')
  const nameMatches = cleanReg === cleanHolder || cleanHolder.includes(cleanReg) || cleanReg.includes(cleanHolder)
  const requiresTwoAdmins = totalAmountMinor >= LARGE_PAYOUT_THRESHOLD_MINOR

  if (isCoolingOff) {
    return {
      isSafe: false,
      isCoolingOff: true,
      nameMatches,
      requiresTwoAdmins,
      error: 'PAYOUT_ACCOUNT_COOLING_OFF: Newly modified payout accounts are held for 24 hours for security.',
    }
  }

  if (!nameMatches) {
    return {
      isSafe: false,
      isCoolingOff: false,
      nameMatches: false,
      requiresTwoAdmins,
      error: `NAME_MISMATCH: Payout account holder "${accountHolderName}" does not match registered profile name "${registeredName}".`,
    }
  }

  return {
    isSafe: true,
    isCoolingOff: false,
    nameMatches: true,
    requiresTwoAdmins,
  }
}

/**
 * Maker-Checker Segregation & Two-Admin Approval:
 * An authorizer CANNOT be the same user who prepared the payout draft.
 * Batches > TZS 10,000,000 require secondary admin sign-off.
 */
export async function authorizePayoutBatch({
  payoutId,
  authorizerUserId,
  authorizerName,
  secondaryAuthorizerUserId,
}: {
  payoutId: string
  authorizerUserId: string
  authorizerName: string
  secondaryAuthorizerUserId?: string
}): Promise<PayoutBatchItem> {
  const batch = payoutsStore.find((p) => p.id === payoutId)
  if (!batch) throw new Error('PAYOUT_BATCH_NOT_FOUND')

  if (batch.makerUserId === authorizerUserId) {
    throw new Error('MAKER_CHECKER_VIOLATION: Authorizer cannot be the same user who prepared the payout.')
  }

  if (batch.status !== 'PENDING_APPROVAL') {
    throw new Error(`INVALID_PAYOUT_STATUS: Cannot authorize batch in status ${batch.status}`)
  }

  // Check Two-Admin Approval threshold for large payouts
  if (batch.totalAmountTZS >= LARGE_PAYOUT_THRESHOLD_MINOR) {
    if (!secondaryAuthorizerUserId) {
      throw new Error('TWO_ADMIN_APPROVAL_REQUIRED: Batches exceeding TZS 10,000,000 require secondary admin sign-off.')
    }
    if (secondaryAuthorizerUserId === authorizerUserId || secondaryAuthorizerUserId === batch.makerUserId) {
      throw new Error('TWO_ADMIN_APPROVAL_INVALID: Secondary authorizer must be an independent distinct admin.')
    }
  }

  batch.authorizerUserId = authorizerUserId
  batch.authorizerName = authorizerName
  batch.authorizedAt = new Date()
  batch.status = 'AUTHORIZED'

  // Trigger disbursal via Mongike provider
  const result = await providers.payout.disburseBatch({
    payoutId: batch.id,
    idempotencyKey: batch.idempotencyKey,
    totalMinorUnits: batch.totalAmountTZS,
    currency: batch.currency,
    items: [],
  })

  if (result.success) {
    batch.status = 'PAID'
  }

  return batch
}

