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
    icon: 'House',
    subcategories: ['House', 'Apartment', 'Land', 'Commercial property', 'Hotel / lodge', 'Office', 'Warehouse', 'Plot'],
  },
  {
    value: 'Vehicles',
    label: 'Vehicles',
    icon: 'CarFront',
    subcategories: ['Cars', 'Motorcycles', 'Bajaji', 'Trucks', 'Spare parts', 'Machinery'],
  },
  {
    value: 'Products',
    label: 'Products',
    icon: 'Package',
    subcategories: ['Electronics', 'Phones', 'Computers', 'Furniture', 'Clothes', 'Building materials', 'Agricultural products', 'Wholesale products'],
  },
  {
    value: 'Agriculture & Commodities',
    label: 'Agriculture & Commodities',
    icon: 'Sprout',
    subcategories: ['Cashew', 'Coffee', 'Rice', 'Maize', 'Sesame', 'Avocado', 'Livestock', 'Fish', 'Agricultural equipment'],
  },
  {
    value: 'Business',
    label: 'Business',
    icon: 'BriefcaseBusiness',
    subcategories: ['Businesses for sale', 'Suppliers', 'Distributors', 'Franchise opportunities', 'Partnerships', 'Wholesale buyers', 'Wholesale suppliers'],
  },
  {
    value: 'Services',
    label: 'Services',
    icon: 'Wrench',
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
  const selected = selectedCategory.toLowerCase()
  if (itemCategory.toLowerCase() === selected || subcategory?.toLowerCase() === selected) return true

  if (selected === 'biashara' && (itemCategory.toLowerCase() === 'business' || subcategory?.toLowerCase() === 'business' || itemCategory.toLowerCase() === 'biashara')) return true
  if (selected === 'business' && (itemCategory.toLowerCase() === 'biashara' || subcategory?.toLowerCase() === 'biashara' || itemCategory.toLowerCase() === 'business')) return true

  const selectedGroup = TANZANIA_OPPORTUNITY_CATEGORIES.find(
    (group) => group.value.toLowerCase() === selected || group.label.toLowerCase().includes(selected)
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

export function formatCategoryBadgeLabel(category: string, subcategory?: string): string {
  const displayCat = category === 'Business' ? 'Biashara' : category
  if (subcategory && subcategory.trim() !== '') {
    return `${displayCat} · ${subcategory}`
  }
  return displayCat
}
