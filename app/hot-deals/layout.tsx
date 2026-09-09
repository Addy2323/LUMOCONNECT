import Link from 'next/link'
import { BrandMark } from '@/components/shared/BrandMark'

export default function HotDealsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50"><header className="border-b border-slate-200 bg-white"><nav aria-label="Hot Deals navigation" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4"><Link href="/" aria-label="Lumo home"><BrandMark /></Link><div className="flex gap-5 text-sm font-semibold"><Link href="/hot-deals">Hot Deals</Link><Link href="/hot-deals/account">My access</Link><Link href="/partner">Dashboard</Link></div></nav></header>{children}</div>
}
