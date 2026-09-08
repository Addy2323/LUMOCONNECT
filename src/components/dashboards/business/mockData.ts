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

export interface VerifiedPartnerDirectoryItem {
  id: string
  name: string
  companyName?: string
  contactPhone: string
  contactEmail: string
  category: string
  skills: string[]
  type: string
  region: string
  completedDeals: number
  qualityRate: string
  rating: number
  verified: boolean
  brelaNumber?: string
  channels?: string[]
}

export const VERIFIED_PARTNERS_DIRECTORY: VerifiedPartnerDirectoryItem[] = [
  {
    id: 'ptn_auto_1',
    name: 'Kassim Auto Brokers',
    companyName: 'Kassim Vehicle Sourcing Ltd',
    contactPhone: '+255 754 889 120',
    contactEmail: 'kassim@autobrokers.co.tz',
    category: 'Automotive & Transportation',
    skills: ['High-Ticket Vehicle Sales', 'TRA Registration Transfer', 'Corporate Fleet Brokering', 'Direct B2B Sourcing'],
    type: 'Certified Sales Agent',
    region: 'Dar es Salaam',
    completedDeals: 38,
    qualityRate: '99.2%',
    rating: 4.9,
    verified: true,
    brelaNumber: 'BRELA-TZ-982144',
    channels: ['WhatsApp VIP Catalog', 'Showroom Network', 'Instagram Auto'],
  },
  {
    id: 'ptn_solar_2',
    name: 'Mwanza Renewable Energy Ltd',
    companyName: 'Mwanza Renewable Energy Ltd',
    contactPhone: '+255 784 112 334',
    contactEmail: 'info@mwanzarenewables.co.tz',
    category: 'Sourcing & Supply Chain Services',
    skills: ['Lake Zone Regional Distribution', 'Solar Grid Equipment', 'Rural Dealer Network', 'Wholesale Procurement'],
    type: 'B2B Regional Distributor',
    region: 'Mwanza',
    completedDeals: 52,
    qualityRate: '98.5%',
    rating: 4.8,
    verified: true,
    brelaNumber: 'BRELA-TZ-443910',
    channels: ['Regional Field Agents', 'Retail POS Network', 'B2B Warehouses'],
  },
  {
    id: 'ptn_re_3',
    name: 'Victoria Commercial Realtors',
    companyName: 'Victoria Property Consultants Ltd',
    contactPhone: '+255 713 908 765',
    contactEmail: 'deals@victoriarealtors.co.tz',
    category: 'Real Estate & Property',
    skills: ['Commercial Leasing', 'Industrial Warehouses', 'Land Titling & NIDA Verification', 'High-Net-Worth Buyers'],
    type: 'Commercial Property Broker',
    region: 'Dar es Salaam',
    completedDeals: 27,
    qualityRate: '99.5%',
    rating: 5.0,
    verified: true,
    brelaNumber: 'BRELA-TZ-718290',
    channels: ['Corporate Investor Network', 'Direct Legal Closers'],
  },
  {
    id: 'ptn_agri_4',
    name: 'Kahama Agritech Aggregators',
    companyName: 'Kahama Grain & Commodity Supply Co.',
    contactPhone: '+255 767 445 678',
    contactEmail: 'kahama.agritech@supply.tz',
    category: 'Farming, Agriculture & Food',
    skills: ['Bulk Maize Off-take', 'Grain Quality Moisture Testing', 'Farm Co-op Aggregation', 'Logistics Waybills'],
    type: 'Sourcing Aggregator',
    region: 'Shinyanga',
    completedDeals: 64,
    qualityRate: '97.8%',
    rating: 4.8,
    verified: true,
    brelaNumber: 'BRELA-TZ-551029',
    channels: ['Farming Cooperatives', 'Agro-dealer Network'],
  },
  {
    id: 'ptn_tech_5',
    name: 'Sarah K. Tech Media',
    companyName: 'Bongo Tech Reviews',
    contactPhone: '+255 719 334 556',
    contactEmail: 'sarah.k@lumocreators.tz',
    category: 'Technology & Consumer Electronics',
    skills: ['Laptop & Smartphone Reviews', 'YouTube Hardware Demos', 'TikTok Tech Viral', 'Performance Affiliate'],
    type: 'Creator / Media Partner',
    region: 'Dar es Salaam',
    completedDeals: 41,
    qualityRate: '99.0%',
    rating: 4.9,
    verified: true,
    channels: ['YouTube (120k)', 'TikTok (240k)', 'Telegram Tech Hub'],
  },
  {
    id: 'ptn_it_6',
    name: 'Baraka IT & Cloud Solutions',
    companyName: 'Baraka Software Consultants',
    contactPhone: '+255 782 556 778',
    contactEmail: 'baraka@solutions.co.tz',
    category: 'IT & Software Services',
    skills: ['SaaS Demo Conversion', 'POS System Onboarding', 'SME B2B Outreach', 'Technical Integration'],
    type: 'Lead Generator',
    region: 'Arusha',
    completedDeals: 31,
    qualityRate: '96.9%',
    rating: 4.7,
    verified: true,
    brelaNumber: 'BRELA-TZ-332901',
    channels: ['Corporate Consultancies', 'Direct SME Sales'],
  },
  {
    id: 'ptn_fash_7',
    name: 'Neema Fashion Agency',
    companyName: 'Swahili Style Network',
    contactPhone: '+255 755 990 112',
    contactEmail: 'neema@swahilistyle.tz',
    category: 'Apparel & Fashion',
    skills: ['Boutique Apparel Sales', 'Instagram Reels Fashion', 'Influencer Collabs', 'Retail Merchandising'],
    type: 'Creator / Media Partner',
    region: 'Zanzibar',
    completedDeals: 29,
    qualityRate: '98.0%',
    rating: 4.8,
    verified: true,
    channels: ['Instagram (85k)', 'WhatsApp Fashion Circles'],
  },
  {
    id: 'ptn_mach_8',
    name: 'Kilimanjaro Industrial Tools',
    companyName: 'Kilimanjaro Heavy Equipment Ltd',
    contactPhone: '+255 768 221 443',
    contactEmail: 'equipment@kili-tools.co.tz',
    category: 'Industrial Machinery & Tools',
    skills: ['Generator & Heavy Machinery B2B', 'Mining Contractor Sourcing', 'Site Inspection & Delivery', 'Equipment Tenders'],
    type: 'B2B Regional Distributor',
    region: 'Arusha',
    completedDeals: 22,
    qualityRate: '100%',
    rating: 5.0,
    verified: true,
    brelaNumber: 'BRELA-TZ-119280',
    channels: ['Industrial Tenders', 'Mining Network'],
  },
]

export const MOCK_FUNDING_BALANCE: RewardFundingBalance = {
  availableBalanceTZS: 0,
  committedToActiveDealsTZS: 0,
  pendingConfirmationTZS: 0,
  rewardsPayableTZS: 0,
  rewardsPaidTZS: 0,
  refundableBalanceTZS: 0,
  safeguardingProvider: 'CRDB Bank Custody / Vodacom Trust Partner Account (Funds Are Secured)',
  lastReconciliationDate: 'Live PostgreSQL & Ledger Synced',
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
