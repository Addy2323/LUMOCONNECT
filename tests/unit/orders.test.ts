import { describe, it, expect, beforeEach } from 'vitest'
import {
  createCustomerOrder,
  merchantDispatchOrder,
  merchantConfirmDelivered,
  completeOrderSettlement,
  getOrderById,
} from '@/modules/orders/service'
import { seedTestOpportunity } from '@/modules/deals/service'

describe('Customer Orders & Multi-Party Fulfilment Lifecycle', () => {
  beforeEach(() => {
    seedTestOpportunity({
      id: 'opp_kijani_solar',
      organizationId: 'org_kijani',
      companyName: 'Kijani Solar Tech',
      companyLogo: 'KS',
      isVerified: true,
      type: 'CUSTOMER_ACQUISITION',
      title: 'Power the Next 1,000 Homes in Rural & Peri-Urban Tanzania',
      slug: 'kijani-solar-home-systems',
      summary: 'Earn TZS 45,000 for every verified household solar power system installation completed through your referral.',
      description: 'Solar lighting and appliances across Tanzania.',
      category: 'Renewable Energy',
      countryCode: 'TZ',
      region: 'Dar es Salaam',
      currency: 'TZS',
      rewardType: 'COST_PER_ACQUISITION',
      rewardDisplay: 'TZS 45,000',
      rewardDetail: 'per verified installation',
      spentBudgetTZS: 0n,
      activePartnerCount: 1,
      isFeatured: true,
      status: 'PUBLISHED',
      createdAt: new Date(),
    })
  })

  it('creates customer order via referral link without subscription and places funds in escrow', () => {
    const order = createCustomerOrder({
      opportunityId: 'opp_kijani_solar',
      partnerTrackingCode: 'LM-TEST-ALEX',
      customerName: 'Amina Salum',
      customerPhone: '+255714000111',
      deliveryAddress: {
        street: 'Kinondoni Block B',
        city: 'Dar es Salaam',
        region: 'Dar es Salaam',
      },
      paymentMethod: 'MPESA',
    })

    expect(order.id).toBeDefined()
    expect(order.orderNumber).toContain('LUMO-ORD-')
    expect(order.status).toBe('PAID')
    expect(order.confirmations.systemVerified).toBe(true)
  })

  it('progresses through merchant dispatch and delivery with 7-day inspection timer', () => {
    const order = createCustomerOrder({
      opportunityId: 'opp_kijani_solar',
      partnerTrackingCode: 'LM-TEST-ALEX',
      customerName: 'Bakari Juma',
      customerPhone: '+255714000222',
      deliveryAddress: {
        street: 'Mikocheni Plot 5',
        city: 'Dar es Salaam',
        region: 'Dar es Salaam',
      },
      paymentMethod: 'TIGO_PESA',
    })

    const dispatched = merchantDispatchOrder({
      orderId: order.id,
      trackingNumber: 'TRK-DSM-991',
      carrierName: 'Kijani Express',
    })
    expect(dispatched.status).toBe('DISPATCHED')

    const delivered = merchantConfirmDelivered({
      orderId: order.id,
      signedDeliveryNoteUrl: 'https://storage.lumo.co.tz/notes/deliv_991.pdf',
    })
    expect(delivered.status).toBe('DELIVERED')
    expect(delivered.confirmations.merchantDelivered).toBe(true)
    expect(delivered.inspectionWindowExpiresAt).toBeDefined()
  })

  it('completes order settlement upon customer acceptance and expires customer access link once money is released to both parties', () => {
    const order = createCustomerOrder({
      opportunityId: 'opp_kijani_solar',
      partnerTrackingCode: 'LM-TEST-ALEX',
      customerName: 'Mariam Said',
      customerPhone: '+255714000333',
      deliveryAddress: {
        street: 'Masaki Ocean Road',
        city: 'Dar es Salaam',
        region: 'Dar es Salaam',
      },
      paymentMethod: 'AIRTEL_MONEY',
    })

    expect(order.customerAccessToken).toBeDefined()
    expect(order.isAccessExpired).toBe(false)

    const completed = completeOrderSettlement({
      orderId: order.id,
      completedBy: 'CUSTOMER',
    })

    expect(completed.status).toBe('COMPLETED')
    expect(completed.confirmations.customerAccepted).toBe(true)

    // Verify money released and tracking link expired for customer privacy & security
    expect(completed.settlementReleasedAt).toBeDefined()
    expect(completed.isAccessExpired).toBe(true)
    expect(completed.accessExpiryReason).toBe('SETTLEMENT_RELEASED_TO_BOTH_PARTIES')
  })
})
