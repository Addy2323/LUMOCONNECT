import { describe, expect, it } from 'vitest'
import {
  TANZANIA_OPPORTUNITY_CATEGORIES,
  TANZANIA_REGIONS,
  matchesOpportunityCategory,
} from '../../src/modules/deals/taxonomy'

describe('Tanzania opportunity taxonomy', () => {
  it('contains the core local categories and major regions', () => {
    expect(TANZANIA_OPPORTUNITY_CATEGORIES.map((item) => item.value)).toEqual(
      expect.arrayContaining(['Property', 'Vehicles', 'Products', 'Agriculture & Commodities', 'Business', 'Services'])
    )
    expect(TANZANIA_REGIONS).toEqual(
      expect.arrayContaining(['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 'Zanzibar'])
    )
  })

  it('matches both a parent category and a specific subcategory', () => {
    expect(matchesOpportunityCategory('Products', 'Products', 'Phones')).toBe(true)
    expect(matchesOpportunityCategory('Products', 'Phones', 'Phones')).toBe(true)
    expect(matchesOpportunityCategory('Products', 'Cars', 'Phones')).toBe(false)
  })

  it('keeps existing marketplace categories discoverable under the new groups', () => {
    expect(matchesOpportunityCategory('Agriculture & Agrotech', 'Agriculture & Commodities')).toBe(true)
    expect(matchesOpportunityCategory('Enterprise Software', 'Services')).toBe(true)
  })
})
