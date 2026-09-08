'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Briefcase,
  Layers,
  Award,
  Target,
  FileText,
  DollarSign,
  ShieldCheck,
  Laptop,
  Smartphone,
  Calendar,
  Lock,
  Image as ImageIcon,
  Video,
  Play,
  Trash2,
  Plus,
  Link,
  Film,
  Paperclip,
  Search,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import {
  OpportunityType,
  CommercialResultType,
  RewardStructureType,
  TrackingMethod,
  BusinessOpportunityItem,
} from '../types'
import { useBusinessToast } from '../BusinessToast'
import { createDealOpportunity, getVideoEmbedInfo } from '@/modules/deals/service'
import { TANZANIA_OPPORTUNITY_CATEGORIES } from '@/modules/deals/taxonomy'

interface CreateOpportunityWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onOpportunityCreated: (opp: BusinessOpportunityItem) => void
}

const PRESET_COVER_IMAGES = [
  {
    category: 'Renewable Energy',
    label: 'Solar Microgrids & Household Kits',
    url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=60',
  },
  {
    category: 'AgriBusiness',
    label: 'Irrigation & Farming Inputs',
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=800&auto=format&fit=crop&q=60',
  },
  {
    category: 'FinTech & Mobile Money',
    label: 'Digital Payments & POS Terminals',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=60',
  },
  {
    category: 'FMCG & Consumer Goods',
    label: 'Household & Retail Distribution',
    url: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800&auto=format&fit=crop&q=60',
  },
  {
    category: 'B2B & Industrial',
    label: 'Corporate Wholesale & Warehousing',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60',
  },
]

const TANZANIA_SEPARATE_REGIONS = [
  'All Regions (National - Tanzania)',
  'Dar es Salaam',
  'Arusha',
  'Mwanza',
  'Dodoma',
  'Kilimanjaro',
  'Mbeya',
  'Morogoro',
  'Tanga',
  'Pwani (Coast)',
  'Iringa',
  'Tabora',
  'Kigoma',
  'Shinyanga',
  'Kagera',
  'Mara',
  'Manyara',
  'Singida',
  'Ruvuma',
  'Mtwara',
  'Lindi',
  'Songwe',
  'Rukwa',
  'Katavi',
  'Njombe',
  'Geita',
  'Simiyu',
  'Zanzibar (Unguja)',
  'Zanzibar (Pemba)',
]

const INDUSTRY_CATEGORIES = [
  {
    name: 'Market Finder & Trade Insights',
    desc: 'Market research, competitor analysis, global trade data, export/import demand matchmaking, and lead generation tools.',
  },
  {
    name: 'Real Estate & Property',
    desc: 'Commercial/residential sales, land listings, property management, and building materials.',
  },
  {
    name: 'Automotive & Transportation',
    desc: 'Vehicles, auto parts, replacement components, electronics, and accessories.',
  },
  {
    name: 'Advertising, Media & Marketing',
    desc: 'Display signage, promotional merchandise, print/digital ad materials, and agency services.',
  },
  {
    name: 'Sourcing & Supply Chain Services',
    desc: 'OEM/ODM manufacturing, dropshipping, freight forwarding, inspection, and wholesale procurement.',
  },
  {
    name: 'Technology & Consumer Electronics',
    desc: 'Hardware, smart devices, components, communication tools, and gadgets.',
  },
  {
    name: 'IT & Software Services',
    desc: 'Cloud computing, web/app development, SaaS solutions, and technical support.',
  },
  {
    name: 'Apparel & Fashion',
    desc: 'Clothing, textiles, footwear, jewelry, and fashion accessories.',
  },
  {
    name: 'Gaming, Toys & Entertainment',
    desc: 'Video game accessories, consoles, board games, toys, and digital entertainment gear.',
  },
  {
    name: 'Farming, Agriculture & Food',
    desc: 'Agricultural machinery, seeds, crops, livestock equipment, fertilizers, and raw food ingredients.',
  },
  {
    name: 'General & Professional Services',
    desc: 'Business consulting, legal, translation, maintenance, accounting, and operational contracting.',
  },
  {
    name: 'Industrial Machinery & Tools',
    desc: 'Heavy equipment, manufacturing machinery, hardware, and raw industrial materials.',
  },
  {
    name: 'Home & Garden',
    desc: 'Furniture, kitchenware, home decor, and outdoor equipment.',
  },
  {
    name: 'Health & Personal Care',
    desc: 'Cosmetics, skincare, medical supplies, and wellness products.',
  },
]

interface CategoryRewardConfig {
  category: string
  archetype: string
  modelId: RewardStructureType
  modelTitle: string
  baselinePriceLabel: string
  defaultBaselinePriceTZS: number
  baselineCurrency: 'TZS' | 'USD'
  defaultRewardValueTZS: number
  defaultRewardPercent: number
  rewardCalculationSummary: string
  defaultDisplayLabel: string
  triggerPreset: string
  practicalDealExample: string
  commercialTermsBreakdown: string
  detailedDealFlow: string
  icon: string
}

export const CATEGORY_REWARD_CONFIG: Record<string, CategoryRewardConfig> = {
  'Automotive & Transportation': {
    category: 'Automotive & Transportation',
    archetype: 'High-Ticket Sales (Fixed Cash Bounty or %)',
    modelId: 'FIXED_REWARD',
    modelTitle: 'Fixed Cash Bounty',
    baselinePriceLabel: 'Asset Valuation & Vehicle Price',
    defaultBaselinePriceTZS: 180000000,
    baselineCurrency: 'TZS',
    defaultRewardValueTZS: 2000000,
    defaultRewardPercent: 1.1,
    rewardCalculationSummary: 'Fixed TZS 2,000,000 (or 1.1% of baseline asset value)',
    defaultDisplayLabel: 'Asset Price: TZS 180,000,000 | Finder Bounty: TZS 2,000,000',
    triggerPreset: 'per signed dealer contract',
    practicalDealExample: 'A car dealership lists a Toyota Land Cruiser for TZS 180,000,000 with a dedicated "Find Buyer & Earn" button.',
    commercialTermsBreakdown: 'The partner shares the vehicle link or refers a direct buyer. A fixed finder reward of TZS 2,000,000 is credited once the dealer contract is completed and funds clear.',
    detailedDealFlow: 'A car dealership sets the selling price of an imported vehicle at TZS 180M. The platform dynamically displays two paths: buyers see a "Buy Now" button at TZS 180M, while partners see a "Find Buyer & Earn TZS 2M" button. When an agent shares the attributable link/QR code and a buyer completes payment and registration transfer, the system releases the TZS 2,000,000 bounty after deducting applicable tax withholding.',
    icon: '🚗',
  },
  'Real Estate & Property': {
    category: 'Real Estate & Property',
    archetype: 'High-Ticket Sales (Hybrid: Base + % Closing)',
    modelId: 'HYBRID_COMPENSATION',
    modelTitle: 'Hybrid (Base + %)',
    baselinePriceLabel: 'Property Valuation & Listing Price',
    defaultBaselinePriceTZS: 120000000,
    baselineCurrency: 'TZS',
    defaultRewardValueTZS: 500000,
    defaultRewardPercent: 2,
    rewardCalculationSummary: 'TZS 500,000 base inspection fee + 2% closing commission (TZS 2,400,000)',
    defaultDisplayLabel: 'Listing Price: TZS 120M | Total Max Earning: TZS 2,900,000',
    triggerPreset: 'per signed property contract',
    practicalDealExample: 'A real estate developer lists a commercial building or prime residential plot in Kigamboni valued at TZS 120,000,000.',
    commercialTermsBreakdown: 'The partner facilitates buyer inspection and site visits. Upon legal execution of the title deed/sales contract and initial deposit clearance, LUMO automatically disburses the TZS 2,900,000 deal bounty.',
    detailedDealFlow: 'A real estate developer defines the property baseline at TZS 120M. The system uses this baseline to calculate variable commissions. An independent property agent schedules a client site visit, unlocking the TZS 500,000 base fee upon verified physical check-in. When the land purchase contract is officially executed and the deposit is cleared, the remaining 2% commission (TZS 2.4M) transitions from pending to approved in the partner’s LUMO dashboard.',
    icon: '🏢',
  },
  'Sourcing & Supply Chain Services': {
    category: 'Sourcing & Supply Chain Services',
    archetype: 'Custom Sourcing Bounty / Reverse Procurement',
    modelId: 'CUSTOM_DEAL_TERMS',
    modelTitle: 'Custom Deal Terms',
    baselinePriceLabel: 'Contract & Sourcing Procurement Budget',
    defaultBaselinePriceTZS: 2080000000, // USD 800,000 equivalent
    baselineCurrency: 'USD',
    defaultRewardValueTZS: 13000000, // USD 5,000 equivalent
    defaultRewardPercent: 0,
    rewardCalculationSummary: 'Fixed USD 5,000 (approx. TZS 13,000,000) on USD 800,000 procurement requirement',
    defaultDisplayLabel: 'Procurement Budget: USD 800,000 | Sourcing Reward: USD 5,000',
    triggerPreset: 'per verified trade match & supply sign-off',
    practicalDealExample: 'A commercial firm posts a reverse requirement: "Source 50,000 Solar Panels with total budget USD 800,000."',
    commercialTermsBreakdown: 'The merchant allocates a fixed reward of USD 5,000 (TZS 13M). The partner submits the verified manufacturer credentials, certification documents, and contract agreement. Approved upon countersigned supply contract.',
    detailedDealFlow: 'A commercial firm posts a reverse requirement stating their total purchase budget of USD 800K for 50,000 solar units. A procurement consultant or trade partner connects the buyer with an accredited international manufacturer. Once the supplier’s trade licenses, pricing quote, and formal supply contract are verified through the LUMO Deal Room, the USD 5,000 sourcing bounty is approved for settlement.',
    icon: '🚢',
  },
  'Technology & Consumer Electronics': {
    category: 'Technology & Consumer Electronics',
    archetype: 'Percentage Share (%) + Volume Milestone Ladder',
    modelId: 'HYBRID_COMPENSATION',
    modelTitle: 'Percentage + Volume Bonus',
    baselinePriceLabel: 'Unit Retail Price',
    defaultBaselinePriceTZS: 1200000,
    baselineCurrency: 'TZS',
    defaultRewardValueTZS: 1500000,
    defaultRewardPercent: 5,
    rewardCalculationSummary: '5% base per unit (TZS 60,000/sale) + TZS 500,000 bonus at 25 units + TZS 1,500,000 bonus at 50 units',
    defaultDisplayLabel: 'Retail Price: TZS 1.2M | Earn 5% (TZS 60K/sale) + Up to TZS 2M in Bonuses',
    triggerPreset: 'on completed order total',
    practicalDealExample: 'An electronics distributor runs a seasonal push: "Sell 50 Laptops across Dar es Salaam at TZS 1.2M each."',
    commercialTermsBreakdown: 'Partners earn a standard 5% commission (TZS 60K) on every laptop sold, plus unlock tiered milestone bonuses: TZS 500,000 at 25 units sold, and an additional TZS 1,500,000 at 50 units sold.',
    detailedDealFlow: 'A tech merchant enters the per-unit retail price of TZS 1.2M and sets up a volume target of 50 laptops. Because the unit price is defined, LUMO automatically calculates that 50 units equal TZS 60M in Gross Merchandise Value (GMV). Affiliates and creators earn a direct TZS 60K on each purchase made via their tracking links, and when a partner reaches 25 verified unit sales, the engine automatically adds the TZS 500,000 milestone bonus to their approved balance.',
    icon: '💻',
  },
  'Farming, Agriculture & Food': {
    category: 'Farming, Agriculture & Food',
    archetype: 'B2B Sourcing / Volume Off-Take Bounty',
    modelId: 'CUSTOM_DEAL_TERMS',
    modelTitle: 'Custom Deal Terms',
    baselinePriceLabel: 'Minimum Order Value (MOV) / Deal Batch Value',
    defaultBaselinePriceTZS: 25000000,
    baselineCurrency: 'TZS',
    defaultRewardValueTZS: 750000,
    defaultRewardPercent: 0,
    rewardCalculationSummary: 'Fixed TZS 750,000 per fulfilled batch off-take contract',
    defaultDisplayLabel: 'Deal Batch Value: TZS 25,000,000 | Aggregator Bounty: TZS 750,000',
    triggerPreset: 'per verified delivery sign-off',
    practicalDealExample: 'A food processor seeks bulk supply: "10 Metric Tons of organic maize valued at TZS 25,000,000."',
    commercialTermsBreakdown: 'Aggregators and rural agents receive a TZS 750,000 sourcing reward once quality inspection passes and the off-take agreement is finalized and verified through LUMO.',
    detailedDealFlow: 'A grain processing plant publishes a requirement for raw commodities with a minimum contract value of TZS 25M. An agricultural broker connects rural farmer cooperatives to fulfill the batch. When the delivery arrives, quality inspection passes, and the off-take invoice is cleared, LUMO calculates platform fees and issues the TZS 750,000 partner payout.',
    icon: '🌾',
  },
  'Market Finder & Trade Insights': {
    category: 'Market Finder & Trade Insights',
    archetype: 'B2B / Sourcing (Matchmaking Bounty)',
    modelId: 'CUSTOM_DEAL_TERMS',
    modelTitle: 'Custom Deal Terms',
    baselinePriceLabel: 'Consignment Trade Value',
    defaultBaselinePriceTZS: 50000000,
    baselineCurrency: 'TZS',
    defaultRewardValueTZS: 50000,
    defaultRewardPercent: 0,
    rewardCalculationSummary: 'TZS 50,000 per verified pre-screened import/export trade match',
    defaultDisplayLabel: 'Trade Batch: TZS 50M | Match Reward: TZS 50,000 per Verified Buyer',
    triggerPreset: 'per verified trade match & purchase intent',
    practicalDealExample: 'An export firm seeks wholesale cashew buyers across East Africa for a TZS 50M consignment.',
    commercialTermsBreakdown: 'A partner earns TZS 50,000 for each verified import/export trade match that submits formal purchase intent with verified procurement capacity.',
    detailedDealFlow: 'An export firm seeks bulk buyers across East Africa for Tanzanian raw cashews. A trade partner earns TZS 50,000 for each pre-screened international buyer submitting formal procurement intent. Payout is released upon direct capacity verification in LUMO.',
    icon: '📊',
  },
  'Advertising, Media & Marketing': {
    category: 'Advertising, Media & Marketing',
    archetype: 'Creator Ad Deal (Hybrid: Base Fee + Commission)',
    modelId: 'HYBRID_COMPENSATION',
    modelTitle: 'Hybrid (Base + %)',
    baselinePriceLabel: 'Campaign Projected Sales Target',
    defaultBaselinePriceTZS: 8000000,
    baselineCurrency: 'TZS',
    defaultRewardValueTZS: 400000,
    defaultRewardPercent: 5,
    rewardCalculationSummary: 'TZS 400,000 guaranteed base + 5% sales commission + TZS 1,000,000 bonus at 50 sales',
    defaultDisplayLabel: 'Campaign Base: TZS 400,000 + 5% Commission (Up to TZS 1.4M Total)',
    triggerPreset: 'per verified completion & content approval',
    practicalDealExample: 'A retail brand launches an awareness campaign recruiting 20 creators to produce video content.',
    commercialTermsBreakdown: 'Guaranteed base fee of TZS 400,000 upon content approval + 5% commission on attributable sales + TZS 1M bonus at 50 sales.',
    detailedDealFlow: 'A retail brand recruits 20 creators to produce video campaigns. Creators earn a guaranteed base fee of TZS 400,000 upon content approval, plus a 5% commission on all attributable sales generated through their tracking link, with a TZS 1,000,000 performance bonus unlocked after 50 verified sales.',
    icon: '🎬',
  },
  'IT & Software Services': {
    category: 'IT & Software Services',
    archetype: 'Lead Generation (Cost Per Lead / CPA)',
    modelId: 'COST_PER_LEAD',
    modelTitle: 'Cost Per Lead (CPL)',
    baselinePriceLabel: 'Annual License / Subscription Value',
    defaultBaselinePriceTZS: 1200000,
    baselineCurrency: 'TZS',
    defaultRewardValueTZS: 20000,
    defaultRewardPercent: 0,
    rewardCalculationSummary: 'TZS 20,000 per qualified demo + TZS 200,000 bonus on converted annual subscription',
    defaultDisplayLabel: 'License Value: TZS 1.2M | Lead Bounty: TZS 20,000 (Demo) + TZS 200K (Paid Sub)',
    triggerPreset: 'per qualified customer demo',
    practicalDealExample: 'A B2B SaaS platform acquires local retail shops for inventory management software.',
    commercialTermsBreakdown: 'TZS 20,000 awarded for every business attending an onboarding demo + TZS 200,000 milestone bonus upon paid subscription conversion.',
    detailedDealFlow: 'A B2B SaaS platform acquires retail shops for cloud inventory software. TZS 20,000 is awarded for every business that attends an onboarding demo, with a bonus milestone of TZS 200,000 when that referred shop converts to a paid annual subscription.',
    icon: '🎯',
  },
  'Gaming, Toys & Entertainment': {
    category: 'Gaming, Toys & Entertainment',
    archetype: 'Creator Ad Deal (Hybrid: Base + Performance)',
    modelId: 'HYBRID_COMPENSATION',
    modelTitle: 'Hybrid (Base + %)',
    baselinePriceLabel: 'Campaign Sponsorship & Merch Pool',
    defaultBaselinePriceTZS: 2500000,
    baselineCurrency: 'TZS',
    defaultRewardValueTZS: 250000,
    defaultRewardPercent: 10,
    rewardCalculationSummary: 'TZS 250,000 flat live stream fee + 10% in-app/ticket purchase revenue share',
    defaultDisplayLabel: 'Stream Base: TZS 250,000 + 10% In-App Purchase Share',
    triggerPreset: 'per verified stream & promo completion',
    practicalDealExample: 'An esports tournament organizer seeks streamers to review hardware and drive event registrations.',
    commercialTermsBreakdown: 'Streamer receives flat TZS 250,000 fee for live stream and earns 10% on digital tickets and merch orders tracked via creator code.',
    detailedDealFlow: 'A gaming studio seeks streamers to review hardware and drive event registrations. The streamer receives a flat TZS 250,000 fee for a dedicated live stream and earns a recurring 10% cut on all digital tickets or merch orders tracked through their unique creator promo code.',
    icon: '🎮',
  },
  'Apparel & Fashion': {
    category: 'Apparel & Fashion',
    archetype: 'Creator Ad Deal / Affiliate Programme',
    modelId: 'PERCENTAGE_COMMISSION',
    modelTitle: 'Percentage Share (%)',
    baselinePriceLabel: 'Average Order Value (AOV)',
    defaultBaselinePriceTZS: 150000,
    baselineCurrency: 'TZS',
    defaultRewardValueTZS: 0,
    defaultRewardPercent: 7,
    rewardCalculationSummary: '7% baseline sales commission (escalating to 10% on exceeding TZS 5M monthly revenue)',
    defaultDisplayLabel: 'Basket AOV: TZS 150,000 | Earn 7% - 10% Commission + Monthly Tier Bonus',
    triggerPreset: 'on completed order total',
    practicalDealExample: 'A boutique clothing brand builds an ongoing brand ambassador network.',
    commercialTermsBreakdown: 'Partners curate digital storefronts and receive 7% commission on checkout totals with 30-day attribution, escalating to 10% on high volume.',
    detailedDealFlow: 'A boutique clothing brand builds an ambassador network. Partners curate digital storefronts and receive 7% commission on checkout totals with a 30-day attribution window, escalating to 10% once monthly gross sales surpass TZS 5,000,000.',
    icon: '👗',
  },
  'Industrial Machinery & Tools': {
    category: 'Industrial Machinery & Tools',
    archetype: 'High-Ticket Sales (Fixed Cash Bounty)',
    modelId: 'FIXED_REWARD',
    modelTitle: 'Fixed Cash Bounty',
    baselinePriceLabel: 'Equipment Valuation / Machine Price',
    defaultBaselinePriceTZS: 85000000,
    baselineCurrency: 'TZS',
    defaultRewardValueTZS: 1500000,
    defaultRewardPercent: 1.76,
    rewardCalculationSummary: 'Fixed TZS 1,500,000 closing bounty (approx 1.76% of machine selling price)',
    defaultDisplayLabel: 'Equipment Price: TZS 85,000,000 | Closing Bounty: TZS 1,500,000',
    triggerPreset: 'per signed dealer contract & delivery',
    practicalDealExample: 'A heavy equipment vendor promotes commercial generators, backhoes, and packaging machinery.',
    commercialTermsBreakdown: 'Sales partners refer commercial contractors; upon invoice settlement and delivery acceptance, the TZS 1,500,000 bounty is released.',
    detailedDealFlow: 'A heavy equipment vendor promotes commercial generators and backhoes. Sales partners refer commercial contractors; upon verification of invoice payment and signed delivery acceptance, the TZS 1,500,000 reward transitions from pending to payable.',
    icon: '⚙️',
  },
  'General & Professional Services': {
    category: 'General & Professional Services',
    archetype: 'B2B / Sourcing (Retainer Referral)',
    modelId: 'CUSTOM_DEAL_TERMS',
    modelTitle: 'Custom Deal Terms',
    baselinePriceLabel: 'Annual Corporate Retainer Value',
    defaultBaselinePriceTZS: 10000000,
    baselineCurrency: 'TZS',
    defaultRewardValueTZS: 300000,
    defaultRewardPercent: 3,
    rewardCalculationSummary: 'Fixed TZS 300,000 referral fee or agreed 3% contract bonus',
    defaultDisplayLabel: 'Retainer: TZS 10,000,000 | Referral Reward: TZS 300,000',
    triggerPreset: 'per verified contract sign-off',
    practicalDealExample: 'A legal or corporate consulting firm looks for corporate retainers.',
    commercialTermsBreakdown: 'Business consultant introduces a corporate client; when the client signs an annual retainer, a one-off TZS 300,000 fee is awarded.',
    detailedDealFlow: 'A corporate consulting firm looks for corporate retainers. A business consultant introduces a client; when the client signs an annual retainer, the partner is awarded a one-off TZS 300,000 introduction fee or an agreed recurring percentage.',
    icon: '⚖️',
  },
  'Health & Personal Care': {
    category: 'Health & Personal Care',
    archetype: 'Creator Ad Deal / Affiliate',
    modelId: 'HYBRID_COMPENSATION',
    modelTitle: 'Hybrid (Base + %)',
    baselinePriceLabel: 'Product Bundle / Basket Price',
    defaultBaselinePriceTZS: 80000,
    baselineCurrency: 'TZS',
    defaultRewardValueTZS: 150000,
    defaultRewardPercent: 8,
    rewardCalculationSummary: 'TZS 150,000 video production fee + 8% sales commission on tracked conversions',
    defaultDisplayLabel: 'Product Price: TZS 80,000 | Creator Base: TZS 150K + 8% Commission',
    triggerPreset: 'on completed order total',
    practicalDealExample: 'A skincare and wellness brand promotes an organic cosmetics line across social channels.',
    commercialTermsBreakdown: 'Beauty creators earn TZS 150,000 per approved product review video and 8% commission on tracked conversions.',
    detailedDealFlow: 'A skincare and wellness brand promotes an organic cosmetics line. Beauty creators earn TZS 150,000 per approved product review video and a continuous 8% commission on tracked conversions, subject to return and cancellation verification.',
    icon: '🌿',
  },
  'Home & Garden': {
    category: 'Home & Garden',
    archetype: 'Affiliate / Performance Deals Ladder',
    modelId: 'PERCENTAGE_COMMISSION',
    modelTitle: 'Percentage Share (%)',
    baselinePriceLabel: 'Interior Package Price',
    defaultBaselinePriceTZS: 5000000,
    baselineCurrency: 'TZS',
    defaultRewardValueTZS: 300000,
    defaultRewardPercent: 6,
    rewardCalculationSummary: '6% base commission (TZS 300,000/package) + TZS 300,000 bonus at 25 orders',
    defaultDisplayLabel: 'Package Price: TZS 5M | Earn 6% (TZS 300K/sale) + TZS 300K Volume Bonus',
    triggerPreset: 'on completed order total',
    practicalDealExample: 'A home decor and furniture retailer drives bulk interior package sales.',
    commercialTermsBreakdown: 'Interior designers and affiliates earn 6% on every verified order, with an automated TZS 300,000 cash bonus triggered at 25 orders.',
    detailedDealFlow: 'A furniture retailer drives bulk interior package sales. Interior designers and affiliates earn 6% on every verified order, with an automated TZS 300,000 cash bonus triggered when their attributed monthly sales hit 25 orders.',
    icon: '🏡',
  },
}

export function CreateOpportunityWizardModal({
  isOpen,
  onClose,
  onOpportunityCreated,
}: CreateOpportunityWizardModalProps) {
  const { showToast } = useBusinessToast()

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [previewDevice, setPreviewDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP')
  const [previewMediaMode, setPreviewMediaMode] = useState<'IMAGE' | 'VIDEO'>('IMAGE')
  const [mediaUploadTab, setMediaUploadTab] = useState<'UPLOAD' | 'PRESET' | 'URL'>('PRESET')

  // Region dropdown state
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false)
  const [regionSearchQuery, setRegionSearchQuery] = useState('')
  const regionDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setIsRegionDropdownOpen(false)
      }
    }
    if (isRegionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isRegionDropdownOpen])

const OPPORTUNITY_MODEL_DEFAULTS: Record<
  OpportunityType,
  {
    titlePlaceholder: string
    summaryPlaceholder: string
    badge: string
    description: string
    icon: string
  }
> = {
  ADVERTISING_CAMPAIGN: {
    titlePlaceholder: 'e.g., Q3 Product Launch: 50 TikTok & Instagram Creators Needed',
    summaryPlaceholder: '1-2 sentences stating the media deliverable, base creation fee, and performance bonus structure.',
    badge: 'Creator / Influencer Push',
    description: 'Recruit content creators across TikTok, Instagram, YouTube Shorts, and WhatsApp to publish sponsored media.',
    icon: '🎬',
  },
  COMMERCIAL_DEAL: {
    titlePlaceholder: 'e.g., Sell 50 Commercial Laptop Units — Dar es Salaam Push',
    summaryPlaceholder: 'Direct sales incentive offering 5% base commission per unit plus tiered volume bonuses up to TZS 4M.',
    badge: 'Direct Inventory Sales',
    description: 'Allocate physical inventory units with dedicated unit margins and tiered volume bonuses.',
    icon: '📦',
  },
  LEAD_GENERATION: {
    titlePlaceholder: 'e.g., SME Inventory & Accounting Software Demo Leads',
    summaryPlaceholder: 'Earn TZS 20,000 per verified, attended software demo and an upgraded bonus of TZS 200,000 on closed contracts.',
    badge: 'B2B & SME Client Acquisition',
    description: 'Pay partners for pre-qualified decision-maker meetings, verified software demos, and SME registrations.',
    icon: '🎯',
  },
  B2B_INTRODUCTION: {
    titlePlaceholder: 'e.g., Regional Solar Microgrid Distributor Wanted — Mwanza',
    summaryPlaceholder: 'TZS 3,000,000 bounty awarded upon verified signing and initial procurement order with a licensed distributor.',
    badge: 'Distributor / Corporate Bounty',
    description: 'Bounty awarded to trade consultants and brokers for facilitating signed corporate off-take or distribution agreements.',
    icon: '🤝',
  },
  PRODUCT_OPPORTUNITY: {
    titlePlaceholder: 'e.g., Toyota Land Cruiser V8 / Prime Beachfront Plot',
    summaryPlaceholder: 'High-ticket listing enabled for "Buy Now" or "Find Buyer & Earn TZS 2,000,000" closing bounty.',
    badge: 'High-Ticket "Find Buyer & Earn"',
    description: 'High-value asset listing featuring dual customer paths: "Buy Now" or "Find Buyer & Earn Closing Bounty".',
    icon: '💎',
  },
  REVERSE_OPPORTUNITY: {
    titlePlaceholder: 'e.g., Sourcing Requirement: 50,000 Solar Panels for Commercial Farm',
    summaryPlaceholder: 'Looking for trade agents to source certified tier-1 manufacturers. USD 5,000 bounty paid on verified contract execution.',
    badge: 'Procurement / "Find This For Us"',
    description: 'Post specific corporate sourcing tenders and import budgets with fixed finder bounties.',
    icon: '🚢',
  },
  CUSTOMER_ACQUISITION: {
    titlePlaceholder: 'e.g., Retail Merchant Mobile App Registration & First Deposit',
    summaryPlaceholder: 'Earn TZS 15,000 per verified user registration with an additional TZS 500,000 milestone bonus every 100 users.',
    badge: 'CPA App / User Onboarding',
    description: 'Pay-per-verified user registration or mobile app activation with deposit or KYC thresholds.',
    icon: '📱',
  },
  AFFILIATE_PROGRAMME: {
    titlePlaceholder: 'e.g., Official ABC Electronics Partner Programme',
    summaryPlaceholder: 'Ongoing affiliate program offering baseline 7% across our full catalog with monthly mobile money and bank settlements.',
    badge: 'Always-On Merchant Catalog',
    description: 'Continuous catalog referral program with multi-channel attribution and recurring monthly payouts.',
    icon: '🔗',
  },
}

  const initialCat = 'Automotive & Transportation'
  const initialConf = CATEGORY_REWARD_CONFIG[initialCat]

  // Wizard Form State
  const [formData, setFormData] = useState({
    // Step 1: Type
    type: 'COMMERCIAL_DEAL' as OpportunityType,

    // Step 2: Basic Details & Media Assets
    title: '',
    publicSummary: '',
    subscriberDescription: '',
    category: initialCat,
    region: 'Dar es Salaam',
    selectedRegions: ['Dar es Salaam'] as string[],
    subcategory: '',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    partnersRequired: 50,
    eligibility: 'Open to verified Sales Agents, Affiliates, and Community Leaders.',

    // Step 2: Specialized Dynamic Model Fields
    // 1. Advertising Campaign
    targetDeliverableChannels: ['TikTok Video', 'Instagram Reel'] as string[],
    minCreatorFollowers: 10000,
    creatorTargetRegion: 'Tanzania / East Africa',
    creativeBriefText: '',

    // 2. Commercial Deal
    baselineUnitPriceTZS: 1200000,
    inventoryAllocationUnits: 50,
    warrantySpecDocName: 'Commercial_Spec_Sheet_v2026.pdf',

    // 3. Lead Generation
    leadQualificationCriteria: ['Verified Business Name', 'Active Phone / WhatsApp', 'Registered Taxpayer / SME'] as string[],
    targetIndustryNiche: 'Retail & POS',

    // 4. B2B Introduction
    dealValuationBudgetTZS: 100000000,
    partnerEligibilityRoles: ['Corporate Consultants', 'Trade Brokers', 'Business Networks'] as string[],

    // 5. Product Opportunity (High-Ticket)
    assetListingPriceTZS: 180000000,
    inspectionLocation: 'Dar es Salaam, Masaki Showroom / Plot Coordinates',

    // 6. Reverse Opportunity
    totalSourcingBudget: 'USD 800,000',
    deliveryTimelineDestination: 'Dar es Salaam Port — Within 60 Days',

    // 7. Customer Acquisition
    targetAcquisitionGoal: 1000,
    verificationTriggerCondition: 'KYC Approved + Minimum Deposit TZS 10,000',

    // 8. Affiliate Programme
    affiliateAttributionWindow: '30 Days Cookie / First-Party Tracking',
    distributionChannels: ['Partner Storefronts', 'WhatsApp Links', 'Promo Codes'] as string[],

    // Media & Video
    coverImageUrl: PRESET_COVER_IMAGES[0].url,
    promoVideoUrl: '',
    galleryImageUrls: [] as string[],
    marketingAssets: [
      { id: 'ast_1', name: 'Product_Brochure_Tanzania_2026.pdf', url: '#', size: '2.4 MB', type: 'PDF' as const },
    ],

    // Step 3: Commercial Result
    commercialResult: 'COMPLETED_SALE' as CommercialResultType,

    // Step 4: Reward Structure & Customization
    rewardStructure: initialConf.modelId,
    baselinePriceTZS: initialConf.defaultBaselinePriceTZS,
    baselineCurrency: initialConf.baselineCurrency,
    rewardValueTZS: initialConf.defaultRewardValueTZS,
    rewardPercent: initialConf.defaultRewardPercent,
    customRewardDisplay: '',
    customRewardDetail: initialConf.triggerPreset,
    customFormulaDescription: initialConf.detailedDealFlow,

    // Step 5: Tracking Method
    trackingMethod: 'QR_CODE' as TrackingMethod,

    // Step 6: Funding & Payment
    estimatedBudgetTZS: 25000000,
    maxCommittedAmountTZS: 25000000,
    payoutSchedule: 'WEEKLY_FRIDAY',
    refundReversalConditions: '7-day customer cooling off period applies before payout settlement.',

    // Step 7: Terms & Evidence
    partnerDeliverables: 'Verified installation with customer National ID (NIDA) copy and first STK installment payment.',
    evidenceRequired: 'Installation contract reference and technician activation code.',
    attributionWindowDays: 30,
    cancellationTerms: 'Standard LUMO Deal Room commercial terms apply.',
    disputeProcedure: 'Platform mediation through LUMO disputes resolution board within 14 days.',

    // Step 8: Declarations
    confirmAccurate: false,
    confirmFundingReady: false,
    confirmNoSilentChanges: false,
  })

  if (!isOpen) return null

  const stepsList = [
    { num: 1, title: 'Opportunity Type' },
    { num: 2, title: 'Details & Media' },
    { num: 3, title: 'Commercial Result' },
    { num: 4, title: 'Reward Structure' },
    { num: 5, title: 'Preview & Submit' },
  ]

  const currentCategoryConfig: CategoryRewardConfig =
    CATEGORY_REWARD_CONFIG[formData.category] || CATEGORY_REWARD_CONFIG['Automotive & Transportation']

  const computedAutoRewardDisplay = (() => {
    if (formData.rewardStructure === currentCategoryConfig.modelId) {
      if (
        formData.rewardValueTZS === currentCategoryConfig.defaultRewardValueTZS &&
        formData.baselinePriceTZS === currentCategoryConfig.defaultBaselinePriceTZS &&
        (formData.rewardPercent === currentCategoryConfig.defaultRewardPercent ||
          currentCategoryConfig.defaultRewardPercent === 0)
      ) {
        return currentCategoryConfig.defaultDisplayLabel
      }
      if (formData.category === 'Automotive & Transportation') {
        return `Asset Price: TZS ${formData.baselinePriceTZS.toLocaleString()} | Finder Bounty: TZS ${formData.rewardValueTZS.toLocaleString()}`
      }
      if (formData.category === 'Real Estate & Property') {
        const total = formData.rewardValueTZS + Math.round((formData.baselinePriceTZS * formData.rewardPercent) / 100)
        return `Listing Price: TZS ${(formData.baselinePriceTZS / 1000000).toFixed(0)}M | Total Max Earning: TZS ${total.toLocaleString()}`
      }
      if (formData.category === 'Technology & Consumer Electronics') {
        const perUnit = Math.round((formData.baselinePriceTZS * formData.rewardPercent) / 100)
        return `Retail Price: TZS ${(formData.baselinePriceTZS / 1000000).toFixed(1)}M | Earn ${formData.rewardPercent}% (TZS ${(perUnit / 1000).toFixed(0)}K/sale) + Bonuses`
      }
      if (formData.category === 'Farming, Agriculture & Food') {
        return `Deal Batch Value: TZS ${formData.baselinePriceTZS.toLocaleString()} | Aggregator Bounty: TZS ${formData.rewardValueTZS.toLocaleString()}`
      }
      if (formData.category === 'Sourcing & Supply Chain Services') {
        return `Procurement Budget: USD 800,000 | Sourcing Reward: USD 5,000`
      }
      if (formData.rewardStructure === 'CUSTOM_DEAL_TERMS' || formData.rewardStructure === 'FIXED_REWARD') {
        return currentCategoryConfig.defaultDisplayLabel.replace(/\b[\d,]+/, formData.rewardValueTZS.toLocaleString())
      }
      if (formData.rewardStructure === 'COST_PER_LEAD') {
        return `License: TZS ${(formData.baselinePriceTZS / 1000000).toFixed(1)}M | Lead Bounty: TZS ${formData.rewardValueTZS.toLocaleString()}`
      }
      if (formData.rewardStructure === 'HYBRID_COMPENSATION') {
        return `Base: TZS ${formData.rewardValueTZS.toLocaleString()} + ${formData.rewardPercent}% Sales Commission`
      }
      if (formData.rewardStructure === 'PERCENTAGE_COMMISSION') {
        return `${formData.rewardPercent}% Sales Commission`
      }
    }
    if (formData.rewardStructure === 'CUSTOM_DEAL_TERMS') {
      return `TZS ${formData.rewardValueTZS.toLocaleString()} Sourcing / Distributor Reward`
    }
    if (formData.rewardStructure === 'HYBRID_COMPENSATION') {
      return `TZS ${formData.rewardValueTZS.toLocaleString()} Base + ${formData.rewardPercent}% Sales Commission`
    }
    if (formData.rewardStructure === 'COST_PER_LEAD') {
      return `TZS ${formData.rewardValueTZS.toLocaleString()} per Qualified SME Lead`
    }
    if (formData.rewardStructure === 'FIXED_REWARD') {
      return `TZS ${formData.rewardValueTZS.toLocaleString()} Deal Closing Reward`
    }
    if (formData.rewardStructure === 'PERCENTAGE_COMMISSION') {
      return `${formData.rewardPercent}% Sales Commission`
    }
    if (formData.rewardStructure === 'MILESTONE_BONUS') {
      return `TZS ${formData.rewardValueTZS.toLocaleString()} + Volume Bonus`
    }
    return `TZS ${formData.rewardValueTZS.toLocaleString()}`
  })()

  const computedAutoRewardDetail = (() => {
    if (formData.rewardStructure === currentCategoryConfig.modelId) {
      return currentCategoryConfig.triggerPreset
    }
    if (formData.rewardStructure === 'COST_PER_LEAD') return 'per qualified customer demo'
    if (formData.rewardStructure === 'FIXED_REWARD') return 'per signed dealer contract'
    if (formData.rewardStructure === 'PERCENTAGE_COMMISSION') return 'on completed order total'
    return 'per verified completion'
  })()

  const effectiveRewardDisplay = formData.customRewardDisplay.trim() || computedAutoRewardDisplay
  const effectiveRewardDetail = formData.customRewardDetail.trim() || computedAutoRewardDetail
  const videoInfo = getVideoEmbedInfo(formData.promoVideoUrl)

  const handleNext = () => {
    if (currentStep === 2 && !formData.title.trim()) {
      showToast('error', 'Validation Error', 'Opportunity title is required to continue.')
      return
    }
    if (currentStep < stepsList.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle local file upload for cover image
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setFormData({ ...formData, coverImageUrl: result })
        showToast('success', 'Image Uploaded', `${file.name} imported as featured banner.`)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle local file upload for gallery images
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const fileList = Array.from(files)
      fileList.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result as string
          setFormData((prev) => ({
            ...prev,
            galleryImageUrls: [...prev.galleryImageUrls, result],
          }))
        }
        reader.readAsDataURL(file)
      })
      showToast('success', 'Gallery Images Added', `${fileList.length} photos added to opportunity carousel.`)
    }
  }

  // Handle local file upload for video
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setFormData({ ...formData, promoVideoUrl: result })
        showToast('success', 'Video Attached', `${file.name} imported as promotional video.`)
      }
      reader.readAsDataURL(file)
    }
  }


  const handleSubmitToLumo = () => {
    if (!formData.confirmAccurate || !formData.confirmNoSilentChanges) {
      showToast('error', 'Declaration Required', 'Please confirm all compliance declarations before submitting to LUMO.')
      return
    }

    const created: BusinessOpportunityItem = {
      id: `opp_${Date.now()}`,
      slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
      title: formData.title,
      publicSummary: formData.publicSummary || 'Earn rewards by connecting customers to verified products and services.',
      subscriberDescription: formData.subscriberDescription || formData.publicSummary,
      type: formData.type,
      category: formData.category,
      region: formData.region,
      commercialResult: formData.commercialResult,
      rewardStructure: formData.rewardStructure,
      rewardValueTZS: Number(formData.rewardValueTZS),
      rewardPercent: Number(formData.rewardPercent),
      customRewardDisplay: effectiveRewardDisplay,
      customRewardDetail: effectiveRewardDetail,
      customFormulaDescription: formData.customFormulaDescription,
      budgetTZS: Number(formData.estimatedBudgetTZS),
      spentTZS: 0,
      status: 'SUBMITTED',
      version: 1,
      activePartners: 0,
      totalConversions: 0,
      trackingMethod: formData.trackingMethod,
      startDate: formData.startDate,
      endDate: formData.endDate,
      attributionWindowDays: Number(formData.attributionWindowDays),
      partnerDeliverables: formData.partnerDeliverables,
      evidenceRequired: formData.evidenceRequired,
      cancellationTerms: formData.cancellationTerms,
      coverImageUrl: formData.coverImageUrl,
      promoVideoUrl: formData.promoVideoUrl,
      galleryImageUrls: formData.galleryImageUrls,
      marketingAssets: formData.marketingAssets,
      createdAt: 'Today',
    }

    createDealOpportunity(
      {
        title: formData.title,
        opportunityType: (formData.type as any) || 'CUSTOMER_ACQUISITION',
        category: formData.category || 'Renewable Energy',
        subcategory: formData.subcategory || undefined,
        summary: formData.publicSummary || formData.title,
        description: formData.subscriberDescription || formData.publicSummary || formData.title,
        rewardType:
          formData.rewardStructure === 'PERCENTAGE_COMMISSION'
            ? 'PERCENTAGE_COMMISSION'
            : formData.rewardStructure === 'CUSTOM_DEAL_TERMS'
            ? 'CUSTOM_DEAL_TERMS'
            : formData.rewardStructure === 'HYBRID_COMPENSATION'
            ? 'HYBRID'
            : formData.rewardStructure === 'MILESTONE_BONUS'
            ? 'MILESTONE_BONUS'
            : 'COST_PER_ACQUISITION',
        baseRewardValue: Number(formData.rewardValueTZS) || 50000,
        currency: 'TZS',
        customRewardDisplay: effectiveRewardDisplay,
        customRewardDetail: effectiveRewardDetail,
        customFormulaDescription: formData.customFormulaDescription,
        attributionWindowDays: Number(formData.attributionWindowDays) || 30,
        percentageBps: Number(formData.rewardPercent) ? Number(formData.rewardPercent) * 100 : undefined,
        totalBudgetTZS: Number(formData.estimatedBudgetTZS) || 10000000,
        maxPartners: 50,
        region: formData.region || 'All Tanzania',
        termsAndConditions: formData.cancellationTerms || 'Reward is validated upon delivery note and verification.',
        requiresApproval: true,
        featuredImageUrl: formData.coverImageUrl,
        promoVideoUrl: formData.promoVideoUrl,
      },
      'org_current',
      formData.title ? 'Verified Business Ltd' : 'My Business Ltd',
      'PENDING_REVIEW'
    )

    onOpportunityCreated(created)
    onClose()
    showToast(
      'success',
      'Opportunity Submitted to LUMO Review',
      `"${created.title}" with rich media assets is now in the Admin Maker-Checker review queue.`
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[94vh] flex flex-col justify-between overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-[#FF6A00] flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Create Commercial Opportunity & Import Media
              </h2>
              <div className="text-xs text-slate-500">
                Step {currentStep} of {stepsList.length}: <strong className="text-[#FF6A00]">{stepsList[currentStep - 1]?.title}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center gap-1.5 py-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar shrink-0">
          {stepsList.map((st) => (
            <button
              key={st.num}
              onClick={() => {
                if (st.num < currentStep) setCurrentStep(st.num)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentStep === st.num
                  ? 'bg-[#FF6A00] text-white shadow-xs'
                  : currentStep > st.num
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}
            >
              <span>{st.num}. {st.title}</span>
              {currentStep > st.num && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </button>
          ))}
        </div>

        {/* Step Body Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
          {/* STEP 1: OPPORTUNITY TYPE */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Select Opportunity Category & Commercial Model
              </h3>
              <p className="text-slate-500 text-xs">
                Choose the model that best matches how Partners will generate value for your business.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'COMMERCIAL_DEAL', title: 'Commercial Deal', desc: 'Direct product or service sales deal.' },
                  { id: 'ADVERTISING_CAMPAIGN', title: 'Advertising Campaign', desc: 'Paid creator promotion and sponsored posts.' },
                  { id: 'AFFILIATE_PROGRAMME', title: 'Affiliate Programme', desc: 'Recurring link or promo code referral system.' },
                  { id: 'CUSTOMER_ACQUISITION', title: 'Customer Acquisition', desc: 'Pay-per-new verified customer or account activation.' },
                  { id: 'LEAD_GENERATION', title: 'Lead Generation', desc: 'Pay for verified inquiries and phone screenings.' },
                  { id: 'B2B_INTRODUCTION', title: 'B2B Introduction', desc: 'Corporate match, distributor, or procurement bounty.' },
                  { id: 'PRODUCT_OPPORTUNITY', title: 'Product Opportunity', desc: 'Physical product sample distribution and feedback.' },
                  { id: 'REVERSE_OPPORTUNITY', title: 'Reverse Opportunity', desc: 'Bounty posted to source a specific requested asset.' },
                ].map((t) => {
                  const meta = OPPORTUNITY_MODEL_DEFAULTS[t.id as OpportunityType]
                  return (
                    <button
                      key={t.id}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          type: t.id as OpportunityType,
                        }))
                      }
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        formData.type === t.id
                          ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/30 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta?.icon || '💼'}</span>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white">{t.title}</div>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">{t.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 2: BASIC DETAILS & MEDIA IMPORT */}
          {currentStep === 2 && (() => {
            const activeModelMeta = OPPORTUNITY_MODEL_DEFAULTS[formData.type] || OPPORTUNITY_MODEL_DEFAULTS.COMMERCIAL_DEAL
            return (
              <div className="space-y-4">
                <div>
                  <label className="font-bold block mb-1">Opportunity Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder={activeModelMeta.titlePlaceholder}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                  />
                </div>

                {/* DYNAMIC MODEL-SPECIFIC REQUIREMENTS (ADAPTIVE STEP 2) */}
                <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-br from-orange-50/70 via-white to-purple-50/40 dark:from-slate-800/90 dark:via-slate-900 dark:to-slate-800/90 border border-orange-200/80 dark:border-slate-700 shadow-xs space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-orange-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{activeModelMeta.icon}</span>
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          {activeModelMeta.badge} Specific Requirements
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {activeModelMeta.description}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-orange-100 dark:bg-orange-950/80 text-[#FF6A00] font-black px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto shrink-0 border border-orange-200 dark:border-orange-900/60">
                      Model: {formData.type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* 1. ADVERTISING CAMPAIGN (Creator / Influencer Push) */}
                  {formData.type === 'ADVERTISING_CAMPAIGN' && (
                    <div className="space-y-3 pt-1 text-xs">
                      <div>
                        <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                          Target Channels / Deliverables <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {['TikTok Video', 'Instagram Reel', 'YouTube Shorts', 'WhatsApp Status'].map((channel) => {
                            const isChecked = formData.targetDeliverableChannels.includes(channel)
                            return (
                              <button
                                key={channel}
                                type="button"
                                onClick={() => {
                                  const updated = isChecked
                                    ? formData.targetDeliverableChannels.filter((c) => c !== channel)
                                    : [...formData.targetDeliverableChannels, channel]
                                  setFormData({ ...formData, targetDeliverableChannels: updated })
                                }}
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-[#FF6A00] text-white border-[#FF6A00] shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <span className="font-bold text-xs">{channel}</span>
                                {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                            Creator Audience Criteria (Min Followers)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formData.minCreatorFollowers}
                              onChange={(e) => setFormData({ ...formData, minCreatorFollowers: Number(e.target.value) })}
                              placeholder="e.g. 10000"
                              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">Followers</span>
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                            Creator Region / Audience Location
                          </label>
                          <input
                            type="text"
                            value={formData.creatorTargetRegion}
                            onChange={(e) => setFormData({ ...formData, creatorTargetRegion: e.target.value })}
                            placeholder="e.g. Tanzania / East Africa"
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div className="pt-1">
                        <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                          Creative Brief & Key Talking Points Outline
                        </label>
                        <textarea
                          rows={2}
                          value={formData.creativeBriefText}
                          onChange={(e) => setFormData({ ...formData, creativeBriefText: e.target.value })}
                          placeholder="Detail the hook, core talking points, product benefit, and mandatory call-to-action for creators..."
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. COMMERCIAL DEAL (Direct Product / Inventory Sales) */}
                  {formData.type === 'COMMERCIAL_DEAL' && (
                    <div className="space-y-3 pt-1 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                            Baseline Unit Price / Deal Value (TZS) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formData.baselineUnitPriceTZS}
                              onChange={(e) => setFormData({ ...formData, baselineUnitPriceTZS: Number(e.target.value) })}
                              placeholder="1200000"
                              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-black text-[#FF6A00] text-xs"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">per unit</span>
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                            Inventory Allocation Total <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formData.inventoryAllocationUnits}
                              onChange={(e) => setFormData({ ...formData, inventoryAllocationUnits: Number(e.target.value) })}
                              placeholder="50"
                              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">Units Allocated</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-emerald-900 dark:text-emerald-200">
                        <span className="font-bold flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span>Total Projected Deal Pipeline (GMV):</span>
                        </span>
                        <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-300">
                          TZS {(formData.baselineUnitPriceTZS * formData.inventoryAllocationUnits).toLocaleString()}
                        </span>
                      </div>

                      <div className="pt-1">
                        <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                          Warranty & Technical Spec Sheet Attachment
                        </label>
                        <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <Paperclip className="w-4 h-4 text-[#FF6A00] shrink-0" />
                          <span className="font-mono text-slate-700 dark:text-slate-300 text-xs truncate flex-1">
                            {formData.warrantySpecDocName || 'Commercial_Spec_Sheet_v2026.pdf'}
                          </span>
                          <label className="text-[11px] font-bold text-[#FF6A00] hover:underline cursor-pointer">
                            <span>Replace File</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setFormData({ ...formData, warrantySpecDocName: file.name })
                                  showToast('success', 'Document Attached', `${file.name} uploaded as spec sheet.`)
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. LEAD GENERATION (B2B & SME Client Acquisition) */}
                  {formData.type === 'LEAD_GENERATION' && (
                    <div className="space-y-3 pt-1 text-xs">
                      <div>
                        <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                          Lead Qualification Criteria (Must Satisfy to Earn Bounty) <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            'Verified Business Name',
                            'Active Phone / WhatsApp',
                            'Registered Taxpayer / SME',
                            'Key Decision Maker Contacted',
                            'Attended Software Demo',
                          ].map((crit) => {
                            const isChecked = formData.leadQualificationCriteria.includes(crit)
                            return (
                              <button
                                key={crit}
                                type="button"
                                onClick={() => {
                                  const updated = isChecked
                                    ? formData.leadQualificationCriteria.filter((c) => c !== crit)
                                    : [...formData.leadQualificationCriteria, crit]
                                  setFormData({ ...formData, leadQualificationCriteria: updated })
                                }}
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-[#FF6A00] text-white border-[#FF6A00] shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <span className="font-bold text-xs">{crit}</span>
                                {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="pt-1">
                        <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                          Target Industry / Business Niche
                        </label>
                        <select
                          value={formData.targetIndustryNiche}
                          onChange={(e) => setFormData({ ...formData, targetIndustryNiche: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs cursor-pointer"
                        >
                          <option value="Retail & POS">Retail, Supermarkets & POS Systems</option>
                          <option value="FMCG & Distribution">FMCG & Wholesale Distribution</option>
                          <option value="Hardware & Construction">Hardware, Construction & Industrial Supplies</option>
                          <option value="Hospitality & Tourism">Hospitality, Hotels & Restaurants</option>
                          <option value="Healthcare & Pharmacy">Healthcare & Pharmaceuticals</option>
                          <option value="Professional Services">Professional & Financial Services</option>
                          <option value="AgriProcessing">Agri-Processing & Food Manufacturing</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 4. B2B INTRODUCTION (Distributor / Corporate Bounty) */}
                  {formData.type === 'B2B_INTRODUCTION' && (
                    <div className="space-y-3 pt-1 text-xs">
                      <div>
                        <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                          Deal Valuation / Contract Budget <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.dealValuationBudgetTZS}
                            onChange={(e) => setFormData({ ...formData, dealValuationBudgetTZS: Number(e.target.value) })}
                            placeholder="100000000"
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-black text-[#FF6A00] text-xs"
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">Annual Volume (TZS)</span>
                        </div>
                      </div>

                      <div className="pt-1">
                        <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                          Target Partner Eligibility / Role
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            'Corporate Consultants',
                            'Trade Brokers',
                            'Business Networks',
                            'Industry Aggregators',
                          ].map((role) => {
                            const isChecked = formData.partnerEligibilityRoles.includes(role)
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => {
                                  const updated = isChecked
                                    ? formData.partnerEligibilityRoles.filter((r) => r !== role)
                                    : [...formData.partnerEligibilityRoles, role]
                                  setFormData({ ...formData, partnerEligibilityRoles: updated })
                                }}
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-[#FF6A00] text-white border-[#FF6A00] shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <span className="font-bold text-xs">{role}</span>
                                {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. PRODUCT OPPORTUNITY ("Find Buyer & Earn" High-Ticket) */}
                  {formData.type === 'PRODUCT_OPPORTUNITY' && (
                    <div className="space-y-3 pt-1 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                            Listing / Asset Price (TZS) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={formData.assetListingPriceTZS}
                            onChange={(e) => setFormData({ ...formData, assetListingPriceTZS: Number(e.target.value) })}
                            placeholder="180000000"
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-black text-[#FF6A00] text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                            Location / Inspection Point <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.inspectionLocation}
                            onChange={(e) => setFormData({ ...formData, inspectionLocation: e.target.value })}
                            placeholder="City, Showroom, or Plot Coordinates"
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-purple-900 dark:text-purple-200">
                        <div>
                          <span className="font-bold block">Dual Marketplace Paths Enabled:</span>
                          <span className="text-[11px] text-purple-700 dark:text-purple-300">
                            Buyers see <strong>"Buy Now (TZS {formData.assetListingPriceTZS.toLocaleString()})"</strong> · Partners see <strong>"Find Buyer & Earn Closing Bounty"</strong>
                          </span>
                        </div>
                        <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-1 rounded-lg shrink-0">
                          High-Ticket Mode
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 6. REVERSE OPPORTUNITY (Procurement / "Find This For Us") */}
                  {formData.type === 'REVERSE_OPPORTUNITY' && (
                    <div className="space-y-3 pt-1 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                            Total Sourcing Procurement Budget <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.totalSourcingBudget}
                            onChange={(e) => setFormData({ ...formData, totalSourcingBudget: e.target.value })}
                            placeholder="e.g. USD 800,000 or TZS 2,000,000,000"
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-black text-[#FF6A00] text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                            Target Delivery Timeline & Destination <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.deliveryTimelineDestination}
                            onChange={(e) => setFormData({ ...formData, deliveryTimelineDestination: e.target.value })}
                            placeholder="e.g. Dar es Salaam Port — Within 60 Days"
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 7. CUSTOMER ACQUISITION (CPA App / User Onboarding) */}
                  {formData.type === 'CUSTOMER_ACQUISITION' && (
                    <div className="space-y-3 pt-1 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                            Target Acquisition Goal (Active Accounts) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formData.targetAcquisitionGoal}
                              onChange={(e) => setFormData({ ...formData, targetAcquisitionGoal: Number(e.target.value) })}
                              placeholder="1000"
                              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">Users</span>
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                            Verification Trigger Condition <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.verificationTriggerCondition}
                            onChange={(e) => setFormData({ ...formData, verificationTriggerCondition: e.target.value })}
                            placeholder="e.g. KYC Approved + Minimum Deposit TZS 10,000"
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 8. AFFILIATE PROGRAMME (Always-On Merchant Catalog) */}
                  {formData.type === 'AFFILIATE_PROGRAMME' && (
                    <div className="space-y-3 pt-1 text-xs">
                      <div>
                        <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                          Attribution Tracking Window <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.affiliateAttributionWindow}
                          onChange={(e) => setFormData({ ...formData, affiliateAttributionWindow: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs cursor-pointer"
                        >
                          <option value="30 Days Cookie / First-Party Tracking">30 Days Cookie / First-Party Tracking</option>
                          <option value="60 Days Attribution Window">60 Days Attribution Window</option>
                          <option value="90 Days Attribution Window">90 Days Attribution Window</option>
                          <option value="Lifetime Attribution (First-Party Bound)">Lifetime Attribution (First-Party Bound)</option>
                        </select>
                      </div>

                      <div className="pt-1">
                        <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                          Allowed Distribution Channels
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {['Partner Storefronts', 'WhatsApp Links', 'Promo Codes', 'Social Media Bio Links'].map((ch) => {
                            const isChecked = formData.distributionChannels.includes(ch)
                            return (
                              <button
                                key={ch}
                                type="button"
                                onClick={() => {
                                  const updated = isChecked
                                    ? formData.distributionChannels.filter((c) => c !== ch)
                                    : [...formData.distributionChannels, ch]
                                  setFormData({ ...formData, distributionChannels: updated })
                                }}
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-[#FF6A00] text-white border-[#FF6A00] shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <span className="font-bold text-xs">{ch}</span>
                                {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* MEDIA & VIDEO IMPORT SECTION */}
                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#FF6A00]" />
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      Featured Cover Image & Promotional Video
                    </h4>
                  </div>

                  <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMediaUploadTab('PRESET')}
                      className={`px-2.5 py-1 rounded-lg ${mediaUploadTab === 'PRESET' ? 'bg-[#FF6A00] text-white' : 'text-slate-500'}`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaUploadTab('UPLOAD')}
                      className={`px-2.5 py-1 rounded-lg ${mediaUploadTab === 'UPLOAD' ? 'bg-[#FF6A00] text-white' : 'text-slate-500'}`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaUploadTab('URL')}
                      className={`px-2.5 py-1 rounded-lg ${mediaUploadTab === 'URL' ? 'bg-[#FF6A00] text-white' : 'text-slate-500'}`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {/* Cover Image Controls */}
                {mediaUploadTab === 'PRESET' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {PRESET_COVER_IMAGES.map((img) => (
                      <div
                        key={img.label}
                        onClick={() => setFormData({ ...formData, coverImageUrl: img.url })}
                        className={`relative rounded-2xl overflow-hidden border cursor-pointer group transition-all h-24 ${
                          formData.coverImageUrl === img.url ? 'ring-2 ring-[#FF6A00] border-transparent' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                          <span className="text-[10px] text-white font-bold leading-tight">{img.label}</span>
                        </div>
                        {formData.coverImageUrl === img.url && (
                          <div className="absolute top-1.5 right-1.5 bg-[#FF6A00] text-white rounded-full p-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {mediaUploadTab === 'UPLOAD' && (
                  <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-2 bg-white dark:bg-slate-900">
                    <Upload className="w-6 h-6 text-[#FF6A00] mx-auto" />
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Import Featured Image (PNG, JPG, WebP)
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-[#FF6A00] cursor-pointer"
                    />
                  </div>
                )}

                {mediaUploadTab === 'URL' && (
                  <div>
                    <label className="text-[11px] font-bold block mb-1">Direct Image URL (HTTPS)</label>
                    <input
                      type="url"
                      placeholder="https://images.example.com/cover.jpg"
                      value={formData.coverImageUrl}
                      onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                      className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-mono text-xs"
                    />
                  </div>
                )}

                {/* Cover Image Current Preview */}
                {formData.coverImageUrl && (
                  <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-2xl border">
                    <img
                      src={formData.coverImageUrl}
                      alt="Selected Cover"
                      className="w-16 h-12 object-cover rounded-xl shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Cover Image Active
                      </span>
                      <span className="text-[11px] text-slate-500 truncate block font-mono">
                        {formData.coverImageUrl}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, coverImageUrl: '' })}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Promotional Video URL & Upload */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Film className="w-4 h-4 text-purple-600" />
                      <span>Promotional Video Pitch (Instagram Reel / YouTube / TikTok / MP4)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Optional · Boosts partner conversion by +40%</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="url"
                        placeholder="https://www.instagram.com/reel/... or https://youtube.com/watch?v=..."
                        value={formData.promoVideoUrl}
                        onChange={(e) => setFormData({ ...formData, promoVideoUrl: e.target.value })}
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-mono text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 py-2 px-3 bg-white dark:bg-slate-900 border rounded-xl font-bold text-center cursor-pointer hover:bg-slate-100 flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200">
                        <Video className="w-3.5 h-3.5 text-purple-600" />
                        <span>Upload Video (.mp4)</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {formData.promoVideoUrl && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">
                          {videoInfo.type === 'INSTAGRAM' ? '📸' : videoInfo.type === 'YOUTUBE' ? '▶️' : videoInfo.type === 'TIKTOK' ? '🎵' : videoInfo.type === 'VIMEO' ? '🎥' : '🎬'}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-purple-900 dark:text-purple-200 block">
                            {videoInfo.type === 'INSTAGRAM' ? 'Instagram Video Link Detected' : videoInfo.type === 'YOUTUBE' ? 'YouTube Video Detected' : videoInfo.type === 'TIKTOK' ? 'TikTok Video Detected' : videoInfo.type === 'VIMEO' ? 'Vimeo Video Detected' : 'Video Pitch Ready'}
                          </span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 block truncate font-mono">
                            {formData.promoVideoUrl}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, promoVideoUrl: '' })}
                        className="text-xs text-red-500 hover:underline font-bold shrink-0 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Multi-Image Gallery Carousel */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Product & Proof Gallery ({formData.galleryImageUrls.length} images)</span>
                    </div>
                    <label className="text-xs text-[#FF6A00] font-bold cursor-pointer hover:underline flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Photos</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleGalleryUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {formData.galleryImageUrls.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                      {formData.galleryImageUrls.map((url, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border shrink-0 group">
                          <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                galleryImageUrls: formData.galleryImageUrls.filter((_, i) => i !== idx),
                              })
                            }
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Public Summary (Visible on LUMO Marketplace)</label>
                <textarea
                  rows={2}
                  placeholder={activeModelMeta.summaryPlaceholder}
                  value={formData.publicSummary}
                  onChange={(e) => setFormData({ ...formData, publicSummary: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-900 dark:text-white mb-1">
                  Industry Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const nextCat = e.target.value
                    const nextConf = CATEGORY_REWARD_CONFIG[nextCat]
                    if (nextConf) {
                      setFormData({
                        ...formData,
                        category: nextCat,
                        subcategory: '',
                        rewardStructure: nextConf.modelId,
                        baselinePriceTZS: nextConf.defaultBaselinePriceTZS,
                        baselineCurrency: nextConf.baselineCurrency,
                        rewardValueTZS: nextConf.defaultRewardValueTZS,
                        rewardPercent: nextConf.defaultRewardPercent,
                        customRewardDisplay: '',
                        customRewardDetail: nextConf.triggerPreset,
                        customFormulaDescription: nextConf.detailedDealFlow,
                      })
                    } else {
                      const group = TANZANIA_OPPORTUNITY_CATEGORIES.find((item) => item.value === nextCat)
                      setFormData({ ...formData, category: nextCat, subcategory: group?.subcategories[0] || '' })
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer"
                >
                  {TANZANIA_OPPORTUNITY_CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>{item.icon} {item.label}</option>
                  ))}
                  {INDUSTRY_CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {(() => {
                  const currentCat = INDUSTRY_CATEGORIES.find((c) => c.name === formData.category)
                  if (!currentCat) return null
                  return (
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      <strong className="text-slate-700 dark:text-slate-300">Covers:</strong> {currentCat.desc}
                    </p>
                  )
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Specific Category</label>
                  <select
                    value={formData.subcategory}
                    disabled={!TANZANIA_OPPORTUNITY_CATEGORIES.some((item) => item.value === formData.category)}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="">Select a specific category</option>
                    {TANZANIA_OPPORTUNITY_CATEGORIES.find((item) => item.value === formData.category)?.subcategories.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Target Geographic Regions - Separate Regions Multi-Select Dropdown */}
              <div className="relative" ref={regionDropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold block text-slate-900 dark:text-white">
                    Target Geographic Regions
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {formData.selectedRegions.includes('All Regions (National - Tanzania)')
                      ? 'National (All Regions)'
                      : formData.selectedRegions.length > 0
                      ? `${formData.selectedRegions.length} region${formData.selectedRegions.length > 1 ? 's' : ''} ticked`
                      : 'None selected'}
                  </span>
                </div>

                {/* Dropdown Trigger Box */}
                <div
                  onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                  className={`w-full p-2.5 rounded-xl border bg-white dark:bg-slate-800 transition-all cursor-pointer flex items-center justify-between gap-2 min-h-[42px] ${
                    isRegionDropdownOpen
                      ? 'border-[#FF6A00] ring-2 ring-orange-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-1 flex-wrap min-w-0">
                    <MapPin className="w-4 h-4 text-[#FF6A00] shrink-0" />
                    {formData.selectedRegions.includes('All Regions (National - Tanzania)') ? (
                      <span className="bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-bold text-xs px-2.5 py-0.5 rounded-lg border border-orange-200 dark:border-orange-900/60 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        National (All Regions - Tanzania)
                      </span>
                    ) : formData.selectedRegions.length > 0 ? (
                      <>
                        {formData.selectedRegions.slice(0, 3).map((reg) => (
                          <span
                            key={reg}
                            className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
                          >
                            <span>{reg}</span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation()
                                const withoutThis = formData.selectedRegions.filter((r) => r !== reg)
                                setFormData({
                                  ...formData,
                                  selectedRegions: withoutThis,
                                  region: withoutThis.join(', ') || 'All Tanzania',
                                })
                              }}
                              className="hover:text-red-500 cursor-pointer ml-0.5 font-bold text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded px-0.5"
                            >
                              ×
                            </span>
                          </span>
                        ))}
                        {formData.selectedRegions.length > 3 && (
                          <span className="text-[11px] font-extrabold text-[#FF6A00] bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md">
                            +{formData.selectedRegions.length - 3} more
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs font-normal">
                        Click to select and tick target regions...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                    {formData.selectedRegions.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFormData({ ...formData, selectedRegions: [], region: '' })
                        }}
                        className="p-1 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                        title="Clear all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isRegionDropdownOpen ? 'rotate-180 text-[#FF6A00]' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Dropdown Popover Menu */}
                {isRegionDropdownOpen && (
                  <div className="absolute z-40 top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regionSearchQuery}
                        onChange={(e) => setRegionSearchQuery(e.target.value)}
                        placeholder="Search separate regions (e.g. Dar es Salaam, Arusha, Mwanza, Dodoma)..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Quick Select All / Clear Row */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <span className="text-slate-400">
                        {TANZANIA_SEPARATE_REGIONS.filter((r) =>
                          r.toLowerCase().includes(regionSearchQuery.toLowerCase())
                        ).length} regions available
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFormData({
                              ...formData,
                              selectedRegions: [...TANZANIA_SEPARATE_REGIONS],
                              region: 'National (All Regions)',
                            })
                          }}
                          className="font-bold text-[#FF6A00] hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFormData({ ...formData, selectedRegions: [], region: '' })
                          }}
                          className="font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Checkbox List of Separate Regions */}
                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {TANZANIA_SEPARATE_REGIONS.filter((r) =>
                        r.toLowerCase().includes(regionSearchQuery.toLowerCase())
                      ).map((regionName) => {
                        const isTicked =
                          formData.selectedRegions.includes(regionName) ||
                          (regionName !== 'All Regions (National - Tanzania)' &&
                            formData.selectedRegions.includes('All Regions (National - Tanzania)'))

                        return (
                          <div
                            key={regionName}
                            onClick={(e) => {
                              e.stopPropagation()
                              let updated: string[] = []
                              if (regionName === 'All Regions (National - Tanzania)') {
                                if (formData.selectedRegions.includes('All Regions (National - Tanzania)')) {
                                  updated = []
                                } else {
                                  updated = [...TANZANIA_SEPARATE_REGIONS]
                                }
                              } else {
                                if (formData.selectedRegions.includes(regionName)) {
                                  updated = formData.selectedRegions.filter(
                                    (r) => r !== regionName && r !== 'All Regions (National - Tanzania)'
                                  )
                                } else {
                                  const withoutNational = formData.selectedRegions.filter(
                                    (r) => r !== 'All Regions (National - Tanzania)'
                                  )
                                  updated = [...withoutNational, regionName]
                                  if (updated.length === TANZANIA_SEPARATE_REGIONS.length - 1) {
                                    updated = [...TANZANIA_SEPARATE_REGIONS]
                                  }
                                }
                              }

                              const computedStr = updated.includes('All Regions (National - Tanzania)')
                                ? 'National (All Regions)'
                                : updated.length > 0
                                ? updated.join(', ')
                                : 'All Tanzania'

                              setFormData({
                                ...formData,
                                selectedRegions: updated,
                                region: computedStr,
                              })
                            }}
                            className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              isTicked
                                ? 'bg-orange-50/60 dark:bg-orange-950/30 text-slate-900 dark:text-white font-bold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                                  isTicked
                                    ? 'bg-[#FF6A00] border-[#FF6A00] text-white'
                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                }`}
                              >
                                {isTicked && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                              <span>{regionName}</span>
                            </div>

                            {regionName === 'All Regions (National - Tanzania)' && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal px-2 py-0.5 rounded-md">
                                Nationwide
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

          {/* STEP 3: COMMERCIAL RESULT */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Define the Qualifying Commercial Result
              </h3>
              <p className="text-slate-500 text-xs">
                What verifiable action triggers a partner reward?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'COMPLETED_SALE', title: 'Completed Sale', desc: 'Customer pays for product or service.' },
                  { id: 'QUALIFIED_LEAD', title: 'Qualified Lead', desc: 'Customer contact verified and phone screened.' },
                  { id: 'BOOKING', title: 'Service Booking', desc: 'Appointment or booking deposit paid.' },
                  { id: 'APPROVED_CONTENT', title: 'Approved Content', desc: 'Sponsored video or review approved by brand.' },
                  { id: 'PRODUCT_DELIVERY', title: 'Product Delivery', desc: 'Shipment delivered to end customer.' },
                  { id: 'SIGNED_DISTRIBUTOR_CONTRACT', title: 'Signed Contract', desc: 'Countersigned B2B dealer agreement.' },
                ].map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setFormData({ ...formData, commercialResult: res.id as CommercialResultType })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      formData.commercialResult === res.id
                        ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/30 dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white">{res.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{res.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: CUSTOMIZABLE REWARD STRUCTURE BASED ON INDUSTRY & DEAL ARCHETYPE */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Customize Partner Reward Structure
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Tailored compensation model, baseline asset valuation, display templates, and trigger presets.
                  </p>
                </div>
                <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-900/60">
                  {formData.category}
                </span>
              </div>

              {/* Category Benchmark & Detailed Deal Flow Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200 dark:border-orange-900/60 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{currentCategoryConfig.icon}</span>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                        <span>{formData.category}</span>
                        <span className="text-[10px] font-bold bg-[#FF6A00] text-white px-2 py-0.5 rounded-md">
                          {currentCategoryConfig.archetype}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Display Blueprint: <strong className="text-[#FF6A00] font-mono font-bold">{currentCategoryConfig.defaultDisplayLabel}</strong> · <span className="italic">{currentCategoryConfig.triggerPreset}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        rewardStructure: currentCategoryConfig.modelId,
                        baselinePriceTZS: currentCategoryConfig.defaultBaselinePriceTZS,
                        baselineCurrency: currentCategoryConfig.baselineCurrency,
                        rewardValueTZS: currentCategoryConfig.defaultRewardValueTZS,
                        rewardPercent: currentCategoryConfig.defaultRewardPercent,
                        customRewardDisplay: '',
                        customRewardDetail: currentCategoryConfig.triggerPreset,
                        customFormulaDescription: currentCategoryConfig.detailedDealFlow,
                      })
                      showToast('info', 'Loaded Blueprint', `Applied standard deal template for ${formData.category}`)
                    }}
                    className="text-[10px] font-extrabold text-[#FF6A00] bg-orange-100 dark:bg-orange-950/60 px-3 py-1.5 rounded-xl hover:bg-orange-200 dark:hover:bg-orange-900/80 cursor-pointer transition-colors shrink-0 self-start sm:self-auto"
                  >
                    Reset to Category Benchmark
                  </button>
                </div>

                <div className="pt-2 border-t border-orange-200/60 dark:border-orange-900/40 text-[11px] space-y-1.5">
                  <div className="text-slate-700 dark:text-slate-300">
                    <strong className="text-[#FF6A00]">💡 Practical Deal Example:</strong> {currentCategoryConfig.practicalDealExample}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-700 dark:text-slate-300">📋 Detailed Deal Flow:</strong> {currentCategoryConfig.detailedDealFlow}
                  </div>
                </div>
              </div>

              {/* Baseline Valuation & Dynamic Unit Math Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span>{currentCategoryConfig.baselinePriceLabel}</span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-md">
                        {formData.baselineCurrency || 'TZS'}
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Baseline asset value, unit price, or total contract pool used for commission calculations.
                    </p>
                  </div>
                  {/* Calculated metrics pill */}
                  <div className="bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900/60 rounded-xl px-3 py-1.5 text-right shrink-0">
                    <div className="text-[9px] uppercase font-extrabold text-[#FF6A00]">Calculated Partner Earning</div>
                    <div className="text-xs font-black text-slate-900 dark:text-white font-mono">
                      {formData.rewardStructure === 'PERCENTAGE_COMMISSION'
                        ? `TZS ${Math.round((formData.baselinePriceTZS * formData.rewardPercent) / 100).toLocaleString()} / sale`
                        : formData.rewardStructure === 'HYBRID_COMPENSATION'
                        ? `TZS ${(formData.rewardValueTZS + Math.round((formData.baselinePriceTZS * formData.rewardPercent) / 100)).toLocaleString()} max potential`
                        : `TZS ${formData.rewardValueTZS.toLocaleString()} fixed bounty (${((formData.rewardValueTZS / (formData.baselinePriceTZS || 1)) * 100).toFixed(1)}% of value)`}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={formData.baselinePriceTZS}
                      onChange={(e) => setFormData({ ...formData, baselinePriceTZS: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-sm text-slate-900 dark:text-white"
                      placeholder="180000000"
                    />
                  </div>
                  {/* Quick Baseline Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1200000, 5000000, 25000000, 85000000, 120000000, 180000000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData({ ...formData, baselinePriceTZS: val })}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                          formData.baselinePriceTZS === val
                            ? 'bg-slate-800 text-white border-slate-800 dark:bg-orange-500 dark:border-orange-500'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        {val >= 1000000 ? `${(val / 1000000).toFixed(1).replace('.0', '')}M` : `${(val / 1000).toFixed(0)}k`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4 Category-Aligned Archetypes */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                  <span>Opportunity Type & Recommended Model:</span>
                  <span className="text-[#FF6A00] font-semibold text-[10px]">Click archetype to apply model & presets</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      key: 'B2B_SOURCING' as const,
                      archetype: 'B2B / Sourcing',
                      icon: '🏢',
                      config:
                        currentCategoryConfig.archetype.startsWith('B2B') || currentCategoryConfig.archetype.startsWith('Custom Sourcing')
                          ? {
                              modelId: currentCategoryConfig.modelId,
                              modelTitle: currentCategoryConfig.modelTitle,
                              templateLabel: currentCategoryConfig.defaultDisplayLabel,
                              triggerPreset: currentCategoryConfig.triggerPreset,
                              isRecommended: true,
                            }
                          : {
                              modelId: 'CUSTOM_DEAL_TERMS' as RewardStructureType,
                              modelTitle: 'Custom Deal Terms',
                              templateLabel: 'TZS 3,000,000 Sourcing / Distributor Reward',
                              triggerPreset: 'per verified completion',
                              isRecommended: false,
                            },
                    },
                    {
                      key: 'CREATOR_AD' as const,
                      archetype: 'Creator Ad Deal',
                      icon: '🎬',
                      config:
                        currentCategoryConfig.archetype.startsWith('Creator') || currentCategoryConfig.archetype.startsWith('Percentage')
                          ? {
                              modelId: currentCategoryConfig.modelId,
                              modelTitle: currentCategoryConfig.modelTitle,
                              templateLabel: currentCategoryConfig.defaultDisplayLabel,
                              triggerPreset: currentCategoryConfig.triggerPreset,
                              isRecommended: true,
                            }
                          : {
                              modelId: 'HYBRID_COMPENSATION' as RewardStructureType,
                              modelTitle: 'Hybrid (Base + %)',
                              templateLabel: 'TZS 400,000 Base + 5% Sales Commission',
                              triggerPreset: 'per verified completion',
                              isRecommended: false,
                            },
                    },
                    {
                      key: 'LEAD_GEN' as const,
                      archetype: 'Lead Generation',
                      icon: '🎯',
                      config:
                        currentCategoryConfig.archetype.startsWith('Lead')
                          ? {
                              modelId: currentCategoryConfig.modelId,
                              modelTitle: currentCategoryConfig.modelTitle,
                              templateLabel: currentCategoryConfig.defaultDisplayLabel,
                              triggerPreset: currentCategoryConfig.triggerPreset,
                              isRecommended: true,
                            }
                          : {
                              modelId: 'COST_PER_LEAD' as RewardStructureType,
                              modelTitle: 'Cost Per Lead (CPL)',
                              templateLabel: 'TZS 20,000 per Qualified SME Lead',
                              triggerPreset: 'per qualified customer demo',
                              isRecommended: false,
                            },
                    },
                    {
                      key: 'HIGH_TICKET' as const,
                      archetype: 'High-Ticket Sales',
                      icon: '💎',
                      config:
                        currentCategoryConfig.archetype.startsWith('High-Ticket')
                          ? {
                              modelId: currentCategoryConfig.modelId,
                              modelTitle: currentCategoryConfig.modelTitle,
                              templateLabel: currentCategoryConfig.defaultDisplayLabel,
                              triggerPreset: currentCategoryConfig.triggerPreset,
                              isRecommended: true,
                            }
                          : {
                              modelId: 'FIXED_REWARD' as RewardStructureType,
                              modelTitle: 'Fixed Cash Bounty',
                              templateLabel: 'TZS 2,000,000 Vehicle Finder / Deal Reward',
                              triggerPreset: 'per signed dealer contract',
                              isRecommended: false,
                            },
                    },
                  ].map((arch) => {
                    const isSelected = formData.rewardStructure === arch.config.modelId
                    return (
                      <button
                        key={arch.archetype}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            rewardStructure: arch.config.modelId,
                            customRewardDisplay: '',
                            customRewardDetail: arch.config.triggerPreset,
                          })
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/40 dark:bg-slate-800'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{arch.icon}</span>
                            <div>
                              <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{arch.archetype}</span>
                                <span className="font-normal text-slate-400 text-[11px]">({arch.config.modelTitle})</span>
                              </div>
                            </div>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-[#FF6A00] shrink-0" />
                          ) : arch.config.isRecommended ? (
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md uppercase">
                              Recommended
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400">Display Template:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[10px]">
                              {arch.config.templateLabel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400">Trigger Preset:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[10px]">
                              {arch.config.triggerPreset}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Primary Value Input Grid */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Fixed Amount / Base Amount Input */}
                  {formData.rewardStructure !== 'PERCENTAGE_COMMISSION' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {formData.rewardStructure === 'HYBRID_COMPENSATION'
                            ? 'Base Fixed Amount [X] (TZS)'
                            : formData.rewardStructure === 'COST_PER_LEAD'
                            ? 'Lead Bounty [X] (TZS)'
                            : formData.rewardStructure === 'CUSTOM_DEAL_TERMS'
                            ? 'Sourcing / Distributor Reward [X] (TZS)'
                            : 'Deal Closing Reward [X] (TZS)'}
                        </label>
                      </div>
                      <input
                        type="number"
                        value={formData.rewardValueTZS}
                        onChange={(e) => setFormData({ ...formData, rewardValueTZS: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-sm text-slate-900 dark:text-white"
                        placeholder="50000"
                      />
                      {/* Quick Chips */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium">Quick values:</span>
                        {[50000, 150000, 400000, 750000, 1500000, 2000000, 2500000, 3000000].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setFormData({ ...formData, rewardValueTZS: val })}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                              formData.rewardValueTZS === val
                                ? 'bg-[#FF6A00] text-white border-[#FF6A00]'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {val >= 1000000 ? `${(val / 1000000).toFixed(1).replace('.0', '')}M` : `${(val / 1000).toFixed(0)}k`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Percentage Input */}
                  {(formData.rewardStructure === 'PERCENTAGE_COMMISSION' ||
                    formData.rewardStructure === 'HYBRID_COMPENSATION' ||
                    formData.rewardStructure === 'CUSTOM_DEAL_TERMS') && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {formData.rewardStructure === 'HYBRID_COMPENSATION'
                            ? '+ Variable Commission Rate [Y] (%)'
                            : 'Commission Percentage (%)'}
                        </label>
                      </div>
                      <input
                        type="number"
                        value={formData.rewardPercent}
                        onChange={(e) => setFormData({ ...formData, rewardPercent: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-sm text-slate-900 dark:text-white"
                        placeholder="5"
                      />
                      {/* Quick Chips */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium">Quick rates:</span>
                        {[1.1, 2, 3, 5, 6, 7, 8, 10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setFormData({ ...formData, rewardPercent: pct })}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                              formData.rewardPercent === pct
                                ? 'bg-[#FF6A00] text-white border-[#FF6A00]'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Display Label & Custom Trigger Row */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        Custom Reward Display Label (Marketplace Headline)
                      </label>
                    </div>
                    <input
                      type="text"
                      value={formData.customRewardDisplay}
                      onChange={(e) => setFormData({ ...formData, customRewardDisplay: e.target.value })}
                      placeholder={`Auto: ${computedAutoRewardDisplay}`}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Auto-template: <strong className="text-[#FF6A00]">{computedAutoRewardDisplay}</strong>
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        Reward Trigger & Payout Unit (Subtitle)
                      </label>
                    </div>
                    <input
                      type="text"
                      value={formData.customRewardDetail}
                      onChange={(e) => setFormData({ ...formData, customRewardDetail: e.target.value })}
                      placeholder={`Auto: ${computedAutoRewardDetail}`}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                    {/* Presets */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-medium">Presets:</span>
                      {[
                        'per verified completion',
                        'per signed dealer contract',
                        'per signed property contract',
                        'per verified delivery sign-off',
                        'per verified trade match & supply sign-off',
                        'per qualified customer demo',
                        'on completed order total',
                        'per verified installation',
                      ].map((trigger) => (
                        <button
                          key={trigger}
                          type="button"
                          onClick={() => setFormData({ ...formData, customRewardDetail: trigger })}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border transition-colors cursor-pointer ${
                            (formData.customRewardDetail || computedAutoRewardDetail) === trigger
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {trigger}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Specific Commercial Formula & Conditions Textarea */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Commercial Calculation & Specific Terms Description
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          customFormulaDescription: currentCategoryConfig.detailedDealFlow,
                        })
                      }
                      className="text-[10px] text-[#FF6A00] font-bold hover:underline cursor-pointer"
                    >
                      Fill Standard Terms
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.customFormulaDescription}
                    onChange={(e) => setFormData({ ...formData, customFormulaDescription: e.target.value })}
                    placeholder={currentCategoryConfig.detailedDealFlow}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* LIVE MARKETPLACE REWARD BADGE PREVIEW */}
              <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF6A00] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    TZS
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF6A00]">
                      Live Partner Card Preview
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono flex items-baseline gap-1.5">
                      <span>{effectiveRewardDisplay}</span>
                      <span className="text-xs font-normal text-slate-500 font-sans">
                        · {effectiveRewardDetail}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-orange-200 dark:border-orange-900/40">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    Calculated Reward Value
                  </div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    {effectiveRewardDisplay}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PREVIEW & SUBMISSION WITH MEDIA CAROUSEL */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Preview Opportunity & Confirm Submission
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Review how this opportunity and media assets will appear to Partners on the LUMO Marketplace.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setPreviewDevice('DESKTOP')}
                    className={`p-1.5 rounded-lg ${previewDevice === 'DESKTOP' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-400'}`}
                  >
                    <Laptop className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('MOBILE')}
                    className={`p-1.5 rounded-lg ${previewDevice === 'MOBILE' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-400'}`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mode Selector above Card if Video is Attached */}
              {formData.promoVideoUrl && (
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 font-medium">
                    Media Mode: <strong className="text-slate-800 dark:text-slate-200">{previewMediaMode === 'VIDEO' ? 'Interactive Video Pitch' : 'Featured Cover Image'}</strong>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPreviewMediaMode('IMAGE')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        previewMediaMode === 'IMAGE'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      🖼️ Cover Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMediaMode('VIDEO')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        previewMediaMode === 'VIDEO'
                          ? 'bg-[#FF6A00] text-white shadow-xs'
                          : 'text-[#FF6A00] hover:bg-orange-100 dark:hover:bg-orange-950/40'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>🎬 Play {videoInfo.type === 'INSTAGRAM' ? 'Instagram Reel' : videoInfo.type === 'YOUTUBE' ? 'YouTube' : 'Video'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Deal Card Preview with Media Banner */}
              <div
                className={`rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md overflow-hidden ${
                  previewDevice === 'MOBILE' ? 'max-w-xs mx-auto' : ''
                }`}
              >
                {/* Active Video Player or Image Banner */}
                {previewMediaMode === 'VIDEO' && formData.promoVideoUrl ? (
                  <div className="relative min-h-[340px] sm:min-h-[420px] w-full bg-slate-950 flex flex-col items-center justify-center border-b border-slate-800">
                    {videoInfo.isIframe ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 relative">
                        <iframe
                          src={videoInfo.embedUrl}
                          title={formData.title || 'Opportunity Video Pitch'}
                          className="w-full min-h-[320px] sm:min-h-[380px] rounded-2xl border-0 bg-white"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video
                        controls
                        autoPlay
                        src={videoInfo.embedUrl}
                        className="w-full h-72 sm:h-80 object-contain"
                        poster={formData.coverImageUrl}
                      >
                        Your browser does not support HTML5 video streaming.
                      </video>
                    )}

                    {/* Top Floating Control Bar */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                      {videoInfo.originalUrl ? (
                        <a
                          href={videoInfo.originalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="pointer-events-auto bg-black/80 hover:bg-[#FF6A00] text-white px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-xs shadow-lg transition-colors cursor-pointer"
                        >
                          <span>{videoInfo.type === 'INSTAGRAM' ? 'Watch on Instagram' : videoInfo.type === 'YOUTUBE' ? 'Watch on YouTube' : 'Open Video Link'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : <div />}
                      <button
                        type="button"
                        onClick={() => setPreviewMediaMode('IMAGE')}
                        className="pointer-events-auto bg-black/80 hover:bg-black text-white px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs cursor-pointer shadow-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Back to Cover</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-44 sm:h-52 w-full bg-slate-900 overflow-hidden">
                    {formData.coverImageUrl ? (
                      <img
                        src={formData.coverImageUrl}
                        alt="Opportunity Cover"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950/40 flex items-center justify-center text-4xl">
                        {currentCategoryConfig.icon}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] bg-[#FF6A00] text-white font-black uppercase px-2.5 py-1 rounded-full shadow-sm">
                        {formData.category}
                      </span>
                    </div>

                    {formData.promoVideoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setPreviewMediaMode('VIDEO')}
                          className="w-14 h-14 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-2xl backdrop-blur-xs hover:scale-110 hover:bg-white transition-all cursor-pointer group"
                          title="Click to play video"
                        >
                          <Play className="w-6 h-6 fill-[#FF6A00] text-[#FF6A00] ml-1 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-xs font-mono font-black text-white bg-black/60 px-2 py-0.5 rounded-lg backdrop-blur-xs">
                        {effectiveRewardDisplay} · {effectiveRewardDetail}
                      </span>
                      {formData.promoVideoUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewMediaMode('VIDEO')}
                          className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 backdrop-blur-xs cursor-pointer transition-colors shadow-sm"
                        >
                          <Film className="w-3 h-3" />
                          <span>Play {videoInfo.type === 'INSTAGRAM' ? 'Instagram Reel' : videoInfo.type === 'YOUTUBE' ? 'YouTube' : 'Video'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4 sm:p-5 space-y-3">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                    {formData.title || 'Untitled Commercial Opportunity'}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {formData.publicSummary || 'No public summary provided.'}
                  </p>

                  {/* Gallery Thumbnails Strip */}
                  {formData.galleryImageUrls.length > 0 && (
                    <div className="pt-2 border-t space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Product Photos:</span>
                      <div className="flex gap-1.5 overflow-x-auto py-1">
                        {formData.galleryImageUrls.map((url, i) => (
                          <img key={i} src={url} alt="Thumbnail" className="w-12 h-12 object-cover rounded-lg border" />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reward Structure:</span>
                      <span className="font-bold text-[#FF6A00]">{effectiveRewardDisplay} ({effectiveRewardDetail})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Region:</span>
                      <span className="font-bold">{formData.region}</span>
                    </div>

                    {formData.type === 'ADVERTISING_CAMPAIGN' && (
                      <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1">
                        <span className="text-slate-400">Deliverables:</span>
                        <span className="font-bold">{formData.targetDeliverableChannels.join(', ') || 'All Channels'} ({formData.minCreatorFollowers.toLocaleString()}+ followers)</span>
                      </div>
                    )}
                    {formData.type === 'COMMERCIAL_DEAL' && (
                      <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1">
                        <span className="text-slate-400">Inventory Allocation:</span>
                        <span className="font-bold">{formData.inventoryAllocationUnits} units @ TZS {formData.baselineUnitPriceTZS.toLocaleString()}</span>
                      </div>
                    )}
                    {formData.type === 'LEAD_GENERATION' && (
                      <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1">
                        <span className="text-slate-400">Target Niche:</span>
                        <span className="font-bold">{formData.targetIndustryNiche} ({formData.leadQualificationCriteria.length} checks)</span>
                      </div>
                    )}
                    {formData.type === 'B2B_INTRODUCTION' && (
                      <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1">
                        <span className="text-slate-400">Contract Valuation:</span>
                        <span className="font-bold">TZS {formData.dealValuationBudgetTZS.toLocaleString()}</span>
                      </div>
                    )}
                    {formData.type === 'PRODUCT_OPPORTUNITY' && (
                      <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1">
                        <span className="text-slate-400">Asset Price:</span>
                        <span className="font-bold">TZS {formData.assetListingPriceTZS.toLocaleString()} ({formData.inspectionLocation})</span>
                      </div>
                    )}
                    {formData.type === 'REVERSE_OPPORTUNITY' && (
                      <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1">
                        <span className="text-slate-400">Sourcing Budget:</span>
                        <span className="font-bold">{formData.totalSourcingBudget} ({formData.deliveryTimelineDestination})</span>
                      </div>
                    )}
                    {formData.type === 'CUSTOMER_ACQUISITION' && (
                      <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1">
                        <span className="text-slate-400">Acquisition Target:</span>
                        <span className="font-bold">{formData.targetAcquisitionGoal.toLocaleString()} Users ({formData.verificationTriggerCondition})</span>
                      </div>
                    )}
                    {formData.type === 'AFFILIATE_PROGRAMME' && (
                      <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1">
                        <span className="text-slate-400">Attribution Window:</span>
                        <span className="font-bold">{formData.affiliateAttributionWindow}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Compliance Declarations */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.confirmAccurate}
                    onChange={(e) => setFormData({ ...formData, confirmAccurate: e.target.checked })}
                    className="w-4 h-4 text-[#FF6A00] rounded mt-0.5"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    I declare that all business media assets, commercial claims, and video contents are authentic and compliant with Tanzanian advertising regulations.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.confirmNoSilentChanges}
                    onChange={(e) => setFormData({ ...formData, confirmNoSilentChanges: e.target.checked })}
                    className="w-4 h-4 text-[#FF6A00] rounded mt-0.5"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    <strong>Immutability Acknowledgment:</strong> I understand that published commercial terms, reward percentages, and attribution windows cannot be silently altered or reduced once active Partners enroll.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 gap-3">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              currentStep === 1 ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'border hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex gap-2">
            {currentStep < stepsList.length ? (
              <button
                onClick={handleNext}
                className="py-2.5 px-6 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitToLumo}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Submit Opportunity with Media</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
