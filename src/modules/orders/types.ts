import { z } from 'zod'

export const OrderStatusSchema = z.enum([
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'DISPATCHED',
  'DELIVERED',
  'CUSTOMER_ACCEPTED',
  'COMPLETED',
  'DISPUTED',
  'CANCELLED',
  'REFUNDED',
])

export type OrderStatus = z.infer<typeof OrderStatusSchema>

export interface OrderItem {
  id: string
  orderNumber: string
  opportunityId: string
  opportunityTitle: string
  organizationId: string
  merchantName: string
  partnerId?: string
  partnerTrackingCode?: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  deliveryAddress: {
    street: string
    city: string
    region: string
    notes?: string
  }
  currency: string
  totalAmountMinor: bigint
  partnerRewardMinor: bigint
  paymentMethod: 'MPESA' | 'AIRTEL_MONEY' | 'TIGO_PESA' | 'HALOPESA' | 'CARD'
  paymentProviderRef: string
  status: OrderStatus
  fulfilmentEvidence?: {
    invoiceUrl?: string
    trackingNumber?: string
    signedDeliveryNoteUrl?: string
    ownershipDocUrl?: string
    carrierName?: string
    dispatchedAt?: Date
    deliveredAt?: Date
  }
  confirmations: {
    merchantDelivered: boolean
    merchantDeliveredAt?: Date
    customerAccepted: boolean
    customerAcceptedAt?: Date
    partnerClaimed: boolean
    partnerClaimedAt?: Date
    systemVerified: boolean
    systemVerifiedAt?: Date
  }
  customerAccessToken: string
  isAccessExpired: boolean
  accessExpiredAt?: Date
  settlementReleasedAt?: Date
  accessExpiryReason?: string
  inspectionWindowExpiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateOrderInput {
  opportunityId: string
  partnerTrackingCode?: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  deliveryAddress: {
    street: string
    city: string
    region: string
    notes?: string
  }
  paymentMethod: 'MPESA' | 'AIRTEL_MONEY' | 'TIGO_PESA' | 'HALOPESA' | 'CARD'
}

