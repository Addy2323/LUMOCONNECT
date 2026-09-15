'use client'

import { useEffect, useRef, useState } from 'react'
import { DEFAULT_PROMOTIONAL_TEMPLATE } from '@/modules/promotional-toolkit/templates'
import { renderPromotionalCard, type PromotionalCardOptions } from '@/modules/promotional-toolkit/render-card'

export type { AspectRatioType } from '@/modules/promotional-toolkit/render-card'
interface PromotionalCardCanvasProps extends Omit<PromotionalCardOptions, 'template'> {
  template?: PromotionalCardOptions['template']
  onRendered?: (dataUrl: string) => void
}

export function PromotionalCardCanvas({ onRendered, template = DEFAULT_PROMOTIONAL_TEMPLATE, ...options }: PromotionalCardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [result, setResult] = useState<{ key: string; attempt: number; status: 'ready' | 'error' } | null>(null)
  const [attempt, setAttempt] = useState(0)
  // Storage can return a new object for unchanged settings.
  const renderKey = JSON.stringify({ ...options, template })
  const status = result?.key === renderKey && result.attempt === attempt ? result.status : 'loading'

  useEffect(() => {
    let cancelled = false
    onRendered?.('')
    const settings: PromotionalCardOptions = JSON.parse(renderKey)
    // Each render owns its canvas so late image loads cannot overwrite newer cards.
    const canvas = document.createElement('canvas')
    renderPromotionalCard(canvas, settings).then(() => {
      if (cancelled || !canvasRef.current) return
      const dataUrl = canvas.toDataURL('image/png')
      const preview = canvasRef.current
      preview.width = canvas.width
      preview.height = canvas.height
      preview.getContext('2d')?.drawImage(canvas, 0, 0)
      onRendered?.(dataUrl)
      setResult({ key: renderKey, attempt, status: 'ready' })
    }).catch(() => { if (!cancelled) setResult({ key: renderKey, attempt, status: 'error' }) })
    return () => { cancelled = true }
  }, [renderKey, attempt, onRendered])

  return (
    <div className="w-full flex flex-col items-center gap-3" aria-busy={status === 'loading'}>
      <canvas ref={canvasRef} role="img" aria-label={`${options.dealTitle} — Promotional card`}
        className={`h-auto max-w-full rounded-xl shadow-2xl ${status !== 'ready' ? 'hidden' : ''}`}
        style={{ width: options.aspectRatio === 'PORTRAIT_9_16' ? 270 : options.aspectRatio === 'LANDSCAPE_16_9' ? 600 : 420 }} />
      {status === 'loading' && <p role="status" className="py-20 text-sm text-slate-300">Preparing your card…</p>}
      {status === 'error' && <div role="alert" className="py-10 text-center text-sm text-white">
        <p>Could not create your card. Please try again.</p>
        <button className="mt-3 rounded-lg bg-orange-600 px-4 py-2 font-semibold" onClick={() => setAttempt(attempt + 1)}>Try again</button>
      </div>}
      {status === 'ready' && <p className="text-[11px] text-slate-400">{options.selectedLanguage === 'SW' ? 'Tayari kushiriki • PNG' : 'Ready to share • PNG'}</p>}
    </div>
  )
}
