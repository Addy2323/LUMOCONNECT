'use client'
import { useEffect, useState } from 'react'
import type { EarningsConfig } from '@/lib/public-earnings'

export function RecentEarnersSettings() {
  const [config, setConfig] = useState<EarningsConfig | null>(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    fetch('/api/admin/recent-earners').then(async response => {
      if (!response.ok) throw new Error()
      setConfig(await response.json())
    }).catch(() => setMessage('Recent earner settings unavailable.'))
  }, [])
  async function save() {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/recent-earners', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) })
      if (!response.ok) throw new Error()
      setMessage('Recent earner settings saved.')
    } catch { setMessage('Could not save settings.') }
    finally { setSaving(false) }
  }
  return <section className="rounded-xl border border-slate-200 p-4 space-y-3">
    <h3 className="font-bold">Recent earners slider</h3>
    {config && <>
      <div className="flex flex-wrap gap-4">{(['enabled', 'showCategory', 'showTime'] as const).map((key, index) => <label key={key}><input type="checkbox" checked={config[key]} onChange={e => setConfig({ ...config, [key]: e.target.checked })} /> {['Enable slider', 'Show category', 'Show time'][index]}</label>)}</div>
      <div className="grid sm:grid-cols-2 gap-3">{([
        ['minimumTZS', 'Minimum reward (TZS)', 0, 1000000000], ['maximumCards', 'Maximum cards', 1, 30], ['maskDigits', 'Visible phone digits', 3, 4], ['secondsPerCard', 'Seconds per card', 4, 20],
      ] as const).map(([key, label, min, max]) => <label key={key} className="flex flex-col gap-1">{label}<input className="rounded border p-2" type="number" min={min} max={max} value={config[key]} onChange={e => setConfig({ ...config, [key]: Number(e.target.value) })} /></label>)}
      <label>Display mode <select className="rounded border p-2" value={config.mode} onChange={e => setConfig({ ...config, mode: e.target.value as EarningsConfig['mode'] })}><option value="APPROVED">Approved earnings</option><option value="PAID">Paid earnings only</option></select></label></div>
      <button type="button" disabled={saving} onClick={save} className="rounded bg-orange-600 px-4 py-2 text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save slider settings'}</button>
    </>}
    <p role="status">{message}</p>
  </section>
}
