/**
 * LUMO Meseji SMS Data Contracts & Domain Types
 */

export type SmsJobPurpose =
  | 'AUTH_OTP'
  | 'ORDER_UPDATE'
  | 'PAYMENT_RECEIPT'
  | 'PAYOUT_ALERT'
  | 'KYB_UPDATE'
  | 'SUBSCRIPTION'
  | 'CAMPAIGN'
  | 'GENERAL'

export type SmsJobStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'UNCERTAIN'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export type SmsChannel = 'SMS' | 'WHATSAPP' | 'VOICE'
export type TanzaniaOperator = 'VODACOM' | 'AIRTEL' | 'TIGO' | 'HALOTEL' | 'TTCL' | 'ZANTEL' | 'UNKNOWN'

export interface SmsJob {
  id: string
  deduplicationKey: string
  templateCode: string
  recipientPhone: string // Normalized: 255XXXXXXXXX
  maskedPhone: string    // 25578***4567
  recipientUserId?: string
  purpose: SmsJobPurpose
  language: 'EN' | 'SW'
  sanitizedMessage: string // OTP codes redacted if sensitive
  messageText?: string
  senderId?: string
  channel?: SmsChannel | string
  operator?: TanzaniaOperator | string
  batchId?: string
  status: SmsJobStatus
  providerStatus?: string
  recipientDeliveryStatus: 'RECIPIENT_DELIVERY_UNAVAILABLE' | 'DELIVERED' | 'FAILED'
  attemptsCount: number
  maxAttempts: number
  estimatedCostTZS?: number
  lastError?: string
  createdAt: Date
  submittedAt?: Date
  reconciledAt?: Date
  updatedAt?: Date
  metadata?: Record<string, unknown>
}

export interface SmsBatchRecord {
  batchId: string
  senderId: string
  totalRecipients: number
  deliveredCount?: number
  failedCount?: number
  pendingCount?: number
  estimatedCostTZS?: number
  providerStatus: string
  lastReconciledAt: Date
  createdAt: Date
}

export interface SmsFundingRecord {
  id: string
  method: 'USSD' | 'ZENOPAY'
  amountTZS: number
  amountTzs?: number
  phone: string
  orderId: string
  reference?: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  creditedCredits?: number
  createdAt: Date
  completedAt?: Date
  rawResponse?: unknown
}

export interface SmsCampaign {
  id: string
  title: string
  name?: string
  targetAudience: 'ALL_PARTNERS' | 'ALL_BUSINESSES' | 'ALL_CUSTOMERS' | 'ACTIVE_MEMBERS'
  templateCode: string
  language: 'EN' | 'SW'
  totalRecipients: number
  totalSegmentsEstimated: number
  estimatedCostTZS: number
  status: 'DRAFT' | 'CONFIRMED' | 'DISPATCHING' | 'COMPLETED' | 'PAUSED' | 'CANCELLED' | 'ACTIVE' | 'FAILED'
  confirmedBy?: string
  createdAt: Date
  dispatchedAt?: Date
  updatedAt?: Date
}

export interface SmsAuditLog {
  id: string
  action: 'DISPATCH_SMS' | 'REQUEST_SENDER_ID' | 'FUND_CREDITS' | 'RECONCILE_BATCH' | 'UPDATE_CAMPAIGN'
  adminId: string
  details: string
  timestamp: Date
}
