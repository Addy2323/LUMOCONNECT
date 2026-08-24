import { describe, it, expect, beforeEach } from 'vitest'
import { authorizePayoutBatch, createPayoutDraft } from '@/modules/payouts/service'

describe('Maker-Checker Segregation of Duties', () => {
  let pendingBatchId: string
  let paidBatchId: string

  beforeEach(() => {
    const pending = createPayoutDraft({
      makerUserId: 'user_fin_01',
      makerName: 'Grace Mlay (Finance)',
      totalAmountTZS: 185000000n, // TZS 1,850,000.00
      status: 'PENDING_APPROVAL',
    })
    pendingBatchId = pending.id

    const paid = createPayoutDraft({
      makerUserId: 'user_fin_01',
      makerName: 'Grace Mlay (Finance)',
      totalAmountTZS: 245000000n,
      status: 'PAID',
    })
    paidBatchId = paid.id
  })

  it('strictly rejects payout authorization if authorizer is the same as the maker', async () => {
    await expect(
      authorizePayoutBatch({
        payoutId: pendingBatchId,
        authorizerUserId: 'user_fin_01', // Maker attempting self-approval
        authorizerName: 'Grace Mlay',
      })
    ).rejects.toThrow('MAKER_CHECKER_VIOLATION')
  })

  it('allows a distinct authorized checker to approve and disburse a pending batch', async () => {
    const result = await authorizePayoutBatch({
      payoutId: pendingBatchId,
      authorizerUserId: 'user_admin_checker_99',
      authorizerName: 'Senior Comptroller',
    })

    expect(result.status).toBe('PAID')
    expect(result.authorizerUserId).toBe('user_admin_checker_99')
    expect(result.authorizedAt).toBeDefined()
  })

  it('rejects authorization if batch is already paid or in non-pending status', async () => {
    await expect(
      authorizePayoutBatch({
        payoutId: paidBatchId, // Already PAID
        authorizerUserId: 'user_admin_checker_99',
        authorizerName: 'Senior Comptroller',
      })
    ).rejects.toThrow('INVALID_PAYOUT_STATUS')
  })
})
