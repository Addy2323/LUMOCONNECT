'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'

interface Preview {
  legalName: string
  opportunities: number
  verificationCases: number
  members: number
  eligibleAccounts: number
  preservedAccounts: number
  blockers: string[]
}

export function DeleteMerchantDialog({ organizationId, onClose, onDeleted }: {
  organizationId: string; onClose: () => void; onDeleted: (pendingFiles: boolean) => void
}) {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [confirmation, setConfirmation] = useState('')
  const [reason, setReason] = useState('')
  const [deleteAccounts, setDeleteAccounts] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endpoint = `/api/admin/merchants/${encodeURIComponent(organizationId)}`

  useEffect(() => {
    const controller = new AbortController()
    fetch(endpoint, { signal: controller.signal, cache: 'no-store' }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Unable to load merchant details.')
      setPreview(data)
    }).catch((err: Error) => { if (!controller.signal.aborted) setError(err.message) })
    return () => controller.abort()
  }, [endpoint])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || !preview || preview.blockers.length || confirmation !== preview.legalName || reason.trim().length < 5) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(endpoint, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation, reason, deleteAccounts }) })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Deletion failed.')
      onDeleted(data.pendingFileCleanup !== 0)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete merchant.') }
    finally { setBusy(false) }
  }

  return <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 p-4">
    <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="delete-merchant-title" className="max-h-[90dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
      <h2 id="delete-merchant-title" className="flex items-center gap-2 text-lg font-bold text-red-600"><Trash2 className="h-5 w-5" /> Delete merchant permanently</h2>
      {!preview && !error && <p role="status">Loading deletion preview…</p>}
      {preview && <>
        <p className="text-sm">This removes <strong>{preview.legalName}</strong>, {preview.opportunities} deal(s), {preview.verificationCases} verification case(s), and {preview.members} business membership(s). This cannot be undone. The deletion audit record is retained.</p>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={deleteAccounts} disabled={busy} onChange={(event) => setDeleteAccounts(event.target.checked)} className="mt-1" /> Also delete {preview.eligibleAccounts} merchant-only login account(s) and revoke their sessions.</label>
        <p className="text-xs text-slate-500">{preview.preservedAccounts} shared or protected account(s) will remain. Accounts with other roles, businesses, or transaction history are protected.</p>
        {preview.blockers.length > 0 && <div role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Deletion is blocked: {preview.blockers.join(' ')}</div>}
        <label className="block text-sm font-semibold">Type “{preview.legalName}” to confirm
          <input autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} autoComplete="off" className="mt-2 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2" />
        </label>
        <label className="block text-sm font-semibold">Reason for deletion
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} disabled={busy} minLength={5} maxLength={1000} required rows={3} className="mt-2 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2" />
        </label>
      </>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" disabled={busy} onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-bold">Cancel</button>
        <button type="submit" disabled={busy || !preview || preview.blockers.length > 0 || confirmation !== preview.legalName || reason.trim().length < 5} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{busy ? 'Deleting…' : 'Delete permanently'}</button>
      </div>
    </form>
  </div>
}
