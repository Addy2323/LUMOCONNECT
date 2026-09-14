import { describe, it, expect } from 'vitest'
import {
  translations,
  getOpportunitiesCountLabel,
  getDaysRemainingLabel,
  parseLocaleCookie,
} from '@/lib/i18n'
import {
  formatCategoryBadgeLabel,
  getLocalizedCategoryLabel,
  getLocalizedSubcategoryLabel,
} from '@/modules/deals/taxonomy'

describe('Localisation & Language System (Kiswahili / English)', () => {
  describe('1. Exact User-Defined Terminology Mapping (All 27 Terms)', () => {
    const sw = translations.sw

    it('translates Categories & Taxonomy correctly into Swahili', () => {
      expect(sw['Categories']).toBe('Makundi')
      expect(sw['Category']).toBe('Kundi')
      expect(sw['Category']).not.toBe('Aina ya Tatizo')
      expect(sw['Property']).toBe('Mali Isiyohamishika')
      expect(sw['Vehicles']).toBe('Magari')
      expect(sw['Products']).toBe('Bidhaa')
      expect(sw['Agriculture & Commodities']).toBe('Kilimo na Mazao')
      expect(sw['Business']).toBe('Biashara')
      expect(sw['Services']).toBe('Huduma')
    })

    it('translates Marketplace Filter terms correctly without problem/trouble regressions', () => {
      expect(sw['Region']).toBe('Mkoa')
      expect(sw['All Regions']).toBe('Mikoa Yote')
      expect(sw['Opportunity Type']).toBe('Aina ya Fursa')
      expect(sw['Opportunity Type']).not.toBe('Aina ya Tatizo')
      expect(sw['Minimum Reward']).toBe('Kiwango cha Chini cha Zawadi')
      expect(sw['Any Reward']).toBe('Kiasi Chochote cha Zawadi')
    })

    it('translates Marketplace Tabs, Sorting and Search correctly', () => {
      expect(sw['All Deals']).toBe('Fursa Zote')
      expect(sw['VIP Early Access']).toBe('Ufikiaji wa Mapema kwa VIP')
      expect(sw['Standard Partner Deals']).toBe('Fursa za Washirika wa Kawaida')
      expect(sw['Search Marketplace']).toBe('Tafuta Fursa')
      expect(sw['Recommended']).toBe('Zilizopendekezwa')
    })

    it('translates Card Details and Publishers correctly', () => {
      expect(sw['Publisher']).toBe('Mchapishaji')
      expect(sw['Published by Lumo Dealers']).toBe('Imechapishwa na Lumo Dealers')
      expect(sw['Price']).toBe('Bei')
      expect(sw['Partner Reward']).toBe('Zawadi ya Mshirika')
      expect(sw['Time Left']).toBe('Muda Uliobaki')
      expect(sw['Location']).toBe('Eneo')
    })

    it('translates Action Buttons and Navigation correctly', () => {
      expect(sw['Join & Promote']).toBe('Jiunge na Utangaze')
      expect(sw['I Have a Customer']).toBe('Nina Mteja')
      expect(sw['View Progress']).toBe('Angalia Maendeleo')
      expect(sw['Chat with Lumo']).toBe('Wasiliana na Lumo')
      expect(sw['Get Promotional Materials']).toBe('Pata Nyenzo za Matangazo')
    })
  })

  describe('2. Dual-Language Pluralization & Grammatical Rules', () => {
    it('formats opportunities count correctly in Swahili and English', () => {
      expect(getOpportunitiesCountLabel(1, 'sw')).toBe('Inaonyeshwa fursa 1')
      expect(getOpportunitiesCountLabel(0, 'sw')).toBe('Zinaonyeshwa fursa 0')
      expect(getOpportunitiesCountLabel(5, 'sw')).toBe('Zinaonyeshwa fursa 5')
      expect(getOpportunitiesCountLabel(1, 'en')).toBe('Showing 1 opportunity')
      expect(getOpportunitiesCountLabel(0, 'en')).toBe('Showing 0 opportunities')
      expect(getOpportunitiesCountLabel(5, 'en')).toBe('Showing 5 opportunities')
    })

    it('formats days remaining correctly in Swahili and English', () => {
      expect(getDaysRemainingLabel(1, 'sw')).toBe('Imebaki siku 1')
      expect(getDaysRemainingLabel(3, 'sw')).toBe('Zimebaki siku 3')
      expect(getDaysRemainingLabel(10, 'sw')).toBe('Zimebaki siku 10')
      expect(getDaysRemainingLabel(1, 'en')).toBe('1 day remaining')
      expect(getDaysRemainingLabel(3, 'en')).toBe('3 days remaining')
    })
  })

  describe('3. Taxonomy & Category Badge Formatting (Zero English Leaks)', () => {
    it('renders pure English in English mode and does not leak Biashara', () => {
      expect(formatCategoryBadgeLabel('Business', undefined, 'en')).toBe('Business')
      expect(formatCategoryBadgeLabel('Business', 'Suppliers', 'en')).toBe('Business · Suppliers')
      expect(formatCategoryBadgeLabel('Property', 'Land', 'en')).toBe('Property · Land')
    })

    it('converts accidentally Swahili-stored values back to English when in English mode', () => {
      expect(formatCategoryBadgeLabel('Biashara', undefined, 'en')).toBe('Business')
      expect(formatCategoryBadgeLabel('Mali Isiyohamishika', undefined, 'en')).toBe('Property')
    })

    it('renders clean Swahili in Swahili mode', () => {
      expect(formatCategoryBadgeLabel('Business', undefined, 'sw')).toBe('Biashara')
      expect(formatCategoryBadgeLabel('Business', 'Suppliers', 'sw')).toBe('Biashara · Wasambazaji')
      expect(formatCategoryBadgeLabel('Property', 'Land', 'sw')).toBe('Mali Isiyohamishika · Ardhi')
      expect(formatCategoryBadgeLabel('Vehicles', 'Cars', 'sw')).toBe('Magari · Magari')
      expect(formatCategoryBadgeLabel('Products', 'Phones', 'sw')).toBe('Bidhaa · Simu')
    })

    it('getLocalizedCategoryLabel handles both directions', () => {
      expect(getLocalizedCategoryLabel('Business', 'sw')).toBe('Biashara')
      expect(getLocalizedCategoryLabel('Biashara', 'en')).toBe('Business')
      expect(getLocalizedCategoryLabel('Property', 'sw')).toBe('Mali Isiyohamishika')
      expect(getLocalizedCategoryLabel('Mali Isiyohamishika', 'en')).toBe('Property')
    })

    it('getLocalizedSubcategoryLabel translates correctly', () => {
      expect(getLocalizedSubcategoryLabel('Building materials', 'sw')).toBe('Vifaa vya Ujenzi')
      expect(getLocalizedSubcategoryLabel('Vifaa vya Ujenzi', 'en')).toBe('Building materials')
      expect(getLocalizedSubcategoryLabel('Solar & Energy', 'sw')).toBe('Solar & Energy')
    })
  })

  describe('4. Cookie & Locale Preference Handling', () => {
    it('parses lumo_locale cookie correctly', () => {
      expect(parseLocaleCookie('foo=bar; lumo_locale=sw; session=abc')).toBe('sw')
      expect(parseLocaleCookie('lumo_locale=en')).toBe('en')
      expect(parseLocaleCookie('lumo_locale=invalid')).toBeNull()
      expect(parseLocaleCookie('')).toBeNull()
    })
  })
})
