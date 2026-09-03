import type { OpportunityItem } from './types'

interface MarketplaceSeed {
  id: string
  organizationId: string
  companyName: string
  companyLogo: string
  type: OpportunityItem['type']
  title: string
  slug: string
  summary: string
  description: string
  category: string
  subcategory: string
  region: string
  rewardDisplay: string
  rewardDetail: string
  potentialBonus?: string
  featuredImageUrl: string
  termsAndConditions: string
  activePartnerCount: number
  maxPartners: number
  totalBudgetTZS: bigint
  createdAt: string
  expiryDate: string
}

const NEW_MARKETPLACE_PRODUCTS: MarketplaceSeed[] = [
  {
    id: 'opp_cement_bulk_01', organizationId: 'org_ujenzi_supply', companyName: 'Ujenzi Trade Buyers Ltd', companyLogo: 'UJ', type: 'REVERSE_SOURCING',
    title: 'Wanted: 500 Bags of Grade 42.5 Cement', slug: 'wanted-500-bags-grade-42-cement',
    summary: 'A verified Dar es Salaam contractor needs 500 bags of fresh Grade 42.5 cement for immediate site delivery.',
    description: 'Supply 500 sealed bags of Grade 42.5 cement from a TRA-registered distributor. The buyer requires a formal quotation, batch information, delivery schedule, and transport to the Mikocheni construction site within seven days.',
    category: 'Products', subcategory: 'Building materials', region: 'Dar es Salaam', rewardDisplay: 'TZS 180,000 / Supply Deal',
    rewardDetail: 'Paid after supplier verification, accepted quotation, and completed delivery.', potentialBonus: 'TZS 75,000 bonus for delivery within 72 hours',
    featuredImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&h=900&q=90',
    termsAndConditions: 'Cement must be factory sealed, within shelf life, and accompanied by a valid tax invoice and delivery note.',
    activePartnerCount: 21, maxPartners: 35, totalBudgetTZS: BigInt(1800000000), createdAt: '2026-09-03T07:00:00Z', expiryDate: '2026-09-20T23:59:59Z',
  },
  {
    id: 'opp_hiace_tz_02', organizationId: 'org_safari_fleet', companyName: 'SafariLink Fleet Tanzania', companyLogo: 'SL', type: 'REVERSE_SOURCING',
    title: 'Toyota Hiace 2018–2022 for Tour Fleet', slug: 'toyota-hiace-tour-fleet-tanzania',
    summary: 'Tour operator seeking a clean Toyota Hiace with verified mileage, service history, and passenger configuration.',
    description: 'The buyer is sourcing a locally registered or duty-paid Toyota Hiace manufactured between 2018 and 2022. Submit ownership documents, inspection report, mileage, interior photos, service history, and final asking price.',
    category: 'Vehicles', subcategory: 'Cars', region: 'Arusha', rewardDisplay: 'TZS 650,000 / Purchase',
    rewardDetail: 'Fixed finder reward after inspection, ownership verification, and completed vehicle transfer.', potentialBonus: 'Additional TZS 150,000 for a vehicle ready within five days',
    featuredImageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&h=900&q=90',
    termsAndConditions: 'Vehicle must have a clean title, valid TRA documentation, no structural accident damage, and pass independent inspection.',
    activePartnerCount: 17, maxPartners: 25, totalBudgetTZS: BigInt(3200000000), createdAt: '2026-09-03T06:30:00Z', expiryDate: '2026-09-30T23:59:59Z',
  },
  {
    id: 'opp_farmland_03', organizationId: 'org_kilimo_holdings', companyName: 'Kilimo Growth Holdings', companyLogo: 'KG', type: 'REVERSE_SOURCING',
    title: 'Wanted: 10–20 Acres of Productive Farmland', slug: 'wanted-productive-farmland-morogoro',
    summary: 'Agricultural investor looking for titled farmland with road access and a reliable water source near Morogoro.',
    description: 'Suitable land should support maize, vegetables, or avocado production and be reachable throughout the year. Submissions must include coordinates, title or customary-right documents, recent photos, water availability, asking price, and seller contact details.',
    category: 'Property', subcategory: 'Land', region: 'Morogoro', rewardDisplay: 'TZS 500,000 / Acquisition',
    rewardDetail: 'Paid when the submitted property passes due diligence and the purchase agreement is signed.',
    featuredImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&h=900&q=90',
    termsAndConditions: 'Land must be free from disputes, have verifiable ownership, and permit agricultural use.',
    activePartnerCount: 14, maxPartners: 30, totalBudgetTZS: BigInt(2500000000), createdAt: '2026-09-02T15:00:00Z', expiryDate: '2026-10-15T23:59:59Z',
  },
  {
    id: 'opp_smartphones_04', organizationId: 'org_digital_retail', companyName: 'Digital Hub Wholesale Ltd', companyLogo: 'DH', type: 'DISTRIBUTOR_SEARCH',
    title: 'Supply 1,000 Smartphones for Retail Distribution', slug: 'supply-1000-smartphones-retail',
    summary: 'National retailer needs a wholesale supplier for 1,000 genuine Android smartphones with warranty coverage.',
    description: 'Supply a mixed consignment of entry-level and mid-range Android smartphones suitable for Tanzanian retail stores. Proposals must state model mix, unit prices, warranty terms, lead time, IMEI verification process, and availability of local after-sales support.',
    category: 'Products', subcategory: 'Phones', region: 'Dar es Salaam', rewardDisplay: 'TZS 900,000 / Contract',
    rewardDetail: 'Paid after supplier approval, sample validation, and signing of the wholesale purchase order.', potentialBonus: '1% recurring reward on the first three repeat orders',
    featuredImageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&h=900&q=90',
    termsAndConditions: 'Devices must be genuine, unlocked, compliant with TCRA requirements, and supported by verifiable warranty documentation.',
    activePartnerCount: 29, maxPartners: 45, totalBudgetTZS: BigInt(6000000000), createdAt: '2026-09-02T12:00:00Z', expiryDate: '2026-09-25T23:59:59Z',
  },
  {
    id: 'opp_zanzibar_hotel_05', organizationId: 'org_coastal_investments', companyName: 'Coastal Investment Partners', companyLogo: 'CI', type: 'REVERSE_SOURCING',
    title: 'Boutique Hotel or Lodge Wanted in Zanzibar', slug: 'boutique-hotel-lodge-wanted-zanzibar',
    summary: 'Hospitality investor seeking an operating boutique hotel, lodge, or beachfront guesthouse with expansion potential.',
    description: 'The preferred property has 15–50 guest rooms, valid operating licences, clean ownership records, and accessible financial statements. Owners or authorized brokers should provide location, room inventory, occupancy history, asking price, photos, and proof of mandate.',
    category: 'Property', subcategory: 'Hotel / lodge', region: 'Zanzibar', rewardDisplay: 'TZS 3,500,000 / Closed Deal',
    rewardDetail: 'Success fee paid after property due diligence and execution of the sale agreement.', potentialBonus: 'Negotiable bonus for exclusive off-market properties',
    featuredImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&h=900&q=90',
    termsAndConditions: 'Submissions require owner authorization, verifiable title documents, operating licences, and no undisclosed disputes.',
    activePartnerCount: 11, maxPartners: 20, totalBudgetTZS: BigInt(7000000000), createdAt: '2026-09-01T10:00:00Z', expiryDate: '2026-11-30T23:59:59Z',
  },
  {
    id: 'opp_clothing_06', organizationId: 'org_mavazi_market', companyName: 'Mavazi Market Tanzania', companyLogo: 'MM', type: 'DISTRIBUTOR_SEARCH',
    title: 'Wholesale Fashion and School Clothing Suppliers', slug: 'wholesale-fashion-school-clothing-suppliers',
    summary: 'Growing retailer wants dependable suppliers of wholesale clothing for shops in Mwanza and the Lake Zone.',
    description: 'The buyer needs consistent stock of casual wear, children’s clothing, school uniforms, and workwear. Suppliers should provide catalogues, wholesale price tiers, minimum order quantities, fabric specifications, delivery capacity, and sample availability.',
    category: 'Products', subcategory: 'Clothes', region: 'Mwanza', rewardDisplay: 'TZS 240,000 / Supplier',
    rewardDetail: 'Paid for each approved supplier completing a first wholesale delivery.', potentialBonus: 'TZS 100,000 bonus when the first order exceeds TZS 10 million',
    featuredImageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&h=900&q=90',
    termsAndConditions: 'Suppliers must issue tax invoices, provide samples, and meet agreed quality and delivery standards.',
    activePartnerCount: 19, maxPartners: 40, totalBudgetTZS: BigInt(2400000000), createdAt: '2026-08-31T13:00:00Z', expiryDate: '2026-10-31T23:59:59Z',
  },
  {
    id: 'opp_import_supplier_07', organizationId: 'org_east_africa_imports', companyName: 'East Africa Import Network', companyLogo: 'EA', type: 'B2B_INTRODUCTION',
    title: 'Verified China Supplier for Consumer Products', slug: 'verified-china-consumer-products-supplier',
    summary: 'Importer seeking a verified manufacturer or sourcing agent for recurring consumer-goods shipments to Tanzania.',
    description: 'Introduce established manufacturers or licensed sourcing agents able to consolidate electronics accessories, household products, and small appliances. The importer requires company verification, factory references, export history, quality-control options, shipping terms, and sample pricing.',
    category: 'Business', subcategory: 'Suppliers', region: 'All Tanzania', rewardDisplay: 'TZS 750,000 / Partnership',
    rewardDetail: 'Paid after supplier verification and completion of the first commercial shipment.', potentialBonus: '2% reward on verified savings from the first container order',
    featuredImageUrl: 'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=1400&h=900&q=90',
    termsAndConditions: 'The supplier must pass company verification, sample inspection, sanctions screening, and commercial-reference checks.',
    activePartnerCount: 24, maxPartners: 35, totalBudgetTZS: BigInt(4500000000), createdAt: '2026-08-30T09:00:00Z', expiryDate: '2026-11-15T23:59:59Z',
  },
]

export const INITIAL_OPPORTUNITIES: OpportunityItem[] = NEW_MARKETPLACE_PRODUCTS.map((item) => ({
  ...item,
  isVerified: true,
  countryCode: 'TZ',
  currency: 'TZS',
  rewardType: 'FIXED_COMMISSION',
  spentBudgetTZS: BigInt(0),
  isFeatured: true,
  galleryImageUrls: [item.featuredImageUrl],
  status: 'PUBLISHED',
  createdAt: new Date(item.createdAt),
  expiryDate: new Date(item.expiryDate),
}))
