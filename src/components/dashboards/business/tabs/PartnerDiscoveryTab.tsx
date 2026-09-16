'use client'
import { BusinessRecords } from '../BusinessRecords'
export function PartnerDiscoveryTab(_props: { opportunities: import('../types').BusinessOpportunityItem[] }) {
  return <BusinessRecords kind="partners" title="Verified partners" description="Verified partners already connected to your business opportunities." />
}
