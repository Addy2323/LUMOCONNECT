'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, BadgeCheck, Clock3, Flame, LockKeyhole, MapPin } from 'lucide-react'

export type Teaser = { id: string; title: string; titleSw?: string | null; category: string; location: string; rewardMinor: string; inventoryAvailable: number; inventoryTotal: number; availablePartnerSlots: number; capacityType: string; releaseAt: string | null; startsAt: string | null; status: string; verified: boolean }
export const tzs = (minor: string) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(Number(minor) / 100)
export const eat = (date: string) => new Intl.DateTimeFormat('en-TZ', { timeZone: 'Africa/Dar_es_Salaam', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) + ' EAT'

export function ReleaseCountdown({ releaseAt, status, offset = 0 }: { releaseAt: string | null; status: string; offset?: number }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setNow(Date.now() + offset)
    tick(); const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [offset])
  if (status === 'PARTNER_RELEASE') return <span className="font-semibold text-emerald-700">Released to Partners</span>
  if (['FULL', 'CLOSED', 'PAUSED', 'CANCELLED'].includes(status)) return <span>{status.replaceAll('_', ' ')}</span>
  if (!releaseAt || now === null) return <span>Private Member priority access</span>
  const seconds = Math.max(0, Math.ceil((new Date(releaseAt).getTime() - now) / 1000))
  if (!seconds) return <span>Private window ended · checking availability</span>
  return <span title={eat(releaseAt)}>Opens to Partners in <strong className="font-mono tabular-nums">{String(Math.floor(seconds / 3600)).padStart(2, '0')}:{String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</strong></span>
}

export function HotDealsSection({ compact = false }: { compact?: boolean }) {
  const [deals, setDeals] = useState<Teaser[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const refresh = async () => {
      try {
        const response = await fetch('/api/hot-deals', { signal: controller.signal, cache: 'no-store' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setDeals(data.deals); setOffset(new Date(data.serverNow).getTime() - Date.now()); setError('')
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load opportunities.') }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void refresh(); const timer = setInterval(() => { if (!document.hidden) void refresh() }, 60000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [])
  return <section aria-labelledby="hot-deals-heading" className={`${compact ? '' : 'mx-auto max-w-7xl px-4 py-12 sm:px-6'} text-slate-900`}>
    <div className="overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl"><p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-orange-700"><Flame size={16} /> PRIVATE HOT DEALS</p>
          <h2 id="hot-deals-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">First access. Real opportunities.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Get first access to selected high-reward Lumo opportunities before they are released to the wider Partner Network.</p>
        </div>
        <Link href="/hot-deals/account" className="flex items-center gap-2 text-sm font-semibold text-orange-700">My deals & rewards <ArrowUpRight size={18} /></Link>
      </div>
      <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
        <p className="flex items-center gap-2"><Clock3 size={18} className="text-orange-600" /> 24-hour priority access</p>
        <p className="flex items-center gap-2"><BadgeCheck size={18} className="text-orange-600" /> Reviewed commercial opportunities</p>
        <p className="flex items-center gap-2"><LockKeyhole size={18} className="text-orange-600" /> Private terms & materials</p>
      </div>
      {loading && <p className="py-8 text-sm text-slate-500" role="status">Loading Hot Deals…</p>}
      {error && <p className="mt-6 rounded-xl bg-white p-4 text-sm text-slate-600" role="status">{error}</p>}
      {!loading && !error && !deals.length && <p className="mt-6 rounded-xl bg-white p-5 text-sm text-slate-600">New verified opportunities will appear here when they are published.</p>}
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{deals.slice(0, compact ? 3 : 6).map(deal => <article key={deal.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">{deal.status === 'PARTNER_RELEASE' ? 'Partner Deal' : 'Private Hot Deal'}</span>{deal.verified && <span className="flex items-center gap-1 text-xs text-emerald-700"><BadgeCheck size={14} /> Verified</span>}</div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{deal.category}</p><h3 className="mt-2 text-xl font-bold">{deal.title}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} /> {deal.location}</p>
        <div className="my-5 border-y border-slate-100 py-4"><p className="text-xs text-slate-500">Reward per verified outcome</p><p className="mt-1 text-2xl font-bold text-orange-600">{tzs(deal.rewardMinor)}</p><p className="mt-2 text-sm text-slate-600">{deal.capacityType === 'UNLIMITED' ? 'Open capacity, subject to reward budget' : `${deal.inventoryAvailable} of ${deal.inventoryTotal} ${deal.capacityType === 'LEAD_LIMIT' ? 'outcomes' : 'units'} remaining`}</p></div>
        <div className="mb-4 text-xs text-slate-600"><ReleaseCountdown releaseAt={deal.releaseAt} status={deal.status} offset={offset} /></div>
        <Link href={`/hot-deals/${deal.id}`} className="mt-auto rounded-xl bg-orange-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-orange-700">View & Activate Deal</Link>
        <p className="mt-3 text-center text-xs text-slate-500">Full details require an eligible active subscription.</p>
      </article>)}</div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-orange-100 pt-5"><p className="max-w-2xl text-xs leading-5 text-slate-500">Access does not guarantee a sale, reward or transaction. Rewards require verified commercial activity. Lumo records participation and payout instructions; funding is handled through licensed payment partners.</p><Link href="/hot-deals/private-member" className="text-sm font-semibold text-orange-700">Become a Private Member →</Link></div>
    </div>
  </section>
}
