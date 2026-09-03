import {
  PartnerOpportunitySummary,
  JoinedDealItem,
  PartnerLeadItem,
  PartnerDealRoom,
  PartnerPerformanceMetrics,
  PartnerEarningsRecord,
  PartnerPayoutRequest,
  PartnerPayoutMethod,
  PartnerSubscriptionPlan,
  PartnerKYCProfile,
} from './types'

export const MOCK_PARTNER_OPPORTUNITIES: PartnerOpportunitySummary[] = []

export const MOCK_JOINED_DEALS: JoinedDealItem[] = []

export const MOCK_PARTNER_LEADS: PartnerLeadItem[] = []

export const MOCK_PARTNER_DEAL_ROOMS: PartnerDealRoom[] = []

export const MOCK_PARTNER_PERFORMANCE: PartnerPerformanceMetrics = {
  verifiedClicks: 0,
  qualifiedLeads: 0,
  verifiedConversions: 0,
  revenueGeneratedTZS: 0,
  conversionRatePercent: 0,
  averageDealValueTZS: 0,
  approvedRewardsTZS: 0,
  rejectedResultsCount: 0,
  reversalsCount: 0,
  milestoneProgressPercent: 0,
}

export const MOCK_PARTNER_EARNINGS: PartnerEarningsRecord[] = []
export const MOCK_EARNINGS_RECORDS = MOCK_PARTNER_EARNINGS

export const MOCK_PAYOUT_REQUESTS: PartnerPayoutRequest[] = []

export const MOCK_PAYOUT_METHODS: PartnerPayoutMethod[] = []

export const MOCK_PARTNER_SUBSCRIPTION: PartnerSubscriptionPlan = {
  planName: 'No Active Subscription',
  status: 'EXPIRED',
  daysRemaining: 0,
  priceTZS: 0,
  cycle: 'MONTHLY',
  expiryDate: '—',
  autoRenew: false,
}

export const MOCK_PARTNER_KYC: PartnerKYCProfile = {
  fullName: '',
  phoneMasked: '',
  email: '',
  partnerType: 'AFFILIATE',
  nidaNumberMasked: '',
  tinNumberMasked: '',
  isIdentityVerified: false,
  region: 'Dar es Salaam',
  channels: [],
  audienceSize: '0',
}
export const MOCK_KYC_PROFILE = MOCK_PARTNER_KYC

export const MOCK_PARTNER_NOTIFICATIONS = []
