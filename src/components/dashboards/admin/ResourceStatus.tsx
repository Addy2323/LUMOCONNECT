'use client'

export function ResourceStatus({ loading, error, retry }: { loading: boolean; error: string | null; retry: () => void }) {
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error} <button type="button" onClick={retry} className="ml-2 font-bold underline">Retry</button></div>
  if (loading) return <p role="status" className="p-3 text-sm text-slate-500">Loading records…</p>
  return null
}
