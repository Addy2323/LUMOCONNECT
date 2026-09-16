import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Prisma } from '@prisma/client'

const { tx, database } = vi.hoisted(() => {
  const models = ['organization', 'opportunity', 'verificationCase', 'order', 'reward', 'hotDealFunding', 'dispute', 'fileAsset', 'hotDealClaim', 'hotDealSave', 'hotDealEvent', 'hotDealMaterial', 'hotDeal', 'participationAgreementAcceptance', 'dealParticipation', 'referralTicket', 'riskAlert', 'enterpriseInquiry', 'user', 'auditLog', 'outboxEvent']
  const tx = Object.fromEntries(models.map((name) => [name, { count: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), create: vi.fn() }]))
  return { tx, database: { $transaction: vi.fn() } }
})
vi.mock('@/lib/db', () => ({ db: database }))
import { deleteMerchant, inspectMerchantDeletion } from '@/modules/identity/delete-merchant'

const input = { organizationId: 'merchant-1', actorId: 'admin-1', confirmation: 'Test Merchant', reason: 'Duplicate test business', deleteAccounts: true }
const member = (id: string, extra = {}) => ({ userId: id, user: { id, memberships: [{ organizationId: 'merchant-1' }], roleAssignments: [], partnerProfile: null, _count: { paymentAttempts: 0 }, ...extra } })

beforeEach(() => {
  vi.resetAllMocks()
  for (const model of Object.values(tx)) {
    model.count.mockResolvedValue(0)
    model.findMany.mockResolvedValue([])
    model.deleteMany.mockResolvedValue({ count: 0 })
  }
  tx.organization.findUnique.mockResolvedValue({ legalName: 'Test Merchant', members: [member('owner-1')] })
  database.$transaction.mockImplementation((callback) => callback(tx))
})

describe('Merchant deletion', () => {
  it('deletes the business and eligible accounts and records the audit in one transaction', async () => {
    await expect(deleteMerchant(input)).resolves.toEqual({ organizationId: 'merchant-1', deletedAccounts: 1 })
    expect(tx.organization.delete).toHaveBeenCalledWith({ where: { id: 'merchant-1' } })
    expect(tx.user.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['owner-1'] } } })
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ actorUserId: 'admin-1', action: 'merchant.deleted_permanently' }) }))
    expect(database.$transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: 'Serializable' }))
  })

  it.each(['wrong name', 'funded deal', 'reward', 'order', 'dispute'])('blocks deletion before writes for %s', async (scenario) => {
    if (scenario === 'funded deal') tx.hotDealFunding.count.mockResolvedValue(1)
    if (scenario === 'reward') tx.reward.count.mockResolvedValue(1)
    if (scenario === 'order') tx.order.count.mockResolvedValue(1)
    if (scenario === 'dispute') tx.dispute.count.mockResolvedValue(1)
    await expect(deleteMerchant({ ...input, confirmation: scenario === 'wrong name' ? 'Wrong' : input.confirmation })).rejects.toThrow()
    expect(tx.organization.delete).not.toHaveBeenCalled()
    expect(tx.hotDealClaim.deleteMany).not.toHaveBeenCalled()
  })

  it('preserves shared, privileged, actor, and financially active accounts', async () => {
    tx.organization.findUnique.mockResolvedValue({ legalName: 'Test Merchant', members: [
      member('shared', { memberships: [{ organizationId: 'other-org' }] }),
      member('admin', { roleAssignments: [{ organizationId: null, role: { code: 'SUPER_ADMIN' } }] }),
      member('payer', { _count: { paymentAttempts: 1 } }), member('admin-1'), member('owner-1'),
    ] })
    const result = await inspectMerchantDeletion(tx as unknown as Prisma.TransactionClient, 'merchant-1', 'admin-1')
    expect(result.accountIds).toEqual(['owner-1'])
    expect(result.preservedAccounts).toBe(4)
  })

  it('allows retaining all login accounts', async () => {
    await deleteMerchant({ ...input, deleteAccounts: false })
    expect(tx.user.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [] } } })
  })

  it('propagates dependency errors instead of reporting a successful partial deletion', async () => {
    tx.organization.delete.mockRejectedValue(new Error('foreign key conflict'))
    await expect(deleteMerchant(input)).rejects.toThrow('foreign key conflict')
    expect(tx.user.deleteMany).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('queues orphan document cleanup within the deletion transaction', async () => {
    const file = { id: 'file-1', fileKey: 'hot-deals/11111111-1111-4111-8111-111111111111' }
    tx.fileAsset.findMany.mockResolvedValue([file])
    await deleteMerchant(input)
    expect(tx.outboxEvent.create).toHaveBeenCalledWith({ data: {
      eventType: 'merchant.file.delete', aggregateType: 'Organization', aggregateId: 'merchant-1', payload: { fileKey: file.fileKey },
    } })
    expect(tx.fileAsset.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['file-1'] } } })
  })
})
