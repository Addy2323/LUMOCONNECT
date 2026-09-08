'use client'

import { Home } from 'lucide-react'

export function BackToHomeButton({ onNavigate }: { onNavigate?: () => void }) {
  if (!onNavigate) return null

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate()
        window.scrollTo({ top: 0, behavior: 'instant' })
      }}
      className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-orange-700 transition-colors hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300 dark:hover:bg-orange-950/60"
      aria-label="Back to Home"
      title="Return to the landing page"
    >
      <Home className="h-4 w-4" aria-hidden="true" />
      <span className="sm:hidden">Home</span>
      <span className="hidden sm:inline">Back to Home</span>
    </button>
  )
}
