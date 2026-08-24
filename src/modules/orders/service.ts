/**
 * LUMO Orders & Multi-Party Completion Service
 *
 * Implements full e-commerce and B2B order lifecycle:
 * - Frictionless customer checkout without requiring a partner subscription
 * - Merchant fulfilment evidence upload
 * - 4-Party confirmation checkpoints (Merchant -> Customer/Timer -> Partner -> System)
 * - Automatic inspection window release (3/7 days)
 * - Double-entry ledger integration
 */

import { nanoid } from 'nanoid'
import type { OrderItem, CreateOrderInput, OrderStatus } from './types'
import { getOpportunityById } from '@/modules/deals/service'
import { recordConversionCommission } from '@/modules/commissions/service'
import { postJournalEntry, CHART_OF_ACCOUNTS } from '@/lib/ledger'
import { emitOutboxEvent } from '@/lib/outbox'

const ordersStore: OrderItem[] = []

export function getOrderById(id: string): OrderItem | undefined {
  return ordersStore.find((o) => o.id === id || o.orderNumber === id)
}

export function getOrderByAccessToken(token: string): {
  order?: OrderItem
  isExpired: boolean
  expiryReason?: string
} {
  const order = ordersStore.find((o) => o.customerAccessToken === token)
  if (!order) return { isExpired: false }

  return {
    order,
    isExpired: order.isAccessExpired,
    expiryReason: order.accessExpiryReason,
  }
}

export function listOrdersForCustomer(phoneOrEmail: string): OrderItem[] {
  return ordersStore.filter(
    (o) => o.customerPhone === phoneOrEmail || o.customerEmail === phoneOrEmail
  )
}

export function listOrdersForMerchant(organizationId: string): OrderItem[] {
  return ordersStore.filter((o) => o.organizationId === organizationId)
}

export function listOrdersForPartner(partnerId: string): OrderItem[] {
  return ordersStore.filter((o) => o.partnerId === partnerId)
}

/**
 * Creates a customer order via referral link without requiring customer subscription.
 */
export function createCustomerOrder(input: CreateOrderInput): OrderItem {
  const opp = getOpportunityById(input.opportunityId)
  if (!opp) throw new Error('OPPORTUNITY_NOT_FOUND')

  const orderId = `ord_${nanoid(16)}`
  const orderNumber = `LUMO-ORD-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`
  const now = new Date()

  // Derive price (default TZS 150,000 if not specified on opportunity)
  const totalAmountMinor = 15000000n // TZS 150,000.00
  const partnerRewardMinor = opp.rewardType === 'PERCENTAGE_COMMISSION'
    ? (totalAmountMinor * 1000n) / 10000n // 10%
    : 2500000n // TZS 25,000

  const providerRef = `MOMO-TZ-${nanoid(8).toUpperCase()}`
  const customerAccessToken = `tok_${nanoid(24)}`

  const order: OrderItem = {
    id: orderId,
    orderNumber,
    opportunityId: opp.id,
    opportunityTitle: opp.title,
    organizationId: opp.organizationId,
    merchantName: opp.companyName,
    partnerId: input.partnerTrackingCode ? 'partner_alex' : undefined,
    partnerTrackingCode: input.partnerTrackingCode,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    deliveryAddress: input.deliveryAddress,
    currency: 'TZS',
    totalAmountMinor,
    partnerRewardMinor,
    paymentMethod: input.paymentMethod,
    paymentProviderRef: providerRef,
    status: 'PAID', // Instant authorized payment in demo flow
    confirmations: {
      merchantDelivered: false,
      customerAccepted: false,
      partnerClaimed: false,
      systemVerified: true,
      systemVerifiedAt: now,
    },
    customerAccessToken,
    isAccessExpired: false,
    createdAt: now,
    updatedAt: now,
  }

  // 1. Post Customer Purchase Funds into Ledger Escrow
  // Debit: Cash Mobile Money | Credit: Customer Purchase Escrow Funds
  postJournalEntry({
    sourceType: 'PAYMENT',
    sourceId: orderId,
    currency: 'TZS',
    narration: `Customer payment received for Order ${orderNumber}`,
    lines: [
      {
        ledgerAccountId: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
        accountCode: CHART_OF_ACCOUNTS.CASH_MOBILE_MONEY,
        debitMinor: totalAmountMinor,
        creditMinor: 0n,
        memo: `Customer checkout via ${input.paymentMethod}`,
      },
      {
        ledgerAccountId: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
        accountCode: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
        debitMinor: 0n,
        creditMinor: totalAmountMinor,
        memo: 'Customer purchase funds held in settlement escrow',
      },
    ],
  })

  // 2. Emit outbox event
  emitOutboxEvent('CONVERSION_RECORDED', 'ORDER', orderId, {
    orderNumber,
    customerName: input.customerName,
    amountMinor: totalAmountMinor.toString(),
    partnerTrackingCode: input.partnerTrackingCode,
  })

  ordersStore.unshift(order)
  return order
}

/**
 * Merchant marks order as dispatched and provides tracking evidence.
 */
export function merchantDispatchOrder({
  orderId,
  trackingNumber,
  carrierName,
  invoiceUrl,
}: {
  orderId: string
  trackingNumber: string
  carrierName?: string
  invoiceUrl?: string
}): OrderItem {
  const order = getOrderById(orderId)
  if (!order) throw new Error('ORDER_NOT_FOUND')

  order.status = 'DISPATCHED'
  order.fulfilmentEvidence = {
    ...order.fulfilmentEvidence,
    trackingNumber,
    carrierName: carrierName || 'Merchant Direct Courier',
    invoiceUrl,
    dispatchedAt: new Date(),
  }
  order.updatedAt = new Date()

  emitOutboxEvent('NOTIFICATION_DISPATCH', 'ORDER', orderId, {
    orderNumber: order.orderNumber,
    status: 'DISPATCHED',
    trackingNumber,
  })

  return order
}

/**
 * Merchant marks order as delivered and uploads signed delivery proof.
 * Starts the 7-day inspection auto-release timer.
 */
export function merchantConfirmDelivered({
  orderId,
  signedDeliveryNoteUrl,
  ownershipDocUrl,
}: {
  orderId: string
  signedDeliveryNoteUrl: string
  ownershipDocUrl?: string
}): OrderItem {
  const order = getOrderById(orderId)
  if (!order) throw new Error('ORDER_NOT_FOUND')

  const now = new Date()
  order.status = 'DELIVERED'
  order.fulfilmentEvidence = {
    ...order.fulfilmentEvidence,
    signedDeliveryNoteUrl,
    ownershipDocUrl,
    deliveredAt: now,
  }
  order.confirmations.merchantDelivered = true
  order.confirmations.merchantDeliveredAt = now

  // Set 7-day inspection auto-release window
  order.inspectionWindowExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  order.updatedAt = now

  emitOutboxEvent('NOTIFICATION_DISPATCH', 'ORDER', orderId, {
    orderNumber: order.orderNumber,
    status: 'DELIVERED',
    inspectionExpiry: order.inspectionWindowExpiresAt.toISOString(),
  })

  return order
}

/**
 * Customer confirms receipt and accepts product, or auto-release timer expires.
 * Triggers settlement and partner commission credit.
 */
export function completeOrderSettlement({
  orderId,
  completedBy = 'CUSTOMER',
}: {
  orderId: string
  completedBy?: 'CUSTOMER' | 'AUTO_RELEASE_TIMER' | 'ADMIN'
}): OrderItem {
  const order = getOrderById(orderId)
  if (!order) throw new Error('ORDER_NOT_FOUND')

  if (order.status === 'COMPLETED') return order

  const now = new Date()
  order.status = 'COMPLETED'
  order.confirmations.customerAccepted = true
  order.confirmations.customerAcceptedAt = now
  order.updatedAt = now

  // Record partner commission if referral was present
  if (order.partnerId && order.partnerRewardMinor > 0n) {
    recordConversionCommission({
      organizationId: order.organizationId,
      dealId: order.opportunityId,
      partnerId: order.partnerId,
      partnerName: 'Alex Mushi',
      dealTitle: order.opportunityTitle,
      conversionId: order.id,
      externalRef: order.orderNumber,
      transactionAmountMinor: order.totalAmountMinor,
      fixedRewardMinor: order.partnerRewardMinor,
    })
  }

  // Release Customer Purchase Escrow to Merchant Payable
  // Debit: Escrow Pool | Credit: Payable to Merchant
  postJournalEntry({
    sourceType: 'CONVERSION',
    sourceId: order.id,
    currency: 'TZS',
    narration: `Order ${order.orderNumber} completion settlement confirmed via ${completedBy}`,
    lines: [
      {
        ledgerAccountId: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
        accountCode: CHART_OF_ACCOUNTS.BUSINESS_PREFUNDED_ESCROW,
        debitMinor: order.totalAmountMinor,
        creditMinor: 0n,
        memo: 'Release customer escrow funds upon delivery acceptance',
      },
      {
        ledgerAccountId: CHART_OF_ACCOUNTS.ACCOUNTS_RECEIVABLE,
        accountCode: CHART_OF_ACCOUNTS.ACCOUNTS_RECEIVABLE,
        debitMinor: 0n,
        creditMinor: order.totalAmountMinor,
        memo: 'Merchant net order proceeds payable',
      },
    ],
  })

  // Customer Tracking Link Expiry Policy:
  // Once money is released to both parties (Merchant payable released + Partner reward credited),
  // the interactive customer view session expires for privacy and security.
  order.settlementReleasedAt = now
  order.isAccessExpired = true
  order.accessExpiredAt = now
  order.accessExpiryReason = 'SETTLEMENT_RELEASED_TO_BOTH_PARTIES'

  emitOutboxEvent('NOTIFICATION_DISPATCH', 'ORDER', orderId, {
    orderNumber: order.orderNumber,
    status: 'COMPLETED',
    completedBy,
    isAccessExpired: true,
  })

  return order
}
