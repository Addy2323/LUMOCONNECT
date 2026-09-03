'use client'

import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Compass,
  ExternalLink,
  Filter,
  Grid2X2,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react'

const opportunities = [
  { id: 1, company: 'Kijani Solar', mark: 'KS', title: 'Power the next 1,000 homes', type: 'Customer acquisition', reward: 'TZS 45,000', detail: 'per verified installation', progress: 'High demand', color: 'orange' },
  { id: 2, company: 'MobiPay', mark: 'MP', title: 'Refer active business owners', type: 'Qualified leads', reward: 'TZS 18,000', detail: 'per activated account', progress: 'Popular', color: 'blue' },
  { id: 3, company: 'SafariBox', mark: 'SB', title: 'Create a travel story', type: 'Content & influence', reward: 'TZS 280,000', detail: 'fixed campaign fee', progress: 'New today', color: 'green' },
]

const activity = [
  { icon: Check, tone: 'success', title: 'Commission approved', description: 'MobiPay referral #MP-2048', time: 'Today, 09:42', amount: '+ TZS 18,000' },
  { icon: Clock3, tone: 'warning', title: 'Conversion under review', description: 'Kijani Solar installation #KS-881', time: 'Yesterday, 16:18', amount: 'TZS 45,000' },
  { icon: ArrowUpRight, tone: 'neutral', title: 'Application submitted', description: 'SafariBox creator campaign', time: 'Yesterday, 11:05', amount: 'Pending' },
]

function BrandMark() {
  return <div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div>
}

function Sidebar({ active, setActive }: { active: string; setActive: (value: string) => void }) {
  const items = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Discover deals', icon: Compass, badge: '12' },
    { label: 'My applications', icon: BriefcaseBusiness },
    { label: 'Earnings', icon: CircleDollarSign },
  ]
  return <aside className="sidebar">
    <div className="brand"><BrandMark /><span>LUMO</span></div>
    <div className="workspace-switcher"><div className="avatar small">AM</div><div><strong>Alex Mushi</strong><span>Partner account</span></div><ChevronDown size={15} /></div>
    <p className="nav-label">Workspace</p>
    <nav aria-label="Primary navigation">
      {items.map(({ label, icon: Icon, badge }) => <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => setActive(label)}><Icon size={18} /><span>{label}</span>{badge && <em>{badge}</em>}</button>)}
    </nav>
    <p className="nav-label secondary-label">Manage</p>
    <nav>
      {[{ label: 'Performance', icon: LineChart }, { label: 'Resources', icon: Grid2X2 }].map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => setActive(label)}><Icon size={18} /><span>{label}</span></button>)}
    </nav>
    <div className="sidebar-bottom"><button className="nav-item"><HelpCircle size={18} /><span>Help center</span></button><button className="nav-item"><Settings size={18} /><span>Settings</span></button><div className="sidebar-status"><ShieldCheck size={17} /><div><strong>Verified partner</strong><span>Account is in good standing</span></div></div></div>
  </aside>
}

function OpportunityCard({ item, saved, onSave }: { item: typeof opportunities[number]; saved: boolean; onSave: () => void }) {
  return <article className="opportunity-card">
    <div className="opportunity-top"><div className={`company-mark ${item.color}`}>{item.mark}</div><button className={`save-button ${saved ? 'saved' : ''}`} aria-label={`${saved ? 'Unsave' : 'Save'} ${item.company}`} onClick={onSave}>{saved ? <Check size={17} /> : <span>＋</span>}</button></div>
    <div className="opportunity-company">{item.company}<span className={`pulse ${item.color}`} /></div>
    <h3>{item.title}</h3><p className="opportunity-type">{item.type}</p>
    <div className="opportunity-footer"><div><strong>{item.reward}</strong><span>{item.detail}</span></div><span className={`demand ${item.color}`}>{item.progress}</span></div>
    <button className="view-link">View opportunity <ArrowUpRight size={15} /></button>
  </article>
}

function PerformanceChart() {
  return <div className="chart-wrap"><div className="chart-y"><span>TZS 1.0m</span><span>TZS 750k</span><span>TZS 500k</span><span>TZS 250k</span><span>TZS 0</span></div><div className="chart"><div className="gridline one" /><div className="gridline two" /><div className="gridline three" /><div className="gridline four" /><svg viewBox="0 0 680 240" role="img" aria-label="Earnings increased steadily over the last six months"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--orange)" stopOpacity=".24" /><stop offset="1" stopColor="var(--orange)" stopOpacity="0" /></linearGradient></defs><path d="M0 205 C45 190 70 198 105 172 S155 151 190 160 S240 128 275 139 S320 104 355 121 S405 94 440 101 S490 65 525 81 S580 46 625 53 S655 28 680 38 V240 H0Z" fill="url(#area)" /><path d="M0 205 C45 190 70 198 105 172 S155 151 190 160 S240 128 275 139 S320 104 355 121 S405 94 440 101 S490 65 525 81 S580 46 625 53 S655 28 680 38" fill="none" stroke="var(--orange)" strokeWidth="3" strokeLinecap="round" /></svg><div className="chart-x"><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div></div></div>
}

export default function LumoDashboard() {
  const [active, setActive] = useState('Overview')
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState<number[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const filtered = useMemo(() => opportunities.filter((item) => `${item.company} ${item.title} ${item.type}`.toLowerCase().includes(query.toLowerCase())), [query])
  return <div className="lumo-app">
    <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button>
    <div className={mobileOpen ? 'mobile-overlay open' : 'mobile-overlay'} onClick={() => setMobileOpen(false)} />
    <div className={mobileOpen ? 'sidebar mobile-visible' : ''}><Sidebar active={active} setActive={(value) => { setActive(value); setMobileOpen(false) }} /></div>
    <main className="main-content">
      <header className="topbar"><div><p className="eyebrow">Monday, 24 August 2026</p><h1>Good morning, Alex <Sparkles size={20} aria-hidden="true" /></h1></div><div className="top-actions"><label className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search opportunities" aria-label="Search opportunities" /></label><button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button><div className="avatar">AM</div></div></header>
      <section className="hero"><div><p className="eyebrow orange-text">YOUR PARTNER OVERVIEW</p><h2>Make every connection<br /><span>count.</span></h2><p className="hero-copy">Find the right opportunities, build momentum, and get rewarded for the value you create.</p><button className="primary-button" onClick={() => setActive('Discover deals')}>Explore opportunities <ArrowUpRight size={16} /></button></div><div className="hero-orbit" aria-hidden="true"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><Sparkles size={27} /></div><div className="orbit-tag tag-one">+ TZS 45k</div><div className="orbit-tag tag-two">Verified</div></div></section>
      <section className="section-heading"><div><p className="eyebrow">YOUR MOMENTUM</p><h2>Performance at a glance</h2></div><button className="text-button" onClick={() => setActive('Performance')}>View analytics <ArrowUpRight size={15} /></button></section>
      <section className="metrics"><div className="metric-card featured"><div className="metric-icon"><CircleDollarSign size={19} /></div><p>Total earned</p><strong>TZS 1,284,500</strong><span className="trend">↑ 18.4% <small>vs last month</small></span><div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /><i /></div></div><div className="metric-card"><div className="metric-icon pale"><Target size={19} /></div><p>Active deals</p><strong>08</strong><span className="metric-note">Across 5 categories</span></div><div className="metric-card"><div className="metric-icon pale"><Users size={19} /></div><p>Successful referrals</p><strong>34</strong><span className="metric-note">↑ 6 this month</span></div><div className="metric-card"><div className="metric-icon pale"><Zap size={19} /></div><p>Success rate</p><strong>72.4%</strong><span className="metric-note">Top 12% of partners</span></div></section>
      <section className="analytics-grid"><div className="panel earnings-panel"><div className="panel-heading"><div><p className="eyebrow">EARNINGS OVERVIEW</p><h2>TZS 1,284,500</h2></div><button className="period-button">Last 6 months <ChevronDown size={15} /></button></div><PerformanceChart /></div><div className="panel milestone-panel"><div className="panel-heading"><div><p className="eyebrow">NEXT MILESTONE</p><h2>Growth partner</h2></div><MoreHorizontal size={20} /></div><div className="milestone-visual"><div className="progress-ring"><span>68<small>%</small></span></div><div><strong>TZS 715,500</strong><span>of TZS 1,050,000 earned</span></div></div><div className="milestone-line"><span style={{ width: '68%' }} /></div><p className="milestone-copy">Earn <strong>TZS 334,500</strong> more to unlock a 5% bonus on your next 3 conversions.</p><button className="outline-button" onClick={() => setActive('Discover deals')}>See high-value deals <ArrowUpRight size={15} /></button></div></section>
      <section className="section-heading deals-heading"><div><p className="eyebrow">CURATED FOR YOU</p><h2>Recommended opportunities</h2></div><div className="heading-actions"><button className="filter-button"><SlidersHorizontal size={16} /> Filters</button><button className="text-button" onClick={() => setActive('Discover deals')}>See all <ArrowUpRight size={15} /></button></div></section>
      <div className="opportunity-grid">{filtered.map((item) => <OpportunityCard key={item.id} item={item} saved={saved.includes(item.id)} onSave={() => setSaved((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />)}{filtered.length === 0 && <div className="empty-state">No opportunities match “{query}”. Try another search.</div>}</div>
      <section className="activity-section"><div className="section-heading"><div><p className="eyebrow">KEEP TRACK</p><h2>Recent activity</h2></div><button className="text-button">View all <ArrowUpRight size={15} /></button></div><div className="activity-list">{activity.map(({ icon: Icon, tone, title, description, time, amount }) => <div className="activity-row" key={title}><div className={`activity-icon ${tone}`}><Icon size={16} /></div><div className="activity-info"><strong>{title}</strong><span>{description}</span></div><span className="activity-time">{time}</span><strong className={`activity-amount ${tone}`}>{amount}</strong></div>)}</div></section>
    </main>
  </div>
}
