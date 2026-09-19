'use client'

import { useEffect, useState } from 'react'
import { ChartNoAxesColumnIncreasing, CircleCheck, Coins, FileText, Info, Users } from 'lucide-react'
import { compactOpportunityValue, type MarketplaceStats as Stats } from '@/lib/marketplace-stats'
import styles from './MarketplaceStats.module.css'

export function MarketplaceStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    const controller = new AbortController()
    async function refresh() {
      try {
        if (document.visibilityState !== 'hidden') {
          const response = await fetch('/api/public/marketplace-stats', { cache: 'no-store', signal: controller.signal })
          if (!response.ok) throw new Error('Unavailable')
          const data: Stats = await response.json()
          if (!stopped) setStats(data)
        }
      } catch { if (!stopped) setStats(null) }
      finally { if (!stopped) timer = setTimeout(refresh, 30000) }
    }
    void refresh()
    return () => { stopped = true; controller.abort(); clearTimeout(timer) }
  }, [])
  if (!stats) return null
  const metrics = [
    { label: 'Live Opportunity Value', value: `TZS ${compactOpportunityValue(stats.totalOpportunityValue)}`, accessible: `Total active opportunity value: Tanzanian shillings ${stats.totalOpportunityValue}`, icon: Coins, description: 'Total recorded commercial value of published, currently available TZS opportunities. Excludes reward budgets and deals with no recorded value.' },
    { label: 'Active Deals', value: stats.activeDeals.toLocaleString(), icon: FileText, description: 'Published marketplace opportunities available now, including those without a recorded commercial value.' },
    { label: 'Active Partners', value: stats.activePartners.toLocaleString(), icon: Users, description: 'Partner profiles whose user accounts are active and have not been deleted.' },
    { label: 'Verified Outcomes', value: stats.verifiedResults.toLocaleString(), icon: CircleCheck, description: 'Approved, payable or paid conversions across current opportunity records; excludes reversed or disputed conversions.' },
  ]
  return <section className={styles.panel} aria-label="Live platform statistics">
    <div className={styles.header}><span><i aria-hidden="true" />Live platform stats</span><span title={`Last checked ${new Date(stats.updatedAt).toLocaleString()}`}><ChartNoAxesColumnIncreasing size={13} aria-hidden="true" />Updates every 30s</span></div>
    <dl className={styles.grid}>{metrics.map(({ label, value, accessible, icon: Icon, description }) => <div className={styles.metric} key={label}>
      <Icon size={24} aria-hidden="true" />
      <dt>{label}<span tabIndex={0} className={styles.info} aria-label={description}><Info size={12} aria-hidden="true" /><span role="tooltip">{description}</span></span></dt>
      <dd aria-label={accessible}>{value}</dd>
    </div>)}</dl>
  </section>
}
