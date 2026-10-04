import type { Metadata } from 'next'
import { PrivateVipMarketplaceView } from '@/components/marketplace/PrivateVipMarketplaceView'

export const metadata: Metadata = {
  title: 'Golden VIP Marketplace | Lumo',
  description: 'Exclusive 24-hour priority access window for high-reward verified Lumo opportunities.',
}

export default function VipPage() {
  return <PrivateVipMarketplaceView />
}
