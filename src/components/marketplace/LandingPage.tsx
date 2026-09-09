'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'
import { ReleaseCountdown, type Teaser, tzs } from '@/components/hot-deals/HotDealsSection'
import styles from './LandingPage.module.css'

const photos = {
  car: '/images/landing/harrier.webp',
  apartments: '/images/landing/apartments.webp',
  agriculture: '/images/landing/agriculture.jpg',
  equipment: '/images/landing/equipment.jpg',
  logistics: '/images/landing/logistics.jpg',
}

const examples = [
  {
    title: 'Toyota Harrier',
    availability: '1 car available',
    priceLabel: 'Sale price',
    price: 'TZS 45,000,000',
    rewardLabel: 'Partner reward',
    reward: 'TZS 900,000',
    image: photos.car,
  },
  {
    title: 'Apartments for rent',
    availability: '7 of 10 units remaining',
    priceLabel: 'Rent (per month)',
    price: 'TZS 1,200,000',
    rewardLabel: 'Reward (per tenant)',
    reward: 'TZS 150,000',
    image: photos.apartments,
  },
]

const categories = [
  {
    label: 'AGRICULTURE',
    title: 'Quality farm supplies',
    description: 'Fertilizers, seeds and more from trusted suppliers.',
    image: photos.agriculture,
    query: 'farm',
  },
  {
    label: 'EQUIPMENT',
    title: 'Construction equipment',
    description: 'Reliable machinery for growing projects.',
    image: photos.equipment,
    query: 'equipment',
  },
  {
    label: 'LOGISTICS',
    title: 'Transport & logistics services',
    description: 'Move goods. Create opportunities.',
    image: photos.logistics,
    query: 'transport',
  },
]

export function LandingPage({
  onExplore,
  onJoin,
  onCategory,
}: {
  onExplore: () => void
  onJoin: () => void
  onCategory: (query: string) => void
}) {
  const [deals, setDeals] = useState<Teaser[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  // Live ticking countdown for fallback sample cards (matching screenshot: 18:42:10)
  const [countdownSeconds, setCountdownSeconds] = useState(67330) // 18h 42m 10s

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 86400))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  useEffect(() => {
    const controller = new AbortController()
    const refresh = async () => {
      try {
        const response = await fetch('/api/hot-deals', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Live availability is temporarily unavailable.')
        const data = await response.json()
        setDeals(data.deals || [])
        setError('')
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Unable to load deals.')
        }
      } finally {
        if (!controller.signal.aborted) setLoaded(true)
      }
    }
    void refresh()
    const timer = setInterval(() => {
      if (!document.hidden) void refresh()
    }, 60000)
    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [])

  return (
    <div className={styles.landing}>
      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          {/* Left Copy */}
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>REAL OPPORTUNITIES. REAL IMPACT.</p>
            <h1>
              Discover opportunities.
              <span>Connect. Earn.</span>
            </h1>
            <p className={styles.heroDescription}>
              Explore Lumo deals and earn rewards from verified results.
            </p>

            <div className={styles.actions}>
              <button onClick={onExplore} className={styles.primary}>
                Explore opportunities <ArrowRight size={18} />
              </button>
              <Link href="/hot-deals/private-member" className={styles.secondary}>
                <LockKeyhole size={16} /> Get private access
              </Link>
            </div>

            {/* 3 Trust Strip Indicators */}
            <div className={styles.trust}>
              <div>
                <ShieldCheck size={22} />
                <div>
                  <strong>Clear reward terms</strong>
                  <small>Know what you’ll earn upfront.</small>
                </div>
              </div>
              <div>
                <BarChart3 size={22} />
                <div>
                  <strong>Tracked referrals</strong>
                  <small>All referrals are tracked securely.</small>
                </div>
              </div>
              <div>
                <CheckCircle2 size={22} />
                <div>
                  <strong>Verified outcomes</strong>
                  <small>Rewards paid after confirmation.</small>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visuals */}
          <div className={styles.heroVisual}>
            {/* Left Card: Harrier */}
            <div className={styles.heroPhotoCard}>
              <Image
                src={photos.car}
                alt="Illustrative Toyota Harrier beside tropical mountains"
                fill
                sizes="(max-width: 768px) 46vw, 280px"
                priority
              />
              <span className={styles.scriptCaption}>
                Drive Opportunities
                <br />
                Create Impact
              </span>
            </div>

            {/* Right Card: Apartments with Paper Note */}
            <div className={styles.heroPhotoCardRight}>
              <div className={styles.heroPhotoCardInner}>
                <Image
                  src={photos.apartments}
                  alt="Illustrative modern apartments with tropical landscaping"
                  fill
                  sizes="(max-width: 768px) 46vw, 280px"
                  priority
                />
              </div>
              <span className={styles.paperNote}>
                Better Homes
                <br />
                Brighter Futures
              </span>
            </div>

            {/* Overlapping floating card */}
            <div className={styles.connectionNote}>
              <div className={styles.connectionIconBox}>
                <BarChart3 size={20} />
              </div>
              <div>
                <strong>
                  Turn connections
                  <br />
                  into rewards.
                </strong>
                <small>People. Projects. Progress.</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className={styles.container}>
        {/* SECTION: PRIVATE HOT DEALS */}
        <section className={styles.privateDeals} aria-labelledby="private-deals-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.earlyBadge}>
                <LockKeyhole size={13} /> 24-HOUR EARLY ACCESS
              </p>
              <h2 id="private-deals-title">Private Hot Deals</h2>
              <p>
                Private Members first. Available deals open to subscribed Partners after 24 hours.
              </p>
            </div>
            <Link href="/hot-deals/private-member" className={styles.linkButton}>
              Why private deals? <ArrowRight size={15} />
            </Link>
          </div>

          <div className={styles.privateGrid}>
            {deals.length > 0
              ? deals.slice(0, 2).map((deal) => (
                  <article className={styles.dealCard} key={deal.id}>
                    <div className={styles.dealImage}>
                      <Image
                        src={
                          /rental|apartment|property/i.test(deal.category)
                            ? photos.apartments
                            : photos.car
                        }
                        alt="Illustrative opportunity photography"
                        fill
                        sizes="(max-width: 768px) 92vw, 560px"
                      />
                      <span className={styles.lockBadgeDark}>
                        <LockKeyhole size={13} />
                        {deal.status === 'PARTNER_RELEASE' ? 'Partner access' : 'Private access'}
                      </span>
                      <span className={styles.countdownBadgeWhite}>
                        <Clock3 size={15} />
                        Partner access in{' '}
                        <ReleaseCountdown releaseAt={deal.releaseAt} status={deal.status} />
                      </span>
                    </div>
                    <div className={styles.cardBody}>
                      <h3>{deal.title}</h3>
                      <p>
                        {deal.inventoryAvailable} of {deal.inventoryTotal} units remaining
                      </p>
                      <div className={styles.priceGrid}>
                        <div>
                          <small>Location</small>
                          <strong>{deal.location}</strong>
                        </div>
                        <div>
                          <small>Partner reward</small>
                          <strong>{tzs(deal.rewardMinor)}</strong>
                        </div>
                      </div>
                      <Link className={styles.primary} href={`/hot-deals/${deal.id}`}>
                        <LockKeyhole size={16} /> Unlock private access
                      </Link>
                    </div>
                  </article>
                ))
              : examples.map((example) => (
                  <article className={styles.dealCard} key={example.title}>
                    <div className={styles.dealImage}>
                      <Image
                        src={example.image}
                        alt={`${example.title} — illustrative example`}
                        fill
                        sizes="(max-width: 768px) 92vw, 560px"
                      />
                      <span className={styles.lockBadgeDark}>
                        <LockKeyhole size={13} />
                        Private access
                      </span>
                      <span className={styles.countdownBadgeWhite}>
                        <Clock3 size={15} />
                        Partner access in <strong>{formatCountdown(countdownSeconds)}</strong>
                      </span>
                    </div>
                    <div className={styles.cardBody}>
                      <h3>{example.title}</h3>
                      <p>{example.availability}</p>
                      <div className={styles.priceGrid}>
                        <div>
                          <small>{example.priceLabel}</small>
                          <strong>{example.price}</strong>
                        </div>
                        <div>
                          <small>{example.rewardLabel}</small>
                          <strong>{example.reward}</strong>
                        </div>
                      </div>
                      <Link className={styles.primary} href="/hot-deals/private-member">
                        <LockKeyhole size={16} /> Unlock private access
                      </Link>
                    </div>
                  </article>
                ))}
          </div>
        </section>

        {/* SECTION: EXPLORE PARTNER OPPORTUNITIES */}
        <section className={styles.partnerSection} aria-labelledby="partner-opportunities-title">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="partner-opportunities-title">Explore partner opportunities</h2>
              <p>
                A range of verified opportunities across key sectors. Open to subscribed Partners.
              </p>
            </div>
            <button onClick={onExplore} className={styles.linkButton}>
              View all opportunities <ArrowRight size={15} />
            </button>
          </div>

          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <article className={styles.categoryCard} key={category.label}>
                <div className={styles.categoryImage}>
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    sizes="(max-width: 768px) 92vw, 360px"
                  />
                  <span className={styles.categoryLabel}>{category.label}</span>
                  <span className={styles.partnerBadge}>
                    <LockKeyhole size={13} />
                    Open to subscribed Partners
                  </span>
                </div>
                <div className={styles.categoryBody}>
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                  <button onClick={() => onCategory(category.query)} className={styles.outlineBtn}>
                    View opportunity <ArrowRight size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION: HOW IT WORKS */}
        <section className={styles.howItWorks} id="how-it-works">
          <h2>How it works</h2>
          <p>A simple way to turn your network into rewards.</p>
          <ol>
            {[
              ['Choose a deal', 'Browse opportunities that match your network.'],
              ['Share your referral', 'Connect the right people and submit a referral.'],
              ['Earn after verification', 'Once the opportunity is confirmed, you receive your reward.'],
            ].map(([title, text], index) => (
              <li key={title}>
                <span className={styles.stepCircle}>{index + 1}</span>
                <div className={styles.stepContent}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                {index < 2 && <ChevronRight size={22} className={styles.chevronIcon} />}
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* BOTTOM CTA BANNER */}
      <section className={styles.bottomCta}>
        <div className={`${styles.container}`}>
          <div>
            <h2>Your next opportunity starts here.</h2>
            <p>Join a growing community of partners creating real value across Tanzania.</p>
          </div>
          <div className={styles.bottomCtaAction}>
            <button onClick={onJoin} className={styles.primary}>
              Become a Partner <ArrowRight size={17} />
            </button>
            <small>More opportunities. A brighter tomorrow.</small>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
