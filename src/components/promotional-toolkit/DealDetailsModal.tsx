'use client'

import { useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { getOpportunityById } from '@/modules/deals/service'
import type { JoinedDealItem } from '@/components/dashboards/partner/types'
import { DealMediaViewer } from '@/components/common/DealMediaViewer'
import { buildPublicDealUrl } from '@/modules/promotional-toolkit/links'

export function DealDetailsModal({ deal, onClose }: { deal: JoinedDealItem; onClose: () => void }) {
  const opportunity = getOpportunityById(deal.opportunityId)
  const photos = [...new Set([opportunity?.featuredImageUrl || deal.coverImageUrl, ...(opportunity?.galleryImageUrls || [])].filter((url): url is string => Boolean(url)))]
  const video = opportunity?.promoVideoUrl || deal.promoVideoUrl
  const url = buildPublicDealUrl(deal.opportunityId, deal.referralId || deal.promoCode)
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])
  return <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 p-4" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-labelledby="enrolled-deal-title" className="relative max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-white sm:p-7" onClick={(event) => event.stopPropagation()}>
      <button autoFocus onClick={onClose} aria-label="Close deal details" className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-800"><X className="h-5 w-5" /></button>
      <p className="text-xs font-bold uppercase text-orange-600">{opportunity?.category || deal.category}</p>
      <h2 id="enrolled-deal-title" className="mt-2 pr-10 text-2xl font-bold">{opportunity?.title || deal.title}</h2>
      {photos.length > 0 && <div className="mt-5 grid gap-3">{photos.map((src, index) => <img key={src} src={src} alt={`${deal.title} — image ${index + 1}`} loading="lazy" className="max-h-[480px] w-full rounded-xl bg-slate-100 object-contain" />)}</div>}
      {video && <div className="mt-5 space-y-2">
        <h3 className="font-bold">Product video</h3>
        <div className="aspect-video overflow-hidden rounded-xl bg-black"><DealMediaViewer mediaUrl={video} posterUrl={photos[0]} altTitle={deal.title} /></div>
        {/^(https?:\/\/)/i.test(video) && <a href={video} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 underline">Open original video</a>}
      </div>}
      {opportunity?.summary && <p className="mt-5 text-sm text-slate-500">{opportunity.summary}</p>}
      <h3 className="mt-5 font-bold">About this deal</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{opportunity?.description || deal.deliverablesSummary || 'No description provided.'}</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white">View public deal page <ExternalLink className="h-4 w-4" /></a>
    </section>
  </div>
}
