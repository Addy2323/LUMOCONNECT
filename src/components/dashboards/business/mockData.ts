import {
  BusinessOpportunityItem,
  BusinessPartnerItem,
  BusinessConversionRecord,
  BusinessRewardObligation,
  RewardFundingBalance,
  BusinessCampaignGroup,
  DealRoomSession,
  BusinessTeamMember,
  BusinessSaaSSubscription,
} from './types'

export const MOCK_FUNDING_BALANCE: RewardFundingBalance = {
  availableBalanceTZS: 0,
  committedToActiveDealsTZS: 0,
  pendingConfirmationTZS: 0,
  rewardsPayableTZS: 0,
  rewardsPaidTZS: 0,
  refundableBalanceTZS: 0,
  safeguardingProvider: 'CRDB Bank Escrow / Vodacom Trust Partner Account',
  lastReconciliationDate: 'Live PostgreSQL & Escrow Synced',
}

export const MOCK_BUSINESS_OPPORTUNITIES: BusinessOpportunityItem[] = []

export const MOCK_BUSINESS_PARTNERS: BusinessPartnerItem[] = []
export const MOCK_ACTIVE_PARTNERS = MOCK_BUSINESS_PARTNERS

export const MOCK_BUSINESS_CONVERSIONS: BusinessConversionRecord[] = []
export const MOCK_CONVERSIONS = MOCK_BUSINESS_CONVERSIONS

export const MOCK_BUSINESS_REWARDS: BusinessRewardObligation[] = []
export const MOCK_REWARD_OBLIGATIONS = MOCK_BUSINESS_REWARDS

export const MOCK_BUSINESS_CAMPAIGNS: BusinessCampaignGroup[] = []
export const MOCK_CAMPAIGN_GROUPS = MOCK_BUSINESS_CAMPAIGNS

export const MOCK_DEAL_ROOMS: DealRoomSession[] = []
export const MOCK_DEAL_ROOM_SESSIONS = MOCK_DEAL_ROOMS

export const MOCK_AUDIENCE_INSIGHTS = {
  totalAudienceReach: 0,
  topRegions: [],
  conversionByChannel: [],
}

export const MOCK_TEAM_MEMBERS: BusinessTeamMember[] = []

export const MOCK_SAAS_SUBSCRIPTION: BusinessSaaSSubscription = {
  planName: 'Business Starter Hub',
  cycle: 'ANNUAL',
  priceTZS: 0,
  status: 'ACTIVE',
  activeOpportunitiesUsed: 0,
  activeOpportunitiesLimit: 10,
  partnerSeatsUsed: 0,
  partnerSeatsLimit: 50,
  aiAttributionIncluded: true,
  nextBillingDate: '2027-01-01',
  invoices: [],
}
export const MOCK_BUSINESS_SUBSCRIPTION = MOCK_SAAS_SUBSCRIPTION
