'use client'

import { useEffect, useRef } from 'react'
import { drawReferralQr } from '@/modules/promotional-toolkit/render-card'

export function ReferralQr({ url }: { url: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, 512, 512)
    drawReferralQr(ctx, url, 0, 0, 512)
  }, [url])
  return <canvas ref={ref} width={512} height={512} role="img" aria-label="Scan to view this deal" className="w-48 h-48 mx-auto bg-white" />
}
