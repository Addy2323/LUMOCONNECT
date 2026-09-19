import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/lib/db', () => ({ db: { outboxEvent: { findMany: vi.fn(), update: vi.fn(), count: vi.fn() } } }))
vi.mock('@/modules/hot-deals/storage', () => ({ removePrivateFile: vi.fn() }))
import { db } from '@/lib/db'
import { removePrivateFile } from '@/modules/hot-deals/storage'
import { cleanupDeletedMerchantFiles } from '@/modules/identity/merchant-file-cleanup'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(db.outboxEvent.findMany).mockResolvedValue([{ id: 'job', payload: { fileKey: 'hot-deals/file' } }] as never)
  vi.mocked(db.outboxEvent.count).mockResolvedValue(0)
})
describe('Deleted merchant document cleanup', () => {
  it('deletes the object and marks the job complete', async () => {
    await cleanupDeletedMerchantFiles('merchant')
    expect(removePrivateFile).toHaveBeenCalledWith('hot-deals/file')
    expect(db.outboxEvent.update).toHaveBeenCalledWith({ where: { id: 'job' }, data: { processedAt: expect.any(Date), failedAt: null } })
  })
  it('leaves failed jobs pending for retry', async () => {
    vi.mocked(removePrivateFile).mockRejectedValue(new Error('Storage unavailable'))
    vi.mocked(db.outboxEvent.count).mockResolvedValue(1)
    expect(await cleanupDeletedMerchantFiles('merchant')).toBe(1)
    expect(db.outboxEvent.update).toHaveBeenCalledWith({ where: { id: 'job' }, data: { failedAt: expect.any(Date), retryCount: { increment: 1 } } })
  })
  it('treats an already removed local file as success', async () => {
    vi.mocked(removePrivateFile).mockRejectedValue(Object.assign(new Error('Missing'), { code: 'ENOENT' }))
    await cleanupDeletedMerchantFiles()
    expect(db.outboxEvent.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ processedAt: expect.any(Date) }) }))
  })
})
