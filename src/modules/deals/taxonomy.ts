export interface OpportunityCategoryGroup {
  value: string
  label: string
  icon: string
  subcategories: string[]
}

export const TANZANIA_OPPORTUNITY_CATEGORIES: OpportunityCategoryGroup[] = [
  {
    value: 'Property',
    label: 'Property',
    icon: '🏠',
    subcategories: ['House', 'Apartment', 'Land', 'Commercial property', 'Hotel / lodge', 'Office', 'Warehouse', 'Plot'],
  },
  {
    value: 'Vehicles',
    label: 'Vehicles',
    icon: '🚗',
    subcategories: ['Cars', 'Motorcycles', 'Bajaji', 'Trucks', 'Spare parts', 'Machinery'],
  },
  {
    value: 'Products',
    label: 'Products',
    icon: '📦',
    subcategories: ['Electronics', 'Phones', 'Computers', 'Furniture', 'Clothes', 'Building materials', 'Agricultural products', 'Wholesale products'],
  },
  {
    value: 'Agriculture & Commodities',
    label: 'Agriculture & Commodities',
    icon: '🌾',
    subcategories: ['Cashew', 'Coffee', 'Rice', 'Maize', 'Sesame', 'Avocado', 'Livestock', 'Fish', 'Agricultural equipment'],
  },
  {
    value: 'Business',
    label: 'Business',
    icon: '💼',
    subcategories: ['Businesses for sale', 'Suppliers', 'Distributors', 'Franchise opportunities', 'Partnerships', 'Wholesale buyers', 'Wholesale suppliers'],
  },
  {
    value: 'Services',
    label: 'Services',
    icon: '👷',
    subcategories: ['Construction', 'Transport', 'Photography', 'IT', 'Marketing', 'Legal', 'Accounting', 'Recruitment', 'Repair'],
  },
]

export const TANZANIA_REGIONS = [
  'All Tanzania',
  'Arusha',
  'Dar es Salaam',
  'Dodoma',
  'Geita',
  'Iringa',
  'Kagera',
  'Katavi',
  'Kigoma',
  'Kilimanjaro',
  'Lindi',
  'Manyara',
  'Mara',
  'Mbeya',
  'Morogoro',
  'Mtwara',
  'Mwanza',
  'Njombe',
  'Pemba North',
  'Pemba South',
  'Pwani',
  'Rukwa',
  'Ruvuma',
  'Shinyanga',
  'Simiyu',
  'Singida',
  'Songwe',
  'Tabora',
  'Tanga',
  'Zanzibar',
] as const

const LEGACY_CATEGORY_GROUPS: Record<string, string> = {
  'renewable energy': 'Products',
  'fintech & payments': 'Services',
  'travel & hospitality': 'Services',
  'hospitality & tourism': 'Services',
  'agriculture & fmcg': 'Agriculture & Commodities',
  'agriculture & agrotech': 'Agriculture & Commodities',
  'technology & enterprise': 'Services',
  'enterprise software': 'Services',
  'food & beverage': 'Products',
  'education & edtech': 'Services',
  'construction & sourcing': 'Services',
  'healthcare & wellness': 'Services',
  'logistics & transportation': 'Services',
}

export function matchesOpportunityCategory(itemCategory: string, selectedCategory: string, subcategory?: string) {
  if (!selectedCategory || selectedCategory === 'ALL') return true

  const selected = selectedCategory.toLowerCase()
  if (itemCategory.toLowerCase() === selected || subcategory?.toLowerCase() === selected) return true

  const selectedGroup = TANZANIA_OPPORTUNITY_CATEGORIES.find(
    (group) => group.value.toLowerCase() === selected
  )
  if (!selectedGroup) return false

  if (LEGACY_CATEGORY_GROUPS[itemCategory.toLowerCase()] === selectedGroup.value) return true
  return selectedGroup.subcategories.some((value) => value.toLowerCase() === subcategory?.toLowerCase())
}

export function getCategoryGroup(category: string, subcategory?: string) {
  const direct = TANZANIA_OPPORTUNITY_CATEGORIES.find(
    (group) => group.value === category || group.subcategories.includes(category) || (subcategory && group.subcategories.includes(subcategory))
  )
  return direct?.value || LEGACY_CATEGORY_GROUPS[category.toLowerCase()] || category
}
