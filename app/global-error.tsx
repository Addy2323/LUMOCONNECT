'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Root Error]', error)
  }, [error])

  return (
    <html lang="sw" translate="no" className="notranslate">
      <body className="bg-slate-50 font-sans min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-xl border border-slate-200 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Hitilafu ya Mfumo</h2>
          <p className="text-sm text-slate-600 mb-6">
            Kuna tatizo limetokea wakati wa kupakia ukurasa. Tafadhali jaribu tena.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 bg-[#FF6A00] text-white rounded-xl font-bold text-sm shadow-md"
          >
            Jaribu Tena (Reload)
          </button>
        </div>
      </body>
    </html>
  )
}
