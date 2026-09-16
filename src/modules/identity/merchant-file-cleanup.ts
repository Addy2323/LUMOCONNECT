import { db } from '@/lib/db'
import { removePrivateFile } from '@/modules/hot-deals/storage'

// Durable jobs are committed with the deletion and retried by the operations worker.
export async function cleanupDeletedMerchantFiles(organizationId?: string) {
  const jobs = await db.outboxEvent.findMany({ where: { eventType: 'merchant.file.delete', processedAt: null,
    ...(organizationId ? { aggregateId: organizationId } : {}),
  }, take: 50, orderBy: { createdAt: 'asc' } })
  for (const job of jobs) {
    try {
      const payload = job.payload as { fileKey?: string }
      if (!payload.fileKey) throw new Error('Missing document key')
      try { await removePrivateFile(payload.fileKey) }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
      await db.outboxEvent.update({ where: { id: job.id }, data: { processedAt: new Date(), failedAt: null } })
    } catch {
      await db.outboxEvent.update({ where: { id: job.id }, data: { failedAt: new Date(), retryCount: { increment: 1 } } })
    }
  }
  return db.outboxEvent.count({ where: { eventType: 'merchant.file.delete', processedAt: null,
    ...(organizationId ? { aggregateId: organizationId } : {}),
  } })
}
