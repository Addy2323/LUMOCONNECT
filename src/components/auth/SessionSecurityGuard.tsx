'use client'

import React, { useEffect, useState, useRef } from 'react'

const IDLE_TIMEOUT_MS = 29 * 60 * 1000 // 29 minutes (show warning 1 minute before 30-min server idle expiration)
const WARNING_DURATION_SECONDS = 60
const AUTH_CHANNEL_NAME = 'lumo_auth_channel'

export function broadcastLogout() {
  try {
    const channel = new BroadcastChannel(AUTH_CHANNEL_NAME)
    channel.postMessage({ type: 'LOGOUT' })
    channel.close()
  } catch {
    // Fallback for older browsers
    localStorage.setItem('lumo_logout_event', String(Date.now()))
  }
}

export default function SessionSecurityGuard({ children }: { children?: React.ReactNode }) {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(WARNING_DURATION_SECONDS)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  const performLogout = async (reason = 'expired') => {
    try {
      broadcastLogout()
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    } finally {
      window.location.href = `/login?reason=${reason}`
    }
  }

  // 1. Cross-tab logout sync
  useEffect(() => {
    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel(AUTH_CHANNEL_NAME)
      channel.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          window.location.href = '/login?reason=expired'
        }
      }
    } catch {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === 'lumo_logout_event') {
          window.location.href = '/login?reason=expired'
        }
      }
      window.addEventListener('storage', handleStorage)
      return () => window.removeEventListener('storage', handleStorage)
    }

    return () => {
      channel?.close()
    }
  }, [])

  // 2. Global Fetch 401 Interceptor
  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      if (response.status === 401) {
        const urlStr = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || ''
        // Don't intercept auth login/check failures
        if (!urlStr.includes('/api/auth/login') && !urlStr.includes('/api/auth/me')) {
          performLogout('expired')
        }
      }
      return response
    }
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // 3. User Activity & Idle Warning Timer
  const resetIdleTimer = () => {
    if (showWarning) return // Don't reset if warning modal is active

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)

    idleTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(WARNING_DURATION_SECONDS)
    }, IDLE_TIMEOUT_MS)
  }

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }))

    resetIdleTimer()

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetIdleTimer))
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [showWarning])

  // 4. Warning Modal Countdown
  useEffect(() => {
    if (!showWarning) return

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!)
          performLogout('idle_timeout')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [showWarning])

  const extendSession = () => {
    setShowWarning(false)
    setCountdown(WARNING_DURATION_SECONDS)
    // Touch server to update lastActiveAt
    fetch('/api/auth/me').catch(() => {})
    resetIdleTimer()
  }

  return (
    <>
      {children}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-white">
            <h3 className="text-xl font-bold text-amber-400">Session Expiring Soon</h3>
            <p className="mt-2 text-sm text-zinc-300">
              You have been inactive for a while. For security reasons, your session will automatically log out in{' '}
              <span className="font-mono text-lg font-bold text-amber-400">{countdown}s</span>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => performLogout('user_initiated')}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition"
              >
                Log Out Now
              </button>
              <button
                onClick={extendSession}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 transition"
              >
                Keep Me Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
