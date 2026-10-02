/**
 * LUMO Administrative Cache Invalidation Helpers
 *
 * Provides safe, targeted cache tag invalidation to clear public caches
 * whenever admins, merchants, or system actions update public content.
 */

import { revalidateTag, revalidatePath } from 'next/cache'
import { CACHE_TAGS } from './tags'

const safeRevalidateTag = (tag: string) => {
  try {
    ;(revalidateTag as any)(tag)
  } catch (err) {
    console.warn('Tag revalidation warning:', tag, err)
  }
}

export function invalidateHomepage() {
  try {
    safeRevalidateTag(CACHE_TAGS.homepage)
    revalidatePath('/')
  } catch (err) {
    console.warn('Revalidation warning (homepage):', err)
  }
}

export function invalidateDeals(dealId?: string, slug?: string) {
  try {
    safeRevalidateTag(CACHE_TAGS.deals)
    safeRevalidateTag(CACHE_TAGS.homepage)
    if (dealId) safeRevalidateTag(CACHE_TAGS.deal(dealId))
    if (slug) safeRevalidateTag(CACHE_TAGS.dealSlug(slug))
    revalidatePath('/')
    revalidatePath('/hot-deals')
    if (slug) revalidatePath(`/d/${slug}`)
  } catch (err) {
    console.warn('Revalidation warning (deals):', err)
  }
}

export function invalidateOpportunities(opportunityId?: string) {
  try {
    safeRevalidateTag(CACHE_TAGS.opportunities)
    safeRevalidateTag(CACHE_TAGS.homepage)
    if (opportunityId) safeRevalidateTag(CACHE_TAGS.opportunity(opportunityId))
    revalidatePath('/')
  } catch (err) {
    console.warn('Revalidation warning (opportunities):', err)
  }
}

export function invalidateProducts(productId?: string) {
  try {
    safeRevalidateTag(CACHE_TAGS.products)
    if (productId) safeRevalidateTag(CACHE_TAGS.product(productId))
  } catch (err) {
    console.warn('Revalidation warning (products):', err)
  }
}

export function invalidateBusinesses(businessId?: string) {
  try {
    safeRevalidateTag(CACHE_TAGS.businesses)
    if (businessId) safeRevalidateTag(CACHE_TAGS.business(businessId))
  } catch (err) {
    console.warn('Revalidation warning (businesses):', err)
  }
}

export function invalidatePartners(partnerId?: string) {
  try {
    safeRevalidateTag(CACHE_TAGS.partners)
    if (partnerId) safeRevalidateTag(CACHE_TAGS.partner(partnerId))
  } catch (err) {
    console.warn('Revalidation warning (partners):', err)
  }
}

export function invalidateCategories() {
  try {
    safeRevalidateTag(CACHE_TAGS.categories)
    safeRevalidateTag(CACHE_TAGS.homepage)
    revalidatePath('/')
  } catch (err) {
    console.warn('Revalidation warning (categories):', err)
  }
}

