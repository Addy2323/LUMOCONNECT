'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import styles from './StartupAnimation.module.css'

const deviceQuery = '(max-width: 1024px), (pointer: coarse)'

function subscribeToDeviceChange(callback: () => void) {
  const query = window.matchMedia(deviceQuery)
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}

function isMobileOrTablet() {
  return window.matchMedia(deviceQuery).matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
}

export function StartupAnimation({ onComplete }: { onComplete: () => void }) {
  const mobile = useSyncExternalStore(subscribeToDeviceChange, isMobileOrTablet, () => true)
  const [fadingOut, setFadingOut] = useState(false)
  const completing = useRef(false)
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  const finish = useCallback(() => {
    if (completing.current) return
    completing.current = true
    setFadingOut(true)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    completionTimer.current = setTimeout(() => onCompleteRef.current(), reducedMotion ? 0 : 350)
  }, [])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = setTimeout(finish, reducedMotion ? 250 : mobile ? 1800 : 8000)
    return () => clearTimeout(timer)
  }, [mobile, finish])

  useEffect(() => () => {
    if (completionTimer.current) clearTimeout(completionTimer.current)
    completing.current = false
  }, [])

  return (
    <div className={`${styles.overlay} ${fadingOut ? styles.leaving : ''}`} aria-busy="true">
      {mobile ? (
        <div className={styles.mobile}>
          <div className={styles.brand}>
            <div className={styles.emblem} aria-hidden="true">
              <span className={styles.top} />
              <span className={styles.left} />
              <span className={styles.right} />
              <span className={styles.bottom} />
            </div>
            <h1 className={styles.name}>LUMO</h1>
            <p className={styles.dealers}>DEALERS</p>
            <p className={styles.tagline}>Discover opportunities. Connect. Earn.</p>
          </div>
          <div className={styles.loading} role="status" aria-live="polite">
            <span className={styles.spinner} aria-hidden="true" />
            <p>Loading opportunities…</p>
          </div>
        </div>
      ) : (
        <video className={styles.video} src="/logo/startup.mp4" autoPlay muted playsInline onEnded={finish} onError={finish} aria-label="Lumo Dealers startup" />
      )}
    </div>
  )
}
