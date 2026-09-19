'use client'

import { useCallback, useEffect, useState } from 'react'

/** Poll committed server data; pause hidden tabs and refresh immediately on focus. */
export function useAdminResource<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt(value => value + 1), [])
  useEffect(() => {
    let disposed = false
    let running = false
    const controller = new AbortController()
    const refresh = async () => {
      if (running || document.visibilityState === 'hidden') return
      running = true
      try {
        const response = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error(`Unable to load records (${response.status}). Please retry.`)
        const result: T = await response.json()
        if (!disposed) { setData(result); setLoadedUrl(url); setError(null) }
      } catch (failure) {
        if (!disposed) {
          setData(null)
          setError(failure instanceof Error ? failure.message : 'Unable to load records.')
        }
      } finally {
        running = false
        if (!disposed) setLoading(false)
      }
    }
    void refresh()
    const interval = window.setInterval(() => void refresh(), 5000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      disposed = true
      controller.abort()
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [url, attempt])
  return { data: loadedUrl === url ? data : null, error, loading: loading || (loadedUrl !== url && !error), retry }
}
