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

const payoutsStore: PayoutBatchItem[] = [
  {
    id: 'pay_batch_01',
    payoutNumber: 'LUMO-PAY-202608-01',
    idempotencyKey: 'idem_batch_01',
    totalAmountTZS: BigInt(245000000), // TZS 2,450,000.00
    currency: 'TZS',
    status: 'PAID',
    makerUserId: 'user_fin_01',
    makerName: 'Grace Mlay (Finance)',
    authorizerUserId: 'user_admin_01',
    authorizerName: 'Hassan Juma (Admin)',
    authorizedAt: new Date('2026-08-20T11:00:00Z'),
    itemCount: 18,
    partnerNames: ['Alex Mushi', 'Neema K.', 'David Temu', 'Zuhura Bakari'],
    createdAt: new Date('2026-08-20T09:30:00Z'),
  },
  {
    id: 'pay_batch_02',
    payoutNumber: 'LUMO-PAY-202608-02',
    idempotencyKey: 'idem_batch_02',
    totalAmountTZS: BigInt(185000000), // TZS 1,850,000.00
    currency: 'TZS',
    status: 'PENDING_APPROVAL',
    makerUserId: 'user_fin_01',
    makerName: 'Grace Mlay (Finance)',
    itemCount: 12,
    partnerNames: ['Alex Mushi', 'Rashid Ally', 'Baraka John'],
    createdAt: new Date('2026-08-23T16:00:00Z'),
  },
]

export function listPayoutBatches(): PayoutBatchItem[] {
  return payoutsStore
}

/**
 * Maker-Checker Segregation:
 * An authorizer CANNOT be the same user who prepared the payout draft.
 */
export async function authorizePayoutBatch({
  payoutId,
  authorizerUserId,
  authorizerName,
}: {
  payoutId: string
  authorizerUserId: string
  authorizerName: string
}): Promise<PayoutBatchItem> {
  const batch = payoutsStore.find((p) => p.id === payoutId)
  if (!batch) throw new Error('PAYOUT_BATCH_NOT_FOUND')

  if (batch.makerUserId === authorizerUserId) {
    throw new Error('MAKER_CHECKER_VIOLATION: Authorizer cannot be the same user who prepared the payout.')
  }

  if (batch.status !== 'PENDING_APPROVAL') {
    throw new Error(`INVALID_PAYOUT_STATUS: Cannot authorize batch in status ${batch.status}`)
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
