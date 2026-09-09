import Link from 'next/link'
import { ArrowRight, Clock3, LockKeyhole, ShieldCheck } from 'lucide-react'

export function MembershipGettingStarted({ canManageDeals }: { canManageDeals: boolean }) {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:py-12">
      <section className="rounded-3xl border border-orange-100 bg-white p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-700">Your membership access</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Your Private Membership is not active yet</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
          You are signed in, but your account has no active subscription granting access to Hot Deals.
          Signing in alone does not activate Private Membership.
        </p>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-slate-900">Enrollment is not open yet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The Private Member plan and payment flow still need to be set up.
            There is currently no Private Membership purchase available on this page.
          </p>
        </div>
      </section>

      <section aria-label="How member access works" className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ShieldCheck, title: '1. Activate membership', text: 'Choose a Private Member plan once enrollment opens. Access starts after payment is confirmed.' },
          { icon: Clock3, title: '2. Choose an available deal', text: 'Verified, funded opportunities appear when published. Private Members receive the first 24 hours of access.' },
          { icon: LockKeyhole, title: '3. Enter your Deal Room', text: 'Accept the participation agreement to get your referral tools and begin registering leads.' },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <Icon size={22} className="text-orange-600" aria-hidden="true" />
            <h2 className="mt-4 font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </article>
        ))}
      </section>

      {canManageDeals && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Administrator access</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            You can review submitted opportunities from the compliance page.
            Deals need verified ownership and confirmed reward funding before they appear to members.
          </p>
          <Link href="/hot-deals/admin" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white">
            Manage Hot Deals <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}

      <div className="flex flex-wrap gap-5 text-sm font-semibold text-orange-700">
        <Link href="/hot-deals">Browse public deal teasers →</Link>
        <Link href="/hot-deals/private-member">About Private Membership →</Link>
        <Link href="/">Back to Lumo →</Link>
      </div>
    </main>
  )
}
