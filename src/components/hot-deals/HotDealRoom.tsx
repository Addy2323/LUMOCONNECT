'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { LockKeyhole, BadgeCheck } from 'lucide-react'
import { eat, ReleaseCountdown, type Teaser, tzs } from './HotDealsSection'

type Details = Teaser & { description: string; terms: string; versionId: string; termsHash: string; rewardTrigger: string; joined: boolean; merchant?: string;
  referrals?: { code: string }[]; documents?: { id: string; label: string }[];
  leads?: { id: string; customerName: string; validationStatus: string }[];
  claims?: { id: string; leadId: string; disputed: boolean }[];
  conversions?: { id: string; status: string; rewards: { status: string; grossAmountMinor: string }[] }[];
  timeline?: { createdAt: string; afterData: { data: { status: string } } }[] }
const inputStyle = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm'
const buttonStyle = 'rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50'

export function HotDealRoom({ id }: { id: string }) {
  const [details, setDetails] = useState<Details | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const response = await fetch(`/api/hot-deals/${id}`, { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) { setDetails(null); throw new Error(data.error) }
    if (data.joined) {
      const room = await fetch(`/api/hot-deals/${id}?room=true`, { cache: 'no-store' })
      if (room.ok) { setDetails(await room.json()); return }
    }
    setDetails(data)
  }, [id])
  useEffect(() => { const initial = setTimeout(() => { void load().catch(e => setError(e.message)) }, 0); const timer = setInterval(() => { if (!document.hidden) void load().catch(e => setError(e.message)) }, 60000); return () => { clearTimeout(initial); clearInterval(timer) } }, [load])
  const post = async (body: object) => {
    setBusy(true); setNotice('')
    try {
      const response = await fetch(`/api/hot-deals/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      await load(); setNotice('Saved successfully.'); setError('')
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Unable to save.') }
    finally { setBusy(false) }
  }
  if (!details) return <main className="mx-auto max-w-xl px-4 py-20 text-center"><LockKeyhole className="mx-auto text-orange-600" size={36} /><h1 className="mt-4 text-2xl font-bold">Private deal access</h1><p className="mt-3 text-slate-600" role="status">{error || 'Checking your subscription and deal availabilityâ€¦'}</p>{error && <div className="mt-6 flex justify-center gap-4"><Link className={buttonStyle} href="/signin">Sign in</Link><Link className="px-4 py-3 text-orange-700" href="/subscriptions">Subscribe or upgrade</Link></div>}<Link href="/hot-deals" className="mt-6 block text-sm">Back to deal teasers</Link></main>
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
    <section className="rounded-3xl border border-orange-100 bg-white p-6 sm:p-8"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-700"><BadgeCheck size={18} /> Verified Lumo opportunity</p><h1 className="mt-3 text-3xl font-bold">{details.title}</h1><p className="mt-2 text-slate-500">{details.location}</p><p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">{details.description}</p><div className="mt-6 grid gap-4 rounded-2xl bg-orange-50 p-5 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Partner reward</p><p className="mt-1 text-xl font-bold text-orange-700">{tzs(details.rewardMinor)}</p></div><div><p className="text-xs text-slate-500">Live availability</p><p className="mt-1 font-semibold">{details.inventoryAvailable} of {details.inventoryTotal} units remaining</p></div><div className="text-sm"><ReleaseCountdown releaseAt={details.releaseAt} status={details.status} />{details.releaseAt && <p className="mt-1 text-xs text-slate-500">{eat(details.releaseAt)}</p>}</div></div><p className="mt-4 text-sm text-slate-600">{details.rewardTrigger}</p><SaveDealButton dealId={id} /></section>
    {notice && <p role="status" className="rounded-xl border bg-white p-4 text-sm">{notice}</p>}
    {!details.referrals ? <section className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">Participation agreement</h2><p className="my-4 max-h-80 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-600">{details.terms}</p><label className="flex gap-3 text-sm"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />I have read and accept this version of the participation terms.</label><button className={`${buttonStyle} mt-5`} disabled={!accepted || busy} onClick={() => void post({ action: 'activate', accepted: true, versionId: details.versionId, termsHash: details.termsHash })}>Accept & activate deal</button></section> : <>
      <section className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">Your Deal Room</h2><p className="mt-2 text-sm text-slate-600">Merchant: {details.merchant}</p><div className="mt-5 space-y-3">{details.referrals.map(ref => <div key={ref.code} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Your unique referral code</p><code className="mt-2 block break-all text-sm">{ref.code}</code><p className="mt-2 break-all text-xs">{typeof window !== 'undefined' ? window.location.origin : ''}/r/hot/{ref.code}</p></div>)}</div><h3 className="mt-5 font-semibold">Approved materials</h3>{details.documents?.length ? details.documents.map(doc => <a className="mt-2 block text-sm text-orange-700 underline" key={doc.id} href={`/api/hot-deals/${id}/documents/${doc.id}`}>{doc.label}</a>) : <p className="mt-2 text-sm text-slate-500">No approved materials yet.</p>}</section>
      <section className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">Register a buyer or tenant</h2><p className="mt-2 text-sm text-slate-500">The first valid registered customer referral retains attribution. A lead alone does not earn a reward.</p><form className="mt-5 grid gap-4" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void post({ action: 'lead', customerName: form.get('name'), customerPhone: form.get('phone'), consent: form.get('consent') === 'on' }) }}><label className="text-sm">Customer name<input name="name" required minLength={2} maxLength={120} className={inputStyle} /></label><label className="text-sm">Tanzania mobile number<input name="phone" type="tel" required placeholder="+255 7XX XXX XXX" className={inputStyle} /></label><label className="flex gap-3 text-sm"><input name="consent" type="checkbox" required />The customer has consented to sharing these details for this opportunity.</label><button className={buttonStyle} disabled={busy}>Register referral</button></form></section>
      <section className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">Leads & validation</h2>{!details.leads?.length && <p className="mt-3 text-sm text-slate-500">Your registered leads will appear here.</p>}{details.leads?.map(lead => <div key={lead.id} className="mt-4 border-t pt-4 text-sm"><p className="font-semibold">{lead.customerName}</p><p className="mt-1 text-slate-500">{lead.validationStatus}</p><EvidenceUpload dealId={id} claimId={details.claims?.find(c => c.leadId === lead.id)?.id} onNotice={setNotice} />{details.claims?.filter(c => c.leadId === lead.id).map(claim => <form key={claim.id} className="mt-3 flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void post({ action: 'dispute', claimId: claim.id, reason: form.get('reason') }) }}><input className={`${inputStyle} flex-1`} name="reason" required minLength={10} maxLength={1000} aria-label="Dispute reason" placeholder="Describe an issue with this referral" /><button disabled={busy} className="rounded-xl border px-4 py-2">{claim.disputed ? 'Update dispute' : 'Report / dispute'}</button></form>)}</div>)}{details.conversions?.map(conversion => <div key={conversion.id} className="mt-4 rounded-xl bg-slate-50 p-4 text-sm"><p>Conversion: {conversion.status}</p>{conversion.rewards.map((r, i) => <p key={i}>{tzs(r.grossAmountMinor)} Â· {r.status}</p>)}</div>)}</section>
      <section className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">Deal timeline</h2><ol className="mt-4 space-y-3 text-sm">{details.timeline?.map((event, i) => <li key={i}><span className="font-semibold">{event.afterData.data.status.replaceAll('_', ' ')}</span><time className="ml-3 text-slate-500">{eat(event.createdAt)}</time></li>)}</ol></section>
    </>}
    <p className="text-xs leading-5 text-slate-500">Access does not guarantee a sale, reward or transaction. Objective evidence, attribution, fraud review and the dispute period apply before a reward can become payable.</p>
  </main>
}

function EvidenceUpload({ dealId, claimId, onNotice }: { dealId: string; claimId?: string; onNotice: (message: string) => void }) {
  const [busy, setBusy] = useState(false)
  return <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={async e => {
    e.preventDefault(); if (!claimId) return; setBusy(true)
    try {
      const form = new FormData(e.currentTarget)
      const upload = await fetch('/api/hot-deals/files', { method: 'POST', body: form }); const asset = await upload.json()
      if (!upload.ok) throw new Error(asset.error)
      const result = await fetch(`/api/hot-deals/${dealId}/evidence`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ claimId, fileId: asset.id }) })
      const data = await result.json(); if (!result.ok) throw new Error(data.error)
      onNotice('Evidence submitted for review.')
    } catch (e) { onNotice(e instanceof Error ? e.message : 'Upload failed.') } finally { setBusy(false) }
  }}><label className="text-xs text-slate-600">Payment, sale or tenancy evidence (PDF, PNG, JPEG; 5 MB)<input className="mt-2 block max-w-full" type="file" name="file" required accept="application/pdf,image/png,image/jpeg" /></label><button disabled={busy || !claimId} className="rounded-lg border px-3 py-2 text-xs">Submit evidence</button></form>
}

function SaveDealButton({ dealId }: { dealId: string }) {
  const [message, setMessage] = useState('')
  return <div className="mt-4 flex items-center gap-3 text-sm"><button className="rounded-xl border px-4 py-2" onClick={async () => {
    try {
      const response = await fetch('/api/hot-deals/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', dealId, saved: true }) })
      const data = await response.json(); setMessage(response.ok ? 'Saved to your account.' : data.error)
    } catch { setMessage('Unable to save. Please try again.') }
  }}>Save deal</button><span role="status">{message}</span></div>
}

