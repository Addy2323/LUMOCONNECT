import React from 'react'

export type StatusType =
  | 'TRACKED'
  | 'PENDING'
  | 'VALIDATING'
  | 'APPROVED'
  | 'PAYABLE'
  | 'PAID'
  | 'ON_HOLD'
  | 'REJECTED'
  | 'REVERSED'
  | 'DISPUTED'
  | 'EXPIRED'
  | 'ACTIVE'
  | 'PUBLISHED'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'

export function StatusBadge({ status }: { status: StatusType | string }) {
  const normalized = status.toUpperCase()

  let style = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'

  if (['APPROVED', 'PAID', 'ACTIVE', 'PUBLISHED', 'LOW'].includes(normalized)) {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
  } else if (['PENDING', 'VALIDATING', 'PAYABLE', 'MEDIUM', 'ON_HOLD'].includes(normalized)) {
    style = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
  } else if (['REJECTED', 'REVERSED', 'DISPUTED', 'HIGH', 'CRITICAL'].includes(normalized)) {
    style = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
  } else if (['TRACKED'].includes(normalized)) {
    style = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
  }

  const label = normalized.replace(/_/g, ' ')

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${style}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75" />
      {label}
    </span>
  )
}
