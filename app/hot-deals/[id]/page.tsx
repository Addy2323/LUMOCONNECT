import { HotDealRoom } from '@/components/hot-deals/HotDealRoom'
export default async function HotDealPage({ params }: { params: Promise<{ id: string }> }) {
  return <HotDealRoom id={(await params).id} />
}
