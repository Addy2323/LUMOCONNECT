/**
 * Durable SMS Persistence & Audit Store
 */

import type {
  SmsJob,
  SmsBatchRecord,
  SmsFundingRecord,
  SmsCampaign,
  SmsAuditLog,
  SmsJobStatus,
  SmsChannel,
  TanzaniaOperator,
} from './types'
import { maskPhoneNumber, normalizeMesejiPhone, detectTanzaniaOperator } from './phone'

const jobsStore: SmsJob[] = []
const batchesStore: SmsBatchRecord[] = []
const fundingStore: SmsFundingRecord[] = []
const campaignsStore: SmsCampaign[] = []
const auditStore: SmsAuditLog[] = []

/**
 * Stages or records an SMS job with deduplication and phone masking
 */
export function recordSmsJob(jobData: {
  id?: string
  recipientPhone: string
  messageText: string
  senderId?: string
  channel?: SmsChannel | string
  operator?: TanzaniaOperator | string
  status?: SmsJobStatus
  segments?: number
  characterCount?: number
  isGsm7?: boolean
  batchId?: string
  campaignId?: string
  deduplicationKey?: string
  templateCode?: string
  purpose?: string
  language?: string
  sanitizedMessage?: string
  provider?: string
  providerRequestId?: string
  attemptsCount?: number
  maxAttempts?: number
  metadata?: Record<string, unknown>
}): SmsJob {
  const normPhone = normalizeMesejiPhone(jobData.recipientPhone)
  const masked = maskPhoneNumber(normPhone)
  const detectedOp = jobData.operator || detectTanzaniaOperator(normPhone)

  // Check deduplication
  if (jobData.deduplicationKey) {
    const existing = jobsStore.find((j) => j.deduplicationKey === jobData.deduplicationKey)
    if (existing) return existing
  }

  const messageContent = jobData.sanitizedMessage || jobData.messageText || ''

  const job: SmsJob = {
    id: jobData.id || `sms_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    recipientPhone: masked,
    messageText: messageContent,
    senderId: jobData.senderId || 'Lumo',
    provider: jobData.provider || (process.env.SMS_PROVIDER || 'beem').toUpperCase(),
    providerRequestId: jobData.providerRequestId,
    channel: (jobData.channel as SmsChannel) || 'TRANSACTIONAL',
    operator: detectedOp as TanzaniaOperator,
    status: jobData.status || 'PENDING',
    segments: jobData.segments || 1,
    characterCount: jobData.characterCount || messageContent.length,
    isGsm7: jobData.isGsm7 ?? true,
    batchId: jobData.batchId,
    campaignId: jobData.campaignId,
    deduplicationKey: jobData.deduplicationKey,
    templateCode: jobData.templateCode,
    maskedPhone: masked,
    attemptsCount: jobData.attemptsCount || 0,
    maxAttempts: jobData.maxAttempts || 3,
    recipientDeliveryStatus: 'RECIPIENT_DELIVERY_UNAVAILABLE',
    metadata: jobData.metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  jobsStore.unshift(job)
  return job
}

/**
 * Finds SMS job by ID
 */
export function getSmsJobById(id: string): SmsJob | undefined {
  return jobsStore.find((j) => j.id === id)
}

/**
 * Finds SMS job by Provider Request ID or Batch ID
 */
export function getSmsJobByRequestId(requestId: string): SmsJob | undefined {
  return jobsStore.find((j) => j.providerRequestId === requestId || j.batchId === requestId)
}

/**
 * Updates status of an existing SMS job
 */
export function updateSmsJobStatus(
  id: string,
  statusOrUpdate: SmsJobStatus | { status: SmsJobStatus; batchId?: string; providerRequestId?: string; error?: string },
  batchId?: string,
  error?: string
): SmsJob | undefined {
  const job = jobsStore.find((j) => j.id === id || j.providerRequestId === id)
  if (!job) return undefined

  if (typeof statusOrUpdate === 'string') {
    job.status = statusOrUpdate
    if (batchId) {
      job.batchId = batchId
      job.providerRequestId = batchId
    }
    if (error) job.lastError = error
  } else {
    job.status = statusOrUpdate.status
    if (statusOrUpdate.batchId) job.batchId = statusOrUpdate.batchId
    if (statusOrUpdate.providerRequestId) job.providerRequestId = statusOrUpdate.providerRequestId
    if (statusOrUpdate.error) job.lastError = statusOrUpdate.error
  }

  job.updatedAt = new Date()
  return job
}

/**
 * Updates individual delivery receipt status for an SMS job
 */
export function updateSmsJobDeliveryStatus(
  idOrRequestId: string,
  deliveryStatus: SmsJob['recipientDeliveryStatus'],
  error?: string
): SmsJob | undefined {
  const job = jobsStore.find((j) => j.id === idOrRequestId || j.providerRequestId === idOrRequestId || j.batchId === idOrRequestId)
  if (!job) return undefined

  job.recipientDeliveryStatus = deliveryStatus
  if (error) job.lastError = error
  if (deliveryStatus === 'DELIVERED') {
    job.status = 'COMPLETED'
  } else if (deliveryStatus === 'FAILED' || deliveryStatus === 'UNDELIVERED') {
    job.status = 'FAILED'
  }
  job.updatedAt = new Date()
  return job
}

/**
 * Retrieves failed and uncertain submissions that need administrative review
 */
export function getSmsJobsNeedingReview(): SmsJob[] {
  return jobsStore.filter((j) => j.status === 'FAILED' || j.status === 'UNCERTAIN')
}

/**
 * Lists SMS jobs with search, filtering and pagination
 */
export function getSmsJobs(filter?: {
  status?: SmsJobStatus | 'ALL'
  channel?: string | 'ALL'
  operator?: string | 'ALL'
  search?: string
  limit?: number
  offset?: number
}): SmsJob[] {
  let result = [...jobsStore]

  if (filter?.status && filter.status !== 'ALL') {
    result = result.filter((j) => j.status === filter.status)
  }
  if (filter?.channel && filter.channel !== 'ALL') {
    result = result.filter((j) => j.channel === filter.channel)
  }
  if (filter?.operator && filter.operator !== 'ALL') {
    result = result.filter((j) => j.operator === filter.operator)
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase()
    result = result.filter(
      (j) =>
        j.recipientPhone.includes(q) ||
        (j.templateCode && j.templateCode.toLowerCase().includes(q)) ||
        (j.batchId && j.batchId.toLowerCase().includes(q))
    )
  }

  const offset = filter?.offset || 0
  const limit = filter?.limit || 50
  return result.slice(offset, offset + limit)
}

export const listSmsJobs = getSmsJobs

/**
 * Batch store operations
 */
export function recordSmsBatch(batch: SmsBatchRecord): void {
  const idx = batchesStore.findIndex((b) => b.batchId === batch.batchId)
  if (idx >= 0) {
    batchesStore[idx] = batch
  } else {
    batchesStore.unshift(batch)
  }
}

export function getSmsBatches(): SmsBatchRecord[] {
  return [...batchesStore]
}

export const listSmsBatches = getSmsBatches

/**
 * Campaigns store operations
 */
export function createSmsCampaign(data: {
  name: string
  senderId?: string
  messageText: string
  totalRecipients: number
  totalSegments: number
  costEstimateTzs?: number
  audienceFilter?: Record<string, unknown>
  scheduledAt?: Date
}): SmsCampaign {
  const campaign: SmsCampaign = {
    id: `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: data.name,
    title: data.name,
    senderId: data.senderId || 'Lumo',
    messageText: data.messageText,
    totalRecipients: data.totalRecipients,
    totalSegments: data.totalSegments,
    totalSegmentsEstimated: data.totalSegments,
    costEstimateTzs: data.costEstimateTzs || data.totalSegments * 25,
    estimatedCostTZS: data.costEstimateTzs || data.totalSegments * 25,
    status: 'ACTIVE',
    audienceFilter: data.audienceFilter,
    scheduledAt: data.scheduledAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  campaignsStore.unshift(campaign)
  return campaign
}

export function updateCampaignStatus(
  id: string,
  status: SmsCampaign['status']
): SmsCampaign | undefined {
  const camp = campaignsStore.find((c) => c.id === id)
  if (!camp) return undefined
  camp.status = status
  camp.updatedAt = new Date()
  return camp
}

export function listSmsCampaigns(): SmsCampaign[] {
  return [...campaignsStore]
}

/**
 * Funding history store operations
 */
export function recordFundingAttempt(data: {
  method: string
  amountTzs: number
  reference: string
  status?: string
  provider?: string
  phone?: string
  orderId?: string
}): SmsFundingRecord {
  const funding: SmsFundingRecord = {
    id: `fnd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    method: data.method,
    amountTzs: data.amountTzs,
    amountTZS: data.amountTzs,
    orderId: data.orderId || data.reference,
    reference: data.reference,
    status: data.status || 'PENDING',
    provider: data.provider || 'M-PESA',
    phone: data.phone,
    createdAt: new Date(),
  }

  fundingStore.unshift(funding)
  return funding
}

export function updateFundingAttemptStatus(
  referenceOrId: string,
  status: string
): SmsFundingRecord | undefined {
  const record = fundingStore.find(
    (f) => f.id === referenceOrId || f.reference === referenceOrId || f.orderId === referenceOrId
  )
  if (!record) return undefined
  record.status = status
  return record
}

export function getFundingHistory(): SmsFundingRecord[] {
  return [...fundingStore]
}

export const listFundingRecords = getFundingHistory

/**
 * Store summary for KPI dashboard
 */
export function getSmsStoreSummary() {
  const submitted = jobsStore.filter((j) => j.status === 'SUBMITTED').length
  const pending = jobsStore.filter((j) => j.status === 'PENDING').length
  const uncertain = jobsStore.filter((j) => j.status === 'UNCERTAIN').length
  const failed = jobsStore.filter((j) => j.status === 'FAILED').length
  const cancelled = jobsStore.filter((j) => j.status === 'CANCELLED').length

  return {
    totalJobs: jobsStore.length,
    submitted,
    pending,
    uncertain,
    failed,
    cancelled,
    totalBatches: batchesStore.length,
    totalCampaigns: campaignsStore.length,
    activeCampaigns: campaignsStore.filter((c) => c.status === 'ACTIVE').length,
    totalFundingAttempts: fundingStore.length,
  }
}

/**
 * Audit log recording
 */
export function addSmsAuditLog(
  action: string,
  actor: string,
  details: Record<string, unknown> | string,
  targetId?: string
): SmsAuditLog {
  const log: SmsAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    action,
    actor,
    adminId: actor,
    targetId,
    details,
    timestamp: new Date(),
  }
  auditStore.unshift(log)
  return log
}

export function listSmsAuditLogs(): SmsAuditLog[] {
  return [...auditStore]
}

/**
 * Resets the in-memory store (used for unit tests)
 */
export function resetSmsStore(): void {
  jobsStore.length = 0
  batchesStore.length = 0
  campaignsStore.length = 0
  fundingStore.length = 0
  auditStore.length = 0
}
