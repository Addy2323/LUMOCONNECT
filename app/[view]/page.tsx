import { notFound } from 'next/navigation'
import LumoApp from '../page'

const supportedViews = new Set([
  'catalog', 'subscriptions', 'partner', 'business', 'admin',
  'signin', 'signup', 'choose-path', 'verify', 'dealroom', 'statement', 'checkout',
])

export default async function ViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params
  if (!supportedViews.has(view)) notFound()
  return <LumoApp />
}
