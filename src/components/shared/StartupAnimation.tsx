'use client'

import React, { useRef, useState, useEffect } from 'react'

interface StartupAnimationProps {
  onComplete: () => void
}

export function StartupAnimation({ onComplete }: StartupAnimationProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    // Fallback: if video doesn't start or takes too long, skip after 8s
    const fallbackTimer = setTimeout(() => {
      handleComplete()
    }, 8000)

    return () => clearTimeout(fallbackTimer)
  }, [])

  const handleComplete = () => {
    if (fadingOut) return
    setFadingOut(true)
    // Let the fade-out animation finish before notifying parent
    setTimeout(() => {
      onComplete()
    }, 600)
  }

  return (
    <div
      className={`startup-animation-overlay ${fadingOut ? 'startup-fade-out' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        transition: 'opacity 0.6s ease-out',
        opacity: fadingOut ? 0 : 1,
      }}
    >
      <video
        ref={videoRef}
        src="/logo/startup.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleComplete}
        onError={handleComplete}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  )
}
