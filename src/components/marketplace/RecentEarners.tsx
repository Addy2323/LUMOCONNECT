'use client'

import { useEffect, useRef, useState } from 'react'
import { earningsTimeAgo, type EarningsConfig, type PublicEarning } from '@/lib/public-earnings'
import styles from './RecentEarners.module.css'

export function RecentEarners() {
  const [feed, setFeed] = useState<{ items: PublicEarning[]; config: EarningsConfig } | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [paused, setPaused] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const interacting = useRef(false)
  const resumeAt = useRef(0)
  const drag = useRef<{ x: number; scroll: number } | null>(null)

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    const controller = new AbortController()
    async function refresh() {
      try {
        if (document.visibilityState !== 'hidden') {
          const response = await fetch('/api/public/recent-earners', { cache: 'no-store', signal: controller.signal })
          if (!response.ok) throw new Error('Unavailable')
          const data = await response.json()
          if (!stopped) {
            setFeed({ ...data, items: Array.from(new Map<string, PublicEarning>((data.items as PublicEarning[]).map(item => [item.id, item])).values()) })
            setNow(Date.now())
          }
        }
      } catch { if (!stopped) setFeed(null) }
      finally { if (!stopped) timer = setTimeout(refresh, 15000) }
    }
    void refresh()
    return () => { stopped = true; controller.abort(); clearTimeout(timer) }
  }, [])

  useEffect(() => {
    const element = track.current
    if (!element || paused || !feed || feed.items.length < 2) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame: number
    let previous = 0
    let position = element.scrollLeft
    const animate = (time: number) => {
      const elapsed = previous ? Math.min(time - previous, 40) : 0
      previous = time
      if (!reducedMotion.matches && !interacting.current && Date.now() > resumeAt.current && document.visibilityState !== 'hidden') {
        const width = element.firstElementChild?.getBoundingClientRect().width ?? 280
        const maximum = element.scrollWidth - element.clientWidth
        if (maximum > 1) {
          position += elapsed * (width + 16) / (feed.config.secondsPerCard * 1000)
          if (position >= maximum) { position = 0; resumeAt.current = Date.now() + 1500 }
          element.scrollLeft = position
        }
      } else position = element.scrollLeft
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [feed, paused])

  if (!feed?.items.length || !feed.config.enabled) return null
  return <div className={styles.section} aria-label="Recent earners">
    <div className={styles.heading}><h3>Recent earners</h3><button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused}>{paused ? 'Resume sliding' : 'Pause sliding'}</button></div>
    <div ref={track} className={styles.track} tabIndex={0} role="region" aria-label="Verified partner earnings, scroll for more"
      onMouseEnter={() => { interacting.current = true }} onMouseLeave={() => { interacting.current = false; drag.current = null }}
      onFocus={() => { interacting.current = true }} onBlur={() => { interacting.current = false }}
      onWheel={() => { resumeAt.current = Date.now() + 4000 }}
      onPointerDown={event => { resumeAt.current = Date.now() + 4000; if (event.pointerType === 'mouse') { drag.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft }; event.currentTarget.setPointerCapture(event.pointerId) } }}
      onPointerMove={event => { if (drag.current) event.currentTarget.scrollLeft = drag.current.scroll - (event.clientX - drag.current.x) }}
      onPointerUp={() => { drag.current = null; resumeAt.current = Date.now() + 4000 }} onPointerCancel={() => { drag.current = null }}>
      {feed.items.map(item => <article key={item.id} className={styles.card}>
        <span>{item.maskedIdentity}</span><strong><small>Earned </small>{item.currency} {new Intl.NumberFormat('en-TZ', { maximumFractionDigits: 2 }).format(item.amount)}</strong>
        {feed.config.showCategory && <span>{item.category}</span>}
        {feed.config.showTime && <time dateTime={item.earnedAt}>{earningsTimeAgo(item.earnedAt, now)}</time>}
      </article>)}
    </div>
  </div>
}
