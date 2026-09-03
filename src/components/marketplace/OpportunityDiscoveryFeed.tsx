'use client'

import { ArrowRight, Flame, LocateFixed, MapPin, Navigation } from 'lucide-react'
import { TANZANIA_REGIONS } from '@/modules/deals/taxonomy'

const TRENDING = [
  { title: '500 bags of cement', category: 'Building materials', count: '18 new' },
  { title: 'Toyota Hiace', category: 'Cars', count: '14 new' },
  { title: '10 acres farmland', category: 'Land', count: '12 new' },
  { title: 'China supplier', category: 'Suppliers', count: '10 new' },
  { title: '1,000 smartphones', category: 'Phones', count: '9 new' },
  { title: 'Hotel for sale', category: 'Hotel / lodge', count: '7 new' },
  { title: 'Wholesale clothes', category: 'Clothes', count: '6 new' },
]

const NEARBY_BY_REGION: Record<string, Array<{ distance: number; title: string; category: string }>> = {
  'Dar es Salaam': [
    { distance: 3, title: 'Samsung S24', category: 'Phones' },
    { distance: 5, title: 'apartment', category: 'Apartment' },
    { distance: 7, title: 'Toyota Noah', category: 'Cars' },
    { distance: 12, title: 'building materials supplier', category: 'Suppliers' },
  ],
  Arusha: [
    { distance: 2, title: 'tour vehicle', category: 'Cars' },
    { distance: 6, title: 'coffee buyer', category: 'Coffee' },
    { distance: 9, title: 'hotel partnership', category: 'Partnerships' },
    { distance: 14, title: 'agricultural equipment', category: 'Agricultural equipment' },
  ],
  Mwanza: [
    { distance: 4, title: 'fish wholesaler', category: 'Fish' },
    { distance: 6, title: 'warehouse', category: 'Warehouse' },
    { distance: 10, title: 'transport partner', category: 'Transport' },
    { distance: 15, title: 'wholesale phones', category: 'Phones' },
  ],
}

const DEFAULT_NEARBY = [
  { distance: 4, title: 'regional distributor', category: 'Distributors' },
  { distance: 7, title: 'commercial property', category: 'Commercial property' },
  { distance: 11, title: 'transport provider', category: 'Transport' },
  { distance: 16, title: 'wholesale supplier', category: 'Wholesale suppliers' },
]

interface OpportunityDiscoveryFeedProps {
  region: string
  onRegionChange: (region: string) => void
  onSelectCategory: (category: string) => void
  onViewAll: () => void
}

export function OpportunityDiscoveryFeed({
  region,
  onRegionChange,
  onSelectCategory,
  onViewAll,
}: OpportunityDiscoveryFeedProps) {
  const activeRegion = region === 'ALL' ? 'Dar es Salaam' : region
  const nearby = NEARBY_BY_REGION[activeRegion] || DEFAULT_NEARBY

  const selectOpportunity = (category: string) => {
    onSelectCategory(category)
    requestAnimationFrame(onViewAll)
  }

  return (
    <section aria-labelledby="opportunity-feed-title" className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm dark:border-orange-950 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 dark:border-slate-800">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-orange-600">
              <Flame className="h-4 w-4" /> Opportunity feed
            </div>
            <h2 id="opportunity-feed-title" className="text-xl font-black text-slate-950 dark:text-white">
              Trending opportunities
            </h2>
            <p className="mt-1 text-sm text-slate-500">Discover what buyers and businesses need right now.</p>
          </div>
          <button type="button" onClick={onViewAll} className="hidden items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 sm:flex">
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4">
          {TRENDING.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => selectOpportunity(item.category)}
              className="group flex items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-orange-50 dark:hover:bg-orange-950/30"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-500 group-hover:bg-orange-500 group-hover:text-white dark:bg-slate-800">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Looking for</span>
                <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{item.title}</span>
              </span>
              <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-sm">
        <div className="border-b border-white/10 p-5 sm:p-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-orange-400">
            <LocateFixed className="h-4 w-4" /> Near you
          </div>
          <h2 className="text-xl font-black">Nearby opportunities</h2>
          <div className="relative mt-4">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
            <select
              aria-label="Your region"
              value={activeRegion}
              onChange={(event) => onRegionChange(event.target.value)}
              className="w-full appearance-none rounded-xl border border-white/15 bg-white/10 py-2.5 pl-9 pr-4 text-sm font-bold text-white outline-none focus:border-orange-400"
            >
              {TANZANIA_REGIONS.filter((value) => value !== 'All Tanzania').map((value) => (
                <option key={value} value={value} className="text-slate-950">{value}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {nearby.map((item) => (
            <button
              key={`${activeRegion}-${item.title}`}
              type="button"
              onClick={() => selectOpportunity(item.category)}
              className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white/10"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                <Navigation className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-orange-300">{item.distance} km away</span>
                <span className="block truncate text-sm font-semibold">Looking for {item.title}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
