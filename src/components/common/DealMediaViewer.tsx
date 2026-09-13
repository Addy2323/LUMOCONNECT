'use client'

import React, { useEffect, useRef } from 'react'
import { getVideoEmbedInfo } from '@/modules/deals/service'

interface DealMediaViewerProps {
  mediaUrl: string
  posterUrl?: string
  altTitle?: string
  className?: string
  controls?: boolean
}

export function DealMediaViewer({
  mediaUrl,
  posterUrl,
  altTitle = 'Commercial Video Pitch',
  className = 'w-full h-full object-cover',
  controls = true,
}: DealMediaViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const vInfo = getVideoEmbedInfo(mediaUrl)

  useEffect(() => {
    if (!vInfo.isIframe && videoRef.current) {
      const v = videoRef.current
      v.muted = true
      v.playsInline = true
      const playPromise = v.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback if autoplay was blocked by browser policy
        })
      }
    }
  }, [mediaUrl, vInfo.isIframe])

  if (vInfo.isIframe) {
    return (
      <iframe
        src={vInfo.embedUrl}
        title={altTitle}
        className={`w-full h-full border-0 ${className}`}
        allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    )
  }

  return (
    <video
      ref={videoRef}
      src={vInfo.embedUrl}
      poster={posterUrl}
      controls={controls}
      autoPlay
      muted
      loop
      playsInline
      className={className}
      onLoadedMetadata={(e) => {
        e.currentTarget.muted = true
        e.currentTarget.play().catch(() => {})
      }}
      onCanPlay={(e) => {
        e.currentTarget.muted = true
        e.currentTarget.play().catch(() => {})
      }}
    />
  )
}
