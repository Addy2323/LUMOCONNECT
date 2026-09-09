import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, BadgeCheck, Clock3, Flame, LockKeyhole } from 'lucide-react'
import { HotDealsSection } from '@/components/hot-deals/HotDealsSection'

export const metadata: Metadata = {
  title: 'Private Membership | Lumo',
  description: 'Discover Lumo Private Membership and priority access to selected verified opportunities.',
}

const benefits = [
  {
    icon: Clock3,
    title: 'First access for 24 hours',
    description: 'Explore selected Hot Deals before remaining opportunities open to subscribed Partners.',
  },
  {
    icon: LockKeyhole,
    title: 'Your private Deal Room',
    description: 'Accept participation terms to access approved materials, referral tools and full deal details.',
  },
  {
    icon: BadgeCheck,
    title: 'Track verified outcomes',
    description: 'Follow your registered leads, validated conversions and rewards from your account.',
  },
]

export default function PrivateMemberPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <section className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 sm:p-10">
        <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-orange-700">
          <Flame size={16} aria-hidden="true" /> LUMO PRIVATE MEMBERSHIP
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Be among the first to discover your next opportunity.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
          Private Members receive priority access to selected Lumo Hot Deals,
          with clear participation terms and rewards for verified commercial outcomes.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/hot-deals/account" className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700">
            Check my membership access <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <Link href="#private-opportunities" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
            Explore Hot Deals
          </Link>
        </div>
      </section>

      <section aria-label="Private Membership benefits" className="grid gap-4 md:grid-cols-3">
        {benefits.map(({ icon: Icon, title, description }) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
            <Icon size={24} className="text-orange-600" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </article>
        ))}
      </section>

      <section aria-labelledby="membership-pricing" className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 id="membership-pricing" className="text-xl font-bold text-slate-900">Membership pricing</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Private Membership pricing will be announced here. Purchases are not yet available.
          Existing members can sign in to check their access and subscription status.
        </p>
        <Link href="/signin" className="mt-4 inline-block text-sm font-semibold text-orange-700">Sign in to check my access →</Link>
      </section>

      <div id="private-opportunities" className="scroll-mt-6">
        <HotDealsSection compact />
      </div>
    </main>
  )
}
