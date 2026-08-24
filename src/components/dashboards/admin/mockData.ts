import {
  UserAccount,
  BusinessVerificationItem,
  AdminDealItem,
  ConversionRecord,
  SubscriptionTransaction,
  PaymentLedgerItem,
  RewardPayoutBatch,
  ReconciliationRun,
  TaxRuleConfig,
  FraudAlertCase,
  DisputeItem,
  AuditLogEntry,
  WebhookIntegration,
} from './types'

export const MOCK_USERS: UserAccount[] = [
  {
    id: 'usr_root_admin',
    name: 'LUMO Platform Super Admin',
    email: 'admin@lumo.co.tz',
    phone: '+255 700 000 000',
    role: 'ADMIN',
    status: 'ACTIVE',
    mfaEnabled: true,
    lastActive: 'Just now',
    joinedDate: new Date().toISOString().slice(0, 10),
    totalTransactions: 0,
    balanceTZS: 0,
    kycStatus: 'VERIFIED',
  },
]

export const MOCK_VERIFICATIONS: BusinessVerificationItem[] = []
export const MOCK_BUSINESS_VERIFICATIONS = MOCK_VERIFICATIONS

export const MOCK_ADMIN_DEALS: AdminDealItem[] = []

export const MOCK_CONVERSIONS: ConversionRecord[] = []

export const MOCK_SUBSCRIPTION_LEDGER: SubscriptionTransaction[] = []
export const MOCK_SUBSCRIPTION_TXS = MOCK_SUBSCRIPTION_LEDGER

export const MOCK_PAYMENTS: PaymentLedgerItem[] = []
export const MOCK_PAYMENT_LEDGER = MOCK_PAYMENTS

export const MOCK_REWARD_BATCHES: RewardPayoutBatch[] = []
export const MOCK_REWARD_PAYOUTS = MOCK_REWARD_BATCHES

export const MOCK_RECONCILIATION: ReconciliationRun[] = []
export const MOCK_RECONCILIATION_RUNS = MOCK_RECONCILIATION

export const MOCK_TAX_RULES: TaxRuleConfig[] = [
  {
    id: 'tax_tz_resident',
    code: 'TRA_IND_5',
    title: 'Individual Resident Partner Withholding Tax',
    ratePercent: 5.0,
    applicableTo: 'PARTNER_COMMISSION',
    effectiveFrom: '2026-01-01',
    authority: 'TRA',
    isActive: true,
  },
  {
    id: 'tax_tz_nonresident',
    code: 'TRA_NON_15',
    title: 'Non-Resident Partner Withholding Tax',
    ratePercent: 15.0,
    applicableTo: 'PARTNER_COMMISSION',
    effectiveFrom: '2026-01-01',
    authority: 'TRA',
    isActive: true,
  },
  {
    id: 'tax_tz_fee',
    code: 'TRA_VAT_FEE',
    title: 'LUMO Platform Fee VAT & Excise',
    ratePercent: 18.0,
    applicableTo: 'PLATFORM_FEE',
    effectiveFrom: '2026-01-01',
    authority: 'TRA',
    isActive: true,
  },
]

export const MOCK_FRAUD_ALERTS: FraudAlertCase[] = []

export const MOCK_DISPUTES: DisputeItem[] = []

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_init_01',
    timestamp: new Date().toISOString(),
    actorId: 'usr_root_admin',
    actorName: 'Platform Super Admin',
    actorRole: 'SUPER_ADMIN',
    action: 'DATABASE_INITIALIZATION_CLEAN_SLATE',
    module: 'SYSTEM',
    resourceId: 'PostgreSQL_lumodealsdb',
    ipAddress: '127.0.0.1',
    userAgent: 'Next.js Turbopack Core Server',
    hashSignature: 'sha256-init-bootstrap-clean-20260824',
  },
]

export const MOCK_WEBHOOKS: WebhookIntegration[] = [
  {
    id: 'wh_mongike_live',
    name: 'Mongike Payment Gateway (M-Pesa / Tigo / Airtel)',
    targetUrl: 'https://api.lumo.co.tz/api/webhooks/mongike',
    provider: 'VODACOM',
    apiKeyMasked: 'mk_live_****992',
    secretMasked: 'sec_live_****310',
    events: ['payment.success', 'payout.disbursed', 'payout.failed'],
    health: 'HEALTHY',
    successRate: 100,
    lastPing: 'Active Live Replica',
    pendingRetries: 0,
  },
]

export const MOCK_ADMIN_PERFORMANCE = {
  totalUsers: 1,
  verifiedBusinesses: 0,
  liveOpportunities: 0,
  platformRevenueTZS: 0,
  pendingBusinessKYB: 0,
  pendingDealApprovals: 0,
  pendingPayoutApprovals: 0,
  openFraudAlerts: 0,
}
