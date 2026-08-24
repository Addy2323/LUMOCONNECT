/**
 * Decoupled Provider Interfaces for LUMO
 *
 * All external payment gateways, payout rails, SMS providers, email delivery,
 * and storage systems implement these interfaces.
 */

export interface PaymentInitiationRequest {
  orderId: string
  idempotencyKey: string
  amountMinorUnits: bigint
  currency: string
  customerPhone?: string
  customerEmail?: string
  paymentMethod: 'MPESA' | 'AIRTEL_MONEY' | 'TIGO_PESA' | 'HALOPESA' | 'CARD'
  callbackUrl: string
}

export interface PaymentInitiationResult {
  success: boolean
  providerReference: string
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'
  instructions?: string
  checkoutUrl?: string
  rawResponse?: Record<string, unknown>
}

export interface PaymentVerificationResult {
  providerReference: string
  orderId: string
  amountMinorUnits: bigint
  currency: string
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING'
  paymentMethod: string
  paidAt?: Date
}

export interface PaymentProvider {
  name: string
  initiatePayment(req: PaymentInitiationRequest): Promise<PaymentInitiationResult>
  verifyPayment(providerReference: string): Promise<PaymentVerificationResult>
  verifyWebhookSignature(signature: string, payload: string): boolean
}

export interface PayoutItemRequest {
  itemId: string
  partnerId: string
  destination: string // e.g. "MPESA:+255712345678" or "BANK:CRDB:0152..."
  amountMinorUnits: bigint
  currency: string
  reference: string
}

export interface PayoutBatchRequest {
  payoutId: string
  idempotencyKey: string
  totalMinorUnits: bigint
  currency: string
  items: PayoutItemRequest[]
}

export interface PayoutBatchResult {
  success: boolean
  providerBatchReference: string
  status: 'INITIATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  itemResults: {
    itemId: string
    status: 'SUCCESS' | 'FAILED' | 'PENDING'
    providerTxReference?: string
    failureReason?: string
  }[]
}

export interface PayoutProvider {
  name: string
  disburseBatch(req: PayoutBatchRequest): Promise<PayoutBatchResult>
  checkBatchStatus(providerBatchRef: string): Promise<PayoutBatchResult>
}

export interface SmsMessage {
  recipientPhone: string // E.164 e.g. "+255712345678"
  messageText: string
  senderId?: string
}

export interface SmsProvider {
  name: string
  sendSms(msg: SmsMessage): Promise<{ success: boolean; messageId?: string; error?: string }>
}

export interface EmailMessage {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
  from?: string
}

export interface EmailProvider {
  name: string
  sendEmail(msg: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>
}

export interface StorageProvider {
  name: string
  uploadFile(file: { buffer: Buffer; fileName: string; mimeType: string; isPublic?: boolean }): Promise<{ url: string; fileKey: string }>
  getSignedDownloadUrl(fileKey: string, expiresInSeconds?: number): Promise<string>
}
