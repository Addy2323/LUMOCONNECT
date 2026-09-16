'use client'
import { useEffect, useState } from 'react'

type RecordItem = { id: string; title: string; detail: string; status: string; amount?: string; currency?: string }
type Props = { kind: string; title: string; description: string }
export function BusinessRecords(props: Props) {
  return <BusinessRecordsContent key={props.kind} {...props} />
}
function BusinessRecordsContent({ kind, title, description }: Props) {
  const [items, setItems] = useState<RecordItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/business/records?kind=${encodeURIComponent(kind)}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('Unable to load your business records.'); return response.json() })
      .then(data => { if (!controller.signal.aborted) setItems(data.items) })
      .catch(error => { if (!controller.signal.aborted) setError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [kind, revision])
  return <section className="rounded-2xl border bg-white dark:bg-slate-900 p-5 space-y-4">
    <h2 className="text-xl font-bold">{title}</h2><p className="text-sm text-slate-500">{description}</p>
    <button type="button" onClick={() => { setItems([]); setLoading(true); setError(''); setRevision(value => value + 1) }} className="rounded border px-3 py-2 text-sm">Refresh</button>
    {loading ? <p role="status">Loading your business records…</p> : error ? <p role="alert">{error}</p> : items.length === 0 ? <p className="p-8 text-center text-slate-500">No records for your business yet.</p> : <ul className="divide-y">{items.map(item => <li key={item.id} className="py-4 flex flex-wrap justify-between gap-3">
      <div><strong>{item.title}</strong><p className="text-sm text-slate-500">{item.detail}</p></div>
      <div className="text-right"><span className="text-xs">{item.status.replaceAll('_', ' ')}</span>{item.amount !== undefined && <p className="font-bold">{item.currency} {item.amount}</p>}</div>
    </li>)}</ul>}
    {!loading && !error && items.length === 100 && <p className="text-xs text-slate-500">Showing the latest 100 records.</p>}
  </section>
}
