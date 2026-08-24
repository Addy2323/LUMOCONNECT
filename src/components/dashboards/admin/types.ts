export type AdminSidebarSection =
  // Group 1: Platform
  | 'overview'
  | 'users'
  | 'verifications'
  | 'deals'
  | 'approvals'
  | 'conversions'
  // Group 2: Financial Operations
  | 'subscriptions'
  | 'payments'
  | 'payouts'
  | 'reconciliation'
  | 'tax'
  // Group 3: Risk & Support
  | 'kyc'
  | 'risk'
  | 'disputes'
  | 'logs'
  // Group 4: System
  | 'notifications'
  | 'content'
  | 'roles'
  | 'integrations'
  | 'settings'

export type AdminRole = 
  | 'SUPER_ADMIN'
  | 'MAKER_OPERATIONS'
  | 'CHECKER_COMPLIANCE'
  | 'FINANCE_ADMIN'
  | 'SUPPORT_OFFICER'
  | 'TECHNICAL_ADMIN'

export interface UserAccount {
  id: string
  name: string
  email: string
  phone: string
  role: 'PARTNER' | 'BUSINESS' | 'ADMIN' | 'STAFF'
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'ARCHIVED'
  mfaEnabled: boolean
  lastActive: string
  joinedDate: string
  totalTransactions: number
  balanceTZS: number
  kycStatus: 'NOT_SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED'
}

export interface BusinessVerificationItem {
  id: string
  businessName: string
  registrationNumber: string
  tinNumber: string
  industry: string
  contactPerson: string
  email: string
  phone: string
  submittedAt: string
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'MORE_INFO_REQUIRED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  documents: {
    name: string
    type: 'BRELA_CERT' | 'TIN_CERT' | 'TAX_CLEARANCE' | 'ID_PASSPORT'
    status: 'VERIFIED' | 'PENDING' | 'INVALID'
    url: string
  }[]
  beneficialOwners: string[]
  assignedChecker?: string
  decisionReason?: string
}

export interface AdminDealItem {
  id: string
  slug: string
  title: string
  businessName: string
  category: string
  type: string
  rewardValueTZS: number
  budgetTZS: number
  spentTZS: number
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'PAUSED' | 'CLOSED' | 'ARCHIVED'
  version: number
  activePartners: number
  createdAt: string
  publishedAt?: string
  checkerNotes?: string
}

export interface ConversionRecord {
  id: string
  dealTitle: string
  partnerName: string
  partnerCode: string
  channel: 'AFFILIATE_LINK' | 'PROMO_CODE' | 'QR_SCAN' | 'MERCHANT_API'
  referenceId: string
  customerIdentifier: string
  amountTZS: number
  commissionTZS: number
  timestamp: string
  status: 'TRACKED' | 'VERIFIED' | 'DUPLICATE_FLAGGED' | 'ADJUSTED' | 'REVERSED'
  webhookStatus: 'DELIVERED' | 'PENDING' | 'FAILED'
  ipAddress: string
}

export interface SubscriptionTransaction {
  id: string
  userId: string
  userName: string
  planCode: 'MONTHLY' | 'SEMI_ANNUAL' | 'ENTERPRISE_AI'
  planName: string
  amountTZS: number
  status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED'
  providerRef: string
  startsAt: string
  expiresAt: string
  autoRenew: boolean
}

export interface PaymentLedgerItem {
  id: string
  reference: string
  payerName: string
  payerType: 'PARTNER' | 'BUSINESS'
  channel: 'VODACOM_MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'HALOPESA' | 'CRDB_BANK' | 'NMB_BANK'
  purpose: 'SUBSCRIPTION' | 'DEAL_ESCROW_FUNDING' | 'FEATURED_LISTING'
  grossAmountTZS: number
  processingFeeTZS: number
  netAmountTZS: number
  status: 'CREATED' | 'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED' | 'REFUNDED'
  createdAt: string
  verifiedAt?: string
  providerMessage?: string
}

export interface RewardPayoutBatch {
  id: string
  batchNumber: string
  totalPartners: number
  grossPayoutTZS: number
  withholdingTaxTZS: number
  netPayoutTZS: number
  status: 'TRACKED' | 'PENDING_MAKER' | 'APPROVED_CHECKER' | 'PAYABLE' | 'DISBURSING' | 'COMPLETED' | 'REVERSED'
  createdAt: string
  disbursedAt?: string
  makerName: string
  checkerName?: string
}

export interface ReconciliationRun {
  id: string
  period: string
  provider: string
  systemTotalTZS: number
  providerTotalTZS: number
  varianceTZS: number
  matchedCount: number
  unmatchedCount: number
  status: 'IN_PROGRESS' | 'RECONCILED' | 'ADJUSTMENT_REQUIRED' | 'CLOSED'
  createdAt: string
  closedAt?: string
  closedBy?: string
}

export interface TaxRuleConfig {
  id: string
  code: string
  title: string
  ratePercent: number
  applicableTo: 'PARTNER_COMMISSION' | 'PLATFORM_FEE' | 'MERCHANT_ESCROW'
  effectiveFrom: string
  effectiveTo?: string
  authority: 'TRA' | 'LOCAL_GOV'
  isActive: boolean
}

export interface FraudAlertCase {
  id: string
  caseNumber: string
  title: string
  suspectEntity: string
  type: 'BOT_CLICK_FLOOD' | 'SELF_REFERRAL' | 'DUPLICATE_CONVERSION' | 'RAPID_WITHDRAWAL' | 'SPOOFED_LOCATION'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskScore: number
  flaggedAmountTZS: number
  status: 'OPEN' | 'INVESTIGATING' | 'HOLD_APPLIED' | 'DISMISSED_LEGITIMATE' | 'CONFIRMED_FRAUD_CLOSED'
  createdAt: string
  assignedOfficer?: string
  decisionReason?: string
}

export interface DisputeItem {
  id: string
  ticketNumber: string
  title: string
  complainant: string
  respondent: string
  dealRef: string
  disputedAmountTZS: number
  status: 'OPEN' | 'ASSIGNED' | 'INVESTIGATING' | 'AWAITING_EVIDENCE' | 'RESOLVED' | 'CLOSED' | 'APPEALED'
  openedAt: string
  assignedTo: string
  priority: 'NORMAL' | 'URGENT'
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  actorId: string
  actorName: string
  actorRole: string
  action: string
  module: 'AUTH' | 'BUSINESS' | 'DEALS' | 'PAYMENTS' | 'PAYOUTS' | 'RISK' | 'SETTINGS' | 'SYSTEM'
  resourceId: string
  ipAddress: string
  userAgent: string
  beforeState?: Record<string, any>
  afterState?: Record<string, any>
  hashSignature: string
}

export interface WebhookIntegration {
  id: string
  name: string
  targetUrl: string
  provider: 'VODACOM' | 'TIGO' | 'AIRTEL' | 'SELCOM' | 'SHOPIFY_PLUGIN' | 'WOOCOMMERCE'
  apiKeyMasked: string
  secretMasked: string
  events: string[]
  health: 'HEALTHY' | 'DEGRADED' | 'FAILING'
  successRate: number
  lastPing: string
  pendingRetries: number
}
