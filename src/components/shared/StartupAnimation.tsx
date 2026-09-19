'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import styles from './StartupAnimation.module.css'

const mobileQuery = '(max-width: 767px)'

function subscribeToDeviceChange(callback: () => void) {
  const query = window.matchMedia(mobileQuery)
  query.addEventListener('change', callback)
  window.addEventListener('resize', callback)
  return () => {
    query.removeEventListener('change', callback)
    window.removeEventListener('resize', callback)
  }
}

function isMobilePhoneDevice() {
  if (typeof window === 'undefined') return false

  const ua = navigator.userAgent || ''

  // 1. TVs (Smart TV, Android TV, Tizen, WebOS, AppleTV, etc.) -> ALWAYS animated video
  if (/SmartTV|GoogleTV|AppleTV|BRAVIA|NetCast|Viera|Roku|HbbTV|Tizen|Web0S|POV_TV|CrKey/i.test(ua)) {
    return false
  }

  // 2. Desktop & Laptop screens (including touch laptops like Surface) -> ALWAYS animated video
  if (window.innerWidth >= 768 && window.innerHeight >= 500) {
    return false
  }

  // 3. Mobile phone user-agent or small screen width (< 768px)
  const isPhoneUA = /iPhone|iPod|Windows Phone|webOS|BlackBerry|Opera Mini/i.test(ua) ||
    (/Android/i.test(ua) && /Mobile/i.test(ua))

  return isPhoneUA || window.innerWidth < 768
}

export function StartupAnimation({ onComplete }: { onComplete: () => void }) {
  const isMobile = useSyncExternalStore(subscribeToDeviceChange, isMobilePhoneDevice, () => false)
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
    const timer = setTimeout(finish, reducedMotion ? 250 : isMobile ? 1800 : 8000)
    return () => clearTimeout(timer)
  }, [isMobile, finish])

  useEffect(() => () => {
    if (completionTimer.current) clearTimeout(completionTimer.current)
    completing.current = false
  }, [])

  return (
    <div
      className={`${styles.overlay} ${fadingOut ? styles.leaving : ''}`}
      aria-busy="true"
      onClick={finish}
      tabIndex={0}
      onKeyDown={(e) => {
        if (['Enter', ' ', 'Escape'].includes(e.key)) finish()
      }}
    >
      {isMobile ? (
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
        <video
          className={styles.video}
          src="/logo/startup.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          controls={false}
          onEnded={finish}
          onError={finish}
          aria-label="Lumo Dealers startup"
        />
      )}
    </div>
  )
}
